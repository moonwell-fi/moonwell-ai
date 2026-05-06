---
name: moonwell
description: >-
  Interact with the Moonwell lending protocol on Base and Optimism.
  Use when user says "supply on Moonwell", "borrow on Moonwell",
  "check Moonwell rates", "Moonwell positions", "Moonwell APY",
  "deposit to Moonwell", "repay Moonwell loan", "Moonwell health",
  "Moonwell rewards", "Moonwell yield", or mentions Moonwell
  lending, borrowing, supplying, or yield opportunities.
---

# Moonwell

Two ways to use this skill — both speak the same JSON envelope `{ success, data, meta, error? }` and the same `PrepareResult` shape, so prompts can switch modes without rewrites.

| Mode | Best for | Install |
|---|---|---|
| **A — HTTP API** at `https://api.moonwell.fi/v1/` | Agent harnesses that can't install npm packages | None — just `curl`/`fetch` |
| **B — CLI** (`@moonwell-fi/cli`) | Full control, multi-step orchestration, local signing | Launching soon — `npm install -g @moonwell-fi/cli` |

**Supported chains:** Base (8453), Optimism (10).

**Chain parameter:** `base` (default) | `optimism` | `8453` | `10` | `op`.

---

## Mode A — HTTP API

Stateless. GET for reads. **POST or GET** for unsigned calldata — both shapes return identical envelopes; pick whichever your harness can speak. You sign and broadcast yourself.

### Reads

```bash
# All markets
curl 'https://api.moonwell.fi/v1/markets?chain=base'

# One market (symbol or address)
curl 'https://api.moonwell.fi/v1/markets/USDC?chain=base'

# Rates only
curl 'https://api.moonwell.fi/v1/rates?chain=base&asset=USDC'

# Yield opportunities
curl 'https://api.moonwell.fi/v1/yield?chain=base&sort=apy&min-tvl=1000000&limit=5'

# User-scoped (per-address, never cached)
curl 'https://api.moonwell.fi/v1/positions/0xYourAddr?chain=base'
curl 'https://api.moonwell.fi/v1/health/0xYourAddr?chain=base'
curl 'https://api.moonwell.fi/v1/rewards/0xYourAddr?chain=base'
curl 'https://api.moonwell.fi/v1/token-balance/0xYourAddr?chain=base&asset=USDC'
```

`positions` returns `data` as an array of per-market entries — `{ market, marketAddress, suppliedUsd, borrowedUsd, collateralUsd, collateralEnabled }` — not a summary object. Aggregate across the array for totals. **Base has two `mUSDC` entries** (the current market plus the deprecated bridged-USDC market) sharing the same `market` label; disambiguate by `marketAddress` when it matters.

### Prepare unsigned calldata

POST with a JSON body:

```bash
curl -X POST 'https://api.moonwell.fi/v1/prepare/supply' \
  -H 'content-type: application/json' \
  -d '{"chain":"base","asset":"USDC","amountDecimal":"100","from":"0xYourAddr"}'
```

Or GET with query params:

```bash
curl 'https://api.moonwell.fi/v1/prepare/supply?chain=base&asset=USDC&amountDecimal=100&from=0xYourAddr'
```

Both accept the same fields and return identical envelopes — pick whichever your harness can speak. `simulate` is sent as the literal string `true` or `false` in the GET form.

Verbs: `supply`, `withdraw`, `borrow`, `repay`. Body / query fields:

| Field | Type | Notes |
|---|---|---|
| `chain` | string | `base` / `optimism` / chain ID |
| `asset` | string | Underlying symbol, e.g. `USDC`, `WETH` |
| `amount` | string | Base units (e.g. `"1000000"` for 1 USDC). Use this **or** `amountDecimal`. |
| `amountDecimal` | string | Human-readable decimal (e.g. `"1.0"`). Use this **or** `amount`. |
| `from` | string | 0x-prefixed sender address |
| `poolAddress` | string? | Override mToken (auto-resolved when omitted) |
| `simulate` | boolean? | Defaults `true`; first-step gas estimate via `eth_estimateGas` |

The response's `data.transactions[]` is an ordered array of unsigned txs:

```json
{
  "step": "approve",
  "description": "Approve token for Moonwell supply",
  "to": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "data": "0x095ea7b3...",
  "value": "0",
  "chainId": 8453
}
```

`step` values: `approve`, `enter-market`, `moonwell-supply`, `moonwell-withdraw`, `moonwell-borrow`, `moonwell-repay`.

Sign and broadcast each in order. After step 1 confirms, the next step's gas may need a manual cap (public RPCs can serve stale state — see `simulation.skippedSteps`). **Note:** `simulation.success: true` only means gas estimation did not revert — Compound v2 functions return non-zero error codes for business-logic failures without reverting (see [Compound v2 error codes](#compound-v2-error-codes) below), so always check on-chain receipts after broadcast.

### Caching

Market reads (`/markets`, `/rates`, `/yield`) are edge-cached for 30s. User-scoped reads (`/positions`, `/health`, `/rewards`, `/token-balance`) are never cached. Both `POST` and `GET /prepare/*` send `Cache-Control: private, no-store` and never cache.

---

## Mode B — CLI

> **Status:** Launching soon. `@moonwell-fi/cli` is not yet published to npm — use Mode A (HTTP API) until it ships.

Install:

```bash
npm install -g @moonwell-fi/cli
# or one-shot:
npx @moonwell-fi/cli markets --chain base
```

### Quick reference

| Intent | Command |
|---|---|
| List markets | `moonwell markets --chain base` |
| Rates for USDC | `moonwell rates --asset USDC` |
| Account positions | `moonwell positions --address 0x...` |
| Best yield | `moonwell yield --sort apy --limit 5` |
| Health factor | `moonwell health --address 0x...` |
| Pending rewards | `moonwell rewards --address 0x...` |
| Token balance | `moonwell token-balance --address 0x... --asset USDC` |
| Prepare supply | `moonwell supply --asset USDC --amount-decimal 100 --from 0x... --json` |
| Prepare withdraw | `moonwell withdraw --asset USDC --amount-decimal 50 --from 0x... --json` |
| Prepare borrow | `moonwell borrow --asset USDC --amount-decimal 25 --from 0x... --json` |
| Prepare repay | `moonwell repay --asset USDC --amount-decimal 25 --from 0x... --json` |
| Sign + broadcast | `moonwell submit --action-file /tmp/supply.json` |
| Pipe pipeline | `moonwell supply ... --json \| moonwell submit --action-file -` |

### Global options

```
--chain <chain>    base (default) | optimism | 8453 | 10
--rpc-url <url>    Override RPC endpoint
--json             Force JSON output (auto-detected for piped output)
```

### Submit (sign + broadcast)

The `submit` command resolves keys in this order:

1. `--private-key <hex>` flag — **scripted use only**
2. `MOONWELL_PRIVATE_KEY` env var
3. `MOONWELL_PRIVATE_KEY_FILE` env var (path)
4. `~/.moonwell-cli/key.hex` (must be `chmod 600`)

```bash
# From file
moonwell supply --asset USDC --amount-decimal 10 --from 0x... --json > /tmp/supply.json
moonwell submit --action-file /tmp/supply.json

# Piped
moonwell supply --asset USDC --amount-decimal 10 --from 0x... --json | moonwell submit --action-file -
```

Submit refuses to sign if the resolved signer ≠ `from` used during prepare, or if `--chain` differs from the prepared chain. Tx targets are whitelisted to Comptroller, listed mTokens, and mToken underlyings.

### Full CLI workflow

```bash
moonwell rates --asset USDC --chain base
moonwell token-balance --address 0xYour --asset USDC
moonwell supply --asset USDC --amount-decimal 50 --from 0xYour --json > /tmp/supply.json
cat /tmp/supply.json | jq '.data.transactions[].step'
moonwell submit --action-file /tmp/supply.json
moonwell positions --address 0xYour
moonwell health --address 0xYour
```

---

## Mode comparison

| Capability | API | CLI |
|---|---|---|
| Read markets / positions / health / rewards | ✓ | ✓ |
| Generate calldata (`supply`/`withdraw`/`borrow`/`repay`) | ✓ | ✓ |
| Sign + broadcast | ✗ (you sign) | ✓ (`moonwell submit`) |
| Custom RPC | ✗ | ✓ (`--rpc-url`) |
| Multi-step nonce orchestration | ✗ (you orchestrate) | ✓ (`submit` handles nonces + gas fallbacks) |
| Same JSON envelope | ✓ | ✓ (`--json`) |

---

## Protocol guide (builder reference)

Moonwell is a **Compound v2 fork**. Key concepts:

- **mTokens**: ERC-20 receipt tokens representing deposited assets (mUSDC, mWETH, …)
- **Comptroller**: governance contract managing collateral factors, market listing, liquidation
- **Exchange Rate**: mToken ↔ underlying conversion, accrues over time
- **Collateral Factor**: max borrow power per supplied dollar (0.88 = 88% LTV)

### Supply flow

1. Approve underlying token to mToken contract
2. `Comptroller.enterMarkets([mToken])` to enable as collateral
3. `mToken.mint(amount)` — receive mTokens

The API/CLI auto-includes steps 1 and 2 only when needed (allowance < amount, not yet entered). Idempotent.

### Borrow flow

1. Must have supplied collateral and entered the market
2. `mToken.borrow(amount)` — receive underlying tokens
3. Account liquidity must remain positive after borrow

### WETH special-case

Moonwell mWETH **auto-unwraps to native ETH on borrow/withdraw** (you receive ETH). Supply/repay still requires the **ERC-20 WETH path** — wrap ETH→WETH first if needed. Both modes emit a warning for WETH operations.

### Compound v2 error codes

`mint`, `borrow`, `redeemUnderlying`, `repayBorrow`, `enterMarkets` return `0` for success and a non-zero code for business-logic failures **without reverting**. After broadcasting, check the return code (or watch logs for `Failure(error, info, detail)`).

### Health factor interpretation

- `> 1.5` — healthy
- `1.1 – 1.5` — caution
- `< 1.1` — liquidation risk
- `null` — no borrows

### Public RPC limitations

Public RPCs serve stale state. Multi-step prepares simulate only step 1 (later steps depend on prior on-chain state). The API uses paid RPCs server-side; the CLI defaults to public unless `--rpc-url` is set.

---

## References

- API source / Workers code: <https://github.com/moonwell-fi/moonwell-ai/tree/main/packages/api>
- CLI source: <https://github.com/moonwell-fi/moonwell-ai/tree/main/packages/cli>
- Moonwell SDK: <https://sdk.moonwell.fi> (TypeScript SDK underneath both modes)
- SDK LLM reference: <https://sdk.moonwell.fi/llms-full.txt>
- Safety patterns: <https://raw.githubusercontent.com/moonwell-fi/moonwell-ai/main/packages/skill/references/safety-patterns.md>
- Contract addresses: <https://raw.githubusercontent.com/moonwell-fi/moonwell-ai/main/packages/skill/references/contract-reference.md>

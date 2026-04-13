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

# Moonwell CLI

Agent-first CLI for the Moonwell lending protocol. Queries live on-chain data via the Moonwell SDK and prepares unsigned transactions for lending operations.

**Supported chains:** Base (8453), Optimism (10)
**No API keys required** — all data is fetched via public RPC.

## Quick Reference

| Intent | Command |
|---|---|
| List all markets | `moonwell markets --chain base` |
| Check rates for USDC | `moonwell rates --asset USDC` |
| View account positions | `moonwell positions --address 0x...` |
| Find best yield | `moonwell yield --sort apy --limit 5` |
| Check account health | `moonwell health --address 0x...` |
| View pending rewards | `moonwell rewards --address 0x...` |
| Check token balance | `moonwell token-balance --address 0x... --asset USDC` |
| Prepare a supply tx | `moonwell supply --asset USDC --amount-decimal 100 --from 0x...` |
| Prepare a withdraw tx | `moonwell withdraw --asset USDC --amount-decimal 50 --from 0x...` |
| Prepare a borrow tx | `moonwell borrow --asset USDC --amount-decimal 25 --from 0x...` |
| Prepare a repay tx | `moonwell repay --asset USDC --amount-decimal 25 --from 0x...` |
| Submit prepared tx | `moonwell submit --action-file /tmp/supply.json` |
| Full supply pipeline | `moonwell supply ... --json \| moonwell submit --action-file -` |

## Global Options

```
--chain <chain>    base (default) | optimism | 8453 | 10
--rpc-url <url>    Override RPC endpoint
--json             Force JSON output (auto-detected for piped output)
```

## Running the CLI

```bash
cd moonwell-cli && npx tsx src/index.ts <command> [options]
```

## Read Commands

### markets

List all lending markets with supply/borrow APY, TVL, and utilization.

```bash
moonwell markets --chain base --sort tvl --limit 10
moonwell markets --asset USDC --json
```

Returns per market: `asset`, `mToken`, `baseSupplyApy`, `baseBorrowApy`, `totalSupplyUsd`, `totalBorrowsUsd`, `utilization`, `collateralFactor`.

### rates

Current supply and borrow rates with utilization.

```bash
moonwell rates --chain base --asset WETH
```

### positions

View account supply, borrow, and collateral positions.

```bash
moonwell positions --address 0xYourAddress --chain base
moonwell positions --address 0xYourAddress --asset USDC --json
```

Returns per position: `market`, `suppliedUsd`, `borrowedUsd`, `collateralUsd`, `collateralEnabled`.

### yield

Yield opportunities sorted by supply APY.

```bash
moonwell yield --sort apy --min-tvl 1000000 --limit 5
```

### health

Account health factor and liquidity overview.

```bash
moonwell health --address 0xYourAddress --chain base
```

Returns: `totalSupplyUsd`, `totalBorrowUsd`, `totalCollateralUsd`, `healthFactor`.

Health factor interpretation:
- `> 1.5` — healthy
- `1.1 - 1.5` — caution
- `< 1.1` — liquidation risk

### rewards

Pending WELL token rewards across markets.

```bash
moonwell rewards --address 0xYourAddress --chain base
```

### token-balance

Check ERC-20 token balances for Moonwell-related tokens.

```bash
moonwell token-balance --address 0xYourAddress --asset USDC
```

## Write Commands

Write commands **prepare unsigned transactions only**. They never sign or broadcast. Simulation runs by default (skip with `--no-simulate`).

### supply

Prepare a supply (deposit) transaction. Automatically handles:
1. ERC-20 approval (if current allowance < amount)
2. Market entry via `Comptroller.enterMarkets()` (if not already entered)
3. `mToken.mint(amount)` call

```bash
moonwell supply --asset USDC --amount-decimal 100 --from 0xYourAddress --chain base --json
```

### withdraw

Prepare a withdrawal via `mToken.redeemUnderlying(amount)`.

```bash
moonwell withdraw --asset USDC --amount-decimal 50 --from 0xYourAddress
```

### borrow

Prepare a borrow transaction. Requires existing collateral and market entry.

```bash
moonwell borrow --asset USDC --amount-decimal 25 --from 0xYourAddress
```

### repay

Prepare a repayment via approval + `mToken.repayBorrow(amount)`.

```bash
moonwell repay --asset USDC --amount-decimal 25 --from 0xYourAddress
```

### Common write options

```
--asset <symbol>         Underlying asset (required)
--amount <units>         Amount in base units (e.g., 1000000 for 1 USDC)
--amount-decimal <n>     Amount in human-readable form (e.g., 1.0)
--from <addr>            Sender address (required)
--pool-address <addr>    Override mToken address (auto-resolved if omitted)
--no-simulate            Skip eth_estimateGas simulation
```

### PrepareResult envelope

Write commands return a `PrepareResult` JSON object:

```json
{
  "operation": "supply",
  "chain": "eip155:8453",
  "transactions": [
    {
      "step": "approve",
      "description": "Approve token for Moonwell supply",
      "to": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "data": "0x095ea7b3...",
      "value": "0",
      "chainId": 8453
    },
    {
      "step": "moonwell-supply",
      "description": "Supply asset to Moonwell",
      "to": "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
      "data": "0xa0712d68...",
      "value": "0",
      "chainId": 8453
    }
  ],
  "requirements": ["Sufficient USDC balance", "Gas for 2 transaction(s)"],
  "preview": {
    "asset": "USDC",
    "amount": "100000000",
    "amountDecimal": "100",
    "mToken": "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    "estimatedAPY": 2.92
  },
  "warnings": [],
  "simulation": {
    "success": true,
    "gasEstimate": "185000"
  }
}
```

## Submit Command

The `submit` command signs and broadcasts prepared transactions on-chain. It reads a PrepareResult (from a write command) and sequentially signs, broadcasts, and confirms each transaction.

### Key detection (in order of precedence)

1. `--private-key <hex>` flag
2. `MOONWELL_PRIVATE_KEY` env var
3. `MOONWELL_PRIVATE_KEY_FILE` env var (path to file)
4. `~/.moonwell-cli/key.hex` file

### Usage

```bash
# From file
moonwell supply --asset USDC --amount-decimal 10 --from 0x... --json > /tmp/supply.json
moonwell submit --action-file /tmp/supply.json

# Piped (stdin)
moonwell supply --asset USDC --amount-decimal 10 --from 0x... --json | moonwell submit --action-file -

# With explicit key
moonwell submit --action-file /tmp/supply.json --private-key 0xabcd...
```

### Full E2E workflow

```bash
# 1. Check market rates
moonwell rates --asset USDC --chain base

# 2. Check your balance
moonwell token-balance --address 0xYourAddr --asset USDC

# 3. Prepare the supply
moonwell supply --asset USDC --amount-decimal 50 --from 0xYourAddr --json > /tmp/supply.json

# 4. Review the plan (optional)
cat /tmp/supply.json | jq '.data.transactions[].step'

# 5. Submit
moonwell submit --action-file /tmp/supply.json

# 6. Verify
moonwell positions --address 0xYourAddr
moonwell health --address 0xYourAddr
```

## Protocol Guide (Builder Reference)

Moonwell is a **Compound v2 fork**. Key concepts:

- **mTokens**: ERC-20 receipt tokens representing deposited assets (e.g., mUSDC, mWETH)
- **Comptroller**: Governance contract managing collateral factors, market listing, and liquidation
- **Exchange Rate**: mToken ↔ underlying conversion rate, accrues over time
- **Collateral Factor**: max borrow power per supplied dollar (e.g., 0.88 = 88% LTV)

### Supply flow
1. Approve underlying token to mToken contract
2. Call `Comptroller.enterMarkets([mToken])` to enable as collateral
3. Call `mToken.mint(amount)` — receive mTokens representing your deposit

### Borrow flow
1. Must have supplied collateral and entered the market
2. Call `mToken.borrow(amount)` — receive underlying tokens
3. Account liquidity must remain positive after borrow

### Key safety considerations
See [references/safety-patterns.md](references/safety-patterns.md) for details on:
- WETH wrapping edge cases
- Collateral factor and liquidation thresholds
- enterMarkets requirement
- Compound v2 error codes vs reverts

### Contract addresses
See [references/contract-reference.md](references/contract-reference.md) for all deployed addresses.

### SDK integration
For building custom integrations, use `@moonwell-fi/moonwell-sdk`:
- Full docs: https://sdk.moonwell.fi/docs/getting-started
- LLM reference: https://sdk.moonwell.fi/llms-full.txt

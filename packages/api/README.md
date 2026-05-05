# @moonwell-ai/api

Cloudflare Workers HTTP API at `api.moonwell.fi`.

```bash
# reads
curl 'https://api.moonwell.fi/v1/markets?chain=base'
curl 'https://api.moonwell.fi/v1/positions/0xYourAddr?chain=base'
curl 'https://api.moonwell.fi/v1/health/0xYourAddr?chain=base'

# unsigned calldata (POST JSON)
curl -X POST 'https://api.moonwell.fi/v1/prepare/supply' \
  -H 'content-type: application/json' \
  -d '{"chain":"base","asset":"USDC","amountDecimal":"100","from":"0xYourAddr"}'
```

All responses use `{ success, data, meta, error? }`. See <https://agents.moonwell.fi/skill.md> for the full skill manual.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/v1/_health` | `{ ok: true }` liveness probe |
| GET | `/v1/markets?chain=…[&asset=…&sort=…&limit=…]` | All markets on chain |
| GET | `/v1/markets/:symbolOrAddress?chain=…` | One market |
| GET | `/v1/rates?chain=…[&asset=…]` | Supply/borrow rates + utilization |
| GET | `/v1/positions/:address?chain=…[&asset=…]` | User lending positions |
| GET | `/v1/health/:address?chain=…` | Health factor + liquidity |
| GET | `/v1/rewards/:address?chain=…` | Pending WELL rewards |
| GET | `/v1/yield?chain=…[&asset=…&min-tvl=…&sort=…&limit=…]` | Yield opportunities |
| GET | `/v1/token-balance/:address?chain=…[&asset=…]` | ERC-20 balances |
| POST | `/v1/prepare/supply` | Unsigned calldata for supply |
| POST | `/v1/prepare/withdraw` | Unsigned calldata for withdraw |
| POST | `/v1/prepare/borrow` | Unsigned calldata for borrow |
| POST | `/v1/prepare/repay` | Unsigned calldata for repay |

Prepare body: `{ chain, asset, amountDecimal | amount, from, simulate? }`.

## Health probe

```bash
curl 'https://api.moonwell.fi/v1/_health'              # liveness
curl 'https://api.moonwell.fi/v1/_health?deep=1'       # readiness — verifies RPC per chain
```

`?deep=1` returns 503 if any supported chain's RPC is unreachable.

## Local development

```bash
pnpm install
echo 'ENVIRONMENT=development' > .dev.vars
echo 'BASE_RPC_URL=https://...' >> .dev.vars
echo 'OPTIMISM_RPC_URL=https://...' >> .dev.vars
pnpm dev    # http://localhost:8787 — or `pnpm dev:api` from repo root
```

See [AGENTS.md](./AGENTS.md) for architecture, the duplication policy, and the operational checklist before going public (Cloudflare WAF rate limit rule, bot mode, uptime probe).

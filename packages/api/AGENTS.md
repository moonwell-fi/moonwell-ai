# Agent guide — @moonwell-ai/api

Cloudflare Workers HTTP API at `api.moonwell.fi`. Wraps the same Moonwell SDK and viem calldata generation that the CLI uses, behind REST so agent harnesses that can't `npm install` can still call into Moonwell.

## First 5 minutes

```bash
pnpm dev                                  # http://localhost:8787 (wrangler dev)
curl http://localhost:8787/v1/_health
curl 'http://localhost:8787/v1/markets?chain=base&limit=3'
pnpm test
pnpm typecheck
pnpm build                                # wrangler deploy --dry-run smoke
```

Production deploy is automated via `.github/workflows/deploy-api.yml` — push to `main` with changes under `packages/api/**` triggers it.

## Folder structure

```
src/
  index.ts                # Hono app: route mounting, CORS, error envelope
  env.ts                  # typed Env (BASE_RPC_URL, OPTIMISM_RPC_URL)
  routes/
    markets.ts            # GET /v1/markets, GET /v1/markets/:id
    positions.ts          # GET /v1/positions/:address
    health.ts             # GET /v1/health/:address
    rewards.ts            # GET /v1/rewards/:address
    yield.ts              # GET /v1/yield
    token-balance.ts      # GET /v1/token-balance/:address
    prepare.ts            # POST /v1/prepare/{supply,withdraw,borrow,repay}
  lib/                    # DUPLICATED domain logic — see policy below
    prepare.ts            # calldata builder
    abis.ts               # mToken / Comptroller / ERC20
    contracts.ts          # comptroller + reward-distributor addresses
    chains.ts             # chain config + aliases
    amount.ts             # base-unit ↔ decimal
    moonwell.ts           # SDK client factory (worker variant — RPCs from env)
    mtoken-resolver.ts
    types.ts              # PrepareResult, UnsignedTx, etc.
    errors.ts             # MoonwellError + HttpStatus mapping
    client.ts             # viem PublicClient factory (worker variant — RPC required)
    json-output.ts        # JSON envelope helpers (worker only — no chalk / console)
test/
  prepare.test.ts
  amount.test.ts
  chains.test.ts
```

## Duplication policy (important)

`src/lib/` is **duplicated from `packages/cli/src/lib/`**. The CLI is canonical — bug fixes flow CLI → API.

Workflow when you change a CLI lib file:

```bash
# from repo root
pnpm sync-shared
git diff packages/api/src/lib/   # review what changed
```

`pnpm sync-shared` (root) runs `scripts/sync-shared-libs.mjs`. It copies the agreed-upon files; **`client.ts`, `moonwell.ts`, and `json-output.ts` are intentionally divergent and excluded from the sync** — the worker variants take RPC URLs from env bindings (`c.env.BASE_RPC_URL`) and produce JSON only (no chalk/console). `json-output.ts` is named differently from the CLI's `output.ts` on purpose: same-name-different-content is a footgun for grep and for manual hand-syncs.

CI enforces the sync via `node scripts/sync-shared-libs.mjs --check` in `verify.yml`. Forgetting to run `pnpm sync-shared` after editing a CLI lib file fails the PR build.

## Non-obvious

- `nodejs_compat` flag is set in `wrangler.jsonc` because `viem` and `@moonwell-fi/moonwell-sdk` use a few Node primitives (`Buffer`, `crypto`).
- Workers re-use the V8 isolate across requests. Don't put per-user state in module scope. Each request creates a fresh SDK + viem client.
- Read endpoints (`/v1/markets`, `/v1/yield`, `/v1/markets/:id`) are cacheable: 30s `Cache-Control` plus Workers `caches.default`. User-scoped reads (`/v1/positions/:address`, `/v1/health/:address`, `/v1/rewards/:address`, `/v1/token-balance/:address`) use `Cache-Control: private, no-store`.
- All responses use the envelope `{ success, data, meta, error? }` matching the CLI's JSON output (see `src/lib/output.ts` and the CLI's same file).
- RPC URLs are required secrets. `wrangler dev` reads them from `.dev.vars` if present; production uses `wrangler secret put`.

## Local secrets

Create `packages/api/.dev.vars` (gitignored — never committed):

```
ENVIRONMENT=development
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
```

`ENVIRONMENT=development` is optional — it only changes the `environment` field reported in `/v1/_health` and the JSON probe at `/`.

Then `pnpm dev` (in `packages/api`) or `pnpm dev:api` (from repo root) will pick them up automatically.

## Quality bar

- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm build` (wrangler dry-run) passes
- `pnpm sync-shared --check` clean (CI enforces this)
- Smoke at least one read + one prepare endpoint via `wrangler dev` before committing

## Operational checklist before flipping public DNS

The API is open by design (no app-level auth) — abuse protection is delegated to Cloudflare's edge. Configure these in the Cloudflare dashboard before pointing `api.moonwell.fi` at the worker:

1. **Rate limiting rule** — Security → WAF → Rate limiting rules. Recommended starting point:
   - Match: `(http.host eq "api.moonwell.fi")`
   - Characteristic: `cf.connecting_ip`
   - Period: 10s, Requests: 30, Action: Block (10s)
   - Add a second rule for `/v1/prepare/*` at a tighter budget (e.g. 5 req / 10s) since each call burns gas-estimation RPC.
2. **Bot Fight Mode** — Security → Bots → enable. Free; catches naïve scrapers.
3. **Deep health probe** — point uptime monitoring at `https://api.moonwell.fi/v1/_health?deep=1`. The `?deep=1` variant verifies RPC reachability per chain and returns 503 if any chain is down.
4. **RPC secrets present** — `wrangler secret list` from `packages/api` should show `BASE_RPC_URL` and `OPTIMISM_RPC_URL`.

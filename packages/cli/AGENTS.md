# Agent guide — @moonwell-fi/cli

TypeScript CLI for the Moonwell lending protocol (Compound v2 fork) on Base and Optimism. Reads use the Moonwell SDK, writes use viem for unsigned tx calldata, submit signs and broadcasts.

## First 5 minutes

```bash
pnpm install
npx tsx src/index.ts markets --chain base --limit 5
npx tsx src/index.ts rates --asset USDC --json
npx tsx src/index.ts positions --address 0x000000000000000000000000000000000000dEaD --chain base --json
npx tsc --noEmit
npx vitest run
```

## Folder structure

```
src/
  index.ts                    # CLI entrypoint (Commander.js)
  commands/                   # One file per command
    markets.ts rates.ts positions.ts yield.ts health.ts
    rewards.ts token-balance.ts
    supply.ts withdraw.ts borrow.ts repay.ts
    submit.ts
  lib/
    moonwell.ts               # Moonwell SDK client wrapper
    client.ts                 # viem PublicClient (write-side simulation)
    signer.ts                 # Private key resolution + validation
    chains.ts                 # Chain defs + aliases (base, optimism)
    contracts.ts              # Comptroller/RewardDistributor addresses
    abis.ts                   # mToken, Comptroller, ERC20 ABIs (write ops only)
    mtoken-resolver.ts        # Underlying → mToken via Comptroller.getAllMarkets
    prepare.ts                # PrepareResult builder + simulation
    types.ts                  # Envelope, PrepareResult, UnsignedTx, GlobalOptions
    amount.ts                 # Base-unit ↔ decimal conversion
    errors.ts                 # Typed errors → exit codes
    format.ts                 # Chalk-based pretty formatters
    output.ts                 # JSON/pretty mode switch + envelope builder
  test/
    amount.test.ts            # Amount conversion tests
    chains.test.ts            # Chain resolution tests
```

## Non-obvious but important

- SDK's `baseSupplyApy` and `baseBorrowApy` are already percentage values (2.9 means 2.9%), not ratios. Do not multiply by 100 for display.
- Base has TWO mUSDC markets (old deprecated + current). The SDK returns both in `getMarkets()`. `mtoken-resolver.ts` resolves via `Comptroller.getAllMarkets()` which may include deprecated ones.
- WETH on Moonwell auto-unwraps to native ETH on borrow/withdraw. Supply/repay requires wrapping ETH→WETH first. CLI emits warnings for WETH operations.
- `prepare.ts` simulation only tests the first step of multi-step transactions. Steps 2+ are listed in `simulation.skippedSteps` since they depend on prior steps being on-chain.
- `submit.ts` manages nonces locally (increment per tx). For dependent steps where gas estimation fails due to stale RPC state, it falls back to 2x the previous step's actual gas usage.
- `Comptroller.enterMarkets()` is needed to use supplied assets as collateral. The supply command auto-includes this step if needed.
- Compound v2 functions return 0 for success, non-zero for business logic errors (they don't revert).
- Public RPCs can serve stale state — this is why gas estimation for step 2 of a multi-step tx may fail even after step 1 confirms.

## Change patterns

- New read command:
  1. Create `src/commands/<name>.ts`
  2. Use SDK client for data fetching
  3. Register in `src/index.ts`
  4. Add to `packages/skill/SKILL.md` and `README.md`

- New write command:
  1. Create `src/commands/<name>.ts`
  2. Build PrepareResult with unsigned txs via viem `encodeFunctionData`
  3. Register in `src/index.ts`

- New chain:
  1. Add to `src/lib/chains.ts` (SUPPORTED_CHAINS + CHAIN_ALIASES)
  2. Add contract addresses to `src/lib/contracts.ts`

## Quality bar

- `npx tsc --noEmit` passes
- `npx vitest run` passes
- Smoke at least one read + one write command on the affected chain

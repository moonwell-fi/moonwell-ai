# Moonwell CLI

Agent-first CLI for the [Moonwell](https://moonwell.fi) lending protocol on Base and Optimism.

## Features

- **Read**: Markets, rates, positions, yield opportunities, health, rewards, balances
- **Write**: Prepare unsigned transactions for supply, withdraw, borrow, repay
- **Submit**: Sign and broadcast prepared transactions on-chain
- **Dual output**: Pretty terminal output (TTY) or JSON (piped / `--json`)
- **Simulation**: First step simulated via `eth_estimateGas` by default
- **No keys required** for reads — writes need a private key

## Install

```bash
npm install -g @moonwell-fi/cli
```

## Usage

```bash
# List all markets on Base
moonwell markets --chain base

# Check rates for USDC
moonwell rates --asset USDC

# View positions for an address
moonwell positions --address 0xYourAddress

# Yield opportunities sorted by APY
moonwell yield --sort apy --limit 5

# Account health check
moonwell health --address 0xYourAddress

# Prepare + submit a supply
moonwell supply --asset USDC --amount-decimal 100 --from 0xYourAddress --json > /tmp/supply.json
moonwell submit --action-file /tmp/supply.json

# Or pipe directly
moonwell supply --asset USDC --amount-decimal 100 --from 0xYourAddress --json | \
  moonwell submit --action-file -
```

## Commands

| Command | Description |
|---|---|
| `markets` | List lending markets with APY, TVL, utilization |
| `rates` | Current supply/borrow rates |
| `positions` | Account supply/borrow/collateral positions |
| `yield` | Yield opportunities sorted by APY |
| `health` | Account health factor and liquidity |
| `rewards` | Pending WELL token rewards |
| `token-balance` | ERC-20 token balances |
| `supply` | Prepare a supply (deposit) transaction |
| `withdraw` | Prepare a withdraw (redeem) transaction |
| `borrow` | Prepare a borrow transaction |
| `repay` | Prepare a repay transaction |
| `submit` | Sign and broadcast prepared transactions |

## Global Options

```
--chain <chain>    base (default) | optimism | 8453 | 10
--rpc-url <url>    Override RPC endpoint
--json             Force JSON output
```

## Private Key Detection

The `submit` command resolves signing keys in this order:

1. `--private-key <hex>` flag — **advanced / scripted use only**
2. `MOONWELL_PRIVATE_KEY` env var
3. `MOONWELL_PRIVATE_KEY_FILE` env var (path to file)
4. `~/.moonwell-cli/key.hex` file (must be `chmod 600`)

Keys must be 0x-prefixed 64-character hex strings.

### Security notes

- **Avoid `--private-key` for interactive use.** Passing a key on the command line exposes it to shell history, `ps` output, CI logs, and anything else that captures the process table. Use the env var or key file for interactive work; reserve the flag for short-lived scripted contexts that manage the process table.
- **Key files must be owner-only.** The loader rejects key files with group/world permissions. Run `chmod 600 ~/.moonwell-cli/key.hex` (and `chmod 700` on the directory).
- **Submit enforces signer and chain binding.** `submit` refuses to sign a `PrepareResult` if the resolved signer address does not match the `from` used during prepare, or if `--chain` points at a different network than the prepared one.
- **Submit whitelists transaction targets.** Every tx is verified to target the Moonwell Comptroller, a listed mToken, or an mToken underlying (for approvals) before signing.

## Architecture

- **Read operations**: [`@moonwell-fi/moonwell-sdk`](https://sdk.moonwell.fi) handles all data queries
- **Write operations**: [`viem`](https://viem.sh) builds unsigned transaction calldata
- **Submit**: Signs with a local private key, broadcasts via RPC, waits for confirmation
- **CLI framework**: [Commander.js](https://github.com/tj/commander.js)
- **Formatting**: [chalk](https://github.com/chalk/chalk) + [ora](https://github.com/sindresorhus/ora)

## Build

```bash
pnpm build     # Build with tsup
pnpm typecheck # Type check
pnpm test      # Run tests
```

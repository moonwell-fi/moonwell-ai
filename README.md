# Moonwell AI

Agent skill and CLI for the [Moonwell](https://moonwell.fi) lending protocol on Base and Optimism.

## Install the skill

```
/install-skill https://agents.moonwell.fi/skill.md
```

## Packages

| Package | Description |
|---|---|
| [`@moonwell-fi/cli`](packages/cli) | Agent-first CLI — read markets, prepare and submit transactions |
| [`packages/web`](packages/web) | Landing page — [agents.moonwell.fi](https://agents.moonwell.fi) |
| [`packages/skill`](packages/skill) | `SKILL.md` definition for Claude Code, Cursor, and MCP clients |

## Development

```bash
pnpm install

pnpm dev:web   # Landing page (localhost:3000)
pnpm test      # CLI tests
pnpm build     # Build all packages
```

# CLAUDE.md — moonwell-ai monorepo

Agent guide for the moonwell-ai workspace. Start here.

## What this is

Three packages:
- `packages/cli` — `@moonwell-fi/cli`, published to npm, the main artifact
- `packages/web` — landing page at agents.moonwell.fi (private, Next.js 16)
- `packages/skill` — `SKILL.md` definition consumed by Claude Code / Cursor

## First 5 minutes

```bash
pnpm run setup        # = pnpm install --frozen-lockfile && pnpm run allow-scripts

# Web dev server
pnpm dev:web          # localhost:3000

# CLI smoke test
cd packages/cli
npx tsx src/index.ts markets --chain base --limit 5
npx tsc --noEmit
npx vitest run

# Full build
pnpm build
```

## Supply-chain guardrails (read before adding deps)

`.npmrc` sets `ignore-scripts=true` — **no** dep's preinstall / install / postinstall / prepare runs on `pnpm install`. Legitimate native-binary deps are listed in `package.json#lifecycleScriptAllowlist` and re-enabled by `pnpm run allow-scripts` (also runs the root `prepare` hook, so husky gets wired up).

- Fresh clone or fresh install → `pnpm run setup`.
- Adding a dep → `pnpm add <pkg>` works, but its install scripts won't fire. If it legitimately needs them (native binary, codegen), add its name to `lifecycleScriptAllowlist` and re-run `pnpm run allow-scripts`. Keep this list small.
- Committing a `pnpm-lock.yaml` change → the pre-commit hook (`scripts/check-lockfile-cooling-off.mjs`) blocks any newly introduced `name@version` published in the last 72h. Override only for verified emergency hotfixes:
  ```bash
  COOLING_OFF_OVERRIDE=1 git commit ...
  COOLING_OFF_HOURS=24 git commit ...   # tune the window
  ```

Why both layers: a malicious npm version (TanStack-style) can land via Renovate before the registry catches it. The cooling-off blocks it at commit time; `ignore-scripts` neuters install-time code-exec even if a poisoned version slips through.

## Package agent guides

Each package has its own guide — read it before touching that package:
- `packages/cli/CLAUDE.md` — detailed CLI architecture, non-obvious gotchas, change patterns
- `packages/web/AGENTS.md` — critical Next.js 16 warning (breaking changes from v14/v15)

---

## Web package — things that matter

### Next.js 16
**Read `node_modules/next/dist/docs/` before writing any framework code.** APIs, file conventions, and routing differ from v14/v15 in your training data.

### Tailwind CSS v4
Uses `@theme inline` — no `tailwind.config.ts`. All design tokens live in `src/app/globals.css`:
```css
:root { --accent: #2474da; }
@theme inline { --color-accent: var(--accent); }
```
Custom classes like `.cursor-blink` are defined as plain CSS in `globals.css` — not Tailwind utilities, but they still apply.

### Color palette (Moonwell brand)
| Token | Value | Use |
|---|---|---|
| `--accent` / `text-accent` | `#2474da` | Moonwell Blue — primary interactive |
| `--orange` / `text-orange` | `#fd6e31` | Secondary accent, URLs, warnings |
| `--green` / `text-green` | `#42b34d` | Success, positive values |
| `--background` | `#0f0d0e` | Page bg (warm dark, not blue-black) |
| `--card` | `#1d1b1c` | Card bg |
| `--border` | `#3b3438` | Borders |
| `--muted` | `#887982` | Secondary text |

Dark-only. No light mode.

### skill.md serving
`public/skill.md` is a static copy of `packages/skill/SKILL.md`. Next.js serves it directly at `/skill.md` — no route handler. The copy is handled by the same sync script that mirrors `packages/cli/src/lib/` into `packages/api/src/lib/`:
```bash
pnpm sync-shared          # copies SKILL.md → public/skill.md too
pnpm sync-shared --check  # CI guard against drift
```
The old dynamic route (`src/app/skill.md/route.ts`) was deleted — do not recreate it.

### Client components
Two small `'use client'` components in `src/app/components/`:
- `CopySkillButton.tsx` — hero CTA, copies `https://agents.moonwell.fi/skill.md`, flips copy→check icon
- `CopyButton.tsx` — inline icon-only copy button used in install code blocks, takes `text` prop

Everything else in `page.tsx` is a server component (no `useState`, no imports from client libs).

---

## CLI package — key facts

See `packages/cli/CLAUDE.md` for the full picture. Short version:

- Published as `@moonwell-fi/cli`, binary is `moonwell`
- Reads via `@moonwell-fi/moonwell-sdk`, writes via `viem`
- Color palette in `src/lib/format.ts` — uses `chalk.hex()` with Moonwell brand colors
- `src/lib/format.ts` is the single source of truth for CLI colors — edit `c` object there

### CLI color palette
```typescript
label / accent / address → chalk.hex('#2474da')  // Moonwell Blue
positive                 → chalk.hex('#42b34d')  // Moonwell Green
warning                  → chalk.hex('#fd6e31')  // Orange
error / negative         → chalk.hex('#d72c2b')  // Moonwell Red
```

---

## Workspace scripts

```bash
pnpm dev:web    # Web dev server
pnpm test       # CLI tests (vitest)
pnpm build      # Build all (tsup + next build)
pnpm typecheck  # CLI tsc --noEmit
```

## Package names

| Package | Name | Published |
|---|---|---|
| root | `moonwell-ai` | No (private) |
| cli | `@moonwell-fi/cli` | Yes |
| web | `@moonwell-ai/web` | No (private) |

The scope mismatch (`@moonwell-ai` vs `@moonwell-fi`) is intentional — only the CLI is published so only its name matters.

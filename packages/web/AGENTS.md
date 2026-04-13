# Agent guide — packages/web

Landing page for [agents.moonwell.fi](https://agents.moonwell.fi). Next.js 16 + Tailwind CSS v4.

## WARNING: This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any framework code. Heed deprecation notices.

## First 5 minutes

```bash
pnpm dev    # localhost:3000
pnpm build  # production build — must pass before shipping
```

## Tailwind CSS v4

No `tailwind.config.ts`. All design tokens live in `src/app/globals.css` using the `@theme inline` pattern:

```css
:root { --accent: #2474da; }
@theme inline { --color-accent: var(--accent); }
```

Custom classes (e.g. `.cursor-blink`) are defined as plain CSS in `globals.css` — not Tailwind utilities, but they apply normally.

## Color palette (Moonwell brand)

| Token | Value | Use |
|---|---|---|
| `--accent` / `text-accent` | `#2474da` | Moonwell Blue — primary interactive |
| `--orange` / `text-orange` | `#fd6e31` | Secondary accent, URLs, warnings |
| `--green` / `text-green` | `#42b34d` | Success, positive values |
| `--background` | `#0f0d0e` | Page bg (warm dark) |
| `--card` | `#1d1b1c` | Card bg |
| `--border` | `#3b3438` | Borders |
| `--muted` | `#887982` | Secondary text |

Dark-only. No light mode.

## skill.md serving

`public/skill.md` is a static copy of `packages/skill/SKILL.md`. Next.js serves it directly at `/skill.md` — no route handler needed. If you update the skill definition, copy it over:

```bash
cp packages/skill/SKILL.md packages/web/public/skill.md
```

Do NOT recreate `src/app/skill.md/route.ts` — it was intentionally deleted.

## Client components

Two `'use client'` components in `src/app/components/`:

- `CopySkillButton.tsx` — hero CTA, copies `https://agents.moonwell.fi/skill.md`, flips copy→check icon
- `CopyButton.tsx` — inline icon-only copy button for code blocks, takes a `text` prop

Everything else in `page.tsx` is a server component.


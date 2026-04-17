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

## Security headers

The page is fully static — no user input, no XSS sinks, no auth — so CSP and baseline security headers are enforced at the edge (Cloudflare / Vercel) rather than in `next.config.ts`. If you ever add form input or third-party scripts, revisit and add a `Content-Security-Policy` either at the edge or via `headers()` in `next.config.ts`.

## Design engineering principles

These are the durable rules. Specific token values live above; this section is the philosophy that governs how surfaces get built.

1. **Tokens, not values.** Colors, radii, and fonts flow from `globals.css` via Tailwind v4's `@theme inline`. Raw hex in components is a bug.

2. **One strong accent per surface.** `text-accent` / `bg-accent` is the single primary moment. Don't stack competing brand accents in one view.

3. **Accessibility is a baseline, not a polish pass.** Every interactive element ships with a visible `focus-visible:` ring, a stable `aria-label` that toggles to match state changes, and a tap target expanded via negative margin + padding rather than intrinsic growth. Copy-state timers are stored in refs and cleared on unmount.

4. **Never `transition-all`.** Specify exact properties (`transition-colors`, `transition-[opacity,transform,filter]`). `all` animates layout-affecting properties and wastes paint.

5. **Gate motion globally via `prefers-reduced-motion`.** The override in `globals.css` clamps durations and kills keyframes. Don't write motion that assumes users want it.

6. **State changes must not reflow.** When a button or card morphs (label swap, icon swap), anchor width with an invisible placeholder and crossfade stacked children. The shell stays fixed; content hands off.

7. **Copy matches behavior.** A button that copies to clipboard says "Copy", not "Install". Honesty in the label beats marketing cleverness.

8. **Fake-terminal prefixes are decorations.** Glyphs like `❯`, `$`, `>`, `↳`, `✓` always carry `select-none` + `aria-hidden="true"` so highlighting and copying yield the command alone. Reserve `❯` for agent-prompt contexts and `$` for shell contexts — don't mix.

9. **Terminal output is one size, one family.** Inside any terminal-framed card (hero demo, `PlanArtifact`, `HealthArtifact`, install snippets), every visible line stays at the same font size and in `font-mono`. Use color and weight for emphasis — never `text-lg`/`text-xs` or a switch to `font-sans`. Chrome around the card (title bar, eyebrow labels) is not output and may differ. Wrapped command lines use hanging indent (`pl-[2ch] -indent-[2ch]`) so continuations align under the first character of the command, not under the prompt glyph.

10. **Agent prompts blink; shell commands don't.** Agent-prompt contexts (the `❯` prefix) render with a blinking caret appended to the typed text to signal "entered / ready" — reuse the same `.cursor-blink` span markup from `TerminalDemo`. Shell-command contexts (the `$` prefix) are copy/paste invocations, not live input, and never get a caret. Mixing the two erases the signal.

11. **Dependencies are deliberate.** Prefer CSS, hand-rolled primitives, or existing deps before pulling a new library. Icons use `lucide-react` (1.5–2 stroke, 15–16px grid). Motion uses CSS transitions and `prefers-reduced-motion` unless a real morph demands more.

12. **Sticky nav requires `scroll-mt` on anchor targets.** Any `<section id="...">` that's a jump target gets `scroll-mt-16` so content doesn't hide under the nav.

13. **Voice is factual, not marketing.** This is a skill manual for developers. Tight descriptions, no generic SaaS hype.

14. **Consult `.claude/skills/` before reinventing.** The `emil-design-engineering` and `devouring-details-design` skills encode the patterns above at longer form. Use them as the canonical reference when designing new surfaces.


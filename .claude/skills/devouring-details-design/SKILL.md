---
name: devouring-details-design
description: Devouring Details visual system and implementation playbook. Auto-load when prompts mention Devouring Details, devouringdetails.com, DD-style UI, editorial product surfaces, grayscale reading layouts, accent CTA moments, or restyling a page to match that aesthetic.
argument-hint: [brief]
---

# Devouring Details Design

Use this skill when the user wants the feel of Devouring Details, not a generic SaaS UI.

Apply the style as a system, not as scattered decoration:

- tokens first (mapped to Moonwell's design system — see `packages/web/AGENTS.md`)
- typography second
- layout third
- motion and affordances last
- one strong accent moment instead of many small accent moments

## Core Intent

The site feels like a design engineer's field manual:

- reading-first, never chrome-first
- sparse, deliberate, and calm
- mostly neutrals with one controlled accent color
- tactile motion used to clarify intent, not to decorate blank space
- editorial copy blocks paired with live or media-backed examples

## Token Strategy

All DD surfaces in this project must use Moonwell's design tokens (defined in `packages/web/src/app/globals.css` via Tailwind v4 `@theme inline`). Do not introduce standalone hex values or a parallel token system.

- Colors: use CSS variables / Tailwind utilities from the Moonwell palette:
  - `bg-background` (`#0f0d0e`), `text-foreground` (`#e5e2e3`)
  - `bg-card` (`#1d1b1c`), `bg-card-hover` (`#332e30`)
  - `border-border` (`#3b3438`), `text-muted` (`#887982`)
  - `text-accent` / `bg-accent` (`#2474da` — Moonwell Blue, primary interactive; fills the DD accent role)
  - `text-green` (`#42b34d`), `text-purple` (`#ac10f4`)
- **Accent moment**: use `bg-accent` / `text-accent` (Moonwell Blue, `#2474da`) for the single strong accent per screen.
- **Dark-only**: this project has no light mode. DD's classic grayscale-on-light reading layout must adapt — the reading surface is dark, neutrals are warm-dark, and accent contrast still stays restrained.
- Radius: Tailwind defaults (`rounded-sm` through `rounded-xl`, `rounded-full`).
- Fonts: `font-sans` (Geist Sans via `--font-geist-sans`) and `font-mono` (Geist Mono via `--font-geist-mono`).

See [foundation.md](foundation.md) for the complete token mapping.

## Non-Negotiables

- Use Moonwell's token system exclusively — no raw hex values that bypass the theme.
- Use the accent color as the primary emphasis. Do not introduce a second dominant accent unless the task explicitly needs a semantic state.
- Keep section headings small, monospaced (`font-mono`), and quiet.
- Keep body copy large enough to feel authored, not app-default.
- Favor generous line height and roomy vertical rhythm over dense information packing.
- Prefer soft fills, thin contrast, and rounded pills over hard borders and square controls.
- If the page includes an interactive demo, treat it as a parallel reading rail, not as a tiny embedded card.
- Avoid heavy nav bars, giant boxed layouts, or marketing gradients unless the user specifically asks for them.

## Typography Rules

- Main reading text should feel like authored prose, not utility copy. Use `text-lg leading-relaxed` or larger.
- Small structural labels should use `font-mono text-xs uppercase tracking-wider text-muted`.
- Code examples should use `font-mono` and sit on very low-contrast containers (`bg-card`).
- Large CTA text can be oversized and slightly tight-tracked, but reserve that move for one moment per screen.

## Interaction Rules

- Hover should usually reveal clarity, not spectacle.
- Motion should rely on opacity, blur, translate, scale, and spring settling.
- Use the accent color for active markers, focus cues, selected items, and the main CTA.
- Subtle neutral state changes are preferred over loud hover treatments.
- On desktop, hidden labels and controls can reveal on hover. On mobile, reveal by default or simplify the control.

## Layout Rules

- The product surface is built around a fixed reading lane and a second rail for media or demos.
- The public marketing surface uses large vertical sections and two-column card grids, but still keeps the same restrained palette.
- Mobile should collapse to a single reading column with embedded media blocks and less peripheral chrome.

## Implementation Notes

- Start from Moonwell's CSS variables and Tailwind v4 `@theme inline` block in `globals.css` — never define a parallel set of DD tokens.
- Keep component APIs simple. Most of the feel comes from spacing, typography, and state handling, not from prop-heavy abstractions.
- Use inline SVG, lightweight illustration strokes, or quiet geometric diagrams when you need decoration.

## Technical Details

- Reference tokens from the Moonwell theme for all color, radius, shadow, spacing, and typography decisions.
- Model most pages as `content + rail`, where the content column owns reading rhythm and the rail owns live media or controls.
- Use sticky rails on desktop, then inline the same content lower in the flow on mobile instead of maintaining separate desktop-only logic.
- Keep motion local to the thing that changes state. Prefer animating a CTA, active marker, or rail reveal instead of animating the whole page.
- Gate non-essential motion behind reduced-motion checks so the layout still reads correctly without animation.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ddSpring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };

export function DDPageShell({
  eyebrow,
  title,
  children,
  rail,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 py-10 lg:grid-cols-[minmax(0,44rem)_minmax(320px,1fr)] lg:px-10">
        <main className="space-y-8">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            {eyebrow}
          </p>
          <h1 className="max-w-[14ch] text-5xl leading-[1.05] tracking-[-0.04em]">
            {title}
          </h1>
          <div className="space-y-6 text-xl leading-relaxed">{children}</div>
        </main>

        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : ddSpring}
          className="lg:sticky lg:top-8"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-md">
            {rail}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
```

## Supporting Files

- [foundation.md](foundation.md): token mapping to Moonwell's design system, typography, motion cues, and visual rules
- [surfaces.md](surfaces.md): surface-specific recipes for marketing, editorial, prototype, resource, and mobile layouts

## Related Skills

Use these when the request is specifically about motion behavior rather than overall styling:

- `dd-morphing-surfaces`
- `dd-motion-principles`
- `dd-smooth-transitions`

## Output Standard

When using this skill, make the result feel like it belongs to the same family as Devouring Details:

- precise
- calm
- tactile
- editorial
- motion-aware

It should never read like a generic dashboard theme with accent paint on top.

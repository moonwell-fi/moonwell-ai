---
name: dd-prototype-chapter
description: Devouring Details prototype chapter patterns. Auto-load when prompts mention live demos, interactive prototypes, demo rails, annotated interactions, source reveal panels, or text-and-demo split layouts in the DD style.
argument-hint: [brief]
---

# DD Prototype Chapter

Treat the page as an annotated demo surface. The interaction itself should carry the excitement.

## Base System

- background: `bg-background` (`#0f0d0e` — warm dark)
- soft rail/card background: `bg-card` (`#1d1b1c`)
- primary text: `text-foreground` (`#e5e2e3`)
- secondary text: `text-muted` (`#887982`)
- accent: `bg-accent` / `text-accent` (`#2474da`)
- compact controls: circular or pill-shaped

## Layout

- keep the editorial reading lane on one side
- reserve the second rail for a live demo or embedded prototype
- the demo rail should be prominent and immediately testable
- keep demo controls compact and near the top of the rail

## Demo Chrome

- use small round buttons or pill toggles
- reveal-source, reload, fullscreen, or open-standalone controls are appropriate
- keep control chrome neutral so the motion gets the attention

## Motion

- emphasize tactile behavior: hover, drag, proximity, scroll, velocity, spring settling
- use opacity, blur, translate, and scale carefully
- tune spring behavior per interaction rather than relying on one global motion preset
- motion should explain intent

## Visual Language

- use quiet gray shells and thin contrast
- diagrams and minimaps should be hairline and sparse
- the accent color should identify the active state or focal marker

## Copy

- explain the interaction in direct prose
- weave code excerpts and notes into the page
- keep the page instructional, not promotional

## Technical Details

- Treat the demo rail as a mounted React surface with its own small state machine for modes, toggles, and source visibility.
- Use `AnimatePresence` for source panels, notes, or sub-modes inside the rail so state changes clean up instead of stacking layers.
- Keep the outer frame visually quiet. The animation or interaction should be the loudest thing on the page.
- Use `layout` only where continuity helps, such as a small active indicator or a pill highlight inside the demo controls.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function DDPrototypeChapter({
  demo,
  source,
}: {
  demo: React.ReactNode;
  source: string;
}) {
  const [showSource, setShowSource] = React.useState(false);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,42rem)_minmax(360px,1fr)]">
      <article className="space-y-6 text-[20px] leading-[1.9] text-foreground">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-muted">
          Prototype
        </p>
        <h1 className="text-5xl tracking-[-0.04em]">
          The interaction carries the emphasis.
        </h1>
      </article>

      <motion.aside
        layout
        className="space-y-3 rounded-[28px] bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="h-9 rounded-full bg-card px-4 text-sm text-foreground">
              Live
            </button>
            <button
              onClick={() => setShowSource((value) => !value)}
              className="h-9 rounded-full bg-card px-4 text-sm text-muted"
            >
              {showSource ? 'Hide code' : 'Show code'}
            </button>
          </div>
          <motion.div
            layoutId="dd-demo-dot"
            className="h-2 w-2 rounded-full bg-accent"
          />
        </div>

        <div className="rounded-[24px] bg-background p-4">{demo}</div>

        <AnimatePresence initial={false} mode="wait">
          {showSource && (
            <motion.pre
              key="source"
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
              transition={{ duration: 0.18 }}
              className="overflow-x-auto rounded-[24px] bg-background px-4 py-3 text-sm text-foreground"
            >
              <code>{source}</code>
            </motion.pre>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
```

## Avoid

- flashy demo frames
- bright multicolor accents
- oversized toolbar chrome
- heavy shadows
- explanation without a live or visible interaction

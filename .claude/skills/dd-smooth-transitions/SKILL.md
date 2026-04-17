---
name: dd-smooth-transitions
description: Devouring Details transition cleanup patterns for React and Framer Motion. Auto-load when prompts mention transitions, smooth transitions, crossfades, label swaps, icon swaps, blur cleanup, overlapping layers, janky state changes, or abrupt UI animation.
argument-hint: [brief]
---

# DD Smooth Transitions

Most bad motion is not caused by the easing curve. It is caused by overlapping layers, bad ownership of layout, or too much happening at once.

## First Diagnosis

When a transition feels wrong, check these in order:

1. are overlapping layers crashing into each other?
2. is the wrong element being animated?
3. are multiple layers moving when only one should?
4. is the transition delayed in a way that feels like lag?

## Animate the Right Element

If content is dynamic:

- animate the inner container that owns the changing width or content
- let the parent resize as a side effect
- avoid animating the outermost shell when that causes contents to re-center or drift

## Overlap Management

Overlapping layers during motion usually feel terrible.

To soften overlap without creating lag:

- keep the transition immediate
- add a slight blur to exiting or overlapping text
- use small scale reduction on crossfading layers
- clean up old layers quickly

## Blur and Scale

Blur is a cleanup tool, not a gimmick.

Use it to:

- soften text overlap
- improve icon crossfades
- make state changes feel less brittle

Guidelines:

- keep blur small for text-level cleanup
- use a little more blur for icon swaps when shapes conflict
- do not scale to `0`
- do not use huge blur values that make the transition abrupt

## Text and Label Transitions

For changing labels:

- stagger letters or subparts very lightly
- let the first visible response happen immediately
- speed up exits so stale text clears fast

This creates depth without feeling delayed.

## Icon Crossfades

Crossfading works better when shapes are visually compatible.

If shapes differ a lot:

- add blur
- add subtle scale
- reduce the feeling of two sharp layers occupying the same space

## Responsiveness

Never fix clutter by delaying input response.

- the interface should begin reacting immediately
- cleanup can be choreographed
- responsiveness wins over overly cautious sequencing

## Technical Details

- Animate the element that owns the changing content, then let parents resize as a consequence of that change.
- Keep text and icon swaps keyed so enter and exit are explicit rather than accidental re-renders.
- Use small blur plus subtle scale reduction to reduce sharp overlap when two states briefly occupy the same footprint.
- Make exits slightly faster than enters so stale content clears quickly without creating a laggy feel.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function SmoothStatusToggle() {
  const [active, setActive] = React.useState(false);

  return (
    <button
      onClick={() => setActive((value) => !value)}
      className="rounded-full bg-[#f3f3f3] p-2"
    >
      <motion.div
        layout
        className="flex items-center gap-3 rounded-full bg-white px-4 py-3"
      >
        <div className="relative h-5 w-5">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={active ? 'active-icon' : 'idle-icon'}
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
              transition={{ duration: active ? 0.18 : 0.14 }}
              className="absolute inset-0 grid place-items-center text-accent"
            >
              {active ? '●' : '○'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="relative min-w-[7rem] text-left text-sm text-[#171717]">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={active ? 'label-live' : 'label-idle'}
              initial={{ opacity: 0, y: 6, scale: 0.985, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, scale: 0.99, filter: 'blur(7px)' }}
              transition={{ duration: active ? 0.2 : 0.16 }}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              {active ? 'Live prototype' : 'Preview mode'}
            </motion.span>
          </AnimatePresence>
          <span className="invisible">Live prototype</span>
        </div>
      </motion.div>
    </button>
  );
}
```

## Avoid

- waiting for one layer to disappear before reacting
- animating root width when inner content is what changes
- sharp-on-sharp icon overlaps
- fully collapsing scale to zero
- using blur as a permanent style instead of a transition aid

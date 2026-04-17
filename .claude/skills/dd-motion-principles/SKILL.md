---
name: dd-motion-principles
description: Devouring Details motion choreography principles for React and Framer Motion. Auto-load when prompts mention animation principles, motion systems, choreography, stagger, sequencing, spring tuning, drag resistance, thresholds, weight, or follow-through.
argument-hint: [brief]
---

# DD Motion Principles

Great motion should feel orchestrated, weighted, and slightly organic.

## Core Beliefs

- not everything should move at once
- conceptually distinct elements should move at different times or speeds
- motion should respond immediately to input
- choreography is as important as easing
- nature is asynchronous; interfaces should not move in perfect concert

## Choreography Rules

- sequence secondary elements behind the primary action
- use slight delays on supporting layers, not on the whole interaction
- let the most important response happen first
- use staging to give the interaction identifiable phases

## Staggering

Use stagger when a group of similar elements enters, updates, or reveals.

Good use cases:

- letters
- labels
- chips
- grid items
- list rows

Practical rule:

- use very small delays
- enough to create layering
- not enough to feel slow

## Weight and Damping

If an interaction feels too light or meaningless:

- damp movement so the object travels less than the pointer or drag offset
- increase resistance before a state change
- release that resistance after the threshold for a satisfying snap

This is especially effective for:

- docks
- sheets
- pull handles
- sticky controls
- bottom surfaces

## Thresholds

Do not snap at nearly zero movement.

- give the interaction a little travel before it commits
- let the user anticipate the snap
- moved distance is part of choreography, not just physics

## Follow-Through

Secondary layers can trail or settle after the primary layer.

Use this for:

- labels
- helper text
- active indicators
- small supporting ornaments

Do not overdo it. Follow-through should add nuance, not noise.

## Exit Behavior

- exits can often be faster than enters
- stale content should clean up quickly
- faster exits improve perceived responsiveness when a new state is arriving

## Technical Details

- Split motion into primary action and supporting action. The primary layer moves first; labels, helper text, and marks follow.
- Use variants for orchestration and motion values only where the interaction needs continuous response such as drag, proximity, or scroll.
- Add threshold logic in state, not only in spring config. Weight is partly physics and partly when you decide to commit the next state.
- Short exits often feel better than symmetric enters because they clear stale UI without delaying the next response.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { motion, useMotionValue } from 'framer-motion';

const shellSpring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 };

export function WeightedPullSurface() {
  const [open, setOpen] = React.useState(false);
  const y = useMotionValue(0);

  return (
    <motion.div
      animate={{ y: open ? -180 : 0 }}
      transition={shellSpring}
      className="w-[320px] rounded-[28px] bg-[#f3f3f3] p-4 shadow-[0_8px_30px_rgba(23,23,23,0.08)]"
    >
      <motion.button
        drag="y"
        dragDirectionLock
        dragElastic={0.12}
        dragConstraints={{ top: -220, bottom: 0 }}
        style={{ y }}
        onDragEnd={(_, info) => {
          const shouldOpen = info.offset.y < -72 || info.velocity.y < -420;
          setOpen(shouldOpen);
          y.set(0);
        }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full items-center justify-between rounded-full bg-[#fcfcfc] px-4 py-3"
      >
        <motion.span
          animate={{ opacity: open ? 0.65 : 1, y: open ? -2 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-sm text-[#171717]"
        >
          Pull to expand
        </motion.span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={shellSpring}
          className="text-accent"
        >
          ↓
        </motion.span>
      </motion.button>

      <motion.p
        initial={false}
        animate={{
          opacity: open ? 1 : 0.72,
          y: open ? 0 : 8,
          filter: open ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={{ duration: open ? 0.24 : 0.14, delay: open ? 0.05 : 0 }}
        className="px-2 pt-4 text-sm leading-6 text-[#6f6f6f]"
      >
        The panel commits only after real travel. Supporting copy settles after
        the shell.
      </motion.p>
    </motion.div>
  );
}
```

## Avoid

- one giant synchronized animation
- large delays before visible response
- motion that feels decorative but not informative
- perfectly uniform movement across unrelated layers
- interactions that lack weight, resistance, or stages

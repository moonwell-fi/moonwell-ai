---
name: dd-morphing-surfaces
description: Devouring Details morphing surface patterns for React and Framer Motion. Auto-load when prompts mention morphing surfaces, shared layout, layoutId, dock-to-form, nav-to-input, Dynamic Island, expanding pills, anchored transitions, or shell/content handoff.
argument-hint: [brief]
---

# DD Morphing Surfaces

Morphing surfaces should feel like one material changing state, not several unrelated layers moving at once.

## Core Principle

Reduce motion complexity inside the morph. The surface can reshape, but the inner layers should usually crossfade, clip, or hand off attention instead of fully traveling with the shell.

## Primary Rules

- anchor the morph to a stable edge or origin
- keep dynamic inner content from re-centering during the transition
- use `overflow: hidden` to let clipping do part of the work
- prefer crossfading inner layers over making everything resize together
- only use shared-layout motion where it improves continuity

## Container Strategy

When morphing between compact and expanded states:

- make the morphing shell `relative`
- hide overflow during width/height changes
- keep the incoming content absolutely positioned when you need it to stay anchored
- give morph targets fixed dimensions when a stable internal position matters

This is the right mental model:

- the shell morphs
- the content hands off
- clipping creates the satisfying response

This is the wrong mental model:

- the shell, labels, buttons, and fields all grow and reflow at once

## Parent/Child Component Structures

Morphing surfaces are best built as a clear two-layer architecture:

### Shell (parent)

- owns the morphing dimensions (`width`, `height`, `border-radius`)
- is always `position: relative` and `overflow: hidden`
- drives the layout animation via `layout` prop or explicit `animate={{ width, height }}`
- holds the `layoutId` if the shell itself is the shared element between routes or views
- never renders visible text or interactive controls directly — delegate to children

### Content (children)

- rendered as keyed children inside `AnimatePresence`
- each state (compact, expanded, etc.) is a separate child with its own `key`
- enter/exit via crossfade (`opacity` + optional `filter: blur`) — not positional animation
- positioned with `absolute inset-0` or explicit coordinates when anchoring matters
- never use `layout` on content children unless they need to participate in a shared layout group

### Why this split matters

When the shell and content are tangled in one component:

- resizing the shell forces reflow on every child, creating jitter
- exit animations fight with entering content for space
- the morph feels heavy because everything moves at once

When properly separated:

- the shell reshapes smoothly in one spring
- content crossfades cleanly inside the clipped area
- the interaction feels lightweight and deliberate

## Avoiding Transform Scale Issues

`transform: scale()` is the most common source of broken morphs. Follow these rules:

### Never scale the shell

- animate `width` and `height` (or use Framer Motion's `layout`) instead of `scale`
- `scale` distorts text, borders, shadows, and border-radius in ways that look wrong at every in-between frame
- Framer Motion's `layout` animation already uses FLIP (First-Last-Invert-Play) which avoids scale distortion by default — let it do its job

### Watch for implicit scale from `layout`

- when Framer Motion applies `layout` to a child that changes size, it internally uses scale + inverse-scale to animate
- this works well for simple boxes but breaks down for text nodes, inputs, and elements with `box-shadow`
- fix: add `layout="position"` to children that should only animate their position, not their size
- fix: use `layoutScroll` on scrollable containers to prevent layout animation from interfering with scroll position

### Border-radius under scale

- `border-radius` is not scale-aware — a `16px` radius on a scaled-down element looks proportionally larger
- Framer Motion compensates for this automatically on `layout`-animated elements, but only for the element itself, not nested children
- if you see radius distortion during a morph, check whether the radius is on a child that is being inversely scaled

### Shadows under scale

- `box-shadow` does not scale with transforms — a shadow that looks right at rest will look wrong mid-morph
- prefer animating shadow values directly alongside the morph, or apply shadows to a non-animated wrapper
- alternatively, use `filter: drop-shadow()` which does participate in the transform

### Input and text distortion

- scaled text looks blurry or aliased at non-integer scale factors
- inputs and textareas behave unpredictably when their apparent size differs from their layout size (cursor position, selection rects)
- always keep text and input elements at `scale(1)` — use the parent/child split to isolate them from the morphing shell

## Choreography

- transition immediately in response to user input
- avoid delaying the whole morph just to avoid overlap
- use small crossfades for inner content
- if a guiding mark or dot exists, let it move between states to direct attention

## Shared Layout Guidance

Shared layout animation works best for:

- a single accent dot or mark
- a small icon or focal indicator
- a compact piece of continuity between two states

Do not use it as an excuse to animate every child.

### `layoutId` best practices

- use a single `layoutId` per morphing surface — one continuity element, not many
- the `layoutId` element should be small and visually simple (dot, pill highlight, icon)
- avoid `layoutId` on text elements — font rendering differences between states cause flicker
- if two views share a `layoutId`, ensure both render in the same `AnimatePresence` tree

## Good Patterns

- dock morphing into a feedback form
- nav chip morphing into a text input
- compact status pill expanding into a detail sheet
- Dynamic Island-style width/height changes with controlled inner handoff

## Best Practices Summary

1. **Shell owns shape, children own content.** The morphing container animates dimensions; inner elements crossfade.
2. **Animate dimensions, not scale.** Use `width`/`height` or `layout`, never `transform: scale()` on the shell.
3. **Clip aggressively.** `overflow: hidden` on the shell lets you skip most exit positioning logic.
4. **One `layoutId` max.** A single continuity mark per morph. More than one creates visual noise.
5. **Crossfade, don't translate, inner content.** Content enters with `opacity` + `blur`, not `y` or `x` slides that fight the shell motion.
6. **Respect reduced motion.** Keep the same state ownership and component structure — just drop the interpolation.
7. **Test at low frame rates.** If the morph looks bad at 30fps, simplify — don't add more motion to compensate.
8. **Keep the reliability bar high.** System-like interactions need near-100% reliability. If a detail only works most of the time, cut it.

## Reliability Bar

Do not keep a morph detail if it only works most of the time.

- system-like interactions need a very high reliability bar
- if the detail is complementary and fragile, cut it
- "it mostly works" is not acceptable for this class of motion

## Technical Details

- Drive the morph from the shell container with `layout` or explicit width and height animation.
- Keep the shell `relative` and `overflow-hidden` so inner layers can clip during the handoff.
- Render compact and expanded content as separate keyed children inside `AnimatePresence`; this makes enter and exit timing explicit.
- Use `layoutId` only for a small continuity mark, such as an accent dot, pill highlight, or icon anchor.
- Respect reduced motion by keeping the same state ownership and simply dropping the interpolation.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const shellSpring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 };
const contentTween = { duration: 0.18, ease: [0.23, 0.88, 0.26, 0.92] };

export function MorphingFeedbackShell() {
  const [expanded, setExpanded] = React.useState(false);
  const reduceMotion = useReducedMotion();

  return (
    {/* Shell: owns morphing dimensions, clips children */}
    <motion.div
      layout
      transition={reduceMotion ? { duration: 0 } : shellSpring}
      className={[
        'relative overflow-hidden border border-border bg-card',
        'shadow-md',
        expanded
          ? 'h-[196px] w-[420px] rounded-xl p-4'
          : 'h-14 w-[220px] rounded-full p-2',
      ].join(' ')}
    >
      {/* Continuity mark: single layoutId element */}
      <motion.span
        layoutId="dd-active-dot"
        transition={reduceMotion ? { duration: 0 } : shellSpring}
        className="absolute left-4 top-4 h-2 w-2 rounded-full bg-mamo-yellow-500"
      />

      {/* Content: crossfade between keyed children */}
      <AnimatePresence initial={false} mode="sync">
        {expanded ? (
          <motion.form
            key="expanded"
            initial={
              reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(8px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(10px)' }}
            transition={reduceMotion ? { duration: 0 } : contentTween}
            className="absolute inset-x-4 bottom-4 top-10 grid content-between"
          >
            <textarea
              className="min-h-[96px] resize-none rounded-lg bg-background p-4 text-sm text-foreground outline-none"
              placeholder="What broke the interaction?"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
              <button className="rounded-full bg-mamo-yellow-500 px-4 py-2 text-sm text-foreground">
                Send
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.button
            key="collapsed"
            initial={reduceMotion ? false : { opacity: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={reduceMotion ? { duration: 0 } : contentTween}
            onClick={() => setExpanded(true)}
            className="flex h-full w-full items-center justify-between rounded-full px-4 text-sm text-foreground"
          >
            <span className="pl-4">Leave feedback</span>
            <span className="text-muted-foreground">⌘K</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

## Avoid

- animating the wrong parent so content re-centers jarringly
- using `transform: scale()` on the morphing shell
- resizing every child with the shell
- multi-layer motion that creates visual clutter
- fancy morphs with brittle caret or cursor behavior
- unreliable shared-element tricks that break under real usage
- `layoutId` on text elements (causes font rendering flicker)
- raw hex colors — use Mamo theme tokens

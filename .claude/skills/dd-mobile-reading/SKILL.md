---
name: dd-mobile-reading
description: Devouring Details mobile adaptation rules. Auto-load when prompts mention mobile versions, responsive collapse of editorial or prototype pages, single-column reading, inline media on mobile, or adapting DD layouts for phones.
argument-hint: [brief]
---

# DD Mobile Reading

Adapt the DD feel to mobile without flattening it into a generic single-column app page.

## Mobile Principles

- collapse to one reading column
- reduce chrome aggressively
- inline the media rail into the document flow
- keep the authored rhythm and generous spacing
- prefer visible labels over hover-dependent affordances

## Typography

- reduce desktop prose, but keep it spacious
- a good baseline is around `16px` body text with tall line height
- section labels should stay quiet and monospaced
- preserve one strong display moment if the page needs it, but scale it down materially

## Layout

- embedded media blocks should remain softly framed and rounded
- cards should stay roomy, not compressed into dense lists
- keep the main CTA full-width or nearly full-width
- avoid sticky chrome unless it serves a clear purpose

## Controls

- icon buttons can remain circular
- hidden desktop labels should become visible, inline, or unnecessary
- touch targets should become slightly more forgiving without changing the overall calmness

## Motion

- simplify hover-only behaviors
- keep blur/fade/translate motion where it still reads well on mobile
- preserve tactile interactions, but do not overload the viewport

## Technical Details

- Collapse multi-column DD layouts into a single authored column, but preserve section spacing and framed media blocks.
- Reuse the same content components as desktop. Change only layout, control visibility, and media placement at the breakpoint.
- Move desktop rail content inline after the relevant paragraph or section instead of pushing it to the bottom of the page.
- Keep mobile motion quick and shallow. Small fades and slides read well; large travel distances and delayed choreography do not.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export function DDMobileReading({
  title,
  summary,
  media,
}: {
  title: string;
  summary: string;
  media: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-5 py-6 text-[#171717]">
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#6f6f6f]">
        Mobile chapter
      </p>
      <h1 className="text-[2.4rem] leading-[1.02] tracking-[-0.05em]">
        {title}
      </h1>
      <p className="text-[16px] leading-8 text-[#171717]">{summary}</p>

      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.23, 0.88, 0.26, 0.92] }}
        className="overflow-hidden rounded-[24px] bg-[#f3f3f3] p-3 shadow-[0_8px_24px_rgba(23,23,23,0.05)]"
      >
        {media}
      </motion.div>

      <button className="w-full rounded-full bg-[#ff670d] px-6 py-4 text-base font-medium text-white">
        Continue reading
      </button>
    </div>
  );
}
```

## Avoid

- shrinking the desktop layout mechanically
- preserving side rails that no longer fit
- overpacking content above the fold
- replacing the DD feel with standard mobile product UI patterns

---
name: dd-editorial-chapter
description: Devouring Details editorial chapter patterns. Auto-load when prompts mention essays, long-form reading, docs-like chapters, teaching pages, article layouts, reading lanes, sticky media rails, or prose-first chapters in the DD style.
argument-hint: [brief]
---

# DD Editorial Chapter

Build a reading-first surface with supporting media, not a docs portal and not a blog theme.

## Base System

- background: `#fcfcfc`
- primary text: `#171717`
- secondary text: `#6f6f6f`
- accent color: `#2474da`
- body copy on desktop should land near `20px / 38px`
- section labels should use a narrow monospaced voice around `14px / 20px`

## Layout

- keep one clear reading lane
- place a second rail beside it for media, diagrams, or video on desktop
- let the page be long; do not compress it to feel app-like
- keep top utility chrome small and unobtrusive
- put next/previous navigation at the bottom

## Typography

- paragraphs should feel calm, spacious, and deliberate
- hierarchy should come from spacing and contrast as much as size
- headings should not shout
- inline code and links should integrate into the prose rather than looking like a separate docs system

## Media

- media should support the concept being taught
- diagrams should be sparse, thin, and geometric
- use soft framed media shells with restrained shadows
- the media rail can remain visible while the text scrolls

## Interaction

- hover should reveal supporting detail or labels
- focus cues should be clean and obvious
- the accent color should mark the important active state, not every interactive item

## Tone

- thoughtful practitioner voice
- short, direct paragraphs
- no hype
- references and footnotes are welcome when useful

## Technical Details

- Use a two-column shell on desktop with a fixed reading measure and a sticky media rail.
- Render prose blocks as real semantic content: `article`, `section`, `figure`, and `aside`, not card grids pretending to be text.
- Keep the media rail stateful and interactive, but avoid letting its controls dominate the reading lane.
- Animate the rail or chapter transitions lightly. The prose itself should feel stable once it is in view.

### React + Framer Motion Sample

```tsx
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export function DDEditorialChapter({
  sections,
  rail,
}: {
  sections: Array<{ id: string; title: string; body: string }>;
  rail: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-10 lg:grid-cols-[minmax(0,44rem)_minmax(320px,1fr)]">
      <article className="space-y-16">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-5">
            <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#6f6f6f]">
              Principle
            </p>
            <h2 className="text-4xl tracking-[-0.04em] text-[#171717]">
              {section.title}
            </h2>
            <p className="max-w-[38rem] text-[20px] leading-[1.9] text-[#171717]">
              {section.body}
            </p>
          </section>
        ))}
      </article>

      <motion.aside
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45, ease: [0.23, 0.88, 0.26, 0.92] }}
        className="lg:sticky lg:top-8 lg:self-start"
      >
        <div className="rounded-[28px] bg-[#f3f3f3] p-4 shadow-[0_8px_32px_rgba(23,23,23,0.05)]">
          {rail}
        </div>
      </motion.aside>
    </div>
  );
}
```

## Avoid

- heavy sidebars
- docs-site chrome
- giant banner headers
- dense component spacing
- loud color usage

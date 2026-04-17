---
name: dd-landing-page
description: Devouring Details landing page patterns. Auto-load when prompts mention a landing page, marketing page, hero, chapter preview grid, logo cloud, testimonials, FAQ, or a single oversized accent CTA in the DD style.
argument-hint: [brief]
---

# DD Landing Page

Design the page like a private field manual being sold to a design-aware audience, not a startup template.

## Base System

- canvas: `#fcfcfc`
- raised surfaces: `#f8f8f8`
- card fill: `#f3f3f3`
- primary text: `#171717`
- secondary text: `#6f6f6f`
- accent color: `#2474da`
- card radius: `12px`
- pill radius: `9999px`

## Typography

- body copy should feel authored and roomy, not app-default
- use quiet monospaced section labels around `14px / 20px`
- keep large type moments rare and strategic
- when using a hero CTA, make it oversized and slightly tight-tracked

## Layout

- build large vertical sections with generous breathing room
- keep the hero restrained: strong copy, minimal chrome, one supporting media artifact
- use roomy 2-column card grids on desktop
- testimonials, logo clouds, chapter previews, and FAQ accordions fit this style well

## Cards

- soft gray fill, minimal border treatment
- image or illustration first, label second
- keep copy sparse
- make them feel like artifacts from a private archive, not feature cards

## CTA

- include one major CTA moment
- accent background, white text, full pill shape
- make it the most emphatic object on the page
- avoid multiple competing primary CTAs

## Motion

- prefer blur/fade/translate reveals over flashy motion
- hover should add clarity, not spectacle
- use soft transitions and swift easing

## Technical Details

- Build landing pages from vertical content sections, not a single hero blob with stacked marketing widgets.
- Keep chapter cards data-driven so Claude can scale the grid without changing the visual system.
- Treat the accent CTA as its own component with a dedicated size scale and motion treatment instead of a generic button variant.
- Animate section entry per block or per card. Do not cascade a giant page-wide motion effect across unrelated sections.

### React + Framer Motion Sample

```tsx
'use client';

import { motion } from 'framer-motion';

const reveal = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: index * 0.06,
      duration: 0.45,
      ease: [0.23, 0.88, 0.26, 0.92],
    },
  }),
};

export function DDLandingPage({
  chapters,
}: {
  chapters: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="mx-auto max-w-[1200px] space-y-20 px-6 py-10">
      <div className="max-w-[44rem] space-y-6">
        <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#6f6f6f]">
          Devouring Details
        </p>
        <h1 className="text-6xl leading-[0.98] tracking-[-0.05em] text-[#171717]">
          Motion-literate product essays for design engineers.
        </h1>
        <motion.button
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="rounded-full bg-accent px-8 py-4 text-lg font-medium text-white"
        >
          Read the manual
        </motion.button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {chapters.map((chapter, index) => (
          <motion.article
            key={chapter.title}
            custom={index}
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            className="rounded-[24px] bg-[#f3f3f3] p-6 shadow-[0_8px_32px_rgba(23,23,23,0.05)]"
          >
            <p className="font-mono text-[13px] text-[#6f6f6f]">Chapter</p>
            <h2 className="mt-3 text-2xl text-[#171717]">{chapter.title}</h2>
            <p className="mt-4 text-[17px] leading-8 text-[#6f6f6f]">
              {chapter.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
```

## Avoid

- gradients as the main visual identity
- oversized marketing badges everywhere
- dense nav bars
- dashboard framing
- purple accents
- generic SaaS hero copy

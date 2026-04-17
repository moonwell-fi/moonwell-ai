---
name: dd-resource-page
description: Devouring Details resource and reference patterns. Auto-load when prompts mention resource pages, workflow notes, code snippets, bookmarks, libraries, FAQ content, cheat sheets, or reference-heavy editorial pages in the DD style.
argument-hint: [brief]
---

# DD Resource Page

Design the page like a compact reference manual: practical, quiet, and slightly opinionated.

## Base System

- background: `#fcfcfc`
- card/background step: `#f3f3f3`
- text: `#171717`
- muted text: `#6f6f6f`
- accent orange: `#ff670d`
- standard card radius: `12px`

## Layout

- keep the editorial reading lane
- break the page into short, useful sections
- allow many subsections, but avoid making it feel fragmented
- a secondary media rail is optional; use it only when it helps

## Content Style

- practical over theoretical
- terse when useful
- honest and specific
- suitable for workflows, habits, snippets, references, and tools

## Components

- use compact section blocks
- let code snippets feel integrated and low-contrast
- link lists and reference groups should remain clean and airy
- shortcut or keyboard elements can use small restrained keycaps

## Visual Behavior

- preserve the grayscale base
- use orange only to mark active emphasis, important actions, or key annotations
- small monospaced section labels work well here

## Technical Details

- Model resource pages as stacked reference sections with optional code blocks, not as dashboard widgets.
- Keep snippets, bookmarks, and shortcut groups in a shared card primitive so spacing stays consistent across mixed content types.
- Use motion only for reveal, filtering, or lightweight section expansion. Reference content should remain fast to scan.
- If the page has navigation, use anchors or a compact table of contents instead of app-like side navigation chrome.

### React + Framer Motion Sample

```tsx
'use client';

import { motion } from 'framer-motion';

export function DDResourcePage({
  sections,
}: {
  sections: Array<{ label: string; title: string; code?: string }>;
}) {
  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-6 py-10">
      {sections.map((section, index) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ delay: index * 0.04, duration: 0.35 }}
          className="rounded-[24px] bg-[#f3f3f3] p-5"
        >
          <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#6f6f6f]">
            {section.label}
          </p>
          <h2 className="mt-3 text-2xl text-[#171717]">{section.title}</h2>

          {section.code ? (
            <pre className="mt-4 overflow-x-auto rounded-[18px] bg-[#171717] px-4 py-3 text-sm text-[#f8f8f8]">
              <code>{section.code}</code>
            </pre>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#6f6f6f]">
              <kbd className="rounded-md bg-white px-2 py-1 text-[#171717]">
                ⌘K
              </kbd>
              <span>Quick access pattern</span>
            </div>
          )}
        </motion.section>
      ))}
    </div>
  );
}
```

## Avoid

- card overload
- dashboard KPI treatment
- flashy callouts
- oversized illustrations with no instructional purpose
- loud docs-site navigation patterns

# Surfaces

## 1. Marketing Landing Page

Use this surface when the user wants a public-facing sales or introduction page.

### Composition

- large vertical sections
- restrained hero with high-quality copy
- testimonials, logo clouds, chapter previews, and FAQ accordions are acceptable
- card grids should stay roomy and editorial, not feel like pricing tiles from a startup template

### Visual behavior

- keep the Moonwell token palette — mostly warm-dark neutrals with accent moments using `bg-accent` (Moonwell Blue)
- use one major CTA moment per viewport
- chapter preview cards should feel like artifact previews from a private archive

### Do

- use quiet illustration or recorded-demo framing
- mix copy blocks with preview cards
- keep navigation minimal and polite

### Do not

- fill the page with gradients or decorative sections
- use oversized badges everywhere
- turn the hero into a generic "build faster" marketing block

## 2. Editorial Chapter

Use this for principle-style pages and other long-form instructional surfaces.

### Composition

- a left reading lane with generous prose spacing
- a second rail for image, diagram, or video
- small top utility controls
- a subtle chapter locator or sidebar on desktop
- long pages are expected; do not over-compress

### Typography

- section markers are `text-xs font-mono uppercase tracking-wider text-muted`
- paragraphs sit at roughly `text-lg leading-relaxed` to `text-xl leading-relaxed`
- code snippets should be woven into the narrative instead of split into isolated docs sections

### Behavior

- media rail can stay visible while text scrolls
- inline references should feel quiet but intentional
- next/previous navigation belongs at the bottom, not in heavy page chrome

## 3. Prototype Chapter

Use this when the surface teaches an interaction through a live demo.

### Composition

- same reading lane as editorial pages
- demo rail is more prominent and should remain immediately testable
- controls above the demo are small round toggles or pills
- reveal-source, reload, fullscreen, and open-standalone style controls are appropriate

### Behavior

- emphasize tactile interaction
- use hover, proximity, drag, scroll, and velocity cues
- demo rail should look neutral enough to frame the motion itself

### Implementation guidance

- build the interaction first, then trim the chrome
- use `bg-card` backgrounds so the animated element carries the attention
- if the demo explains a motion principle, show the effect clearly without extra ornament

## 4. Resource Chapter

Use this for utility-heavy pages like workflow notes, bookmarks, libraries, or code references.

### Composition

- keep the editorial lane
- use more short sections
- let each section feel like a compact note card inside the article flow
- links, shortcuts, and references can appear more frequently than on principles pages

### Tone

- practical and honest
- terse when useful
- a little opinionated, never fluffy

## 5. Mobile Adaptation

When adapting any DD-inspired surface to mobile:

- collapse to a single reading column
- reduce top chrome
- inline the media rail into the document flow
- keep the accent CTA full-width or near full-width
- reduce large display sizes, but preserve the authored feel
- prefer visible labels over hover-only affordances

Observed mobile behavior:

- first reading paragraph drops to `text-base` with tall line height
- embedded cards and demos remain rounded (`rounded-lg`) and softly framed
- desktop rail concepts become stacked panels

## 6. Shared Interaction Recipes

Use these patterns across surfaces when they fit the task:

- reveal labels on hover
- hide secondary chrome until needed
- use the accent color for the active marker, not every control
- use blur-and-fade entrances for soft onboarding
- use springs or interpolated transforms for interactive demos

## 7. Build Checklist

Before finishing, check:

- Does the page feel authored rather than assembled from components?
- Is the palette using Moonwell tokens consistently (no raw hex values)?
- Is the accent color used with discipline?
- Is the reading rhythm generous enough?
- Are controls compact and calm?
- Does motion explain intent?
- On mobile, is the layout still readable without side rails?

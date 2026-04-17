# Foundation

## Design Thesis

Devouring Details is not styled like a typical product app. It feels closer to a highly authored reference manual with embedded software.

Design for:

- clarity over density
- atmosphere over decoration
- demonstration over explanation-only copy
- motion as feedback for intent
- quiet confidence instead of loud branding

## Token Mapping

When building DD-style surfaces in this project, map DD concepts to Moonwell's design tokens (defined in `packages/web/src/app/globals.css` via Tailwind v4's `@theme inline` block — see `packages/web/AGENTS.md`). Do not introduce standalone hex values.

### Dark-only constraint

Moonwell web has no light mode. DD's classic grayscale-on-light reading surface must adapt to Moonwell's warm dark palette. Neutrals come from `--background` (`#0f0d0e`) and `--card` (`#1d1b1c`); contrast stays restrained.

### Colors

Map DD roles to Moonwell tokens:

- background: `bg-background` (`#0f0d0e` — warm dark)
- raised surface / soft card: `bg-card` (`#1d1b1c`)
- hover card surface: `bg-card-hover` (`#332e30`)
- subtle stroke: `border-border` (`#3b3438`)
- secondary text: `text-muted` (`#887982`)
- primary text: `text-foreground` (`#e5e2e3`)
- **Accent**: `bg-accent` / `text-accent` (`#2474da`, Moonwell Blue) — one strong accent moment per screen
- accent wash: `bg-accent/10` for light washes
- success/positive: `text-green` (`#42b34d`)
- purple (rare, special-state): `text-purple` (`#ac10f4`)

Do not use raw hex values. If a specific DD color has no Moonwell equivalent, use the nearest semantic token and note the mapping in a comment.

### Radius

Use Tailwind's default radius scale:

- `rounded-sm`: tiny inline keys or chips
- `rounded-md`: compact buttons and controls
- `rounded-lg`: cards, media shells, and demo containers
- `rounded-xl`: larger panels
- `rounded-full`: pill buttons and circular controls

### Shadow

Keep shadows soft and shallow. The DD aesthetic rarely uses deep elevation. Standard Tailwind `shadow-xs`, `shadow-sm`, `shadow-md` are sufficient. Avoid glowing drop shadows unless the accent moment explicitly calls for it.

## Typography

### Families

- primary sans: `font-sans` — Geist Sans (`--font-geist-sans`, defined in `globals.css`)
- monospace: `font-mono` — Geist Mono (`--font-geist-mono`, defined in `globals.css`)
- no handwritten accents — substitute with `font-mono` italic if an annotation feel is needed

### Sizes

Follow Tailwind's type scale:

- section labels: `text-xs` or `text-sm`, `font-mono`, `text-muted`, `uppercase tracking-wider`
- body reading copy: `text-lg` or `text-xl` with generous `leading-relaxed`
- UI default text: `text-sm` or `text-base`
- big CTA: `text-3xl` to `text-5xl`, `tracking-tight`
- mobile CTA: `text-xl` to `text-2xl` with slightly tighter tracking

### Type behavior

- body copy is left-aligned, roomy, and unhurried
- large text moments are rare and strategic
- headings do not shout; hierarchy often comes from spacing and casing, not huge size jumps
- code blocks are visually quiet and integrated into the prose instead of looking like docs-site chrome

## Spacing Rhythm

Use Tailwind's 4px-based spacing scale. The DD pages feel hand-spaced, so prefer generous gaps:

- `gap-2` (8px) for tiny control gaps
- `p-4` (16px) for chip padding, card insets, stacked media padding
- `gap-6` (24px) for standard section breathing room
- `gap-8` (32px) and `gap-12` (48px) for major block separation
- very long pages should breathe; do not compress article sections to fit more above the fold

## Core Component Language

### Cards

- use `bg-card` with `rounded-lg`
- minimal border treatment (`border border-border`)
- usually image or illustration first, label second
- keep text sparse

### Controls

- icon buttons are usually compact circles or rounded pills
- inactive state uses `text-muted` / `bg-card`
- active or focal states switch to accent (`bg-accent`)
- focus rings should be clean and obvious, using `focus-visible:outline-accent`

### CTA

- reserve one oversized pill CTA per page
- `bg-accent`, `text-white`, full pill radius
- strong horizontal padding with a second visual element aligned at the right edge when possible

### Media frames

- use `bg-card` shells with a thin `border border-border`
- prefer contained media with generous empty space around it
- interactive demos can occupy their own rail and remain visible while the text scrolls

## Motion

### Curves and timing

- primary swift easing: `cubic-bezier(0.23, 0.88, 0.26, 0.92)`
- default micro transitions are short: around `150ms`
- blur-plus-fade entrances are used for gentle reveals
- spring motion is tuned per interaction; do not enforce a rigid global spring system

### Motion behavior

- hover reveals labels or clarifies targets
- scrolling and pointer motion often affect nearby elements through proximity logic
- velocity matters; the site favors motion that settles naturally rather than snapping
- blur is used as a transitional material, not as a permanent style layer
- always gate non-essential motion behind `prefers-reduced-motion`

## Illustration and Ornament

- use hairline network diagrams, minimaps, and thin-axis visuals
- prefer sparse geometry over decorative blobs
- the accent dot mark can anchor an illustration or navigation cue
- illustrations should support the concept being taught, not act as generic hero art

## Content Tone

- speak like a thoughtful practitioner explaining craft
- use short, direct paragraphs
- avoid hype, startup slogans, and vague product language
- references, footnotes, and inline links are welcome when they support the idea

## Anti-Patterns

Do not introduce these unless the user explicitly asks:

- dark glossy dashboards
- neon gradients
- thick borders everywhere
- stacked KPI cards as the main visual language
- default Tailwind typography without refinement
- raw hex colors that bypass the Moonwell token system
- overly playful illustrations
- crowded nav systems
- introducing a second competing accent color on the same surface

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

When building DD-style surfaces inside Mamo, map DD concepts to Mamo's existing design tokens. Do not introduce standalone hex values — use the project's CSS variables and Tailwind theme.

### Colors

Map DD roles to Mamo tokens:

- background: `bg-background` (CSS `--background`)
- raised background: `bg-secondary` (CSS `--secondary`)
- soft card background: `bg-card` (CSS `--card`)
- subtle stroke: `border-border` (CSS `--border`)
- secondary text: `text-muted-foreground` (CSS `--muted-foreground`)
- primary text: `text-foreground` (CSS `--foreground`)
- accent: use `bg-mamo-yellow-500` (`#f0fe9b`) as the DD accent in place of orange — it is Mamo's primary brand color
- accent wash: `bg-mamo-yellow-500/10` for light washes
- accent strong: `bg-mamo-yellow-400` for higher-contrast accent moments
- success/positive states: `text-day-forest-500` / `bg-day-forest-50`
- error/destructive states: `text-destructive` (CSS `--destructive`)

Do not use raw hex values. If a specific DD color has no Mamo equivalent, use the nearest semantic token and note the mapping in a comment.

### Radius

Use the project's radius scale from `globals.css`:

- `rounded-sm`: `calc(var(--radius) - 4px)` — tiny inline keys or chips
- `rounded-md`: `calc(var(--radius) - 2px)` — compact buttons and controls
- `rounded-lg`: `var(--radius)` (10px) — cards, media shells, and demo containers
- `rounded-xl`: `calc(var(--radius) + 4px)` — larger panels
- `rounded-full`: pill buttons and circular controls

### Shadow

Use the project's shadow tokens:

- subtle depth: `shadow-slider` (defined in `@theme`)
- component glow: `drop-shadow-component` (orange-tinted, defined in `@theme`)
- standard elevation: `shadow-xs`, `shadow-md`, `shadow-lg` from Tailwind

Keep shadows soft and shallow. The DD aesthetic rarely uses deep elevation.

## Typography

### Families

- primary sans: `font-sans` — GT-America (defined in `globals.css`)
- monospace: `font-mono` — GT-America-Mono (defined in `globals.css`)
- no handwritten accents — Mamo does not ship Caveat; omit or substitute with `font-mono` italic if an annotation feel is needed

### Sizes

Follow Tailwind's type scale, biased toward the sizes used across Mamo:

- section labels: `text-xs` or `text-sm`, `font-mono`, `text-muted-foreground`, `uppercase tracking-wider`
- body reading copy: `text-lg` or `text-xl` with generous `leading-relaxed`
- UI default text: `text-sm` or `text-base`
- big CTA: `text-3xl` to `text-5xl`, `tracking-tight`, on accent background
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
- inactive state uses `text-muted-foreground` / `bg-secondary`
- active or focal states switch to accent (`bg-mamo-yellow-500`)
- focus rings should be clean and obvious, using `ring-ring`

### CTA

- reserve one oversized pill CTA per page
- accent background (`bg-mamo-yellow-500`), `text-foreground`, full pill radius
- strong horizontal padding with a second visual element aligned at the right edge when possible

### Media frames

- use `bg-secondary` shells with a thin `border border-border`
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
- raw hex colors that bypass the Mamo token system
- overly playful illustrations
- crowded nav systems

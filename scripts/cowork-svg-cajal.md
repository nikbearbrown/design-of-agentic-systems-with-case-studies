# Cowork Prompt — CAJAL SVG Generator

Reads `*-cajal.md` files from `pantry/`, generates static SVG infographics in `images/`, converts to 300 DPI PNG. Does not modify chapter files.

---

## What this does

For each `*-cajal.md` file in `pantry/`:
- Parses every figure recommendation (SCOPE blocks, figure entries, ranked candidates)
- Generates a static SVG per figure following the Brutalist D3 SVG Style Guide
- Embeds SVG metadata: book, chapter, figure title, description, figure type, source file, generation date
- Saves to `images/{chapter-slug}-fig-{NN}.svg`
- Converts all new SVGs to 300 DPI PNG via `node SCRIPTS/svg-to-png.mjs`
- Logs all activity to `pantry/cajal-svg-log.md`

**Does NOT** modify chapter files. **Does NOT** insert markdown references. **Does NOT** update Prompts sections. Those operations belong to the enrichment pass.

- Do not render any CAJAL identifier, chapter slug, figure number, filename, source-file path, book title, or other organizational metadata as visible text inside the SVG. All such identifiers belong only in the `<metadata>` block and the HTML comment header — both non-rendering by SVG spec. The "Source / ALL CAPS identifier" typography role in the Style Guide is reserved for legitimate external data attribution only (e.g., "Source: Bureau of Labor Statistics 2024") when the figure displays sourced data — never for internal CAJAL, production, chapter, or figure identifiers. The visible content of the SVG is the figure itself: title, subtitle, labels, axes, captions tied to the figure's pedagogical content. Nothing else.


---

## SETUP — run once before processing any file

1. Read `metadata.yaml` in full. Extract: `title`, `author`, `date`. Derive `book-slug`: lowercase, spaces and punctuation replaced with hyphens (e.g., `"Brutalist D3 × Claude"` → `brutalist-d3-claude`).
2. Confirm directories exist: `pantry/`, `images/`, `SCRIPTS/`. If `images/` does not exist, create it.
3. Confirm `node` is available: `node --version`. If it fails, stop and report.
4. Confirm `sharp` is installed: `node -e "import('sharp').then(() => console.log('ok'))"`. If it fails, run `npm install` from the book root before proceeding.
5. Read `NEU/CLAUDE.md` and `NEU/DESIGN.md` in full. Every SVG generated must conform to both. If these paths do not exist, check `brutalist/CLAUDE.md` and `brutalist/DESIGN.md`. Do not proceed without reading them.
6. Build the cajal file list: all files matching `pantry/*-cajal.md`, sorted by filename.

---

## PASS 1 — Parse cajal.md files

For each `*-cajal.md` file:

### 1. Extract the chapter slug

Derived from filename: everything before `-cajal.md`.

```
05-confounders-cajal.md  →  chapter slug: 05-confounders
07-comparison-charts-cajal.md  →  chapter slug: 07-comparison-charts
```

### 2. Parse figure entries

Scan the file for figure recommendations. A figure entry is any of the following:
- A CAJAL SCOPE block (`[S - SPECIFICATION]`, `[C - CONTENT]`, etc.)
- A ranked figure entry (Critical / Important / Supplementary)
- A figure labeled with `Figure N.N` or `fig-NN`
- A `/scope` output block with a concept description

For each figure entry, extract:

| Field | Source | Notes |
|---|---|---|
| `figure-number` | Sequence within file | 1, 2, 3... in order of appearance |
| `figure-title` | First line of C (Content) or concept statement | Max 60 chars |
| `figure-slug` | Slugified `figure-title` | Lowercase, hyphens, max 40 chars |
| `figure-type` | Stated type or inferred from content | See type list below |
| `content` | Full C block or concept description | Used for SVG generation |
| `organization` | O block if present | Spatial layout notes |
| `exclusions` | E block if present | What must not appear |
| `priority` | Critical / Important / Supplementary | If ranked |

### 3. Construct output filename

```
images/{chapter-slug}-fig-{NN}.svg
```

Where `NN` is the figure number, zero-padded to two digits.

```
05-confounders-fig-01.svg
05-confounders-fig-02.svg
07-comparison-charts-fig-01.svg
```

### 4. Collision check

If a file already exists at `images/{chapter-slug}-fig-{NN}.svg` or `images/{chapter-slug}-fig-{NN}.png`, **skip** that figure and log: `SKIPPED (already exists): {filename}`.

---

## PASS 2 — Generate SVG

For each parsed figure, generate a complete static SVG.

### Generation rule: produce real content

Generate SVG that visually represents the concept described in the figure entry. Every label, axis value, node name, flow stage, and annotation is inferred from the content description. **No placeholder text. No `[fill in]` strings. No empty boxes.** If the description does not provide enough specifics for a label, derive a plausible, discipline-appropriate value.

### Figure type → rendering approach

| Figure type | SVG rendering approach |
|---|---|
| Process flowchart | Horizontal left-to-right flow. Labeled rectangular nodes. Arrows (→) for progression, perpendicular bars (⊣) for blocking. |
| Comparison panels | Two side-by-side panels with shared axis or dividing line. Consistent label positions on both sides. |
| Timeline / progression | Horizontal axis. Labeled stage markers above or below the line. Time or sequence labels on axis. |
| Hierarchy / taxonomy | Top-down tree. Parent nodes above children. Labeled connecting lines. |
| Systems diagram | Node-and-edge layout. Labeled nodes (circles or rectangles). Labeled edges (thin lines with arrows). |
| Cycle diagram | Circular arrangement of labeled stage boxes. Curved arrows connecting each stage. Return arrow closing the loop. |
| Statistical / quantitative | Vertical bar chart. Y-axis starts at zero. Bars directly labeled with values. X-axis category labels. |
| Structural schematic | Layered or exploded view. Numbered component labels with leader lines. |
| Conceptual map | Connected concept nodes. Short relationship labels on connecting lines. |
| Annotated example | Central subject. Callout lines to labeled components. |

### SVG metadata block

Every generated SVG must include the following, in this order, immediately after the opening `<svg>` tag:

```xml
<title>{figure-title} — {chapter-slug}</title>
<desc>{concept description, max 280 chars}</desc>
<metadata>
  <cajal:figure
    xmlns:cajal="https://bearbrown.ai/cajal/1.0"
    book="{book-title from metadata.yaml}"
    book-slug="{book-slug}"
    chapter="{chapter-slug}"
    figure-number="{NN}"
    figure-title="{figure-title}"
    figure-slug="{figure-slug}"
    figure-type="{figure-type}"
    priority="{Critical|Important|Supplementary|unranked}"
    author="{author from metadata.yaml}"
    date-generated="{ISO 8601 date}"
    source-file="pantry/{chapter-slug}-cajal.md"
  />
</metadata>
```

Also add a human-readable comment at the top of the file:

```xml
<!-- 
  {figure-title}
  Book: {book-title}
  Chapter: {chapter-slug}
  Figure: {NN}
  Type: {figure-type}
  Generated: {ISO date}
  Source: pantry/{chapter-slug}-cajal.md
-->
```

Save the complete SVG to `images/{chapter-slug}-fig-{NN}.svg`.

---

## PASS 3 — PNG conversion

After all SVGs are generated, run:

```bash
node SCRIPTS/svg-to-png.mjs
```

Converts every `images/**/*.svg` to 300 DPI PNG. Idempotent — skips PNGs newer than their SVG source.

---

## PASS 4 — Log

Create or append to `pantry/cajal-svg-log.md`:

```markdown
## Run: {ISO date and time}

### {chapter-slug}-cajal.md
- figures found: {N}
- SVGs generated: {N}
- skipped (existing): {N}

| File | Figure title | Type | Status |
|---|---|---|---|
| 05-confounders-fig-01.svg | {title} | {type} | generated |
| 05-confounders-fig-02.svg | {title} | {type} | skipped |

---
```

After all files, append:

```markdown
## Summary
Total cajal.md files processed: {N}
Total figures parsed: {N}
Total SVGs generated: {N}
Total skipped (already exist): {N}
PNG conversion: run completed
```

---

## SVG Style Guide

Every generated SVG must follow these rules exactly.

### Geometry

- `viewBox="0 0 700 420"` unless figure content requires more height; add in 60px increments (480, 540, 600).
- No `width` or `height` attribute on `<svg>`.
- 32px margin all sides.
- Labels on 8px grid.
- No rounded corners (`rx="0"` on all rectangles).
- No gradients. No shadows. No glassmorphism. No neumorphism.

### Color palette

| Token | Hex | Role | Use |
|---|---|---|---|
| `--color-white` | `#FFFFFF` | Canvas | SVG background |
| `--color-ink` | `#2a1a0e` | Primary text | Headings, axes, structural strokes, body copy |
| `--color-red` | `#C8102E` | Primary accent | Primary data series, brand emphasis |
| `--color-secondary` | `#545454` | Supporting text | Captions, axis labels, source lines |
| `--color-border` | `#D4D4D4` | Hairlines | Grid lines, dividers, box borders |
| `--color-ochre` | `#C8860E` | Decorative accent | Callout borders, figure label accents — never data encoding |
| `--color-fill` | `#F5F5F5` | Chart area | Plot region background |

Use these hex values directly in SVG attributes. Do not use CSS custom properties in static SVG — write the hex value.

**Data encoding:** `#C8102E` (red) for the primary or only highlighted data category. `#2a1a0e` (ink) or `#787878` / `#ADADAD` (neutral grays) for additional categories when needed. Maximum two data-encoding colors before adding secondary encodings (patterns, direct labels, or figure decomposition). `#C8860E` (ochre) is never a data-encoding color.

### Typography

| Role | Font family | Size | Weight | Fill |
|---|---|---|---|---|
| Figure title / display | `'EB Garamond', 'Garamond', Georgia, serif` | 14 | 400 | `#2a1a0e` |
| Body / item label | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 12 | 400 | `#2a1a0e` |
| Caption / sub-label | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 11 | 400 | `#545454` |
| Axis tick labels | `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` | 11 | 400 | `#545454` |
| Source / ALL CAPS identifier | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 10 | 400 | `#545454` |

- ALL CAPS source lines: `letter-spacing="0.08em"`
- Do not use Arial, Helvetica, Roboto, or system-ui — always specify the full fallback chain.
- EB Garamond for figure titles and section headers only. JetBrains Mono for axis ticks and numeric annotations only.

### Strokes

- Box borders: `stroke="#D4D4D4"` `stroke-width="1"` `fill="#FFFFFF"`
- Chart area border: `stroke="#D4D4D4"` `stroke-width="0.75"` `fill="#F5F5F5"`
- Arrows: `stroke="#2a1a0e"` `stroke-width="1.5"` `fill="none"` with `marker-end`
- Dashed rules: `stroke-dasharray="4 3"` `stroke="#D4D4D4"` `stroke-width="0.75"`
- Reference lines: `stroke-dasharray="5 4"` `stroke-width="0.75"`

### Arrowhead — define once in `<defs>`

```xml
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6"
          refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#2a1a0e"/>
  </marker>
</defs>
```

### Layout defaults

- Chart margins: top 48 / right 40 / bottom 56 / left 64.
- Wide-label charts: top 48 / right 40 / bottom 56 / left 160.
- Chart area (plot region): `fill="#F5F5F5"`, not white.

### Accessibility

Every SVG must have `role="img"`, `aria-labelledby` pointing to the `<title>` element ID, and both `<title>` and `<desc>` populated.

```xml
<svg viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="fig-title-{NN}">
  <title id="fig-title-{NN}">{figure-title}</title>
  <desc>{concept description}</desc>
  ...
```

---

## Order of operations

1. SETUP — read metadata, confirm tools, read CLAUDE.md and DESIGN.md
2. PASS 1 — parse all cajal.md files, build figure queue
3. PASS 2 — generate SVGs one by one; skip existing files
4. PASS 3 — run `node SCRIPTS/svg-to-png.mjs`
5. PASS 4 — write cajal-svg-log.md

Process cajal.md files in filename order. On error generating any single figure, log the error and continue to the next.

---

## What NOT to do

- Do not modify any file in `chapters/`
- Do not insert markdown image references into chapter files
- Do not add entries to any chapter's Prompts section
- Do not overwrite existing SVGs or PNGs — log and skip
- Do not use placeholder text, `[fill in]` strings, or empty labeled boxes — generate real content from the figure description
- Do not use CSS custom properties in static SVG — write hex values directly
- Do not use Arial, Helvetica, Roboto, or system-ui
- Do not use `#C8860E` (ochre) as a data-encoding color — decorative use only
- Do not use `#C8102E` (red) for more than one data category in any single figure
- Do not use a white (`#FFFFFF`) chart area — use `#F5F5F5` for the plot region
- Do not use gradients, shadows, rounded corners, or 3D effects
- Do not use rainbow color palettes
- Do not use red to encode danger, negative values, or alert states
- Do not skip figures marked Supplementary — generate all ranked figures unless the file already exists
# Cowork or Codex Prompt — Chapter Enrichment: Tables and Figures (Bear Brown)

The CLAUDE.md for D3 guidelines and the DESIGN.md for visual guidelines are here `/Users/bear/Documents/Cowork or Codex/bear-textbooks/brutalist`

Overwrite any existing graphics.

## What this does
Iterates through every file in `chapters/` and enriches it in place:
- Converts `<!-- → [TABLE:` comments into rendered markdown tables
- Converts `<!-- → [IMAGE:` / graphic comments into:
  - A static SVG → saved to `images/` → converted to PNG via `SCRIPTS/svg-to-png.mjs`
  - An interactive D3 HTML file → saved to `d3/`
  - A markdown image link inserted into the chapter
  - An entry added to the chapter's `## Prompts` section
  - NEVER remove comments
- Inserts any CAJAL-generated PNGs that are not yet referenced in the chapter

---

## Instructions

### SETUP — run once before processing any chapter

1. Confirm the working directory contains `chapters/`, `images/`, `d3/`, `SCRIPTS/`, and `metadata.yaml`.
2. If `images/` or `d3/` do not exist, create them.
3. Confirm `node` is available: run `node --version`. If it fails, stop and report.
4. Confirm `sharp` is installed: run `node -e "import('sharp').then(() => console.log('ok'))"`. If it fails, run `npm install` from the book root before proceeding.
5. Read `NEU/CLAUDE.md` and `NEU/DESIGN.md` in full. If those paths do not exist, check `brutalist/CLAUDE.md` and `brutalist/DESIGN.md`. Every D3 HTML file generated in PASS 2 and every SVG generated in PASS 2 must conform to both documents. Do not proceed without reading them.
6. Read `metadata.yaml` in full. Extract: `title`, `author`, `date`.
7. Build a chapter list: all `.md` files in `chapters/`, sorted by filename.
8. Extract the chapter slug from each filename (the full filename minus `.md`, e.g., `07-comparison-charts`). Use this for all figure filenames.

---

### PASS 1 — Tables

For each chapter file, scan for comments matching:

```
<!-- → [TABLE: … ] -->
<!-- → [TABLE: … -->
```

**For each match:**

1. Read the full description inside the brackets.
2. Generate a complete GitHub-flavored markdown table. Every cell must contain real content inferred from chapter context — no placeholder text, no `[insert]` strings.
3. If the comment immediately precedes an existing `*Figure N.N*` label or a partial table, replace the comment AND the stub with the new table followed by the figure label (preserve the label).
4. If the comment is standalone, replace it inline.
5. Do not add a heading above the table.

---

### PASS 2 — Figures / SVGs + D3 HTML + Prompts

For each chapter file, scan for comments matching:

```
<!-- → [IMAGE: … ] -->
<!-- → [FIGURE: … ] -->
<!-- → [DIAGRAM: … ] -->
<!-- → [INFOGRAPHIC: … ] -->
<!-- → [CHART: … ] -->
```

Also match the inline variant (no closing `-->` on the same line).

**For each match, perform steps A through E:**

---

#### Step A — Determine figure number and filename

1. Infer the figure number from a nearby `*Figure N.N*` label or `![Figure N.N` alt text, or assign the next sequential number within the chapter.
2. Construct filenames:
   - Format: `{chapter-slug}-fig-{figure-number-zero-padded}`
   - Example: `07-comparison-charts-fig-05`
   - Hyphens throughout. No underscores. No spaces.

---

#### Step B — Generate the static SVG

Generate a static SVG conforming to the **SVG Style Guide** below. Save to:

```
images/{chapter-slug}-fig-{NN}.svg
```

**If a real image file already exists** at the corresponding path (`.jpg` or `.png`), do not overwrite — skip SVG generation, leave the existing `![…]` tag in place, and still add a Prompts entry (Step E).

##### SVG generation rule: produce real content

Generate SVG that visually represents the concept described in the figure comment. Every label, axis value, node name, flow stage, and annotation is inferred from the content description and surrounding chapter context. **No placeholder text. No `[fill in]` strings. No empty boxes.** If the description does not provide enough specifics for a label, derive a plausible, discipline-appropriate value.

##### Figure type → rendering approach

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

##### SVG metadata block

Every generated SVG must include the following, in this order, immediately after the opening `<svg>` tag:

```xml
<title>{figure-title} — {chapter-slug}</title>
<desc>{concept description, max 280 chars}</desc>
<metadata>
  <cajal:figure
    xmlns:cajal="https://bearbrown.ai/cajal/1.0"
    book="{book-title from metadata.yaml}"
    chapter="{chapter-slug}"
    figure-number="{NN}"
    figure-title="{figure-title}"
    figure-type="{figure-type}"
    author="{author from metadata.yaml}"
    date-generated="{ISO 8601 date}"
    source-file="chapters/{chapter-slug}.md"
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
  Source: chapters/{chapter-slug}.md
-->
```

Do **not** render any chapter slug, figure number, filename, source-file path, book title, or other organizational metadata as visible text inside the SVG. All such identifiers belong only in the `<metadata>` block and the HTML comment header. The "Source / ALL CAPS identifier" typography role is reserved for legitimate external data attribution (e.g., "SOURCE: BUREAU OF LABOR STATISTICS 2024") when the figure displays sourced data — never for internal production identifiers.

---

#### Step C — Generate the D3 HTML file

Generate a standalone D3 v7 HTML file that produces an interactive version of the same figure. Must conform to `NEU/CLAUDE.md` (stack, naming, patterns, accessibility) and `NEU/DESIGN.md` (color, typography, spacing).

Key requirements:
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` — no substitutions
- Color: `var(--color-*)` CSS custom properties from DESIGN.md — no hardcoded hex
- Fonts: `'EB Garamond', 'Garamond', Georgia, serif` for display headings; `'Inter', -apple-system, 'Helvetica Neue', sans-serif` for body and UI; `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` for axis ticks and code
- Event handlers: `(event, d)` parameter order — `d3.event` does not exist in v7
- Accessibility: `role="img"`, `aria-labelledby`, `<title>`, `<desc>` on every SVG
- Responsive: ResizeObserver redraw pattern
- Dark mode: `prefers-color-scheme: dark` CSS variables
- Reduced motion: suppress all transitions under `prefers-reduced-motion: reduce`

Save to:

```
d3/{chapter-slug}-fig-{NN}.html
```

---

#### Step D — Insert the markdown reference

Insert the image above the original comment (and any adjacent stub `![Figure …]` placeholder) with:

```markdown
![{descriptive alt text from the figure description}](images/{chapter-slug}-fig-{NN}.png)
*Figure {N.N} — {short title from the description}*
```

The link points to the PNG (not the SVG). The PNG is produced by `SCRIPTS/svg-to-png.mjs` in the post-pass step.

---

#### Step E — Add a Prompts entry

Locate the chapter's `## Prompts` section (create it at the end of the file if absent). Append one entry per figure:

```markdown
### Figure {N.N} — {short title}

{Structural prompt describing chart type, data shape, marks, channels, annotations, and deliverable format. Under 200 words. Self-contained — readable in a fresh Claude conversation with CLAUDE.md and DESIGN.md in context.}
```

**Prompt writing rules:**
- Self-contained — readable in a fresh Claude conversation with CLAUDE.md and DESIGN.md in context.
- Specify: chart type, data shape (series count, approximate value ranges), marks, channels (x, y, color, size), sort order, zero baseline (yes/no), annotations or labels, deliverable format (single HTML file, inline CSS, D3 CDN).
- Structural, not aesthetic: "vertical bar chart, 5 categories on x, quantitative score 0–100 on y, sorted descending, zero baseline, value labels above each bar" — not "it should look like…"
- Under 200 words each.

---

### PASS 3 — CAJAL PNG Insertion

After PASS 2, for each chapter file, check whether a corresponding CAJAL file exists:

```
pantry/{chapter-slug}-cajal.md
```

If it does not exist, skip this pass for that chapter.

If it does exist:

1. Enumerate all PNG files in `images/` matching the pattern `{chapter-slug}-fig-{NN}.png`.
2. For each such PNG, check whether the chapter already contains a reference to that file (search for the filename string anywhere in the chapter markdown).
3. For any PNG that is **not yet referenced** in the chapter:
   a. Parse the corresponding CAJAL entry in `pantry/{chapter-slug}-cajal.md` to extract the figure title and description.
   b. Locate the best insertion point in the chapter: find the nearest paragraph or section heading that semantically matches the figure's concept. If no clear match exists, append at the end of the chapter body (before the `## Prompts` section).
   c. Insert the markdown reference:

```markdown
![{descriptive alt text from CAJAL figure description}](images/{chapter-slug}-fig-{NN}.png)
*Figure {N.N} — {figure title from CAJAL}*
```

   d. Add a corresponding Prompts entry (same rules as Step E above) if one does not already exist for this figure number.

4. Do not reorder or replace any existing `![…]` references — only insert missing ones.
5. Do not modify any CAJAL file. This pass is read-only with respect to `pantry/`.

---

### PASS 4 — PNG conversion

After all chapters are processed, run:

```bash
node SCRIPTS/svg-to-png.mjs
```

Converts every `images/**/*.svg` to 300dpi PNG. Idempotent — skips PNGs newer than their SVG source.

---

### PASS 5 — Write back and report

1. Write modified content back to the chapter file (overwrite in place).
2. Append one line to `enrichment-log.md` in the project root:

```
{filename} — {N} tables rendered, {N} SVGs generated, {N} D3 HTML files generated, {N} CAJAL PNGs inserted
```

After all chapters, append:

```
## Summary
Total chapters processed: {N}
Total tables rendered: {N}
Total SVG+PNG pairs generated: {N}
Total D3 HTML files generated: {N}
Total CAJAL PNGs inserted: {N}
```

---

## SVG Style Guide — every generated static figure

**Register:** Academic / long-form reading. Bear Brown / Brutalist D3 brand-compliant. Suitable for print and digital reproduction.

### Geometry

- `viewBox="0 0 700 420"` unless figure content requires more height; add in 60px increments (480, 540, 600).
- No `width` or `height` attribute on `<svg>`.
- 32px margin all sides.
- Labels on 8px grid.
- No rounded corners (`rx="0"` on all rectangles).
- No gradients. No shadows. No glassmorphism. No neumorphism.

### Accessibility

Every SVG must have `role="img"`, `aria-labelledby` pointing to the `<title>` element ID, and both `<title>` and `<desc>` populated:

```xml
<svg viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="fig-title-{NN}">
  <title id="fig-title-{NN}">{figure-title}</title>
  <desc>{concept description}</desc>
```

### Color palette — Bear Brown / Brutalist D3 brand

Use these hex values directly in SVG attributes. Do not use CSS custom properties in static SVG — write the hex value.

| Token | Hex | Role | Use |
|---|---|---|---|
| `--color-white` | `#FFFFFF` | Canvas | SVG background |
| `--color-ink` | `#2a1a0e` | Primary text | Headings, axes, structural strokes, body copy |
| `--color-red` | `#C8102E` | Primary accent | Primary data series, brand emphasis |
| `--color-secondary` | `#545454` | Supporting text | Captions, axis labels, source lines |
| `--color-border` | `#D4D4D4` | Hairlines | Grid lines, dividers, box borders |
| `--color-ochre` | `#C8860E` | Decorative accent | Callout borders, figure label accents — never data encoding |
| `--color-fill` | `#F5F5F5` | Chart area | Plot region background |

**Brand proportion guidance:** White is the canvas. Ink (`#2a1a0e`) carries all structural marks and body text — warmer than pure black, AAA on white at 18.0:1. Red is the one active color — brand, emphasis, primary data series. Ochre is the one warm note — decorative highlights only (callout borders, figure label accents), never body text or data encoding. Secondary and border are neutral infrastructure.

**Data-encoding rules:**
- `#C8102E` (red) encodes the first (or only) highlighted data category. One category per figure.
- `#2a1a0e` (ink) or neutral grays (`#787878`, `#ADADAD`) may serve as additional data categories when a neutral contrast is needed.
- `#C8860E` (ochre) is **never** a data-encoding color — decorative use only (callout box borders, pull quote left-borders, figure label accents).
- `#545454` (secondary), `#D4D4D4` (border), and `#F5F5F5` (fill) are structural — never use them to encode data categories.
- Maximum two data-encoding colors (red + neutral gray) before requiring secondary encodings (patterns, direct labels, or figure decomposition).

**Luminance ladder — test every figure in grayscale:**

| Token | Hex | Approx. L* | Role |
|---|---|---|---|
| `--color-ink` | `#2a1a0e` | ~10 | Primary text / dark anchor |
| `--color-red` | `#C8102E` | ~25 | Primary data accent |
| `--color-secondary` | `#545454` | ~36 | Label text |
| `--color-ochre` | `#C8860E` | ~56 | Decorative accent only |
| `--color-border` | `#D4D4D4` | ~84 | Hairlines |
| `--color-fill` | `#F5F5F5` | ~96 | Near-white field |
| `--color-white` | `#FFFFFF` | ~100 | Canvas |

Each data-encoding color must occupy a distinct luminance band. If any two data colors appear indistinguishable in grayscale, add a secondary encoding before proceeding.

### Typography — Bear Brown / Brutalist D3 brand

| Role | Font family | Size | Weight | Fill |
|---|---|---|---|---|
| Figure title / display heading | `'EB Garamond', 'Garamond', Georgia, serif` | 14 | 400 | `#2a1a0e` |
| Body / item label | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 12 | 400 | `#2a1a0e` |
| Caption / sub-label | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 11 | 400 | `#545454` |
| Axis tick labels | `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` | 11 | 400 | `#545454` |
| Source / ALL CAPS identifier | `'Inter', -apple-system, 'Helvetica Neue', sans-serif` | 10 | 400 | `#545454` |

**Font notes:**
- EB Garamond (classical Garamond revival) is the display face — use for chart titles and section labels inside figures.
- Inter is the body and UI face — use for all labels, captions, legend entries, annotations.
- JetBrains Mono is for axis tick labels and numeric annotations — never for display headings.
- Shadows Into Light (`.handnote`) is for margin notes and sketched callouts only — never for chart text.
- Do not use Arial, Helvetica, Roboto, or system-ui — always specify the full fallback chain.
- ALL CAPS source lines: `letter-spacing="0.08em"`.
- Weight differentiation (400 regular for EB Garamond headings, 600–700 for Inter component headers) provides hierarchy in place of family switching.

### Strokes

- Box borders: `stroke="#D4D4D4"` `stroke-width="1"` `fill="#FFFFFF"`
- Chart area border: `stroke="#D4D4D4"` `stroke-width="0.75"` `fill="#F5F5F5"`
- Arrows: `stroke="#2a1a0e"` `stroke-width="1.5"` `fill="none"` with `marker-end`
- Dashed rules: `stroke-dasharray="4 3"` `stroke="#D4D4D4"` `stroke-width="0.75"`
- Reference lines (mean, median, baseline): `stroke-dasharray="5 4"` for primary, `stroke-dasharray="2 4"` for secondary
- No shadows. No rounded corners (`rx="0"`). No gradients.

### Arrowheads — define once in `<defs>`

```svg
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6"
          refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#2a1a0e"/>
  </marker>
</defs>
```

### Layout

- 32px margin all sides. Labels on 8px grid. Bézier paths for arc connectors. Flat fills.
- Chart area (plot region) uses `#F5F5F5`, not white, to visually bound the data space from the canvas.
- Default chart margins: top 48 / right 40 / bottom 56 / left 64.
- Wide-label charts: top 48 / right 40 / bottom 56 / left 160.

---

## Order of operations per chapter

1. PASS 1 — tables
2. PASS 2 — SVG → `images/`, D3 HTML → `d3/`, markdown link inserted, Prompts section updated
3. PASS 3 — CAJAL PNG insertion (if `pantry/{chapter-slug}-cajal.md` exists)
4. PASS 5 — log entry

After all chapters:

5. PASS 4 — `node SCRIPTS/svg-to-png.mjs` — SVG → 300dpi PNG

Process in filename order. On error, log and continue.

---

## What NOT to do

- Do not alter prose, headings, exercises, or content outside figure comments and table comments.
- Do not add headers above tables.
- Do not use CSS custom properties in static SVG — write hex values directly.
- Do not use serif fonts for axis ticks, body labels, or captions — EB Garamond is for display headings only.
- Do not use Arial, Helvetica, Roboto, or system-ui — always use the full fallback chains specified above.
- Do not use underscores in filenames.
- Do not hardcode hex values in D3 HTML — use `var(--color-*)`.
- Do not substitute a different CDN or D3 version.
- Do not write Prompts entries that describe figures visually — describe them structurally.
- Do not use `#C8860E` (ochre) as a data-encoding color — it is decorative only.
- Do not use `#C8102E` (red) for more than one data category in any single figure.
- Do not use more than two data-encoding colors (red + neutral gray) without secondary encodings.
- Do not use a white (`#FFFFFF`) chart area background — use `#F5F5F5` for the plot region.
- Do not skip the grayscale test — every figure must be distinguishable without color.
- Do not use `#545454` (secondary), `#D4D4D4` (border), or `#F5F5F5` (fill) to encode data categories.
- Do not use red to encode danger, negative values, or alert states — red is brand and primary series only.
- Do not use gradients, shadows, rounded corners, glassmorphism, or neumorphism.
- Do not use rainbow color palettes — red is brand, grays are neutrals.
- Do not render chapter slugs, figure numbers, filenames, source-file paths, book titles, or other internal production metadata as visible text inside any SVG.
- Do not modify any file in `pantry/` — PASS 3 is read-only with respect to that directory.
- Do not use placeholder text, `[fill in]` strings, or empty labeled boxes — generate real content from the figure description.
- Do not reorder or replace existing `![…]` image references when inserting CAJAL PNGs — only insert missing ones.
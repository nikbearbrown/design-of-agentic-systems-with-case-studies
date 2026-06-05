# Cowork or Codex Prompt — Chapter Enrichment: Tables and Figures (Northeastern University)

Overwrite any existing graphics.

## What this does
Iterates through every file in `chapters/` and enriches it in place:
- Converts `<!-- → [TABLE:` comments into rendered markdown tables
- Converts `<!-- → [IMAGE:` / graphic comments into:
  - A static SVG → saved to `images/` → converted to PNG via `SCRIPTS/svg-to-png.mjs`
  - An interactive D3 HTML file → saved to `d3/`
  - A markdown image link inserted into the chapter
  - An entry added to the chapter's `## Prompts` section
- Inserts markdown references for any image files in `images/` that match a chapter slug but are not yet referenced anywhere in that chapter

---

## Instructions

### SETUP — run once before processing any chapter

1. Confirm the working directory contains `chapters/`, `images/`, `d3/`, `SCRIPTS/`, and `metadata.yaml`.
2. If `images/` or `d3/` do not exist, create them.
3. Confirm `node` is available: run `node --version`. If it fails, stop and report.
4. Confirm `sharp` is installed: run `node -e "import('sharp').then(() => console.log('ok'))"`. If it fails, run `npm install` from the book root before proceeding.
5. Read `NEU/CLAUDE.md` and `NEU/DESIGN.md` in full. Every D3 HTML file generated in PASS 2 must conform to both documents. Do not proceed without reading them.
6. Build a chapter list: all `.md` files in `chapters/`, sorted by filename.
7. Extract the chapter slug from each filename (the full filename minus `.md`, e.g., `07-comparison-charts`). Use this for all figure filenames.

### SETUP — image inventory

8. Build a complete inventory of `images/`: list every `.svg`, `.png`, and `.jpg` file present.
9. For each image file, parse the chapter slug from the filename. The chapter slug is everything before `-fig-` (e.g., `07-comparison-charts-fig-05.png` → chapter slug `07-comparison-charts`). If the filename does not contain `-fig-`, record it as unmatched and skip.
10. For each chapter, build two sets:
    - **Referenced images**: every image path that appears in an `![…](images/…)` tag anywhere in the chapter file.
    - **Candidate images**: every image in `images/` whose chapter slug matches this chapter.
    - **Orphans**: candidate images not present in the referenced set. These will be inserted in PASS 0.

---

### PASS 0 — Insert orphaned images

Run this pass before PASS 1 (tables) and PASS 2 (figures).

For each chapter, for each orphaned image (present in `images/`, matching chapter slug, not yet referenced in the chapter):

**A. Determine figure number**
Parse the figure number from the image filename (the digits after `-fig-`). Use this number for the figure label.

**B. Prefer PNG over SVG**
If both `{slug}-fig-{NN}.png` and `{slug}-fig-{NN}.svg` exist, reference the PNG. If only the SVG exists, reference the SVG.

**C. Find the insertion point**
Use this priority order:
1. If the chapter contains a `<!-- → [IMAGE:` / `[FIGURE:` / `[DIAGRAM:` / `[CHART:` / `[INFOGRAPHIC:` comment whose figure number or sequence position matches, insert immediately after that comment (PASS 2 will then skip generating a new SVG for this slot — see PASS 2 pre-check).
2. If the chapter contains a `*Figure N.N*` label or `![Figure N.N` alt text with a matching number but no image tag above it, insert the image tag immediately before that label.
3. If neither of the above applies, append to the end of the chapter body, before the `## Prompts` section.

**D. Insert the markdown reference**

```markdown
![{figure-title inferred from image filename and chapter context}](images/{filename})
*Figure {N.N} — {short title inferred from filename and chapter context}*
```

Infer alt text and figure title from the filename slug and any surrounding chapter prose. Do not use placeholder text.

**E. Log the insertion**

Append to `enrichment-log.md`:
```
{chapter filename} — orphan inserted: images/{filename}
```

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

#### Pre-check — existing image

Before executing any step for a figure comment, check whether a file already exists at any of these paths:

```
images/{chapter-slug}-fig-{NN}.png
images/{chapter-slug}-fig-{NN}.jpg
images/{chapter-slug}-fig-{NN}.svg
```

**If a matching image exists:**
- Skip Step B (SVG generation) entirely.
- Skip Step C (D3 HTML generation) entirely.
- Proceed directly to Step D (insert markdown reference), pointing to the existing file. Prefer `.png` over `.jpg` over `.svg` if multiple formats exist.
- Proceed to Step E (Prompts entry) as normal.
- Log: `SKIPPED generation (image exists): images/{filename}`

**If no matching image exists:**
- Proceed through all steps A–E as normal.

Additionally: if an orphan image was already inserted at this figure's slot in PASS 0, treat it as an existing image — skip SVG and D3 generation, skip markdown insertion (already done), and proceed only to Step E (Prompts entry).

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

(Skipped if pre-check found an existing image — see above.)

---

#### Step C — Generate the D3 HTML file

Generate a standalone D3 v7 HTML file that produces an interactive version of the same figure. Must conform to `NEU/CLAUDE.md` (stack, naming, patterns, accessibility) and `NEU/DESIGN.md` (color, typography, spacing).

Key requirements:
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` — no substitutions
- Color: `var(--color-*)` CSS custom properties from DESIGN.md — no hardcoded hex
- Fonts: `'Real Head Pro', 'FF Real', Lato, sans-serif` for all text; fall back to Lato where Real Head Pro is unavailable
- Event handlers: `(event, d)` parameter order — `d3.event` does not exist in v7
- Accessibility: `role="img"`, `aria-labelledby`, `<title>`, `<desc>` on every SVG
- Responsive: ResizeObserver redraw pattern
- Dark mode: `prefers-color-scheme: dark` CSS variables
- Reduced motion: suppress all transitions under `prefers-reduced-motion: reduce`

Save to:

```
d3/{chapter-slug}-fig-{NN}.html
```

(Skipped if pre-check found an existing image — see above.)

---

#### Step D — Insert the markdown reference

Replace the original comment (and any adjacent stub `![Figure …]` placeholder) with:

```markdown
![{descriptive alt text from the figure description}](images/{chapter-slug}-fig-{NN}.png)
*Figure {N.N} — {short title from the description}*
```

The link points to the PNG (not the SVG). The PNG is produced by `SCRIPTS/svg-to-png.mjs` in the post-pass step. If the pre-check found an existing `.jpg` or `.png`, point directly to that file instead.

(Skipped if this figure's slot was already handled in PASS 0.)

---

#### Step E — Update the chapter's Prompts section

After all figures in a chapter are processed, update the `## Prompts` section at the bottom of the chapter file.

**Locate `## Prompts`** — present in every scaffolded chapter. If absent, append at end of file.

**Replace stub content** with:

```markdown
## Prompts

Use these prompts with Claude to generate interactive D3 v7 versions of the
figures in this chapter. Each produces a standalone HTML file you can open
in a browser and modify freely.

**Prerequisites:** Load `NEU/CLAUDE.md` and `NEU/DESIGN.md` into
your Claude project context before using these prompts. They define the stack,
naming conventions, color system, and typography the figures use.

---

### Figure {N.N} — {short title}

{The complete, self-contained prompt that would produce a close approximation
of this figure. Describe the data, chart type, marks, channels, sort order,
baseline, and annotations. Specific enough to be recognizable; open enough
to adapt.}

> Reference implementation: `d3/{chapter-slug}-fig-{NN}.html`

---

### Figure {N.N} — {short title}

{prompt}

> Reference implementation: `d3/{chapter-slug}-fig-{NN}.html`
```

Include a Prompts entry for every figure in the chapter — whether the image was generated fresh, already existed, or was inserted as an orphan in PASS 0.

**Prompt writing rules:**
- Self-contained — readable in a fresh Claude conversation with CLAUDE.md and DESIGN.md in context.
- Specify: chart type, data shape (series count, approximate value ranges), marks, channels (x, y, color, size), sort order, zero baseline (yes/no), annotations or labels, deliverable format (single HTML file, inline CSS, D3 CDN).
- Structural, not aesthetic: "vertical bar chart, 5 categories on x, quantitative score 0–100 on y, sorted descending, zero baseline, value labels above each bar" — not "it should look like…"
- Under 200 words each.
- For figures that came from `images/` without a corresponding figure comment, infer the prompt from the image filename, the figure label, and surrounding chapter prose.

---

#### SVG Style Guide — every generated static figure

**Register:** Academic / university textbook. Northeastern University brand-compliant. Suitable for print and digital reproduction.

**Geometry:**
- `viewBox="0 0 700 420"` unless content requires more height (add in 60px increments).
- No `width` or `height` on `<svg>`.

---

**Color palette — Northeastern University brand:**

| Token | Hex | Brand name | Use |
|---|---|---|---|
| `--color-white` | `#FFFFFF` | White | SVG background, canvas |
| `--color-fill` | `#F5F5F5` | Near-white | Chart area background, callout boxes |
| `--color-ink` | `#000000` | Black | Primary text, headings, axes, structural strokes |
| `--color-red` | `#C8102E` | Northeastern Red (186 U) | Primary data accent — highlighted series, primary emphasis mark |
| `--color-brown` | `#A0522D` | Sienna | Secondary data accent — use sparingly |
| `--color-secondary` | `#555555` | — | Captions, axis labels, secondary text |
| `--color-border` | `#CCCCCC` | — | Hairlines, grid lines, dividers, box borders |

**Brand proportion guidance:** Northeastern's brand calls for approximately 35% black, 35% white, and 27% red across a composition, with brown as a warm secondary accent. In data figures this translates to: black for structure and text, white/near-white for backgrounds, red as the primary data-encoding color, and brown used very sparingly (second category or single accent only).

**Data-encoding rules:**
- `--color-red` encodes the first (or only) highlighted data category. One category per figure. This is the Northeastern brand red and must appear in every figure.
- `--color-brown` encodes a second distinct data category when needed. Use sparingly — brown should never dominate a composition.
- `--color-ink` (black) may serve as a third data category in bar or line charts when a neutral contrast is needed. Do not use for structure when also encoding data.
- `--color-ink`, `--color-secondary`, `--color-border`, and `--color-fill` are structural — never use them to encode data categories (except `--color-ink` as an explicit third data category as noted above).
- Maximum two data-encoding colors (red + brown) before requiring secondary encodings (patterns, direct labels, or figure decomposition). Black may serve as a functional third if clearly labeled.

**Luminance ladder — test every figure in grayscale:**

| Token | Approx. L* | Role |
|---|---|---|
| `--color-ink` | ~0 | Primary text / dark anchor |
| `--color-red` | ~25 | Primary data accent |
| `--color-secondary` | ~36 | Label text |
| `--color-brown` | ~38 | Secondary data accent |
| `--color-border` | ~80 | Hairlines |
| `--color-fill` | ~96 | Near-white field |
| `--color-white` | ~100 | Canvas |

Each data-encoding color occupies a distinct luminance band. Red (~25) and brown (~38) are close in luminance — always add a secondary encoding (pattern, direct label, or shape difference) when both appear in the same figure to ensure grayscale distinguishability.

---

**Typography — Northeastern University brand:**

| Role | Font family | Size | Weight | Fill |
|---|---|---|---|---|
| Title / section label | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 13 | bold | `--color-ink` |
| Body / item label | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 11 | normal | `--color-ink` |
| Caption / sub-label | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 10 | normal | `--color-secondary` |
| ALL CAPS identifier | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 10 | normal | `--color-secondary` |

**Font notes:**
- Real Head Pro (also called FF Real) is Northeastern's primary typeface — a modern sans-serif with 13 weights. Use it for all text.
- Lato is the official alternative where Real Head Pro is unavailable. The fallback chain `'Real Head Pro', 'FF Real', Lato, sans-serif` covers both cases.
- Do not use serif fonts (Georgia, Times, etc.) anywhere.
- Do not use generic system sans-serif (Arial, Helvetica, Roboto, Inter) — always specify the full fallback chain ending in `sans-serif`.
- ALL CAPS identifiers: set `letter-spacing="0.08em"`. Use the same font family as all other text — no monospace exception.
- Weight differentiation (bold for titles, normal for body/labels) provides hierarchy in place of family switching.

---

**Strokes:**
- Box borders: `stroke="#CCCCCC"` `stroke-width="1"` `fill="#FFFFFF"`
- Chart area border: `stroke="#CCCCCC"` `stroke-width="0.75"` `fill="#F5F5F5"`
- Arrows: `stroke="#000000"` `stroke-width="1.5"` `fill="none"` with `marker-end`
- Dashed rules: `stroke-dasharray="4 3"` `stroke="#CCCCCC"` `stroke-width="0.75"`
- Reference lines (mean, median, baseline): `stroke-dasharray="5 4"` for primary, `stroke-dasharray="2 4"` for secondary — use token colors, not hardcoded hex
- No shadows. No rounded corners (`rx="0"`). No gradients.

**Arrowheads — define once in `<defs>`:**
```svg
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6"
          refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#000000"/>
  </marker>
</defs>
```

**Layout:**
- 32px margin all sides. Labels on 8px grid. Bézier paths for arc connectors. Flat fills.
- Chart area (plot region) uses `--color-fill` (`#F5F5F5`), not white, to visually bound the data space from the canvas.

---

### PASS 2 post-step — PNG conversion

After all chapters are processed, run:

```bash
node SCRIPTS/svg-to-png.mjs
```

Converts every `images/**/*.svg` to 300dpi PNG. Idempotent — skips PNGs newer than their SVG source.

---

### PASS 3 — Write back and report

1. Write modified content back to the chapter file (overwrite in place).
2. Append one line to `enrichment-log.md` in the project root:

```
{filename} — {N} tables rendered, {N} SVGs generated, {N} D3 HTML files generated, {N} orphan images inserted, {N} existing images reused
```

After all chapters, append:

```
## Summary
Total chapters processed: {N}
Total tables rendered: {N}
Total SVG+PNG pairs generated: {N}
Total D3 HTML files generated: {N}
Total orphan images inserted: {N}
Total existing images reused (generation skipped): {N}
```

---

## Order of operations per chapter

1. PASS 0 — orphan image insertion (images/ → chapter)
2. PASS 1 — tables
3. PASS 2 — pre-check existing images, then SVG → `images/`, D3 HTML → `d3/`, markdown link inserted, Prompts section updated
4. PASS 3 — log entry

After all chapters:

5. `node SCRIPTS/svg-to-png.mjs` — SVG → 300dpi PNG

Process in filename order. On error, log and continue.

---

## What NOT to do

- Do not alter prose, headings, exercises, or content outside figure comments and table comments.
- Do not add headers above tables.
- Do not use hardcoded hex values — use the seven `--color-*` tokens defined above.
- Do not use serif fonts (Georgia, Times New Roman, etc.) anywhere.
- Do not use generic system sans-serif (Arial, Helvetica, Roboto, Inter) — always use the full `'Real Head Pro', 'FF Real', Lato, sans-serif` chain.
- Do not use underscores in filenames.
- Do not hardcode hex values in D3 HTML — use `var(--color-*)`.
- Do not substitute a different CDN or D3 version.
- Do not write Prompts entries that describe figures visually — describe them structurally.
- Do not use `--color-brown` as a dominant color in any figure — it is a secondary accent only.
- Do not use `--color-red` for more than one data category in any single figure.
- Do not use more than two data-encoding colors (red + brown) without secondary encodings.
- Do not use a white (`#FFFFFF`) chart area background — use `--color-fill` (`#F5F5F5`) for the plot region.
- Do not skip the grayscale test — every figure must be distinguishable without color.
- Do not use `--color-ink`, `--color-secondary`, `--color-border`, or `--color-fill` to encode data categories (except `--color-ink` as an explicit labeled third category).
- Do not overwrite an existing image file in `images/` — if a `.svg`, `.png`, or `.jpg` already exists for a figure slot, use it and skip generation.
- Do not insert a markdown reference for an image that is already referenced in the chapter.
- Do not leave orphan images in `images/` unreferenced — every image whose chapter slug matches a chapter file must appear in that chapter after this pass completes.
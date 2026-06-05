The  CLAUDE.md for d3 guidlines and the DESIGN.md for visual guidelines are here /Users/bear/Documents/Cowork or Codex /bear-textbooks/NEU

All books are here /Users/bear/Documents/Cowork or Codex /bear-textbooks/books

Walk all of the books subdirectories and add images as per the guidelines below


# Cowork or Codex  Prompt — Chapter Enrichment: Tables, Figures, a

## What this does
Iterates through every file in `chapters/` and enriches it in place:
- Converts `<!-- → [TABLE:` comments into rendered markdown tables
- Converts `<!-- → [IMAGE:` / graphic comments into:
  - A static SVG → saved to `images/` → converted to PNG via `SCRIPTS/svg-to-png.mjs`
  - An interactive D3 HTML file → saved to `d3/`
  - A markdown image link inserted into the chapter

---

## Instructions

### SETUP — run once before processing any chapter

1. Confirm the working directory contains `chapters/`, `images/`, `d3/`, `SCRIPTS/`, and `metadata.yaml`.
2. If `images/` or `d3/` do not exist, create them.
3. Confirm `node` is available: run `node --version`. If it fails, stop and report.
4. Confirm `sharp` is installed: run `node -e "import('sharp').then(() => console.log('ok'))"`. If it fails, run `npm install` from the book root before proceeding.
5. Read `brutalist/CLAUDE.md` and `brutalist/DESIGN.md` in full. Every D3 HTML file generated in PASS 2 must conform to both documents. Do not proceed without reading them.
6. Build a chapter list: all `.md` files in `chapters/`, sorted by filename.
7. Extract the chapter slug from each filename (the full filename minus `.md`, e.g., `07-comparison-charts`). Use this for all figure filenames.

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

---

#### Step C — Generate the D3 HTML file

Generate a standalone D3 v7 HTML file that produces an interactive version of the same figure. Must conform to `brutalist/CLAUDE.md` (stack, naming, patterns, accessibility) and `brutalist/DESIGN.md` (color, typography, spacing).

Key requirements:
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` — no substitutions
- Color: `var(--color-*)` CSS custom properties from DESIGN.md — no hardcoded hex
- Fonts: `'EB Garamond', Georgia, serif` for titles and body; `'IBM Plex Mono', 'JetBrains Mono', monospace` for ALL CAPS labels, axis ticks, stats, and control text
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

Replace the original comment (and any adjacent stub `![Figure …]` placeholder) with:

```markdown
![{descriptive alt text from the figure description}](images/{chapter-slug}-fig-{NN}.png)
*Figure {N.N} — {short title from the description}*
```

The link points to the PNG (not the SVG). The PNG is produced by `SCRIPTS/svg-to-png.mjs` in the post-pass step.

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

**Prerequisites:** Load `brutalist/CLAUDE.md` and `brutalist/DESIGN.md` into
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

**Prompt writing rules:**
- Self-contained — readable in a fresh Claude conversation with CLAUDE.md and DESIGN.md in context.
- Specify: chart type, data shape (series count, approximate value ranges), marks, channels (x, y, color, size), sort order, zero baseline (yes/no), annotations or labels, deliverable format (single HTML file, inline CSS, D3 CDN).
- Structural, not aesthetic: "vertical bar chart, 5 categories on x, quantitative score 0–100 on y, sorted descending, zero baseline, value labels above each bar" — not "it should look like…"
- Under 200 words each.

---

#### SVG Style Guide — every generated static figure

**Register:** Editorial / print-textbook. Suitable for O'Reilly or HBR print reproduction.

**Geometry:**
- `viewBox="0 0 700 420"` unless content requires more height (add in 60px increments).
- No `width` or `height` on `<svg>`.

---

**Color palette:**

| Token | Hex | Use |
|---|---|---|
| `--color-white` | `#FFFFFF` | SVG background, canvas |
| `--color-fill` | `#F5EFE8` | Chart area background, callout boxes, warm near-white field |
| `--color-ink` | `#2a1a0e` | Primary text, headings, axes, structural strokes |
| `--color-mark` | `#6B3520` | Default data mark fill — bars, points, areas when no category encoding |
| `--color-red` | `#C8102E` | First data-encoding accent — highlighted series, primary emphasis mark |
| `--color-slate` | `#1A3A5C` | Second data-encoding color — second series, reference lines, tooltip backgrounds |
| `--color-ochre` | `#C8860E` | Third data-encoding color or decorative highlight — use sparingly |
| `--color-secondary` | `#545454` | Captions, axis labels, secondary text |
| `--color-border` | `#D4D4D4` | Hairlines, grid lines, dividers, box borders |

**Data-encoding rules:**
- `--color-mark` is the default fill for all data marks unless category is being encoded. Never use for structure or labels.
- `--color-red` encodes the first (or only) highlighted data category. One category per figure.
- `--color-slate` encodes a second distinct data category. The red + slate pairing is colorblind-safe — distinguishable across all major CVD types (protanopia, deuteranopia, tritanopia).
- `--color-ochre` may encode a third data category when necessary. Do not pair ochre with red as the only two categories — their luminance proximity can cause confusion under CVD. When ochre is used for data, a secondary encoding (pattern, shape, or label) is required.
- `--color-ink`, `--color-secondary`, `--color-border`, and `--color-fill` are structural — never use them to encode data categories.
- Maximum three data-encoding colors per figure. Four or more categories require additional secondary encodings (patterns, direct labels, or figure decomposition).

**Luminance ladder — test every figure in grayscale:**

| Token | Approx. L* | Role |
|---|---|---|
| `--color-slate` | ~22 | Dark anchor |
| `--color-mark` | ~28 | Default mark |
| `--color-red` | ~33 | Primary accent |
| `--color-secondary` | ~36 | Label text |
| `--color-ochre` | ~58 | Third accent |
| `--color-border` | ~84 | Hairlines |
| `--color-fill` | ~94 | Near-white field |
| `--color-white` | ~100 | Canvas |

Each data-encoding color occupies a distinct luminance band. If any two data colors appear indistinguishable in grayscale, add a secondary encoding before proceeding.

---

**Typography:**

| Role | Font family | Size | Weight | Fill |
|---|---|---|---|---|
| Title / section label | `'EB Garamond', Georgia, 'Times New Roman', serif` | 13 | bold | `--color-ink` |
| Body / item label | `'EB Garamond', Georgia, 'Times New Roman', serif` | 11 | normal | `--color-ink` |
| Caption / sub-label | `'EB Garamond', Georgia, 'Times New Roman', serif` | 10 | normal | `--color-secondary` |
| ALL CAPS identifier | `'IBM Plex Mono', 'Courier New', monospace` | 10 | normal | `--color-secondary` |

**ALL CAPS identifier rule:** Use IBM Plex Mono — and only IBM Plex Mono — for text rendered in full uppercase: stats row headers (`N`, `MEAN`, `STD DEV`), bin range labels (`25–30 MIN`), category tags, annotation callout heads, control labels (`BIN WIDTH`, `MEAN LINE`), and axis category identifiers when set in caps. Set `letter-spacing="0.08em"` on all ALL CAPS text. Never use IBM Plex Mono for body text, prose labels, or axis value ticks (those remain serif).

IBM Plex Mono is the sole exception to the serif-only rule. The distinction is functional: serif for reading, monospace for labeling and identification.

The font chain tries the named font first; the SVG→PNG build step (`SCRIPTS/svg-to-png.mjs`) honors whichever fontconfig resolves. No font embedding.

---

**Strokes:**
- Box borders: `stroke="#D4D4D4"` `stroke-width="1"` `fill="#FFFFFF"`
- Chart area border: `stroke="#D4D4D4"` `stroke-width="0.75"` `fill="#F5EFE8"`
- Arrows: `stroke="#2a1a0e"` `stroke-width="1.5"` `fill="none"` with `marker-end`
- Dashed rules: `stroke-dasharray="4 3"` `stroke="#D4D4D4"` `stroke-width="0.75"`
- Reference lines (mean, median, baseline): `stroke-dasharray="5 4"` for primary, `stroke-dasharray="2 4"` for secondary — use token colors, not hardcoded hex
- No shadows. No rounded corners (`rx="0"`). No gradients.

**Arrowheads — define once in `<defs>`:**
```svg
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6"
          refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#2a1a0e"/>
  </marker>
</defs>
```

**Layout:**
- 32px margin all sides. Labels on 8px grid. Bézier paths for arc connectors. Flat fills.
- Chart area (plot region) uses `--color-fill` (`#F5EFE8`), not white, to visually bound the data space from the canvas.

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



After all chapters, append:

```
## Summary
Total chapters processed: {N}
Total tables rendered: {N}
Total SVG+PNG pairs generated: {N}
Total D3 HTML files generated: {N}
```

---

## Order of operations per chapter

1. PASS 1 — tables
2. PASS 2 — SVG → `images/`, D3 HTML → `d3/`, markdown link inserted, Prompts section updated
3. PASS 3 — log entry

After all chapters:

4. `node SCRIPTS/svg-to-png.mjs` — SVG → 300dpi PNG

Process in filename order. On error, log and continue.

---

## What NOT to do

- Do not alter prose, headings, exercises, or content outside figure comments, table comments, and Wayback Machine sections.
- Do not add headers above tables.
- Do not use hardcoded hex values — use the nine `--color-*` tokens defined above.
- Do not use serif fonts for ALL CAPS labels — use IBM Plex Mono.
- Do not use IBM Plex Mono for body text, prose labels, or axis value ticks — serif only.
- Do not use sans-serif (Inter, Roboto, Arial, etc.) anywhere in static SVGs.
- Do not rely on system fonts in SVGs beyond the declared font chains.
- Do not use underscores in filenames.
- Do not embed real photographs or real Wikimedia URLs.
- Do not name a living person (or post-2000 figure) in a Wayback Machine section.
- Do not hardcode hex values in D3 HTML — use `var(--color-*)`.
- Do not substitute a different CDN or D3 version.
- Do not write Prompts entries that describe figures visually — describe them structurally.
- Do not use `--color-ochre` as a sole category color alongside `--color-red` without a secondary encoding — luminance proximity makes them unsafe for colorblind viewers.
- Do not use `--color-red` for more than one data category in any single figure.
- Do not use more than three data-encoding colors in a single figure without secondary encodings.
- Do not use a white (`#FFFFFF`) chart area background — use `--color-fill` (`#F5EFE8`) for the plot region.
- Do not skip the grayscale test — every figure must be distinguishable without color.

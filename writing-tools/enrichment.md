# Appendix H — The LLM Enrichment Prompts

<!-- SUBJECT-SPECIFIC OPERATING FRAME: START -->

## Subject-Specific Operating Frame

This copy is specialized for this book. Use `writing-tools/figure-checker.md` as the domain anchor for expertise, examples, accuracy checks, and disciplinary judgment.

**Domain expert:** You are an AI systems professor with expertise across human-AI interaction, prompt engineering, agentic systems, model evaluation, automation risk, and science communication. Your job is to review figures submitted for a university-level AI or human-AI practice textbook and produce correction instructions that can be executed directly by a coding agent (Codex, Claude Code, or Cowork) on the source SVG files.

**Accuracy standard:** AI systems accuracy: Is everything shown conceptually and technically correct? Flag wrong workflow order, false autonomy claims, misleading model capability boundaries, incorrect human-in-the-loop logic, unsupported safety claims, confused training-vs-inference diagrams, broken agent loops, missing verification steps, or anything contradicting the chapter text.

When running this tool, adapt the generic instructions below to this subject:

- Prefer examples, metaphors, figures, and chapter structures that fit the domain expert's field.
- Treat the local accuracy standard as a hard gate before drafting, enriching, fact-checking, or approving content.
- Preserve disciplinary vocabulary, units, notation, citation norms, evidence hierarchy, and common student misconceptions for this subject.
- When a figure, table, diagram, or visual prompt is involved, apply the local `figure-checker.md` mental-model test before accepting the artifact.
- If the generic prompt below conflicts with the local subject frame, the subject frame wins.

<!-- SUBJECT-SPECIFIC OPERATING FRAME: END -->


*The Running Project Exercise Generator and the "With LLMs" Curriculum Enrichment Generator, reproduced for copying.*

---

These are the prompts behind Chapter 10 (*Enrichment for AI*). The **Running Project Exercise Generator** is the lighter pass — it proposes running projects and writes one end-of-chapter LLM Exercise per chapter. The **"With LLMs" Curriculum Enrichment Generator** is the full series pass — it adds a Claude Basics onboarding chapter, inline Dig Deeper prompts, and the LLM Exercises, and subsumes the lighter version. Both are discipline-agnostic. Copy the one matching your series format into your project. The maintained copies live in Bear Brown & Company's online prompt library [verify URL at time of writing]; if they differ from this appendix, the online copies are newer. This appendix also includes two further enrichment prompts — a **Deep Research Enrichment** prompt (keeps a chapter current and topically relevant) and a **When-to-Use / When-Not-to-Use AI** field map (the AI+1 thesis as a deliverable).

---

**Runs in:** Cowork or Codex — or any assistant with file read/write to your book directory.

**Dependencies:** drafted `chapters/*.md`; `TIKTOC.md` (capability statements); `metadata.yaml`. For the figure passes, your house-style `CLAUDE.md` + `DESIGN.md` (e.g. `~/textbooks/NEU`).

**Produces:** end-of-chapter LLM Exercises — and, in the full "With LLMs" pass, a Claude Basics chapter and inline Dig Deeper prompts; updates the TOC and `_notes.md`.

*The Deep Research Enrichment and When-to-Use / When-Not-to-Use prompts at the end of this appendix run in any chat or research-mode LLM (Gemini, ChatGPT, Claude) and need only a chapter or your field — no file access required.*

---

## Cowork Prompt: Running Project Exercise Generator
### For "FIELD and AI" Textbooks

---

### ROLE & CONTEXT

You are a curriculum designer working on a "FIELD and AI" textbook. You have access to all chapter markdown files for this book. Your job is to:

1. Read every chapter file
2. Identify the arc of the book — what concepts build on each other, what the learner can *do* by the end
3. Propose 3–5 candidate "running project" ideas that a learner could build incrementally, one chapter at a time, using AI tools (Claude, Claude Code, Cowork, or other LLMs)
4. Once a project is selected, generate a detailed **"LLM Exercise"** block for the end of each chapter — a prompt the learner uses with an AI tool to advance their project, grounded in that chapter's concepts

---

### STEP 1 — READ ALL CHAPTERS

Read every `.md` file in the textbook directory. For each chapter, extract:
- The chapter title and number
- The 2–3 core concepts introduced
- Any tools, frameworks, formulas, or methods taught
- What the learner can *do* after completing this chapter that they couldn't before

Produce a **Chapter Map** in this format:

```
Chapter N: [Title]
Core concepts: ...
New capabilities: ...
Key vocabulary: ...
```

---

### STEP 2 — PROPOSE 3–5 RUNNING PROJECTS

Based on the full Chapter Map, propose **3 to 5 candidate running projects**. Each project must:

- Be completable by a learner using AI tools (Claude, Claude Code, a Claude Project, or Cowork)
- Have a meaningful deliverable at the end of *every* chapter — not just the last one
- Be adaptable: a student in Finance could use it differently than one in Branding
- Represent a real artifact someone would actually want (a report, a tool, a dataset, a webpage, an analysis, an agent, etc.)
- Be achievable by both students and instructors

For each candidate, provide:

```
### Project Option [N]: [Name]

**What it is:** One sentence description.

**Final deliverable:** What exists at the end of the book.

**Why it fits this book:** How it maps to the book's arc.

**Adaptability:** How a Finance student vs. a Branding student would use it differently.

**Tool path:** Claude chat / Claude Project / Claude Code / Cowork / mix
```

**Present these options and pause. Do not proceed to Step 3 until the instructor or learner selects a project.**

---

### STEP 3 — GENERATE END-OF-CHAPTER LLM EXERCISES

Once a project is selected, generate an **"LLM Exercise"** block for each chapter. Each block follows this exact structure:

---

####  LLM Exercise — Chapter [N]: [Chapter Title]

**Project:** [Selected project name]
**What you're building this chapter:** [One sentence — what piece of the project this adds]
**Tool:** [Claude / Claude Project / Claude Code / Cowork — recommend the best fit]
ALWAYS add the LLM exercise at the bottom of the chapter. NOT as a separate document

---

**The Prompt:**

```
[Full, copy-paste-ready prompt. Written for Claude by default.
Should:
- Reference the chapter's core concepts explicitly
- Give enough context that it works without reading the chapter first
- Produce a concrete output (code, analysis, copy, data structure, web page, etc.)
- Build on outputs from previous chapters where applicable
- Be specific enough to work, open enough to adapt]
```

---

**What this produces:** [Describe the expected output — a file, a plan, a page, a function, etc.]

**How to adapt this prompt:**
- *For your own project:* Replace [X] with your domain, [Y] with your specific data or context
- *For ChatGPT / Gemini:* [Note any phrasing changes needed — usually minimal]
- *For Claude Code:* [If applicable — how to turn this into a code-generation task]
- *For a Claude Project:* [If applicable — what to put in the system prompt vs. the message]

**Connection to previous chapters:** [How this builds on prior LLM exercises]
**Preview of next chapter:** [One sentence teaser of what the next exercise will add]

---

### FORMATTING RULES

- Every LLM Exercise must be **copy-paste ready** — no "[fill this in]" placeholders in the prompt itself, only in the adaptation notes
- Default tool is **Claude** (claude.ai chat)
- Recommend **Claude Code** when the exercise produces runnable code or file manipulation
- Recommend a **Claude Project** when the exercise benefits from persistent context across sessions (e.g., the learner is building something they'll return to repeatedly)
- Recommend **Cowork** when the exercise involves reading/writing files or automating multi-step tasks
- Each prompt should stand alone — a learner who skips earlier chapters can still run it
- Adaptation notes must be genuinely useful, not boilerplate

---

### TONE & AUDIENCE

- **Students:** Prompts should feel like a guided starting point, not homework instructions. The learner should feel like they're building *their* thing, not completing an assignment.
- **Instructors:** The structure should be easy to swap out for a different domain or dataset. Adaptation notes support this directly.
- Write at the level of an engaged undergraduate or early-career professional with no prior AI tool experience but genuine curiosity.

---

### OUTPUT ORDER

1. Chapter Map (all chapters)
2. 3–5 Project Options → **PAUSE for selection**
3. After selection: Full LLM Exercise blocks for every chapter, in order

---

### NOTES FOR ADAPTING THIS PROMPT TO OTHER LLMs

- **ChatGPT (GPT-4o):** Works as-is. Remove references to "Claude Project" and replace with "Custom GPT" in adaptation notes.
- **Gemini:** Works as-is. Note that Gemini's file-reading from Google Drive may offer a tighter integration than Cowork for some workflows.
- **Claude Code:** Best used for Step 3 output when the textbook has code-heavy chapters. Feed it the Chapter Map from Step 1 and ask it to generate the exercise blocks as `.md` files directly.
## Cowork Prompt: "With LLMs" Series — Curriculum Enrichment Generator

---

### ROLE & CONTEXT

You are a curriculum designer working on a **"[FIELD] with LLMs" textbook**. You have access to a book directory. Your job is to:

1. Detect what state the book is in — written, unwritten, or sourced from external material — and follow the appropriate path
2. Write chapters if they don't yet exist
3. Generate **Chapter 00: Claude Basics** — a standalone onboarding chapter
4. Propose 3–5 candidate **Running Projects** a learner builds incrementally, one chapter at a time
5. Once a project is selected, enrich every chapter with:
   - **Dig Deeper prompts** — inline invitations to explore a concept further with Claude
   - **LLM Exercise** — a chapter-end project prompt that advances the running build

---

### STEP 0 — DETECT BOOK STATE

Before doing anything else, inspect `BOOK_DIR/chapters/` and determine which of three book states applies. The state controls everything that follows.

#### How to detect

**State A — Written book:**
`chapters/` contains `.md` files directly — no subfolders. These are complete, authored chapters. Example:

```
chapters/
├── 01-the-loop-and-the-three-modes.md
├── 02-the-nine-capacities.md
└── ...
```


→ The book is already written. **Do not rewrite or alter the chapter prose.** Proceed directly to Step 1 (Chapter Map) → Step 2 (Chapter 00) → Step 3 (Projects) → Step 4 (Enrich).

---

**State B — Unwritten book with source subfolders:**
`chapters/` contains numbered subfolders, each holding source `.md` files. Example:

NOTE: these are usually .md files but sometimes .mdx files
if there are meta.json or other .json files with meta data containing chapter names uses those


```
chapters/
├── 01-chapter-slug/
│   ├── 01-source.md
│   └── 02-source.md
└── 02-chapter-slug/
    └── ...
```

→ Chapters must be written from source first. Follow the **Chapter Writing Procedure — State B** below, then proceed to Step 1 → Step 2 → Step 3 → Step 4.

---

**State C — External or OpenStax source:**
`chapters/` either doesn't exist, is empty, or contains a directory structure that doesn't match the numbered-subfolder convention (e.g., OpenStax module folders, named content directories, imported `.cnxml`/`.html`/`.rst` trees). Example:

```
chapters/
└── m12345-forces-and-motion/
    ├── index.cnxml
    └── media/
```

Or source material is elsewhere in `BOOK_DIR/` entirely.

→ Source mapping is required before writing. Follow **Chapter Writing Procedure — State C** below, then State B steps, then Step 1 → Step 2 → Step 3 → Step 4.

---

**If state is ambiguous**, report what you found and ask for clarification before proceeding.

---

### CHAPTER WRITING PROCEDURE — STATE B

*Skip entirely for State A. For State C, complete State C mapping first, then follow these steps.*

For each subfolder `NAME/` inside `BOOK_DIR/chapters/` (process alphabetically, which preserves chapter order):

**B1. Read source.** Load every `.md` file in the subfolder, sorted by filename. Every fact, equation, citation, and data point in the rewrite must come from this source. Nothing fabricated.

**B2. Synthesize.** Apply the Attenborough × Feynman v1.1 style and the 8-section chapter structure (specified in the parent workflow document) to produce a single rewritten chapter. Target: 5,000–8,000 words. If source is thin, write what it supports — do not pad.

**B3. Save.** Write to `BOOK_DIR/chapters/NAME.md` — filename matches the subfolder name exactly.

**B4. Companion files.** Generate:
- `BOOK_DIR/pantry/NAME.md` — reusable ingredients extracted from the chapter
- `BOOK_DIR/images/NAME.md` — figure briefs from `[FIGURE: ...]` placeholders
- `BOOK_DIR/bookmaps/NAME.md` — source map (which source files contributed what)

**B5. Verify.** Confirm: chapter exists and is ≥ 3,500 words; all three companion files are non-empty; chapter passes the Combined Test checklist.

**B6. Cleanup (gated on verification).** If B5 passes, remove `BOOK_DIR/chapters/NAME/`. If B5 fails, leave the subfolder in place, save the partial output anyway, and log a warning to `BOOK_DIR/_notes.md`.

---

### CHAPTER WRITING PROCEDURE — STATE C

**C1. Map the source.** Inspect all source files and directories. Identify logical chapter units by section heading, module ID, file grouping, or any structural logic present in the source. Produce a **Source Map** before writing anything:

```
Source Map — [Book Title]

Module / folder: [path]
  Proposed chapter: [number and slug]
  Content summary: [2–3 sentences]
  Source format: [md / cnxml / html / rst / other]
  Conversion notes: [markup issues, gaps, ambiguous boundaries]
```

**Present the Source Map and pause. Confirm the chapter mapping before writing.** Chapter boundaries in external source are often unclear — instructor input may be required.

**C2. Convert.** For each source unit:
- `.cnxml` / `.html` / `.rst` → strip markup, extract prose and equations as plain markdown
- Preserve all equations, figures, citations, and data points
- Material that doesn't fit the chapter structure goes to the bookmap companion under "Deferred" — do not discard it

**C3–C6.** Follow State B steps B2–B6 using converted source as input.

---

### STEP 1 — BUILD CHAPTER MAP

Once all chapters exist as flat `.md` files in `chapters/`, read every one. Extract:

- Chapter title and number
- The 2–3 core concepts introduced
- Any tools, frameworks, formulas, or methods taught
- What the learner can *do* after this chapter that they couldn't before
- Concepts rich enough to reward Dig Deeper exploration

Produce a **Chapter Map**:

```
Chapter N: [Title]
Core concepts: ...
New capabilities: ...
Key vocabulary: ...
Dig-deeper candidates: [2–4 concepts per chapter]
```

---

### STEP 2 — GENERATE CHAPTER 00: CLAUDE BASICS

Produce a full **Chapter 00** inserted at the start of the book. This chapter is not about the book's subject — it is about how to use Claude throughout the book.

The tone of Chapter 00 depends on book state:

- **State A (written book):** The book was written as a standalone text. The LLM layer has been added afterward. Chapter 00 acknowledges this honestly: the book stands on its own; Claude is an optional but powerful companion for learners who want to go further or build something real.
- **States B and C (written for this series):** The LLM layer is native to the book's design. Chapter 00 frames it as integral from the start.

In all cases, Chapter 00 is honest that the book is optimized for **Claude**, and includes clear guidance for adapting prompts to other tools.

#### Required sections:

**1. Why this book uses LLMs**
Not "AI is transforming everything." Something specific to *this field*: what LLMs are genuinely useful for here, where they fall short, and what posture to bring — curious, skeptical, iterative. Name Claude as the primary tool. Note briefly that the prompts work on other LLMs with minor adjustment.

**2. Two types of prompts in this book**
Explain each type clearly:

- **Dig Deeper prompts** appear inline throughout chapters, marked `↳ Dig Deeper`. They are optional invitations — when a concept catches your attention, the prompt gives you a head start on going further. They don't feed the running project. Skipping them costs nothing.
- **LLM Exercises** appear at the end of every chapter. Each one advances a running project the learner builds across the whole book. Copy-paste ready, but designed to be adapted to your domain.

**3. How to use the prompts**
Practical guide covering:
- How to adapt placeholder variables without breaking the prompt
- When to use Claude chat vs. Claude Project vs. Claude Code vs. Cowork — give a decision rule, not just a list
- What to do when Claude's output is wrong or thin: iterate with a follow-up, don't abandon
- How to carry Claude output forward into the next exercise

**4. Worked example**
Take the most accessible LLM Exercise from the book (usually Chapter 1 or 2). Walk through:
- The prompt as written
- An adapted version for a specific domain (pick a concrete one — choose whatever fits the book's likely audience)
- What a strong Claude response looks like
- What a weak response looks like, and the follow-up that fixes it

**5. Claude's limitations in this context**
Field-specific failure modes the learner will actually hit. Not generic disclaimers — two or three concrete examples of where Claude gets it wrong in this subject area and what to do about it.

**6. Quick-reference card**
A compact table the learner can return to:
Prompt type | When to use it | What it produces | Recommended tool

---

Format Chapter 00 using the same Attenborough × Feynman voice and 8-section structure as all other chapters, adapted for its meta subject. Save as `BOOK_DIR/chapters/00-claude-basics.md`.

**Confirm Chapter 00 before proceeding to Step 3.**

---

### STEP 3 — PROPOSE 3–5 RUNNING PROJECTS

Based on the full Chapter Map, propose **3 to 5 candidate running projects**. Each must:

- Be completable using Claude, Claude Code, a Claude Project, or Cowork
- Have a meaningful deliverable at the end of *every* chapter — not just the last one
- Be adaptable across domains and learner contexts
- Produce a real artifact (report, tool, dataset, analysis, agent, webpage, etc.)
- Be achievable by both students and instructors

For each candidate:

```
### Project Option [N]: [Name]

**What it is:** One sentence.

**Final deliverable:** What exists at the end of the book.

**Why it fits this book:** How it maps to the book's arc.

**Adaptability:** How two different domain users would approach it differently.

**Tool path:** Claude chat / Claude Project / Claude Code / Cowork / mix

**Chapter 00 connection:** How the onboarding chapter sets this project up.
```

**Present options and pause. Do not proceed to Step 4 until a project is selected.**

---

### STEP 4 — ENRICH ALL CHAPTERS

Once a project is selected, add two types of LLM content to every chapter — **inserted directly into the chapter file, not in separate documents.**

For State A books: insert into existing chapter files without altering existing prose.
For States B and C: insert into the newly written chapter files.

---

#### TYPE 1: DIG DEEPER PROMPTS (inline)

**Placement rules:**
- 2–4 per chapter, distributed across sections — not clustered at the end
- Place after a paragraph or section where a concept has more depth than the chapter explores
- Do not place immediately after a worked example — the example is already the elaboration there
- Mark with: `↳ **Dig Deeper**`

**Format:**

```
↳ **Dig Deeper — [Concept name]**

*[One sentence: what this explores and why it rewards a detour.]*

**Prompt:**
> [Full, copy-paste-ready prompt. 2–5 sentences. Works from this paragraph alone —
> the learner doesn't need to have read the rest of the chapter. References the
> specific concept just introduced.]

**What to do with the output:** [One sentence — read it, save it, compare it to X.]
```

Dig Deeper prompts produce no deliverables for the running project. They are rabbit holes for curious learners. Make them worth following. Some learners will skip all of them — that's fine.

---

#### TYPE 2: LLM EXERCISE (end of chapter)

One per chapter, placed at the very end, advancing the selected running project.

**Format:**

---

#### LLM Exercise — Chapter [N]: [Chapter Title]

**Project:** [Selected project name]
**What you're building this chapter:** [One sentence]
**Tool:** [Recommended: Claude / Claude Project / Claude Code / Cowork]

---

**The Prompt:**

```
[Full, copy-paste-ready prompt. Written for Claude by default.
Must:
- Name the chapter's core concepts explicitly
- Provide enough context to work without having read the chapter
- Produce a concrete, named output (file, plan, page, function, section, etc.)
- Build visibly on prior chapter outputs where applicable
- Be specific enough to work, open enough to adapt]
```

---

**What this produces:** [Concrete description of expected output.]

**How to adapt this prompt:**
- *For your own domain:* Replace [X] with your context, [Y] with your data or subject
- *For ChatGPT / Gemini:* [Any phrasing changes — usually minimal]
- *For Claude Code:* [If applicable — how to make this a code task]
- *For a Claude Project:* [If applicable — what goes in system prompt vs. message]

**Connection to previous chapters:** [How this builds on prior LLM Exercises]
**Preview of next chapter:** [One sentence: what the next exercise adds]

---

### FORMATTING RULES

- Every prompt — Dig Deeper and LLM Exercise — must be **copy-paste ready.** No unfilled placeholders inside prompt text, only in adaptation notes.
- Dig Deeper prompt text uses `>` blockquote formatting
- LLM Exercise prompt text uses a fenced code block
- Default tool: **Claude** (claude.ai chat)
- Recommend **Claude Project** when the learner returns to the same build across multiple sessions
- Recommend **Claude Code** when the exercise produces runnable code or file manipulation
- Recommend **Cowork** when the exercise involves reading/writing files or multi-step automation
- Each LLM Exercise stands alone — a learner who skips earlier chapters can still run it
- Dig Deeper prompts must read as optional — never frame them as required

---

### UPDATE TOC AND NOTES

After all chapters are enriched:

**TOC:** Rewrite `BOOK_DIR/_toc.md` to list `00-claude-basics.md` as the first entry, followed by all chapter files in order. Preserve existing formatting conventions; create the file if it doesn't exist.

**Notes:** Append to `BOOK_DIR/_notes.md`:

```
## [ISO date] — "With LLMs" enrichment run

Book state: [A — written / B — source subfolders / C — external source]
Chapters written: [N — States B and C only, 0 for State A]
Chapter 00 generated: 00-claude-basics.md
Running project selected: [name]
Dig Deeper prompts added: [total count]
LLM Exercises added: [total count]

Chapter log:
- 00-claude-basics — [word count] words — generated
- 01-[slug] — [word count] words — [enriched / written + enriched] — [OK / FLAGGED: reason]
- ...
```

Create `_notes.md` if it doesn't exist.

---

### TONE & AUDIENCE

Write for an engaged undergraduate or early-career professional with genuine curiosity and no prior LLM experience. The learner should feel like they're building *their* thing, not completing an assignment. Instructors should find the structure easy to remap to a different domain or dataset.

- **Dig Deeper prompts** — a colleague leaning over: "you know what's interesting here..."
- **LLM Exercises** — the next satisfying step in building something real
- **Chapter 00** — honest, practical onboarding. Not a pitch for AI. Not a liability disclaimer.

---

### OUTPUT ORDER

1. **Book state detected** — report which state and why
2. *(State C only)* Source Map → **pause for confirmation**
3. *(States B and C)* Write chapters per procedure above
4. Chapter Map (all chapters, including Dig Deeper candidates)
5. Chapter 00: Claude Basics — full draft → **confirm before proceeding**
6. 3–5 Project Options → **pause for selection**
7. Enriched chapter content for every chapter, in order

---

### NOTES FOR ADAPTING TO OTHER LLMs

- **ChatGPT (GPT-4o):** Works as-is. Replace "Claude Project" with "Custom GPT" in all adaptation notes.
- **Gemini:** Works as-is. Note that Gemini's Google Drive integration may offer tighter file workflows than Cowork for some learners.
- **Claude Code:** Best for Step 4 when the book has code-heavy chapters. Feed it the Chapter Map and ask it to write enriched blocks as `.md` files directly.
- **Chapter 00 adaptation:** The chapter names Claude as primary tool but covers adaptation to others in section 3. If the series uses a different primary tool, update section 1 and the quick-reference card accordingly.# Cowork or Codex Prompt — Chapter Enrichment: Tables and Figures (NEU)

The CLAUDE.md for D3 guidelines and the DESIGN.md for visual guidelines are here `~/textbooks/NEU`

Overwrite any existing graphics.

### What this does
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

### Instructions

#### SETUP — run once before processing any chapter

1. Confirm the working directory contains `chapters/`, `images/`, `d3/`, `SCRIPTS/`, and `metadata.yaml`.
2. If `images/` or `d3/` do not exist, create them.
3. Confirm `node` is available: run `node --version`. If it fails, stop and report.
4. Confirm `sharp` is installed: run `node -e "import('sharp').then(() => console.log('ok'))"`. If it fails, run `npm install` from the book root before proceeding.
5. Read `NEU/CLAUDE.md` and `NEU/DESIGN.md` in full. If those paths do not exist, check `brutalist/CLAUDE.md` and `brutalist/DESIGN.md`. Every D3 HTML file and every SVG generated must conform to both documents. Do not proceed without reading them.
6. Read `metadata.yaml` in full. Extract: `title`, `author`, `date`.
7. Build a chapter list: all `.md` files in `chapters/`, sorted by filename.
8. Extract the chapter slug from each filename (the full filename minus `.md`, e.g., `07-comparison-charts`). Use this for all figure filenames.

---

#### PASS 1 — Tables

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

#### PASS 2 — Figures / SVGs + D3 HTML + Prompts

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

##### Step A — Determine figure number and filename

1. Infer the figure number from a nearby `*Figure N.N*` label or `![Figure N.N` alt text, or assign the next sequential number within the chapter.
2. Construct filenames:
   - Format: `{chapter-slug}-fig-{figure-number-zero-padded}`
   - Example: `07-comparison-charts-fig-05`
   - Hyphens throughout. No underscores. No spaces.

---

##### Step B — Generate the static SVG

Generate a static SVG conforming to the **SVG Style Guide** below. Save to:

```
images/{chapter-slug}-fig-{NN}.svg
```

**If a real image file already exists** at the corresponding path (`.jpg` or `.png`), do not overwrite — skip SVG generation, leave the existing `![…]` tag in place, and still add a Prompts entry (Step E).

###### SVG generation rule: produce real content

Generate SVG that visually represents the concept described in the figure comment. Every label, axis value, node name, flow stage, and annotation is inferred from the content description and surrounding chapter context. **No placeholder text. No `[fill in]` strings. No empty boxes.** If the description does not provide enough specifics for a label, derive a plausible, discipline-appropriate value.

###### Figure type → rendering approach

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

###### SVG metadata block

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

##### Step C — Generate the D3 HTML file

Generate a standalone D3 v7 HTML file that produces an interactive version of the same figure. Must conform to `NEU/CLAUDE.md` (stack, naming, patterns, accessibility) and `NEU/DESIGN.md` (color, typography, spacing).

Key requirements:
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` — no substitutions
- Color: `var(--color-*)` CSS custom properties from DESIGN.md — no hardcoded hex
- Fonts: `'Real Head Pro', 'FF Real', Lato, sans-serif` for all text including chart titles, labels, axis ticks, captions; `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` for code blocks and inline code only
- Event handlers: `(event, d)` parameter order — `d3.event` does not exist in v7
- Accessibility: `role="img"`, `aria-labelledby`, `<title>`, `<desc>` on every SVG
- Responsive: ResizeObserver redraw pattern
- Dark mode: `prefers-color-scheme: dark` CSS variables per DESIGN.md
- Reduced motion: suppress all transitions under `prefers-reduced-motion: reduce`
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` — no bounce, no overshoot
- Chart enter animation: 320ms; hover state: 120ms; tooltip appear: 150ms, disappear: 100ms

Save to:

```
d3/{chapter-slug}-fig-{NN}.html
```

---

##### Step D — Insert the markdown reference

Insert the image above the original comment (and any adjacent stub `![Figure …]` placeholder) with:

```markdown
![{descriptive alt text from the figure description}](images/{chapter-slug}-fig-{NN}.png)
*Figure {N.N} — {short title from the description}*
```

The link points to the PNG (not the SVG). The PNG is produced by `SCRIPTS/svg-to-png.mjs` in the post-pass step.

---

##### Step E — Add a Prompts entry

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

#### PASS 3 — CAJAL PNG Insertion

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

#### PASS 4 — PNG conversion

After all chapters are processed, run:

```bash
node SCRIPTS/svg-to-png.mjs
```

Converts every `images/**/*.svg` to 300dpi PNG. Idempotent — skips PNGs newer than their SVG source.

---

#### PASS 5 — Write back and report

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

### SVG Style Guide — every generated static figure

**Register:** Academic / long-form reading. Northeastern University brand-compliant. Suitable for print and digital reproduction.

#### Geometry

- `viewBox="0 0 700 420"` unless figure content requires more height; add in 60px increments (480, 540, 600).
- No `width` or `height` attribute on `<svg>`.
- 32px margin all sides.
- Labels on 8px grid.
- No gradients. No shadows. No glassmorphism. No neumorphism. No 3D effects.

#### Accessibility

Every SVG must have `role="img"`, `aria-labelledby` pointing to the `<title>` element ID, and both `<title>` and `<desc>` populated:

```xml
<svg viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="fig-title-{NN}">
  <title id="fig-title-{NN}">{figure-title}</title>
  <desc>{concept description}</desc>
```

#### Color palette — Northeastern University brand

Use these hex values directly in SVG attributes. Do not use CSS custom properties in static SVG — write the hex value.

| Token | Hex | Role | Use |
|---|---|---|---|
| `--color-white` | `#FFFFFF` | Canvas | SVG background and chart area |
| `--color-ink` | `#000000` | Primary text | Headings, axes, structural strokes, body copy |
| `--color-red` | `#C8102E` | Primary accent | Primary data series, brand emphasis |
| `--color-gold` | `#A4804A` | Decorative accent | Callout borders, figure label accents — never data encoding |
| `--color-secondary` | `#555555` | Supporting text | Captions, axis labels, source lines |
| `--color-border` | `#CCCCCC` | Hairlines | Grid lines, dividers, box borders |

**Brand proportion guidance:** Approximately 35% black · 35% white · 27% red · 3% gold across a composition. Ink and white carry the structure. Red signals brand, emphasis, and the primary data series. Gold appears at most in a single accent element per composition — it is a note, not a theme.

**Data-encoding rules:**
- `#C8102E` (red) encodes the first (or only) highlighted data category. One category per figure.
- `#000000` (ink) or neutral grays (`#787878`, `#ADADAD`) may serve as additional data categories when a neutral contrast is needed.
- `#A4804A` (gold) is **never** a data-encoding color — decorative use only (callout box left-borders, figure label accents, pull quote underlines). Honor the 3% proportion: one gold element per figure, no more.
- `#555555` (secondary) and `#CCCCCC` (border) are structural — never use them to encode data categories.
- Maximum two data-encoding colors (red + neutral gray) before requiring secondary encodings (patterns, direct labels, or figure decomposition).
- Red never encodes danger, negative values, or alert states — red is brand and primary series only.

**Accessibility — contrast ratios:**

| Pair | Ratio | Level |
|---|---|---|
| `#000000` on white | 21.0:1 | AAA |
| `#C8102E` on white | 5.9:1 | AA |
| `#555555` on white | 7.3:1 | AAA |
| `#A4804A` on white | ~3.0:1 | AA large only — decorative use only |

Simulate color-blind before finalizing any chart. Protanopia and deuteranopia are the primary targets.

**Luminance ladder — test every figure in grayscale:**

| Token | Hex | Approx. L* | Role |
|---|---|---|---|
| `--color-ink` | `#000000` | ~0 | Primary text / dark anchor |
| `--color-red` | `#C8102E` | ~25 | Primary data accent |
| `--color-secondary` | `#555555` | ~37 | Label text |
| `--color-gold` | `#A4804A` | ~53 | Decorative accent only |
| `--color-border` | `#CCCCCC` | ~80 | Hairlines |
| `--color-white` | `#FFFFFF` | ~100 | Canvas |

Each data-encoding color must occupy a distinct luminance band. If any two data colors appear indistinguishable in grayscale, add a secondary encoding before proceeding.

#### Typography — Northeastern University brand

| Role | Font family | Size | Weight | Fill |
|---|---|---|---|---|
| Figure title / display | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 14 | 700 | `#000000` |
| Body / item label | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 12 | 400 | `#000000` |
| Caption / sub-label | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 11 | 400 | `#555555` |
| Axis tick labels | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 11 | 400 | `#555555` |
| Source / ALL CAPS identifier | `'Real Head Pro', 'FF Real', Lato, sans-serif` | 10 | 400 | `#555555` |

**Font notes:**
- Real Head Pro (FF Real) is the Northeastern official typeface — use for all text in every role without exception.
- Lato is the official fallback where Real Head Pro / FF Real is unavailable.
- JetBrains Mono is for code blocks and inline code only — never for chart text, axis ticks, or labels.
- Do not use Inter, Roboto, Arial, Helvetica, system-ui, or any other sans-serif substitute.
- Do not use any serif font (Georgia, Times New Roman, EB Garamond, etc.) anywhere.
- ALL CAPS source lines: `letter-spacing="0.08em"`.
- Sentence case everywhere else. No ALL-CAPS headings.

#### Strokes

- Box borders: `stroke="#CCCCCC"` `stroke-width="1"` `fill="#FFFFFF"`
- Chart area border: `stroke="#CCCCCC"` `stroke-width="0.75"` `fill="#FFFFFF"`
- Arrows: `stroke="#000000"` `stroke-width="1.5"` `fill="none"` with `marker-end`
- Dashed rules: `stroke-dasharray="4 3"` `stroke="#CCCCCC"` `stroke-width="0.75"`
- Reference lines (mean, median, baseline): `stroke-dasharray="5 4"` for primary, `stroke-dasharray="2 4"` for secondary
- Callout left-border accent: `stroke="#A4804A"` `stroke-width="3"` (decorative only)
- No shadows. No gradients.

#### Radii

- Small elements (code badges, tags): `rx="4"`
- Callout boxes and cards: `rx="8"`
- No fully-rounded shapes. No `rx="50%"` on rectangular elements.

#### Arrowheads — define once in `<defs>`

```xml
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6"
          refX="7" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#000000"/>
  </marker>
</defs>
```

#### Layout

- 32px margin all sides. Labels on 8px grid. Bézier paths for arc connectors. Flat fills.
- Chart area (plot region): `fill="#FFFFFF"` — white background. The Northeastern brand does not use a tinted chart area.
- Default chart margins: top 48 / right 40 / bottom 56 / left 64.
- Wide-label charts: top 48 / right 40 / bottom 56 / left 160.

---

### Order of operations per chapter

1. PASS 1 — tables
2. PASS 2 — SVG → `images/`, D3 HTML → `d3/`, markdown link inserted, Prompts section updated
3. PASS 3 — CAJAL PNG insertion (if `pantry/{chapter-slug}-cajal.md` exists)
4. PASS 5 — log entry

After all chapters:

5. PASS 4 — `node SCRIPTS/svg-to-png.mjs` — SVG → 300dpi PNG

Process in filename order. On error, log and continue.

---

### What NOT to do

- Do not alter prose, headings, exercises, or content outside figure comments and table comments.
- Do not add headers above tables.
- Do not use CSS custom properties in static SVG — write hex values directly.
- Do not use any font other than Real Head Pro / FF Real / Lato for SVG text — no Inter, no Arial, no Helvetica, no system-ui.
- Do not use any serif font anywhere (no Georgia, no EB Garamond, no Times New Roman).
- Do not use JetBrains Mono for chart text, axis ticks, or labels — code blocks only.
- Do not use underscores in filenames.
- Do not hardcode hex values in D3 HTML — use `var(--color-*)`.
- Do not substitute a different CDN or D3 version.
- Do not write Prompts entries that describe figures visually — describe them structurally.
- Do not use `#A4804A` (gold) as a data-encoding color — it is decorative only.
- Do not use more than one gold accent element per figure.
- Do not use `#C8102E` (red) for more than one data category in any single figure.
- Do not use more than two data-encoding colors (red + neutral gray) without secondary encodings.
- Do not skip the grayscale test — every figure must be distinguishable without color.
- Do not use `#555555` (secondary) or `#CCCCCC` (border) to encode data categories.
- Do not use red to encode danger, negative values, or alert states — red is brand and primary series only.
- Do not use gradients, shadows, glassmorphism, or neumorphism.
- Do not use rainbow color palettes — red is brand, grays are neutrals.
- Do not render chapter slugs, figure numbers, filenames, source-file paths, book titles, or other internal production metadata as visible text inside any SVG.
- Do not modify any file in `pantry/` — PASS 3 is read-only with respect to that directory.
- Do not use placeholder text, `[fill in]` strings, or empty labeled boxes — generate real content from the figure description.
- Do not reorder or replace existing `![…]` image references when inserting CAJAL PNGs — only insert missing ones.
- Do not use emoji anywhere in authored copy.
- Do not use ALL-CAPS headings — sentence case everywhere except source lines.
- Do not exceed one red data series and one gold decorative element per figure.The  CLAUDE.md for d3 guidlines and the DESIGN.md for visual guidelines are here ~/textbooks/NEU

All books are here ~/textbooks/books


---

## Deep Research Enrichment Prompt

*Runs in: Gemini Deep Research, ChatGPT Deep Research, or Claude — a research-mode model with web access. Paste a chapter (or its topic) and your field. No file access required.*

I am keeping a practitioner handbook, *AI for [FIELD]*, current and relevant for [YOUR ROLE]. Below is one chapter (or its topic):

[PASTE THE CHAPTER, OR NAME THE TOPIC]

Research and report:

1. **What has changed since this was written.** New tools, pricing, rulings, standards, datasets, or events in [FIELD] that affect any claim in the chapter. For each: the source, the date, and the specific sentence or claim it touches.
2. **What is now stale or at risk.** Any number, tool name, "current as of" claim, or best-practice statement a reader in [NEXT YEAR] would find dated. Flag each with the correction or the honest uncertainty.
3. **Where it could be more relevant to this reader.** Concrete additions — a recent case, a named practitioner, a regulation, a workflow — that would make the chapter land harder for [YOUR ROLE] specifically. Not "add more examples"; name the example.
4. **What the chapter is missing that the field now treats as essential.** Topics, tools, or debates that have become table-stakes in [FIELD] since the draft and are absent here.
5. **Primary sources only.** For every recommendation, cite a primary or authoritative source with a URL and date. Skip aggregators and trend pieces.

Return a prioritized list: what to fix before the next edition (load-bearing), what to consider (relevance), and what to watch (not yet, but soon).

---

## When to Use — and When Not to Use — AI: Field Map Prompt

*Runs in: any assistant (Claude, ChatGPT, Gemini); sharper in Cowork or Codex if it can read your drafted `chapters/*.md`. This is the AI+1 thesis as a deliverable — and the line moves by field, so set it for yours.*

I am writing *AI for [FIELD]* for [YOUR ROLE]. Produce a "when to use / when not to use AI" map specific to this field — not generic AI advice. Build three lists:

1. **Use it (Tier 1 — delegate freely).** Tasks in [FIELD] where AI is reliably useful and low-risk: pattern execution, drafts, summaries, routine generation. For each, name the task, the tool, and the check that catches the rare failure.
2. **Use it with a human in the loop (verify before it ships).** Tasks where AI accelerates but a practitioner must own the output: anything client- or public-facing, anything with legal, safety, or compliance exposure, anything where a fluent-but-wrong answer is expensive. For each, name what the human must verify and why the model cannot.
3. **Do not use it (irreducibly human).** Tasks where reaching for AI is malpractice or self-defeating in [FIELD]: high-stakes judgment, relational reads, accountability that must rest with a named person, work whose whole value is that a human did it. For each, name the task and the specific reason AI fails here — embodiment, stakes, relationship, or law.

For every line, give the reason, not just the verdict. Then name the two or three cases where reasonable practitioners in [FIELD] genuinely disagree about which list a task belongs on — the contested edges are where the reader most needs to think for themselves.

End with one sentence: the principle that decides borderline cases in [FIELD].

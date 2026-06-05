# Appendix D — The Research Pass Prompts

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


*The Chapter Research Gatherer and Chapter Research Pass, reproduced for copying.*

---

These are the two prompts behind Chapter 6 (*Research Pass: Pantry Population*). The **Gatherer** reads your `TIKTOC.md`, pulls relevant files from your shared library, and does first-pass web research into one notes file per chapter in `pantry/`. The **Research Pass** is the deeper version — nine structured sections per chapter, for contested or fast-moving fields. Both are discipline-agnostic. Copy the one you need into your project and point it at your book directory. The maintained copies live in Bear Brown & Company's online prompt library [verify URL at time of writing]; if they differ from this appendix, the online copies are newer.

---

**Runs in:** Cowork or Codex — or any assistant with file read/write to your book directory.

**Dependencies:** `TIKTOC.md` (chapter list and specs). *Optional:* a shared markdown library (default `~/textbooks/MD`) whose relevant files are copied in as `pantry/_lib_*.md`.

**Produces:** one `pantry/research-ch-NN-<slug>.md` per chapter, plus a pantry index.

---

## Cowork Prompt: Chapter Research Gatherer

---

### ROLE & CONTEXT

You are a research assistant for a textbook project. Your job is to:

1. Read `TIKTOC.md` from the book directory to get the chapter list
2. For each chapter, do deep web research to gather material needed to write that chapter
3. Save all gathered material as notes files in `pantry/`
4. Scan a shared markdown library for any related material and copy relevant files to `pantry/`

This prompt is generic — it works for any book directory that contains a `TIKTOC.md` file.

---

### STEP 0 — LOCATE THE BOOK

Determine `BOOK_DIR`:

- If a directory was passed as an argument or is otherwise specified, use it.
- Otherwise, look for `TIKTOC.md` in the current working directory. If found, that directory is `BOOK_DIR`.
- If `TIKTOC.md` is not found in the current directory, search one level up and in sibling directories.
- If `TIKTOC.md` cannot be located, report the directories searched and stop. Do not proceed without it.

Confirm `BOOK_DIR` before continuing.

---

### STEP 1 — READ TIKTOC.md

Read `BOOK_DIR/TIKTOC.md` in full.

Extract the chapter list. A chapter entry is any item that maps to a file that will be written to `BOOK_DIR/chapters/`. Chapters may appear as:

- A numbered list (e.g., `1. Chapter Title`)
- A markdown heading pattern (e.g., `### WEEK 3 — The Map Before the Territory`)
- An explicit filename reference (e.g., `03-the-map-before-the-territory.md`)
- A table row with chapter number and title

For each chapter, extract:

| Field | Description |
|-------|-------------|
| `chapter_number` | Integer (e.g., `3`) |
| `chapter_slug` | Kebab-case filename slug (e.g., `the-map-before-the-territory`) |
| `chapter_title` | Human-readable title |
| `chapter_description` | Any one-line summary or description in TIKTOC.md |
| `core_concepts` | Any concepts, learning outcomes, or topics listed for this chapter |
| `notes_filename` | Derived: `NN-slug_notes.md` where `NN` is zero-padded chapter number |

**Filename derivation rules:**
- Zero-pad the chapter number to 2 digits: chapter 3 → `03`
- Slugify the title: lowercase, spaces to hyphens, strip punctuation
- Notes filename: `{NN}-{slug}_notes.md`
- Example: Chapter 3 "The Map Before the Territory" → `03-the-map-before-the-territory_notes.md`

If TIKTOC.md uses a different numbering scheme (e.g., "Week 3" instead of "Chapter 3"), use the week/unit number as the chapter number.

**After extracting the full chapter list, print it for confirmation before proceeding:**

```
Chapter list extracted from TIKTOC.md:

  03 | the-map-before-the-territory | The Map Before the Territory
  04 | the-identification-layer     | The Identification Layer: What Only You Can Do
  ...

Total: N chapters
Proceeding to research phase.
```

---

### STEP 2 — SCAN THE SHARED MARKDOWN LIBRARY

Before doing any web research, scan the shared library for material that may already exist.

**Library path:** `~/textbooks/MD`

For each file in the library (recursively, all `.md` files):

1. Read the filename and first 50 lines
2. Score relevance to the book based on:
   - Overlap with the book's subject (inferred from TIKTOC.md title and chapter titles)
   - Overlap with any specific chapter's core concepts
   - Presence of key terms from TIKTOC.md

**Relevance threshold:** Copy any file scoring as "relevant" or "possibly relevant" to `BOOK_DIR/pantry/`. Prefix copied files with `_lib_` to indicate they came from the library, preserving the original filename.

Example: `~/textbooks/MD/causal-dags-intro.md` → `BOOK_DIR/pantry/_lib_causal-dags-intro.md`

**Do not copy:**
- Files that are clearly about an unrelated subject
- Duplicate content already in `pantry/`
- System files, build artifacts, or non-content files

**After the scan, report:**

```
Library scan complete: ~/textbooks/MD
  Files scanned: N
  Files copied to pantry/: N
    - _lib_filename-1.md  (relevant to: Chapter 3, Chapter 7)
    - _lib_filename-2.md  (relevant to: Chapter 5)
  Files skipped: N (unrelated subject)
```

If the library path does not exist or is empty, note this and continue.

---

### STEP 3 — DEEP RESEARCH PER CHAPTER

For each chapter in the extracted list, perform deep research and save notes to `BOOK_DIR/pantry/{notes_filename}`.

Process chapters in numerical order.

#### Research scope for each chapter

Using the chapter title, description, and core concepts from TIKTOC.md, gather:

**A. Conceptual foundations**
- What are the 3–5 most important ideas this chapter needs to convey?
- What is the clearest, most accurate explanation of each concept?
- What are the common misconceptions about each concept?
- What is the simplest correct worked example?

**B. Domain examples and cases**
- What are 2–4 real-world cases where this concept appears — especially in the book's domain?
- What are the most cited or well-known examples in the literature?
- What failure cases best illustrate the stakes of getting this concept wrong?

**C. Connections and dependencies**
- What must a reader already understand before this chapter makes sense?
- What concepts in this chapter unlock later chapters?
- How does this chapter's content connect to adjacent chapters in the TIKTOC?

**D. Current state of the field**
- What is settled vs. actively contested about this topic?
- What are the 3–5 most important references (papers, books, or sources) a chapter author should read?
- What has changed in the last 3 years that a textbook chapter should acknowledge?

**E. Teaching considerations**
- Where do students typically get stuck on this material?
- What analogies or framings have worked well in courses covering this topic?
- What exercises or problems best build the target skill?

#### Research execution

For each chapter:

1. Formulate 3–5 targeted web search queries based on the chapter's core concepts
2. Execute searches and fetch the most authoritative results
3. Synthesize findings into structured notes — do not dump raw search output
4. Cross-reference with any library files already copied to pantry that are relevant to this chapter

**Quality bar:** Notes must be substantive enough for a chapter author to sit down and write without needing to do their own background research. Every factual claim in the notes must have a source or be flagged as common knowledge.

---

### STEP 4 — NOTES FILE FORMAT

Save each chapter's notes as `BOOK_DIR/pantry/{notes_filename}`.

Use this structure:

```markdown
# Research Notes: Chapter NN — [Chapter Title]

**Source:** TIKTOC.md chapter entry
**Notes file:** NN-slug_notes.md
**Corresponding chapter:** chapters/NN-slug.md (not yet written)
**Generated:** [ISO date]

---

## Chapter summary (from TIKTOC.md)

[Paste the chapter description and learning outcomes from TIKTOC.md verbatim]

---

## A. Conceptual foundations

### [Concept 1 name]
[Explanation. 2–5 paragraphs. Accurate and complete enough to write from.]

**Common misconception:** [What learners typically get wrong and why]

**Worked example:** [Simplest correct example]

**Source(s):** [Citation or URL]

---

### [Concept 2 name]
...

---

## B. Domain examples and cases

### Case 1: [Name or short description]
[Situation. What happened. What the concept explains. Source.]

### Case 2: [Name or short description]
...

### Failure case: [Name or short description]
[What went wrong. What the concept explains about why.]

---

## C. Connections and dependencies

**Prerequisites (what reader must already know):**
- [Item] — [why it's needed]

**Unlocks (what this chapter makes possible):**
- [Item] — [how it connects forward]

**Adjacent chapter connections:**
- Chapter [N-1]: [connection]
- Chapter [N+1]: [connection]

---

## D. Current state of the field

**Settled:**
- [Claim] — [brief justification]

**Contested or emerging:**
- [Claim] — [why it's contested, who disagrees]

**Key references:**
1. [Author, Title, Year] — [one sentence: why this is essential]
2. ...

**Recent developments (last 3 years):**
- [Development] — [implication for the chapter]

---

## E. Teaching considerations

**Where students get stuck:**
- [Specific sticking point] — [why, and what helps]

**Analogies and framings that work:**
- [Analogy] — [why it lands]

**Exercises that build the target skill:**
- [Exercise description] — [Bloom's level, what it tests]

---

## F. Library files relevant to this chapter

[List any `_lib_*` files in pantry/ that are relevant, with a one-sentence note on what each contributes]

- `_lib_filename.md` — [what it contributes]

(None found) — if no library files are relevant

---

## G. Gaps and flags

[Anything the chapter author should know: contested territory, missing data, topics that need domain expertise to verify, places where Claude's knowledge may be limited or dated]

- FLAG: [issue]
- GAP: [what couldn't be found]
```

---

### STEP 5 — UPDATE PANTRY INDEX

After all notes files are written, create or update `BOOK_DIR/pantry/README.md`.

The index should list:

1. All `_lib_*` files with one-line descriptions and which chapters they relate to
2. All `*_notes.md` files with one-line descriptions
3. Any other files already in pantry (do not delete or alter them)

Format:

```markdown
# Pantry Index

Last updated: [ISO date]

## Research notes (generated)

| File | Chapter | Description |
|------|---------|-------------|
| 01-slug_notes.md | Chapter 1 | Research for "Chapter Title" |
| ... | | |

## Library files (copied from shared MD library)

| File | Relevant to | Notes |
|------|------------|-------|
| _lib_filename.md | Ch. 3, Ch. 7 | [one-line description] |
| ... | | |

## Other pantry contents

[List any other files found in pantry/ on arrival]
```

---

### STEP 6 — FINAL REPORT

Print a summary:

```
Research Gatherer — Complete
════════════════════════════════════════

Book directory : BOOK_DIR
TIKTOC.md      : found, N chapters extracted

Library scan
  Path         : ~/textbooks/MD
  Files copied : N

Research notes written
  01-slug_notes.md         ✓  [word count approx]
  02-slug_notes.md         ✓
  ...
  NN-slug_notes.md         ✓  [or FLAGGED: reason]

Pantry index   : pantry/README.md updated

Flags requiring author attention:
  - Chapter 3: [flag description]
  - Chapter 7: [flag description]
  (None) — if no flags

Next step: run the chapter writing prompt against this book directory.
The pantry contains all gathered material. No chapter prose has been written yet.
```

---

### BEHAVIORAL RULES

- **Never write chapter prose.** This prompt gathers material only. Chapter drafting is a separate step.
- **Never fabricate sources.** If a reference cannot be found or verified, flag it as unverified rather than inventing a citation.
- **Synthesize, don't dump.** Notes should be digested, not raw search results pasted wholesale.
- **One notes file per chapter, no exceptions.** Even if a chapter is thin in TIKTOC.md, create the notes file and note what couldn't be found.
- **Preserve existing pantry contents.** Copy and create; never delete.
- **Flag, don't skip.** If research for a chapter is incomplete or a concept is contested, write what was found and add a FLAG entry in section G.
- **Chapter order matters.** Process chapters in numerical order so connections to adjacent chapters are visible by the time later chapters are researched.

---

### NOTES FOR ADAPTING TO OTHER LLMs

- **ChatGPT / Gemini:** Works as-is. File operations via Code Interpreter or equivalent.
- **Claude Code:** Preferred for this prompt — file read/write is native. Run from `BOOK_DIR` for automatic path resolution.
- **Cowork:** The file operations (scan library, copy files, write pantry) map directly to Cowork's file tools. Ensure the shared library path `~/textbooks/MD` is accessible from the Cowork environment.
## Cowork or Codex  Prompt: Chapter Research Pass
### Generic — reads all book information from TIKTOC.md

---

### ROLE & CONTEXT

You are a research assistant working on a textbook project. You have
access to the book directory. Your job is to run deep research for
each chapter and save the results into `pantry/` as individual
research files — one file per chapter — ready for a human author
or contributor to draw from when drafting.

You know nothing about this book yet. Read TIKTOC.md first.
Everything you need — the title, the argument, the reader, the
chapter list, the learning outcomes, the case strategy, the
contested claims — is in that file.

---

### STEP 1 — READ THE BOOK

Read these files in order before doing anything else:

1. `TIKTOC.md` — the full TOC draft. This is your primary source.
   Extract from it:
   - The book title, author, and one-sentence logline
   - The learner profile (who the reader is, what they already know,
     what they cannot yet do)
   - The central thesis (what the book argues)
   - The three-act learning arc (how the book is structured)
   - The chapter list with one-line descriptions, learning outcomes,
     opening strategies, core content blocks, and bridge questions
   - The contested claims (what the field disputes)
   - The aging risk audit (what content may become outdated)
   - The domain coverage map for cases (which domains appear where)

2. `book.md` — if it exists and has been filled in. Use it to
   supplement or correct anything in TIKTOC.md.

3. `outline.md` — if it exists and has been filled in. Use it
   for sequencing context.

After reading, construct an internal working summary:
- Book title and thesis in one sentence
- Reader profile in two sentences
- Number of chapters and their titles in order
- The three most important contested claims
- The primary application domain for examples

Do not save this summary. Use it to calibrate every research file.

---

### STEP 2 — PRODUCE ONE RESEARCH FILE PER CHAPTER

For each chapter in the book (full list from TIKTOC.md), produce
one research file saved to:

```
pantry/research-ch-NN-[slug].md
```

Where NN is the chapter number, zero-padded (01, 02, ... up to
however many chapters the book has), and slug is a short kebab-case
version of the chapter title. Examples:
- `pantry/research-ch-01-[first-chapter-slug].md`
- `pantry/research-ch-07-[seventh-chapter-slug].md`

If the book uses weeks, parts, or units rather than numbered
chapters, use the sequential position number (01, 02, ...).

Save each file as you complete it. Do not wait until all chapters
are done. If a chapter's research is incomplete, save what you have
and mark the gaps in Section 8.

Work through chapters in order. Earlier chapters often seed concepts
that later chapters develop. Note these connections as you go.

---

### STEP 3 — RESEARCH FILE FORMAT

Every research file follows this exact structure.
Fill each section from research — not from TIKTOC.md.
The value of this file is what TIKTOC.md does not contain.

---

```markdown
# Research: Chapter NN — [Chapter Title]
## [Book Title]

**Chapter one-line:** [copied exactly from TIKTOC.md]
**Research date:** [date]

---

## 1. Primary Sources

### Foundational papers and texts
[3–5 primary sources directly relevant to this chapter's core
concept. For each: author(s), title, year, publication venue,
and a 2–3 sentence annotation explaining what it contributes
to THIS chapter specifically — not a general summary of the
work. Primary sources over secondary. Papers over blog posts.]

### Key empirical cases
[2–3 documented real-world cases suitable for the chapter's
opening case or worked example. For each: what happened, what
the relevant insight or failure was, where it is documented,
and why it is appropriate for the book's target reader.
Hypotheticals are acceptable but must be explicitly labeled
as illustrative.]

---

## 2. The Core Concept — State of the Field

### What is settled
[What the field agrees on about this chapter's core concept.
Cite specific sources. Be precise. This is what the chapter
can state confidently.]

### What is disputed
[Active debates, open questions, or methodological disagreements
relevant to this chapter. Flag anything the author needs to
handle carefully — contested claims that could draw criticism
or age badly.]

### What has changed recently (last 5 years)
[Recent developments that affect how this concept should be
taught today. Note anything that conflicts with older sources
the author may be relying on.]

---

## 3. Application Domain Examples

[3–5 specific applications of this chapter's concept in the
book's primary application domain — as identified from the
learner profile and domain coverage map in TIKTOC.md.

Each example should be:
- Documented, not hypothetical (or labeled if illustrative)
- Accessible to the book's target reader without background
  in an adjacent field
- Specific enough to anchor a worked example or exercise]

---

## 4. The Book's Thesis Connection

[How does this chapter's content connect to the book's central
thesis — as stated in TIKTOC.md?

Name specifically:
- What this chapter contributes to the book's argument
- Where this chapter's concept appears in the book's core claim
- What a student doing a self-directed exercise would need their
  own expertise to supply that a tool or algorithm cannot
- Any evidence from the research literature that bears on
  whether the book's thesis holds for this chapter's concept]

---

## 5. The AI Wayback Machine — Candidate Figures

[2–3 candidate historical figures for the AI Wayback Machine
section, which connects each chapter to its intellectual lineage.

For each candidate:
- Full name (exactly as it appears on their Wikipedia page title)
- The substantive connection to this chapter's concept — they
  must have worked on the thing, not merely near it
- Whether they satisfy the selection criteria:
    * Lesser-known preferred over famous
    * Diverse: gender, nationality, discipline, era
    * Wikipedia-accessible to a curious undergraduate
- One example prompt that could anchor the Wayback Machine block

Note: the actual figure selection happens in a later Cowork or Codex  pass
after chapter drafts exist. This section gives that pass a
curated shortlist. Diversity balance across the full set matters
— flag if your candidates skew in any direction.]

---

## 6. Pedagogical Delivery Research

[Research support for how this chapter's concept is most
effectively taught. Specifically:

- What prior knowledge is required, and what misconceptions
  are most common in the target reader population?
- What instructional sequences or examples have been shown
  to work for this concept?
- What are the known teaching failure modes — how does this
  concept typically get taught badly?
- What makes the difference between students who understand
  this concept and those who merely memorize it?

This section supports the chapter opening strategy, the
checkpoint design, and the worked example selection.]

---

## 7. Representation and Display Research

[Read TIKTOC.md's chapter anatomy section to determine which
chapters require special display formats.

Provide source material for any required displays:
- If the chapter requires a multi-column comparison display:
  provide one worked example of the concept expressed in each
  required column format
- If the chapter requires a structural diagram: describe the
  key elements the diagram must convey
- If the chapter requires a data table: identify the variables
  and their relationships

If no special display is required for this chapter, write:
"No special display required for this chapter."]

---

## 8. Open Questions and Research Gaps

[What the research did not resolve. What the author will need
to investigate further before drafting. What sources were
inaccessible or paywalled. What empirical questions remain
open that affect how this chapter should be written.

Also flag:
- Sources likely to be outdated within 3 years
- Claims presented as settled but potentially contested
- Cases that could not be verified (mark as illustrative only)]

---

## 9. Sourcing Notes

[Any sourcing concerns the chapter drafter needs to know:
paywalled sources, sources requiring fact-checking, cases
whose original documentation is hard to locate, or any
other provenance issue.]
```

---

### CALIBRATION RULES

These rules apply regardless of the book's subject matter.
Calibrate them against what you read in TIKTOC.md.

**Reader calibration:**
Write for the reader described in TIKTOC.md's learner profile.
Not for a general audience, not for an expert, not for a reader
in an adjacent field. If the learner profile says something
specific about what the reader knows or does not know, use that
to filter every source and example you include.

**Domain calibration:**
Use the domain coverage map in TIKTOC.md to identify which
application domains appear in which chapters. Do not introduce
a new primary domain unless the chapter spec calls for it.

**Source priority:**
Primary sources over secondary. Peer-reviewed over blog posts.
Documented cases over hypotheticals. Label hypotheticals explicitly.

**Aging calibration:**
Flag any source likely to be outdated in 3 years. Use the aging
risk audit in TIKTOC.md to identify which chapters are most
at risk. Research for high-risk chapters should distinguish
stable content from current-state content.

**Thesis calibration:**
Every Section 4 must be specific to THIS book's thesis as stated
in TIKTOC.md. Not a generic statement about why the chapter's
topic matters — a precise statement of how this chapter serves
this book's argument.

---

### STEP 4 — TERMINAL SUMMARY

After completing all chapter research files, write a summary
to the terminal (not to a file) containing:

- Number of research files written successfully
- Which chapters had the strongest primary source coverage
- Which chapters had the weakest coverage (most open questions)
- Cross-chapter patterns: recurring concepts, sources cited
  in multiple files, consistent research gaps
- The single highest-priority gap across the full research set
- Any diversity imbalances in Section 5 candidates across the
  full chapter set (gender, nationality, discipline, era)

This summary is for the author's orientation before drafting.
It does not go into pantry/.

---

### WHAT THIS PROMPT DOES NOT DECIDE

- Which AI Wayback Machine figure to select per chapter
  (that is the Wayback Machine pass, run after drafts exist)
- What the LLM exercise prompt will say (author's job in drafting)
- Which cases to use in the final chapter (author's judgment)
- Whether the chapter structure should change (Tic TOC's job)

This prompt produces raw research material. The author decides
what to use.
Scan the chapters and look for possible d3 graphs and SVG graphics

### STEP 1 — VISUAL SUGGESTIONS

Read the full chapter. At each location where a data visualization —
an infographic or chart — would genuinely serve comprehension or
retention, insert an HTML comment on its own line:

<!-- → [TYPE: description of what it shows and why it belongs here] -->

Types: `INFOGRAPHIC`, `CHART`

`INFOGRAPHIC` — a structured visual comparison, flow, or taxonomy
that is better understood as a diagram than as prose or a table.

`CHART` — a quantitative or relational graphic: line, bar, scatter,
network, timeline, or similar — anything where data shape matters.

The description must name the specific content, not the generic category.

Not: `INFOGRAPHIC: overview of the pipeline`
But: `INFOGRAPHIC: three-stage pipeline — ingest → transform → emit —
with data shape and failure modes at each stage labeled`

Not: `CHART: graph of results`
But: `CHART: line chart showing latency vs. concurrency for three queue
depths — reader should see the knee of the curve`

Only suggest visuals that would be rendered as SVG or D3 — skip anything
that would be a static photograph, screenshot, or plain table.

Place comments inline where the visual belongs — immediately before or
after the paragraph the visual would illustrate. Do not cluster them
at the end.

These comments are invisible when the markdown renders. They are a

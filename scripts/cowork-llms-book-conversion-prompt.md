# Cowork Prompt: "With LLMs" Series — Curriculum Enrichment Generator

---

## ROLE & CONTEXT

You are a curriculum designer working on a **"[FIELD] with LLMs" textbook**. You have access to a book directory. Your job is to:

1. Detect what state the book is in — written, unwritten, or sourced from external material — and follow the appropriate path
2. Write chapters if they don't yet exist
3. Generate **Chapter 00: Claude Basics** — a standalone onboarding chapter
4. Propose 3–5 candidate **Running Projects** a learner builds incrementally, one chapter at a time
5. Once a project is selected, enrich every chapter with:
   - **Dig Deeper prompts** — inline invitations to explore a concept further with Claude
   - **LLM Exercise** — a chapter-end project prompt that advances the running build

---

## STEP 0 — DETECT BOOK STATE

Before doing anything else, inspect `BOOK_DIR/chapters/` and determine which of three book states applies. The state controls everything that follows.

### How to detect

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

## CHAPTER WRITING PROCEDURE — STATE B

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

## CHAPTER WRITING PROCEDURE — STATE C

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

## STEP 1 — BUILD CHAPTER MAP

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

## STEP 2 — GENERATE CHAPTER 00: CLAUDE BASICS

Produce a full **Chapter 00** inserted at the start of the book. This chapter is not about the book's subject — it is about how to use Claude throughout the book.

The tone of Chapter 00 depends on book state:

- **State A (written book):** The book was written as a standalone text. The LLM layer has been added afterward. Chapter 00 acknowledges this honestly: the book stands on its own; Claude is an optional but powerful companion for learners who want to go further or build something real.
- **States B and C (written for this series):** The LLM layer is native to the book's design. Chapter 00 frames it as integral from the start.

In all cases, Chapter 00 is honest that the book is optimized for **Claude**, and includes clear guidance for adapting prompts to other tools.

### Required sections:

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

## STEP 3 — PROPOSE 3–5 RUNNING PROJECTS

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

## STEP 4 — ENRICH ALL CHAPTERS

Once a project is selected, add two types of LLM content to every chapter — **inserted directly into the chapter file, not in separate documents.**

For State A books: insert into existing chapter files without altering existing prose.
For States B and C: insert into the newly written chapter files.

---

### TYPE 1: DIG DEEPER PROMPTS (inline)

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

### TYPE 2: LLM EXERCISE (end of chapter)

One per chapter, placed at the very end, advancing the selected running project.

**Format:**

---

### LLM Exercise — Chapter [N]: [Chapter Title]

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

## FORMATTING RULES

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

## UPDATE TOC AND NOTES

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

## TONE & AUDIENCE

Write for an engaged undergraduate or early-career professional with genuine curiosity and no prior LLM experience. The learner should feel like they're building *their* thing, not completing an assignment. Instructors should find the structure easy to remap to a different domain or dataset.

- **Dig Deeper prompts** — a colleague leaning over: "you know what's interesting here..."
- **LLM Exercises** — the next satisfying step in building something real
- **Chapter 00** — honest, practical onboarding. Not a pitch for AI. Not a liability disclaimer.

---

## OUTPUT ORDER

1. **Book state detected** — report which state and why
2. *(State C only)* Source Map → **pause for confirmation**
3. *(States B and C)* Write chapters per procedure above
4. Chapter Map (all chapters, including Dig Deeper candidates)
5. Chapter 00: Claude Basics — full draft → **confirm before proceeding**
6. 3–5 Project Options → **pause for selection**
7. Enriched chapter content for every chapter, in order

---

## NOTES FOR ADAPTING TO OTHER LLMs

- **ChatGPT (GPT-4o):** Works as-is. Replace "Claude Project" with "Custom GPT" in all adaptation notes.
- **Gemini:** Works as-is. Note that Gemini's Google Drive integration may offer tighter file workflows than Cowork for some learners.
- **Claude Code:** Best for Step 4 when the book has code-heavy chapters. Feed it the Chapter Map and ask it to write enriched blocks as `.md` files directly.
- **Chapter 00 adaptation:** The chapter names Claude as primary tool but covers adaptation to others in section 3. If the series uses a different primary tool, update section 1 and the quick-reference card accordingly.
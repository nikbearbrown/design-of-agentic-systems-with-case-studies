# Book Chapter Conversion Workflow — Attenborough × Feynman v1.1

You are converting a book directory's source materials into rewritten textbook chapters in the Attenborough × Feynman fused voice. The source files are organized in chapter subfolders. Your job is to merge each subfolder's contents into a single rewritten chapter file, populate companion folders (pantry, images, bookmaps), and remove the source subfolders only after verification.

This workflow is generic — it works on any book directory matching the structure below, regardless of subject.


 all math/physics should have grounded examples
 
---

## Input

The user will specify **BOOK_DIR** — the path to a book directory.

Expected starting structure:

```
BOOK_DIR/
├── _notes.md              # Revision tracking
├── _toc.md                # Table of contents
└── chapters/
    ├── 01-[chapter-slug]/
    │   ├── 01-[source-id].md
    │   ├── 02-[source-id].md
    │   └── ...
    ├── 02-[chapter-slug]/
    │   └── ...
    └── NN-[chapter-slug]/
```

Target ending structure:

```
BOOK_DIR/
├── _notes.md              # Updated with conversion log
├── _toc.md                # Updated to point to new chapter files
├── chapters/
│   ├── 01-[chapter-slug].md
│   ├── 02-[chapter-slug].md
│   └── NN-[chapter-slug].md
├── pantry/
│   ├── 01-[chapter-slug].md
│   ├── 02-[chapter-slug].md
│   └── NN-[chapter-slug].md
├── images/
│   ├── 01-[chapter-slug].md
│   └── ...
└── bookmaps/
    ├── 01-[chapter-slug].md
    └── ...
```

---

## Procedure

### Step 0 — Setup

At `BOOK_DIR/`, create these sibling folders to `chapters/` if they don't exist:

- `BOOK_DIR/pantry/`
- `BOOK_DIR/images/`
- `BOOK_DIR/bookmaps/`

If they already exist, leave them.

### Step 1 — Per-chapter conversion

For each subfolder `NAME/` inside `BOOK_DIR/chapters/` (process in alphabetical order, which preserves chapter numbering):

**1a. Read source.** Load every `.md` file in the subfolder, sorted by filename. These are the source materials. Treat them collectively as the factual basis for the chapter — every fact, equation, citation, and data point must come from this source.

**1b. Synthesize.** Apply the Attenborough × Feynman v1.1 style (full spec below) and the `/write` chapter structure (8 sections, also below) to produce a single rewritten chapter. Target length: 5,000–8,000 words. If the source is thin and won't support that length, write what the source supports — do not pad with invented material.

**1c. Write the chapter file.** Save the rewritten chapter to:

```
BOOK_DIR/chapters/NAME.md
```

Note: the filename matches the subfolder name. Numbering and slug are preserved.

**1d. Generate companion files.** Produce three companion files (specs in the Companion Files section):

- `BOOK_DIR/pantry/NAME.md` — reusable ingredients extracted from the chapter
- `BOOK_DIR/images/NAME.md` — figure briefs from the chapter's `[FIGURE: ...]` placeholders
- `BOOK_DIR/bookmaps/NAME.md` — source map (which source files contributed what)

**1e. Verify.** Check that:

- `BOOK_DIR/chapters/NAME.md` exists and is at least 3,500 words
- All three companion files exist and are non-empty
- The chapter passes the Combined Test checklist (see Combined Test section)

**1f. Cleanup (gated on verification).** If 1e passes for this chapter, remove `BOOK_DIR/chapters/NAME/` and all its contents. If 1e fails, leave the source subfolder in place, write the partial output anyway, and log a warning entry to `BOOK_DIR/_notes.md` describing what failed (e.g., "01-what-is-physics: chapter only 2,800 words — source may be too thin, manual review needed").

### Step 2 — Update TOC

Rewrite `BOOK_DIR/_toc.md` to reflect the new flat chapter structure. Each chapter is now a single file at `chapters/NAME.md`. Preserve any existing TOC formatting conventions in the file; if the file is empty or doesn't exist, generate a minimal markdown TOC linking to each chapter file in order.

### Step 3 — Update notes

Append a revision entry to `BOOK_DIR/_notes.md`:

```
## [ISO date] — Attenborough × Feynman conversion run

Converted N chapters from source subfolders to rewritten markdown files.
Style: Attenborough × Feynman v1.1.

Chapters processed:
- 01-[slug] — [word count] words — OK / FLAGGED [reason]
- 02-[slug] — ...

Companion files generated in pantry/, images/, bookmaps/.
Source subfolders removed where verification passed.
Source subfolders preserved where verification flagged the chapter for review.
```

If `_notes.md` doesn't exist, create it.

---

## The Attenborough × Feynman v1.1 Style

This style fuses two intellectual traditions. David Attenborough showed that wonder is an argument — that accumulated beauty and specificity carry moral weight no lecture can match. Richard Feynman showed that honest explanation is an act of respect — that stripping jargon is not simplification, it is understanding made visible.

Every chapter begins in a scene. Every concept section begins in a scene. Every explanation strips to first principles. Every trade-off is named. Nothing is fabricated.

### The cold open (Attenborough)

The chapter opens mid-scene. Present tense. Sensory detail — temperature, pressure, scale, movement. The student is *somewhere* before they know what they're learning. The explanation arrives after the scene has earned attention. Each concept section also opens with a shorter cold open (100–200 words) that makes the abstract concrete.

### First-principles explanation (Feynman)

Every technical term is explained — not defined, *explained*. What it does, not what it's called. Use etymology when it illuminates ("photosynthesis, from the Greek for light and composition"). Build from what the student already knows. Never use the technical term as the explanation — that's the test. If you find yourself doing it, start over one rung lower.

### Trade-offs are the story

Every adaptation, every design decision, every historical or methodological choice optimized for something at the expense of something else. Name both sides. "This works because... It fails when..." A chapter section that doesn't name its trade-off is missing its analytical spine.

### Scale oscillation

Move between scales deliberately, at least once per chapter. Cosmic to intimate, or intimate to cosmic. This is not stylistic decoration — it shows the student where the subject sits in the larger picture while keeping it tangible.

### Moral weight through accumulation

The chapter's larger meaning arrives at the end through the facts. Never announce it in paragraph one. Build the case. Let the implications land.

### The ear test

Read it aloud. If it doesn't work as spoken prose, the rhythm is wrong. Vary sentence length deliberately. Long sentences build; short sentences land. Data with cadence: "First number. Second number. Third number. Here's what they mean together."

### Forbidden phrases

Never use:

- "Fascinating," "remarkable," "interestingly," "obviously," "clearly" — let the fact be remarkable, not the adjective
- "It is worth noting that..." — just note it
- "One could argue..." — make the argument
- "Revolutionary" or "innovative" without naming what specifically changed
- Any technical term without etymology or plain-English gloss on first use

Instead: the specific fact, number, or mechanism that earns the wonder. "They optimized for X at the expense of Y." "Here's what's actually happening at the [molecular / atomic / structural] level..."

### Voice and stance

Write as if narrating to someone genuinely curious who also cares about precision. Not a student to be talked down to — a companion on a walk. The "you" is immersive when scene-setting, curious when explaining, direct when delivering a verdict. "We" belongs in the figuring-out process. First person sparingly but honestly.

---

## The /write Chapter Structure

Every converted chapter follows this 8-section template. Section lengths are guidelines — total chapter target is 5,000–8,000 words.

### 1. Chapter opening (400–600 words)

Attenborough cold open: a scene that embodies the chapter's core problem. Then:

- **Learning objectives** (3–6 bullets, action verbs only — explain, calculate, derive, implement, critique. Never "understand" or "know about.")
- **Prerequisites** — what the student walks in with
- **Why this chapter matters** in the larger ecosystem of the field

### 2. Core Concept 1 (800–1,200 words)

Short Attenborough cold open (100–200 words) making the concept tangible. Then:

- Explain the mechanism from first principles (Feynman)
- Name the trade-off — what this approach optimizes for and what it costs
- One fully worked example, every step shown including reasoning
- Common misconceptions — where students get stuck and why

### 3. Core Concept 2 (800–1,200 words)

Builds on Concept 1. Same structure. The worked example uses Concept 1 explicitly — the scaffold is visible.

### 4. Core Concept 3 (800–1,200 words, optional)

Only if the source supports a third coherent concept. Should integrate Concepts 1 and 2, not introduce a fourth independent idea. If the source has more than three concepts, pick the three that scaffold best — note the others in the bookmap companion file as "deferred."

### 5. Integration / Synthesis (500–800 words)

How the concepts connect. One "putting it all together" worked example using all chapter concepts. Make the design philosophy of the field visible — why is the knowledge structured this way?

### 6. Exercises (600–1,000 words)

- **Warm-up (2–3):** Direct application of one concept
- **Application (3–4):** Slightly different from worked examples, forces translation
- **Synthesis (2–3):** Combine multiple concepts
- **Challenge (1–2):** Open-ended, points toward what comes next

For each: state the problem, name which learning objective it tests, indicate difficulty. Solutions are not included unless the source provides them.

### 7. Chapter summary (300–500 words)

Not a recap. A statement of what the student can now *do* that they couldn't before. Include: the one idea that matters most, the common mistake to watch for, what the student should now be able to teach someone else.

### 8. Connections forward (200–300 words)

What question does this chapter raise that the next chapter answers? No chapter exists in isolation.

### Style adaptations for textbook voice

- Equations in LaTeX: `$inline$` and `$$display$$`. Introduce notation before using it. Show derivations from the source — do not state results without the work.
- Figures: `[FIGURE: description + what the student should notice]`. These get extracted to the images companion file.
- Worked examples: state problem → identify given/asked → walk reasoning → check against intuition → name the general lesson.

---

## Hard Constraints

**NO FABRICATION.** Every fact, equation, datum, citation, and historical claim must come from the source files. The style transforms *how* the chapter is explained, not *what* it explains. If the source doesn't contain something, do not invent it. If a worked example needs a number the source doesn't provide, use a clearly hypothetical framing ("Suppose a particle with...") and label it.

**Source preservation.** All factual content, equations, citations, and figure references in the source must appear in the rewrite — possibly reorganized, possibly explained differently, but preserved.

**Deletion is gated.** Source subfolders are removed only after the rewritten chapter and all three companion files exist and pass verification. If verification fails, the source subfolder stays.

**No padding.** If a chapter's source supports only 4,000 words of substantive material, write 4,000 words. Flag the chapter as under threshold in `_notes.md`. Do not invent content to hit a length target.

**Forbidden phrases are absolute.** The forbidden phrase list applies in every paragraph. If a draft uses one, rewrite the sentence.

**Author direct address rule.** If the source files credit Nik Bear Brown (or "Bear Brown", "N. Bear Brown") as author, write in first person as Nik Bear Brown. "My framework," "I'll teach you to..." — instead of "Brown's framework," "Brown teaches you to..." This applies across every chapter.

---

## Companion File Specs

### `pantry/NAME.md` — Reusable ingredients

Extract reusable material from the chapter. Format:

```markdown
# Pantry — [Chapter Name]

## Scenes
- [Scene description] — used in [section] — anchored to [source fact]

## Analogies
- [Analogy] — explains [concept] — limits: [where it breaks down]

## Etymologies
- [Term] — from [language root] — illuminates [aspect of meaning]

## Trade-offs named
- [System / mechanism] optimizes for [X] at the cost of [Y]

## Scale shifts used
- [From scale] to [to scale] — purpose: [what it shows]

## Worked examples
- [Example name] — concept: [X] — reusable as [contexts]
```

Only include items that are genuinely reusable in other chapters or other works. The pantry is not a summary — it is harvested ingredients.

### `images/NAME.md` — Figure briefs

Extract every `[FIGURE: ...]` placeholder from the chapter and expand into a brief suitable for an illustrator or image generation tool. Format:

```markdown
# Figure briefs — [Chapter Name]

## Figure 1: [Short title]
**Placement:** [Section, after which paragraph]
**Description:** [What the figure shows]
**Pedagogical purpose:** [What the student should notice]
**Style notes:** [Diagrammatic / photorealistic / schematic, label requirements, callouts]

## Figure 2: ...
```

If the source provides a specific figure or image, note that and link to it.

### `bookmaps/NAME.md` — Source map

A short map of which source files contributed what to the rewritten chapter. Format:

```markdown
# Source map — [Chapter Name]

## Source files
- `01-[source-id].md` — [one-line description] — contributed: [Concept 1 mechanism, Worked Example 1]
- `02-[source-id].md` — [one-line description] — contributed: [Concept 2, Trade-off framing]
- ...

## Concept coverage
- **Concept 1:** [name] — primary source: [file] — supplementary: [files]
- **Concept 2:** [name] — primary source: [file]
- **Concept 3:** [name] — primary source: [file]

## Deferred material
Material in source not used in the rewritten chapter:
- [Topic] — from [file] — reason deferred: [too peripheral / would require Concept 4 / belongs in chapter NN]

## Source-level notes
- [Any source quality issues, contradictions between source files, gaps that required source-faithful workarounds]
```

---

## Combined Test (Run Before Verification Passes)

Before declaring a chapter complete, confirm all of the following. If any fail, revise before saving — do not save a chapter that fails the test.

1. **Cold open present** — chapter opens in a scene, not in framing
2. **Each concept section opens in a scene** — shorter cold opens, but they're there
3. **Mechanism explained from first principles** — at least once per concept section
4. **Trade-off named** — at least once per concept section, both sides explicit
5. **Scale shift present** — at least once in the chapter
6. **Moral weight accumulated, not stated** — chapter summary doesn't announce significance
7. **Ear test** — read three random paragraphs aloud; if rhythm is flat, revise
8. **Numbers do work** — every claim of scale carries a number, comparison, or specific image
9. **Every technical term explained** — not defined, *explained* — what it does
10. **Student can DO something** — learning objectives use action verbs; exercises actually test those verbs
11. **Scaffolding visible** — Concept 2 references Concept 1; integration uses both
12. **Exercises graduate** — warm-up → application → synthesis → challenge, each labeled
13. **No forbidden phrases** — search the chapter; if any appear, revise
14. **NO FABRICATION** — every fact traces to source

---

## Failure Handling

**Chapter under 3,500 words after honest writing:** Save the chapter, save the companion files, do not delete the source subfolder, log a flag in `_notes.md`. The chapter may be legitimately short, or the source may be too thin — that's a manual review call.

**Source files contradict each other:** Write the rewrite using the more recent or more authoritative source, and note the contradiction in the bookmap companion file under "Source-level notes." Do not invent a resolution.

**Source contains material that doesn't fit the 3-concept structure:** Pick the three concepts that scaffold best. Note the deferred material in the bookmap. Do not force a fourth concept into the chapter.

**Source contains figures, images, or external file references:** Preserve the references in the rewritten chapter as `[FIGURE: ...]` placeholders. Do not attempt to generate images. The image briefs go to the companion file.

**A subfolder contains no `.md` files:** Skip it, log a note in `_notes.md`.

**Chapter fails the Combined Test:** Revise. If revision after one pass still fails, save what you have, do not delete the source, and flag in `_notes.md`.

---

## Output report

After processing all chapters, return a summary report with:

- Number of chapters processed
- Number that passed verification (source removed)
- Number that flagged for manual review (source preserved)
- For each flagged chapter: the specific reason
- Total words written
- Any source-level issues discovered (contradictions, gaps, unclear authorship)

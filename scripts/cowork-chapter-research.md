# Cowork or Codex  Prompt: Chapter Research Pass
## Generic — reads all book information from TIKTOC.md

---

## ROLE & CONTEXT

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

## STEP 1 — READ THE BOOK

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

## STEP 2 — PRODUCE ONE RESEARCH FILE PER CHAPTER

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

## STEP 3 — RESEARCH FILE FORMAT

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

## CALIBRATION RULES

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

## STEP 4 — TERMINAL SUMMARY

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

## WHAT THIS PROMPT DOES NOT DECIDE

- Which AI Wayback Machine figure to select per chapter
  (that is the Wayback Machine pass, run after drafts exist)
- What the LLM exercise prompt will say (author's job in drafting)
- Which cases to use in the final chapter (author's judgment)
- Whether the chapter structure should change (Tic TOC's job)

This prompt produces raw research material. The author decides
what to use.

#!/usr/bin/env python3
"""
new_book.py — scaffold a new book project

Usage:
    python new_book.py "My Book Title" "Author Name"
    python new_book.py "Essais on Learning" "Nik Bear Brown" --subtitle "The Evidence Problem" --volume 1 --chapters 14
    python new_book.py "My Book Title" "Author Name" --dir ~/Documents
    python new_book.py "My Book Title" "Author Name" --publisher "My Press"

python ~/Documents/BEAR/new_book.py "Establishing the Mentorship Compact" "Srinivas Sridhar" --dir /Users/bear/Documents/CoWork/bear-textbooks/books --chapters 1

File structure produced:
    book.md                 ← book description and high-level outline (planning)
    outline.md              ← starter table of contents (planning)
    vision.md               ← Tic TOC Phase 1: vision and positioning
    architecture.md         ← Tic TOC Phase 2: learning architecture
    chapters-spec.md        ← Tic TOC Phase 3: chapter specifications
    risks.md                ← Tic TOC Phase 4: scope, market, risks
    pantry/                 ← scratch storage for fragments, snippets, leftovers
    chapters/
        00-frontmatter.md   ← copyright, dedication, preface
        01-introduction.md  ← Chapter 0 / Introduction
        02-chapter-01.md    ← Chapter 1
        ...
        NN-chapter-XX.md    ← Chapter N
        99-back-matter.md   ← acknowledgments, about the author, notes, references, index
    images/                 ← all figures as PNG (book uses these)
    d3/                     ← D3 HTML files — interactive browser-runnable versions

    — Extraction directories (populated by Cowork extraction pass) —
    anki/                   ← Key Terms extracted from chapters → Anki import format
    wayback/                ← AI Wayback Machine sections extracted from chapters
    when-to-use-ai/         ← Exercise 1 & 2 blocks extracted from chapters
    llm/                    ← Exercise 3 LLM Exercise blocks extracted from chapters
    cli/                    ← Exercise 4 CLI Exercise blocks extracted from chapters
    ai-validation/          ← Exercise 5 AI Validation blocks extracted from chapters
    exercises/              ← Exercises sections extracted from chapters
    bridge/                 ← Bridge sections extracted from chapters
    assessments/            ← Assessments sections extracted from chapters
    further-reading/        ← Further Reading sections extracted from chapters
    cli-quick-reference/    ← CLI Quick Reference sections extracted from chapters

    — Supplemental learning mode directories (populated by instructor) —
    glimmers/               ← Glimmer generative assignments (one per chapter)
    rubrics/                ← Rubrics for Glimmer and case study grading
    lecture-notes/          ← Slide-ready condensed chapter summaries
    worked-problems/        ← Step-by-step solved examples
    quizzes/                ← Platform quiz files (one per chapter)
    exams/                  ← Exam banks
    discussion-prompts/     ← Seminar-style discussion questions
    case-studies/           ← Case study scenarios (professor-authored only)
    supplemental/           ← Optional ala carte chapters (catalog.md + chapters)
    slides/                 ← Presentation slides (see also)
    videos/                 ← Video scripts or links (see also)

    SCRIPTS/
        svg-to-png.mjs      ← converts images/**/*.svg to 300dpi PNG
"""

import argparse
import sys
from datetime import date
from pathlib import Path


def slugify(text):
    return text.lower().replace(" ", "-").replace("'", "").replace('"', "")


FRONTMATTER_TEMPLATE = """\
<!--
    00-frontmatter.md
    FRONT MATTER — everything that appears before Chapter 1.

    This file contains four sections in order:
      1. Copyright page
      2. Dedication (optional — delete if not using)
      3. Preface

    Do not number these sections. They use roman numerals in print
    and appear before the body in the compiled EPUB.
-->

# {title}

{subtitle_line}**{author}**

---

## Copyright

Copyright © {year} {author}. All rights reserved.

Published by {publisher}.

No part of this publication may be reproduced, distributed, or transmitted
in any form or by any means without the prior written permission of the
publisher, except in the case of brief quotations in critical reviews and
certain other noncommercial uses permitted by copyright law.

ISBN: [INSERT ISBN]

---

## Dedication

<!-- Optional. Delete this section if not using. -->

*[For — ]*

---

## Preface

<!-- The preface is written in the author's voice.
     It answers three questions:
       - Why does this book exist? (the gap it fills)
       - Why now? (what changed that makes this urgent)
       - Why you? (what credentials or experience qualify you to write it)
     It is NOT a summary of the book — that belongs in the Introduction.
     Typical length: 2–5 pages. -->

[PREFACE PLACEHOLDER]

<!-- Suggested elements:
     - The moment or problem that prompted this book
     - What the book argues that hasn't been said before
     - Who it is written for
     - Any biographical context that establishes credibility
     - Brief acknowledgment of what the book does NOT cover
-->
"""

INTRODUCTION_TEMPLATE = """\
<!--
    01-introduction.md
    INTRODUCTION — Chapter 0 / roadmap chapter.

    The Introduction does different work than the Preface:
      - Preface  = why the book exists, why you wrote it (author's voice)
      - Introduction = what the book argues and how it is organized (reader's roadmap)

    This chapter is fully numbered in the body and can be as long as needed.
    Pearl's "The Mind Over Data" and Molnar's Introduction are good models:
    both are substantive, argument-first, and tell the reader exactly what
    to expect from each subsequent chapter.
-->

# Introduction

<!-- Opening: state the central problem or claim in the first paragraph.
     Do not throat-clear. Do not say "In this book I will..." -->

[INTRODUCTION PLACEHOLDER]

<!-- Suggested structure:
     1. The central claim — what this book argues
     2. Why it matters — stakes for the reader
     3. How the book is organized — a brief tour of each chapter
        (one sentence per chapter is enough; readers need a map, not a summary)
     4. How to read it — linear vs. jump-around, prerequisites, etc.
-->

## How This Book Is Organized

<!-- Walk through each chapter in one sentence.
     Example pattern: "Chapter 1 establishes X. Chapter 2 applies that
     framework to Y. Chapters 3–6 examine..." -->

[CHAPTER MAP PLACEHOLDER]
"""

BACK_MATTER_TEMPLATE = """\
<!--
    99-back-matter.md
    BACK MATTER — everything that appears after the final chapter.

    Sections in order:
      1. Acknowledgments
      2. About the Author
      3. Notes (by chapter, if using endnotes rather than footnotes)
      4. References / Bibliography
      5. Index (omit for online/free release; include for print/press)

    Back matter continues the arabic page numbering from where
    the final chapter ended. No page restart.
-->

---

## Acknowledgments

<!-- Keep it short. Name the people who materially helped the book exist:
     readers of drafts, researchers, editors, collaborators.
     One paragraph is enough unless the debt is substantial.
     Avoid laundry lists. -->

[ACKNOWLEDGMENTS PLACEHOLDER]

---

## About the Author

<!-- Third person. 100–200 words. Credentials that are relevant to THIS book.
     Not a full CV. End with a line about where to find you online. -->

[AUTHOR BIO PLACEHOLDER]

---

## Notes

<!-- Use this section for endnotes if you prefer them over footnotes.
     Group by chapter. Format:

     ### Chapter 1

     1. [Citation or explanatory note]
     2. [Citation or explanatory note]

     ### Chapter 2
     ...

     If using footnotes in-line (pandoc [^1] syntax), delete this section.
-->

[NOTES PLACEHOLDER]

---

## References

<!-- Full bibliography. Alphabetical by author last name, or grouped by chapter.
     Use a consistent citation style throughout (Chicago, APA, or a hybrid).

     Example entry (Chicago author-date):
     Pearl, Judea, and Dana Mackenzie. *The Book of Why*. Basic Books, 2018.
-->

[REFERENCES PLACEHOLDER]

---

## Index

<!-- For online/free release: delete this section.
     For print/press: compile after all other content is final.
     Pandoc does not auto-generate an index; use dedicated indexing software
     (e.g., indexd, Word indexing tools) or a professional indexer. -->

[INDEX PLACEHOLDER — omit for online release]
"""


BOOK_TEMPLATE = """\
<!--
    book.md
    BOOK DESCRIPTION & HIGH-LEVEL OUTLINE — your planning document.

    This file is for YOU, not the reader. It does not get compiled into
    the EPUB. Use it to think clearly about what the book is before you
    write it, and to keep yourself honest as you draft.

    Update freely as the book takes shape. Earlier versions belong in
    git history, not in this file.
-->

# {title}

{subtitle_line}**Author:** {author}

---

## One-Sentence Pitch

<!-- If you can't say what the book is in one sentence, you don't
     yet know what the book is. Force the constraint. -->

[ONE SENTENCE]

## The Argument

<!-- What does this book claim that isn't already obvious or settled?
     What changes in the reader's head between page one and the end?
     2–4 paragraphs. -->

[ARGUMENT PLACEHOLDER]

## The Gap

<!-- Why does this book need to exist? What does it do that no other
     book in the field already does? Name 2–3 books in the same space
     and say briefly how yours differs. -->

[GAP PLACEHOLDER]

## The Reader

<!-- Who is this book FOR? Be specific — not "anyone interested in X."
     What do they already know? What are they trying to do?
     What will they be able to do after reading it? -->

[READER PLACEHOLDER]

## High-Level Outline

<!-- Three to five acts / parts / movements. Not chapters yet — those
     live in outline.md. This is the shape of the argument at altitude. -->

**Part I — [Title]**
[What this part establishes]

**Part II — [Title]**
[What this part does with what Part I established]

**Part III — [Title]**
[Where the argument lands]

## Open Questions

<!-- Things you don't yet know how to handle. Update as you draft.
     Don't pretend they're solved. -->

- [ ]
- [ ]
- [ ]
"""


OUTLINE_TEMPLATE = """\
<!--
    outline.md
    TABLE OF CONTENTS — your chapter-level planning document.

    This is NOT the auto-generated TOC that appears in the EPUB
    (pandoc handles that via --toc in build.sh). This file is YOUR
    working outline: chapter titles, one-line descriptions, and the
    order of arguments before you start drafting.

    Keep it in sync with the actual chapter files in chapters/.
    When the outline diverges from the drafts, update one or the other —
    don't let them drift.
-->

# {title} — Outline

{subtitle_line}**Author:** {author}

---

## Front Matter

- **Copyright**
- **Dedication** *(optional)*
- **Preface** — why this book exists, in the author's voice

## Introduction

[One-sentence description of what the introduction argues and the map it gives the reader]

## Chapters

{chapter_outline_rows}
## Back Matter

- **Acknowledgments**
- **About the Author**
- **Notes** *(if using endnotes)*
- **References**
- **Index** *(print only)*

---

## Notes on Order

<!-- Why are the chapters in THIS order? What does each chapter
     assume the reader has already read? If you can swap two chapters
     without breaking anything, ask whether the order is doing real work. -->

[ORDER NOTES PLACEHOLDER]
"""


# ─────────────────────────────────────────────────────────────────────────────
# Tic TOC planning file templates
# ─────────────────────────────────────────────────────────────────────────────

VISION_TEMPLATE = """\
<!--
    vision.md
    Tic TOC Phase 1: Vision and Positioning.
-->

# {title} — Vision

{subtitle_line}**Author:** {author}

*Phase 1 output from Tic TOC. Generated by /scaffold or built through /i1–/i4.*

---

## Book Concept Summary

[NEEDS HUMAN INPUT — Tic TOC reasoning: book.md not yet filled in]

This book teaches [WHAT CAPABILITY] to [WHO], by [HOW — method or
structure], filling the gap left by [EXISTING ALTERNATIVES]. It succeeds
if the reader can [MEASURABLE OUTCOME] after completing it.

## Book Type and Deployment Specification

**Book type:** [ ] Course Textbook / [ ] Practitioner Handbook / [ ] Field-Defining Monograph

**Primary adoption context:** [NEEDS HUMAN INPUT]

**Secondary adoption context:** [NEEDS HUMAN INPUT]

**What the book is explicitly NOT designed for:** [NEEDS HUMAN INPUT]

**How the TOC will signal book type to a reviewing faculty member:** [NEEDS HUMAN INPUT]

## Learner Profile

**Primary reader (one specific person, not a category):** [NEEDS HUMAN INPUT]

**Prior knowledge (safe to assume):** [NEEDS HUMAN INPUT]

**Prior misconceptions:** [NEEDS HUMAN INPUT]

**Current capability gap:** [NEEDS HUMAN INPUT]

**Motivation type:** [ ] Academic / [ ] Professional / [ ] Intellectual

## Prerequisite Map

| Prerequisite | Safe to Assume? (Yes/Probably/No) | Where Introduced |
|---|---|---|
| [NEEDS HUMAN INPUT] | | |

**Front-loading decision:** [NEEDS HUMAN INPUT]

## Central Argument

[NEEDS HUMAN INPUT]

## Field Positioning

### Comparable Text 1
- **Title / Author / Year:** [NEEDS HUMAN INPUT]
- **What it covers that this book also covers:**
- **What it misses that this book addresses:**
- **What it gets wrong that this book corrects:**
- **Why a faculty member would choose this book over it:**

### Comparable Text 2
[NEEDS HUMAN INPUT]

### Comparable Text 3
[NEEDS HUMAN INPUT]

### Positioning Statements

[NEEDS HUMAN INPUT]

### Thesis Test

Does the proposed TOC structure reflect the thesis?
[NEEDS HUMAN INPUT]
"""

ARCHITECTURE_TEMPLATE = """\
<!--
    architecture.md
    Tic TOC Phase 2: Learning Architecture.
-->

# {title} — Learning Architecture

{subtitle_line}**Author:** {author}

*Phase 2 output from Tic TOC. Generated by /scaffold or built through /l1–/l4.*

---

## Learning Outcomes

### Chapter 1
1. [NEEDS HUMAN INPUT — outcome at Bloom's level X]
2.
3.

### Chapter 2
[NEEDS HUMAN INPUT]

## Outcome Map

| Chapter | Bloom's Level | Assessable? | Maps to Course Need? |
|---|---|---|---|
| 1 | | | |

## Sequencing Model and Justification

**Primary model:** [ ] Simple→Complex / [ ] Concrete→Abstract / [ ] Historical→Contemporary / [ ] Problem→Solution / [ ] Spiral

**Justification against learner profile:** [NEEDS HUMAN INPUT]

**Most likely break-down chapter:** [NEEDS HUMAN INPUT]

**Transition chapter (foundation→advanced pivot):** [NEEDS HUMAN INPUT]

## Three-Act Learning Arc

**Act One — Establish:** [NEEDS HUMAN INPUT]

**Act Two — Build:** [NEEDS HUMAN INPUT]

**Act Three — Apply:** [NEEDS HUMAN INPUT]

**Arc statement:** [NEEDS HUMAN INPUT]

## Prerequisite Dependency Map

| Chapter | Depends On (chapters or assumed knowledge) |
|---|---|
| 1 | |

**Broken sequences:** [NEEDS HUMAN INPUT]

**Load-bearing chapters:** [NEEDS HUMAN INPUT]
"""

CHAPTERS_SPEC_TEMPLATE = """\
<!--
    chapters-spec.md
    Tic TOC Phase 3: Chapter Specifications.
-->

# {title} — Chapter Specifications

{subtitle_line}**Author:** {author}

*Phase 3 output from Tic TOC. Generated by /scaffold or built through /c1–/c4.*

---

## Chapter 1 — [TITLE]

**One-line description (capability built, not topics covered):** [NEEDS HUMAN INPUT]

**Learning outcomes (cross-reference architecture.md):**
1.

**Problem the chapter solves for the learner:** [NEEDS HUMAN INPUT]

**Chapter opening strategy:** [NEEDS HUMAN INPUT]

**Core content blocks (4–6):**
1.
2.
3.

**Worked example or case study:** [NEEDS HUMAN INPUT]

**Assessable exercises (minimum 3, at least one at Apply level or above):**
1.
2.
3.

**Chapter closing / bridge to next chapter:** [NEEDS HUMAN INPUT]

---

## Chapter 2 — [TITLE]

[NEEDS HUMAN INPUT — repeat structure]

---

## Coverage Gaps

| Topic | Why Excluded | Acknowledged in Preface? |
|---|---|---|

## Hard Chapters

[NEEDS HUMAN INPUT]

## Aging Risk Audit

[NEEDS HUMAN INPUT]
"""

RISKS_TEMPLATE = """\
<!--
    risks.md
    Tic TOC Phase 4: Scope, Market, and Risk.
-->

# {title} — Scope, Market, and Risk

{subtitle_line}**Author:** {author}

*Phase 4 output from Tic TOC. Generated by /scaffold or built through /m1–/m4.*

---

## Comparable Texts Analysis

### Comparable Text 1
- **Title / Author / Publisher / Year / Edition:** [NEEDS HUMAN INPUT]
- **Target reader and deployment context:**
- **Strongest chapters:**
- **Weakest chapters:**
- **Why a faculty member might choose IT over THIS book:**
- **Why a faculty member might choose THIS book over IT:**

### Comparable Text 2
[NEEDS HUMAN INPUT]

### Comparable Text 3
[NEEDS HUMAN INPUT]

## Differentiation Statements

[NEEDS HUMAN INPUT]

## Market Size Estimate

- **Courses per year that could adopt:** [NEEDS HUMAN INPUT]
- **Copies per adoption:**
- **Primary or supplementary text?** [ ] Primary / [ ] Supplementary

## Feature List with Priority Tags

| Feature | Priority | Outcome Served | Production Effort | Producer | Dependency |
|---|---|---|---|---|---|

## Out of Scope

| Topic | Reason for Exclusion | Decided By | Reopen Condition | Acknowledge in Preface? |
|---|---|---|---|---|

## Adoption Risk Register

| Risk | Category | Likelihood | Impact | Trigger | Mitigation | Contingency |
|---|---|---|---|---|---|---|

## Top 3 Adoption Risks

1. [NEEDS HUMAN INPUT]
2. [NEEDS HUMAN INPUT]
3. [NEEDS HUMAN INPUT]
"""

# ─────────────────────────────────────────────────────────────────────────────
# SCRIPTS/svg-to-png.mjs — written into every new book scaffold
# ─────────────────────────────────────────────────────────────────────────────

SVG_TO_PNG_SCRIPT = """\
import sharp from 'sharp';
import { glob } from 'glob';
import { statSync } from 'fs';

// Converts every SVG in images/ to a 300dpi PNG.
// Idempotent: skips any PNG that is already newer than its SVG source.
// Run from the book root: node SCRIPTS/svg-to-png.mjs

const files = await glob('images/**/*.svg');

if (files.length === 0) {
  console.log('No SVG files found in images/');
  process.exit(0);
}

let converted = 0;
let skipped = 0;

for (const file of files) {
  const out = file.replace('.svg', '.png');

  try {
    const svgMtime = statSync(file).mtimeMs;
    try {
      const pngMtime = statSync(out).mtimeMs;
      if (pngMtime > svgMtime) {
        console.log(`skipped (up to date): ${out}`);
        skipped++;
        continue;
      }
    } catch {
      // PNG doesn't exist yet — proceed
    }

    await sharp(file, { density: 300 }).png().toFile(out);
    console.log(`${file} → ${out}`);
    converted++;
  } catch (err) {
    console.error(`ERROR: ${file} — ${err.message}`);
  }
}

console.log(`\\nDone. Converted: ${converted}, Skipped: ${skipped}`);
"""


# ─────────────────────────────────────────────────────────────────────────────
# README templates for extraction directories
# ─────────────────────────────────────────────────────────────────────────────

EXTRACTION_DIR_READMES = {
    "anki": """\
# anki/

Anki flashcard decks extracted from `## Key Terms` sections in each chapter.

## What this directory is for

One consolidated file per book, containing all vocabulary from all chapters,
formatted for direct import into the Anki desktop app.

## File format

Tab-separated text: `Front[TAB]Back[TAB]Tags`

- One card per line
- Tags include the chapter slug and concept node name
- Example: `hypothesis\tA falsifiable claim naming the object, field, and moment where you expect the state to be wrong\tch01 debugging`

## How to import into Anki

1. Open Anki desktop app
2. File → Import
3. Select the `.txt` file from this directory
4. Set field separator to Tab
5. Map fields: Field 1 → Front, Field 2 → Back, Field 3 → Tags
6. Import

## How it is generated

Run the Cowork extraction pass against `chapters/`. The pass reads every
`## Key Terms` section and writes the consolidated Anki file here.
Do not edit this file directly — edit the source chapter, then re-run extraction.

## Medhavy connection

Anki decks are the offline retention layer. The same vocabulary appears
in Medhavy's Quiz Me mode via spaced retrieval scheduling (FSRS).

## Authored by

AI-generated from instructor-authored Key Terms sections in chapter files.
""",

    "wayback": """\
# wayback/

AI Wayback Machine sections extracted from chapter files.

## What this directory is for

Each chapter may contain a `## AI Wayback Machine` section featuring a
historical figure connected to the chapter's concepts, with a copy-paste-ready
prompt and a "make it better" nudge for the learner.

This directory consolidates all such sections into a single browsable file.

## File format

Markdown. One consolidated file per book: `[title-slug]-wayback.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Sections are extracted
verbatim — no content is generated here.

## Medhavy connection

Not directly connected to Medhavy. These are standalone learner-facing prompts.

## Authored by

Instructor-authored. AI-assisted drafting is permitted; instructor must review
figure selection for accuracy and diversity.
""",

    "when-to-use-ai": """\
# when-to-use-ai/

Exercise 1 (When to Use AI) and Exercise 2 (When NOT to Use AI) blocks
extracted from chapter files.

## What this directory is for

These paired exercises establish the judgment frame for each chapter —
which tasks are appropriate for AI delegation and which require human expertise.
This directory consolidates all such blocks for instructor review and course planning.

## File format

Markdown. One consolidated file per book: `[title-slug]-when-to-use-ai.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Exercise 1 and Exercise 2
are always extracted together into this directory.

## Medhavy connection

These sections feed the Medhavy case study mode — the judgment frame is the
basis for ill-structured problems that require the learner to reason under ambiguity.

## Authored by

Instructor-authored. These sections represent the core pedagogical stance of
the AI+1 framework and should not be AI-generated without instructor review.
""",

    "llm": """\
# llm/

Exercise 3 (LLM Exercise) blocks extracted from chapter files.

## What this directory is for

Each LLM Exercise contains a copy-paste-ready prompt the learner runs in
Claude (or another LLM) to advance their running project. This directory
consolidates all prompts for instructor review, course planning, and reuse.

## File format

Markdown. One consolidated file per book: `[title-slug]-llm.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

LLM exercises correspond to Medhavy's Ask AI mode — the acquire layer of
the cognitive sequence.

## Authored by

AI-assisted. Prompts are generated by the Running Project Exercise Generator
Cowork pass and reviewed by the instructor.
""",

    "cli": """\
# cli/

Exercise 4 (CLI Exercise) blocks extracted from chapter files.

## What this directory is for

Each CLI Exercise contains an agentic task for Claude Code, Codex CLI, or
Cowork — automating, generating, or manipulating files as part of the running
project. This directory consolidates all CLI tasks for instructor review.

## File format

Markdown. One consolidated file per book: `[title-slug]-cli.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Not directly connected to Medhavy. CLI exercises are local development tasks.

## Authored by

AI-assisted. Tasks are generated by the Running Project Exercise Generator
Cowork pass and reviewed by the instructor.
""",

    "ai-validation": """\
# ai-validation/

Exercise 5 (AI Validation Exercise) blocks extracted from chapter files.

## What this directory is for

Each AI Validation Exercise gives the learner a structured checklist to
evaluate AI-generated output. This directory consolidates all validation
exercises for instructor review and course planning.

The mandatory AI Use Disclosure at the end of each exercise is the primary
mechanism by which the AI+1 series tests its own thesis.

## File format

Markdown. One consolidated file per book: `[title-slug]-ai-validation.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Validation exercises correspond to Medhavy's Glimmer mode — generative
production followed by structured self-assessment.

## Authored by

AI-assisted. Exercises are generated by the Running Project Exercise Generator
Cowork pass and reviewed by the instructor.
""",

    "exercises": """\
# exercises/

`## Exercises` sections extracted from chapter files.

## What this directory is for

Standard end-of-chapter exercises: warm-up, application, synthesis, and
challenge problems. This directory consolidates all exercises for instructor
use in building problem sets, exams, and discussion prompts.

## File format

Markdown. One consolidated file per book: `[title-slug]-exercises.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Exercises feed the Quiz Me mode on Medhavy when converted to quiz format.
See `quizzes/` for platform quiz files.

## Authored by

Instructor-authored.
""",

    "bridge": """\
# bridge/

`## Bridge` sections extracted from chapter files.

## What this directory is for

Each Bridge is a one-sentence question at the end of a chapter that points
forward to the next chapter's problem. This directory consolidates all bridge
questions for instructor review and course design.

## File format

Markdown. One consolidated file per book: `[title-slug]-bridge.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Bridge questions can seed discussion prompts and case study setups in Medhavy.

## Authored by

Instructor-authored.
""",

    "assessments": """\
# assessments/

`## Assessments` sections extracted from chapter files.

## What this directory is for

Assessment tables listing quizzes, labs, and exercises with credit status,
group/individual designation, and alignment notes. This directory consolidates
all assessment metadata for LMS import and course planning.

## File format

Markdown. One consolidated file per book: `[title-slug]-assessments.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Assessment metadata maps directly to Medhavy activity configuration.
Each row in an assessment table corresponds to a Medhavy activity node.

## Authored by

Instructor-authored.
""",

    "further-reading": """\
# further-reading/

`## Further Reading` sections extracted from chapter files.

## What this directory is for

Curated references for each chapter — primary sources, peer-reviewed papers,
and authoritative documentation. This directory consolidates all further reading
for bibliography generation and course resource lists.

## File format

Markdown. One consolidated file per book: `[title-slug]-further-reading.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Not directly connected to Medhavy. Further reading is a static reference layer.

## Authored by

Instructor-authored. Citations should be verified against primary sources.
""",

    "cli-quick-reference": """\
# cli-quick-reference/

`## CLI Quick Reference` sections extracted from chapter files.

## What this directory is for

Shell commands and environment verification snippets from each chapter,
consolidated into a single reference for learners setting up their environment.

## File format

Markdown. One consolidated file per book: `[title-slug]-cli-quick-reference.md`

## How it is generated

Run the Cowork extraction pass against `chapters/`. Content is extracted verbatim.

## Medhavy connection

Not directly connected to Medhavy. CLI references are local setup aids.

## Authored by

Instructor-authored or AI-assisted; verify all commands against current
tool versions before distributing to learners.
""",
}

# ─────────────────────────────────────────────────────────────────────────────
# README templates for supplemental learning mode directories
# ─────────────────────────────────────────────────────────────────────────────

SUPPLEMENTAL_DIR_READMES = {
    "glimmers": """\
# glimmers/

Glimmer generative assignments — one per chapter.

## What this directory is for

A Glimmer is an ill-structured generative assignment: the learner produces
something original using AI tools, then defends their process and evaluates
the output. Unlike exercises (which have right answers), Glimmers are graded
on process, judgment, and the quality of the AI Use Disclosure.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-glimmer.md`

Each file should contain:
- The generative prompt or task specification
- The rubric (or a reference to `rubrics/`)
- The AI Use Disclosure requirement
- Submission instructions

## How it connects to Medhavy

Glimmers are the Medhavy Glimmer mode: generative production followed by
structured self-assessment. Learners submit through Medhavy; instructors
grade against the rubric in `rubrics/`.

## Authored by

Instructor-authored. AI-assisted drafting is permitted for the task specification;
the rubric must be instructor-reviewed before distribution.
""",

    "rubrics": """\
# rubrics/

Grading rubrics for Glimmer assignments and case studies.

## What this directory is for

Rubrics define the criteria by which Glimmer and case study submissions are
evaluated. Without rubrics, generative assignments cannot be graded consistently.

One rubric file per assignment type, not one per chapter — a single rubric
may apply to multiple chapters if the evaluation criteria are the same.

## File format

Markdown. Each rubric file should contain:
- Assignment type (Glimmer / Case Study / other)
- Applicable chapters
- Criteria table: criterion, weight, exemplary, proficient, developing, insufficient
- Notes on AI Use Disclosure evaluation

## How it connects to Medhavy

Rubrics are uploaded to Medhavy as grading schemas. Each Glimmer activity
node references the rubric that governs it.

## Authored by

Instructor-authored. Rubrics must not be AI-generated without instructor review.
They represent the course's evaluative standards.
""",

    "lecture-notes": """\
# lecture-notes/

Slide-ready condensed summaries of each chapter.

## What this directory is for

Many instructors do not assign reading — they assign lecture notes and point
to the book as reference. These files are condensed, slide-ready versions of
each chapter for use in synchronous sessions.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-lecture.md`

Each file should contain:
- Chapter title and core claim (one sentence)
- 3–5 key concepts with brief definitions
- One worked example or case
- Discussion question or bridge to next session

## How it connects to Medhavy

Lecture notes can be imported as Medhavy source documents for the Ask AI mode,
giving learners a condensed reference alongside the full chapter.

## Authored by

Instructor-authored or AI-assisted. AI-generated drafts should be reviewed
against the source chapter before distribution.
""",

    "worked-problems": """\
# worked-problems/

Step-by-step solved examples for each chapter.

## What this directory is for

Worked problems give learners a model to follow before attempting exercises
independently. They are the most-requested supplementary material in STEM and
technical course adoptions.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-worked.md`

Each file should contain:
- Problem statement
- Step-by-step solution with reasoning at each step
- Common errors to avoid
- Connection to chapter concepts

## How it connects to Medhavy

Worked problems are static reference material. They do not connect directly
to Medhavy activity modes but can be linked from chapter source documents.

## Authored by

Instructor-authored. Worked problems require domain expertise to verify
correctness. Do not distribute AI-generated worked problems without
step-by-step verification by a subject matter expert.
""",

    "quizzes": """\
# quizzes/

Platform quiz files for Quiz Me mode — one per chapter.

## What this directory is for

These are structured quiz files for use in Medhavy, Canvas, or similar
platforms. They are distinct from Anki flashcards (`anki/`): Anki is for
vocabulary retention; quizzes test concept application and comprehension.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-quiz.md`

Each file should contain at minimum:
- 5–10 questions per chapter
- Question type labeled: multiple choice / short answer / true-false / matching
- Correct answer and brief rationale for each question
- Bloom's level tag for each question

## How it connects to Medhavy

Quiz files are the primary input for Medhavy's Quiz Me mode. The FSRS
spaced-retrieval scheduler uses quiz performance to set due dates.
Import format: [Medhavy quiz import format — update when finalized]

## Authored by

AI-assisted, with instructor review. Questions derived from `exercises/`
and `assessments/` sections in chapter files.
""",

    "exams": """\
# exams/

Exam banks — midterm and final exam question pools.

## What this directory is for

Curated exam questions drawn from exercises, quizzes, and assessment sections.
Organized by chapter for flexible exam assembly.

## File format

Markdown. One file per exam or exam bank section.

Each question entry should include:
- Question text
- Answer / rubric
- Source chapter
- Bloom's level
- Estimated time to complete

## How it connects to Medhavy

Not directly connected to Medhavy. Exam banks are for instructor use in
assembling proctored assessments outside the platform.

## Authored by

Instructor-authored. Exam questions must not be distributed to learners
before the exam. Store securely and do not commit to public repositories.
""",

    "discussion-prompts": """\
# discussion-prompts/

Seminar-style discussion questions — one set per chapter.

## What this directory is for

Discussion prompts are open-ended, interpretive questions with no single
correct answer. They are designed for synchronous discussion, Canvas
discussion boards, or written reflection assignments.

Unlike exercises (which test comprehension) or Glimmers (which require
production), discussion prompts invite contested, reasoned argument.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-discussion.md`

Each file should contain:
- 3–5 discussion questions
- Brief framing note for the instructor (what the question is trying to surface)
- Suggested follow-up probes

## How it connects to Medhavy

Discussion prompts can be imported as Medhavy discussion activity nodes.
Learner responses feed the Glimmer mode when used as reflection starters.

## Authored by

Instructor-authored or AI-assisted. Questions should be reviewed to ensure
they are genuinely open-ended and do not have obvious correct answers.
""",

    "case-studies": """\
# case-studies/

Case study scenarios — one per chapter.

## What this directory is for

Case studies are ill-structured scenarios that require the learner to reason
under ambiguity before arriving at a recommendation or decision. They are
the primary vehicle for Tier 5 (causal/counterfactual) reasoning in the
Irreducibly Human taxonomy.

One file per chapter, matching the `chapters/` numbering convention.

## File format

Markdown. Filename: `[NN]-[chapter-slug]-case.md`

Each file should contain:
- Scenario description (enough context to reason from; not so much that the
  answer is obvious)
- The decision or recommendation the learner must make
- Discussion questions
- Instructor notes (what a strong response looks like)
- The rubric reference (point to `rubrics/`)

## IMPORTANT: AI-generated cases are not permitted

Case studies require human judgment to construct correctly. An AI-generated
case may be plausible-sounding but embed subtle errors in domain logic,
present a false dilemma, or omit the ambiguity that makes the case educationally
valuable.

All case studies must be professor-authored and reviewed before distribution.

## How it connects to Medhavy

Case studies are the Medhavy Case Study mode: the apply-under-ambiguity layer
of the cognitive sequence. Learners submit responses through Medhavy;
instructors grade against the rubric.

## Authored by

Professor-authored only. Do not use AI-generated cases without full
reconstruction and review by a subject matter expert.
""",

    "supplemental": None,  # handled separately — has catalog.md

    "slides": """\
# slides/

Presentation slides — see also.

## What this directory is for

Slide decks for synchronous instruction. This directory is a placeholder
for instructor-produced slides. It may be removed if slides are maintained
elsewhere (e.g., Google Slides, Canvas, a department shared drive).

## File format

Any format: `.pptx`, `.key`, `.pdf`, `.md` (reveal.js), or links in a
`README.md` pointing to external slide sources.

## How it connects to Medhavy

Not directly connected to Medhavy.

## Authored by

Instructor-authored.
""",

    "videos": """\
# videos/

Video scripts or links — see also.

## What this directory is for

Video content associated with each chapter: lecture recordings, screencasts,
explainer videos, or links to external video resources.

This directory is a placeholder. It may hold video scripts (`.md`), link
lists, or be removed if video content is maintained in a separate system
(YouTube, Canvas Media, Panopto, etc.).

## File format

Markdown link lists or video scripts. Filename: `[NN]-[chapter-slug]-video.md`

## How it connects to Medhavy

Video links can be embedded in Medhavy chapter source documents for the
Ask AI mode.

## Authored by

Instructor-authored or third-party. Verify licensing before distributing
links to external video content.
""",
}

SUPPLEMENTAL_README = """\
# supplemental/

Optional ala carte chapters professors can swap in, reorder, or add
alongside the spine chapters.

## What this directory is for

The official AI+1 TOC is the canonical spine. Most domain-specific adoptions
will need 2–3 supplemental chapters that professors can incorporate based on
their course context, student background, or disciplinary emphasis.

Each supplemental chapter is:
- A standalone `.md` file
- Prefixed `supp-[slug].md`
- Self-contained: readable without the spine chapters, though it references them
- Annotated with an adoption note explaining where it fits in a course

See `catalog.md` for a one-paragraph description of each supplemental chapter
with course placement guidance.

## File format

Markdown. Filename: `supp-[slug].md`

Each file should begin with an adoption note block:

```
<!--
    ADOPTION NOTE
    Fits: [course context — e.g., "weeks 3–5 of a professional development course"]
    Pairs with or replaces: [spine chapter reference]
    What the instructor needs to know: [one sentence]
-->
```

## How it connects to Medhavy

Supplemental chapters can be imported into Medhavy as additional source
documents. They participate in the same Ask AI, Quiz Me, and Glimmer modes
as spine chapters when activated by the instructor.

## Authored by

Instructor-authored or AI-assisted. Each supplemental chapter should be
reviewed against the spine for conceptual consistency before distribution.
"""

SUPPLEMENTAL_CATALOG = """\
# Supplemental Chapter Catalog

One-paragraph entries describing each optional chapter available for
this book, with course placement guidance.

Professors: browse this catalog to find chapters that fit your course.
Each entry links to the full chapter file in this directory.

---

<!-- Add entries below as supplemental chapters are authored.
     Format for each entry:

     ## [Chapter Title]
     **File:** `supp-[slug].md`
     **Fits:** [course context]
     **Pairs with or replaces:** [spine chapter]

     [One paragraph describing what the chapter covers, what argument it
     makes, and what the learner can do after completing it.]

-->

*No supplemental chapters have been authored yet for this book.*
*Add chapters to this directory and update this catalog.*
"""


def create_book(title, author, subtitle="", volume=None, num_chapters=14,
                base_dir=None, publisher="Bear Brown, LLC"):

    slug = slugify(title)
    if volume:
        slug = f"{slug}-vol{volume}"

    root = Path(base_dir).expanduser() / slug if base_dir else Path.cwd() / slug

    if root.exists():
        print(f"Error: {root} already exists.")
        sys.exit(1)

    # ── Core directories ─────────────────────────────────────────────────────
    core_dirs = [
        root / ".github" / "workflows",
        root / "styles",
        root / "chapters",
        root / "images",
        root / "d3",
        root / "SCRIPTS",
        root / "output",
        root / "pantry",
        root / "_working",
    ]

    # ── Extraction directories ───────────────────────────────────────────────
    extraction_dirs = [
        "anki",
        "wayback",
        "when-to-use-ai",
        "llm",
        "cli",
        "ai-validation",
        "exercises",
        "bridge",
        "assessments",
        "further-reading",
        "cli-quick-reference",
    ]

    # ── Supplemental learning mode directories ───────────────────────────────
    supplemental_dirs = [
        "glimmers",
        "rubrics",
        "lecture-notes",
        "worked-problems",
        "quizzes",
        "exams",
        "discussion-prompts",
        "case-studies",
        "supplemental",
        "slides",
        "videos",
    ]

    for d in core_dirs:
        d.mkdir(parents=True)

    for d in extraction_dirs + supplemental_dirs:
        (root / d).mkdir(parents=True)

    # ── Write extraction directory READMEs ───────────────────────────────────
    for d in extraction_dirs:
        readme_key = d
        if readme_key in EXTRACTION_DIR_READMES:
            (root / d / "README.md").write_text(EXTRACTION_DIR_READMES[readme_key])
        (root / d / ".gitkeep").write_text("")

    # ── Write supplemental learning mode READMEs ────────────────────────────
    for d in supplemental_dirs:
        if d == "supplemental":
            (root / d / "README.md").write_text(SUPPLEMENTAL_README)
            (root / d / "catalog.md").write_text(SUPPLEMENTAL_CATALOG)
        else:
            readme_key = d
            if readme_key in SUPPLEMENTAL_DIR_READMES:
                (root / d / "README.md").write_text(SUPPLEMENTAL_DIR_READMES[readme_key])
        (root / d / ".gitkeep").write_text("")

    # ── SCRIPTS/svg-to-png.mjs ───────────────────────────────────────────────
    (root / "SCRIPTS" / "svg-to-png.mjs").write_text(SVG_TO_PNG_SCRIPT)

    # ── SCRIPTS/README.md ────────────────────────────────────────────────────
    (root / "SCRIPTS" / "README.md").write_text(
        """\
# SCRIPTS

Helper scripts run from the book root directory.

## svg-to-png.mjs

Converts every `images/**/*.svg` to a 300dpi PNG. Idempotent — skips
PNGs that are already newer than their SVG source.

```bash
node SCRIPTS/svg-to-png.mjs
```

**Requires:** `sharp` and `glob`

```bash
npm install sharp glob
```

`sharp` depends on `librsvg` for SVG rendering. All SVGs generated by
Cowork embed their fonts as base64 — no system font dependency.
"""
    )

    # ── d3/README.md ─────────────────────────────────────────────────────────
    (root / "d3" / "README.md").write_text(
        """\
# D3 Figures

Interactive browser-runnable D3 v7 versions of every figure in the book.

Each file is a standalone HTML file — open directly in a browser, no build step.

## Naming convention

```
{chapter-slug}-fig-{figure-number-zero-padded}.html
```

Examples:
- `02-chapter-01-fig-01.html`
- `07-comparison-charts-fig-05.html`

## Relationship to images/

The `images/` directory holds static PNG versions of the same figures,
used by the compiled EPUB. The D3 HTML files are the living source —
readers can open, inspect, and modify them.

## Regenerating

D3 HTML files are generated by Cowork during enrichment passes.
To regenerate, re-run the Cowork enrichment prompt against the chapter.

SVG to PNG conversion:
```bash
node SCRIPTS/svg-to-png.mjs
```
"""
    )

    # ── .gitignore ───────────────────────────────────────────────────────────
    (root / ".gitignore").write_text(
        "output/\n*.epub\n*.pdf\n*.docx\n.DS_Store\nnode_modules/\n"
    )

    # ── package.json ─────────────────────────────────────────────────────────
    (root / "package.json").write_text(
        f"""\
{{
  "name": "{slug}",
  "version": "1.0.0",
  "type": "module",
  "description": "{title}",
  "scripts": {{
    "svg-to-png": "node SCRIPTS/svg-to-png.mjs"
  }},
  "dependencies": {{
    "sharp": "^0.33.0",
    "glob": "^10.0.0"
  }}
}}
"""
    )

    # ── metadata.yaml ────────────────────────────────────────────────────────
    series_fields = ""
    if volume:
        series_fields = (
            f"\n# Series\nbelongs-to-collection: \"{title}\"\n"
            f"group-position: {volume}\n"
        )

    (root / "metadata.yaml").write_text(
        f"""---
title: "{title}"
subtitle: "{subtitle}"
author: "{author}"
language: en-US
rights: "Copyright © {date.today().year} {author}"
publisher: "{publisher}"
date: "{date.today().isoformat()}"
cover-image: cover.jpg
stylesheet: styles/kindle.css
toc: true
toc-depth: 2
{series_fields}---
"""
    )

    # ── styles/kindle.css ────────────────────────────────────────────────────
    (root / "styles" / "kindle.css").write_text(
        """\
body {
  font-size: 1em;
  line-height: 1.6;
  margin: 0;
  padding: 0;
}

h1, h2, h3 {
  font-weight: bold;
  margin-top: 2em;
  margin-bottom: 0.5em;
  page-break-after: avoid;
}

h1 { font-size: 1.6em; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.1em; }

p {
  margin: 0;
  text-indent: 1.5em;
}

h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}

blockquote {
  margin-left: 2em;
  margin-right: 2em;
  font-style: italic;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

figure { margin: 1.5em 0; }
figcaption { font-size: 0.85em; text-align: center; }

table.infographic-table,
table.comparison-table,
table.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9em;
  page-break-inside: avoid;
}

table.infographic-table thead tr {
  background-color: #1a1814;
  color: #f5f0e8;
}
table.infographic-table thead th {
  padding: 0.6em 0.8em;
  text-align: left;
  font-weight: bold;
  font-size: 0.95em;
  border: none;
}
table.infographic-table tbody tr {
  border-bottom: 1px solid #c8bfaa;
}
table.infographic-table tbody tr:last-child {
  border-bottom: 2px solid #1a1814;
}
table.infographic-table tbody td {
  padding: 0.65em 0.8em;
  vertical-align: top;
  line-height: 1.5;
}
table.infographic-table tbody td:first-child {
  font-weight: bold;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  padding-right: 1em;
}

table.comparison-table thead tr {
  border-bottom: 2px solid #1a1814;
}
table.comparison-table thead th {
  padding: 0.6em 0.8em;
  text-align: left;
  font-weight: bold;
}
table.comparison-table tbody tr:nth-child(even) {
  background-color: #f0ebe0;
}
table.comparison-table tbody td {
  padding: 0.6em 0.8em;
  vertical-align: top;
  line-height: 1.5;
  border-bottom: 1px solid #c8bfaa;
}

table.data-table thead tr {
  border-bottom: 2px solid #1a1814;
}
table.data-table thead th {
  padding: 0.5em 0.75em;
  text-align: right;
  font-weight: bold;
}
table.data-table thead th:first-child {
  text-align: left;
}
table.data-table tbody td {
  padding: 0.45em 0.75em;
  text-align: right;
  border-bottom: 1px solid #c8bfaa;
  font-variant-numeric: tabular-nums;
}
table.data-table tbody td:first-child {
  text-align: left;
}
table.data-table tbody tr:last-child td {
  border-bottom: 2px solid #1a1814;
  font-weight: bold;
}

p.figure-kicker {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b6254;
  margin-bottom: 0.25em;
  text-indent: 0;
}

.prompts-section {
  border-top: 2px solid #1a1814;
  margin-top: 3em;
  padding-top: 1.5em;
}
"""
    )

    # ── styles/kindle-book.css ───────────────────────────────────────────────
    (root / "styles" / "kindle-book.css").write_text(
        f"""\
/* ─────────────────────────────────────────────
   kindle-book.css — book-specific overrides
   Title: {title}
   Author: {author}
   ───────────────────────────────────────────── */
"""
    )

    # ── cover placeholder ────────────────────────────────────────────────────
    (root / "cover.jpg.placeholder").write_text(
        "Replace with cover.jpg — minimum 2560x1600px, 72dpi\n"
    )

    # ── chapters ─────────────────────────────────────────────────────────────
    subtitle_line = f"*{subtitle}*\n\n" if subtitle else ""

    (root / "chapters" / "00-frontmatter.md").write_text(
        FRONTMATTER_TEMPLATE.format(
            title=title,
            subtitle_line=subtitle_line,
            author=author,
            year=date.today().year,
            publisher=publisher,
        )
    )

    (root / "chapters" / "01-introduction.md").write_text(
        INTRODUCTION_TEMPLATE
    )

    for i in range(num_chapters):
        chapter_num = i + 1
        file_num = i + 2
        fname = f"{file_num:02d}-chapter-{chapter_num:02d}.md"
        (root / "chapters" / fname).write_text(
            f"# Chapter {chapter_num}\n\n"
            f"<!-- Chapter {chapter_num} draft.\n"
            f"     Replace this placeholder with your content.\n"
            f"     Use <!-- → [TYPE: description] --> comments to mark figures.\n"
            f"-->\n\n"
            f"[CHAPTER {chapter_num} CONTENT PLACEHOLDER]\n\n"
            f"---\n\n"
            f"## Prompts\n\n"
            f"<!-- This section is populated automatically by the Cowork enrichment\n"
            f"     pass. Each D3 figure generated in this chapter gets an entry here:\n"
            f"     the figure number, a short title, and a ready-to-paste prompt\n"
            f"     that produces a close approximation of that figure.\n\n"
            f"     Prerequisites: paste CLAUDE.md and DESIGN.md from the brutalist/\n"
            f"     folder before each prompt, or load them into your Claude project\n"
            f"     context once and reference them by name.\n"
            f"-->\n\n"
            f"*No figures have been generated for this chapter yet.*\n"
            f"*Run the Cowork enrichment pass to populate this section.*\n"
        )

    (root / "chapters" / "99-back-matter.md").write_text(
        BACK_MATTER_TEMPLATE
    )

    # ── book.md ───────────────────────────────────────────────────────────────
    (root / "book.md").write_text(
        BOOK_TEMPLATE.format(
            title=title,
            subtitle_line=subtitle_line,
            author=author,
        )
    )

    # ── outline.md ────────────────────────────────────────────────────────────
    chapter_outline_rows = ""
    for i in range(num_chapters):
        chapter_num = i + 1
        chapter_outline_rows += (
            f"{chapter_num}. **[Chapter {chapter_num} title]** — "
            f"[one-line description of the argument or move]\n"
        )

    (root / "outline.md").write_text(
        OUTLINE_TEMPLATE.format(
            title=title,
            subtitle_line=subtitle_line,
            author=author,
            chapter_outline_rows=chapter_outline_rows,
        )
    )

    # ── Tic TOC planning files ────────────────────────────────────────────────
    (root / "vision.md").write_text(
        VISION_TEMPLATE.format(
            title=title, subtitle_line=subtitle_line, author=author,
        )
    )
    (root / "architecture.md").write_text(
        ARCHITECTURE_TEMPLATE.format(
            title=title, subtitle_line=subtitle_line, author=author,
        )
    )
    (root / "chapters-spec.md").write_text(
        CHAPTERS_SPEC_TEMPLATE.format(
            title=title, subtitle_line=subtitle_line, author=author,
        )
    )
    (root / "risks.md").write_text(
        RISKS_TEMPLATE.format(
            title=title, subtitle_line=subtitle_line, author=author,
        )
    )

    # ── images placeholder ────────────────────────────────────────────────────
    (root / "images" / ".gitkeep").write_text("")

    # ── d3 placeholder ────────────────────────────────────────────────────────
    (root / "d3" / ".gitkeep").write_text("")

    # ── pantry ────────────────────────────────────────────────────────────────
    (root / "pantry" / ".gitkeep").write_text("")
    (root / "pantry" / "README.md").write_text(
        """\
# Pantry

Scratch storage for fragments, snippets, half-finished paragraphs,
quotes you might use, ideas you can't yet place, and anything else
that doesn't yet belong in a chapter.

Nothing in here gets compiled into the book. Move material into
`chapters/` when you're ready to use it.
"""
    )

    # ── build.sh ──────────────────────────────────────────────────────────────
    (root / "build.sh").write_text(
        f"""\
#!/bin/bash
set -e

BOOK_SLUG="{slug}"
METADATA="metadata.yaml"
OUTPUT_DIR="output"

mkdir -p "$OUTPUT_DIR"

cat $METADATA chapters/*.md > "$OUTPUT_DIR/combined.md"

pandoc "$OUTPUT_DIR/combined.md" \\
  --from markdown \\
  --to epub3 \\
  --epub-cover-image=cover.jpg \\
  --css=styles/kindle.css \\
  --css=styles/kindle-book.css \\
  --toc --toc-depth=2 \\
  --output="$OUTPUT_DIR/$BOOK_SLUG.epub"

pandoc "$OUTPUT_DIR/combined.md" \\
  --from markdown \\
  --to html5 \\
  --standalone \\
  --css=styles/kindle.css \\
  --css=styles/kindle-book.css \\
  --toc \\
  --output="$OUTPUT_DIR/$BOOK_SLUG.html"

echo "Built: $OUTPUT_DIR/$BOOK_SLUG.epub"
echo "Built: $OUTPUT_DIR/$BOOK_SLUG.html"
"""
    )
    (root / "build.sh").chmod(0o755)

    # ── graphs.sh ─────────────────────────────────────────────────────────────
    (root / "graphs.sh").write_text(
        r"""#!/bin/bash
# graphs.sh — process <!-- → [TYPE: description] --> comments in chapters/
# Always run from repo root.
# For D3/SVG figures, Cowork enrichment handles generation.
# This script handles placeholder image creation and table rendering
# for rapid local iteration without Cowork.
#
# Usage:
#   ./graphs.sh                      # process all chapters
#   ./graphs.sh chapters/01-foo.md   # process one chapter
set -e

CHAPTERS_DIR="chapters"
IMAGES_DIR="images"
STYLES_DIR="styles"
KINDLE_BOOK_CSS="$STYLES_DIR/kindle-book.css"

for dir in "$CHAPTERS_DIR" "$IMAGES_DIR" "$STYLES_DIR"; do
  if [[ ! -d "$dir" ]]; then
    echo "Error: expected directory '$dir' not found." >&2
    exit 1
  fi
done

touch "$KINDLE_BOOK_CSS"

FILES=()
if [[ -n "$1" ]]; then
  FILES=("$1")
else
  while IFS= read -r -d '' f; do
    FILES+=("$f")
  done < <(find "$CHAPTERS_DIR" -maxdepth 1 -name "*.md" -print0 | sort -z)
fi

IMG_W=1600
IMG_H=900
IMG_BG="#d0cec8"
IMG_FG="#1a1814"
IMG_ACCENT="#9a7d3a"

uppercase() { echo "$1" | tr '[:lower:]' '[:upper:]'; }

ucfirst() {
  local str="$1"
  local first
  first=$(echo "${str:0:1}" | tr '[:lower:]' '[:upper:]')
  echo "${first}${str:1}"
}

truncate_desc() {
  local desc="$1"
  local first
  first=$(echo "$desc" | sed 's/ — .*//')
  if [[ ${#first} -lt ${#desc} && ${#first} -gt 10 ]]; then echo "$first"; return; fi
  if [[ ${#desc} -gt 80 ]]; then echo "${desc:0:77}..."; return; fi
  echo "$desc"
}

make_placeholder() {
  local filepath="$1"
  local fig_label="$2"
  local type_tag="$3"
  local short_desc="$4"
  local wrapped
  wrapped=$(echo "$short_desc" | fold -s -w 40)

  convert \
    -size ${IMG_W}x${IMG_H} xc:"$IMG_BG" \
    -font "Helvetica" \
    -pointsize 28 -fill "$IMG_ACCENT" -gravity North \
    -annotate +0+80 "${fig_label} — PLACEHOLDER" \
    -pointsize 18 -fill "$IMG_FG" -gravity North \
    -annotate +0+140 "$type_tag" \
    -pointsize 22 -fill "$IMG_FG" -gravity Center \
    -annotate +0-40 "$wrapped" \
    -strokewidth 3 -stroke "$IMG_ACCENT" -fill none \
    -draw "rectangle 40,40 $((IMG_W-40)),$((IMG_H-40))" \
    "$filepath" 2>/dev/null

  echo "    → image: $(basename "$filepath")" >&2
}

classify() {
  local type_tag
  type_tag=$(uppercase "$1")
  local description="$2"

  case "$type_tag" in
    TABLE)
      if echo "$description" | grep -qi "contrast\|vs\|versus\|comparison"; then
        echo "infographic-table"
      elif echo "$description" | grep -qi "data\|results\|measure\|count\|number\|rate\|score"; then
        echo "data-table"
      else
        echo "comparison-table"
      fi
      ;;
    INFOGRAPHIC)
      if echo "$description" | grep -qi "contrast\|vs\|versus\|comparison\|columns\|rows\|side.by.side\|properties"; then
        echo "infographic-table"
      else
        echo "image"
      fi
      ;;
    CHART)
      if echo "$description" | grep -qi "columns\|rows\|comparison\|vs"; then
        echo "data-table"
      else
        echo "image"
      fi
      ;;
    IMAGE|DIAGRAM|*)
      echo "image"
      ;;
  esac
}

render_table() {
  local description="$1"
  local fig_label="$2"
  local css_class="$3"

  local col1="Property"
  local col2="Value"

  if echo "$description" | grep -qi " vs\.* "; then
    col1=$(echo "$description" | sed 's/.*contrast of //i' | sed 's/ vs\.* .*//i' | sed 's/^ *//;s/ *$//')
    col2=$(echo "$description" | sed 's/.* vs\.* //i' | sed 's/ —.*//;s/ -.*//' | sed 's/^ *//;s/ *$//')
    col1=$(ucfirst "$col1")
    col2=$(ucfirst "$col2")
  fi

  echo ""
  echo "*${fig_label}*"
  echo ""
  echo "| | **${col1}** | **${col2}** |"
  echo "|---|---|---|"
  echo "| **Row 1** | _fill in_ | _fill in_ |"
  echo "| **Row 2** | _fill in_ | _fill in_ |"
  echo ""
  echo ": {.${css_class}}"
  echo ""
}

TOTAL_IMAGES=0
TOTAL_TABLES=0
TOTAL_SKIPPED=0
CSS_LOG=""

for CHAPTER_FILE in "${FILES[@]}"; do

  if ! grep -qE '<!-- → \[' "$CHAPTER_FILE"; then
    BASENAME=$(basename "$CHAPTER_FILE" .md)
    echo "Skipping: $BASENAME (no figure comments)" >&2
    TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
    continue
  fi

  BASENAME=$(basename "$CHAPTER_FILE" .md)
  CHAPTER_SLUG="${BASENAME#chapter-}"
  CHAPTER_NUM=$(echo "$CHAPTER_SLUG" | grep -oE '^[0-9]+' | sed 's/^0*//')
  [[ -z "$CHAPTER_NUM" ]] && CHAPTER_NUM="0"

  OUT_FILE="${CHAPTERS_DIR}/${BASENAME}-updated.md"
  FIG_COUNT=0

  echo "" >&2
  echo "Processing: $BASENAME" >&2

  while IFS= read -r line; do
    if echo "$line" | grep -qE '<!-- → \['; then
      COMMENT_CONTENT=$(echo "$line" | sed 's/.*<!-- → \[//;s/\].*//')
      TYPE_TAG=$(echo "$COMMENT_CONTENT" | sed 's/:.*//' | tr -d ' ')
      DESCRIPTION=$(echo "$COMMENT_CONTENT" | sed 's/^[^:]*: *//')
      FIG_COUNT=$((FIG_COUNT + 1))
      FIG_LABEL="Figure ${CHAPTER_NUM}.${FIG_COUNT}"
      RENDER_AS=$(classify "$TYPE_TAG" "$DESCRIPTION")
      SHORT_DESC=$(truncate_desc "$DESCRIPTION")
      TYPE_UPPER=$(uppercase "$TYPE_TAG")

      if [[ "$RENDER_AS" == "image" ]]; then
        IMG_FILENAME="${CHAPTER_SLUG}-fig-$(printf "%02d" $FIG_COUNT).jpg"
        make_placeholder "${IMAGES_DIR}/${IMG_FILENAME}" \
          "$FIG_LABEL" "$TYPE_UPPER" "$SHORT_DESC"
        TOTAL_IMAGES=$((TOTAL_IMAGES + 1))
        echo "$line"
        echo ""
        echo "![${FIG_LABEL} — ${SHORT_DESC}](images/${IMG_FILENAME})"
        echo ""
        CSS_LOG="${CSS_LOG}\n/* ${FIG_LABEL} (${BASENAME}): image — replace ${IMG_FILENAME} */"
      else
        TOTAL_TABLES=$((TOTAL_TABLES + 1))
        echo "$line"
        render_table "$DESCRIPTION" "$FIG_LABEL" "$RENDER_AS"
        CSS_LOG="${CSS_LOG}\n/* ${FIG_LABEL} (${BASENAME}): .${RENDER_AS} */"
        echo "    → table (${RENDER_AS}): ${FIG_LABEL}" >&2
      fi
    else
      echo "$line"
    fi
  done < "$CHAPTER_FILE" > "$OUT_FILE"

  echo "  Written: $OUT_FILE" >&2
done

if [[ -n "$CSS_LOG" ]]; then
  {
    echo ""
    echo "/* ── graphs.sh run: $(date '+%Y-%m-%d %H:%M') ── */"
    printf "$CSS_LOG\n"
  } >> "$KINDLE_BOOK_CSS"
fi

echo "" >&2
echo "────────────────────────────────────────────" >&2
echo "Done." >&2
echo "  Skipped (no comments) : $TOTAL_SKIPPED" >&2
echo "  Tables rendered       : $TOTAL_TABLES" >&2
echo "  Images generated      : $TOTAL_IMAGES" >&2
echo "" >&2
echo "Review -updated.md files, then promote:" >&2
echo '  for f in chapters/*-updated.md; do mv "$f" "${f/-updated/}"; done' >&2
echo "────────────────────────────────────────────" >&2
"""
    )
    (root / "graphs.sh").chmod(0o755)

    # ── GitHub Actions workflow ───────────────────────────────────────────────
    (root / ".github" / "workflows" / "build.yml").write_text(
        f"""\
name: Build EPUB

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Pandoc
        run: sudo apt-get install -y pandoc

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Node dependencies
        run: npm install

      - name: Convert SVGs to PNG
        run: node SCRIPTS/svg-to-png.mjs

      - name: Build EPUB
        run: |
          mkdir -p output
          cat metadata.yaml chapters/*.md > output/combined.md
          pandoc output/combined.md \\
            --from markdown \\
            --to epub3 \\
            --epub-cover-image=cover.jpg \\
            --css=styles/kindle.css \\
            --css=styles/kindle-book.css \\
            --toc --toc-depth=2 \\
            --output=output/{slug}.epub

      - name: Upload EPUB as artifact
        uses: actions/upload-artifact@v4
        with:
          name: book-epub
          path: output/{slug}.epub
"""
    )

    # ── README.md ──────────────────────────────────────────────────────────────
    display_title = f"{title}: {subtitle}" if subtitle else title
    volume_line = f"**Volume:** {volume}\n" if volume else ""

    # Chapter progress table — all modes
    chapter_rows = "| File | Title | Draft | anki | wayback | when-to-use-ai | llm | cli | ai-validation | exercises | bridge | assessments | further-reading | cli-quick-ref | glimmer | quiz |\n"
    chapter_rows += "|------|-------|-------|------|---------|----------------|-----|-----|---------------|-----------|--------|-------------|-----------------|---------------|---------|------|\n"
    chapter_rows += "| 00-frontmatter.md | Front Matter | ☐ | — | — | — | — | — | — | — | — | — | — | — | — | — |\n"
    chapter_rows += "| 01-introduction.md | Introduction | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |\n"
    for i in range(num_chapters):
        chapter_num = i + 1
        file_num = i + 2
        chapter_rows += f"| {file_num:02d}-chapter-{chapter_num:02d}.md | Chapter {chapter_num} | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |\n"
    chapter_rows += "| 99-back-matter.md | Back Matter | ☐ | — | — | — | — | — | — | — | — | — | — | — | — | — |\n"

    (root / "README.md").write_text(
        f"""\
# {display_title}

**Author:** {author}
**Publisher:** {publisher}
{volume_line}**Status:** Draft
**Started:** {date.today().isoformat()}

## Structure

```
book.md                 ← book description and high-level outline
outline.md              ← chapter-level TOC
vision.md               ← Tic TOC Phase 1
architecture.md         ← Tic TOC Phase 2
chapters-spec.md        ← Tic TOC Phase 3
risks.md                ← Tic TOC Phase 4
pantry/                 ← scratch fragments
chapters/               ← markdown source files
images/                 ← PNGs used by the EPUB
d3/                     ← interactive D3 HTML figures

— Extraction directories (populated by Cowork extraction pass) —
anki/                   ← Key Terms → Anki import files
wayback/                ← AI Wayback Machine sections
when-to-use-ai/         ← Exercise 1 & 2 (judgment frame) blocks
llm/                    ← Exercise 3 LLM Exercise blocks
cli/                    ← Exercise 4 CLI Exercise blocks
ai-validation/          ← Exercise 5 AI Validation blocks
exercises/              ← Exercises sections
bridge/                 ← Bridge sections
assessments/            ← Assessments sections
further-reading/        ← Further Reading sections
cli-quick-reference/    ← CLI Quick Reference sections

— Supplemental learning mode directories (instructor-populated) —
glimmers/               ← Glimmer generative assignments
rubrics/                ← Grading rubrics for Glimmer and case studies
lecture-notes/          ← Slide-ready condensed chapter summaries
worked-problems/        ← Step-by-step solved examples
quizzes/                ← Platform quiz files
exams/                  ← Exam banks
discussion-prompts/     ← Seminar-style discussion questions
case-studies/           ← Case study scenarios (professor-authored only)
supplemental/           ← Optional ala carte chapters + catalog.md
slides/                 ← Presentation slides (see also)
videos/                 ← Video scripts or links (see also)

SCRIPTS/
    svg-to-png.mjs      ← converts images/**/*.svg to 300dpi PNG
```

## Chapter Progress

{chapter_rows}
Legend: ☐ = not started  ✓ = complete  — = not applicable

## Figures

Each chapter ends with a **Prompts** section containing ready-to-paste
prompts for recreating its D3 figures. Load `brutalist/CLAUDE.md` and
`brutalist/DESIGN.md` into your Claude project context before using them.

Cowork enrichment generates:
- `images/{slug}-fig-NN.svg` — static SVG (→ PNG for EPUB)
- `d3/{slug}-fig-NN.html` — interactive D3 HTML

Convert SVGs to PNG:
```bash
node SCRIPTS/svg-to-png.mjs
```

## Extraction Pass

To populate the extraction directories from authored chapter sections:

```
Run the Cowork extraction prompt against chapters/
```

Each extraction directory contains a README.md explaining what it holds,
what headings it matches, and how it connects to Medhavy.

## Build

```bash
npm install        # first time only
./build.sh
```

Output goes to `output/` (gitignored).
"""
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n✓ Created: {root}")
    print(f"  book.md, outline.md, vision.md, architecture.md")
    print(f"  chapters-spec.md, risks.md, pantry/")
    print(f"  chapters/00–99 ({num_chapters} body chapters + front/back matter)")
    print(f"  images/, d3/, SCRIPTS/svg-to-png.mjs")
    print(f"  Extraction dirs (11): anki, wayback, when-to-use-ai, llm, cli,")
    print(f"    ai-validation, exercises, bridge, assessments, further-reading,")
    print(f"    cli-quick-reference")
    print(f"  Supplemental dirs (11): glimmers, rubrics, lecture-notes,")
    print(f"    worked-problems, quizzes, exams, discussion-prompts, case-studies,")
    print(f"    supplemental (+ catalog.md), slides, videos")
    print(f"  package.json (sharp + glob)")
    print(f"  Publisher: {publisher}")
    if volume:
        print(f"  Series: {title}, Volume {volume}")
    print(f"\nNext steps:")
    print(f"  cd {root}")
    print(f"  npm install")
    print(f"  git init && git add -A && git commit -m 'scaffold'")
    print(f"  # Fill in book.md and outline.md")
    print(f"  # Run Cowork enrichment to generate figures")
    print(f"  # Run Cowork extraction pass to populate extraction directories")
    print(f"  # Run ./build.sh to produce EPUB\n")


def main():
    parser = argparse.ArgumentParser(description="Scaffold a new book project.")
    parser.add_argument("title",   help="Series or book title")
    parser.add_argument("author",  help="Author name")
    parser.add_argument("--subtitle",  default="",
                        help="Volume subtitle")
    parser.add_argument("--volume", type=int, default=None,
                        help="Volume number for a series")
    parser.add_argument("--chapters", type=int, default=14,
                        help="Number of body chapters (default: 14)")
    parser.add_argument("--dir", default=None,
                        help="Parent directory (default: current directory)")
    parser.add_argument("--publisher", default="Bear Brown, LLC",
                        help="Publisher name (default: Bear Brown, LLC)")
    args = parser.parse_args()
    create_book(args.title, args.author, args.subtitle, args.volume,
                args.chapters, args.dir, args.publisher)


if __name__ == "__main__":
    main()
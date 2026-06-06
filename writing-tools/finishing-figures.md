# Appendix G — The Finishing Pass and Image Suggest Prompts

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


*The Chapter Finishing Pass and CAJAL Image Suggest, reproduced for copying.*

---

These are the prompts behind Chapter 9 (*Finishing Pass and Figures*). The **Chapter Finishing Pass** adds an italic subtitle and visual-placeholder comments to each chapter without touching prose. **CAJAL Image Suggest** then reads those chapters and writes a ranked figure plan to `pantry/{chapter-slug}-cajal.md`. Copy whichever you need into your project. The actual SVG/PNG rendering runs through `SCRIPTS/svg-to-png.mjs` (see Appendix I). The maintained copies live in Bear Brown & Company's online prompt library [verify URL at time of writing]; if they differ from this appendix, the online copies are newer.

---

**Runs in:** Cowork or Codex — or any assistant with file read/write to your book directory.

**Dependencies:** drafted `chapters/*.md`.

**Produces:** the Finishing Pass edits each chapter in place (subtitle + visual-placeholder comments); Image Suggest writes one `pantry/<chapter-slug>-cajal.md` figure plan per chapter.

---

## Cowork or Codex  Prompt: Chapter Finishing Pass

---

### ROLE & CONTEXT

You are a finishing-pass editor for a textbook or book chapter.
Your job is to apply two lightweight additions to a completed 
draft — a subtitle and visual suggestions — without touching 
the prose. You do not rewrite. You do not restructure. You add 
at most two layers and return the complete document.

---

### STEP 0 — LOCATE THE FILE

Determine the target file:
- If a filepath was passed as an argument, use it.
- Otherwise, look for the most recently modified `.md` file 
  in the current directory.
- If no file can be identified, report what was searched 
  and stop.

Read the file in full before proceeding.

---

### STEP 1 — SUBTITLE

Check the first heading in the document.

If the heading is bare — a title line with no italic subtitle 
on the line directly below it — write one and insert it.

Subtitle format, no exceptions:

Title
Evocative subtitle phrase.


The subtitle is a single italic line immediately under the 
heading. It should compress the chapter's animating tension 
or central insight into a phrase that makes a reader want 
to continue. It is not a table of contents entry. It is not 
a description. It is a hook.

Good subtitles reveal the stakes or the friction. If the 
chapter's central design tension is legible from the prose, 
pull from that. If not, name the consequence of getting 
the chapter's main concept wrong.

If a subtitle already exists, leave it exactly as-is. 
Do not improve, adjust, or touch it.

---

### STEP 2 — VISUAL SUGGESTIONS

Read the full chapter. At each location where a visual —
image, table, infographic, or chart — would genuinely serve 
comprehension or retention, insert an HTML comment on its 
own line:

<!-- → [TYPE: description of what it shows and why it belongs here] -->

Types: `IMAGE`, `TABLE`, `INFOGRAPHIC`, `CHART`

The description must name the specific content, not the 
generic category.

Not: `TABLE: comparison table`
But: `TABLE: side-by-side comparison of blocking vs. 
non-blocking I/O — columns: property, blocking behavior, 
non-blocking behavior, when to use each`

Not: `CHART: graph of results`
But: `CHART: line chart showing latency vs. concurrency 
for three queue depths — reader should see the knee of 
the curve`

Place comments inline where the visual belongs — immediately 
before or after the paragraph the visual would illustrate. 
Do not cluster them at the end.

These comments are invisible when the markdown renders. 
They are a working layer for the author, not reader-facing.

---

### STEP 3 — SAVE OUTPUT

Write the finished document back to the original file, 
or if a separate output path is specified, save there.

Do not summarize what changed. Do not add a preamble. 
Return the complete draft with both operations applied.

---

### BEHAVIORAL RULES

- Never rewrite prose
- Never restructure the chapter
- Never improve an existing subtitle — if it exists, skip Step 1
- Never add content beyond the subtitle and visual comments
- Never remove anything from the draft
- Never add a preamble, summary, or explanation of changes
- If the subtitle is missing and the chapter's tension is 
  not legible from the prose, write the most defensible 
  subtitle available and add a FLAG comment at the top:
  `<!-- FLAG: subtitle written from limited context — 
  author should verify -->`
- Flag, don't skip. If a visual location is uncertain, 
  insert the comment and add `(tentative)` to the description.

This is a finishing layer, not an editing pass. 
The draft goes in. The draft comes out with two additions.
do a TIKTOC-driven write or rewrite


if 97-fundamenta-themes.md  exists in chapters use those themes were appropriate through writing the chapters

after writing is done update  97-fundamenta-themes.md  to an appendix chapter  97-fundamental-themes.md 


If there is not TIKTOC.md and chapters written in chapters then build a TIKTOC.md from that


---

## Cowork or Codex Prompt: image suggest

Go through every chapter in chapters and save a report in pantry

name [kebab case chapier number and title]-cajal.md  with the  figure Intelligence suggestions for that chapter

e.g. 05-confounders.md would be a file 05-confounders-cajal.md in the pantry

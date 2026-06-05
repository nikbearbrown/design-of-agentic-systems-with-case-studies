You are working in the bear-textbooks workshop on a "theory spine + student
cases" textbook. The theory chapters are stable across editions; the case
layer rotates each semester. Your job this session is to refresh the case
layer for a new semester.

SETUP — do these in order before writing anything.

1. Set the active book. Confirm `.current-book` points at the right book
   slug, or ask which book this is for.

2. Read any data that may be related to the books structure like book's CLAUDE.md, README.md, and metadata.yaml. 
   If ambiguous have a conversation to create them.
   Identify the
   case-chapter template the book uses (section list, word target, byline
   convention, filename convention, image-brief convention). If the book
   has a system-case template documented, follow it exactly. If not, fall
   back to the seven-section template: Situation (~150w), Architecture
   (~250w), Design rationale (~250w), Trade-offs (~150w), Outcomes and
   revisions (~150w), Pattern connection (~50w), Transfer prompt (~50w),
   1,000-1,200 words total.

3. Read 2-3 existing case chapters from the previous edition under
   `chapters/` to calibrate voice. The voice anchor is what's already
   shipped, not what you assume.

4. Catalog the pantry. List every PDF, HTML, IPYNB, and MD file under
   `pantry/`. Identify which is the syllabus and which are student
   projects. For each project, extract: project name, author(s), one-line
   description. Two students on one project means both names go on one
   chapter byline.

5. Read the syllabus end-to-end. Note: stated learning outcomes, the
   theory chapters the projects are meant to instantiate, the editorial
   gates the projects passed, the publication terms students agreed to.

6. Present a numbered batch plan to me before writing anything. Group
   the projects into batches of 5-6. For each project, name the chapter
   number, the case slug, and the author(s). Wait for my "go" before
   starting Batch A.

WRITING — once I approve the batch plan.

For each project, produce two files:

A. `chapters/{NN}-case-{slug}.md` following the book's case template. Use
   the seven-section template above as fallback. Include:
   - Title line: `# Chapter NN — Case: {Project Name}`
   - Tagline italicized below
   - `**Author:** {Name}` (one author) or `**Authors:** {Name1}, {Name2}`
     (two students on one project)
   - `**Editor:** Nik Bear Brown`
   - Linked primary sources where claims are contestable
   - One concrete metric or outcome from the project's report, reported
     honestly (do not flatter, do not invent numbers, do not hide failed
     targets)
   - "Pattern connection" naming the theory chapter(s) the case
     instantiates
   - "Transfer prompt" with 2-3 questions for the reader

B. `images/{NN}-case-{slug}.md` — a hero-image brief naming subject,
   mood, negative space for title overlay, and what the teaching image
   should make most visually prominent. No actual image generation —
   just the brief.

After each batch, stop. Summarize what landed. Wait for "next batch."

INTRODUCTION — write Ch 00 last, after all case chapters are drafted.

Create `chapters/00-introduction.md` (or update the existing one). The
introduction does three jobs in this order:

1. Frames the semester's projects in the class context. Read across all
   case chapters you just wrote and the syllabus. Identify the through-
   lines — which theory chapters get the most case coverage, what
   architectural patterns appear repeatedly across student projects,
   what failure modes recur. Name them specifically with chapter
   pointers.

2. Introduces the reader to how to read this edition. The theory spine
   is stable; the case layer is this cohort's work. Tell the reader
   which cases are paired with which theory chapters, which cases stand
   alone as patterns, which cases are proposal-stage versus shipped.

3. Acknowledges the cohort by name. List every author in the case layer
   with their case title.

Length: 800-1,200 words. Same voice as case chapters. End with one
sentence naming what would change about this introduction in the next
edition.

HARD RULES.

- No fabricated sources, quotes, statistics, or citations. If a number
  is not in the project's report, do not invent it. If certainty is not
  available, write `[verify]` inline.
- Honest reporting. If a project missed its target metric, name the
  miss in the case's "Outcomes and revisions" section. Failed targets
  reported truthfully are stronger than flattered ones.
- Proposal-stage projects (where the project ends at the design rather
  than at a measured outcome) get an explicit note at the top of the
  chapter — "this case documents a proposal-stage system" — and the
  outcomes section reports targets, not measured numbers.
- Voice stays calm, structured, and grounded in mechanism. No
  stakeholder-speak, no "robust" or "scalable" without explanation, no
  closing sentences that could appear in a press release.
- The human review gate is inviolable. You produce drafts. I review.
  Nothing publishes from this session.

Begin with Setup steps 1-6. Stop at the batch plan.
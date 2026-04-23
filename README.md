# Design of Agentic Systems with Case Studies

**A living Kindle handbook of agentic system case studies, produced by a graduate cohort each semester, framed by a short theory spine, read non-sequentially by engineers looking for patterns relevant to their own work.**

Publisher: [Bear Brown LLC](https://www.bearbrown.co)
Editor: [Nik Bear Brown](https://www.bearbrown.co/books)
Current edition: Spring 2026
Next edition: Fall 2026
Kindle edition: *[add Amazon link on publication]*

---

## What this is

This repository is the working source of *Design of Agentic Systems with Case Studies*. It contains the book's chapter files, hero images, build tooling, and the editorial workflow that gates case-study publication.

The book is a handbook for engineers evaluating whether an agentic architecture is the right answer for a given problem, and beginning the design if it is. It ships on Kindle each semester as a snapshot edition, published by Bear Brown LLC and edited by Nik Bear Brown. The theory spine is stable across editions with field-drift updates; the case layer is produced by that semester's graduate cohort and belongs to that edition.

The structural bet: engineers learn design from reading documented real deployments, not from constructing toy examples. The case layer is load-bearing, not decorative. Every case in the book passed an editorial gate that rejects more submissions than it accepts.

---

## For readers

You can read the book on Kindle. The Spring 2026 Edition is available at Amazon's Kindle minimum price (\$0.99) and through **Kindle Unlimited**. During each edition's promotional window the Book will also be made available **free of charge** for as many days as Amazon permits under KDP Select. Follow the [editor's page](https://www.bearbrown.co/books) for announcements of free-promotional windows.

If you want to read source material directly, this repository has chapter drafts under `chapters/`.

**How to read the book:**

- **Evaluating whether to build agentic:** Chapters 1, 9, and 11, plus two or three system cases in domains close to yours.
- **Designing an agentic system:** theory spine Chapters 1–11 in order, with each paired case read alongside its theory chapter.
- **Debugging a specific failure:** start with the pattern cases (hallucination, context collapse, cascade failure, attack surface, cost blowout).
- **Adopting for a course:** an instructor supplement is planned for Fall 2026. Open a discussion in Issues if you are teaching from the Spring 2026 edition and need materials sooner.

**How to cite:** cite the specific edition. The case layer differs between editions; a citation without an edition is ambiguous. Individual case chapters carry student bylines and can be cited directly.

**How to report errors:** open an issue with the `errata` label. An errata page is maintained between editions. Corrections land in the next edition; shipped editions are not retroactively changed.

---

## How the book is built

Before contributing, understand the build. It determines what works and what won't.

### The build convention

The book is built by `build.sh` from markdown files under `chapters/`. Two facts drive everything downstream:

**1. Chapter order is filename-alphabetical.** There is no manifest, no explicit ordering field, no table of contents outside the chapters themselves. The shell glob `chapters/*.md` expands in alphabetical order, `cat` concatenates, Pandoc compiles. Whatever sorts first is Chapter 1.

**2. The directory is flat.** `chapters/*.md` reads the top level only. Subdirectories are invisible to the build. Every chapter file sits directly under `chapters/`.

These two facts mean every chapter file needs a sortable numeric prefix. The convention:

```
chapters/
  00-preface.md
  01-problem-agentic-systems-solve.md
  02-agent-basics-core-loop-bdi.md
  03-memory-and-context.md
  03a-case-my-askai.md              # system case paired with Ch. 3
  04-tool-use.md
  04a-case-stripe.md                # system case paired with Ch. 4
  05-orchestration.md
  05a-case-enterprise-bot.md        # paired
  05b-case-oracle-health.md         # two cases on this theme
  06-grounding-foundations.md
  06a-case-magid.md                 # paired
  07-configuring-retrieval.md
  08-meta-reasoning.md
  08a-case-six-atomic.md            # paired
  09-trade-offs-and-design.md
  10-failure-modes.md
  10a-pattern-hallucination.md      # pattern case indexed to Ch. 10
  10b-pattern-context-collapse.md
  10c-pattern-cascade-failure.md
  10d-pattern-attack-surface.md
  10e-pattern-cost-blowout.md
  11-when-not-to-go-agentic.md
  99-back-matter.md
```

Case chapters use letter suffixes (`03a`, `03b`) to slot them immediately after the theory chapter they pair with. Pattern cases cluster under `10-failure-modes.md` as `10a` through `10e`. This keeps the reading order clean without requiring the build to understand anything about case types.

**Hero images follow the same convention.** Every chapter file has a matching image in `images/` with the same slug:

```
images/
  00-preface.jpg
  01-problem-agentic-systems-solve.jpg
  02-agent-basics-core-loop-bdi.jpg
  ...
```

If you add a chapter `05a-case-enterprise-bot.md`, the paired image is `images/05a-case-enterprise-bot.jpg`. No additional build configuration needed.

### The draft-notes convention

Chapter files can contain editorial notes that are stripped from the published build. Any section with the heading `## Notes on the draft` (or `## Notes on Draft`) is removed during the build. Everything from that heading until the next top-level or same-level heading is excluded from the EPUB and HTML outputs.

This is how you keep editorial reminders, open questions, revision notes, or editor feedback inside the chapter file without it shipping to readers. Example:

```markdown
# Chapter 3 — Memory and Context

...chapter content...

## Notes on the draft

Need to add a concrete code example for the memory-trade-off
comparison. Reviewer flagged that the abstract is stronger than
the walkthrough. Revise before Fall 2026.
```

The published book has the chapter without the notes section. The repo preserves the notes for the next editor or the same author's next revision.

### Running the build

```bash
./build.sh
```

Produces `output/essais-on-learning-vol1.epub` (Kindle-ready) and `output/essais-on-learning-vol1.html` (browser proofing). Read the HTML first — errors are faster to catch in a browser than on a Kindle.

---

## For contributors (Northeastern cohort)

If you are a student in the course producing cases for the next edition, this section is your starting point. Read everything below before you start writing — including the publication terms and the release requirement, because both affect whether your work actually ships.

### What you're signing up for

Contributing a case to this book is **uncompensated academic publication**. The book is priced at Amazon's Kindle minimum (\$0.99) and distributed through Kindle Unlimited, with promotional free-distribution windows. Any proceeds from Amazon go to Bear Brown LLC (the publisher) and are used to create future opportunities for future students — honoraria for guest speakers, support for subsequent cohorts, related uses. Authors do not receive royalties or direct financial compensation.

What you get instead:

- **A publication credit.** A real book, a real ISBN (assigned by Amazon KDP), real authorship. Citable. Listable on a CV.
- **Your byline** on your chapter, in every edition your chapter appears in.
- **An Amazon author page** you can claim after publication.
- **Copyright retention.** You keep copyright on your chapter. The publisher gets a non-exclusive license to publish it; you can cite, list, or reuse your own chapter in other work.

If that trade — real publication credit in exchange for writing a publishable case, no cash — doesn't work for you, this isn't the project for you. That's a valid call to make early rather than late.

### Two gates, one assignment

Your case passes through two separate gates. Clear the first to earn credit in the course. Clear the second to be published in the edition. They are different gates, and a case that clears the first does not automatically clear the second.

**Assignment gate (course credit).** What you must produce to earn credit for the course assignment:

- A real organization and a real deployed system (for system cases), **or** a real phenomenon and at least three documented incidents (for pattern cases). Hypothetical systems or hypothetical incidents fail the assignment.
- All template sections present (see templates below). Target word counts met.
- Minimum source count: three primary sources for a system case, five for a pattern case (at least one source per incident).
- Explicit connection to at least one theory-spine chapter.
- Submitted as a pull request by the deadline in the syllabus.

**Acceptance standard (publication).** What your case must meet to ship in the edition:

1. **Sources are primary and verifiable.** Not "I read a blog post." The engineering blog post has a named author. The documentation has a date. The conference talk has a video link. A reader who wanted to could check.
2. **Design choices are specific and attributable.** "They use RAG" is not a design choice. "They chose hybrid retrieval weighted 0.4 lexical / 0.6 dense because user queries mix exact-SKU lookups with paraphrased support questions" is a design choice.
3. **All three case-layer outcomes are supportable.** A reader with just the theory spine and your case should be able to (a) decompose the system, (b) critique at least one design choice, (c) propose how the pattern would apply to a different problem. If any of the three fails, the case is underpowered.
4. **The pattern instantiation is clear.** Name which theory-spine chapter's pattern your case instantiates. Explicitly.
5. **A failure mode is named.** Every case — including success stories — must say where this approach fails or would fail. Success cases without a failure section breed false confidence.
6. **Writing is tight.** No restating theory. No filler. Every paragraph earns its place.
7. **The case doesn't duplicate another in the edition.** If another student's case already teaches the same move in the same domain, yours needs to contribute something the other doesn't.
8. **For pattern cases only: incidents genuinely vary.** Three incidents that all say the same thing at three companies are one case, not three. The variation across incidents is where the teaching lives.

Editorial review applies this standard. Cases that pass ship in the edition under your byline. Cases that do not pass still earn course credit if the assignment gate was cleared.

### The third gate: signed release before publication

Passing the acceptance standard is necessary but not sufficient. You must also sign and return the **Author Release and Publication Agreement** (provided separately by the editor) before the Release Deadline announced for your edition.

**A chapter whose author has not returned a signed release by the Release Deadline is removed from the book before publication, regardless of the chapter's editorial quality.** Your course credit is unaffected — you still earned it by clearing the assignment gate — but your chapter does not appear in the published edition.

This requirement exists because the publisher needs signed evidence of your consent to the publication terms (pricing, Kindle Unlimited, free-promotional-window distribution, editing rights, and the no-royalty arrangement described above). Without your signed release on file, the publisher cannot legally include your chapter in the published book.

Read the release document carefully before signing. If any of its terms are unclear, ask. If any of its terms are unacceptable to you, that's a valid reason to decline publication — your course credit is not contingent on signing.

### Case templates

Every case uses one of two templates, depending on type. Pick the type before you start writing.

**System case template** — one named deployed system, 1,000–1,200 words, seven sections:

1. **Situation (~150w)** — organization, business problem, why agentic was the attempted answer.
2. **Architecture (~250w)** — system as built; components, data flow; architectural diagram required.
3. **Design rationale (~250w)** — why each major choice was made, with sources.
4. **Trade-offs (~150w)** — what the design got them, what it cost.
5. **Outcomes and revisions (~150w)** — what shipped, what worked, what they changed.
6. **Pattern connection (~50w)** — which theory-spine chapter's pattern this instantiates.
7. **Transfer prompt (~50w)** — 2–3 questions for readers about their own systems.

**Pattern case template** — one named phenomenon across three or more incidents, 1,000–1,300 words, eight sections:

1. **The phenomenon (~100w)** — defined precisely.
2. **Theory connection (~50w)** — which theory chapter this applies.
3. **Documented incidents (~500w)** — three to five real occurrences, each with context and sources.
4. **Anatomy of the pattern (~200w)** — what the incidents share.
5. **Variations (~150w)** — how the pattern manifests differently across contexts.
6. **Diagnostic cues (~100w)** — how a reader recognizes the pattern in their own system.
7. **Mitigation (~100w)** — what reduces exposure (not always "fixes").
8. **Transfer prompt (~50w)** — self-check for the reader.

A system case documents *how one organization built something*. A pattern case documents *what a phenomenon looks like across instances*. The unit of study is different, and the templates reflect that. Do not mix the two.

### The submission workflow

```
Week 1–2     Assignment issued. Read this README end to end.
             Pick your case and your template type.
Week 3–6     Case outline due as a PR. Editorial feedback in comments.
             System vs. pattern clarification if needed.
Week 7–10    First draft due. First editorial review.
Week 11–13   Revision round. Acceptance-standard decisions communicated.
Week 14      Final submission. Publication decisions finalized.
             Release documents distributed to students with accepted cases.
Release      Signed release due from every publishing author.
Deadline     Chapters without signed releases are removed from the edition.
Week 15+     Edition assembled and published. Published authors claim
             Amazon author pages using their chapter byline.
```

Submit drafts as pull requests. Your chapter file goes at the correct numeric-prefix position in `chapters/` — the editor tells you which prefix (for example, `10f-pattern-your-phenomenon.md` if you are adding a new pattern case to Chapter 10's cluster). Your hero image goes in `images/` at the same prefix with `.jpg`. If you cannot produce the hero image, open the PR without it and the editor will handle it; do not block the submission on the image.

### Editorial review in PRs

Reviews happen in the pull request. The reviewer works through the acceptance-standard checklist above and leaves comments. Three outcomes:

- **Accept.** The case ships as submitted or with minor edits. The PR gets merged. The release document is sent to the author.
- **Revise and resubmit.** The case is close but needs specific changes. The reviewer names the changes in PR comments. You revise, push new commits, and the reviewer re-reviews.
- **Cut from this edition.** The case does not ship. Either the assignment gate failed too, or the revision needed is larger than remaining time allows. The reviewer explains which items on the acceptance standard the case did not meet. You still earn course credit if the assignment gate was cleared. You can revise and resubmit for a future edition.

Feedback is concrete. "This case is weak" is not acceptable reviewer feedback. "The design rationale in Section 3 cites no sources, and the 'hybrid retrieval' claim in paragraph 2 needs to trace to the team's engineering blog post or a direct interview" is acceptable reviewer feedback. If you receive feedback you cannot act on because it is too vague, ask the reviewer to be specific.

### If your draft is not accepted — or you don't return a signed release

Three ways a case can fail to appear in the published edition:

1. **Assignment gate failed.** No course credit, no publication. Rare; the assignment gate is the lower bar.
2. **Acceptance standard not met.** Course credit earned; no publication in this edition. You can revise for a future edition or leave it as course-credit-only.
3. **Release not returned by the deadline.** Course credit earned; editorial acceptance earned; but the chapter is removed from the edition because the publisher does not have signed consent on file. You can sign for a future edition if you choose.

None of these is a judgment on you as a researcher.

---

## For TAs

The `ta-workflow/` directory contains operational workflows for running the editorial pipeline.

- `ta-workflow/byline-reconciliation.md` — how to attach the right name to drafts that arrived without signed authorship.
- `ta-workflow/editorial-review-checklist.md` — the pass/fail rubric used on every case draft.
- `ta-workflow/releases-received.md` — log of which chapters have signed releases on file. Signed copies themselves are not committed to the repo; they are stored by the publisher.
- `ta-workflow/open-questions-log.md` — the living tracker for editor decisions deferred to specific deadlines.

---

## Repository structure

```
design-of-agentic-systems-with-case-studies/
├── README.md              # this file
├── metadata.yaml          # Pandoc metadata (title, author, edition)
├── build.sh               # builds EPUB and HTML outputs
├── chapters/              # flat — every chapter file directly under here
│   ├── 00-preface.md
│   ├── 01-problem-agentic-systems-solve.md
│   ├── ...
│   └── 99-back-matter.md
├── images/                # hero images, one per chapter, matching slug
│   ├── 00-preface.jpg
│   └── ...
├── styles/
│   └── kindle.css         # Pandoc styles for both EPUB and HTML
├── cover.jpg              # EPUB cover image (optional)
├── _working/              # drafts, notes, excluded from builds
├── ta-workflow/           # operational workflow documents
├── errata/                # edition-specific errata pages
├── output/                # built EPUB and HTML (gitignored)
└── LICENSE
```

Contents of `_working/` and `output/` are excluded from the Pandoc build. Signed release documents are **not** stored in this repository — they are the publisher's private legal records.

---

## Editions

Each edition is a snapshot. Once shipped, editions are not retroactively changed; corrections land in the next edition and in the errata page.

| Edition | Status | Theory spine | System cases | Pattern cases |
|---|---|---:|---:|---:|
| Spring 2026 | Current | 11 chapters | 7 cases | 5 cases |
| Fall 2026 | In production | 11 chapters (field-drift updates) | TBD | TBD |

What changes between editions:

- **Theory spine:** stable frame unchanged; current-state sections receive field-drift patches (updated protocols, models, tools).
- **Case layer:** each edition's cases belong to that cohort. Prior editions remain in catalog as their own products.
- **Releases:** each edition requires new signed releases from its contributing authors.

---

## Contributing

### Students (cohort)

Cases are contributed through the course. See "For contributors" above for the full specification.

### External contributors

The book is deliberately cohort-produced. We do not accept unsolicited case submissions from outside the course, because the editorial gate assumes a calibrated cohort working under shared instruction and review. We welcome other contributions:

- **Errata.** Open an issue with the `errata` label for any factual error, broken link, or outdated reference.
- **Suggestions for the theory spine.** Open an issue with the `theory-feedback` label. Substantive arguments that the frame is wrong somewhere may influence the next edition.
- **Suggestions for future cases.** Open an issue with the `case-target` label. If you know of a deployed system or a documented phenomenon that would teach well in a future edition, we want the pointer. We will not assign you to write it — cases are written by students in the course — but good pointers from the field become recruitment targets for future cohorts.
- **Instructor adaptations.** If you are teaching from this book, open a discussion under the `faculty` category.

### What we will not accept

- Pull requests that modify chapters from prior editions. Editions are snapshots.
- Pull requests that add unsolicited cases.
- Pull requests that fix "tone" or "style" in theory chapters. Editorial voice is the editor's call.
- Pull requests generated by automated tools without human review.

---

## Licensing

**Code samples** in this repository (inline code blocks in chapters, any scripts under `code/`) are licensed MIT.

**Prose — theory-spine chapters, preface, back matter — is Copyright © 2026 Bear Brown LLC.** Individual case chapters are Copyright © 2026 by their named student authors, licensed non-exclusively to Bear Brown LLC for inclusion in the Spring 2026 Edition.

If you want to use a chapter in a course you teach, email [bear@bearbrown.co](mailto:bear@bearbrown.co). Classroom use of theory-spine chapters is generally granted freely with attribution; case chapters also require attribution to the student author.

If you want to quote from a case chapter in academic work, cite the student author. Their byline is their publication credit.

---

## About the editor

Nik Bear Brown, PhD (熊教授 Xióng jiàoshòu) is an Associate Teaching Professor in the College of Engineering at Northeastern University. He writes on [Substack](https://bearbrownco.substack.com/), teaches AI courses on [YouTube](https://www.youtube.com/@NikBearBrown), makes music, and runs a nonprofit. Books and publications at [bearbrown.co/books](https://www.bearbrown.co/books).

Contact: [bear@bearbrown.co](mailto:bear@bearbrown.co)

---

## About the publisher

Bear Brown LLC is a Wyoming limited liability company. Principal address: 30 N Gould St Ste N, Sheridan, WY 82801. EIN: 41-4226710.

Bear Brown LLC's publications include *How to Speak Bot: Prompt Patterns*, *Flux Prompt Patterns*, *Computational Skepticism and AI Fluency*, the [Bear Brown Co Substack](https://bearbrownco.substack.com/), [Skepticism AI](https://www.skepticism.ai/), [Theorist AI](https://www.theorist.ai/), [Hypothetical AI](https://www.hypothetical.ai/), and [Musinique](https://www.musinique.net/).

---

## Acknowledgments

The student contributors whose cases appear in the current edition are named in the book's front matter and hold individual authorship of their chapters. Their work is the reason the book exists in its current form.

The cohort-produced handbook model is structurally novel enough that it will evolve over the first several editions. If you are teaching a course where this model might apply — a field that moves faster than static textbooks can track, students with access to real deployed systems, an instructor willing to run an editorial gate each semester — the production workflow in `ta-workflow/` is reusable. Use it, adapt it, and let us know what you learn.

---

*Spring 2026*

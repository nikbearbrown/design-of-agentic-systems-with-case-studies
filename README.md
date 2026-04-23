# Design of Agentic Systems with Case Studies

**A living Kindle handbook of agentic system case studies, produced by a graduate cohort each semester, framed by a short theory spine, read non-sequentially by engineers looking for patterns relevant to their own work.**

Editor: Nik Bear Brown
Current edition: Spring 2026
Next edition: Fall 2026
Book website: *[add URL]*
Kindle edition: *[add Amazon link]*

---

## What this is

This repository is the working home of *Design of Agentic Systems with Case Studies*. It contains the book's source material, the editorial infrastructure that gates case-study publication, the theory-spine chapters, and the cohort production workflow.

The book is a handbook for engineers evaluating whether an agentic architecture is the right answer for a given problem, and beginning the design if it is. It ships on Kindle each semester as a snapshot edition. The theory spine is stable across editions with field-drift updates; the case layer is produced by that semester's graduate cohort and belongs to that edition.

The structural bet: engineers learn design from reading documented real deployments, not from constructing toy examples. The case layer is load-bearing, not decorative. Every case in the book passed an editorial gate that rejects more submissions than it accepts.

---

## For readers

You can read the book on Kindle. If you want to read or cite source material, this repository has chapter drafts under `chapters/`, by edition.

**How to read the book:**

- **Evaluating whether to build agentic:** Chapters 1, 9, and 11, plus two or three system cases in domains close to yours.
- **Designing an agentic system:** theory spine Chapters 1–11 in order, with each paired case read alongside its theory chapter.
- **Debugging a specific failure:** start with the pattern cases (hallucination, context collapse, cascade failure, attack surface, cost blowout).
- **Adopting for a course:** an instructor supplement is planned for Fall 2026. Open a discussion in Issues if you are teaching from the Spring 2026 edition and need materials sooner.

**How to cite:** cite the specific edition. The case layer differs between editions; a citation without an edition is ambiguous. Individual case chapters carry student bylines and can be cited directly. Full citation guidance is in the book's back matter.

**How to report errors:** open an issue with the `errata` label. An errata page is maintained at *[add URL]* between editions. Corrections land in the next edition; we do not silently update shipped editions.

---

## For contributors (Northeastern cohort)

If you are a student in the course producing cases for the next edition, this section is your starting point.

### Before you start writing

Read these three documents first, in this order:

1. `docs/assignment-spec.md` — what you must produce to earn credit for the course assignment.
2. `docs/acceptance-standard.md` — what your case must meet to ship in the edition.
3. `docs/case-templates.md` — the seven-section system case template and the eight-section pattern case template, with word counts.

The assignment spec and the acceptance standard are different gates. You can earn a course grade on a case that does not ship in the edition. You cannot ship in the edition without meeting the acceptance standard. Both are public at assignment time so you know what you are aiming for.

### Case types

- **System case** — one named deployed system, one architecture, ~1,000–1,200 words, seven sections. Reader navigates here asking *how did someone build this*.
- **Pattern case** — one named phenomenon across three or more documented incidents, ~1,000–1,300 words, eight sections. Reader navigates here asking *what does this failure look like in the wild*.

Pick your case type before you start writing. The two templates are structurally different because the unit of study differs; a draft that mixes them is a draft that will not pass acceptance review.

### The workflow

```
Week 1–2     Assignment spec issued · case pipeline opens
Week 3–6     Case outline due · editor feedback · system-vs-pattern clarification
Week 7–10    First draft due · first editorial review
Week 11–13   Revision round · acceptance-standard decisions communicated
Week 14      Final submission · publication decisions finalized
Week 15+     Edition assembled · published students claim Amazon author pages
```

Submit drafts as pull requests to `chapters/<edition>/cases/`. Editorial review happens in PR comments. Acceptance decisions are logged as an issue comment with the checklist from `docs/editorial-review-checklist.md`.

### If your draft is not accepted

A draft that passes the assignment gate but not the acceptance gate earns your course credit and does not ship in the edition. This is a common outcome on first attempt and is not a judgment on you as a researcher. Specific failure modes (sources not primary, design choices not specific, no failure mode named, pattern instantiation unclear) are listed in the review. You can revise and resubmit for a future edition if you want to.

---

## For TAs

The `ta-workflow/` directory contains operational workflows for running the editorial pipeline.

- `ta-workflow/byline-reconciliation.md` — how to attach the right name to drafts that arrived without signed authorship. This is the most common blocker on the critical path for each edition and should happen before any unsigned drafts enter editorial review.
- `ta-workflow/editorial-review-checklist.md` — the pass/fail rubric used on every case draft. One per draft, kept with the case file permanently.
- `ta-workflow/open-questions-log.md` — the living tracker for editor decisions deferred to specific deadlines.

---

## Repository structure

```
design-of-agentic-systems/
├── README.md                        # this file
├── chapters/
│   ├── spring-2026/                 # snapshot for the Spring 2026 edition
│   │   ├── 00-preface.md
│   │   ├── theory-spine/            # Nik-authored chapters 1–11
│   │   │   ├── 01-problem.md
│   │   │   ├── 02-agent-basics.md
│   │   │   └── ...
│   │   ├── system-cases/            # student-authored, one file per case
│   │   │   ├── magid-newsroom-rag.md
│   │   │   ├── quandri-insurance.md
│   │   │   └── ...
│   │   ├── pattern-cases/           # student-authored, one file per case
│   │   │   ├── hallucination.md
│   │   │   ├── attack-surface.md
│   │   │   └── ...
│   │   └── back-matter/
│   │       ├── glossary.md
│   │       ├── pattern-index.md
│   │       ├── domain-index.md
│   │       └── contributor-bios.md
│   └── fall-2026/                   # next edition as it's produced
├── docs/
│   ├── assignment-spec.md           # for students — what to produce for credit
│   ├── acceptance-standard.md       # for students — what ships in the edition
│   ├── case-templates.md            # the two templates with word counts
│   ├── three-layer-structure.md     # how theory spine, system cases, and pattern cases compose
│   └── editorial-decisions/         # a log of "why this case was cut" for transparency
├── ta-workflow/
│   ├── byline-reconciliation.md
│   ├── editorial-review-checklist.md
│   └── open-questions-log.md
├── errata/
│   ├── spring-2026.md               # tracked corrections for current edition
│   └── ...
└── LICENSE                          # see Licensing below
```

---

## Editions

Each edition is a snapshot. Once shipped, editions are not retroactively changed; corrections land in the next edition and in the errata page.

| Edition | Status | Theory spine | System cases | Pattern cases |
|---|---|---:|---:|---:|
| Spring 2026 | Current | 11 chapters | 7 cases | 5 cases |
| Fall 2026 | In production | 11 chapters (field-drift updates) | TBD | TBD |

What changes between editions:

- **Theory spine:** stable frame unchanged; current-state sections receive field-drift patches (updated protocols, models, tools). A reader comparing Spring 2026 Ch. 4 (Tool Use) against Fall 2026 Ch. 4 should see the same pattern, the same trade-offs, and a different current-state section.
- **Case layer:** each edition's cases belong to that cohort. Prior editions remain in catalog as their own products. This is a deliberate design choice; a reader who wants a specific case buys the edition it shipped in.

---

## Contributing

### Students (cohort)

Cases are contributed through the course. If you are not in the course and want to contribute a case, see *External contributors* below.

### External contributors

The book is deliberately cohort-produced. We do not accept unsolicited case submissions from outside the course, because the editorial gate assumes a calibrated cohort working under shared instruction and review. We welcome other contributions:

- **Errata:** open an issue with the `errata` label for any factual error, broken link, or outdated reference.
- **Suggestions for the theory spine:** open an issue with the `theory-feedback` label. Substantive arguments that the frame is wrong somewhere are genuinely valuable and may influence the next edition.
- **Suggestions for future cases:** open an issue with the `case-target` label. If you know of a deployed system or a documented phenomenon that would teach well in a future edition, we want the pointer. We will not assign you to write it — cases are written by students in the course — but good pointers from the field become recruitment targets for future cohorts.
- **Instructor adaptations:** if you are teaching from this book, open a discussion under the `faculty` category. We are interested in what works and what doesn't.

### What we will not accept

- Pull requests that modify case chapters from prior editions. Editions are snapshots.
- Pull requests that add unsolicited cases. Case slots are for enrolled students.
- Pull requests that fix "tone" or "style" in theory chapters. Editorial voice is the editor's call.
- Pull requests generated by automated tools without human review.

Corrections, link fixes, typo catches, and factual errata are welcome via issues — and are often the most useful contributions from outside the cohort.

---

## Licensing

**Code samples** in this repository (anything under `code/`, plus inline code blocks in chapters) are licensed MIT.

**Prose** — theory-spine chapters, preface, back matter — is Copyright © 2026 Nik Bear Brown. Individual case chapters are Copyright © 2026 by their named student authors, used with permission. All prose is available in the Kindle edition for personal use; redistribution requires permission.

If you want to use a chapter in a course you teach, email *[add email]*. Classroom use is generally granted freely with attribution; we just want to know.

If you want to quote from a case chapter in academic work, cite the student author. Their byline is their publication credit.

---

## About the editor

Nik Bear Brown teaches at Northeastern University. *[Add bio in the register you prefer; the preface handles the personal voice, the README can be short.]*

Contact: *[add email]*
Course: *[add course URL]*
Personal site / other books: *[add as relevant]*

---

## Acknowledgments

This book is produced with the students of the graduate cohort that writes each edition. The students whose cases appear in the current edition are named in the book's front matter and hold individual authorship of their chapters. Their work is the reason the book exists in its current form.

The cohort-produced handbook model is structurally novel enough that it will evolve over the first several editions. If you are teaching a course where this model might apply — a field that moves faster than static textbooks can track, students with access to real deployed systems, an instructor willing to run an editorial gate each semester — the production workflow in `docs/` and `ta-workflow/` is reusable. The production model is not protected; use it, adapt it, and let us know what you learn.

---

*Spring 2026*

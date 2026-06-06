# Appendix C — The Book Scaffold Script (`new_book.py`)

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


*What `new_book.py` does and how to run it.*

---

This is the script behind Chapter 5 (*Book Scaffold*). Unlike the prompt appendices, a script is run, not pasted — and code ages faster than prose, so what follows is a usage reference. The script itself lives in the book repository at `pantry/new_book.py` (in a working setup it sits wherever you keep your tools, e.g. `~/tools/new_book.py`).

**Runs in:** a terminal (Python 3) — not Cowork or Codex; it is a script you execute.

**Dependencies:** none required. *Optional:* a `TIKTOC.md` to scaffold from (`--tiktoc TIKTOC.md`).

**Produces:** a complete book directory — planning files, `chapters/` stubs, `pantry/`, `images/`, `d3/`, `SCRIPTS/`.

---


## What it does

`new_book.py` reads nothing and asks nothing beyond its arguments. It creates a complete, empty book directory — the structural commitment your `TIKTOC.md` describes, turned into folders and stub files. Its whole purpose is to make the spec's vagueness visible: if the scaffold has a blank where a capability statement should be, the spec was blank there too.

## How to run it

```
python new_book.py "My Book Title" "Author Name"
python new_book.py "My Book Title" "Author Name" --subtitle "The Evidence Problem" --volume 1 --chapters 14
python new_book.py "My Book Title" "Author Name" --dir ~/textbooks/books
python new_book.py "My Book Title" "Author Name" --publisher "My Press"
```

**Arguments and flags:**

- `title` (required) — the working book title.
- `author` (required) — author name.
- `--subtitle` — optional subtitle.
- `--volume` — volume number for a series.
- `--chapters N` — number of chapter stubs to create.
- `--dir` — parent directory for the new book folder (defaults to the current directory).
- `--publisher` — publisher name for the copyright page.

## What it produces

```
book.md                 ← book description + high-level outline (planning)
outline.md              ← starter table of contents (planning)
vision.md               ← Tic TOC Phase 1: vision and positioning
architecture.md         ← Tic TOC Phase 2: learning architecture
chapters-spec.md        ← Tic TOC Phase 3: chapter specifications
risks.md                ← Tic TOC Phase 4: scope, market, risks
chapters/
    00-frontmatter.md   ← copyright, dedication, preface
    01-introduction.md  ← introduction
    02-chapter-01.md … NN-chapter-XX.md
    99-back-matter.md   ← acknowledgments, about the author, notes, references
pantry/                 ← fragments, snippets, research notes
images/                 ← figures as PNG (the book uses these)
d3/                     ← interactive D3 HTML versions
SCRIPTS/
```

The `vision.md`, `architecture.md`, `chapters-spec.md`, and `risks.md` files map one-to-one onto the four Tic TOC phases — the scaffold is the spec made into a directory. If those files come out thin, the spec was thin, and the fix is in Tic TOC (Appendix A), not here.

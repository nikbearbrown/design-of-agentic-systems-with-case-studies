Look at TIKTOK.md and research any missing chapters 

# Cowork Prompt: Chapter Research Gatherer

---

## ROLE & CONTEXT

You are a research assistant for a textbook project. Your job is to:

1. Read `TIKTOC.md` from the book directory to get the chapter list
2. For each chapter, do deep web research to gather material needed to write that chapter
3. Save all gathered material as notes files in `pantry/`
4. Scan a shared markdown library for any related material and copy relevant files to `pantry/`

This prompt is generic — it works for any book directory that contains a `TIKTOC.md` file.

---

## STEP 0 — LOCATE THE BOOK

Determine `BOOK_DIR`:

- If a directory was passed as an argument or is otherwise specified, use it.
- Otherwise, look for `TIKTOC.md` in the current working directory. If found, that directory is `BOOK_DIR`.
- If `TIKTOC.md` is not found in the current directory, search one level up and in sibling directories.
- If `TIKTOC.md` cannot be located, report the directories searched and stop. Do not proceed without it.

Confirm `BOOK_DIR` before continuing.

---

## STEP 1 — READ TIKTOC.md

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

## STEP 2 — SCAN THE SHARED MARKDOWN LIBRARY

Before doing any web research, scan the shared library for material that may already exist.

**Library path:** `/Users/bear/Documents/CoWork/bear-textbooks/MD`

For each file in the library (recursively, all `.md` files):

1. Read the filename and first 50 lines
2. Score relevance to the book based on:
   - Overlap with the book's subject (inferred from TIKTOC.md title and chapter titles)
   - Overlap with any specific chapter's core concepts
   - Presence of key terms from TIKTOC.md

**Relevance threshold:** Copy any file scoring as "relevant" or "possibly relevant" to `BOOK_DIR/pantry/`. Prefix copied files with `_lib_` to indicate they came from the library, preserving the original filename.

Example: `/Users/bear/Documents/CoWork/bear-textbooks/MD/causal-dags-intro.md` → `BOOK_DIR/pantry/_lib_causal-dags-intro.md`

**Do not copy:**
- Files that are clearly about an unrelated subject
- Duplicate content already in `pantry/`
- System files, build artifacts, or non-content files

**After the scan, report:**

```
Library scan complete: /Users/bear/Documents/CoWork/bear-textbooks/MD
  Files scanned: N
  Files copied to pantry/: N
    - _lib_filename-1.md  (relevant to: Chapter 3, Chapter 7)
    - _lib_filename-2.md  (relevant to: Chapter 5)
  Files skipped: N (unrelated subject)
```

If the library path does not exist or is empty, note this and continue.

---

## STEP 3 — DEEP RESEARCH PER CHAPTER

For each chapter in the extracted list, perform deep research and save notes to `BOOK_DIR/pantry/{notes_filename}`.

Process chapters in numerical order.

### Research scope for each chapter

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

### Research execution

For each chapter:

1. Formulate 3–5 targeted web search queries based on the chapter's core concepts
2. Execute searches and fetch the most authoritative results
3. Synthesize findings into structured notes — do not dump raw search output
4. Cross-reference with any library files already copied to pantry that are relevant to this chapter

**Quality bar:** Notes must be substantive enough for a chapter author to sit down and write without needing to do their own background research. Every factual claim in the notes must have a source or be flagged as common knowledge.

---

## STEP 4 — NOTES FILE FORMAT

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

## STEP 5 — UPDATE PANTRY INDEX

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

## STEP 6 — FINAL REPORT

Print a summary:

```
Research Gatherer — Complete
════════════════════════════════════════

Book directory : BOOK_DIR
TIKTOC.md      : found, N chapters extracted

Library scan
  Path         : /Users/bear/Documents/CoWork/bear-textbooks/MD
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

## BEHAVIORAL RULES

- **Never write chapter prose.** This prompt gathers material only. Chapter drafting is a separate step.
- **Never fabricate sources.** If a reference cannot be found or verified, flag it as unverified rather than inventing a citation.
- **Synthesize, don't dump.** Notes should be digested, not raw search results pasted wholesale.
- **One notes file per chapter, no exceptions.** Even if a chapter is thin in TIKTOC.md, create the notes file and note what couldn't be found.
- **Preserve existing pantry contents.** Copy and create; never delete.
- **Flag, don't skip.** If research for a chapter is incomplete or a concept is contested, write what was found and add a FLAG entry in section G.
- **Chapter order matters.** Process chapters in numerical order so connections to adjacent chapters are visible by the time later chapters are researched.

---

## NOTES FOR ADAPTING TO OTHER LLMs

- **ChatGPT / Gemini:** Works as-is. File operations via Code Interpreter or equivalent.
- **Claude Code:** Preferred for this prompt — file read/write is native. Run from `BOOK_DIR` for automatic path resolution.
- **Cowork:** The file operations (scan library, copy files, write pantry) map directly to Cowork's file tools. Ensure the shared library path `/Users/bear/Documents/CoWork/bear-textbooks/MD` is accessible from the Cowork environment.

do a TIKTOC-driven write or rewrite


if 97-fundamenta-themes.md  exists in chapters use those themes were appropriate through writing the chapters

after writing is done update  97-fundamenta-themes.md  to an appendix chapter  97-fundamental-themes.md 


If there is not TIKTOC.md and chapters written in chapters then build a TIKTOC.md from that

# Cowork or Codex  Prompt: Chapter Writer

---

## ROLE & CONTEXT

You are a chapter author for a textbook project. Your job is to:

1. Read `TIKTOC.md` from the book directory to get the chapter list and learning outcomes
2. Read `book.md` (or `BOOK.md`) for voice, audience, scope, and hard rules
3. Inspect `pantry/` for research notes and library files gathered by the Research Gatherer
4. Write every chapter that does not yet have a corresponding file in `chapters/`
5. Save each draft to `chapters/` and log the run

This prompt is generic — it works for any book directory that contains a `TIKTOC.md` and a populated `pantry/`.

---

## STEP 0 — LOCATE THE BOOK

Determine `BOOK_DIR`:

- If a directory was passed as an argument or is otherwise specified, use it.
- Otherwise, look for `TIKTOC.md` in the current working directory. If found, that directory is `BOOK_DIR`.
- If `TIKTOC.md` is not found in the current directory, search one level up and in sibling directories.
- If `TIKTOC.md` cannot be located, report the directories searched and stop. Do not proceed without it.

Confirm `BOOK_DIR` before continuing.

---

## STEP 1 — READ BOOK.md

Read `BOOK_DIR/book.md` (or `BOOK_DIR/BOOK.md`) in full before reading any chapter material.

Extract and hold in working memory for the entire run:

| Field | Description |
|-------|-------------|
| `audience` | Who the reader is; what they already know; what misconceptions they carry |
| `voice` | Tone, register, sentence style, what the book sounds like |
| `scope_in` | What this book covers |
| `scope_out` | What is explicitly excluded; where to send the reader instead |
| `hard_rules` | Non-negotiable authoring constraints (sourcing, jargon policy, notation, etc.) |
| `series_context` | If the book belongs to a series, what adjacent books cover |

If `book.md` does not exist, search for `README.md`, `overview.md`, or `ABOUT.md` in `BOOK_DIR`. Use the first found. If none found, proceed with TIKTOC.md as the only source of scope and flag the absence in the final report.

---

## STEP 2 — READ TIKTOC.md

Read `BOOK_DIR/TIKTOC.md` in full.

Extract the chapter list using the same rules as the Research Gatherer:

| Field | Description |
|-------|-------------|
| `chapter_number` | Integer (e.g., `3`) |
| `chapter_slug` | Kebab-case filename slug (e.g., `the-map-before-the-territory`) |
| `chapter_title` | Human-readable title |
| `chapter_description` | Any one-line summary or description in TIKTOC.md |
| `core_concepts` | Concepts, learning outcomes, or topics listed for this chapter |
| `chapter_filename` | Derived: `NN-slug.md` where `NN` is zero-padded chapter number |

**Filename derivation rules:**
- Zero-pad chapter number to 2 digits: chapter 3 → `03`
- Slugify the title: lowercase, spaces to hyphens, strip punctuation
- Chapter filename: `{NN}-{slug}.md`
- Example: Chapter 3 "The Map Before the Territory" → `03-the-map-before-the-territory.md`

---

## STEP 3 — AUDIT CHAPTERS/ AND PANTRY/

### 3A — Chapters already written

List all `.md` files currently in `BOOK_DIR/chapters/`.

For each chapter in the TIKTOC list, check whether a corresponding chapter file already exists. A match is any file whose name contains the chapter number (e.g., `03`) or whose slug closely matches.

Mark each chapter as:
- `TO WRITE` — no file found in `chapters/`
- `EXISTS` — a file was found; skip unless `--force` was passed

**After auditing, print the work queue:**

```
Chapter writing queue:

  TO WRITE  03 | the-map-before-the-territory
  EXISTS    04 | the-identification-layer        (skipping)
  TO WRITE  05 | confounders-the-variable-you-forgot
  ...

Chapters to write: N
Chapters to skip : N
Proceeding.
```

### 3B — Pantry inventory

List all files in `BOOK_DIR/pantry/`. For each chapter in the TO WRITE queue, identify:

- `{NN}-{slug}_notes.md` — the Research Gatherer notes file for this chapter (primary pantry source)
- Any `_lib_*` files flagged as relevant to this chapter in `pantry/README.md`
- Any other pantry files whose name or content suggests relevance (grep by chapter slug and key terms)

Hold this mapping for use during drafting. A chapter with no notes file in pantry can still be written — but flag it in the final report as a thin-pantry chapter.

---

## STEP 4 — WRITE EACH CHAPTER

Process chapters in numerical order. For each `TO WRITE` chapter:

### 4A — Gather materials

1. Read the chapter's entry in TIKTOC.md (description, learning outcomes, core concepts, bridge question, assessment type).
2. Read `pantry/{NN}-{slug}_notes.md` if it exists.
3. Read any `_lib_*` files flagged as relevant to this chapter.
4. Hold `book.md` voice and hard rules in working memory throughout.

### 4B — Draft the chapter

Every chapter must follow the **chapter anatomy** defined in `book.md`. If `book.md` does not specify a chapter anatomy, use the default eight-section structure below.

**Default eight-section structure:**

```
1. Learning objectives
   Bloom's level explicit. List 3–6 outcomes.
   Match exactly what TIKTOC.md specifies for this chapter.

2. Opening case
   A real or realistically grounded situation.
   The concept's failure mode — not a textbook example.
   No definitions yet. The reader should need the concept before it arrives.

3. Core concept explanation
   Plain language first. Formal definition second.
   Every technical term defined at first use.
   No jargon used before it is taught.

4. Worked example
   Situation → Analytical process (including dead ends) → Resolution.
   Show the work: derivations, calculations, pseudo-code, or mechanism
   diagrams on the page — not in an appendix.
   End with: The lesson (one sentence). The limit (where this approach fails).

5. Common misconceptions
   State each misconception as a plausible claim.
   Explain precisely why it fails.
   Refer back to the opening case where the misconception would have caused harm.

6. Exercises
   Minimum 3. At least one at Apply or above (Bloom's).
   At least one exercise requiring the reader to produce something, not just identify.

7. What would change my mind
   One paragraph. Name a specific empirical finding, experimental result,
   or argument that would require revising the central claim of this chapter.
   This section applies the chapter's method to itself.

8. Still puzzling
   2–4 open questions this chapter raises but does not resolve.
   Honest about the limits of current knowledge.
   Plant seeds for later chapters where appropriate.
```

Additional sections required if specified in `book.md` (e.g., three-representation displays, AI Use Disclosures, LLM exercises, AI Wayback Machine entries, bridge questions, further reading). Write them as specified.

### 4C — Source and citation rules

- Every contestable factual claim must have an inline citation or a `[verify]` flag.
- Sources drawn from pantry notes files are acceptable. Cite the original source the notes file names, not the notes file itself.
- No fabricated sources, quotes, statistics, or citations. Use `[verify]` if certainty is not available.
- Aggregators (Wikipedia, review articles without primary data) are context, not citations.
- Flag any claim marked as contested in the pantry notes file with `[contested — see pantry flag]` inline.

### 4D — Voice rules

Apply the voice established in `book.md` throughout:

- If `book.md` specifies a named voice (e.g., "Feynman," "direct workshop," "narrative-explanatory"), apply its conventions.
- Strip jargon or teach it. First use of a technical term defines it.
- Calibrated uncertainty over false confidence. "The evidence does not yet distinguish X from Y" is stronger than a forced verdict.
- Show the work. Do not gesture at mechanisms; trace them.

### 4E — Save the draft

Save the completed chapter to:

```
BOOK_DIR/chapters/{NN}-{slug}.md
```

Use today's date if the chapter anatomy specifies a datestamp prefix. Otherwise use the number-slug format only.

For path-fork chapters (chapters where TIKTOC.md specifies two variants, e.g., "Version A: personal brand / Version B: startup brand"), produce two files:

```
BOOK_DIR/chapters/{NN}-PATHA-{slug}.md
BOOK_DIR/chapters/{NN}-PATHB-{slug}.md
```

---

## STEP 5 — LOG THE RUN

After all chapters are written, create or append to `BOOK_DIR/logs/log.csv`.

Create the file if it does not exist. Columns:

```
date, book, chapter_slug, word_count, sources_count, verify_flag_count,
pantry_notes_found, pantry_lib_files_used, thin_pantry,
mechanism_explained, contested_claims_flagged
```

One row per chapter written in this run.

| Column | Value |
|--------|-------|
| `date` | ISO date (YYYY-MM-DD) |
| `book` | `BOOK_DIR` basename |
| `chapter_slug` | e.g., `03-the-map-before-the-territory` |
| `word_count` | Approximate word count of draft |
| `sources_count` | Number of distinct sources cited |
| `verify_flag_count` | Number of `[verify]` flags in draft |
| `pantry_notes_found` | `yes` / `no` |
| `pantry_lib_files_used` | Count of `_lib_*` files incorporated |
| `thin_pantry` | `yes` if notes file was absent or < 500 words |
| `mechanism_explained` | One sentence naming the mechanism the chapter deep-dived |
| `contested_claims_flagged` | Count of `[contested]` flags |

---

## STEP 6 — FINAL REPORT

Print a summary after all chapters are processed:

```
Chapter Writer — Complete
════════════════════════════════════════

Book directory  : BOOK_DIR
TIKTOC.md       : found, N chapters total
book.md         : found [or: NOT FOUND — voice inferred from TIKTOC.md]

Chapters written this run
  03-the-map-before-the-territory.md     ✓  ~2,400 words  4 sources  0 [verify]
  05-confounders.md                      ✓  ~2,100 words  6 sources  2 [verify]
  ...

Chapters skipped (already existed)
  04-the-identification-layer.md

Blockers (chapters left unwritten)
  07-colliders-part-1.md — BLOCKED: [reason]

Thin-pantry chapters (no notes file; drafted from TIKTOC.md + web knowledge only)
  08-colliders-part-2.md — flag for editorial review

[verify] flags requiring author attention
  Chapter 05: claim about X — source not located in pantry
  Chapter 09: statistic on Y — [verify]

Contested claims flagged
  Chapter 06: [claim] — see pantry flag for sources in dispute

Open questions surfaced during drafting
  - [Question that should be added to book.md]

Mechanism summary (one sentence per chapter)
  03: [mechanism the chapter deep-dived]
  05: [mechanism]
  ...

Log written to: BOOK_DIR/logs/log.csv
Next step: author review of chapters/ before any content leaves that directory.
```

---

## BEHAVIORAL RULES

- **Never publish.** All output goes to `chapters/`. Nothing moves elsewhere without author approval.
- **Never fabricate.** No invented sources, statistics, quotes, or citations. Use `[verify]` for anything uncertain.
- **Never skip the anatomy.** A chapter missing the "What would change my mind" or "Still puzzling" sections is incomplete. Do not log it as written.
- **Thin pantry is not a blocker.** If no notes file exists for a chapter, write from TIKTOC.md and `book.md` and flag it as thin-pantry in the log and report.
- **Genuine blockers stop only that chapter.** If a chapter cannot be written (concept not pinned down in TIKTOC.md, no primary sources exist for a contestable claim, domain expertise gap that would require fabrication), log it as BLOCKED, leave it unwritten, and continue with the next chapter.
- **Scope_out is a hard constraint.** If TIKTOC.md or `book.md` explicitly excludes a topic, do not include it in any chapter, even if the pantry notes contain material on it.
- **Voice holds across all chapters.** Do not drift. Re-read the `book.md` voice section before each chapter if needed.
- **Preserve existing chapters.** Never overwrite a file in `chapters/` unless `--force` was explicitly passed.
- **One file per chapter, no exceptions.** Even a thin draft is better than a missing file. Write what can be written and mark gaps with `[verify]` or `[gap — needs domain expert]`.

---

## PATH FORK HANDLING

If TIKTOC.md marks a chapter as having two variants (e.g., "personal brand path" vs. "startup brand path," or "Part A" vs. "Part B"), produce both drafts in the same run:

- `{NN}-PATHA-{slug}.md` and `{NN}-PATHB-{slug}.md`
- Both logged separately in `log.csv`
- Both reported in the final summary
- If TIKTOC.md does not specify path names, use `PATHA` and `PATHB`

---

## NOTES FOR ADAPTING TO OTHER LLMs

- **Claude Code:** Preferred — file read/write is native. Run from `BOOK_DIR` for automatic path resolution.
- **Cowork or Codex :** File tools map directly to the read/write operations in Steps 3–5. Ensure `BOOK_DIR` and `pantry/` are accessible from the Cowork or Codex  environment.
- **ChatGPT / Gemini:** Works via Code Interpreter. File operations may require explicit upload/download steps.
- **Voice plugins:** If your environment supports named voice plugins (e.g., `feynman`, `fry`, `emma`), invoke the relevant plugin before Step 4B. The prompt as written is voice-plugin-agnostic; `book.md` carries the voice specification.
- **Chapter anatomy override:** If `book.md` defines a chapter anatomy that differs from the default eight-section structure, that definition takes precedence in full. The default structure is a fallback only.
- **Re-runs are safe.** The Step 3A audit skips chapters already in `chapters/`. Re-running after resolving blockers will only write the chapters that were previously skipped or blocked.

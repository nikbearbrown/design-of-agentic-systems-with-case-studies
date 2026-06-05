Scan the directory /Users/bear/Documents/CoWork/bear-textbooks/books. For each subdirectory (each subdirectory is a book), do the following:

STEP 1 — QUALIFY THE BOOK
Count the .md files in the book's chapters/ subdirectory. If there are fewer than 10, skip this book entirely and move on. Only proceed with books that have 10 or more chapter files in chapters/.

STEP 2 — READ THE CHAPTERS
For each qualifying book, read all .md files in its chapters/ directory. You will need this content to populate or audit the README.

STEP 3 — ASSESS THE README
Check whether a README.md exists at the book's root (e.g. books/some-book/README.md).

If README.md does NOT exist: write one from scratch using the full template below.
If README.md DOES exist: read it, identify which sections from the template are missing or empty, and add only the missing sections. Do not rewrite sections that are already present.

STEP 4 — WRITE OR UPDATE THE README
Use this template. Every [bracketed instruction] must be populated from the actual chapter files — do not invent content. If a section cannot be populated (e.g. no LLM Exercise blocks exist in any chapter), insert a one-line placeholder: <!-- TODO: populate from chapter content -->

---
TEMPLATE BEGIN
---

# [Book Title]

**[Author Name]** · [Publisher] · [Year]
**Series:** [Series name if present, otherwise omit this line]

> *[One-sentence description drawn from the preface or introduction.]*

---

## What This Book Is

[2–3 paragraphs drawn from the introduction or preface describing the core argument and what makes this book different.]

## Who This Book Is For

[1–2 paragraphs on audience and prerequisites, drawn from the front matter.]

## How to Read It

[1–2 paragraphs on reading order and approach, drawn from the front matter.]

---

## Table of Contents

[Build this section dynamically from the actual files present in chapters/. Group into acts or parts if the book uses them; otherwise list chapters sequentially. Each row links to its file using a relative path. Use this format:]

| Chapter | Title | File |
|---------|-------|------|
| [n] | [Title from file heading] | [chapters/filename.md](chapters/filename.md) |

---

## Signature Simulations

[If the book contains simulation or LLM Exercise blocks, build a table with three columns: Chapter, Topic, Simulation Description. Pull from the actual content of each chapter file. If no simulation blocks exist anywhere, insert the TODO placeholder.]

| Chapter | Topic | Simulation |
|---------|-------|------------|

---

## The +1 Layer

[If a how-to-use-the-simulations chapter or equivalent exists, write 1 paragraph explaining the LLM Exercise pattern drawn from that file. If no such chapter exists, omit this section entirely.]

---

## Companion Resources

[List any companion texts, platforms, or URLs mentioned in the front matter or chapters. If none, omit this section.]

---

## About the Author

[Draw from the front matter or about-the-author section. If not present in any file, omit this section.]

---

## Copyright

[Draw from the front matter or copyright page. If not present, insert: Copyright © [Year] [Author]. All rights reserved. See LICENSE.md for full terms.]

---

*[Closing tagline drawn from the book, or omit if none exists.]*

---
TEMPLATE END
---

RULES:
- Process all qualifying books in a single pass. Do not stop and ask for confirmation between books.
- Write or update each README.md in place at the book's root directory.
- When updating an existing README, append missing sections at the end, before any existing closing tagline. Preserve all existing content exactly.
- Use actual content from chapter files. Never invent titles, descriptions, or metadata.
- Output clean markdown that renders correctly on GitHub.
- After finishing all books, print a summary table:

| Book Directory | Chapters Found | README Action |
|----------------|---------------|---------------|
| [dir name] | [n] | Created / Updated (added: [section names]) / Skipped (< 10 chapters) |
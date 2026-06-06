Copy chapters from related-subject source folders into books/maths-plus-one/chapters/ in this workspace.

Workspace: /Users/bear/Documents/CoWork/bear-textbooks (books/ subdir)

Target: books/maths-plus-one/chapters/
Sources (each lives under books/):
  - prealgebra-bundle-with-llms
  - college-algebra-bundle-with-llms
  - calculus-bundle-with-llms
  - contemporary-mathematics-with-llms
  - introductory-statistics-bundle-with-llms
  - bayesian-probability-with-llms
  - causal-inference-with-case-studies
  - causal-reasoning

Rules:
- Copy, do not move. Sources stay intact.
- For each source, create one subfolder under the target's chapters/ named after the source (drop any "-bundle-with-llms", "-with-llms", "-with-ai", "-bundle", "-with-case-studies" suffix to keep names short). Example: prealgebra-bundle-with-llms -> chapters/prealgebra/
- Inside that subfolder, mirror the source's chapters/ contents recursively (preserve nested subdirs and original filenames).
- Leave the target's existing top-level stub files alone (00-frontmatter.md, 01-introduction.md, 02-chapter-01.md, 03-chapter-02.md, 04-chapter-03.md, 99-back-matter.md). Do not touch them.
- If a per-source subfolder already exists from a prior run, refresh its contents (overwrite files, don't delete the dir).
- Skip a source silently if it has no chapters/ subdir.

When done, print a table: source -> subfolder name -> .md file count, plus the final total .md count under books/maths-plus-one/chapters/.
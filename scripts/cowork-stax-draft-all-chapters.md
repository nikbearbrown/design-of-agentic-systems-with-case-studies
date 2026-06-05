
```
Walk the outline for the book at books/branding-and-ai and produce rough drafts of every chapter currently marked `to write`, sequentially, one chapter at a time. Treat this as a long-running task — keep going until every chapter is drafted or until you hit a blocker that genuinely needs me. Do not stop after one chapter.

Use the feynman voice plugin (the workshop default). For each chapter, follow this loop:

1. Read books/branding-and-ai/outline.md. Find the lowest-numbered chapter still marked `to write`. Read its full scope, position-in-arc, case pairing, and learning outcomes.

2. Read books/branding-and-ai/book.md before drafting (audience, scope, voice notes, hard rules, authoring instructions). Read style/ and books/branding-and-ai/style/ for voice ground truth.

3. Mine the pantry before drafting:
   - Open books/branding-and-ai/pantry/INDEX.md to find the modules, pages, assignments, and framework directories relevant to this chapter's concept.
   - Grep pantry/ for the chapter's key terms (grep -rli) to surface anything not in INDEX.md.
   - Pantry is reference, not citation. Pantry surfaces framings and examples; chapter claims still cite primary sources from the open literature. If pantry includes a framework repo (the "is the topic" pantry), framework source files ARE citable when the chapter's subject is the framework itself.

4. Web search for primary sources per the research protocol in CLAUDE.md §11. Five to ten primary sources minimum: papers, model cards, agency filings, blog posts, datasets. No aggregators as primary, no Wikipedia as primary.

5. Invoke the chapter skill (the /chapter pathway via the feynman voice plugin) to produce the draft. The skill's eight-section format, four-move method, embedded exercises, and bottom-of-chapter "what would change my mind" + "still puzzling" all apply.

6. Save the draft to books/branding-and-ai/chapters/YYYY-MM-DD-chapter-NN-slug.md (use today's date and pad chapter numbers to two digits — chapter-01, chapter-02, etc. — so they sort correctly).

7. Update outline.md: change the chapter's status from `to write` to `drafted`.

8. Log the run to books/branding-and-ai/logs/log.csv (create if missing). Columns: date, book, chapter_slug, command, word_count, sources_count, mechanism_explained, concept_specified, voice_plugin, pantry_hit_count.

9. Move to the next `to write` chapter.

Path-fork chapters: when a chapter has a path fork in outline.md (e.g. personal brand vs. startup brand), produce two drafts in the same run, named ...chapter-NN-PATHA-slug.md and ...chapter-NN-PATHB-slug.md. Update outline.md to reflect both as `drafted`.

When every `to write` chapter has been drafted, stop and report:
- Table of chapters drafted: number, slug, word count, sources count, [verify] flag count, pantry hit count
- Chapters that hit blockers (missing primary source for a contestable claim, domain expertise gap, scope ambiguity in outline.md, pantry/source conflict)
- Chapters where pantry content was thin and the draft leaned heavily on outside sources (worth flagging for editorial review)
- Open questions surfaced during drafting that should be added to book.md
- Total runtime
- A single sentence per chapter naming the mechanism the chapter deep-dived

Hard rules from CLAUDE.md apply throughout:
- No fabricated sources, quotes, statistics, or citations. Use [verify] inline if certainty isn't available.
- Primary sources for every contestable claim. Aggregators are leads, not sources.
- Strip jargon or teach it; first use of a technical term defines it.
- Show the work — calculations, derivations, pseudo-code, mechanism diagrams on the page.
- The method applies to itself. Frameworks invoked must do work, not be cited for flavor.
- Calibrated uncertainty over false confidence. "The evidence does not yet distinguish X from Y" is stronger than a forced verdict.

Don't publish. Don't move drafts into lectures/. Don't touch lectures/ at all. The chapters/ folder is the human review gate; nothing leaves it without my approval.

If a chapter is genuinely unwritable (no primary sources exist for a contestable claim, the concept hasn't been pinned down enough in outline.md, or you'd have to invent material), STOP, flag the chapter in the report, leave its outline status as `to write`, and continue with the next chapter. Don't fake it.

Begin.
```

---

## Notes on use

- This prompt assumes book.md, outline.md, and pantry/INDEX.md are all in place. Run the new-book-intake prompt first if they aren't.
- If you want a different voice plugin (fry for narrative-explanatory, emma for source-faithful lecture-notes), replace `feynman` everywhere in the prompt with the plugin name.
- If you want only specific chapters drafted rather than every `to write` chapter, edit step 1 to "Find chapters [N, M, P]" instead of "lowest-numbered to write."
- The prompt explicitly authorizes long-running work. Claude will work for a while; that is expected. Don't interrupt unless the report at the end shows blockers worth addressing.
- The chapter skill's own scope is one chapter. This prompt orchestrates the skill across the full outline. Each chapter still gets the skill's eight-section format, four-move method, and embedded exercises.
- Path-fork chapters (e.g., Chapter 8 in Branding and AI) produce two drafts in one run. If you want them sequenced separately or split across runs, edit the path-fork section.
- Runs that produce blockers should be re-run after the blockers are resolved. The prompt skips chapters already marked `drafted`, so re-running is safe.

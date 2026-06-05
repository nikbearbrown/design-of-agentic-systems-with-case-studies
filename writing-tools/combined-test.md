# Appendix F — The Combined Test

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


*The fourteen-item checklist behind Chapter 8 — and the one chapter with no generator.*

---

Chapter 8 (*The Human Rewrite*) is the one stage of the pipeline with no prompt to paste. The rewrite is the human's work — it is the book's whole argument in miniature. What it has instead of a generator is a *checklist*: the Combined Test, applied in a twenty-minute sitting to each chapter before it ships.

This is the canonical list (it belongs in `_lib_combined-test.md` in the book repository; keep the two in sync). For the craft of the rewrite itself — scene versus summary, voice versus style, sentence combining, revision — see the companion volume **AI for Writing: A Practitioner's Guide**, the same way Chapter 9 points to *AI for Graphs* and *AI for Infographics* for figure depth.

Score each item Pass or Fail with one sentence of evidence: the sentence that earned the pass, or the absence that earned the fail. The three lowest-scoring items are your rewrite targets.

**Runs in:** your own read-through — no tool to run. *Optional:* keep the canonical list in `_lib_combined-test.md` so the other prompts can reference it.

**Dependencies:** the drafted chapter you are scoring.

---


## Group A — Voice and specificity

1. **Scene-first opening.** Does the chapter open inside a specific moment — a named person doing a named thing in a specified time and place? *Fail:* the first paragraph could be the abstract of an article on the topic.
2. **Domain-specific examples throughout.** Are at least 80% of examples from the book's actual target domain? *Fail:* examples drift into adjacent domains the book is not about.
3. **Author voice consistent.** Read the opening and closing aloud — do they sound like the same person? *Fail:* the closing has flattened toward magazine-article prose.
4. **No fabricated specificity.** Every percentage, quoted study, and named report traces to a primary source. *Fail:* at least one "studies show" with no traceable source.

## Group B — Structure

5. **Mechanism before terminology.** Concepts are explained from first principles before their disciplinary name arrives. *Fail:* the term arrives first and the reader holds an unfilled box.
6. **Named trade-offs.** At least one place where a choice's cost is acknowledged. *Fail:* the chapter recommends without admitting cost.
7. **No padded middle.** Every paragraph in pages two through four advances argument, delivers an example, or names a trade-off. *Fail:* the middle restates or connects without load.
8. **Bridge question that bridges.** The closing question is answered by the next chapter's spec. *Fail:* the question is decorative.

## Group C — Pedagogy

9. **Capability statement honored.** The chapter delivers what the `TIKTOC.md` capability statement promised. *Fail:* it describes the topic but does not enable the action.
10. **Bloom's level achieved.** The chapter operates at the cognitive level its objectives claim. *Fail:* it says Evaluate and asks the reader to summarize.
11. **Exercises require the action they name.** Every exercise asks the reader to produce, identify, or evaluate — not "think about." *Fail:* exercises are reflection prompts dressed as work.

## Group D — Authorial accountability

12. **Author judgment present.** At least one paragraph contains a claim only this author could have made. *Fail:* every sentence could have come from any competent commentator.
13. **Contested claims flagged or argued.** Where the field is split, the chapter takes a position with reasoning or flags the dispute. *Fail:* it assumes consensus where there is none.
14. **What would change my mind.** The chapter names the kind of evidence that would falsify its main claim. *Fail:* it reads as if the author cannot imagine being wrong.

---

The two hardest to self-assess are **3 (voice drift)** and **8 (broken bridge)** — both are invisible from inside your own head, because you read your own chapter in your own voice and you already know what the next chapter says. The reader has neither advantage. Both need an outside ear. That is what peers are for.

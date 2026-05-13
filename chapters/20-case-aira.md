# Chapter 20 — Case: AIRA

*An eight-category risk taxonomy for academic-integrity policy clauses, with citation-faithfulness verification — and the honest decomposition of where the +27.5-point accuracy gain actually comes from.*

**Author:** Rajesh Kumar Rama Reddy
**Editor:** Nik Bear Brown

---

## Situation

University academic-integrity policies were mostly written before generative AI became standard student infrastructure, and the gap between *what the policy prohibits* and *what students are actually doing* is now structural rather than incidental. A policy written in 2018 prohibits "unauthorized technology" without defining whether a grammar checker, a search engine, or a large language model qualifies. A policy written in 2023 prohibits "AI tools" or "ChatGPT" by name without establishing a boundary between assistance and substitution. The result is enforcement gaps that resist manual detection at scale: a human reviewer reading fifty clauses applies different interpretive standards on clause 48 than on clause 3, no standard taxonomy exists for the kinds of ambiguity a policy clause can contain, and no systematic method exists to detect when two clauses within the same document contradict each other. AIRA — Academic Integrity Risk Analyzer — addresses the problem by treating *the prompt* as the primary engineering artifact, not the model. The system applies an eight-category risk taxonomy to policy clauses, enforces verbatim citation of source text for every finding, and verifies citation faithfulness via embedding similarity.

## Architecture

The pipeline is five stages. **Stage 1 — Ingestion.** PDF bytes pass through `pdfplumber` extraction, noise filtering (TOC entries, headers, footers, nav elements), sentence-boundary splitting, and a minimum-eight-word filter that removes fragment artifacts. **Stage 2 — Embedding.** Clause embeddings load from a pre-built ChromaDB index (built once locally with `text-embedding-3-small`, committed to the repository). No embedding API calls at inference time. **Stage 3 — Classification.** Each clause is classified by GPT-4o using a structured system prompt at temperature 0. Output is a `RiskAnnotation` containing `risk_category`, `secondary_category`, `reasoning`, `cited_text`, and `confidence`. **Stage 4 — Faithfulness scoring.** For each non-None annotation, the system checks whether `cited_text` is a verbatim substring of the source clause (score 1.0). If not, it computes cosine similarity between the embeddings of both strings as a fallback. Annotations below threshold 0.65 are flagged `low_confidence`. **Stage 5 — Contradiction detection.** Pairwise cosine similarity across all clause embeddings, retain pairs with similarity ≥ 0.4 (capped at 30 pairs), submit each candidate to GPT-4o for contradiction verification. Pairs where scope explains the conflict are excluded.

The eight risk categories: **Ambiguity** (multiple legitimate interpretations), **UndefinedTerm** (central term used without definition), **EnforcementGap** (no mechanism to detect or act on violation), **ScopeConflict** (clause applies inconsistently across contexts), **AuthorityConflict** (unclear who holds enforcement authority), **AIUsageLoophole** (AI use permitted or prohibited without clear boundary), **CircularDefinition** (definition references itself), **None**. Each clause gets exactly one primary label; a secondary label is permitted on genuine overlap.

## Design rationale

The architectural commitment is **the prompt is the engineering artifact**. The structured system prompt provides full definitions for each category, requires a chain-of-thought reasoning trace before label assignment, enforces citation of the exact source substring that justifies the label, requests a confidence score, and specifies a conservative flagging guideline (40–60% flag rate to prevent over-detection). `response_format: json_object` enforces structured output. The vanilla baseline prompt — used to isolate the prompt's contribution from the model's underlying capability — provides only the eight category names and instructs the model to respond with one label, omitting all definitions, reasoning instructions, citation requirements, and flagging guidance. The decomposition is the substantive contribution: the model is identical across both conditions; what changes is what the model is being asked to do.

The **verbatim-substring faithfulness check** before falling back to embedding similarity is the choice that makes the citation enforcement honest. A model can produce a citation that paraphrases the source — semantically close, lexically different — and the embedding similarity check passes. The verbatim check catches the cases where the citation matches the source word-for-word, which is the threshold for *quotable* in legal and policy register. The embedding fallback is a graceful degradation, not a substitute. Annotations below threshold 0.65 are flagged `low_confidence` rather than silently passed.

The **fine-tuning comparison** is the third consequential design move. The same 86 examples (51 ground-truth NEU clauses plus 35 accepted synthetic clean clauses) train `gpt-4o-mini-2024-07-18` with the same structured system prompt. The result tests whether a smaller model with the same prompt scaffolding can reach acceptable accuracy at meaningfully lower per-token cost — and tests, by implication, where the gain in the structured-prompt condition actually came from.

## Trade-offs

The single-clause classification architecture is the system's named limitation: ScopeConflict has 0% recall on the ground-truth set, attributable directly to the architecture's inability to reason across clause context. A scope conflict is by definition a property of two or more clauses considered together; classifying clauses one at a time cannot detect it. The contradiction-detection stage partially addresses this for clause pairs but does not generalize to scope conflicts that span more than two clauses. Inter-annotator reliability on the ground truth set was not measured — the annotation was done by the author alone, which is a real limitation acknowledged in the report. Synthetic data uses temperature 0.7 with cosine-similarity diversity filter at 0.85; adversarial clauses default to `human_accepted = False` and require manual review before contributing to hallucination-rate computation.

## Outcomes and revisions

The headline result on the 51-clause NEU ground truth: **vanilla GPT-4o with category names only — 58.8% accuracy**, collapsing effectively to two outputs (Ambiguity and None) and missing six of eight categories. **GPT-4o with the AIRA structured prompt — 90.2% accuracy.** A +27.5 percentage-point gain attributable primarily to taxonomy definitions and chain-of-thought enforcement, *not* to model size. The fine-tuned `gpt-4o-mini` variant — same structured prompt, smaller model — achieves **80.4% accuracy at approximately 20× lower per-token cost**, a deployment-relevant point on the cost-accuracy frontier. **Citation faithfulness: 100%** on the ground-truth set under the verbatim-substring condition. The 0% ScopeConflict recall is named explicitly as a systematic failure of the single-clause classification architecture rather than a tunable parameter. All code, evaluation data, and a live deployment are publicly available; future work targets cross-clause reasoning to address the scope-conflict failure mode.

## Pattern connection

AIRA instantiates Chapter 7's Fact Check List Pattern (verbatim-substring faithfulness check) and Chapter 12's framework-correctness argument (the property *every classification carries a verifiable citation* is enforced architecturally rather than by prompt diligence). The vanilla-vs-structured baseline split is the same honest two-tier comparison Chapter 15's CodeSentinel made — separating prompt-engineering effort from architectural contribution.

## Transfer prompt

In your own classification system, what does the *vanilla* baseline look like — same model, no taxonomy definitions, no chain-of-thought, no citation requirement? Have you measured the gap, or have you assumed your structured prompt is the source of the accuracy? When your task requires reasoning across multiple input units, can your single-unit classifier detect the cross-unit failures, or are you systematically missing them?

---

*Spring 2026.*


---

## A note about AI

AIRA is an agent for assisted research and analysis. The note examines what assistance means when the assistant produces fluent output on any topic.

Where the model genuinely helps: producing structured first passes across many parallel research threads, so the human researcher can focus attention.

Where the model does damage: producing the conclusions. Research conclusions need provenance, and the model's provenance is its training distribution.

The rule: parallel first passes from the model; conclusions from the human with sources in hand.

---

## AI Wayback Machine

**Joseph Weizenbaum** was built ELIZA in 1966 and spent the rest of his career warning that people would form real emotional attachments to conversational AI.

**Run this:**

```
Who is Joseph Weizenbaum, and how does their work connect to the AI assistants we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Joseph Weizenbaum"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Joseph Weizenbaum's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Joseph Weizenbaum's framework."

What changes? What gets better? What gets worse?

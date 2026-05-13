# Chapter 41 — Case: Research Claim Auditor

*A four-component pipeline that catches the citation-distortion failure mode where a passage is topically similar to the claim but logically contradicts it — using an `adequacy_score` field that distinguishes "match" from "support."*

**Author:** Gomathy Selvamuthiah
**Editor:** Nik Bear Brown

---

## Situation

A paper cites another paper. The cited claim sounds correct. The retrieved source passage is topically related. A naive RAG-based citation checker returns *match found, claim supported* — and the cited paper actually says the *opposite* of what the citing paper attributes to it. This is the silent failure in citation distortion: high topical similarity, low logical support. [Greenberg's 2009 study of citation distortion](https://www.bmj.com/content/339/bmj.b2680) documented exactly this failure mode at scale across the biomedical literature, where a single misrepresented citation propagates through hundreds of downstream papers, each of which inherits the original distortion. A topical-similarity checker would clear the chain. The Research Claim Auditor addresses this gap by treating *adequacy* as a separate dimension from *similarity* — a passage can score 0.85 cosine similarity to a claim and 0.10 adequacy if it contradicts the claim. The architectural premise is the chapter's discipline made specific: *retrieval shows you what is topically related; adequacy is what you have to compute separately.*

## Architecture

A four-component agentic pipeline. **Claim Extractor** parses the citing paper's introduction text using Claude Haiku, extracts cited claims with strength classification (`speculative` / `suggestive` / `assertive` / `definitive`) and hedging-language detection, and normalizes claims to plain-language queries to reduce vocabulary mismatch during retrieval. **Source Retriever** chunks source documents into 300-word overlapping windows (50-word overlap), embeds with `sentence-transformers/all-MiniLM-L6-v2`, stores in a FAISS-compatible cosine-similarity index, and retrieves top-3 passages per claim. **Distortion Classifier** applies a 5-type distortion taxonomy via Claude Haiku and includes the Silent Failure Test that distinguishes topical match from logical support. Returns distortion type, severity (0–4), confidence, and the **`adequacy_score`** (0.0–1.0). **Retraction Checker** is a deterministic CSV lookup against the [Retraction Watch](https://retractionwatch.com/) database — exact DOI match first, then fuzzy title matching via `SequenceMatcher` at threshold 0.85. No LLM involved.

Real data sources. **CrossRef API** — 200 real retracted-paper records for deterministic retraction detection. **OpenAlex Academic Graph** — 80 real paper abstracts across 8 research domains, 128 chunks indexed as the RAG knowledge base. **Evaluation set** — 30 real-paper-grounded pairs + 60 synthetic = **90 labeled pairs**. All sources are open-access and require no authentication.

## Design rationale

The architectural commitment that earns the system's name is the **`adequacy_score` as a separate dimension from cosine similarity**. A naive citation-checker treats high embedding similarity as evidence the claim is supported. The 5-type distortion taxonomy explicitly separates the two: cosine similarity says *the source talks about this topic*; the adequacy score says *the source actually supports the specific claim being attributed to it*. The Silent Failure Test embedded as a few-shot example in the classifier prompt is the move that operationalizes the distinction. The example is a `scope_inflation` case: the source explicitly warns against generalizing its findings to broader populations, and the citing paper generalizes anyway. The two passages are topically near-identical (same vocabulary, same disease, same study design); the source contradicts the citing claim at the level of logical support. The classifier learns from this example to look for the contradiction, not just the overlap.

The **claim-normalization step before retrieval** is the second consequential design move. *Cardiovascular mortality* and *cardiac death rates* describe the same concept and share no overlapping tokens. A plain semantic search would miss the match. Rewriting jargon-dense claims as plain-language queries before FAISS retrieval reduces vocabulary-mismatch false negatives. The normalization step is a small Claude-Haiku call dedicated to one job: produce the query the retriever can actually find evidence with.

The **deterministic retraction checker with no LLM** is the third move. Retraction-status verification is a closed-form lookup against a curated database; the right tool is exact DOI matching with a fuzzy-title fallback at 0.85 similarity, not an LLM. Putting this on a deterministic path keeps the retraction-flagging precision high, predictable, and free of hallucination — and orthogonal to the distortion-classification pipeline. A retracted paper that is also being cited correctly still gets the retraction flag; a non-retracted paper that is being cited with distortion gets the distortion flag. Two failure modes, two checks, on different paths.

The **abstract-only fallback for paywall-inaccessible sources** is the fourth move. When the full text of a cited paper isn't available, the system falls back to the abstract and explicitly labels the verdict *"unverifiable"* rather than guessing. This is the chapter's discipline applied to the data-availability boundary: when the evidence isn't there, name the limit instead of confabulating around it.

## Trade-offs

The 90-labeled-pair evaluation set is small enough that the targeted precision/recall numbers are aspirational benchmarks rather than empirical claims; the report names this honestly. The system is scoped to introduction-section claims; discussion-section analysis is deferred. The 5-type distortion taxonomy is curated and would benefit from inter-rater calibration with citation-distortion experts — Cohen's kappa against expert annotators is a target metric, not yet a measured one. Claude Haiku is the right cost point for extraction and classification; quality scales with model selection at predictable cost. The OpenAlex pivot from Semantic Scholar (rate-limit-driven) is a small but instructive deployment detail — provider-agnostic data access is a real maintenance surface.

## Outcomes and revisions

The system is implemented end-to-end with all components functional. Target metrics published as evaluation goals rather than measured outcomes:

| Metric | Target | Rationale |
| --- | --- | --- |
| Distortion Detection Precision | ≥ 85% | Of all flagged distortions, what % are genuine |
| Distortion Detection Recall | ≥ 80% | Of all true distortions, what % were caught |
| RAG Faithfulness (RAGAS) | ≥ 0.80 | Is the finding grounded in retrieved text |
| Retraction Detection Accuracy | ≥ 95% | Deterministic — DOI/title lookup |
| Silent Failure Rate | ≤ 5% | Of "accurate" predictions, what % are wrong on review |
| Human Audit Agreement (κ) | ≥ 0.75 | Cohen's kappa vs expert annotator |

The honest evaluation framing — *targets, not achieved numbers* — is itself the discipline the chapter cares about. The most consequential planned revision is conducting the manual labeled evaluation against expert annotators using Greenberg-derived citation pairs, broadening the corpus beyond introductions, and adding multi-document citation-chain tracing for tracking how distortions propagate across papers.

## Pattern connection

The Research Claim Auditor instantiates Chapter 7's Fact Check List Pattern (`adequacy_score` as a structurally separate dimension from cosine similarity preserves the *evidence-found-but-not-supporting* state) and Chapter 12's framework-correctness argument (the deterministic retraction-checker path enforces retraction flagging architecturally rather than via LLM judgment). The Silent Failure Test as a labeled few-shot example in the classifier prompt is a small useful pattern: when a model needs to distinguish topical match from logical support, an in-prompt contradiction example teaches the distinction better than any verbal instruction can.

## Transfer prompt

In your own RAG-based verification system, when a retrieved passage is topically similar to a claim, do you have a separate dimension that asks whether the passage actually *supports* the claim? When your evaluation reports targets the system has not yet measured, do you mark them clearly as targets rather than as outcomes? When the evidence required to verify a claim isn't available (paywall, retracted source, broken link), does your system label the verdict *unverifiable* — or quietly produce a guess?

---

*Spring 2026.*


---

## A note about AI

Research Claim Auditor evaluates research claims. The model has read the literature and has the same biases as the literature.

Where the model genuinely helps: producing the methodological-objection vocabulary for a given claim type.

Where the model does damage: declaring claims true or false. Truth verdicts require primary literature access and methodological judgment the model lacks at the level needed.

The rule: objection vocabulary from the model; verdicts from researchers with the primary sources in hand.

---

## AI Wayback Machine

**Donald Rubin** was developed the potential outcomes framework — the foundation for evaluating causal claims in research.

**Run this:**

```
Who is Donald Rubin, and how does their work connect to the research claim auditing we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Donald Rubin"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Donald Rubin's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Donald Rubin's framework."

What changes? What gets better? What gets worse?

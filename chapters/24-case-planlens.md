# Chapter 24 — Case: PlanLens

*A 401(k) Summary Plan Description Q&A system where citation enforcement lives in the prompt template's required output structure rather than as a politely-worded prompt suggestion.*

**Author:** Vanshi Patel
**Editor:** Nik Bear Brown

---

## Situation

About [35 million Americans have left 401(k) accounts behind at former employers](https://www.gao.gov/products/gao-22-105051) according to the U.S. Government Accountability Office, and the [ERISA Advisory Council](https://www.dol.gov/agencies/ebsa/about-ebsa/about-us/erisa-advisory-council) has repeatedly identified plan-document complexity as a primary driver of participant disengagement. Every year during open enrollment millions of workers receive Summary Plan Descriptions — 40-to-120 pages of dense legal text governing contribution percentages, employer-match formulas, vesting schedules, withdrawal penalties, and beneficiary designations. The financial stakes are quantifiable: a worker who misunderstands their vesting schedule and leaves employment two months before the cliff triggers can forfeit tens of thousands of dollars in employer contributions. Asking ChatGPT *what is my 401(k) vesting schedule?* returns a thoughtful explanation of how vesting schedules work *generally* — useful for understanding the concept, dangerous for plan-specific decisions, because base LLMs have no mechanism to distinguish *what 401(k) plans typically do* from *what this specific plan does*. PlanLens is a RAG system that grounds every answer in the user's specific SPD and enforces page-number citations at the architectural level. Built by a co-op at [PlanSync](https://www.plansync.com/), a fintech focused on plan-document management and compliance.

## Architecture

The pipeline is conventional RAG with one structural commitment that earns its place. **PDF Parser** uses `pdfplumber` 0.10+ with explicit table detection. **RAG Framework** is LlamaIndex 0.9+ for retrieval orchestration. **Embeddings** come from `sentence-transformers` (384-dim). **Vector DB** is ChromaDB 0.4+. **LLM** is Llama 3.3 70B via Groq. **UI** is Gradio 4.0+. Total operating cost: $0 on the free-tier composition.

The structural commitment is the **citation-enforcing PromptTemplate**. Early iterations attempted *"Please cite your sources with page numbers"* in the system prompt, which yielded a ~60% citation rate. The current implementation uses LlamaIndex's `PromptTemplate` system to require `[Page X]` citations as part of the output's *structure* — a citation-less response is not a valid response shape, not just a discouraged one. This change moved citation rate to **100% across the test suite**.

The output schema is the verification layer. Every factual claim arrives with `[Page X]` attached. An adversarial-question category exists in the test suite specifically to verify that questions *not answerable from the document* trigger an explicit refusal protocol rather than a confidently-paraphrased generic 401(k) answer.

## Design rationale

The architectural commitment that earns the system's name is **citation as required output structure, not as prompt politeness**. This is the same insight Chapter 7 names mechanically: a constraint encoded in the system prompt is a probabilistic enforcement mechanism. A constraint encoded in the *output schema*, where a malformed response is a parse failure, is a structural enforcement mechanism. Moving citations from prompt suggestion to template requirement closed the 40-percentage-point gap between *cite when you remember* and *cite always*.

The **explicit refusal protocol on adversarial questions** is the second consequential design move. A naive RAG system asked a question whose answer is not in the indexed document will retrieve the closest semantically similar passages and let the LLM compose a confident answer from those passages plus its training-time knowledge of 401(k) plans generally. The result is plausible, generic, and exactly the failure mode PlanLens exists to prevent. The refusal protocol — implemented as an explicit prompt rule supported by the citation requirement — produces a structured *I cannot answer that from this document* response rather than a paraphrase. Adversarial accuracy: 100% on the test set's adversarial subset.

The **table-aware parsing with `pdfplumber`** is the third move and the one informed directly by the author's day-job experience at PlanSync. *Vesting schedule parsing failures are the #1 cause of data quality issues in production pipelines* — that's the line in the report, and it operationalizes a specific decision: switch from naive PDF text extraction (which mangles tables) to `pdfplumber` with explicit table detection. Result: 100% table preservation rate. A vesting schedule that survives parsing as structured rows is queryable; a vesting schedule that arrives as scrambled text is the source of the silent-failure verdicts the system is built to prevent.

## Trade-offs

The free-tier stack ($0 operating cost) trades latency floor against control: Groq's free tier is generous but rate-limited, and a deployment under sustained load would need to migrate to a paid tier or a self-hosted Llama instance. ChromaDB local persistence is fast and audit-trail-light; production would need richer metadata and access logs. The single-document-per-session design rules out cross-plan comparison ("how does my vesting compare to industry?") which is named explicitly in Future Enhancements as a multi-document corpus extension. The strict citation-enforcement template means responses are verbose by design — every claim carries a page number, which is exactly what the legal-defensibility argument requires and exactly what a chat user expecting tight conversational responses might find heavy. The trade-off is correctly resolved in this domain.

## Outcomes and revisions

Twenty test questions across five categories — eligibility, contributions, vesting, distributions, adversarial. **Average faithfulness 0.925** (target ≥ 0.90, exceeds by 2.8%). **Average relevancy 0.972** (target ≥ 0.85, exceeds by 14.4%). **Citation rate 100%** (18/18 cited). **Response time < 3s** (target < 5s). Per-category breakdown: eligibility 5/5 cited, faithfulness 1.000; contributions 5/5, 1.000; vesting 4/4, 0.714 (the lowest faithfulness, attributable to the one table extraction error caught in manual audit and fixed); distributions 4/4, 0.947. Direct comparison against ChatGPT on four matched questions across four dimensions: specificity 1.00 → 5.00 (+400%), verifiability 0.00 → 5.00 (+∞ — ChatGPT does not produce page citations), actionability 2.00 → 5.00 (+150%), accuracy 3.00 → 5.00 (+67%). The verifiability metric is the one that demonstrates the architecture's contribution rather than the prompt's: ChatGPT *cannot* cite the user's specific SPD because ChatGPT does not have the user's specific SPD. The most consequential planned revision is migration to a FastAPI + React + PostgreSQL stack for production deployment with conversational history (LlamaIndex chat engine) and ERISA-language fine-tuning on a corpus of SPDs.

## Pattern connection

PlanLens instantiates Chapter 7's Fact Check List Pattern — citation enforcement as a structural rather than prompt-level constraint, with refusal protocol as the explicit UNCERTAIN state — and Chapter 9's Retrieval principle (chunked SPD content embedded once, queried selectively at inference time, generic 401(k) knowledge held *out* of the prompt by the citation requirement).

## Transfer prompt

In your own RAG system, is your citation requirement encoded in the *prompt* (politely worded request the model usually follows) or in the *output template* (responses without citations are not valid responses)? When your retrieval returns nothing relevant, does the system refuse to answer or compose a generic response from training-time knowledge? When your input documents contain tables, are you parsing them with table-awareness or scrambling structured data into unstructured text the LLM then misinterprets?

---

*Spring 2026.*


---

## A note about AI

PlanLens evaluates plans. Plans are easy to evaluate against logical structure and hard to evaluate against the world.

Where the model genuinely helps: stress-testing a plan against the structural failure modes (unresourced dependencies, optimistic timelines, missing fallback paths).

Where the model does damage: certifying a plan as sound. Soundness is empirical; the test is in execution.

The rule: structural critique from the model; soundness from execution.

---

## AI Wayback Machine

**Herbert Simon** was Nobel-winning economist and AI pioneer who built the theory of bounded rationality in planning under uncertainty.

**Run this:**

```
Who is Herbert Simon, and how does their work connect to the planning agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Herbert Simon"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Herbert Simon's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Herbert Simon's framework."

What changes? What gets better? What gets worse?

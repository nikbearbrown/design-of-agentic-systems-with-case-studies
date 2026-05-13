# Chapter 16 — Case: VerifAI

*A four-stage adversarial verification pipeline for AI-generated legal text — extraction, retrieval, NLI scoring, transparency report.*

**Author:** Rithwik Srivastava
**Editor:** Nik Bear Brown

---

## Situation

A mid-sized legal-services firm running an AI-assisted brief drafter spent the first quarter of 2026 trying to figure out why their associate attorneys were re-doing 40% of the citation work manually. The drafter — a single GPT-4o prompt with a legal-style system message — produced briefs whose surface texture was correct, whose citations were formatted to Bluebook standard, and whose case-name inventions were indistinguishable from real precedent until someone tried to pull the source. The same failure mode that produced *Mata v. Avianca* in 2023 was producing it again, in 2026, on a different attorney's desk. VerifAI is a four-stage pipeline built to verify the factual claims inside AI-generated legal text *before* the text reaches the attorney — by structurally separating the model that *generates* a claim from the components that *verify* it. The system's design premise is the chapter's premise: no LLM should be asked to evaluate its own output, because the same training distribution that produced the hallucination will produce the verification of the hallucination.

## Architecture

The pipeline is four stages composed end-to-end. **Stage 1 — Claim Extraction** takes the input text and uses GPT-4o with structured JSON output to decompose it into atomic, independently verifiable claims, each labeled `citation_existence`, `factual`, `statistical`, or `legal_holding`. Compound sentences split. Opinions and subjective statements are filtered out — *we hold that this is well-reasoned* is not a verifiable claim. **Stage 2 — Evidence Retrieval** queries [CourtListener](https://www.courtlistener.com/help/api/rest/) — a database of 5M+ federal and state court opinions — via REST API. For `citation_existence` claims, an additional hard-check queries the database for the exact case name. If the case is not found, the claim is flagged CONTRADICTED *regardless of semantic similarity to anything else*. **Stage 3 — NLI Entailment Scoring** runs each (claim, evidence) pair through the [`MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli`](https://huggingface.co/MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli) cross-encoder, fine-tuned on MNLI/FEVER/ANLI/WANLI, producing P(entailment), P(contradiction), P(neutral). The faithfulness score is the maximum entailment probability across the top-k retrieved passages. **Stage 4 — Transparency Report** renders a Streamlit per-claim audit with three states — SUPPORTED (green), INSUFFICIENT EVIDENCE (yellow), CONTRADICTED (red) — each linked to the evidence passages and NLI scores that produced the verdict.

The verdict logic is deliberately asymmetric: citation hard-check NOT_FOUND → CONTRADICTED, faithfulness > 0.70 → SUPPORTED, max contradiction > 0.50 AND faithfulness < 0.30 → CONTRADICTED, anything else → INSUFFICIENT EVIDENCE.

## Design rationale

The architectural commitment that earns the system's name is **separating generation from verification across model families**. GPT-4o produces the claim decomposition. CourtListener — a non-LLM keyword and semantic search index — produces the evidence. DeBERTa — a 1.5GB cross-encoder fine-tuned on entailment data — adjudicates the (claim, evidence) match. No single model is trusted to both produce and validate information. A second GPT-4o call as the verifier would have inherited the first call's plausibility bias on fabricated citation names. The DeBERTa-on-CourtListener move is the architectural decorrelation Chapter 7 argued for, made specific.

The **citation hard-check that overrides semantic similarity** is the single most consequential design decision. A fabricated case name like *Thompson v. Western Medical Center* will match real cases on partial-name overlap if the system relies on retrieval similarity alone. The hard-check queries CourtListener for the exact case name; if no record exists, the claim is CONTRADICTED before NLI scoring runs. This is the move that closes the *Mata v. Avianca* failure mode at architectural rather than threshold level.

The **conservative scoring policy** is the third key choice. Real citations (Miranda v. Arizona, Brown v. Board of Education) score INSUFFICIENT EVIDENCE rather than SUPPORTED, because CourtListener's search returns opinion snippets that don't always lexically match the specific claim wording with high enough entailment probability. The system intentionally biases toward yellow over green: in legal verification, a false positive (approving a fabricated claim as SUPPORTED) is more dangerous than a false negative (flagging a real claim for manual review). The three-state output preserves the architecturally critical distinction between *no evidence found* (yellow) and *evidence contradicts* (red) — a binary system would collapse them and lose the discrimination Chapter 7 argues UNCERTAIN earns its place by preserving.

## Trade-offs

The hard-check rules out semantic-match approval but cannot rule out cases where a real citation is on a topic CourtListener has indexed sparsely. The DeBERTa model is general-purpose NLI, not legal-domain NLI — performance degrades on legal jargon the model didn't see in training. CourtListener API rate limits and occasional downtime force a 0.5-second sleep between calls and graceful degradation to INSUFFICIENT EVIDENCE on API failure. End-to-end latency runs about 30 seconds for a 10-claim brief — fine for offline review, slow for inline drafting. The 1.5GB DeBERTa model load is amortized via Streamlit's `@st.cache_resource` but the cold-start cost is real on first deployment.

## Outcomes and revisions

End-to-end test on a demo legal brief containing 2 real citations (Miranda v. Arizona, Brown v. Board), 2 fabricated citations (Thompson v. Western Medical, Henderson v. Pacific Healthcare), and statistical and legal-holding claims: 10 atomic claims extracted, all 4 verdict assertions passed. The two real citations correctly returned INSUFFICIENT EVIDENCE (the conservative-scoring expected behavior). Both fabricated citations correctly returned CONTRADICTED via the hard-check override. Three standalone test suites pass: `test_claim_extraction.py` (3/3 — single citation, compound decomposition, opinion filtering), `test_nli_scoring.py` (3/3 — water-boils-at-100°C 99.1% entailment, water-boils-at-50°C 99.0% contradiction, unrelated 99.9% neutral), `test_pipeline_e2e.py` (4/4). The system has not yet been evaluated against a published legal-domain benchmark; the demo brief is the verification suite at this submission.

The most consequential planned revision is replacing or supplementing DeBERTa with a legal-domain NLI model (CaseHOLD-fine-tuned or similar) to address the conservative-scoring rate on real citations.

## Pattern connection

This is a near-textbook instantiation of Chapter 7's Fact Check List Pattern. The four-state verdict logic preserves the SUPPORTED / INSUFFICIENT EVIDENCE / CONTRADICTED distinction (with citation-hard-check NOT_FOUND as a fast-path to CONTRADICTED) that the chapter argued is structurally necessary.

## Transfer prompt

In your own LLM application that produces claims a downstream user must trust, identify which model component *generates* the claim and which *verifies* it. Are they trained on the same corpus? If yes, the verification is correlated with the generation; what would architectural decorrelation cost you in latency and integration debt? Does your verdict logic distinguish *no evidence found* from *evidence contradicts*, or does it collapse them?

---

*Spring 2026.*


---

## A note about AI

VerifAI is an agent that verifies the outputs of other AI systems. The verifier and the verified share architecture, training data, and failure modes.

Where the model genuinely helps: producing the verification rubric and the categories of claim that need to be checked.

Where the model does damage: certifying outputs as verified. A verifier built from the same training distribution as the system it verifies will share its blind spots.

The rule: verifiers must be structurally different from what they verify; ground-truth checks against external sources are non-negotiable.

---

## AI Wayback Machine

**Tony Hoare** was developed quicksort, communicating sequential processes, and formal verification methods that prefigure AI verification.

**Run this:**

```
Who is Tony Hoare, and how does their work connect to the AI verification we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Tony Hoare"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Tony Hoare's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Tony Hoare's framework."

What changes? What gets better? What gets worse?

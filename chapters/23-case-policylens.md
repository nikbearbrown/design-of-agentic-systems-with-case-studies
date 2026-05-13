# Chapter 23 — Case: PolicyLens

*A claim-by-claim auditor for AI-generated policy summaries — where deterministic rules handle the easy verdicts and the Claude tool-calling agent only fires on the high-risk ones.*

**Author:** Ushake Shravya
**Editor:** Nik Bear Brown

---

## Situation

Modern AI assistants summarize 200-page policy documents in seconds. The summaries read fluently, look authoritative, and quietly introduce facts, numbers, and causal claims that were never in the source. A canonical example: the source says *"emissions declined during the review period"*; the AI-generated summary returns *"the policy reduced emissions by 22% over five years."* The second statement has invented a quantity (22%), a duration (five years), and a causal attribution (the policy *reduced*, not the emissions *declined*) — none of which appear in the source. It passes human review because it sounds right. PolicyLens is built around the premise that *don't trust AI summaries — verify them* is too vague to be operational and *audit each claim individually with traceability back to source* is concrete enough to ship. The system does not generate summaries. It audits them. Claim by claim, with full traceability.

## Architecture

The pipeline runs eight stages from PDF to verdict report. **PDF Parser** (`pdfplumber`) extracts text by page. **Claim Extractor** detects verifiable claims via spaCy NER + regex + Claude API + Vision LLM (multimodal pass for charts and tables). **Retriever** chunks pages into overlapping 3-sentence windows with 1-sentence overlap, embeds with `sentence-transformers/all-MiniLM-L6-v2` (384-dim), stores in FAISS `IndexFlatIP` with L2 normalization for true cosine similarity, persists by MD5 hash of source PDF for instant reload on repeat documents. **Verifier** applies four deterministic rules. **Agent Orchestrator** invokes Claude tool-calling only on high-risk claims. **Reporter** emits JSON + pandas DataFrame. **Streamlit UI / Batch Processor** wraps it.

The four deterministic rules, applied in priority order: **Similarity Threshold** (top evidence score < 0.35 → Unsupported), **Numeric Match** (claim number not in evidence at ±10% → High-Risk Silent Failure), **Causal Scrutiny** (causal verb without causal evidence → Partially Supported), **Entity Consistency** (named entity absent from evidence → Partially Supported). Verdict priority: **High-Risk Silent Failure** > **Unsupported** > **Partially Supported** > **Supported**. Years use exact matching, not ±10%, because 2019 ≠ 2021 in policy contexts.

## Design rationale

The architectural commitment that earns the system's name is **deterministic rules first, agent only on high-risk claims**. A naive design would route every extracted claim through Claude tool-calling for verification, which would correctly catch most failure modes and would also cost N × API-call price per audit. PolicyLens routes a claim to the agent layer only when the deterministic rules return *High-Risk Silent Failure* or *Unsupported* — the verdicts where the LLM's added context is worth its latency and cost. **Safe claims skip the agent entirely**: zero API calls for Supported or Partially Supported verdicts. This is not a cost optimization in the sense that adds risk; it is a cost optimization that *only invokes the more expensive layer where the cheaper layer was already worried.* The four rules act as the system's adjudication budget allocator.

The **numeric ±10% match with exact-year carve-out** is the second consequential design move. Naive numeric matching either fails on rounding (*22%* vs *22.4%*) or passes on dangerous mismatches (*2019* matched to *2021* under a 10% tolerance is roughly correct in number-space but catastrophic in policy-space). The rule's exact-year clause is what keeps the tolerance from collapsing one of the most consequential failure modes — a fiscal-year claim attributed to the wrong year — into a green-checkmark verdict. The same instinct produces the three false-positive filters: list ordinal markers (`1.` `2.` `3.` at sentence start), fiscal-year references (`FY 2022`), and compound terms (`COVID-19`, `H5N1`) that look like numeric-claim flags but aren't.

The **multimodal smart activation** is the third move. Claude vision processing of full PDF page images is expensive — `pdf2image` rendering plus base64 encoding plus Claude Sonnet 4.6 vision API calls per page. PolicyLens only runs the vision pass *when no summary is pasted* (self-audit mode, where the user is auditing the document itself rather than auditing an external AI summary against it). When a summary is provided, the vision pass is skipped because the claims to audit come from the summary, not from charts in the source. This is correct routing: the multimodal step does work the textual step cannot, but only sometimes.

## Trade-offs

The deterministic-rules-first architecture trades coverage for cost: a claim that the rules clear as *Supported* never gets the agent's deeper context check, so an adversarial summary that produces claims structurally similar to source statements but semantically inverted may pass the cheap layer. The rule priority ordering is configuration the system depends on; getting it wrong (promoting Causal Scrutiny above Numeric Match) would silently shift the audit's failure mode. The 0.35 similarity threshold and ±10% numeric tolerance are calibrated rather than learned — they're documented and tunable but not adaptive. Persistent FAISS caching by PDF hash assumes documents aren't silently revised at the same URL; cache invalidation is by hash, which is correct, but the system has no provenance check on whether an externally-cached document changed since last audit.

## Outcomes and revisions

Audit results across heterogeneous summary inputs:

| Document | Summary Type | Claims | High-Risk | Unsupported | Supported |
| --- | --- | ---: | ---: | ---: | ---: |
| EPA FY2020 Annual Report | Fabricated | 4 | 1 (25%) | 0 | 1 |
| Federal Budget FY2022 | Real ChatGPT | 9 | 0 | 0 | 4 |
| NASA FY2020 Financial Report | Real ChatGPT | 11 | 0 | 0 | 8 |
| Federal Budget FY2025 | Real ChatGPT (mixed) | 14 | 0 | 3 (21%) | 4 |
| Batch (3 docs combined) | Real ChatGPT | 32 | 0 | 4 | 13 |

The fabricated EPA summary correctly produced one High-Risk Silent Failure flag — the only fabricated summary in the suite, and the only result with a High-Risk flag. Real ChatGPT summaries on real documents produced zero High-Risk flags and a small number of Partially Supported verdicts on the harder cases (Federal Budget FY2025 mixed-quality summary), which is the discrimination shape the architecture is supposed to produce: confident-but-wrong inputs get caught, careful-but-imperfect inputs get nuanced verdicts. The most consequential planned revision is enriching the Causal Scrutiny rule with explicit causal-verb taxonomy (drives, reduces, leads to, causes) and adding a temporal-range check that catches *over five years* introduced into a summary of a *during the review period* source.

## Pattern connection

PolicyLens instantiates Chapter 7's Fact Check List Pattern (the four-state verdict — Supported / Partially Supported / Unsupported / High-Risk Silent Failure — preserves the PASS / FAIL / UNCERTAIN distinction with high-risk as the explicit first-class state) and Chapter 9's Caching pattern (FAISS index persisted by PDF hash, MD5-keyed, instant reload — exactly the kind of read-heavy slow-changing data Caching with invalidation handles best).

## Transfer prompt

In your own claim-verification pipeline, what fraction of claims need expensive verification, and what fraction can be cleared by cheap deterministic rules? When you set numeric tolerances (±10%, ±1%, ±5%), do you have a carve-out for the values where tolerance collapses a critical distinction (years, severity tiers, dose levels)? When your verifier runs a multimodal step, is it conditional on whether the upstream task actually requires it — or do you pay the cost on every input?

---

*Spring 2026.*


---

## A note about AI

PolicyLens analyzes policy documents. Policy is dense in jurisdiction, history, and political context the model can recite without weighing.

Where the model genuinely helps: surfacing the structural categories of policy analysis — actors, instruments, intended effects, unintended effects.

Where the model does damage: producing policy recommendations. Recommendations require commitment to values the model does not hold.

The rule: analytical structure from the model; recommendations from named analysts with accountability.

---

## AI Wayback Machine

**Cass Sunstein** was legal scholar who built the modern framework for cost-benefit analysis in regulatory policy.

**Run this:**

```
Who is Cass Sunstein, and how does their work connect to the policy analysis agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Cass Sunstein"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Cass Sunstein's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Cass Sunstein's framework."

What changes? What gets better? What gets worse?

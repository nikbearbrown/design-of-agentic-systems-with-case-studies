# Chapter 39 — Case: Immigrant Tax Filing Assistant

*A six-stage RAG pipeline where 24 keywords trigger CPA escalation before the LLM is ever called — and a Substantial Presence Test calculator runs as pure Python with zero LLM involvement.*

**Author:** Param Shah
**Editor:** Nik Bear Brown

---

## Situation

International students and workers on F-1, OPT, H-1B, and J-1 visas face U.S. tax obligations the mainstream tax tools do not address: nonresident-alien status determination via the [Substantial Presence Test](https://www.irs.gov/individuals/international-taxpayers/substantial-presence-test), FICA exemptions, tax treaty benefits per country, [Form 8843](https://www.irs.gov/forms-pubs/about-form-8843) requirements, fellowship income taxation under chapter 3 withholding rules. Generic tax tools fail this population. Professional CPAs charge $200-500 per session — money many international students do not have. ChatGPT confidently produces tax answers that look correct and may or may not be grounded in actual IRS publications, with the consequence that a wrong answer about treaty benefits or filing thresholds shows up in the user's tax return as a real liability. The Immigrant Tax Filing Assistant addresses this gap with a production-grade RAG system grounded in IRS documentation. Its architectural premise is the chapter's discipline made specific: *some questions in this domain are too consequential to answer with an LLM at all*, and the system identifies them upfront and escalates to a licensed professional before generation begins.

## Architecture

A six-stage pipeline. **Stage 1 — CPA Escalation Check** scans the query against 24 keyword triggers (`fbar`, `fatca`, `dual status`, `foreign bank account`, `multi-state`, `audit`, `penalty`, `irs notice`, `amended return`, `back taxes`, `self employed`, `cryptocurrency`, `rental income`, `green card`, `expatriation`, others). If any trigger fires, the system immediately returns a CPA referral — *no LLM call, no retrieval, no generation*. **Stage 2 — Metadata Filter** narrows FAISS candidates by visa type and home country. **Stage 3 — Query Enrichment** appends profile context (*"F-1 visa India student 2 years in US"*) to the query. **Stage 4 — FAISS Semantic Search** over 3,726 vectors (384-dim, `all-MiniLM-L6-v2`), fetches top-15 candidates. **Stage 5 — Smart Re-Ranking** applies source-specific score multipliers (1.1× to 1.6×) based on detected query intent. **Stage 6 — Prompt Builder + Generation** injects the user profile, retrieved IRS context, and question into the citation-mandatory system prompt; Groq LLaMA 3.1 8B Instant at temperature 0.0, max tokens 1,024.

The smart re-ranking signal table:

| Signal | Trigger keywords | Boosted document | Multiplier |
| --- | --- | --- | ---: |
| Treaty Query | `treaty`, `article`, `exemption` | Country-specific treaty | 1.4× |
| Form 1040-NR | `need to file`, `nonresident return` | Form 1040-NR Instructions | 1.35× |
| Form 8843 | `form 8843`, `exempt individual` | Form 8843 | 1.35× |
| Fellowship | `fellowship`, `stipend`, `1042` | Form 1042-S Instructions | **1.6×** |
| W-8BEN | `w-8ben`, `certificate of foreign` | Form W-8BEN Instructions | 1.5× |
| Extension | `extension`, `form 4868` | Form 4868 | 1.5× |
| Closer Connection | `closer connection`, `form 8840` | Form 8840 | 1.5× |
| Education | `tuition`, `education credit` | IRS Publication 970 | 1.4× |
| Withholding | `withholding rate`, `chapter 3` | IRS Publication 515 | 1.4× |

Six absolute rules in the system prompt: **Context Only** (answer only from retrieved IRS documentation); **Citation Mandatory** (every fact, number, deadline cites `[Source: IRS Publication 519, Chapter X]`); **Profile-Specific** (address exact visa type and home country); **Structured Output** (Direct Answer → Explanation with citations → Numbered Action Steps); **Tax Year Disclosure** (every answer ends with *"Based on IRS Tax Year 2024/2025 publications."*); **Never Guess** (do not invent rules, thresholds, or deadlines not in retrieved context).

## Design rationale

The architectural commitment that earns the system's name is **CPA escalation as a pre-LLM gate**. Twenty-four keywords cover topics where the failure cost is high enough that an LLM-generated answer should not be the user's first source. FBAR-triggering foreign-account questions, dual-status returns, multi-state issues, audits, amendments, expatriation, crypto, self-employment — all of these are areas where the right answer is *talk to a CPA*, not *here is what IRS Publication X says*. Putting the escalation check *before* the LLM call costs zero LLM tokens and zero latency on the question that should never have been answered with an LLM in the first place. This is the chapter's discipline at its most operational: the architecture knows what it should not do and refuses to do it.

The **deterministic SPT calculator with zero LLM involvement** is the second consequential design move. The Substantial Presence Test is a closed-form arithmetic operation: $\text{total} = \text{Y0 days} + \tfrac{1}{3}\text{Y-1 days} + \tfrac{1}{6}\text{Y-2 days}$, passes if Y0 ≥ 31 and total ≥ 183. There is no reason to ask an LLM to do this calculation. The system implements it as pure Python, cited to IRS Publication 519 Chapter 1, with zero hallucination risk. Chapter 17's PharmGuard pattern: don't invoke the LLM where a for-loop or a closed-form formula is the right tool.

The **citation-mandatory + profile-specific + tax-year disclosure prompt** is the third move. Each rule in the six-rule system prompt closes a specific failure mode the chapter has been naming. *Context Only* closes parametric-knowledge contamination. *Citation Mandatory* makes verification possible by the user or a downstream CPA. *Profile-Specific* prevents the model from defaulting to general-population tax advice when visa-specific rules apply. *Tax Year Disclosure* names the publication-cycle dependency explicitly so users do not act on stale rules.

The **dual-source knowledge base** (23 IRS PDFs producing 3,699 chunks plus 4 IRS.gov HTML pages producing 27 chunks) is the fourth move. HTML pages use conversational language that better matches user-query vocabulary compared to the formal legal register of PDF documentation. Indexing both source types broadens the retrievable surface without sacrificing the citability of the formal sources.

## Trade-offs

The 24-keyword CPA escalation list is curated and conservative: a question that doesn't trigger any keyword still routes to the LLM, and the catalog needs ongoing maintenance as new failure modes surface. Multi-country tax treaty support is bounded to the indexed countries (India, China, South Korea, Germany, Mexico, Canada, Japan); other home countries fall back to general-purpose treaty discussion or to CPA escalation when the underlying treaty isn't in the corpus. Groq LLaMA 3.1 8B Instant is the right cost-quality point for free deployment on Hugging Face Spaces; production-scale would benefit from a larger model with more rigorous retrieval-grounded generation. Source-multiplier values (1.1× to 1.6×) are calibrated, not learned; needs re-tuning as the corpus expands.

## Outcomes and revisions

The system is **deployed publicly** on Hugging Face Spaces with a Gradio 3-tab frontend. The corpus indexed:

- **23 IRS PDFs**, 3,699 chunks (avg 1,142 chars per chunk)
- **4 IRS.gov HTML pages**, 27 chunks
- **3,726 total chunks** in the FAISS IndexFlatIP store

Document inventory is concentrated on the high-traffic publications: IRS Publication 519 (core guide, 472 chunks), Publication 901 (treaties, 223), Publication 515 (withholding, 446), Publication 970 (education tax, 358), Publication 525 (income), with form instructions for 1040-NR, 8843, 8840, W-8BEN, 4868, 1042-S indexed alongside. The most consequential planned revision is broadening the country-specific treaty coverage and introducing a between-population study comparing the assistant's outputs against CPA-prepared returns on a labeled set of nonresident-alien tax scenarios.

## Pattern connection

The Immigrant Tax Filing Assistant instantiates Chapter 7's Fact Check List Pattern (citation-mandatory output schema, tax-year disclosure as structural requirement) and Chapter 12's framework-correctness argument (the CPA-escalation gate enforces the property *no high-stakes question reaches the LLM* structurally rather than through prompt-level instructions). The deterministic SPT calculator is Chapter 17's *don't-invoke-LLM-where-closed-form-deterministic-works* pattern made specific.

## Transfer prompt

In your own LLM-driven assistance system, what fraction of incoming queries should never reach the LLM at all — because the failure cost of a wrong answer is high enough that human escalation is the correct response? When a closed-form deterministic calculation is what the user needs, are you running it as code or asking the LLM to do arithmetic? When your system handles entity-specific guidance (visa type, country, jurisdiction), is the entity context structurally injected into retrieval and prompt, or relegated to a free-text mention the model may or may not honor?

---

*Spring 2026.*


---

## A note about AI

Immigrant tax situations are high-stakes, jurisdiction-specific, and structurally underserved by general-purpose tax models.

Where the model genuinely helps: producing the structural categories of cross-border tax questions — residency, treaty position, source rules — at the level of vocabulary.

Where the model does damage: producing tax filings or specific positions. The cost of model error here is back taxes, penalties, and immigration consequences.

The rule: vocabulary from the model; filings from licensed tax counsel.

---

## AI Wayback Machine

**Stephen Shay** was tax-law scholar whose work on international taxation defines the modern framework for analyzing cross-border tax obligations.

**Run this:**

```
Who is Stephen Shay, and how does their work connect to the immigrant tax agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Stephen Shay"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Stephen Shay's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Stephen Shay's framework."

What changes? What gets better? What gets worse?

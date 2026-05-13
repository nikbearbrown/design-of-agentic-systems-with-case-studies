# Chapter 17 — Case: PharmGuard AI

*A plan-retrieve-generate pipeline that keeps the LLM out of enumeration, lookup, and severity classification — and into the only step where fluent prose is the deliverable.*

**Author:** Shwetanshu Subhash Deshmukh
**Editor:** Nik Bear Brown

---

## Situation

Adverse drug events drive approximately [1.3 million emergency-department visits and 350,000 hospitalizations](https://www.cdc.gov/medication-safety/data-research/adverse-drug-events.html) in the United States each year. The Agency for Healthcare Research and Quality estimates in-hospital adverse drug events alone cost about $3.5 billion annually. Adults over 65 take a median of five prescription medications simultaneously, and the combinatorial structure of the problem is unforgiving: five drugs produce ten unique pairs, ten drugs produce forty-five, twelve drugs produce sixty-six. A physician with twelve minutes per visit cannot manually cross-reference forty-five potential interactions against a database of hundreds of thousands of records. A base LLM can produce fluent answers, but it cannot guarantee that every pair was checked, cannot cite a specific source record with a traceable ID, and cannot distinguish *no known interaction* from *no data available* — and the last failure is the most dangerous in clinical decision support, because confident silence is indistinguishable from confident correctness. PharmGuard was built to close the three gaps architecturally rather than to ask the LLM to be more careful.

## Architecture

The pipeline is a four-stage plan-retrieve-generate loop where the first three stages are deterministic and the LLM is invoked only at stage four — where its value is fluent clinical prose, the actual deliverable.

**Stage 1 — Normalizer.** Free-form user input (brand names, abbreviations, misspellings, mixed case) resolves to a canonical `(generic_name, RXCUI, drugbank_id)` triple via a four-tier fallback: exact match against the merged RxNorm + DrugBank synonym index, then `rapidfuzz` fuzzy match (threshold 85), then live query to the [NIH RxNorm REST API](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html), then explicit "unresolved" reporting. Live API results are session-cached.

**Stage 2 — Planner.** Deduplicates by canonical generic (Lipitor + atorvastatin collapses to one drug) and enumerates unique unordered pairs via `itertools.combinations`. No LLM. Combinatorial enumeration is a closed-form operation where any probabilistic model is strictly worse than a for-loop.

**Stage 3 — Retriever.** Executes the plan against a merged interaction index from TWOSIDES (signal statistics, ~4.6M pair records) and DDInter 2.0 (curated severity labels) via O(1) hash lookup on a sorted-pair key. Per-drug side effects from SIDER + ADE-Corpus-V2. Vector search over WebMD and UCI Drug Reviews supplies unstructured patient-experience context — never used as evidence for an interaction claim. Pairs not in the local index fall back to the OpenFDA FAERS live API, surfacing co-reported adverse-event signals with full traceability. Pairs still uncovered are collected into a `no_data_pairs` field the generator is required to declare explicitly.

**Stage 4 — Generator.** Synthesizes the final report from the evidence bundle under a strict system prompt with four non-negotiable constraints: every clinical claim must include an inline `[SOURCE:RECORD_ID]` citation; no-data pairs must be declared explicitly; no mechanism or severity may be introduced that is not present in retrieved evidence; the Coverage Notes section must accurately reflect the bundle (no inventing coverage). A deterministic fallback produces a fully-cited report with no LLM at all, used in tests and as a safety net.

## Design rationale

The core architectural commitment is **structured retrieval first, semantic retrieval reserved for unstructured context.** The question *does drug A interact with drug B?* is a closed-vocabulary lookup against a sorted-pair key — vector similarity would return records for *similar* pairs, which is not what the clinician needs. Hash lookup is fast, exact, and audit-trailed. Semantic search is reserved for mechanism prose and review context, where it does work the structured indexes cannot. Putting these on different paths is what keeps the FAERS fallback honest: when local indexes return nothing, the system queries a different *kind* of source rather than relaxing the threshold on the same kind.

The **severity threshold derivation from PRR** is a deliberate proxy. TWOSIDES does not carry native severity labels. The system computes severity tiers from proportional reporting ratio: PRR ≥ 10 is Major, ≥ 4 is Moderate, otherwise Minor. The thresholds are documented and recalibratable against DDInter 2.0 if cross-validation access is available. Naming the proxy is what keeps it from becoming a hidden assumption.

The **LLM-provider neutrality layer** is the choice that makes the system durable to model-vendor changes. A unified `complete(system, messages)` API abstracts over Anthropic, OpenAI, and Gemini; auto-detection selects on which API key is present. The deterministic-fallback report path means the system continues operating if every LLM provider is unreachable — degraded to template-rendered citations, but still producing the structured, sourced output a clinician can act on.

## Trade-offs

The PRR-derived severity is a proxy and is honest about being one — but it does mean a manufacturer-labeled severity in DDInter 2.0 can disagree with PharmGuard's tier on the same pair, and the disagreement is currently surfaced by leaving both visible in the report rather than reconciled. The narrow-by-design data sources (peer-reviewed and government-maintained only — no Reddit, no general web scrapes) trades coverage for credibility; pairs missing from all seven sources fall back to FAERS or to explicit `no_data` declaration, which is the right behavior but slower than a system that allows lower-quality sources to fill gaps. LLM-provider neutrality costs a thin abstraction layer and modest provider-quirk handling.

## Outcomes and revisions

The codebase is approximately 2,800 lines of Python across 31 modules. The 48-case evaluation suite covers normalizer fallbacks, plan correctness on overlapping inputs, retrieval coverage on known interactions, FAERS fallback behavior on uncovered pairs, and generator citation discipline. Ingest pipeline produces 302K+ merged interactions across TWOSIDES and DDInter 2.0. The system stitches seven sources into one evidence bundle while preserving per-claim source attribution. The deterministic fallback runs end-to-end with no LLM and produces structurally identical (less fluent) output. The most consequential planned revision is full DDInter 2.0 cross-validation against TWOSIDES-derived severity to recalibrate the PRR thresholds, and adding a UCI-mined patient-side-effect corroboration layer that flags reports where social-media signal contradicts the curated record.

## Pattern connection

This is the disciplined implementation of Chapter 7's Fact Check List Pattern *plus* Chapter 9's Offloading principle. The LLM is structurally prevented from hallucinating enumeration, retrieval, or severity classification by the simple architectural decision to *not invoke it for those steps*. The Coverage Notes section's `no_data_pairs` declaration is the UNCERTAIN state preserved as first-class output.

## Transfer prompt

In your own pipeline, identify every step where you invoke an LLM and ask: is fluent natural language the deliverable here, or is the LLM doing enumeration / lookup / classification that has a closed-form deterministic answer? For each step where the LLM is doing work a for-loop or a hash lookup could do, what does it cost to replace it? What does the system declare when its evidence is missing — and is that declaration distinguishable, in the output, from a confident answer?

---

*Spring 2026.*


---

## A note about AI

PharmGuard is a high-stakes agent — pharmaceutical safety. The cost of confident hallucination is measured in patient harm.

Where the model genuinely helps: producing the standard pharmacovigilance categories and the regulatory framework against which any output must be evaluated.

Where the model does damage: declaring a drug interaction safe or unsafe. The model has read drug-interaction databases and has no privileged access to current evidence.

The rule: regulatory category from the model; the safety call from a pharmacist with a database query and a license.

---

## AI Wayback Machine

**Frances Oldham Kelsey** was FDA reviewer who refused to approve thalidomide in 1960 — establishing the discipline of skeptical pharmaceutical safety review.

**Run this:**

```
Who is Frances Oldham Kelsey, and how does their work connect to the pharmaceutical safety review agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Frances Oldham Kelsey"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Frances Oldham Kelsey's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Frances Oldham Kelsey's framework."

What changes? What gets better? What gets worse?

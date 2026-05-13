# Chapter 31 — Case: SchemaGuard

*A four-stage pipeline that catches the failure mode JSON Schema can't see — semantically incoherent records that pass every type check, with population-level drift detection running orthogonal to per-record validation.*

**Author:** Pragati Narotam
**Editor:** Nik Bear Brown

---

## Situation

Large language models tasked with generating structured JSON produce output that satisfies schema validation while violating domain-specific logical constraints. A patient record with `discharge_date: "2024-08-08"` and `admission_date: "2024-08-15"` passes JSON Schema Draft 7 — every field is present, every type is correct, every format is valid — and is also logically impossible: the patient left seven days before arriving. A loan application with `annual_income: 48000` and `loan_amount: 2500000` passes every numeric range check and produces a 52× loan-to-income ratio that is five times the regulatory maximum. The problem is structural: standard validation tools operate on individual field values, while semantic constraints span multiple fields. The relationship between `discharge_date` and `admission_date` is not expressible in JSON Schema. The constraint that approved amount cannot exceed requested amount is not a type check. SchemaGuard provides the validation layer JSON Schema does not. The system targets four categories of LLM-generated semantic failure — temporal consistency, ratio violations, categorical inconsistencies, silent domain shifts — and is deployed across two regulated domains: healthcare intake (rules HC-001 through HC-005) and financial loan applications (FN-001 through FN-005).

## Architecture

A four-stage sequential pipeline processes each record. **Stage 1 — Structural Validation.** JSON Schema Draft 7 checks types, formats, and required fields. PASS proceeds; FAIL quarantines with score 0.0. **Stage 2 — Semantic Validation.** Ten cross-field rules evaluate temporal ordering, ratio plausibility, and categorical consistency. Each violation carries a severity classification: `critical` or `warning`. **Stage 3 — Confidence Scoring.** `score = 1.0 − Σ(penalties)`, where critical violations subtract 0.30 and warnings subtract 0.12. **Stage 4 — Decision Router.** Three-tier routing: ≥0.85 → `trusted`, 0.50–0.84 → `flagged`, <0.50 → `quarantined`. Per-record JSONL audit trace is written for every decision.

The codebase organizes into independent packages: `schemas/` (JSON Draft 7 domain schemas), `rules/` (registry plus two rule files with severity metadata), `validator/` (pipeline orchestration, batch processing, explanation, audit), `drift/` (baseline plus four-signal detector), `scoring/` (confidence and decision), `rag/` (FAISS vector store + retriever + RAG explainer), `api/` (FastAPI REST endpoints with Swagger), `data_gen/` (synthetic dataset pipeline), `evaluation/` (classification metrics, latency, drift charts).

The **batch and drift path** runs orthogonally. After per-record processing, aggregated results — confidence scores, violation counts, decision distribution — are compared against a stored statistical baseline using four drift signals: **z-score** (normalized shift in numeric field means), **Population Stability Index** for categorical field distributions (threshold 0.20), **null-rate delta** (threshold 15%), and **violation-rate delta** per rule (threshold 10%). A batch can consist entirely of `trusted` records and still trigger a drift alert if the population distribution has shifted.

The **RAG extension** sits alongside the core pipeline, invoked explicitly via `/rag/explain`. It does not modify confidence scores or routing decisions. Given a failed record and its violated rules, it retrieves the three most relevant chunks from a FAISS index over 11 synthetic-but-realistic reference documents covering CMS, HL7 FHIR, ICD-10, CFPB ATR, Regulation Z, and ECOA, builds an augmented prompt, and calls Claude to generate a grounded explanation.

## Design rationale

The architectural commitment that earns the system's name is **separating per-record validation from population-level drift detection** as orthogonal pipelines. Per-record validation catches the impossible-discharge-date case and the 52× loan-to-income case. Population-level drift detection catches the case no per-record check can observe: a model's output distribution shifting gradually over time toward younger patient populations, higher income brackets, or unfamiliar diagnosis codes — silent failures that pass every individual record's validation while corrupting the dataset's distributional properties. Running both as separate but composed paths (per-record routing produces individual decisions; drift detection produces batch alerts) lets SchemaGuard report *this batch is all trusted records and the population is drifting* — a verdict no single-layer validator can produce.

The **severity-weighted confidence scoring with a three-tier router** is the second consequential design move. A binary trusted/quarantined gate would lose the case where a record carries one warning-level violation that doesn't cross the quarantine threshold but warrants review. The middle `flagged` tier preserves the architecturally critical UNCERTAIN state. Severity is encoded in the rule registry, not in the prompt — adding a rule means specifying its category and severity in metadata, not editing a downstream classifier.

The **RAG explanation path as an explicit, separate endpoint** is the third move. The author resists the temptation to fold RAG explanations into the per-record routing decision. The explainer cites CMS, HL7 FHIR, Regulation Z by section number when explaining why a record was flagged — but it does so on demand, after the deterministic pipeline has already routed the record. The deterministic decisions and the explanatory text live on different paths because their failure modes are different: a wrong RAG explanation is a documentation error; a wrong routing decision is a data-quality bug.

## Trade-offs

The 10-rule rule registry is curated for two domains and would expand to support additional domains; rule authoring is a real maintenance surface. JSON Schema Draft 7 was selected for tool compatibility but constrains expressivity — newer drafts support some cross-field constraints natively. The drift detection thresholds (PSI 0.20, null-rate 15%, violation-rate 10%) are calibrated rather than learned and need re-calibration when the population's natural variance changes. The RAG corpus is 11 synthetic-but-realistic reference documents; production deployment would require either licensed access to canonical regulatory text or a curated extract verified by domain counsel.

## Outcomes and revisions

Evaluation across **16 labeled seed records and 140 real audit-log records**:

| Metric | Result |
| --- | --- |
| Precision | **1.0** (both domains) |
| Recall | **1.0** (both domains) |
| F1 | **1.0** (both domains) |
| False-quarantine rate | **0%** |
| Median validation latency | **0.09 ms** |
| Throughput | ~3,800 records/sec |
| RAG explanation quality (deterministic baseline) | 2.7/6 |
| RAG explanation quality (with retrieved citations) | **6.0/6** |

The 1.0 precision/recall/F1 figures are bounded by the seed-and-audit-log evaluation set's size; the project documents this honestly and the planned next step is broadening to a larger labeled corpus and a paired evaluation with human regulators to measure inter-rater agreement on the `flagged` tier specifically. The RAG explanation lift — from 2.7/6 to 6.0/6 — is the contribution the chapter cares about: every RAG explanation cites the relevant regulation or clinical standard by section number, which is the discrimination shape that turns "explanation" into "audit-defensible justification."

## Pattern connection

SchemaGuard instantiates Chapter 7's Fact Check List Pattern (severity-weighted three-tier routing preserves PASS / FAIL / UNCERTAIN with `flagged` as the explicit middle state), Chapter 9's Caching pattern (FAISS index over reference documents, persisted, queried selectively), and a smaller pattern worth naming: **per-record decisions and population-level signals on orthogonal paths**. When a system processes a stream of records, individual-record validation and aggregate-distribution drift detection address different failure modes — combining them in one decision pipeline mixes two correctness properties; running them as separate composed paths preserves both.

## Transfer prompt

In your own LLM-generated structured-output system, what failure mode passes JSON Schema validation but is logically impossible? When you validate per-record, do you also have a population-level drift detector that runs on aggregated batches — or are you blind to gradual distribution shifts? When your validator returns a confidence score, does it route into a binary or three-tier decision — and if binary, where does the "I'm not sure" case go?

---

*Spring 2026.*


---

## A note about AI

SchemaGuard validates data schemas. The model can produce schemas and validate them — same architecture, both directions.

Where the model genuinely helps: enumerating the canonical schema-evolution failure modes (silent type drift, dropped fields, breaking renames).

Where the model does damage: declaring two schemas compatible. Compatibility is a property of every downstream consumer, which the model cannot enumerate.

The rule: failure-mode catalog from the model; compatibility check against the actual consumers.

---

## AI Wayback Machine

**Edgar F. Codd** was invented the relational data model in 1970 — defining the constraints and normalization rules that modern schema validation still uses.

**Run this:**

```
Who is Edgar F. Codd, and how does their work connect to the schema validation agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Edgar F. Codd"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Edgar F. Codd's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Edgar F. Codd's framework."

What changes? What gets better? What gets worse?

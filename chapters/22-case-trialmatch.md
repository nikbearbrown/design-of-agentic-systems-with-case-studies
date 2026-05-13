# Chapter 22 — Case: TrialMatch AI

*An eight-agent pipeline that matches patients to clinical trials across live government APIs, with a Controller that picks fine-tuned models when they're available and falls through to LLMs when they aren't.*

**Author:** Abhinav Kumar Piyush
**Editor:** Nik Bear Brown

---

## Situation

[ClinicalTrials.gov](https://clinicaltrials.gov/) lists more than 460,000 studies; eligibility criteria for any one trial may run 30–50 lines of dense clinical prose with intricate biomarker, prior-therapy, and lab-value constraints. Patients and clinicians who want to know *am I eligible for this study* face an asymmetric problem: criteria are written for trial coordinators, not patients; matching by hand is hours per trial; matching across hundreds of candidate trials at once is the work of weeks. A single LLM prompt can produce a fluent summary and an unreliable verdict — the criteria parsing fails on the corner cases that decide eligibility, drug interactions go uncaught when medications are listed in brand-name form, and the patient's own information arrives via three different modalities (typed text, voice dictation, scanned medical-document images) that a single-prompt system has to flatten into one input shape. TrialMatch AI is a controller-driven multi-agent system that takes the multimodal patient profile, retrieves trials from live government APIs, parses eligibility criteria with LoRA-fine-tuned BioBERT models, cross-checks drug interactions via OpenFDA, and produces ranked results with per-criterion audit trails.

## Architecture

Eight specialized agents coordinated by a **Controller** (Agent 0). **Agent 1 — Entity Extractor** runs medical NER on the patient profile via a LoRA-fine-tuned BioBERT or fallback LLM, normalizing drug names through RxNorm. **Agent 2 — Voice Processor** transcribes audio via OpenAI Whisper and extracts structured entities. **Agent 3 — Image Analyzer** runs EasyOCR/Tesseract plus a Vision LLM on medical-document images. Agents 1–3 run in parallel via `ThreadPoolExecutor`. **Agent 4 — Trial Retriever** hybrid-searches ClinicalTrials.gov v2 plus a Qdrant vector store with per-criterion chunking ([INCLUSION] / [EXCLUSION] tagged). **Agent 5 — Criteria Parser** decomposes eligibility into structured rules; LoRA fine-tuned model if present, LLM few-shot if not; the Controller monitors criterion coverage and retries if below 70% (max 2 retries). **Agent 6 — FDA Cross-Checker** queries OpenFDA and a local CYP3A4 interaction database. **Agent 7 — Eligibility Scorer** computes match percentages, generates explanations, builds audit trails, and produces PDF, CSV, JSON, and gTTS-spoken audio outputs.

The Controller has five sub-modules: Planner (generates an `ExecutionPlan` from inspected inputs), Router (groups agents into parallel and sequential batches), Model Selector (scans `fine_tuning/models/` for `config.json` and selects fine-tuned weights when available), Monitor (checks criterion coverage after the Parser), and Retry Logic. Every Controller decision logs to `controller_decisions`.

## Design rationale

The architectural commitment that earns the system's name is **the Controller picks the model for the task at runtime, not at design time.** Two BioBERT models are LoRA-fine-tuned for the Criteria Parser and the Medical NER agent — narrow tasks where domain fine-tuning produces measurable gains over a general-purpose LLM at meaningfully lower per-call cost. But the LLM fallback is preserved as a first-class path, because a fine-tuned model that doesn't ship — or ships and underperforms its 70%-coverage gate on a particular trial — is not a model worth committing to without an escape hatch. The Model Selector reads from disk, the Monitor checks coverage, and the Retry Logic re-runs with the alternative strategy. Two coordination patterns coexist by deliberate design: *use the cheap specialist when it works, the general model when it doesn't, and tell me which one you used.*

The **per-criterion audit trail** is the second consequential design move. The Criteria Parser doesn't just emit *eligible* / *ineligible*; it tags each criterion with `[INCLUSION]` or `[EXCLUSION]`, evaluates each one against the patient profile separately, and the Eligibility Scorer composes the per-criterion verdicts into the final match percentage. A patient or clinician can see *exactly* which criterion drove the verdict, and if a criterion is unevaluable (insufficient profile data), the system surfaces an explicit warning rather than silently defaulting to *eligible* or *ineligible*. Fail-loud over silent default is the chapter's discipline made operational.

The **multimodal merge with field-level conflict resolution** is the third move. Voice transcription and image OCR may produce conflicting values for the same field — *50 mg* in the typed profile, *5 mg* in the OCR'd discharge sheet, *fifty milligrams* in the voice dictation. Each field arrives with a confidence score; conflict resolution keeps the higher-confidence value and surfaces both for review. A single-modality system would never see the conflict; a multimodal system that merged blindly would propagate it.

## Trade-offs

The eight-agent architecture introduces orchestration overhead that simpler workflows would avoid — typical end-to-end runtime is several seconds per match, with parallel extraction reducing the worst case but not eliminating it. The Qdrant vector store needs ingestion before it earns its place over keyword API matches alone; the Data Ingestion page supports this but it's a one-time setup cost. LoRA fine-tuning required Google Colab T4 hardware and ~225–300 annotated examples per task — feasible for a course project, replicable but not trivial. The CYP3A4 interaction database is local and curated; coverage is bounded by what's been added.

## Outcomes and revisions

LoRA fine-tuning configuration and measured outcomes:

| Model | Base | Task | LoRA rank/alpha | Trainable params | Training examples | Epochs | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Criteria Parser | `dmis-lab/biobert-v1.1` | 6-class sequence classification | 16 / 32 | ~0.5% (~300K of 110M) | 225 annotated criteria | 15 | 82.2% accuracy, 0.75 weighted F1 |
| Medical NER | `dmis-lab/biobert-v1.1` | 14-class BIO token classification | 16 / 32 | ~0.5% (~300K of 110M) | 300 annotated clinical texts | 20 | 1.0 seqeval span-level F1 |

The 14-entity NER taxonomy covers AGE, SEX, CONDITION, STAGE, BIOMARKER, MEDICATION, ECOG, LAB_VALUE, PRIOR_THERAPY, RESPONSE, COMORBIDITY, ALLERGY, METASTATIC_SITE, DRUG_INTERACTION. Six Streamlit pages provide specialized flows for matching, analytics, benchmarking, data ingestion, synthetic generation, and multimodal input. The most consequential planned revision is broader criteria-language coverage (international trials, non-English original eligibility text) and a clinician-supervised validation study against curated patient–trial pairs to measure end-to-end matching accuracy rather than per-component metrics alone.

## Pattern connection

TrialMatch instantiates Chapter 9's Offloading and Isolation principles (eight scoped agents, each with a typed contract; parallel where independent; the Controller's `ExecutionPlan` keeps the per-agent state out of any single mega-prompt) and Chapter 12's framework-correctness argument (the LoRA-vs-LLM model selection happens *architecturally* through the Controller's Model Selector, not behaviorally through a runtime prompt instruction).

## Transfer prompt

In your own multi-agent system, does your controller log every routing decision and the reason it was made, or do you discover later that you have no idea why a particular request took the path it did? When a fine-tuned model is available *and* a general-purpose model is available, what is the rule for choosing between them at runtime — and what is the fallback when the chosen model underperforms a coverage gate on a specific input?

---

*Spring 2026.*


---

## A note about AI

TrialMatch matches patients to clinical trials. The cost of a bad match is real — patients can be enrolled in unsuitable studies or excluded from suitable ones.

Where the model genuinely helps: structuring patient eligibility against published trial criteria.

Where the model does damage: making the actual match decision. Eligibility decisions depend on the clinician's interpretation of the patient's chart, which the model does not have.

The rule: structure from the model; eligibility call from the clinical investigator.

---

## AI Wayback Machine

**Janet Wittes** was biostatistician who built much of modern clinical-trial design infrastructure — including data safety monitoring boards.

**Run this:**

```
Who is Janet Wittes, and how does their work connect to the clinical trial matching we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Janet Wittes"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Janet Wittes's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Janet Wittes's framework."

What changes? What gets better? What gets worse?

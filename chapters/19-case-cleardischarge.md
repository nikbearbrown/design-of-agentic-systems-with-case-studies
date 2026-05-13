# Chapter 19 — Case: ClearDischarge

*Translating discharge summaries to Grade-6-to-8 patient action plans through a five-stage pipeline with a dual-gate readability check.*

**Authors:** Rahul Reddy, Rohan Reddy
**Editor:** Nik Bear Brown

---

## Situation

About [36% of U.S. adults have basic or below-basic health literacy](https://nces.ed.gov/pubs2006/2006483.pdf), and the consequences live in the discharge folder. A patient leaves a hospital with five medications, three restrictions, two follow-up appointments, and a paragraph of red-flag symptoms — printed in clinical register, organized for the chart and not for the patient. Medication errors, missed follow-ups, and preventable readmissions follow. ClearDischarge takes the same discharge document and produces a plain-language patient action plan written at a Grade 6-to-8 reading level, cross-checked against the FDA drug interaction database, and wrapped with a visual medication schedule the patient can pin to a refrigerator. The architectural premise is that *plain language* is not a stylistic preference — it is a measurable property with a verification gate, and the system enforces it the way a credit-card processor enforces a checksum: at the boundary, twice, with a retry loop.

## Architecture

The pipeline is five stages, executing end-to-end in 3–8 seconds depending on medication count. **Stage 1 — Extractor.** A LLaMA 3.3 70B call via Groq parses the discharge summary into a structured JSON object: `primary_diagnosis`, `medications` (name, dose, frequency, route, with_food), `restrictions`, `red_flags`, `follow_ups`. A post-extraction validator issues warnings for missing meds, missing red flags, or missing follow-ups. **Stage 2 — Drug Checker.** Queries the [OpenFDA drug interaction API](https://open.fda.gov/apis/drug/) for every medication pair. Source URLs are preserved for citation. **Stage 3 — RAG.** Six curated patient-education documents covering heart failure, diabetes, pneumonia, surgery recovery, hypertension, and medication safety, chunked at paragraph level (max 500 chars, 100-char overlap), embedded with `all-MiniLM-L6-v2`, stored in persistent ChromaDB. The retrieval query is composite — diagnosis plus medication names — and retrieved chunks display with confidence-weighted relevance bars (ChromaDB distances normalized to 0–100%). **Stage 4 — Generator.** A second LLM call produces the plain-language action plan with section structure: medications, drug alerts, restrictions, red flags, follow-ups, daily checklist. RAG context injects dynamically into the prompt. **Stage 5 — Multimodal output.** A matplotlib grid maps medications to four time slots (morning, afternoon, evening, bedtime), color-coded blue for standard doses and orange for take-with-food. Exported as PNG and printable PDF. Alarm-time suggestions group medications by slot.

The OCR input path runs ahead of Stage 1: scanned PDFs are detected by a heuristic (pypdf text extraction returning fewer than 50 chars triggers OCR fallback), passed through `pytesseract.image_to_data()` with confidence scoring. Pages with average confidence below 50% receive a quality warning surfaced to the user.

## Design rationale

The architectural commitment that earns the system's name is the **dual-gate readability check**. A single Flesch-Kincaid score would catch the gross failures (medical jargon, long sentences, complex syntax) and miss the subtle ones (a sentence at Grade 7 by formula but containing *prophylaxis* unexpanded). ClearDischarge runs Flesch-Kincaid in parallel with a fine-tuned DistilBERT classifier trained on 100 examples (40 curated PASS / FAIL plus 60 template-augmented). If *either* gate fails, the generation retries up to three times with progressively simpler-language instructions. The two gates check different properties: the formula checks readability *as quantity*; the classifier checks readability *as judgment*. Combining them is what makes the *Grade 6–8* target operational rather than aspirational.

The **Component-4-to-5 loop** is the second consequential design move. Synthetic data generation (8 diagnosis categories × 3 complexity tiers × 5 formatting styles) feeds the augmentation templates that produce the 60 additional PASS / FAIL training examples for the readability classifier. The synthetic-data step is not pretraining decoration — it is the source of the labeled examples the classifier needs to do its job. Naming this loop as a deliberate architectural feature (rather than two separate components that happen to coexist) is what lets the system improve the classifier whenever the synthetic generator is updated.

The **OCR confidence threshold at 50%** is the choice that prevents the most insidious failure mode in this domain: a scanned discharge summary OCR'd noisily, with a digit transposition turning "5 mg" into "50 mg," producing a confidently wrong action plan that no downstream gate can recover. Surfacing the OCR confidence warning to the user — and refusing to silently proceed on low-confidence pages — preserves the architectural distinction between *the system processed your document* and *the system processed something it could read*.

## Trade-offs

The system's correctness budget is concentrated in the readability gate at the cost of latency and retries — a generation that fails Flesch-Kincaid or the DistilBERT classifier triggers up to three retries, adding 1–9 seconds in the worst case. The OpenFDA API introduces a hard external dependency and the per-pair query pattern produces N(N−1)/2 calls per discharge — fine for the typical 3–7-medication case, slow at the upper bound of 12 medications. RAG knowledge base coverage is six condition documents; conditions outside that set fall through to no-RAG-context generation, which still produces output but loses the condition-specific guidance. The 100-example DistilBERT training set is small, and the documentation acknowledges this; the augmentation loop is the planned expansion path.

## Outcomes and revisions

Evaluation on the five built-in sample cases (`evaluate.py --sample`): **medication recall 0.967, restriction recall 0.923, red-flag recall 0.941, hallucination rate 0.000, average reading grade 5.2, cases meeting grade target 100%, RAG context used 100%, ML model used 100%, drug interactions found 4.** Pipeline timing: extraction 1–2s, drug check 0.5–2s, RAG retrieval 0.1–0.5s, generation 1–3s, multimodal output negligible. The hallucination rate of 0.000 is across the five-sample suite — a small evaluation, but the constraint that produced it (extraction prompt rule: only output information present in the source document) is what generalizes. The most consequential planned revision is expanding the RAG knowledge base to twenty-plus conditions and producing an inter-rater readability evaluation against three nurse readers reviewing the same outputs.

## Pattern connection

ClearDischarge instantiates Chapter 7's Fact Check List Pattern (zero-hallucination via extractor's source-only constraint) and Chapter 9's Offloading principle (every stage's output is structured JSON written to session state, not threaded through a single growing prompt). The dual-gate readability check is a small but important pattern in its own right: when a property has both a formula-checkable component and a judgment-checkable component, combining them is more robust than either alone.

## Transfer prompt

In your own pipeline, identify a property the system claims to enforce (readability, format compliance, citation discipline). Is it gated by *one* check or *two*? If one, what failure mode is the gate not catching? When external OCR or transcription is in your input path, what does your system do at low confidence — and is that visible to the user, or silent?

---

*Spring 2026.*


---

## A note about AI

ClearDischarge automates the hospital discharge process. Discharge is where care transitions fail catastrophically; the model can produce discharge summaries that look complete.

Where the model genuinely helps: structuring the discharge checklist against published handoff standards.

Where the model does damage: producing the actual medication reconciliation. A wrong dose or missing allergy in a model-generated discharge is a patient-safety event.

The rule: structure from the model; clinical detail from the actual chart, verified by a clinician.

---

## AI Wayback Machine

**Atul Gawande** was surgeon whose Checklist Manifesto reshaped how hospitals handle high-stakes handoffs like discharges.

**Run this:**

```
Who is Atul Gawande, and how does their work connect to the hospital discharge agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Atul Gawande"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Atul Gawande's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Atul Gawande's framework."

What changes? What gets better? What gets worse?

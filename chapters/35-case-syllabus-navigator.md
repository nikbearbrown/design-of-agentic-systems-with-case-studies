# Chapter 35 — Case: Syllabus Navigator

*An academic compliance auditor that catches the silent failures everyone misses — Thursday-October-12th-is-actually-Wednesday and the grading scale that contradicts the university standard — by grounding LLM judgments in retrieved policy text.*

**Author:** Udit Chaturvedi
**Editor:** Nik Bear Brown

---

## Situation

A student loses marks on an assignment because the syllabus listed the due date as *Thursday, October 12th* — and October 12th was a Wednesday. A teaching assistant applies the wrong grading scale because the syllabus contradicts the university standard. A late-work policy in section 4 of the syllabus contradicts a different late-work policy in section 9. These are silent failures: errors in academic documents that no one catches until they cause real harm. Base language models fail at this task in a specific and consequential way — they act as yes-men, faithfully summarizing a flawed syllabus without questioning its internal consistency or cross-referencing it against authoritative policy sources. The Syllabus Navigator addresses this gap by treating each syllabus as a *document under audit* rather than a document being summarized, and by grounding every audit judgment in retrieved policy chunks rather than the model's parametric memory of what an academic policy generally says. The system audits six real Northeastern University MGEN program syllabi from Spring 2025. No synthetic or fabricated documents — using real materials is a deliberate choice that ensures the system's findings are genuine and demonstrable, not artifacts of a contrived test case.

## Architecture

A two-stage pipeline. **Stage 1 — RAG Pipeline.** Six syllabus PDFs ingest via `pypdf` (UIUX syllabus, for example, yields 17,446 characters across 9 pages). A custom Python text chunker splits raw text into 500-character chunks with 50-character overlap — overlap deliberately prevents policy rules or due dates that fall at chunk boundaries from being split and missed. Each chunk converts to a dense vector embedding via [Google's `text-embedding-004`](https://ai.google.dev/gemini-api/docs/embeddings). Embeddings are stored in a [FAISS](https://github.com/facebookresearch/faiss) (Facebook AI Similarity Search) vector index. **Stage 2 — Inference.** The system queries the index with the string *"late work policy attendance deadline grading"* to retrieve the top-5 most relevant policy chunks. The audit prompt combines the syllabus text (truncated to 6,000 characters), the official policy text, and the RAG-retrieved chunks. The model is Gemini 2.5 Flash at **temperature 0** — the same syllabus always produces the same flags, making the system reproducible and testable.

The audit prompt assigns Gemini the role of *a strict academic compliance auditor for Northeastern University* and instructs it to check for four explicit issue categories: **MISSING INFO**, **POLICY CONFLICT**, **DATE ISSUE**, **GRADING ISSUE**. Output format is enforced inline: `FLAG [number]: [ISSUE TYPE] / Description / Location / Severity (HIGH / MEDIUM / LOW)`. A summary table aggregates results across all six courses.

The corpus indexed: 6 syllabi, ~39 policy-corpus chunks, ranging from 27 chunks (DAMG 6210, 11,847 characters, 6 pages) to 39 chunks (UIUX, 17,446 chars, 9 pages).

## Design rationale

The architectural commitment that earns the system's name is **dual grounding** — the audit prompt includes *both* the official policy text *and* the RAG-retrieved chunks. A naive design would inject only the retrieved chunks as context, which would work for queries the chunks happen to cover and fail for queries where the policy is more general than what the retriever surfaced. Including the full official policy alongside the retrieved chunks gives the model a permanent reference and lets the retrieved chunks function as *salience* rather than as the only source. The combination is what produces the 100% per-course recall reported in the outcomes section.

The **enforced four-category issue taxonomy** is the second consequential design move. A free-form audit prompt would let the model invent novel issue types, producing outputs incomparable across the six audits. Naming the four categories explicitly — MISSING INFO, POLICY CONFLICT, DATE ISSUE, GRADING ISSUE — caps the inventiveness and makes the output programmatically aggregatable. The hallucination guard sentence *"Be specific. Be critical. Do not make up issues that don't exist"* is a small but consequential prompt-engineering choice; the author reports it significantly reduces false positives compared to prompts without it.

The **temperature 0 commitment** is the third move. Reproducibility is a non-negotiable property for a compliance tool. A teaching assistant who runs the auditor on a syllabus on Monday and again on Thursday must get the same flags. Temperature 0 with a fixed-seed embedding model and a deterministic retrieval depth is what makes the audit *testable* — the same input always produces the same output, which is the property that lets the auditor be regression-tested against ground truth.

The **6-course evaluation against real Northeastern syllabi** is the fourth move. Real documents catch failure modes synthetic documents would not — the 5-minute grace period for late submissions in one course's policy section that contradicts the 0-minute grace period stated in the same course's grading section. The Spring 2025 cohort actually lived through these documents. The audit's findings are real findings.

## Trade-offs

The 6,000-character syllabus truncation rules out audits of very long syllabi without modification — most MGEN syllabi fit comfortably under this cap, but a chemistry course with detailed weekly modules might not. The four-category taxonomy is curated for academic syllabi and would need expansion (e.g., an ACCESSIBILITY ISSUE category) for broader coverage. The 67.7% overall precision means roughly one in three flags is a false positive on review — the system errs on the side of surfacing potential issues rather than missing them, the right trade for an auditor whose output a human reviews. Gemini Flash on Google AI Studio's free tier is the right call for a course project and a real maintenance surface for production deployment.

## Outcomes and revisions

Audit across six real Northeastern MGEN syllabi:

| Metric | Result |
| --- | --- |
| Syllabi audited | **6** |
| Total flags raised | **31** |
| Confirmed violations on review | **21** |
| Recall per course | **100%** |
| Overall precision | **67.7%** |
| HIGH-severity flags | 22 |

100% per-course recall means *every confirmed violation in the syllabi was surfaced by the auditor* — the system did not silently miss a real failure. The 67.7% precision means roughly one in three flags was a false alarm on human review, which is the conservative-bias trade the author made deliberately. The 22 HIGH-severity flags are the discriminating output: these are the date-mismatches and policy-conflicts that would cause real student harm if not caught. The most consequential planned revision is broadening the policy corpus beyond MGEN syllabi to other Northeastern programs and adding inter-rater agreement evaluation against department-level human auditors.

## Pattern connection

Syllabus Navigator instantiates Chapter 7's Fact Check List Pattern (RAG-grounded audit with explicit four-category taxonomy and HIGH/MEDIUM/LOW severity tiers preserves the verdict structure) and Chapter 9's Retrieval principle (chunked policy content embedded once, queried selectively with overlap-aware chunking that prevents boundary loss). The temperature-0 reproducibility commitment is a small pattern worth naming: **compliance tools must be deterministic by construction**, because a non-reproducible auditor cannot be regression-tested against ground truth.

## Transfer prompt

In your own audit-or-compliance system, when the model receives retrieved context as evidence, do you also include the full canonical policy text — or rely entirely on what retrieval surfaces? When you define an issue taxonomy, is it enforced through the prompt's structure or left to the model's invention? When your tool's output will be reviewed by a human, do you bias toward false positives (catch everything, accept noise) or false negatives (clean output, accept silent misses)?

---

*Spring 2026.*


---

## A note about AI

Syllabus Navigator helps students navigate course material. The model can read a syllabus and produce reasonable next-step recommendations.

Where the model genuinely helps: producing the structural reading of a syllabus — prerequisites, dependencies, assessment weight.

Where the model does damage: producing personalized recommendations as if the model understood the student's specific situation. It does not.

The rule: structure from the model; personalization from a human advisor or the student's own self-knowledge.

---

## AI Wayback Machine

**Benjamin Bloom** was educational psychologist whose taxonomy of learning objectives (1956) still structures how syllabi sequence knowledge and skills.

**Run this:**

```
Who is Benjamin Bloom, and how does their work connect to the syllabus design agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Benjamin Bloom"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Benjamin Bloom's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Benjamin Bloom's framework."

What changes? What gets better? What gets worse?

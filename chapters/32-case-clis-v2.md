# Chapter 32 — Case: CLIS V2

*A clinical literature intelligence system where every architectural decision maps to a specific failure mode in evidence-based medicine — and the test suite includes a hallucination trap designed to fail safely when the LLM fabricates studies.*

**Author:** Hritik Hassani
**Editor:** Nik Bear Brown

---

## Situation

Physicians are expected to practice evidence-based medicine; the practical reality of searching and evaluating literature in a 15-minute patient visit is almost impossible. Published studies estimate that a single well-constructed PubMed search — formulating the query, scanning results, reading abstracts, grading evidence quality, reconciling conflicting findings — takes a physician 16+ minutes. PubMed contains over 35 million peer-reviewed biomedical articles, growing by approximately 4,000 new papers daily. A physician treating a patient with type 2 diabetes, chronic kidney disease, and heart failure faces a question that spans dozens of intersecting bodies of evidence. Off-the-shelf LLMs (ChatGPT, Claude, Gemini) confidently fabricate clinical studies, cite trials that do not exist, and produce plausible-but-false statistics. In medicine, a hallucinated drug dose or a fake trial result is not a rounding error — it is a patient safety event. CLIS V2's design constraint is direct: *if the system cannot tell the difference between a real PubMed article and a fabricated one, it must not be used in a clinical setting.* Every architectural decision in the system flows from that constraint.

## Architecture

A four-layer system. **Layer 1 — Presentation** is a single Streamlit application (`app.py`) exposing all functionality through five tabs. **Layer 2 — Application Services** orchestrates five components: Query Processor (PICO parsing + context classification), UCB Bandit (context-aware arm selection over query strategies), REINFORCE Ranker (re-ordering articles by predicted clinical utility), GRADE Evaluator (evidence quality grading A/B/C/D), Citation Grounder (per-sentence claim verification). **Layer 3 — Intelligence** runs the RAG Engine (unified retrieval for live PubMed via [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/) and indexed ICD-10 corpus), LLM Synthesis (Groq Llama 3.3 70B with deterministic fallback), and RL Policy Store (trained UCB and REINFORCE policies persisted to SQLite and `.pkl` files). **Layer 4 — Data Sources** — PubMed live (no caching beyond the active session), CMS ICD-10-CM FY2024 Guidelines (47 sections TF-IDF indexed at build time), trained RL models bundled with the app, SQLite for persistent bandit state plus RLHF feedback plus cached grade assessments.

The reinforcement-learning stack has three components. The **UCB contextual bandit** chooses query strategies (MeSH-term + RCT filter, plain keyword search, others) per query context — drug efficacy, diagnostic, prognosis. **REINFORCE policy gradient** re-ranks retrieved articles for predicted clinical utility. **Real-time RLHF** captures physician feedback on returned articles and updates both policies. The **per-sentence citation grounder** uses Jaccard similarity (chosen deterministically over embedding-based grounding because lexical fabrication needs to be detectable, not just semantic drift).

## Design rationale

The architectural commitment that earns the system's name is **fail loudly, never silently fall back to simulated data**. An earlier CLIS iteration had a `simulate_articles()` fallback for cases when live PubMed returned nothing. This was removed. The reasoning is the chapter's discipline applied directly: clinical AI fails safely only if it fails loudly. A silent fallback to simulated data creates exactly the failure mode the system exists to prevent. The current behavior: if live PubMed returns nothing, the UI shows a clear empty-state error rather than an invented list. The decision is named, documented, and built into the test suite — TC10 of the in-app benchmark dashboard is an explicit **hallucination trap** designed to fail safely when the LLM fabricates studies. A test case that passes by *not producing a confident wrong answer* is the architectural property the chapter calls UNCERTAIN-as-first-class output.

The **algorithm-choice rationale documented per component** is the second consequential design move. UCB over ε-greedy because of the proven O(√(t log t)) regret bound and auto-reducing exploration as confidence grows. REINFORCE over DQN because the action space is small (≤6 articles per query) and convergence in hundreds of episodes is sufficient. Jaccard over embedding similarity for grounding because Jaccard is deterministic, auditable, and catches lexical fabrication that embeddings would smooth over. TF-IDF over PubMedBERT for the ICD-10 corpus because the 47-section corpus is keyword-heavy and 440MB BERT weights violate the zero-cost infrastructure constraint. SQLite over ChromaDB for bandit state because bandit state is transactional, not a vector-search problem. Each choice is specific, traceable, and reversible.

The **continuous in-app benchmarking** is the third move. Ten ground-truth test cases, including the hallucination trap, run continuously against the system and surface in a dashboard tab. The architecture is its own evaluation harness, not a system that ships with one external benchmark and forgets it.

## Trade-offs

The free-tier infrastructure ($0 cost via Groq + NCBI E-utilities) trades latency-floor and rate-limit headroom for any team contemplating production deployment under sustained clinical load. The Jaccard-grounding choice is correct for catching lexical fabrication and weaker than embedding similarity for catching semantic drift — the right trade for the corpus's named failure mode. Live-retrieval-only commits to API uptime; an extended NCBI outage degrades the system to its empty-state error rather than to cached results, which is the discipline rather than the bug. The 4,548 lines of code across app, tools, and notebooks is a real maintenance surface; the documentation makes module ownership explicit.

## Outcomes and revisions

| Metric | Result |
| --- | --- |
| UCB bandit improvement | **+4.01%** (p=0.0048, Cohen's d=2.735, large effect) |
| Arm identification accuracy | **100%** (all 4 contexts, all 5 seeds) |
| REINFORCE loss reduction | **72.6% ± 5.7%** (5 seeds × 300 episodes) |
| Benchmark test cases | **10/10 passing** (incl. hallucination trap TC10) |
| GRADE grading accuracy | **100%** vs ground truth |
| ICD-10 coverage | **47 sections** (CMS ICD-10-CM FY2024) |
| Code size | ~4,548 lines |
| Infrastructure cost | **$0** |

The +4.01% UCB improvement with Cohen's d=2.735 and p=0.0048 is statistically significant by conventional thresholds. The 100% arm-identification across 4 contexts and 5 seeds is the bandit doing what it's supposed to do — converging on the right query strategy per context. The 10/10 benchmark including TC10 means the hallucination-trap test is passing by failing safely when the system is presented with a query designed to elicit fabrication. The most consequential planned revision is broadening the benchmark from 10 cases to a clinically-validated test corpus and introducing a second grounding pass that uses embedding similarity *in addition* to Jaccard, with disagreement between the two surfaced rather than reconciled.

## Pattern connection

CLIS V2 instantiates Chapter 7's Fact Check List Pattern (Citation Grounder enforces per-sentence verification, no-evidence cases route to empty-state error rather than confident answer), Chapter 12's framework-correctness argument (the architecture's correctness property — *no fabricated study reaches a clinician* — is enforced by the live-retrieval-only commitment plus the per-sentence grounder, not by prompt-level instructions to the LLM), and a smaller pattern worth naming: **the system that contains its own hallucination-trap test**. When the architecture exists to prevent a specific failure mode, the test suite needs a case constructed to elicit that failure — and the system passes the case by *not producing the bad output*.

## Transfer prompt

In your own clinical-or-equivalent-stakes system, what does the architecture do when the upstream evidence source returns nothing — falls back silently to a simulated or cached result, or fails loudly with an empty-state error? Is your test suite verifying that the system *produces* correct output, or also that it *refuses* to produce confident wrong output when prompted to fabricate? When you choose between two algorithms, do you document which failure mode each one catches and which one it would miss?

---

*Spring 2026.*


---

## A note about AI

CLIs-v2 is about command-line interface design and operation. The model produces CLI conventions readily and has no view of your users.

Where the model genuinely helps: producing the canonical UX principles for CLI design (argument ordering, exit codes, output streams).

Where the model does damage: choosing your specific flag names and defaults. These decisions encode your team's conventions and your users' habits, which the model does not know.

The rule: conventions from the model; specifics from your team.

---

## AI Wayback Machine

**Brian Kernighan** was co-authored The C Programming Language and built much of the original Unix toolchain — defining what makes a good CLI.

**Run this:**

```
Who is Brian Kernighan, and how does their work connect to the CLI design we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Brian Kernighan"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Brian Kernighan's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Brian Kernighan's framework."

What changes? What gets better? What gets worse?

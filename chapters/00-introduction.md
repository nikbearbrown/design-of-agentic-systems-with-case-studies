# Introduction — Spring 2026 Edition

*The case layer for INFO 7375, the patterns the cohort produced, and how to read this edition.*

**Editor:** Nik Bear Brown

---

## What this edition is

This is the Spring 2026 edition of *Design of Agentic Systems with Case Studies*. The theory spine — Chapters 1 through 14 — is the stable frame, with field-drift updates each edition as protocols, models, and tools shift under the field. The case layer — Chapters 15 through 45 — belongs to this semester's cohort. Thirty-one student-authored cases drawn from the Spring 2026 section of [INFO 7375 — Prompt Engineering for Generative AI](https://github.com/nikbearbrown) at Northeastern University. The course's fifth module — Agentic AI Systems — is the section the case layer is built around: agent architectures (ReAct, Reflexion, Chain-of-Thought), tool use and function calling, planning and reasoning, memory systems, multi-agent orchestration, agent evaluation, and the ethical considerations that come with autonomous systems. Every case in the layer instantiates at least one theory chapter from that module's territory.

The structural bet is the same bet the book has made since the first edition: engineers learn agentic system design by reading documented real deployments rather than by constructing toy examples. Every case in this edition cleared the assignment gate (real deployed system or real phenomenon, all template sections present, sources primary and verifiable, design choices specific and attributable, failure mode named) and the editorial acceptance standard (writing tight, no theory restated, every contestable claim traceable). Cases that did not clear the editorial gate earned course credit and stayed out of the book.

## What the cohort built — and what the patterns reveal

Read across the thirty-one cases and a small number of architectural patterns appear repeatedly. They are worth naming up front because the strongest reading of this edition follows the patterns rather than the chapter order.

The most common pattern is **structural verification after generation** — the move Chapter 7 names as the Fact Check List Pattern. It appears in CodeSentinel's Evaluator Guardian (Ch 15), VerifAI's DeBERTa NLI verifier separated across model families from the Claim Extractor (Ch 16), PharmGuard's `[SOURCE:RECORD_ID]` citation requirement (Ch 17), BioClaim Guard's four-state PICO verdict (Ch 18), PlanLens's citation-as-output-template (Ch 24), Pitch Verdict's regex-extraction Verifier checking against an upstream ground-truth table (Ch 26), CLIS V2's per-sentence Jaccard grounding (Ch 32), Syllabus Navigator's dual grounding over policy plus retrieved chunks (Ch 35), Research Claim Auditor's `adequacy_score` separated from cosine similarity (Ch 41), and WCAG Auditor's re-audit step that runs the diagnostic on the fixed output (Ch 42). Ten cases land on the same architectural commitment: do not ask the model to verify its own output. Put the verification on a different code path, with a different model family or a deterministic check, and gate downstream propagation on it.

The second pattern is **routing or pre-LLM scoping** — the move that decides what reaches the LLM rather than what the LLM decides about everything. PharmGuard's plan-retrieve-generate sequence keeps enumeration and lookup deterministic (Ch 17). TrialMatch's Controller picks LoRA-fine-tuned BioBERT or LLM at runtime (Ch 22). TacticalLens classifies query intent before retrieval (Ch 25). CloudArch keeps six of ten pipeline stages free of any LLM call (Ch 33). The Adaptive Linear Algebra Explainers diagnose the student's tier upstream of retrieval rather than asking the LLM to interpret tier in a prompt (Ch 36, Ch 37). Stock Research filters retrieval by ticker before letting cross-sector context enter (Ch 38). Immigrant Tax Filing escalates 24 keyword-triggered queries to a CPA *before* the LLM is invoked (Ch 39). StudyMate samples context diversely across the corpus rather than always returning the top-K from a generic query (Ch 45). The cohort consistently chose to scope what the LLM is asked to do rather than ask the LLM to scope itself.

The third pattern is **multi-agent orchestration with explicit conflict-resolution rules**. Pygmy's six-layer architecture with four-path model routing and propose-never-act gating (Ch 27). Jobzilla's Recruiter / Coach / Judge with a 30-point conditional re-debate edge (Ch 28). CostSherlock's controlled rule-out vocabulary that turns dismissed suspects into structured output (Ch 29). Cybersecurity Guardian's five-rule synthesis layer with post-generation CVE-ID redaction (Ch 34). Where multiple agents could disagree, the strong cases made the disagreement-resolution logic structural rather than implicit.

A few **failure modes recur with the same shape across the cohort**. Confident silence — the case where the system produces a clean-looking output that quietly omits a required check — is named as the primary architectural concern in Drug Interaction Checker (Ch 7), CrisisLens (Ch 21), CLIS V2 (Ch 32), and Thought2Do (Ch 43). Topical similarity dressed as logical support shows up in VerifAI (Ch 16), Stock Research (Ch 38), and Research Claim Auditor (Ch 41). Class imbalance in rare-positive classification is met directly in Financial Fragility Detector (Ch 44) with synthetic archetype generation. The discipline that runs through the strongest cases is naming the failure mode the architecture is built to prevent — and reporting honestly when the targets weren't met (CrisisLens 33-50% Red-Team recall; Drug Interaction Checker 48% pass rate against an 80% target; BioClaim Guard reporting evaluation targets without claiming achieved outcomes).

## How to read this edition

Each case is paired with the theory chapter(s) it instantiates via the case's "Pattern connection" section. Three reading paths fit the most common needs.

If you are *evaluating whether to build agentic*, read Chapter 1, Chapter 9, and Chapter 11, then pick two or three system cases in domains close to yours from the case layer. CodeSentinel (Ch 15), CLIS V2 (Ch 32), and CloudArch Designer (Ch 33) are the cases that argue most directly about *when not to use an LLM* alongside *when to use one*.

If you are *designing an agentic system*, read the theory spine in order with each case read alongside the chapter it instantiates. Chapter 7 (Hallucination) carries the highest case load — ten of the cohort's cases instantiate the Fact Check List Pattern at different scales. Chapter 12 (Choosing Your Weapon) is best read with Pitch Verdict, Pygmy, Jobzilla, and CodeSentinel together because the four cases stress different framework-correctness arguments.

If you are *debugging a specific failure mode*, the pattern-case-shaped chapters cluster naturally: hallucination (Ch 7's enrichment plus Ch 16, 32, 41), context management (Ch 9's enrichment plus Ch 25), framework correctness (Ch 12's enrichment plus Ch 28, 33), attack surface (Ch 30's sandboxed Judge0 path), cost reasoning (Ch 29 CostSherlock's controlled rule-out vocabulary).

Two cases are flagged for shape rather than maturity. **Thought2Do (Ch 43)** is documented at proposal stage; the architecture and evaluation framework are committed, the measured outcomes are not yet recorded. **The Adaptive Linear Algebra Explainer** appears as two parallel cases (Ch 36 and Ch 37) because the same architecture was deployed on different stacks (local Ollama vs hosted Groq) — read together they show what changes when only the inference backend differs.

## The Spring 2026 cohort

The case layer is the work of the following students, each holding individual authorship of their chapter:

Aravind Balaji (Ch 15 CodeSentinel; co-author on Ch 6 Magid). Rithwik Srivastava (Ch 16 VerifAI). Shwetanshu Subhash Deshmukh (Ch 17 PharmGuard). Darshak Desai (Ch 18 BioClaim Guard). Rahul Reddy and Rohan Reddy (Ch 19 ClearDischarge). Rajesh Kumar Rama Reddy (Ch 20 AIRA). Kavin Ravi Jha (Ch 21 CrisisLens). Abhinav Kumar Piyush (Ch 22 TrialMatch). Ushake Shravya (Ch 23 PolicyLens). Vanshi Patel (Ch 24 PlanLens). Nikhil Kalyan Devihosur (Ch 25 TacticalLens). Hrishikesh Kulkarni (Ch 26 Pitch Verdict). Rohan Prabhakar (Ch 27 Pygmy). Husain Shajapurwala Yusuf and Sahil Kasliwal (Ch 28 Jobzilla). Vatsal Naik and Priti Ghosh (Ch 29 CostSherlock). Pavan Garlapati and Navya Ravuri (Ch 30 LitmusQE). Pragati Narotam (Ch 31 SchemaGuard). Hritik Hassani (Ch 32 CLIS V2). Niraj Umeshbhai Patel (Ch 33 CloudArch). Anusha Prakash (Ch 34 Cybersecurity Guardian). Udit Chaturvedi (Ch 35 Syllabus Navigator). Faraz Elahi Mohammed (Ch 36 Adaptive LinAlg). Abdul Muqeet Mohammed (Ch 37 Adaptive LinAlg). Tianyu Zhang (Ch 38 Stock Research). Param Shah (Ch 39 Immigrant Tax). Mohit Jain (Ch 40 MindMirror). Gomathy Selvamuthiah (Ch 41 Research Claim Auditor). Vrushti Shah (Ch 42 WCAG Auditor). Yohan Markose (Ch 43 Thought2Do). Nikhil Patwal (Ch 44 Financial Fragility Detector). StudyMate AI's author entry remains unverified ([Ch 45](#)).

The Phase 1 enrichments to the theory layer carry their own bylines. Aditya Mitra (AlgoSensei in Ch 4). Madhumitha Nandhikatti and Gagana M (Drug Interaction Checker in Ch 7). Junyi Zhang and Mridula Mahendran (StudyAI in Ch 9). Rahul Manohar Durshinapally and Hasith Reddy Rapolu (MeetingMind in Ch 12). Aravind Balaji is also credited on the Magid case enrichment in Ch 6.

In the next edition this introduction will name a different cohort, a different distribution of patterns, and likely a different set of theory chapters carrying the heaviest case load — and the structural argument the book makes will be visible only in the comparison across editions.

---

*Spring 2026.*


---

## AI Wayback Machine

**Norbert Wiener** was founded cybernetics in 1948 — the framework of feedback, control, and communication that prefigures all modern agentic systems.

**Run this:**

```
Who is Norbert Wiener, and how does their work connect to the agentic systems we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Norbert Wiener"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Norbert Wiener's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Norbert Wiener's framework."

What changes? What gets better? What gets worse?

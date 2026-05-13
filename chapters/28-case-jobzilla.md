# Chapter 28 — Case: Jobzilla AI

*A Recruiter / Coach / Judge debate where a 30-point disagreement triggers an automatic re-debate — adversarial reasoning as a structural property of the architecture, not as a clever prompt.*

**Authors:** Husain Shajapurwala Yusuf, Sahil Kasliwal
**Editor:** Nik Bear Brown

---

## Situation

Job seekers spend 30 to 60 minutes per application tailoring résumés, writing cover letters, and guessing what the [applicant tracking system](https://en.wikipedia.org/wiki/Applicant_tracking_system) will flag. Existing tools — Jobscan, Teal, Resume Worded — return opaque numeric scores with no reasoning, rarely explain why a match is weak, and never surface the adversarial perspective a real recruiter would apply. The result is high applicant volume, low signal, and burned-out candidates. A single-prompt LLM résumé tool will produce a tailored draft in seconds and inherit the failure mode the chapter has been naming: fluent output that flatters the candidate, hides weaknesses, and produces a résumé optimized for *sounding qualified* rather than *being competitive against the job-specific evaluation a hiring committee would actually run*. Jobzilla AI is a multi-agent system that simulates a hiring committee — a Recruiter agent plays devil's advocate, a Coach agent argues for the candidate, a Judge agent weighs both sides and issues a verdict. The same orchestration produces an ATS-optimized résumé, a personalized cover letter, and a targeted skill-gap analysis. The architectural premise is that *adversarial evaluation* is a structural property of the agent graph, not a prompt-level instruction the model is asked to remember.

## Architecture

The deployed system is a microservices application on GCP Cloud Run. **Frontend** (Streamlit) — dashboard, live debate viewer, job cards, score gauge, analytics. **Backend API** (FastAPI + Pydantic) — REST endpoints for profile, match, debate, resume-gen, cover-letter. **Agent Orchestration** (LangGraph StateGraph) — 8 nodes, 1 conditional edge for re-debate, shared `AgentState` TypedDict. **LLM Providers** — GPT-4o for reasoning, Mistral for parsing, Gemini for fallback validation. **Vector DB** — Pinecone (1536-dim, OpenAI `text-embedding-3-small`) for semantic job retrieval and cosine ranking. **Relational DB** — PostgreSQL + Alembic for users / jobs / matches / debate logs. **Cache** — Redis for session and LangGraph state checkpoints. **Object Storage** — AWS S3 for uploaded résumés and generated PDF artifacts. **MCP Servers** — `github-context` (repo analysis) and `job-market` (external intel). **Scheduling** — Apache Airflow with 4 DAGs (scrape → ingest → vectorize → daily email). **CI/CD** — GitHub Actions to Cloud Run.

The request lifecycle for a Run Debate: user uploads résumé via Streamlit → `POST /api/v1/profile` → FastAPI streams PDF to S3 and persists metadata in PostgreSQL → Mistral parses the résumé into structured JSON (skills, experience, education) → user selects target job → `POST /api/v1/debate` → FastAPI embeds the résumé and queries Pinecone for top-k similar jobs (RAG context) → LangGraph initializes `AgentState` and enters `profile_parser` → pipeline traverses **Recruiter → Coach → Judge**. **If the Recruiter and Coach scores differ by more than 30 points, the conditional edge routes back to Recruiter for up to 3 rounds of re-debate.**

## Design rationale

The architectural commitment that earns the system's name is the **30-point conditional edge that triggers automatic re-debate**. A naive design would run Recruiter → Coach → Judge once and accept whatever verdict the Judge issued, even if Recruiter scored the candidate 25 and Coach scored them 88 — a delta that signals the agents are reasoning from different facts or weighing the same facts under different rubrics. The conditional edge is what turns the disagreement into a *signal* the orchestration acts on. When the delta is large, the graph re-routes back to Recruiter with the disagreement context, runs the debate again, and only proceeds to Judge when the agents are within 30 points or after three re-debate rounds. This is Chapter 12's framework-correctness argument made specific to adversarial evaluation: *no Judge verdict ships when the underlying agents materially disagree without giving the disagreement a chance to converge*. The property is structurally enforced through a LangGraph conditional edge, not through a prompt rule the Judge is asked to honor.

The **eight role-conditioned prompts with structured output contracts** is the second consequential design move. Each agent's system prompt is versioned, tested against a regression suite, and contracts a specific JSON output schema. Recruiter must produce numeric scores with reasoning paragraphs and a structured weakness list. Coach must produce numeric scores with reasoning paragraphs and a structured strength list. Judge must produce a single verdict integer plus a paragraph synthesizing both sides. The structured output contract closes the path where adversarial agents devolve into stylistic mimicry of "being skeptical" without producing comparable scores — the Judge can only synthesize what the upstream agents actually emitted.

The **Pinecone-backed RAG context** is the third move. A Recruiter who only sees the candidate's résumé and the job description is reasoning from two documents. A Recruiter who *also* sees top-k similar job listings retrieved from a Pinecone index of scraped jobs is reasoning over a market context — what compensation tier, what required-skills cluster, what seniority assumption is normal for jobs adjacent to this one. The RAG layer doesn't replace adversarial reasoning; it grounds it.

## Trade-offs

The eight-agent LangGraph orchestration with a conditional re-debate edge introduces meaningful latency: P50 18.4 seconds, P95 34.7 seconds. For an offline résumé-tailoring tool the latency is acceptable; for an inline real-time pipeline it would not be. Three re-debate rounds bound the worst case but pay for the convergence. Pinecone hosted vector storage trades local-control for managed scale; for a multi-tenant production deployment this is the right call, for an on-premise privacy-sensitive deployment it would not be. Eight prompts × regression suite is a real maintenance surface — the prompts are the engineering artifact, and version drift on any one of them changes the behavior of the orchestration.

## Outcomes and revisions

| Metric | Baseline / Benchmark | Jobzilla AI |
| --- | --- | --- |
| Time per tailored application | ~45 min (manual) | < 30 sec |
| ATS keyword match rate | ~40–55% (untailored) | **78.3% (mean)** |
| Judge verdict reproducibility | N/A | **87% (5-run stability)** |
| End-to-end latency (P50) | — | 18.4 s |
| End-to-end latency (P95) | — | 34.7 s |
| Pinecone retrieval recall @ k=10 | — | **0.91 (labeled eval set)** |

The Judge verdict reproducibility metric — 87% across 5 runs on the same input — is the system's own honest report on adversarial-reasoning stability. A perfectly reproducible verdict would be suspicious (it would mean the agents have collapsed to a single deterministic answer and the debate is theatre); a 50% reproducibility would mean the orchestration is unstable. 87% says the agents *materially* re-debate the harder cases and converge on similar verdicts most of the time, which is the discrimination shape adversarial evaluation should produce. The most consequential planned revision is widening the regression suite covering the eight prompts and introducing a paired blind-comparison study against actual recruiter feedback on a labeled candidate-job set to measure whether the Judge's verdict tracks the human ground truth.

## Pattern connection

Jobzilla AI instantiates Chapter 12's framework-correctness argument (the LangGraph conditional re-debate edge enforces the property *no Judge verdict ships on materially disagreeing agents* structurally), Chapter 9's Isolation principle (each of the eight agents has a scoped role-conditioned prompt and a typed output contract), and Chapter 7's adjudication-decorrelation pattern (Recruiter and Coach reason from the same context but optimize against opposing rubrics, structurally decorrelated by the prompt design).

## Transfer prompt

In your own multi-agent system, when two agents materially disagree, what does the orchestration do — accept the higher-confidence answer, average them, route back for a re-debate, surface the disagreement to a human? When you call adversarial reasoning a feature of your system, is it a *prompt instruction* asking the model to be skeptical, or is it a *structural property* of the agent graph the model cannot bypass? When you measure verdict reproducibility, what fraction is too high (theatre) and what fraction is too low (instability)?

---

*Spring 2026.*


---

## A note about AI

Jobzilla acts on the job market. The model has read job postings, resumes, and interview transcripts, which is exactly the dataset that encodes existing labor market biases.

Where the model genuinely helps: identifying the patterns of bias in job-market matching that have been documented in the literature.

Where the model does damage: matching candidates to roles when the matching criteria are not auditable for bias. Black-box matching at scale produces compounding harms.

The rule: bias-audited matching criteria from the literature; the actual matches require human accountability and a published audit.

---

## AI Wayback Machine

**Claudia Goldin** was Nobel-winning labor economist whose work on the gender gap and career structure reframed labor-market analysis.

**Run this:**

```
Who is Claudia Goldin, and how does their work connect to the job-market agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Claudia Goldin"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Claudia Goldin's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Claudia Goldin's framework."

What changes? What gets better? What gets worse?

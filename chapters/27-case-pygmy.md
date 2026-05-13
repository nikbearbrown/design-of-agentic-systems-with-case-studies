# Chapter 27 — Case: Pygmy

*A self-hosted AI-native data-ops platform that fine-tunes a 70B model on pipeline-operations data, runs everything on-premise, and refuses to act without human approval.*

**Author:** Rohan Prabhakar
**Editor:** Nik Bear Brown

---

## Situation

A modern data-engineering team operates a heterogeneous stack — SQL warehouses, workflow orchestrators, transformation frameworks, streaming platforms, BI layers — and the failures across it are usually silent, frequently masked by cascading secondary symptoms (red herrings), and bounded in time-to-resolution by the engineer's ability to manually correlate signals across disparate tools. Existing commercial observability products mitigate the problem and introduce three new ones: they require sensitive schema metadata and query results to be transmitted to third-party cloud infrastructure; they operate as black boxes with limited diagnostic transparency; they produce generic alerts that don't reason about cross-tool causality. Pygmy is built on three architectural principles: **local-first inference** (all model calls, credential storage, and query execution remain on-premise), **propose-never-act** (every command that modifies a live system requires explicit human approval before execution), and **multi-source quality fusion** (signals drawn from five independent sources, merged at query time). The technical contribution is `pipeline-qwen-sft` — a domain-fine-tuned reasoning engine — benchmarked against two strong open-source baselines on the [DCA-Bench](https://github.com/TheDatumOrg/DCA-Bench) anomaly-detection benchmark.

## Architecture

Six layers, each with a bounded responsibility. **Frontend** (Next.js 14 + React 18 + Tailwind) — Connections / Overview / Rules / Alerts / Assistant / Settings tabs. **API Layer** — Next.js Route Handlers exposing typed REST endpoints with streaming responses. **Agent Engine** — Role Classifier, Knowledge Retrieval, Command Planner, Red-Herring Detector, plus the model runtime serving `pipeline-qwen-sft` (deep diagnostic queries) and `llama3.2:1b` (fast role inference). **Quality Engine** — five sources merged at query time: System Tests (deterministic TypeScript code, per-request cache), Live Connector (live queries to connected systems), QA Agent (LLM-derived rule-quality assessments), Log Monitor (continuous log scan), Watchdog (heartbeat checks). **Persistence** — local JSON files (`.pipeline-ops/`) for zero-latency reads and offline support, MongoDB Atlas for chat threads / approvals / command-run history, Qdrant Cloud (AWS `us-west-2`) for knowledge retrieval and RAG citations. **Connectors** — typed executors for Snowflake, dbt, Looker, Airflow, Fivetran, Kafka, PostgreSQL, S3/GCS.

Every user message triggers a parallelized pre-inference pipeline: `normalizeRole()` runs in parallel with `retrieveKnowledge()` (Qdrant hybrid search returning top-5 citations); after role resolves, `buildCommandProposals()` runs in parallel with `runRedHerringModel()` (the latter is a `pipeline-qwen-sft` false-positive check that suppresses cascade-symptom alerts when the upstream root cause is already identified); finally `select model path → generate response text → append to MongoDB thread → render UI`.

## Design rationale

The architectural commitment that earns the system's name is **propose-never-act with approval gating at a separate layer**. Command execution flows through `POST /api/execute` and is gated by a Guardrail check before any typed executor runs — read-only commands pass through, mutating commands require explicit human approval persisted to `assistant_command_runs`. The LLM never directly executes a command on a live system. This is Chapter 12's framework-correctness argument made specific: *no mutating action ships without human approval* is a structurally enforceable property when the approval gate is in the API layer rather than in the model's prompt.

The **fine-tuned narrow model with priority-ordered fallback chains** is the second consequential design move. Four inference paths exist, each routed by message intent: **Fast** (`llama3.2:1b` for greetings and role inference, falls back to `llama3.2:3b` then `qwen2.5:7b`), **Deep** (`pipeline-qwen-sft` for diagnosis and root cause, falls back to `qwen2.5:7b-instruct` then `llama3.2:3b`), **Remedy** (`pipeline-qwen-sft` for fix/resolve/retry, falls back to `qwen2.5:14b` then `qwen2.5:7b`), **Red-Herring** (`pipeline-qwen-sft` for `error`/`fail`/`stale`/`incident` signals, falls back to `qwen2.5:7b-instruct` then `llama3.2:1b`). The fine-tuned model is quantized to 4-bit precision (Q4_K_M GGUF) and served via a custom HTTP model service with a LoRA adapter loaded on the base weights. Ollama runs as the fallback serving backend at `localhost:11434`. This is Chapter 22's runtime-model-selection pattern at six layers of fallback rather than two.

The **five-source quality fusion** is the third move. No single source carries the whole truth: System Tests catch deterministic constraints, Live Connector catches state drift, QA Agent catches semantic-quality issues no rule could enumerate, Log Monitor catches transient errors, Watchdog catches connector-availability failures. Each source has its own cache TTL matched to the volatility of what it observes. `mergeQualityBundles()` composes them at query time. Removing any one source produces a class of failure the remaining four cannot detect.

## Trade-offs

The 70B-parameter base model — even at 4-bit quantization — needs serious local hardware (24+ GB GPU memory, or competent CPU inference at the cost of latency). The local-first commitment rules out the cheap-and-easy hosted-API deployment path, which is the right trade for the schema-metadata-privacy use case and the wrong trade for an organization willing to accept third-party cloud terms. The `propose-never-act` discipline is non-negotiable for production data ops and adds friction for read-only diagnostic queries — the Guardrail correctly fast-paths these so the friction sits only on mutating actions. Six layers of fallback chain are robust *and* a maintenance surface; the fallbacks need ongoing alignment with the primary models' contracts.

## Outcomes and revisions

DCA-Bench evaluation across 30 cases benchmarks `pipeline-qwen-sft` against two open-source baselines (Gemma-3 27B QAT and DeepSeek-R1-Distill-Qwen-7B). All three models achieve **heuristic detection rate of 1.0**. Where `pipeline-qwen-sft` differs is response efficiency: **113.6 average words per response** versus 183.4 for Gemma-3 27B QAT and 315.3 for DeepSeek-R1-7B. The benchmark says: domain fine-tuning at 70B preserves detection coverage and meaningfully tightens response brevity — useful in a data-ops context where engineers want a diagnosis they can read in five seconds, not a model essay. The most consequential planned revision is widening the DCA-Bench evaluation beyond 30 cases and introducing a paired-comparison study where the same incident is diagnosed by `pipeline-qwen-sft` and a stronger commercial frontier model to measure the gap on cases where 70B is not enough.

## Pattern connection

Pygmy instantiates Chapter 9's full five-pattern composition at production scale — Offloading (typed connectors hold state outside the LLM context), Isolation (each agent in the engine has a scoped responsibility), Retrieval (Qdrant hybrid search with top-5 citations), Compaction (the multi-source quality fusion is itself a structured summarization layer), Caching (per-source TTLs matched to volatility) — plus Chapter 12's framework-correctness argument (mutation gating in the API layer, not in the prompt).

## Transfer prompt

In your own AI-native operations platform, where does *no mutating action without approval* live — in a prompt, or in an architectural gate the LLM cannot bypass? When you fine-tune a model for a narrow task, do you preserve fallback chains to general-purpose models for the cases the narrow model gets wrong, or do you commit to the fine-tuned model and accept the failure rate when it underperforms? When you compose multiple quality signals, are their cache TTLs matched to how fast each signal actually changes — or are you over-fetching the slow ones and under-fetching the fast ones?

---

*Spring 2026.*


---

## A note about AI

Pygmy is a small-footprint agent — constrained context, constrained compute, constrained capability. The note examines what scope can be served honestly at this scale.

Where the model genuinely helps: identifying the narrow domain where a small agent can outperform a large general-purpose one.

Where the model does damage: extending the small agent's claims to domains it cannot serve. The model is biased toward overclaiming because most of its training reflects unconstrained systems.

The rule: scope tightly; advertise the scope, not the architecture.

---

## AI Wayback Machine

**Mary Allen Wilkes** was programmed the LINC at MIT in 1965 and operated it from her parents' living room — the first programmer of what we would call a personal computer.

**Run this:**

```
Who is Mary Allen Wilkes, and how does their work connect to the small footprint agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Mary Allen Wilkes"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Mary Allen Wilkes's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Mary Allen Wilkes's framework."

What changes? What gets better? What gets worse?

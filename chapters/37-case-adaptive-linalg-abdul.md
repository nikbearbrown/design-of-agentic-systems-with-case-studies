# Chapter 37 — Case: Adaptive Linear Algebra Explainer (Abdul)

*The same architecture as Chapter 36, deployed on a hosted-inference web stack — FastAPI + React + Groq — and what changes when the inference path moves from local-Ollama to cloud-API.*

**Author:** Abdul Muqeet Mohammed
**Editor:** Nik Bear Brown

---

## Situation

The same teaching problem the previous chapter named: linear-algebra explanations need to be tier-appropriate to the student or they fail in two opposite directions at once — too much formalism for the engineering student, too little rigor for the math major. Standard RAG chatbots return tier-uniform responses; the Adaptive Linear Algebra Explainer routes upstream of retrieval into Geometric Intuition, Formal Beginner, or Algebraically Grounded tiers based on three diagnostic probes. This chapter documents a parallel submission of the same architecture, deployed on a different stack: **React + TypeScript + Vite + KaTeX frontend, FastAPI + Uvicorn backend, Llama 3.3 70B via Groq API with SSE streaming**. Reading it next to Chapter 36 surfaces the trade-off the same architectural design produces under different deployment commitments — local self-hosted inference versus hosted cloud-API inference. The teaching here is not a new architecture; it is the same architecture under a different cost-quality-latency point on the deployment surface.

## Architecture

Three sequential stages identical to Chapter 36's: **Diagnostic → Tier-Filtered Retrieval → Generation**. Three free-text diagnostic questions probe known misconceptions; a rule-based keyword classifier outputs tier (1, 2, or 3) and a misconception string. Cosine-similarity search against ChromaDB with `$and` metadata filter on `{tier, topic}`, top-5 chunks, fallback to tier-only when fewer than 3 results return. Tier-specific persona instructions in the generation prompt.

What differs is the deployment stack. **Frontend** — React 19 + TypeScript + Vite + KaTeX for math rendering, with Server-Sent Events streaming the generated tokens as they arrive. **Backend** — FastAPI + Uvicorn exposing `/api/questions`, `/api/topics`, `/api/session`, `/api/session/stream`. The embedding model and ChromaDB load once at startup; subsequent requests reuse them. **Generation** — Llama 3.3 70B via Groq API (OpenAI-compatible). SSE streaming, 60-second timeout. Instructed to use only retrieved context and cite sources.

The knowledge base is identical: four LaTeX-authored synthetic PDFs (`vector_spaces_notes.pdf` Tier 1, `intro_linear_algebra_notes.pdf` Tier 2, `systems_row_reduction_notes.pdf` Tier 2, `eigen_notes.pdf` Tier 3), 159 chunks across 15 topics, `RecursiveCharacterTextSplitter` (chunk_size 400, overlap 75), `all-MiniLM-L6-v2` embeddings (384-dim), ChromaDB local persistent store. Tier system identical: Geometric Intuition / Formal Beginner / Algebraically Grounded.

## Design rationale

The architectural commitment that the parallel deployment makes visible is **the routing decision is upstream-of-retrieval regardless of inference backend**. The choice between Mistral-7B-via-local-Ollama (Chapter 36) and Llama-70B-via-Groq-API (this chapter) does not affect the tier-routing logic, the chunk-tagged knowledge base, or the metadata-filtered retrieval. The same architecture produces tier-appropriate context regardless of which model generates from that context. That property — the routing decision is independent of the generation model — is what makes the architecture *portable* across deployment stacks. A team that wants the Adaptive Explainer's behavior on a constrained classroom server (Chapter 36's path) and a team that wants it on a public web deployment (this chapter's path) build the same upstream pipeline and swap only the generation tail.

The **SSE streaming through FastAPI** is the second consequential design move specific to this deployment. A web deployment with cloud-API inference has end-to-end latency dominated by the generation call (Groq is fast for a 70B model and is still slow compared to local-prompt-and-retrieve). Server-Sent-Events streaming returns tokens as the model produces them rather than waiting for the full response, so the user sees progress within hundreds of milliseconds rather than waiting tens of seconds for a complete answer. The frontend KaTeX rendering layer adapts to streamed text — math notation re-renders as new tokens arrive. This is Chapter 9's parallel-output pattern made explicit at the request lifecycle: don't make the user wait for the slow stage when you can show them the fast stage's output as it arrives.

The **load-once-at-startup pattern** is the third move and a small but important one for FastAPI deployment. Cold-loading a sentence-transformer model and ChromaDB on every request would make the per-request latency dominated by setup rather than by inference. Loading both at backend startup and keeping them resident in the Uvicorn process means the embedding-and-retrieval portion of every request is in the millisecond range. This trades startup time and memory footprint for steady-state throughput — the right trade for a hosted web deployment.

## Trade-offs

The hosted-cloud deployment trades the local self-hosted control of Chapter 36 for production-grade response quality and latency. Llama 3.3 70B via Groq is meaningfully more fluent than Mistral 7B locally; it is also a cost-per-token line item rather than a one-time hardware investment. The Groq API introduces a hard external dependency — an outage degrades the system to its empty-state error path, where Chapter 36's local-Ollama deployment continues working. The 60-second timeout caps the worst-case generation latency at a level appropriate for streaming UX and would need extension for very long pedagogical responses. The React + Vite frontend trades the rapid-prototyping benefit of Gradio for richer UX (KaTeX math, controlled streaming display, custom layouts).

## Outcomes and revisions

The technical report names the evaluation as a **smoke-test** — diagnostic accuracy on a small probe set, RAGAS faithfulness against retrieved context, qualitative inspection of generated explanations across the three tiers. The system is a working architecture, not yet a measured intervention. Where this submission specifically contributes — beyond Chapter 36's parallel — is the operational evidence that the *same* architecture produces tier-coherent output regardless of the generation backend chosen. The same diagnostic, the same tier-filtered retrieval, the same prompt-builder structure produces tier-appropriate explanations whether generation runs against Mistral 7B locally or Llama 3.3 70B in the cloud. That portability is itself a finding: the architecture's correctness property does not depend on the model.

The most consequential planned revision matches Chapter 36's: broadening the corpus beyond four authored PDFs and conducting a between-subjects student study where Tier-1, Tier-2, and Tier-3 students receive Tier-matched versus randomized explanations and conceptual-understanding gain is measured. A small additional revision specific to this deployment is logging the per-tier per-topic latency distribution to identify where SSE streaming most improves user-perceived responsiveness.

## Pattern connection

This case instantiates the same Chapter 9 Retrieval principle as Chapter 36 (chunked tier-tagged content with metadata-filtered semantic search) and adds a small pattern worth naming: **deployment-portable architecture**. When the upstream pipeline (diagnostic, retrieval, prompt construction) is independent of the generation backend, the same architecture can be deployed in environments with very different cost-latency-control trade-offs without rewriting the pipeline. The model is the variable; the architecture is the constant.

## Transfer prompt

In your own RAG system, can you swap the generation model — local-Ollama for cloud-API, 7B for 70B — without changing the upstream retrieval pipeline? If not, where is the model-specific assumption hiding in the retrieval or prompt-construction layer? When you deploy the same logical system to two stacks (self-hosted vs hosted, classroom vs production), which architectural choices stay constant and which are deliberately different? When latency is dominated by the generation call, are you streaming partial output to the user — or making them wait for the full response?

---

*Spring 2026.*


---

## A note about AI

This case is the parallel adaptive linalg implementation. The note repeats with intentional emphasis: tutoring agents that produce answers prevent the learning they are meant to support.

Where the model genuinely helps: producing varied practice problems at calibrated difficulty.

Where the model does damage: producing the worked solutions in a way the student copies without working.

The rule: problems from the model; solutions from the student's pencil.

---

## AI Wayback Machine

**Cleve Moler** was creator of MATLAB and co-founder of MathWorks — built the libraries underlying most modern adaptive numerical linear algebra.

**Run this:**

```
Who is Cleve Moler, and how does their work connect to the adaptive linear algebra we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Cleve Moler"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Cleve Moler's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Cleve Moler's framework."

What changes? What gets better? What gets worse?

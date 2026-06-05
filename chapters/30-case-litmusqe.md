# Chapter 30 — Case: LitmusQE

*A five-stage pipeline that asks an LLM to act as a security researcher generating adversarial Python tests — and routes everything through Judge0 because no user-submitted code runs on the backend.*

**Authors:** Pavan Garlapati, Navya Ravuri
**Editor:** Nik Bear Brown

---

## Situation

Manual test writing is slow, incomplete, and biased toward the cases a developer already expects to fail. The tests a developer writes are a confession of which failure modes they thought of; the tests they don't write are the bugs that ship. Mutation testing helps but operates on small lexical perturbations. Static template-based fuzzers help but produce inputs that look like fuzzer outputs and miss the structural failure modes a thoughtful adversary would target — null inputs that pass type checks, boundary values that overflow only on specific architectures, type confusion via duck-typed surrogates, SQL injection payloads dressed as legitimate strings, encoding attacks, recursion-depth detonators. LitmusQE addresses the gap by automating the discovery of *adversarial* inputs — the ones a developer would never think to write — and by doing it through a multi-stage pipeline that validates syntax, scores relevance, refines coverage gaps, and executes survivors in a remote sandbox. The user submits a Python function. The system returns which inputs crash it, what exceptions they trigger, and which adversarial category exposed the bug.

## Architecture

Three client interfaces over one FastAPI backend over one external sandbox. **Clients** — React + Vite single-page app (interactive browser use), Typer + Rich CLI (scripted automation, batch evaluation), VS Code extension (right-click *Analyse with LitmusQE* or `Cmd+Shift+L`, side WebView panel, Save-as-pytest file export). All three clients consume the same backend API; adding a new client requires no backend changes. **Backend** — FastAPI exposing `POST /analyze` (full pipeline), `GET /providers` (registered LLM list), `GET /health`. Stateless: each request runs a fully isolated pipeline; client-supplied API keys are used only for that pipeline run and never logged or persisted. **External** — [Judge0](https://judge0.com/) (`ce.judge0.com`) hosted code-execution sandbox. No user-submitted code runs on the backend itself, ever.

The pipeline is five stages plus a conditional sub-stage:

| Stage | Name | Type | Description |
| --- | --- | --- | --- |
| **S1** | Adversarial Generation | LLM call | Generates up to 50 adversarial test cases across 10 categories from the function source |
| **S2** | AST Validation | Local | Parses each test with Python's `ast` module; retries invalid tests up to 2× via LLM; checks undefined variable references |
| **S3** | Relevance Filtering | LLM call | Scores each test 1–3 against the function's specific domain; temperature 0.2 for deterministic scoring |
| **S4** | Self-Refinement | LLM call | Replaces tests scored 1 (irrelevant); fills categories with fewer than 3 tests; uses post-removal distribution |
| **S4b** | Post-Refinement AST | Local (conditional) | Re-runs Stage 2 only for tests added by Stage 4 (those with `ast_valid=None`) |
| **S5** | Sandboxed Execution | Judge0 | Submits each surviving test via HTTP; collects structured output `(STATUS, ERROR_TYPE, ERROR_MSG)` from stdout |

Two interface abstractions keep the pipeline decoupled. **`LLMProvider`** — five interchangeable implementations (`GeminiLLM`, `ClaudeLLM`, `OpenRouterLLM`, `CerebrasLLM`, `OllamaLLM`), all with 3-attempt exponential backoff on rate-limit errors. **`LanguageHandler`** — only Python implemented for MVP, but the interface is designed for extension; adding JavaScript, Go, or Java requires one new handler with no pipeline changes.

## Design rationale

The architectural commitment that earns the system's name is **multi-stage quality before execution**. Raw LLM output is not used directly — that path produces tests that are syntactically broken, semantically irrelevant to the function's domain, or skewed toward whichever adversarial categories the model happened to generate first. Each stage closes a specific failure mode. AST Validation closes syntactic invalidity. Relevance Filtering closes domain irrelevance. Self-Refinement closes coverage skew. Post-Refinement AST closes the validation gap that opens when Stage 4 adds new tests that Stage 2 already ran past. Each stage is independently logged and timed, which makes the pipeline an inspectable rather than opaque artifact.

The **post-refinement AST validation** (S4b) is the design choice that earns its place by being a *correction*. The original three-prompt iteration the team ran shipped with Stage 4 generating new tests that bypassed Stage 2's AST check. The discovery — that tests generated in Stage 4 silently entered Stage 5 with invalid syntax — produced the fix: re-run AST validation only on the new tests (those with `ast_valid=None`) before they reach Judge0. This is the chapter's discipline applied to the team's own implementation: name the gap, close it, document the fix.

The **provider-agnostic LLM abstraction with three-attempt exponential backoff** is the third move. The pipeline is not coupled to Claude, Gemini, or any other model. Five providers are interchangeable, allowing the project to evaluate the same pipeline across models that differ in cost, latency, and adversarial-reasoning quality.

The **Judge0 hosted sandbox over self-hosted execution** is a deliberate scope retrenchment. The original plan ran Judge0 locally; macOS Docker Desktop failed to expose the required cgroup v1 interface; the team pivoted to the public hosted instance with a single environment-variable change. This is correct scope management: do not block the architecture's main contribution on an infrastructure problem orthogonal to it.

## Trade-offs

Five-stage decomposition trades end-to-end latency for inspectable quality — the pipeline runs sequentially with three LLM calls, so the cost-and-time floor is set by whichever provider is selected. Judge0 hosted enforces per-submission limits and is rate-limited at the public tier; production deployment is planned as a self-hosted Railway instance. The 10-category adversarial taxonomy is curated and the prompt-engineering effort behind it took three iterations before it reliably produced full coverage. The provider-agnostic abstraction is a real maintenance surface — five SDKs, five rate-limit behaviors, five auth patterns to keep aligned with the pipeline's contract.

## Outcomes and revisions

Evaluation across **28 hand-crafted buggy Python functions**:

| Provider | Bug Detection Rate | Category Coverage Score | Notes |
| --- | --- | --- | --- |
| Claude Sonnet 4.6 | **100%** | **100%** | Highest quality, reference run |
| Cerebras `llama3.1-8b` | 92.9% | 73.9% | ~6× faster than Claude |

The Claude/Cerebras comparison is the deployment-relevant point on the cost-quality frontier — Claude is the bug-detection ceiling at low throughput, Cerebras is meaningfully faster at a moderate quality discount. Three client interfaces — React, CLI, VS Code extension — confirmed the architecture's versatility by all consuming the same backend without changes. The most consequential planned revision is broadening from 28 hand-crafted functions to a larger labeled corpus (e.g., a curated subset of the [Defects4J](http://defects4j.org/) Python equivalent), and adding a JavaScript LanguageHandler to test the extension claim.

## Pattern connection

LitmusQE instantiates Chapter 7's Fact Check List Pattern (Stage 2 AST validation as a structural check before LLM tests reach the executor) and Chapter 9's pipeline-stage Offloading principle (each stage's output is a structured handoff to the next, with the LLM never holding the entire pipeline state in its prompt). The Judge0-over-backend-execution decision instantiates Chapter 8's attack-surface argument: never run user-submitted code on the trusted-component server.

## Transfer prompt

In your own LLM-driven generation pipeline, what is the validation gap your downstream stages assume the upstream stages closed? When a stage generates new content downstream of an existing validation step, are you re-running validation on the new content — or trusting the upstream guarantee that no longer applies? When you abstract over LLM providers, do you have a real fallback chain that fires under rate-limit pressure, or do you have one provider with a token-saving abstraction layer that does nothing when it matters?

---

*Spring 2026.*


---

## A note about AI

LitmusQE handles quality engineering. The model is fluent in QE vocabulary and is the kind of system that QE is meant to test.

Where the model genuinely helps: producing the canonical test categories and edge-case patterns for a given system.

Where the model does damage: certifying that a system passes QA. Passing is a property of test execution, not of the model's review of test plans.

The rule: test design from the model; pass/fail from test execution.

---

## AI Wayback Machine

**W. Edwards Deming** was statistician who built the modern theory of quality engineering — the framework underlies every serious QA system in software and manufacturing.

![W. Edwards Deming](../images/w-edwards-deming-efb.png)

*Puppet Art by [Nik Bear Brown](https://www.nikbearbrown.com/).*

**Run this:**

```
Who is W. Edwards Deming, and how does their work connect to the quality engineering agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"W. Edwards Deming"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply W. Edwards Deming's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of W. Edwards Deming's framework."

What changes? What gets better? What gets worse?

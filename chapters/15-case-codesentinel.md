# Chapter 15 — Case: CodeSentinel

*A multi-agent code-review system that decomposes false-positive reduction into prompt-engineering effort and architectural contribution.*

**Author:** Aravind Balaji
**Editor:** Nik Bear Brown

---

## Situation

Software vulnerabilities have been the same ten categories on the OWASP Top 10 since 2003 — injection, broken access control, insecure deserialization, cryptographic failures — and the persistence is not because the categories are unknown but because code review at scale is expensive, inconsistent, and fatiguing. The volume of code shipped per engineer per day has grown faster than the trained-reviewer supply has, and the gap is widening. Single-prompt LLM code review fills part of the gap and creates a different problem in its place: a sufficiently capable model produces *plausible* findings — vulnerability claims that read correctly, are written in correct security vocabulary, and turn out to be incorrect on inspection. The naive deployment fails three structural ways at once. Findings are ungrounded — nothing forces an SQL-injection claim to point at OWASP A03:2025 or CWE-89. Output is monolithic — security findings, style findings, and architectural suggestions arrive in one undifferentiated pass with no internal adversary. Errors are untraceable — when a finding turns out wrong, there is no record of what evidence the model had or what alternatives it considered. CodeSentinel was built to address those failure modes architecturally rather than through a better prompt.

## Architecture

The system runs three specialized agents through a [LangGraph](https://langchain-ai.github.io/langgraph/) directed graph with conditional routing and a bounded retry loop. The **Security Sentinel** scans for vulnerabilities and must cite a retrieved passage from the local knowledge base — 56 passages drawn from OWASP Top 10 2025, a curated 29-entry CWE subset, and language-specific patterns — for every finding it emits. The **Code Quality Auditor** handles maintainability and style findings against established style guides. The **Evaluator Guardian** acts as an internal adversary, rejecting findings that lack evidence, citations, or concrete remediation, with both a programmatic check (does the finding have a `rag_source` field, an OWASP category, a CWE ID, and a remediation block?) and an LLM semantic check (does the citation actually support the claim?).

The retrieval pipeline uses semantic-boundary chunking, two-pass retrieval, and lexical reranking. Every finding the system emits carries an `OWASP-A03:2025 / CWE-89` style provenance tag. A synthetic data generator produces paired vulnerable and safe code samples covering 15 CWE classes, verified by an independent regex-based detector that has no shared context with the generator — preventing the generator from gaming its own test. A parallel reinforcement-learning module (UCB-1 contextual bandit over prompt variants, REINFORCE policy gradient over routing) is wired in as a demonstration; the README is explicit that it is not in the production graph in this release.

## Design rationale

The central design choice is the **two-tier baseline**, and it is the choice that makes the rest of the report honest. An out-of-the-box single-prompt baseline is the natural comparison and the wrong one — it bundles the architectural contribution with prompt-engineering labor any careful practitioner could replicate. CodeSentinel evaluates against *both* an out-of-the-box single prompt and a prompt-iterated single prompt that received the same three-round refinement protocol the agent prompts received, on the same held-out set. Reporting both baselines lets the residual improvement be attributed to architecture rather than to prompt-tuning hours.

The **citation-required Evaluator** is the choice that closes the hallucinated-vulnerability failure mode. A finding without a `rag_source` is rejected before it reaches the user. The check is programmatic before it is semantic — the schema-level rejection is fast, deterministic, and catches the easy cases; the LLM semantic check handles the harder case where the citation exists but doesn't actually support the claim. Putting both checks in the Evaluator instead of in the Security Sentinel itself is a deliberate separation: the agent that *produces* a claim is not the agent that *adjudicates* it, because hallucination at production time and hallucination at adjudication time would correlate. Putting adjudication in a different agent with a different system prompt and a different objective decorrelates them.

The **independent verifier on synthetic data** is the choice that makes the evaluation suite honest. A generator that is also the verifier has a known failure mode — it produces samples its own classifier passes. CodeSentinel's verifier is regex-based and has no LLM in the loop, so the generator cannot game it via shared context.

## Trade-offs

Specialization buys auditability and costs throughput. A single-prompt system runs one inference call per file; CodeSentinel runs one inference per agent plus an Evaluator pass plus a possible retry, so latency and cost scale roughly 3–5× per review. The retrieval index is local — fast at query time but stale if OWASP categories revise between rebuilds, which they do roughly annually. The citation-required gate is non-negotiable in production but produces *false negatives* in the unusual case where the model identifies a real vulnerability not yet documented in the indexed corpus; the trade-off was made deliberately on the basis that an undocumented finding the user has no way to verify is not a finding worth shipping. The RL demonstration module is unwired, which is the right call for a course project (do not claim what you do not run) and the wrong call for a paper that wanted to demonstrate full integration.

## Outcomes and revisions

On a ten-sample hand-labeled toy suite evaluated with Claude Sonnet on April 20, 2026, three systems were compared. The out-of-the-box single-prompt baseline produced 30 false positives (FPR 0.789). The prompt-iterated baseline reduced this to 12 (FPR 0.600). The multi-agent CodeSentinel pipeline produced 1 (FPR 0.111). All three achieved perfect recall on the eight ground-truth findings. The decomposition is the substantive result: about 60% of the false-positive reduction is attributable to prompt engineering any practitioner could replicate; the remaining 40% is attributable to the retrieval-and-adversarial-review architecture. A 95% Wilson interval around the multi-agent FPR on ten samples spans roughly 0.02 to 0.43 — the toy suite alone does not reach significance once the prompt-iterated baseline is the right comparator. A twenty-sample paired suite built in the spirit of OWASP Benchmark methodology achieved multi-agent TPR 1.000 / FPR 0.182 against baseline 0.333 / 0.571, with [McNemar's exact two-sided p = 0.0312](https://en.wikipedia.org/wiki/McNemar%27s_test). A Semgrep comparison run against Flask production source returned zero findings from both systems, establishing that the multi-agent pipeline is not over-triggered on clean code. CWE classification accuracy: 1.0 across all suites. Thirty-five unit tests pass on a clean clone.

## Pattern connection

This is the canonical instantiation of Chapter 7's Fact Check List Pattern — the citation-required Evaluator is exactly the verification layer the chapter argued for, with PASS / FAIL / UNCERTAIN as first-class output states. It also instantiates Chapter 12's framework-choice argument: LangGraph was selected because the workflow's correctness property (*no finding ships without a citation and a remediation*) is structurally enforceable through conditional edges, not at the prompt level.

## Transfer prompt

In your own LLM application, identify the failure mode whose mitigation lives in a *different* agent than the one producing the output. Are the two agents trained on the same corpus and prompted to the same objective? If yes, you have not decorrelated the failure — you have moved it. What does the architecturally honest two-tier baseline for your system look like, and would you ship the result if it cost you 3–5× per inference?

---

*Spring 2026.*


---

## A note about AI

CodeSentinel is an agent that analyzes code for problems. The model is the agent's substrate and also the most common author of the code the agent will examine.

Where the model genuinely helps: producing the corpus of subtle bugs across languages and frameworks that the agent should learn to flag.

Where the model does damage: producing certification that a piece of code is safe. The model has the same blind spots in evaluation that it has in generation; a clean review from the model is not evidence of clean code.

The rule: use the model to generate adversarial test cases; verify code safety against the test cases, not against the model's verdict.

---

## AI Wayback Machine

**Barbara Liskov** was pioneered data abstraction and type-safe software design — the Liskov substitution principle anchors modern static analysis.

![Barbara Liskov](../images/barbara-liskov-1vp.png)

*Puppet Art by [Nik Bear Brown](https://www.nikbearbrown.com/).*

**Run this:**

```
Who is Barbara Liskov, and how does their work connect to the code analysis agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Barbara Liskov"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Barbara Liskov's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Barbara Liskov's framework."

What changes? What gets better? What gets worse?

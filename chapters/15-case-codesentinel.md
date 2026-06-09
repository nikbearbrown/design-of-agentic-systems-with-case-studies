# Chapter 15 — Case: CodeSentinel

*A multi-agent code-review system whose 97% drop in false positives is decomposed honestly into prompt-engineering effort and architectural contribution.*

**Author:** Aravind Balaji
**Editor:** Nik Bear Brown

---

## Situation

Software vulnerabilities are one of the most persistent sources of operational risk in modern systems. The OWASP Top 10 — first published in 2003 — has been dominated by the same broad classes for two decades: injection, broken access control, insecure deserialization, cryptographic failures. The classes persist not because they are unknown but because code review at scale is expensive, inconsistent, and fatiguing, and because the volume of code shipped per engineer has grown far faster than the supply of trained security reviewers.

A capable large language model is, today, a competent code reviewer. A single prompt will surface many of the defects a trained human would, in seconds rather than hours. But the naive deployment — one LLM call, one pass — produces an output with three structural weaknesses, and none of them is fixable by writing a better prompt. Findings are **ungrounded**: the model can invent a plausible-sounding vulnerability that does not exist. Output is **monolithic**: nothing inside the system challenges a claim, so false positives flow through at the same rate as true ones. Errors are **untraceable**: there is no record of what the model knew or what it considered. CodeSentinel was built to close all three failure modes architecturally.

## Architecture

CodeSentinel is a three-agent system on a [LangGraph](https://langchain-ai.github.io/langgraph/) directed graph with conditional routing and a bounded retry loop. The **Security Sentinel** scans for vulnerabilities and must cite a retrieved passage for every finding it emits. The **Code Quality Auditor** handles maintainability and style. The **Evaluator Guardian** is an internal adversary that decides whether a finding is allowed to reach the user.

![Figure 15.1 — CodeSentinel's architecture. Three specialized agents run on a LangGraph directed graph; the Security Sentinel is grounded in a retrieval corpus, and the Evaluator Guardian gates every finding. Rejected findings loop back to the producing agent for revision.](../images/fig-15-1-architecture.svg)

Grounding comes from a 56-passage knowledge base built from the OWASP Top 10 2025, a curated 29-entry CWE subset, and 17 language-specific patterns. Retrieval is two-pass with a lexical rerank, over local `all-MiniLM-L6-v2` embeddings, and the ingest path degrades gracefully through three tiers — ChromaDB, then TF-IDF, then pure Python — so the system runs with no external service. Evaluation does not depend on a single hand-labeled set: a synthetic data generator produces paired vulnerable and safe samples across 15 CWE templates, and an **independent regex-based verifier with no shared context** confirms each label, so the generator cannot quietly produce only the samples its own classifier passes. A reinforcement-learning module (a UCB-1 contextual bandit over prompt variants and a REINFORCE policy gradient over routing) ships in the repository but is deliberately **not wired into the production graph** — the README says so plainly, which is the honest way to present unfinished work.

## Design rationale

The choice that makes the whole report honest is the **two-tier baseline**. The obvious comparison — an out-of-the-box single prompt against the multi-agent system — is the wrong one, because it bundles the architectural contribution together with prompt-engineering labor any careful practitioner could replicate. So CodeSentinel measures against *both* an out-of-the-box single prompt *and* a prompt-iterated single prompt that received the same three-round refinement the agent prompts received, on the same held-out set. Only the residual gap between the iterated single prompt and the full pipeline is fairly attributable to architecture.

The choice that closes the hallucinated-vulnerability failure mode is the **citation-required Evaluator**. A finding without a `rag_source` is rejected before the user ever sees it.

![Figure 15.3 — The Evaluator Guardian runs a two-layer gate. A cheap, deterministic programmatic check screens every finding; only what survives reaches the expensive LLM semantic check that asks whether the cited passage actually supports the claim. Either layer can reject, sending structured feedback back to the producing agent.](../images/fig-15-3-evaluator-gate.svg)

The check is programmatic before it is semantic: the schema-level screen (citation present, fix length ≥ 20 characters, confidence ≥ 0.5, valid schema) is fast, deterministic, and catches the easy cases; the LLM semantic check handles the harder one, where a citation exists but does not actually support the claim. Putting adjudication in a *different* agent from the one that produced the claim is the load-bearing decision. Hallucination at production time and hallucination at adjudication time would correlate if the same agent did both with the same prompt and objective; a separate agent, with a different prompt and a different objective, decorrelates them. When the Security Sentinel reports "line 47 is CWE-502, unsafe pickle deserialization," the finding carries the specific corpus passage that defines CWE-502, and a reviewer can trace the claim back to source in one click — which is not optional in regulated settings and reduces triage burden everywhere else.

## Trade-offs

Specialization buys auditability and costs throughput. A single-prompt system runs one inference per file; CodeSentinel runs one per agent, plus an Evaluator pass, plus a possible retry, so latency and cost scale roughly **3–5× per review**. The retrieval index is local — fast at query time but stale if OWASP categories revise between rebuilds, which they do roughly annually. The citation-required gate is non-negotiable in production, but it produces *false negatives* in the rare case where the model spots a real vulnerability not yet documented in the indexed corpus; the project takes that trade deliberately, on the view that an undocumented finding the user cannot verify is not worth shipping. And the RL module is unwired — the right call for a course project (do not claim what you do not run) and the wrong one for a paper that wanted to demonstrate full integration.

## Outcomes and revisions

On a ten-sample hand-labeled suite evaluated with real Claude Sonnet on 20 April 2026, the out-of-the-box single prompt produced 30 false positives; the multi-agent pipeline produced 1 — a 97% reduction, with recall (TPR) and CWE-classification accuracy both at 1.000 across every system. Same model, same prompts to the LLM, same samples. The raw number is striking, but the honest question is how much of it is architecture and how much is careful prompting.

![Figure 15.2 — The two-tier baseline decomposes the 97% reduction. A single prompt given the same three-round refinement reaches 12 false positives, so roughly 60% of the drop is replicable prompt engineering and the remaining ~40% is what the retrieval-and-adversarial-review architecture adds on top.](../images/fig-15-2-results.svg)

The prompt-iterated single prompt lands at 12 false positives. So of the 29-finding reduction, about 60% (30 → 12) is prompt engineering any team could reproduce, and about 40% (12 → 1) is the architecture. That decomposition — not the headline 97% — is the chapter's real result: it is what lets the gain be attributed to structure rather than to whatever model or prompt happens to sit underneath. A twenty-sample paired suite built in the spirit of OWASP Benchmark methodology returns McNemar's exact two-sided *p* = 0.0312, with a Youden index of +0.818 for the multi-agent system against −0.238 for the baseline. A Semgrep comparison on Flask production source returns zero findings from both systems, establishing that the pipeline is not simply over-triggered on clean code. Thirty-five unit tests pass on a clean clone, and the whole system — including a deterministic mock mode that runs with no API key — is open-source and reproducible.

## Pattern connection

This is the canonical instantiation of Chapter 7's Fact Check List Pattern: the citation-required Evaluator is exactly the verification layer that chapter argues for, with PASS / FAIL / UNCERTAIN as first-class output states. It also instantiates Chapter 12's framework-choice argument — LangGraph was chosen because the workflow's correctness property (*no finding ships without a citation and a remediation*) is structurally enforceable through conditional edges rather than politely requested in a prompt.

It is worth situating the claim against the frontier. Around the same time this project was built, Anthropic's [Project Glasswing](https://www.anthropic.com/glasswing) pointed an unreleased frontier model — Claude Mythos Preview, withheld from public release because of its offensive capability — at critical infrastructure and surfaced more than ten thousand vulnerabilities, including decades-old zero-days in OpenBSD and FFmpeg, across major operating systems and browsers. That is the opposite architectural bet: one extraordinarily capable model rather than a chorus of commodity ones, and not a system most teams can run. CodeSentinel makes the narrower and, for most teams, more useful claim — that you do not need a frontier model to get the reliability gain. You need the architecture around a commodity one.

## Transfer prompt

In your own LLM application, find the failure mode whose mitigation lives in a *different* agent than the one producing the output. Are those two agents trained on the same corpus and prompted to the same objective? If so, you have not decorrelated the failure — you have moved it one box over. And what would the architecturally honest two-tier baseline for your system look like: would you still ship the result if it cost you 3–5× per inference?

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

**Barbara Liskov** pioneered data abstraction and type-safe software design — the Liskov substitution principle anchors modern static analysis.

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

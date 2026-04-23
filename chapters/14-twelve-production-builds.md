> **Voice status:** `voice-unanchored`. Both root `style/` and `books/design-of-agentic-systems/style/` empty as of this draft. Sixth chapter drafted for this book.

---

# Chapter 33 — Twelve Production Builds

*A Scaffolded Project Sequence*

**Author:** [Student — TA to fill in]
**Editor:** Nik Bear Brown

---

## Suggested titles

1. **Twelve Production Builds: A Scaffolded Project Sequence**
2. **Why Priya Shipped and Marcus Didn't: The Load-Bearing Primitive Most Engineers Skip**
3. **Build 4 Is Not One Build: The Compaction Primitive as Silent Infrastructure**

---

## TL;DR

Architectural judgment in multi-agent systems comes from *building*, in dependency order — and exactly one build in the sequence is load-bearing infrastructure for everything above it, in a way that isn't visible until the system fails silently in production. The chapter names the twelve builds, spends its air on the one that actually collapses everything else when skipped (context compaction), and shows why no model upgrade closes the gap that architectural sequencing opens.

---

## 33.1 Priya and Marcus

Priya and Marcus are a composite — not a real pair, but a close rendering of the pattern every instructor running a production-agents capstone has seen at least three times. Labeling the case up front because the chapter's argument doesn't get rhetorical benefit from pretending they're real.

Both built multi-agent research assistants for the same class. Both used the same model. Both used the same framework. Both read the same papers on coordinator-worker patterns, parallel execution, and retrieval-augmented generation. Both shipped systems that worked on their evaluation rubric — a small set of representative queries with model-graded answers.

Marcus's code was, by any reasonable reading, better. His coordinator prompt was more carefully written. His agent role definitions were more precise. He could draw the six-layer stack from Chapter 2 on a whiteboard without thinking about it. Priya's system was rougher around the edges — her prompts were adequate, not elegant — but it worked.

In production, Marcus's system failed within two weeks. Not dramatically: it kept producing confident, fluent research summaries. It just stopped producing *complete* ones. Somewhere between the third and fifth research worker's output, a whole worker's contribution silently vanished from the coordinator's synthesis. The outcome evaluator, which graded the final synthesis against the query, kept passing. The trajectory evaluator — which checked that every worker's output actually appeared in the final answer — was the only signal that something was wrong. Marcus hadn't built a trajectory evaluator.

Priya's system didn't have this failure. Same model, same framework, same queries. The only architectural difference: before she wired the coordinator to workers, she'd built a single-agent state-management layer that compressed its own working memory when it got close to the context window's limit. When she built the coordinator later, she inherited that layer — so her coordinator's context was bounded by a fixed summary, regardless of how much each worker had done.

Marcus had skipped that single-agent build. He'd gone straight from a stateless RAG agent to coordinator-worker, because coordinator-worker was the interesting architecture and state management looked boring.

The difference between the two systems in production wasn't the model. It wasn't the prompt. It was that Priya had built Build 4 before Build 7, and Marcus hadn't. The rest of this chapter is about why that dependency is unavoidable, and about the eleven other builds that surround the one that matters most.

---

## 33.2 Primitive isolation, specified

The governing principle of the build sequence is easy to say and almost universally violated: **never introduce two new architectural primitives at once**. When a system fails, you need to be able to attribute the failure to a single change. If you wired your coordinator and your retrieval pipeline in the same week, and the synthesis is wrong, the failure could be in either place — and you will spend days confusing the two.

This sounds like engineering hygiene. It isn't. It's an architectural commitment: the system's *observable failure modes* are organized by *primitive*, so the system's construction has to be organized the same way. A system built primitive-by-primitive has failures that map cleanly to specific architectural decisions. A system built in an interleaved rush has failures that are compounds of several decisions, and the compound doesn't decompose.

The twelve builds arrange into a five-layer ladder, each layer depending on the one below it:

```
LAYER 5 — AUTONOMY          Builds 10-12
   Goal pursuit · plan revision · risk-classified human gates
LAYER 4 — COORDINATION      Builds 7-9
   Coordinator-worker · parallel execution · synthesis
LAYER 3 — TOOL USE          Builds 5-6
   Tool invocation · error classification · sequencing
LAYER 2 — STATE  ◄── LOAD-BEARING
   Builds 3-4 — working memory · context compaction
LAYER 1 — RETRIEVAL         Builds 1-2
   Grounded retrieval · cross-source synthesis with attribution
```

Layer 2 is marked load-bearing for a specific reason. It is the layer most commonly skipped (because Layer 4 looks more interesting), and it is the layer whose absence produces the most expensive failure. Skip Layer 2 and Layer 4 doesn't crash — which is the worst possible outcome, because a crash is a signal you can debug. What happens instead is that Layer 4's coordinator silently accumulates every worker's full message history in its context window, crosses some threshold, loses the oldest worker's output, and returns a confident synthesis missing a quarter of the evidence.

No model upgrade fixes this. A larger context window doesn't fix this. Better prompts don't fix this. The fix is architectural: a mechanism that bounds what the coordinator's context contains, regardless of what any worker produced. That mechanism is Build 4.

---

## 33.3 Build 4, in detail — and why it's really infrastructure

Build 4 introduces **context compaction**: when an agent's working memory crosses a predetermined threshold of its context-window budget, a compaction function rewrites that memory as a fixed-length summary that preserves the *structural* information the agent needs going forward — decisions made, sub-tasks delegated, outstanding questions — while discarding the raw transcript.

Written as a single function, with a specific coordination-preserving prompt:

```python
def compact_history(messages, goal, llm):
    """Replace raw history with a structured summary that preserves
    coordination state — not a generic LangChain-style chat summary.
    """
    prompt = f"""Current goal: {goal}

    Below is an agent's working memory. Compress it to ≤500 tokens.
    You MUST preserve, in this exact order:
      1. Decisions already made (with their justifications).
      2. Sub-tasks delegated and their current status (done / in-flight / blocked).
      3. Open questions the agent still needs to resolve.
      4. Relevant facts retrieved from memory or tools, with sources.
    You MUST discard intermediate reasoning, repeated quoting, and
    anything not needed to continue making coordination decisions.

    History:
    {format_messages(messages)}
    """
    summary = llm(prompt)
    return [{"role": "system", "content": f"COMPACTED CONTEXT:\n{summary}"}]
```

Two things in that prompt are not optional for a coordinator. *Sub-tasks delegated and their current status* — if this is missing, the coordinator forgets what it has asked workers to do, and either double-delegates or quietly abandons work in flight. *Decisions already made* — if this is missing, the coordinator re-derives its plan from scratch at every compaction, and the plan drifts. LangChain's built-in `ConversationSummaryMemory` does *not* preserve either. It's designed for chatbots, where "summarize the conversation" is enough. A coordinator is not a chatbot. A generic summarizer will happily produce a coherent paragraph that omits the sub-task status and makes the coordinator appear to be reasoning fluently while actually having lost track of what half its workers are doing.

This is the single most important paragraph in the chapter, because it is the reason Build 4 is *not* a feature you can grab from a framework's standard library. You have to write the compaction prompt for the specific structural state your coordinator depends on. Generic compaction plus coordinator-worker equals the Marcus failure, dressed up as a framework choice.

### The math that makes overflow inevitable

The coordinator's context at synthesis time is not a fixed quantity. It scales with three variables, and they multiply:

**A** = number of active workers the coordinator is orchestrating.
**D** = depth of each worker's tool-call chain.
**L** = tokens per tool result.

The coordinator's raw-context requirement is roughly $A \times D \times L$, plus coordinator-side reasoning, plus the original task description, plus any retrieved documents. Walk the arithmetic on the page for a realistic multi-agent research setup:

- A = 4 workers
- D = 5 tool calls each (three retrievals, a calculation, a web search)
- L = 500 tokens per tool result (typical for document-chunk or search-snippet payloads)

Raw tool output alone: $4 \times 5 \times 500 = 10{,}000$ tokens. Before the coordinator has written a single token of synthesis. Add each worker's reasoning text (~500 tokens each × 4 = 2,000), the worker→coordinator handoff messages (~300 each × 4 = 1,200), the original task and system prompts (~500), and retrieved documents (~3,000 for three medium chunks). First-cycle coordinator context: ~17,000 tokens.

On a 128K context window, one cycle looks comfortable. Two cycles: 34K. Five cycles: 85K. Seven cycles: 119K — and the coordinator starts hitting soft attention-degradation thresholds well before the hard truncation limit. At ten cycles, you overflow. At twenty cycles, you overflowed so long ago that it's been the default state for half the run.

None of these numbers are exotic. A research agent doing weekly reports on a slow-moving topic hits ten coordination cycles in its second week. The soft-degradation threshold is where systems fail first — which is the worst place for them to fail, because soft degradation produces no error.

### What actually happens when you skip compaction

The coordinator's context is constructed in append order: task, system prompt, worker 1's output, worker 2's output, worker 3's output, worker 4's output, coordinator's synthesis prompt. When the context window is exceeded (either hard-truncated by the API or softly under-weighted by attention), the *oldest* content gets dropped first. The original task and system prompt are often *pinned* at the top of the context. That means the first thing to go is **worker 1's output** — the first worker to report back, appended earliest.

The model has no idea this happened. It synthesizes from what it can see. Worker 1's findings are simply gone, replaced by "no signal" — which the model doesn't distinguish from "no contribution." The synthesis reads fluently. It addresses the question. It references workers 2, 3, and 4. It silently omits whatever worker 1 was asked to investigate.

Three questions worth working through on paper before you run the demo, because the arithmetic teaches more than the trace does:

1. Using $O(A \times D \times L)$, predict the cycle at which the coordinator's context first exceeds 85% of a 128K window. Show your work.
2. Predict which worker's output gets dropped first. The answer follows from one architectural fact about append order.
3. Would a 1M-token context window fix this failure permanently? Give the architectural reason, not the intuitive one.

The answer to (3) is no — and the reason is not that 1M isn't enough. The reason is that $O(A \times D \times L) \times \text{cycles}$ is *unbounded*. Any fixed window is finite. The mechanism that bounds what enters the coordinator is architectural, not parametric. Build a compaction layer, and the coordinator's context is bounded by a fixed compaction budget at every cycle, regardless of what any worker did.

### The empirical threshold the chapter deliberately won't give you

There's a widely-cited claim floating around that "attention degrades past roughly 70–80% context utilization." I rejected putting a specific number in this chapter, and the rejection is worth naming, because it's a kind of architectural lie-by-precision that I want students trained against.

The *directional* claim — that degradation is gradual and worsens as context fills — is supported by the [lost-in-the-middle findings from Liu et al. (2023)](https://arxiv.org/abs/2307.03172) and related follow-up work. The *quantitative* claim that degradation kicks in at some specific percentage is not. Degradation is task-dependent, prompt-position-dependent, model-dependent, and not cleanly thresholded. A student who reads "safe below 80%" and writes a production system around that number has been given false confidence in a quantity that doesn't exist. Operationalized badly, a precise-sounding number is worse than no number — it substitutes for the actual discipline (empirical calibration on your own workload, plus a safety margin, plus trajectory evaluation so you notice when calibration drifts).

Name the direction; don't invent a threshold. Build a trajectory evaluator that surfaces the failure when it happens.

---

## 33.4 The other eleven builds, and why they surround Build 4

Eleven builds are scaffolding around the one that carries the load. The scaffolding is not decoration — each build introduces a primitive you need, in a dependency order that prevents the compound-failure problem. The briefest possible reference:

| # | Layer | Primitive introduced | Failure if skipped |
|---|---|---|---|
| 1 | Retrieval | Grounded retrieval loop | Confabulation propagates everywhere |
| 2 | Retrieval | Cross-source synthesis + attribution | Untraceable worker outputs in B9 |
| 3 | State | Working memory across turns | No conversational continuity |
| **4** | **State** | **Context compaction** | **Silent coordinator overflow in B7–12** |
| 5 | Tool use | Tool invocation + error classification | Uncaught exceptions crash coordination |
| 6 | Tool use | Tool selection + sequencing | Workers can't multi-step; hallucinated "results" go unflagged |
| 7 | Coordination | Task delegation (coordinator-worker) | Can't decompose or scale |
| 8 | Coordination | Concurrent execution + synthesis | Overflow without B4; no parallelism without B7 |
| 9 | Coordination | Retrieval in distributed context | Ungrounded, unattributed worker outputs |
| 10 | Autonomy | Meta-reasoning self-evaluation | First answer always accepted |
| 11 | Autonomy | Adaptive plan revision | Agent retries same approach when stuck |
| 12 | Autonomy | Full autonomy + human approval gates | Irreversible actions execute without oversight |

A few cross-build dependencies are worth naming out loud because they're where most build-order mistakes show up:

- **Build 2 → Build 9.** If your retrieval pipeline doesn't attribute chunks to sources (B2), then when two workers in B9 produce conflicting summaries of the same document, the coordinator has no way to resolve the conflict. Source attribution is the primitive that makes distributed retrieval *composable*; without it, B9's workers produce outputs that can't be reconciled at synthesis time.
- **Build 5 → Build 7.** If your tool-use agent doesn't classify retryable-vs-fatal errors (B5), then when a worker in a coordinator-worker system (B7) hits a transient API failure, the uncaught exception propagates up and crashes the coordinator. The coordination layer is only as resilient as the tool-use layer beneath it.
- **Build 10 → Build 11.** Self-evaluation (B10) without plan revision (B11) produces an agent that keeps re-trying the same approach and keeps failing the same way. Plan revision without self-evaluation produces an agent that changes its plan for no reason. Both primitives have to be present for adaptive goal pursuit to work.
- **Builds 1–11 → Build 12.** The human-approval gate in B12 is only as effective as the trajectory evaluator watching it. An approval node that just blocks on every action will produce approval fatigue (see Ch. 23). The useful version classifies actions by reversibility and scope — which requires that the system has been tracking those properties all along, in state preserved through compaction (B4), across coordination cycles (B7–9), with explicit plan representation (B11). The authorization logic is load-bearing, and it depends on every prior build working correctly.

Every row in the table is a specific failure mode — not a feature to cross off, but a primitive whose absence has a predictable, reproducible consequence in later builds.

---

## 33.5 Back to Priya and Marcus

Both Priya and Marcus shipped. One system survived contact with production. The one that survived was not the one whose author knew more about agents. It was the one whose author had built the boring-looking state-management primitive before reaching for the interesting-looking coordination primitive.

I conclude, from this pattern, that the right question to ask a team shipping a multi-agent system is not "which model are you using" or even "what framework." It's "show me your Build 4." If the answer is "we're using LangChain's default summarization," you have a Marcus-in-waiting, and the failure will arrive somewhere between weeks two and eight. If the answer is "we wrote a coordination-preserving compaction function that explicitly tracks sub-task state," you have a system with a chance.

This is the book's master argument — architecture is the leverage point, not the model — in one specific, operationally testable form. Marcus's prompts were better. His coordinator was more elegant. The model he used was identical to Priya's. None of those things mattered at the point of failure, because the failure happened in the *data structure the coordinator received*, and that data structure was determined by an architectural decision Marcus hadn't made.

The twelve builds are not twelve lessons about agentic AI. They are twelve load-bearing components, in a dependency order that matters. Build them in sequence and you arrive at Build 12 with a system whose failures you understand, because you built the instrumentation for each failure class as you went. Build them out of order — or skip the load-bearing one because it looked boring — and you arrive at a system that passes evaluation and fails in production, in ways that take weeks to diagnose, because the instrumentation that would have made the failure visible was never built.

The chapter's practical counsel reduces to one sentence. **Build 4 before Build 7.**

### Where this chapter sits in the book

This chapter is the operational complement to Chapter 2's six-layer architectural stack. Chapter 2 named the layers. This one teaches the *order* to assemble them. Chapter 14's observability argument (dollar-per-decision) depends on trajectory evaluation being in place, which depends on the build sequence reaching at least B8 without skipping B4. Chapter 18's security argument about code-enforced boundaries applies verbatim to Build 12's approval gates. Chapter 23's emergence argument predicts the compound failures that appear when Build 4 is missing from a production multi-agent system.

The agent system works the way its construction ordered it to work. Change the order, and you change which failures are visible to you — which changes which failures you can actually fix.

---

**What would change my mind:** A well-documented production multi-agent system (≥4 workers, ≥3 cycles, ≥8 weeks of operation) that ran reliably *without* an explicit compaction layer, using only the underlying model's native context window and no custom coordination-preserving summarization. The chapter's argument is that architectural bounding of the coordinator's context is required at production scale; a clean counter-example would force me to specify the conditions under which the native window plus standard framework summarization is sufficient.

**Still puzzling:** How to compute the compaction-threshold dynamically from $O(A \times D \times L)$ at runtime, rather than fixing it statically per deployment. The static threshold (50% in the notebook) is correct for the example workload and wrong for almost anything else. A production system should compute the threshold from expected worker count, tool-call depth, and estimated tokens-per-result *before* the task begins, re-estimate mid-task as the actuals come in, and trigger early compaction when the projection crosses a safety margin. I know what the function needs to take as input. I don't yet have a clean rule for the safety margin, and the honest answer is that it probably needs to be calibrated empirically against the deployment's actual trajectory data.

---

**Tags:** multi-agent-orchestration, context-compaction, build-sequence-scaffolding, lost-in-the-middle, coordinator-overflow



---
---
---

# DRAFTING MATERIALS — not for publication

*Below this line: research notes and hero image brief. Strip before final edition assembly.*

---

## Research notes

*No research notes produced alongside this draft.*


---

## Hero image brief

*No image brief produced alongside this draft.*

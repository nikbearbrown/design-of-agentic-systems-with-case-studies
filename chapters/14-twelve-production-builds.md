# Chapter 14 — Twelve Production Builds: A Scaffolded Project Sequence

**Author:** [Student — TA to fill in]
**Editor:** Nik Bear Brown

---

## 14.0 Opening: Priya and Marcus

I'm going to start with a story. Call it a case study if you want, but I should tell you up front: Priya and Marcus are a composite. Not a real pair — a close rendering of the pattern I've seen at least three times every semester in my production-agents capstone. I'm labeling the case up front because the chapter's argument doesn't get any rhetorical benefit from pretending they're real.

Both built multi-agent research assistants for the same class. Same model. Same framework. Same papers read — coordinator-worker patterns, parallel execution, retrieval-augmented generation. Both shipped systems that worked on their evaluation rubric: a small set of representative queries, model-graded answers, a dashboard that turned green.

Marcus's code was, by any reasonable reading, better. His coordinator prompt was more carefully written. His agent role definitions were more precise. He could draw the six-layer stack from Chapter 2 on a whiteboard without thinking about it. Priya's system was rougher around the edges — her prompts were adequate, not elegant — but it worked.

In production, Marcus's system failed within two weeks. Not dramatically: it kept producing confident, fluent research summaries. It just stopped producing *complete* ones. Somewhere between the third and fifth research worker's output, a whole worker's contribution silently vanished from the coordinator's synthesis. The outcome evaluator, which graded the final synthesis against the query, kept passing. The trajectory evaluator — which checks that every worker's output actually appears in the final answer — was the only signal that something was wrong. Marcus hadn't built a trajectory evaluator.

Priya's system didn't have this failure. Same model, same framework, same queries. The only architectural difference: before she wired the coordinator to workers, she'd built a single-agent state-management layer that compressed its own working memory when it got close to the context window's limit. When she built the coordinator later, she inherited that layer — so her coordinator's context was bounded by a fixed summary, regardless of how much each worker had done.

Marcus had skipped that build. He'd gone straight from a stateless RAG agent to coordinator-worker, because coordinator-worker was the interesting architecture and state management looked boring.

The difference wasn't the model. Wasn't the prompt. Was that Priya had built Build 4 before Build 7, and Marcus hadn't. This chapter is about why that dependency is unavoidable, why it doesn't show up until production, and what the other eleven builds around the load-bearing one actually do.

### Learning objectives

By the time you close this chapter, you should be able to:

- **Apply** the primitive-isolation principle to diagnose which architectural change caused a specific failure in a multi-agent system.
- **Derive** the coordinator-context growth formula O(A × D × L) and use it to predict the cycle at which a given workload will overflow a given context window.
- **Write** a coordination-preserving compaction prompt, and explain in one paragraph why it differs from a generic conversation summary.
- **Identify** which of the twelve builds is missing from a production system, given a description of the failure mode.
- **Order** a proposed set of architectural primitives into a build sequence that respects dependencies, and defend the ordering.
- **Critique** proposed fixes — bigger context window, better prompts, new model — that don't address the architectural root cause.

Notice what's missing from that list. I haven't asked you to "understand" multi-agent systems or to "know about" context compaction. Every objective names something you should be able to DO. If you can't do those six things by the end, the chapter didn't work — regardless of how much you think you understood.

### Prerequisites

You should walk in with:

- **Chapter 2's six-layer architectural stack.** I will reference the layers by name and not re-derive them. If they feel fuzzy, re-read Chapter 2 first.
- **Working familiarity with LLM API calls.** Messages, roles, context windows, tokens, truncation behavior. I don't need you to remember every API's quirks, but you should know what it means when I say "the coordinator's context exceeded 85% of its window."
- **Python comfortable enough to read and modify a compaction function.** No deep library knowledge. If you can read a function that takes a list of messages and returns a list of messages, you're fine.
- **One completed RAG pipeline of your own.** Not one you read about — one you built. Layer 1 intuitions need to be lived, not absorbed.

### Why this chapter matters

The book's thesis, repeated from the first chapter: the leverage in agentic systems is architectural, not model-level. A better model won't save a badly-assembled system. A worse model can be made to ship reliably by assembling it well.

That thesis has been making claims. This chapter makes it operational. I'll show you the specific dependency order in which the twelve primitive builds need to be assembled, I'll spend most of the chapter on the one build that actually carries the load, and I'll give you the math that makes the dependency non-negotiable. When you're done, you should be able to look at someone else's production multi-agent system and predict, within minutes, whether it will survive contact with reality.

---

## 14.1 Primitive Isolation: The First Architectural Discipline

Suppose your multi-agent system has started returning research syntheses that miss one of the four workers' contributions. The failure is intermittent — maybe three times in ten — and when you inspect the coordinator's output, everything looks plausible. Last week you made six architectural changes: you swapped retrieval backends, added a second worker pool, changed the coordinator's synthesis prompt, introduced a caching layer, raised the temperature on workers, and started compacting context.

Which of those six changes caused the failure?

You don't know. You can't know. Every one of them could plausibly produce the symptom you're seeing, and the symptoms don't decompose. A bad retrieval backend could return empty results that the coordinator silently excludes from synthesis. A second worker pool could have introduced a race condition where workers write to shared state out of order. A synthesis prompt change could have added a hidden filter. A caching layer could be returning stale data for one worker only. Higher temperature could make one worker's output look too noisy to include. A new compaction layer could be dropping one worker's contribution when compressed.

Each change, in isolation, is debuggable. Six changes at once are not six debugging problems. They are 2^6 = 64 candidate failure modes, most of which are interactions between changes. You will spend the next four days in the wrong place.

### The machinery

The governing principle of the build sequence: **never introduce two new architectural primitives at once.**

What "primitive" means here is specific. A primitive is a unit of architectural commitment — a pattern like "coordinator delegates to workers" or "tool calls are retried on transient errors" or "context is compacted at 50% utilization." Primitives are not individual lines of code. They're not individual prompts. They're the architectural decisions that show up in the system's dependency graph, the decisions another engineer would draw on a whiteboard when describing your system.

Introduce one primitive per build. Observe its failure modes in isolation. Write the evaluators that catch those failures. Only then introduce the next primitive. When the system fails, the failure maps to exactly one recent architectural change, because there's only one that could be responsible.

This sounds like engineering hygiene. It isn't. It's an architectural commitment: the system's *observable failure modes* are organized by *primitive*, so the system's construction has to be organized the same way. A system built primitive-by-primitive has failures that map cleanly to specific architectural decisions. A system built in an interleaved rush has failures that are compounds of several decisions, and the compound doesn't decompose.

### Why this is unusual

In general software engineering, "move fast and break things" is often correct. A web application can tolerate interleaved changes because its failure modes are usually loud — a null pointer, an HTTP 500, a test that fails, a page that doesn't render. The feedback loop from change to failure is minutes, not weeks.

Multi-agent systems have a different failure characteristic. Their dominant failure mode is **silent correctness degradation**: the system keeps producing fluent output, confidently, with no exception and no error log, while the content of that output drifts away from correct. The feedback loop from change to observable failure is not minutes; it's weeks, and the failure only becomes observable through evaluation harnesses you had to build in advance.

That asymmetry is what makes primitive isolation load-bearing for this domain specifically. If I could see my failures in five minutes, I could afford to introduce six primitives at once and bisect. I can't. The failure won't show up for ten days, and by then my commit history has drifted far enough that bisection costs more than the feature did.

### Worked example: two debugging sessions

Consider two teams, both debugging the "missing-worker-contribution" failure above.

*Team A (interleaved changes, no isolation).* The team reviews the six changes, forms hypotheses about which might be responsible, and begins instrumenting each in turn. The caching layer is suspect, so they add cache-miss logging. The logs show no cache misses for the missing worker. They suspect the synthesis prompt, so they diff it against the previous version and add a side-by-side evaluator. The side-by-side shows no systematic difference. They suspect the new worker pool's race condition, so they add lock instrumentation. The locks are never contended. Four days in, they haven't found it. On day five, someone notices that the compaction layer drops worker 1's output when the combined worker outputs exceed a threshold. The compaction layer wasn't on their suspect list because it "was supposed to just summarize things."

*Team B (primitive isolation).* The team had introduced one primitive per build. The compaction layer (Build 4) was introduced alone. Before introducing it, they built a trajectory evaluator that asserts "every worker's output must appear, in some form, in the final synthesis." They ran that evaluator against the pre-compaction coordinator: it passed. They ran it against the post-compaction coordinator: it failed, immediately, on 30% of queries. They found the issue within an hour of introducing the primitive — not because they were smarter than Team A, but because they had isolated the change to a single primitive whose known failure modes they had already written tests for.

The general lesson: primitive isolation isn't about caution. It's about *attribution*. The same failure is days to diagnose under interleaved changes and minutes to diagnose under isolated ones. The cost structure of the debugging time is determined entirely by the decision you made about build order, not by the bug itself.

### The common misconception

"I'll just be careful about which changes I make, and keep them in my head."

No, you won't. You'll be careful for the first three changes, then you'll have a deadline, then you'll interleave two changes because they seemed unrelated, then one of them will turn out to have interacted with one of the careful changes from two weeks ago, and the interaction is where the failure lives. Your carefulness doesn't survive a production deadline. Architectural discipline — one primitive per build, with an evaluator for its failure modes before the next build starts — does, because it doesn't rely on your memory.

---

## 14.2 The Five-Layer Ladder and What "Load-Bearing" Means

The twelve builds are not twelve independent lessons. They arrange into five layers, each depending on the one below. But not every layer depends on every earlier layer the same way. One layer is load-bearing — which means if you skip it, the layers above don't crash. They fail silently.

That distinction matters enough that I want to define it before I show you the ladder.

A **visible dependency** is one where the dependent layer breaks loudly if the layer below is missing. If I try to build coordinator-worker delegation (Build 7) without having built tool-use (Builds 5-6), my workers can't do anything, and the system returns empty results. That's a loud failure. I'll notice within minutes.

A **load-bearing dependency** is one where the dependent layer keeps running if the layer below is missing — but produces outputs that are subtly wrong, with no error, no exception, no signal. You don't know you have the bug until you happen to check the right invariant on the right query, and you probably won't, because the system looks fine.

### The ladder

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

### Reading the ladder

**Layer 1 (Retrieval).** You build a grounded retrieval loop that can fetch relevant content for a query, then extend it to pull from multiple sources with attribution. Without Layer 1, every agent above it confabulates, because confabulation is what language models do when they have nothing to ground in.

**Layer 2 (State).** You build working memory across turns, then add context compaction so the working memory stays bounded when it grows. Layer 2 is where the load-bearing primitive lives, and I'll spend most of Section 14.3 on it.

**Layer 3 (Tool Use).** Your agent can invoke tools, classify errors as retryable or fatal, and sequence multiple tool calls. Without Layer 3's error classification, any transient failure (a rate limit, a timeout, a flaky API) propagates upward and crashes the coordination layer when you build it.

**Layer 4 (Coordination).** Coordinator-worker, parallel execution, synthesis. This is the architecturally interesting layer — the one students reach for first and the one that papers describe in detail. It's also the layer that fails silently when any lower layer was skipped.

**Layer 5 (Autonomy).** Meta-reasoning, adaptive plan revision, human approval gates. The most visible "agentic" behaviors. Every one of them depends on every layer below working correctly. Skip a layer; you get the appearance of autonomy without its substance.

### What "load-bearing" means, concretely

Layer 2 is the load-bearing layer because its absence produces silent failure in Layer 4. Skip Layer 2 and Layer 4's coordinator doesn't crash — which is the worst possible outcome, because a crash is a signal you can debug. What happens instead: Layer 4's coordinator silently accumulates every worker's full message history in its context window, crosses some threshold, loses the oldest worker's output, and returns a confident synthesis missing a quarter of the evidence.

I want to be precise about what "load-bearing" is not. It's not that Layer 2 is *more important* than Layer 1, or that building Layer 2 is harder. It's that skipping Layer 2 produces a failure you cannot see from Layer 4's outputs alone. The only way to catch the failure is with a trajectory evaluator built at Layer 2's level — one that checks the invariant "worker N's output appears in the coordinator's final synthesis." If you didn't build Layer 2, you probably didn't build that evaluator, because there was nothing at Layer 2 to evaluate. You skipped the layer AND the instrumentation that would have made its absence visible.

### Worked example: tracing a dependency

Consider this claim: Build 5 (tool-use with error classification) is a dependency of Build 7 (coordinator-worker delegation). Walk the dependency.

A worker in a coordinator-worker system is, at base, an agent that invokes tools on behalf of the coordinator. If the worker hits a transient API failure — a 429 rate limit, a 503 service unavailable, a timeout — what happens next depends entirely on whether Build 5 is in place.

*With Build 5:* the worker catches the transient error, classifies it as retryable, waits a backoff interval, and retries. On the third retry, it succeeds. The coordinator sees a single (slightly delayed) result from the worker. The system is resilient.

*Without Build 5:* the worker lets the exception propagate. The exception reaches the coordinator, which was not expecting a worker to fail ungracefully. Depending on how the coordinator is implemented, either (a) the whole coordination cycle crashes and the user gets a 500, or (b) the coordinator logs the exception and silently excludes the failing worker from synthesis, producing a missing-worker symptom that looks identical to the Build 4 failure described earlier.

Notice what just happened. A Build 5 failure (missing error classification) produces the *same observable symptom* as a Build 4 failure (missing context compaction): missing worker contribution in synthesis. If you skipped both builds, you have two silent failure modes producing identical outputs. Your trajectory evaluator sees the symptom. It can't tell you which build was missing without additional instrumentation at each layer. The cost of tracing which is at fault is linear in the number of skipped builds.

The general lesson: every build in the sequence adds not just a primitive but also the *attributable failure mode* that goes with it. Skip a build and you skip both — the primitive AND the ability to tell, later, that it was this specific layer that failed.

### Misconception: "interesting" versus "load-bearing"

Students reach for Layer 4 first because it's architecturally interesting. Coordinator-worker, parallel execution, emergent behavior from composed agents — these are the ideas that made them want to build agentic systems in the first place.

Layer 2 looks boring. "Working memory with compaction" sounds like infrastructure, like plumbing, like the thing a framework should provide. It is, in fact, infrastructure. That's exactly why it's load-bearing. Infrastructure is what carries the load of everything built on top of it. The reason the framework's default compaction doesn't work (Section 14.3) is precisely that the framework doesn't know what your coordinator's structural state is. You do.

---

## 14.3 Context Compaction as Infrastructure

OK. Let's do the math.

You have a coordinator orchestrating four research workers. Each worker does a chain of five tool calls, each returning about 500 tokens of retrieved content. Before the coordinator has written a single token of its own synthesis, how much context has it already accumulated?

Work it out on paper. I'll wait.

### Deriving the growth formula

The coordinator's context at synthesis time is not a fixed quantity. It scales with three variables, and they multiply:

- **A** = number of active workers the coordinator is orchestrating
- **D** = depth of each worker's tool-call chain
- **L** = tokens per tool result

The coordinator's raw-context requirement from worker output alone is roughly A × D × L. Add each worker's reasoning text, the worker-to-coordinator handoff messages, the original task description, the system prompts, and any retrieved documents, and you get the full context at cycle 1.

Walking the arithmetic on a realistic multi-agent research setup:

- A = 4 workers
- D = 5 tool calls each (three retrievals, a calculation, a web search)
- L = 500 tokens per tool result

Raw tool output: 4 × 5 × 500 = 10,000 tokens.

Now add everything else:

- Worker reasoning text (~500 tokens × 4 workers): 2,000 tokens
- Worker-to-coordinator handoff messages (~300 × 4): 1,200 tokens
- Original task and system prompts: ~500 tokens
- Retrieved documents (three medium chunks): ~3,000 tokens

First-cycle coordinator context: ~17,000 tokens. Before the coordinator has synthesized anything.

On a 128K-token context window, one cycle looks comfortable. It's 13% of the window. Plenty of headroom.

Scale it up. The coordinator responds to each worker, asks follow-up questions, maybe assigns additional work. Each new cycle adds roughly another 17K tokens to the context, because the prior cycle's messages don't leave — they accumulate.

- Cycle 1: 17K tokens (13% of 128K)
- Cycle 2: 34K (27%)
- Cycle 5: 85K (66%)
- Cycle 7: 119K (93%)
- Cycle 8: overflow

At cycle 7, the coordinator is hitting soft attention-degradation well before the hard truncation limit. At cycle 10, you've overflowed. At cycle 20, you overflowed so long ago that it's been the default state for half the run.

Nothing about these numbers is exotic. A research agent doing weekly reports on a slow-moving topic hits ten coordination cycles in its second week of operation. The soft-degradation threshold is where systems fail first — which is the worst place for them to fail, because soft degradation produces no error.

### What actually happens at overflow

The coordinator's context is constructed in append order: task prompt, system prompt, worker 1's output, worker 2's output, worker 3's output, worker 4's output, coordinator's synthesis prompt. When the context window is exceeded — either hard-truncated by the API or softly under-weighted by the model's attention mechanism — the *oldest* content gets dropped first. The original task and system prompts are often *pinned* at the top of the context. That means the first thing to go is the earliest-appended worker output: **worker 1's output**.

The model has no idea this happened. It synthesizes from what it can see. Worker 1's findings are simply gone, replaced by "no signal" — which the model doesn't distinguish from "no contribution." The synthesis reads fluently. It addresses the question. It references workers 2, 3, and 4. It silently omits whatever worker 1 was asked to investigate.

This is the Marcus failure. This is why the trajectory evaluator matters and the outcome evaluator doesn't catch it.

### Why a bigger context window doesn't fix this

A student's first instinct, reading the above: "OK, so just use a model with a bigger context window. Problem solved."

No. The growth formula is unbounded in cycles. Let me show you.

Coordinator context at cycle N ≈ N × (A × D × L + overhead)

The product A × D × L × N grows linearly with N. Any fixed window is finite. For any context window size W, there exists a cycle count N* beyond which the accumulated context exceeds W. Bigger windows push N* later; they don't eliminate it. On a 128K window with the workload above, N* ≈ 7. On a 1M window, N* ≈ 58. Both systems overflow; one overflows later.

If your agent runs for more than N* cycles, a fixed window is insufficient, full stop. The *mechanism* that bounds what enters the coordinator must be architectural — a rule for what stays in context and what gets summarized — not parametric, not "wait for the next model release."

This is what I mean when I say Build 4 is not a feature. It's infrastructure. It's the architectural commitment that turns an unbounded linear accumulation into a bounded compacted state.

### The compaction function

Here is the function, with a specific coordination-preserving prompt:

```python
def compact_history(messages, goal, llm):
    """Replace raw history with a structured summary that preserves
    coordination state — not a generic chatbot-style summary.
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

Two things in that prompt are not optional for a coordinator.

*Sub-tasks delegated and their current status.* If this is missing, the coordinator forgets what it has asked workers to do, and either double-delegates or quietly abandons work in flight. You will see this as "the coordinator keeps asking worker 3 to do something it already did three cycles ago" or, worse, "the coordinator stopped tracking that worker 4 was still working on the tax analysis, so it synthesized the final answer without waiting for it."

*Decisions already made.* If this is missing, the coordinator re-derives its plan from scratch at every compaction, and the plan drifts. Each compaction cycle, the coordinator arrives at a slightly different plan from the last one — not because the situation has changed, but because it's re-reasoning from a summary that no longer contains the previous reasoning. Over five cycles, the plan can drift enough that the final synthesis answers a different question than the one originally asked.

### Why generic summarization is worse than no summarization

Frameworks ship default summarizers. LangChain's `ConversationSummaryMemory`, for instance. These are designed for chatbots, where "summarize the conversation" is enough — the chatbot's next response doesn't depend on a structured representation of delegated work and open decisions.

A coordinator is not a chatbot. A generic summarizer will happily produce a coherent paragraph that omits sub-task status and makes the coordinator appear to be reasoning fluently while actually having lost track of what half its workers are doing.

This matters enough to restate. Generic compaction + coordinator-worker = the Marcus failure, dressed up as a framework choice. You have to write the compaction prompt for the specific structural state your coordinator depends on. You can't grab this from a library, because the library doesn't know what your coordinator's state contains.

This is the single most important paragraph in the chapter. If you remember one thing, remember: **the compaction prompt must preserve the exact structural fields your coordinator reads from.** Generic "conversation summarization" will not preserve them, and generic compaction is indistinguishable in output from no compaction at all, until a trajectory evaluator catches the silent failure weeks later.

### Worked example: computing your safe cycle count

Suppose your production multi-agent system has these parameters:

- A = 6 workers
- D = 8 tool calls per worker
- L = 800 tokens per tool result (longer, because you're using rich document chunks)
- Context window: 200K tokens
- Per-cycle overhead (reasoning, handoffs, task): ~4,000 tokens

Per-cycle context growth: (6 × 8 × 800) + 4,000 = 38,400 + 4,000 = 42,400 tokens.

Cycle at which you approach soft degradation (say, 75% of 200K = 150K): 150,000 / 42,400 ≈ 3.5 cycles.

Cycle at which you overflow hard: 200,000 / 42,400 ≈ 4.7 cycles.

So *this specific workload cannot survive past cycle 3 without compaction*, and between cycle 3 and cycle 4, you are in the soft-degradation zone where the model keeps producing output but quality drifts. If your agent is designed to run five or more coordination cycles, you need Build 4 in place before you ship.

The general lesson: the formula tells you the safe cycle count for any given workload, any given context window. The formula does not tell you what the safe *percentage* of context utilization is. That brings me to the next point.

### The threshold this chapter deliberately won't give you

There's a widely-cited claim that "attention degrades past roughly 70–80% context utilization." I rejected putting a specific number in this chapter, and the rejection is worth naming, because it's a kind of architectural lie-by-precision that I want you trained against.

The *directional* claim — that degradation is gradual and worsens as context fills — is supported by the [lost-in-the-middle findings from Liu et al. (2023)](https://arxiv.org/abs/2307.03172) and related follow-up work. The *quantitative* claim that degradation kicks in at some specific percentage is not. Degradation is task-dependent, prompt-position-dependent, model-dependent, and not cleanly thresholded. A student who reads "safe below 80%" and writes a production system around that number has been given false confidence in a quantity that doesn't exist. Operationalized badly, a precise-sounding number is worse than no number — it substitutes for the actual discipline (empirical calibration on your own workload, plus a safety margin, plus trajectory evaluation so you notice when calibration drifts).

Name the direction; don't invent a threshold. Build a trajectory evaluator that surfaces the failure when it happens. Adjust your compaction threshold based on what the evaluator tells you about your specific workload on your specific model. That's the actual discipline. "Compact at 70%" is the cargo-cult version.

---

## 14.4 Integration: The Other Eleven Builds and How They Depend on Each Other

Eleven builds surround the one that carries the load. The scaffolding is not decoration — each build introduces a primitive you need, in a dependency order that prevents the compound-failure problem.

The briefest possible reference:

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

A few cross-build dependencies are worth naming because they're where most build-order mistakes show up:

**Build 2 → Build 9.** If your retrieval pipeline doesn't attribute chunks to sources (B2), then when two workers in B9 produce conflicting summaries of the same document, the coordinator has no way to resolve the conflict. Source attribution is the primitive that makes distributed retrieval *composable*; without it, B9's workers produce outputs that can't be reconciled at synthesis time. You'll see this as "the coordinator picks arbitrarily between conflicting worker claims," which is another silent-failure mode.

**Build 5 → Build 7.** If your tool-use agent doesn't classify retryable-vs-fatal errors (B5), then when a worker in a coordinator-worker system (B7) hits a transient API failure, the uncaught exception propagates up and crashes the coordinator. The coordination layer is only as resilient as the tool-use layer beneath it. This one you'll see as a loud failure rather than a silent one, which is the first time in the chapter I've said something nice about a failure mode.

**Build 10 → Build 11.** Self-evaluation (B10) without plan revision (B11) produces an agent that keeps re-trying the same approach and keeps failing the same way. Plan revision without self-evaluation produces an agent that changes its plan for no reason. Both primitives have to be present for adaptive goal pursuit to work. They're tightly coupled; you can't meaningfully test one without the other.

**Builds 1–11 → Build 12.** The human-approval gate in B12 is only as effective as the trajectory evaluator watching it. An approval node that just blocks on every action will produce approval fatigue. The useful version classifies actions by reversibility and scope — which requires that the system has been tracking those properties all along, in state preserved through compaction (B4), across coordination cycles (B7–9), with explicit plan representation (B11). The authorization logic is load-bearing, and it depends on every prior build working correctly. You can't bolt safety on at the end. You have to build the infrastructure safety depends on throughout.

### Worked example: diagnosing an unknown system

Suppose I hand you a description of a production system:

> Research assistant for policy analysts. Uses a single coordinator delegating to 5 parallel workers. Each worker does 6–10 tool calls (retrieval, web search, calculation). Runs 3–8 coordination cycles per query. Uses Claude Sonnet on a 200K context window. Uses LangChain's built-in `ConversationSummaryMemory` for all agents. Has passed its outcome-quality evaluation with a 92% approval rate over three months. Users have recently started reporting that syntheses "feel incomplete," but no quality metric has moved.

Predict the failure. What build is missing? What would a trajectory evaluator reveal?

*Reasoning it through.* The workload: A = 5, D average = 8, L estimated = 500. Per-cycle growth ≈ 5 × 8 × 500 + overhead ≈ 22,000 tokens. At 3–8 cycles, context at maximum: 176,000 tokens — 88% of the 200K window. They're in soft-degradation territory on every long-running query.

They have compaction, technically — LangChain's built-in. But `ConversationSummaryMemory` is a generic chatbot summarizer; it doesn't preserve sub-task status or delegated-work tracking. So either (a) the compaction isn't firing because LangChain's default threshold is lower than they need and it's treating the state as fine, or (b) it's firing but producing summaries that lose coordination state.

The outcome evaluator passes because the synthesis reads fluently and answers the question plausibly. It doesn't catch "one worker's contribution is missing" because its grading rubric is about overall answer quality, not about evidential coverage. Users noticing "feel incomplete" is the signal — humans are catching what the evaluator doesn't.

*Predicted fix.* They need a trajectory evaluator that asserts "every worker's contribution appears in synthesis" (Build 4's evaluator, which they skipped). Once that's in place, the evaluator will start failing on exactly the queries users flagged. Then they need to replace the generic summarizer with a coordination-preserving compaction prompt of the kind in Section 14.3.

The general lesson: given a system's observable behavior and its architecture, the build sequence lets you predict which builds are missing. The symptoms map to specific layers. "Feels incomplete + passes outcome evaluator" is a Layer-2 signature. The diagnosis is reproducible.

---

## 14.5 Priya and Marcus, Revisited

Both Priya and Marcus shipped. One system survived contact with production. The one that survived was not the one whose author knew more about agents. It was the one whose author had built the boring-looking state-management primitive before reaching for the interesting-looking coordination primitive.

I conclude, from this pattern, that the right question to ask a team shipping a multi-agent system is not "which model are you using" or even "what framework." It's "show me your Build 4." If the answer is "we're using LangChain's default summarization," you have a Marcus-in-waiting, and the failure will arrive somewhere between weeks two and eight. If the answer is "we wrote a coordination-preserving compaction function that explicitly tracks sub-task state, and we have a trajectory evaluator that asserts every worker's contribution appears in synthesis," you have a system with a chance.

This is the book's master argument — architecture is the leverage point, not the model — in one specific, operationally testable form. Marcus's prompts were better. His coordinator was more elegant. The model he used was identical to Priya's. None of those things mattered at the point of failure, because the failure happened in the data structure the coordinator received, and that data structure was determined by an architectural decision Marcus hadn't made.

The twelve builds are not twelve lessons about agentic AI. They are twelve load-bearing components, in a dependency order that matters. Build them in sequence and you arrive at Build 12 with a system whose failures you understand, because you built the instrumentation for each failure class as you went. Build them out of order — or skip the load-bearing one because it looked boring — and you arrive at a system that passes evaluation and fails in production, in ways that take weeks to diagnose, because the instrumentation that would have made the failure visible was never built.

The chapter's practical counsel reduces to one sentence: **Build 4 before Build 7.**

---

## 14.6 Exercises

None of these come with solutions in this chapter. Solutions are in Appendix B. Work them on paper before looking at the answers — the arithmetic is where the understanding lives.

### Warm-up (mechanical application)

**Exercise 14.1** *(Objective: derive O(A × D × L))* — Given a multi-agent system with A = 3 workers, D = 4 tool calls per worker, L = 600 tokens per tool result, and per-cycle overhead of 3,000 tokens, compute the per-cycle coordinator context growth. At what cycle does the coordinator first exceed 75% of a 100K-token context window?

**Exercise 14.2** *(Objective: identify missing build from failure mode)* — A production multi-agent system produces syntheses that are consistently well-written and address the user's question, but analysts have started noticing that citations in the syntheses are occasionally attributed to the wrong source document. The outcome evaluator still passes. Which build is most likely missing? What evaluator would catch the failure reproducibly?

**Exercise 14.3** *(Objective: identify missing build from failure mode)* — A coordinator-worker research system crashes with an unhandled exception roughly once every 40 queries. The exception traces back to worker invocations of an external web-search API. The error happens only during periods of high external traffic. Which build is missing? Is this a silent or loud failure? Which is preferable, and why?

### Application (translation to new problems)

**Exercise 14.4** *(Objective: write coordination-preserving compaction)* — Write a compaction prompt for a coordinator whose structural state contains: (a) the user's original research question, (b) a list of hypotheses the coordinator is currently testing, (c) the worker assigned to each hypothesis, (d) interim findings with source attribution. Your prompt must preserve all four, in any rewritten-summary format, and must be no longer than 200 words. Defend your choice of which information to explicitly discard.

**Exercise 14.5** *(Objective: predict overflow cycle for variable workloads)* — Your production system currently handles two workload types. Type A: 2 workers, 5 tool calls each, 400 tokens per result. Type B: 8 workers, 3 tool calls each, 900 tokens per result. Both run on a 128K context window. For each workload, compute the cycle at which overflow occurs. Which workload requires compaction more urgently? Why might the less-urgent workload still benefit from compaction?

**Exercise 14.6** *(Objective: critique an architectural fix)* — A teammate proposes: "Our context overflow problem is fixed — we just upgraded to a model with a 1M-token window." Using the O(A × D × L) formula, give a one-paragraph response that identifies why this is not a fix and what the actual remedy is. Include a specific numerical example.

**Exercise 14.7** *(Objective: apply primitive isolation)* — You're debugging an intermittent failure in a multi-agent system. In the past week, four architectural changes were made, in this order: (1) added a new retrieval backend, (2) changed the coordinator's synthesis prompt, (3) introduced context compaction, (4) added a second worker pool for parallel execution. The failure started appearing after change (3). Using primitive isolation, describe the debugging procedure that attributes the failure to a single primitive. What evaluator should have been built before change (3) was introduced?

### Synthesis (multiple concepts)

**Exercise 14.8** *(Objectives: identify builds, order primitives)* — Here is a description of a hypothetical production multi-agent system. Identify which builds from 1–12 are present and which are missing, using the observable behavior as evidence. Propose a build sequence to fill the gaps in dependency order.

> Customer-support assistant. Uses a single RAG-style agent (no coordinator). Has conversational memory that persists across a user session. Can call three tools: ticket lookup, knowledge-base search, and escalation to a human. Never retries on tool failure — if the tool fails, the agent tells the user "something went wrong." Has no plan representation — responds reactively to each user message. No autonomous goal pursuit; every action is prompted by a user message.

**Exercise 14.9** *(Objectives: cross-build dependencies, load-bearing reasoning)* — A team is planning to add a human approval gate (Build 12) to their existing production system. Their system currently implements Builds 1–7 cleanly but skipped Builds 8 (synthesis), 10 (self-evaluation), and 11 (plan revision). Explain, with reference to the cross-build dependencies, why their approval gate will be ineffective as proposed. What minimum set of missing builds must be added first?

**Exercise 14.10** *(Objectives: ordering, defending, dependencies)* — You're advising a team building a research assistant. They have six weeks and one senior engineer. Using the twelve-build framework, propose a six-week build sequence that prioritizes the load-bearing primitives, defends each week's choice against an "ideal" full 12-build sequence, and identifies which builds are deferred and why that deferral is acceptable.

### Challenge (open-ended, beyond the chapter)

**Exercise 14.11** *(Objective: extend beyond chapter)* — The chapter sets a static compaction threshold (say, 50% of the context window). Design a *dynamic* threshold that computes from O(A × D × L) at runtime, before the task begins, and re-computes mid-task as the actuals come in. Your design should specify: (a) what inputs are needed before the task starts, (b) what monitoring is needed during the task, (c) how the threshold is updated, (d) what safety margin you'd use and why, (e) how you'd empirically calibrate the safety margin for a specific deployment. This problem is open — I don't have a clean answer to (d) and (e), and I'd be interested to see yours.

---

## 14.7 Chapter Summary

You should now be able to do six things you couldn't do at the start of this chapter.

First, you can compute the growth of a coordinator's context from first principles. Given A workers, D tool calls, L tokens per result, and a context window W, you can predict the cycle at which a given workload overflows. Nothing about this formula is exotic. It's arithmetic. But the arithmetic is load-bearing — the entire argument for compaction rests on the unbounded growth this formula describes.

Second, you can write a coordination-preserving compaction prompt. You know that generic summarization is insufficient, you know why (it doesn't preserve sub-task status or decisions made), and you can defend that distinction to a teammate who wants to use the framework's default.

Third, you can read a production system's observable failure modes and predict which build is missing. Silent coordinator failures with fluent output point to Layer 2. Crashes from worker API calls point to Layer 3. Conflicting worker claims without resolution point to Layer 1's attribution. The symptoms map to layers; the layers map to builds.

Fourth, you can apply primitive isolation — introducing exactly one architectural change per build, with the evaluator for its failure modes in place before the next change is introduced. You know why this is load-bearing in this domain specifically (silent correctness degradation, weeks-long feedback loops) and why general-software intuitions about "just be careful" don't transfer.

Fifth, you can order a set of proposed primitives into a build sequence that respects dependencies, and defend the ordering. You can identify cross-build dependencies — Build 2 → Build 9, Build 5 → Build 7, Builds 1–11 → Build 12 — and explain which dependencies are load-bearing versus which are merely visible.

Sixth, you can critique proposed fixes that don't address architectural root causes. "Just use a bigger context window" is the canonical example; you can answer it from the growth formula. "Just write better prompts" is another; you can answer it from the silent-failure characteristic.

### The one idea

If you remember one thing from this chapter: **the compaction prompt must preserve the specific structural fields your coordinator reads from.** Generic compaction is indistinguishable from no compaction, in output, until a trajectory evaluator catches the silent failure weeks later. This is the specific form the book's architecture-beats-model thesis takes at Build 4.

### The common mistake

The common mistake is skipping Build 4 because it looks boring, and going straight to Build 7 because coordinator-worker is the interesting architecture. You will not notice the mistake in development. You will not notice it in outcome-quality evaluation. You will notice it when a user tells you a synthesis "feels incomplete" and you don't have the instrumentation to tell whether they're right.

### The Feynman test

If you've understood this chapter, you should be able to teach it to a teammate in under ten minutes using only a whiteboard. Here's the test. On the whiteboard, draw the five-layer ladder. Mark Layer 2 as load-bearing. Write the formula A × D × L. Walk through the Priya-Marcus story in five sentences. End with "Build 4 before Build 7." If your teammate asks "why?", you should be able to answer from any of three angles — the math, the silent-failure characteristic, or the primitive-isolation discipline — and each should reach the same conclusion.

---

## 14.8 Connections Forward

This chapter is where the book's thesis becomes operational. The layers ahead build on the discipline established here.

The next chapter picks up where the trajectory evaluator left off. You've now seen that catching silent failures requires instrumentation you commit to before the failure happens. The next chapter formalizes that instrumentation into a cost model — what I call dollar-per-decision observability — which makes the trade-offs in trajectory evaluation measurable in a way that survives hand-off to a team that didn't build the system.

The security chapter, later in the book, extends the Build 12 argument I touched on in Section 14.4. The authorization gates that make autonomous agents safe depend on state that has been preserved through compaction, tracked across coordination cycles, and maintained with explicit plan representation. You can't bolt authorization on at the end; you have to build the data structures it relies on throughout the stack. That chapter walks the specific mechanism — code-enforced boundaries, action-classification, reversibility tracking — that turns "human approval" from theater into actual oversight.

The emergence chapter, further forward still, returns to this territory from above. Once you have all twelve builds in place, the system begins producing behavior that wasn't directly specified by any individual build. That emergence is useful when the underlying builds are correct — and catastrophic when any of them is wrong, because emergent behavior amplifies whatever the lower layers got right or wrong. The emergence chapter's central warning — that compound failures in production multi-agent systems almost always trace back to a skipped primitive at a lower layer — is a prediction this chapter has already earned. You now know why.

A theme runs through all three of those forward chapters: **the system works the way its construction ordered it to work.** Change the order, and you change which failures are visible to you — which changes which failures you can actually fix.

Build 4 before Build 7.

---

**Tags:** multi-agent-orchestration, context-compaction, build-sequence-scaffolding, lost-in-the-middle, coordinator-overflow, primitive-isolation, textbook-chapter, load-bearing-infrastructure

**What would change my mind:** A well-documented production multi-agent system (≥4 workers, ≥3 cycles, ≥8 weeks of operation) that ran reliably *without* an explicit compaction layer, using only the underlying model's native context window and no custom coordination-preserving summarization. The chapter's argument is that architectural bounding of the coordinator's context is required at production scale; a clean counter-example would force me to specify the conditions under which the native window plus standard framework summarization is sufficient.

**Still puzzling:** Exercise 14.11 is the honest version of this. I don't have a clean rule for the safety margin on a dynamic compaction threshold, and the answer probably needs to be calibrated empirically against the deployment's actual trajectory data. If you find a general rule that works across workloads, I want to hear about it.
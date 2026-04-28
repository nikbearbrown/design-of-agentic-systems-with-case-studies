# Chapter 14 — Twelve Production Builds: A Scaffolded Project Sequence

**Author:** [Student — TA to fill in]
**Editor:** Nik Bear Brown

---

I should tell you up front: Priya and Marcus are a composite. Not a real pair — a close rendering of the pattern I've seen at least three times every semester in the production-agents capstone. I'm labeling the case at the start because the chapter's argument doesn't get any rhetorical benefit from pretending they're real.

Both built multi-agent research assistants for the same class. Same model. Same framework. Same papers read — coordinator-worker patterns, parallel execution, retrieval-augmented generation. Both shipped systems that worked on their evaluation rubric: a small set of representative queries, model-graded answers, a dashboard that turned green.

Marcus's code was, by any reasonable reading, better. His coordinator prompt was more carefully written. His agent role definitions were more precise. He could draw the six-layer architectural stack from Chapter 2 on a whiteboard without thinking about it. Priya's system was rougher around the edges — her prompts were adequate, not elegant — but it worked.

In production, Marcus's system failed within two weeks. Not dramatically: it kept producing confident, fluent research summaries. It just stopped producing *complete* ones. Somewhere between the third and fifth research worker's output, a whole worker's contribution silently vanished from the coordinator's synthesis. The outcome evaluator, which graded the final synthesis against the query, kept passing. The trajectory evaluator — which checks that every worker's output actually appears in the final answer — was the only signal that something was wrong. Marcus hadn't built a trajectory evaluator.

Priya's system didn't have this failure. Same model, same framework, same queries. The only architectural difference: before she wired her coordinator to workers, she had built a single-agent state-management layer that compressed its own working memory when it got close to the context window's limit. When she built the coordinator later, she inherited that layer — so her coordinator's context was bounded by a fixed summary, regardless of how much each worker had done.

Marcus had skipped that build. He'd gone straight from a stateless RAG agent to coordinator-worker, because coordinator-worker was the interesting architecture and state management looked boring.

The difference wasn't the model. Wasn't the prompt. Was that Priya had built Build 4 before Build 7, and Marcus hadn't. This chapter is about why that dependency is unavoidable, why it doesn't show up until production, and what the construction order between an interesting-looking architecture and a boring-looking primitive actually buys you.

---

## What goes wrong without primitive isolation

Suppose your multi-agent system has started returning research syntheses that miss one of the four workers' contributions. The failure is intermittent — three times in ten — and when you inspect the coordinator's output, everything looks plausible. Last week you made six architectural changes: you swapped retrieval backends, added a second worker pool, changed the coordinator's synthesis prompt, introduced a caching layer, raised the temperature on workers, and started compacting context.

Which of those six changes caused the failure?

You don't know. You can't know. Six changes at once are not six debugging problems. They are 2⁶ = 64 candidate failure modes, most of which are interactions between changes. You will spend the next four days in the wrong place.

The discipline that makes this avoidable is *primitive isolation*: introduce one architectural primitive per build, with the evaluator for its failure modes in place before the next primitive is introduced. When the system fails, the failure maps to exactly one recent change, because there's only one that could be responsible.

This sounds like ordinary engineering hygiene. It isn't, in this domain. In general software, "move fast and break things" is often correct because failure modes are loud — a null pointer, an HTTP 500, a test that fails, a page that doesn't render. The feedback loop from change to failure is minutes.

Multi-agent systems have a different failure characteristic. Their dominant failure mode is *silent correctness degradation*: the system keeps producing fluent output, confidently, with no exception and no error log, while the content drifts away from correct. The feedback loop from change to observable failure is not minutes. It's weeks, and the failure becomes observable only through evaluation harnesses you had to build in advance.

That asymmetry is what makes primitive isolation load-bearing here specifically. If I could see my failures in five minutes, I could afford to introduce six primitives at once and bisect. I can't. The failure won't show up for ten days, by which time my commit history has drifted far enough that bisection costs more than the feature did.

---

## The ladder

The twelve builds arrange into five layers, each depending on the one below.

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

Read it bottom-up. Layer 1 grounds your agent in retrieved content; without it, the agent confabulates. Layer 2 keeps state bounded across turns. Layer 3 lets the agent act through tools without crashing on transient failures. Layer 4 is the architecturally interesting layer — coordinator-worker, parallel execution, synthesis — and it's where students reach first. Layer 5 is the most visibly "agentic": meta-reasoning, plan revision, human approval gates.

I want to draw a distinction here that the rest of the chapter rests on. Some dependencies are *visible* — skip Layer 3 and your workers crash loudly when they hit a tool error; you'll notice within minutes. Other dependencies are *load-bearing* — skip them and the layers above keep running, but produce outputs that are subtly wrong with no error, no exception, no signal.

Layer 2 is load-bearing. Skip it and Layer 4's coordinator doesn't crash — which is the worst possible outcome, because a crash is at least a signal. What happens instead: the coordinator silently accumulates every worker's full message history in its context window, crosses some threshold, loses the oldest worker's output, and returns a confident synthesis missing a quarter of the evidence.

I want to be precise about what "load-bearing" is not. It's not that Layer 2 is more important than Layer 1, or that building it is harder. It's that skipping it produces a failure you cannot see from Layer 4's outputs alone. The only way to catch the failure is with an evaluator built at Layer 2's level — one that checks the invariant *worker N's output appears in the coordinator's final synthesis*. If you didn't build Layer 2, you probably didn't build that evaluator either, because there was nothing at Layer 2 to evaluate. You skipped the layer and the instrumentation that would have made its absence visible.

Students reach for Layer 4 first because it's architecturally interesting. Coordinator-worker, parallel execution, emergent behavior from composed agents — these are the ideas that made them want to build agentic systems. Layer 2 looks like infrastructure, like plumbing, like the thing a framework should provide. It is, in fact, infrastructure. That's exactly why it's load-bearing.

---

## The math

Let's do the math.

You have a coordinator orchestrating four research workers. Each worker does a chain of five tool calls, each returning about 500 tokens of retrieved content. Before the coordinator has written a single token of its own synthesis, how much context has it already accumulated?

Work it out on paper. I'll wait.

The coordinator's context at synthesis time scales with three variables, and they multiply:

- *A* = number of active workers
- *D* = depth of each worker's tool-call chain
- *L* = tokens per tool result

The coordinator's raw context from worker output alone is roughly A × D × L. Add each worker's reasoning text, the worker-to-coordinator handoff messages, the original task, the system prompts, and any retrieved documents, and you get the full context at cycle 1.

Walk the arithmetic on a realistic setup: A = 4, D = 5, L = 500. Raw tool output: 4 × 5 × 500 = 10,000 tokens. Worker reasoning text (~500 × 4): 2,000. Handoff messages (~300 × 4): 1,200. Task and system prompts: ~500. Retrieved documents: ~3,000. First-cycle coordinator context: about 17,000 tokens.

On a 128K-token context window, one cycle looks comfortable. Thirteen percent of the window. Plenty of headroom.

Scale it up. The coordinator responds to each worker, asks follow-up questions, maybe assigns additional work. Each new cycle adds roughly another 17K tokens, because the prior cycle's messages don't leave — they accumulate.

Cycle 1: 17K (13%). Cycle 2: 34K (27%). Cycle 5: 85K (66%). Cycle 7: 119K (93%). Cycle 8: overflow.

Nothing about these numbers is exotic. A research agent doing weekly reports on a slow-moving topic hits ten coordination cycles in its second week of operation. The soft-degradation threshold — where attention starts to under-weight earlier content even before hard truncation — is where systems fail first. Which is the worst place for them to fail, because soft degradation produces no error.

What actually happens at overflow: the coordinator's context is constructed in append order — task prompt, system prompt, worker 1's output, worker 2's output, and so on, with the synthesis prompt last. When the window is exceeded — either hard-truncated by the API or softly under-weighted by the model's attention mechanism — the *oldest* content gets dropped first. Task and system prompts are usually pinned. So the first thing to go is **worker 1's output**.

The model has no idea this happened. It synthesizes from what it can see. Worker 1's findings are simply gone, replaced by "no signal" — which the model doesn't distinguish from "no contribution." The synthesis reads fluently. It addresses the question. It references workers 2, 3, and 4. It silently omits whatever worker 1 was asked to investigate.

That is the Marcus failure. That is why the trajectory evaluator matters and the outcome evaluator doesn't catch it.

A student's first instinct, reading this: *just use a model with a bigger context window.* No. The product A × D × L × N grows linearly with N. Any fixed window is finite. For any window size W, there exists a cycle N* beyond which the accumulated context exceeds W. Bigger windows push N* later; they don't eliminate it. On a 128K window with the workload above, N* ≈ 7. On a 1M window, N* ≈ 58. Both systems overflow; one overflows later. If your agent runs more than N* cycles, a fixed window is insufficient, full stop. The mechanism that bounds what enters the coordinator must be architectural, not parametric.

This is what I mean when I say Build 4 is not a feature. It's infrastructure. It's the architectural commitment that turns an unbounded linear accumulation into a bounded compacted state.

---

## What "compaction" actually means

Here is the function. Most of the lift is in the prompt:

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

Two of those four preserved fields are not optional for a coordinator.

*Sub-tasks delegated and their current status.* Without this, the coordinator forgets what it has asked workers to do, and either double-delegates or quietly abandons work in flight. You'll see this as "the coordinator keeps asking worker 3 to do something it already did three cycles ago" or, worse, "the coordinator stopped tracking that worker 4 was still working on the tax analysis, so it synthesized the final answer without waiting."

*Decisions already made.* Without this, the coordinator re-derives its plan from scratch at every compaction, and the plan drifts. Each compaction cycle, the coordinator arrives at a slightly different plan than the last one — not because the situation changed, but because it's reasoning from a summary that no longer contains the previous reasoning. Over five cycles, the plan can drift enough that the final synthesis answers a different question than the one originally asked.

This is the sentence I want you to take away from the entire chapter: **the compaction prompt must preserve the exact structural fields your coordinator reads from.** Generic compaction is indistinguishable from no compaction in output, until a trajectory evaluator catches the silent failure weeks later.

Frameworks ship default summarizers. LangChain's `ConversationSummaryMemory`, for instance. These are designed for chatbots, where "summarize the conversation" is enough — the chatbot's next response doesn't depend on a structured representation of delegated work and open decisions. A coordinator is not a chatbot. A generic summarizer will happily produce a coherent paragraph that omits sub-task status and makes the coordinator appear to be reasoning fluently while actually having lost track of what half its workers are doing.

Generic compaction + coordinator-worker = the Marcus failure, dressed up as a framework choice.

One more thing the chapter deliberately won't give you: a specific percentage threshold like "compact at 70% of context utilization." There's a widely-cited claim that attention degrades past 70–80%, and the *directional* claim — that degradation worsens as context fills — is supported by the [lost-in-the-middle work of Liu et al. (2023)](https://arxiv.org/abs/2307.03172) and follow-ups. The *quantitative* claim that degradation kicks in at some specific percentage is not. It's task-dependent, prompt-position-dependent, model-dependent. A student who reads "safe below 80%" and writes a production system around that number has been given false confidence in a quantity that doesn't exist. Name the direction; don't invent a threshold. Build a trajectory evaluator that surfaces the failure when it happens. Calibrate the compaction threshold based on what the evaluator tells you about your specific workload. That's the actual discipline.

---

## Reading a system you didn't build

The build sequence isn't just a construction order. It's a diagnostic. Given a system's observable behavior, you can predict which builds are missing.

Suppose I describe a production system: a research assistant for policy analysts, single coordinator delegating to five parallel workers, six to ten tool calls per worker, three to eight coordination cycles per query, 200K context window, using LangChain's built-in `ConversationSummaryMemory` for all agents. Outcome-quality evaluation has passed at 92% over three months. Users have recently started reporting that syntheses "feel incomplete," but no quality metric has moved.

Reason it through. A = 5, D ≈ 8, L ≈ 500. Per-cycle growth: about 22K tokens including overhead. At eight cycles, context approaches 176K — 88% of the 200K window. They're in soft-degradation territory on every long-running query.

They have compaction, technically — the framework's default. But `ConversationSummaryMemory` is a generic chatbot summarizer; it doesn't preserve sub-task status or delegated-work tracking. The outcome evaluator passes because the synthesis reads fluently and answers the question plausibly. It doesn't catch "one worker's contribution is missing" because its grading rubric is about overall answer quality, not evidential coverage. Users noticing "feels incomplete" is the signal. Humans are catching what the evaluator doesn't.

The fix is two parts. First, add a trajectory evaluator that asserts every worker's contribution appears in synthesis — the evaluator they should have built when they introduced their compaction layer. Once it's in place, it'll start failing on exactly the queries users flagged. Then replace the generic summarizer with a coordination-preserving compaction prompt of the kind shown above.

The general lesson: the symptoms map to specific layers. "Feels incomplete + outcome evaluator passes" is a Layer 2 signature. Crashes from worker API calls are a Layer 3 signature. Conflicting worker claims without resolution are a Layer 1 attribution failure. Once the layers are in your head, the diagnosis is reproducible.

---

## Back to Priya and Marcus

Both shipped. One system survived contact with production. The one that survived was not the one whose author knew more about agents. It was the one whose author had built the boring-looking state-management primitive before reaching for the interesting-looking coordination primitive.

The right question to ask a team shipping a multi-agent system is not "which model are you using" or even "what framework." It's *show me your Build 4*. If the answer is "we're using the framework's default summarization," you have a Marcus-in-waiting, and the failure will arrive somewhere between weeks two and eight. If the answer is "we wrote a coordination-preserving compaction function that explicitly tracks sub-task state, and we have a trajectory evaluator that asserts every worker's contribution appears in synthesis," you have a system with a chance.

Marcus's prompts were better. His coordinator was more elegant. The model he used was identical to Priya's. None of those things mattered at the point of failure, because the failure happened in the data structure the coordinator received, and that data structure was determined by an architectural decision Marcus hadn't made.

This chapter's practical counsel reduces to one sentence: **Build 4 before Build 7.**

---

## What's still open

What would change my mind: a documented production multi-agent system — at least four workers, three coordination cycles, eight weeks of operation — that ran reliably *without* an explicit compaction layer, using only the model's native context window and standard framework summarization. The argument is that architectural bounding of the coordinator's context is required at production scale; a clean counter-example would force me to specify the conditions under which the native window plus default summarization is sufficient. I don't have that case.

Still puzzling. The chapter sets a static compaction threshold without giving you a specific number, because the number is task-dependent. The honest extension is a *dynamic* threshold that computes from A × D × L at runtime, before the task begins, and re-computes mid-task as actuals come in. I don't have a clean rule for the safety margin on such a dynamic threshold. The answer probably needs to be calibrated empirically against the deployment's actual trajectory data — which means the chapter's most important downstream evaluator is one that hasn't been built yet, in any production system I've seen.

The bottom-up generalization, though, holds. The system works the way its construction ordered it to work. Change the order, and you change which failures are visible to you. Which changes which failures you can fix.

Build 4 before Build 7.

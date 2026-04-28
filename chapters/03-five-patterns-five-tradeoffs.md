# Chapter 3 — Five Patterns, Five Trade-offs

*How the architecture you choose determines what breaks — not the model you use*

**Author:** Nik Bear Brown

---

In a developer's test environment, an agent did exactly what it was supposed to do. It browsed three sources, synthesized a research brief, responded to feedback, submitted a clean final document. The loop ran four times. It terminated. The output was good.

In production, the same agent ran for forty-seven minutes before the monitoring system cut it off. Hundreds of reasoning cycles. It had never submitted a report.

The developer's first instinct was to blame the model. The model was the thing that seemed to be thinking — the thing deciding whether the report was finished, whether another revision was needed, whether the task was done. Surely the model had made some error in judgment.

It had not.

I want you to notice what was actually missing. The developer had built an open loop and expected the model to close it. But a language model is not an agent with goals. It is a function that maps input text to a probability distribution over the next word. It does not *evaluate whether a task is complete.* It has no such evaluation. It produces the next token that is statistically likely given everything before it. Termination is not a property the model can supply. Termination is a property the architecture has to commit to.

Once you see this, the misattribution that produces most agentic failures becomes visible. People treat the model as the unit of control. It is not. The model is the engine. The architecture is the vehicle. An engine doesn't decide when to stop; that decision belongs to the structure built around it.

Five patterns follow. Each solves one specific failure mode by imposing one specific structural commitment. Each has a signature way of failing when its commitment is unmade. The working version and the broken version differ by a single parameter — which is the point. *Constraints are what make agents reliable*, and an agent without constraints is not powerful; it is uncontrollable.

## What the model can't do

I want to spend a moment on why blaming the model is a structurally induced mistake, not a naive one. The interface we have to large language models actively encourages the misattribution.

A chat interface presents the model as the unit of interaction. You send text, the model sends text back, the conversation ends when you stop typing. The termination is yours. In that loop, the model genuinely is the unit of control — every action it can take is a single, bounded event with a human on the other side deciding what happens next.

An agent is not that loop. An agent is the same model, same weights, same next-token machinery, but embedded in a loop where *the agent itself is deciding what happens next.* The human is no longer between outputs and the next input. Something else is — the architecture. And that architecture has commitments the chat loop didn't need to make: when does this stop, what's allowed to change while it's running, what happens when a step fails, what counts as done.

None of those commitments is in the model. The model has no persistent state, no access to wall-clock time beyond what it's told, no concept of how many iterations have passed, no built-in sense of when a task is complete. You can ask the model whether a task is complete and it will generate an answer, but the answer is a next-token prediction conditioned on the context, not a reliable evaluation. A model trained to be agreeable will say *yes, the task is done* when the context pattern-matches to completion, regardless of whether it actually is.

When you look at the forty-seven-minute log, the model's outputs at every step are locally reasonable. Each thought is coherent. Each tool call is plausible. Each decision to continue, examined on its own, has a defensible rationale. The failure is not visible in any single step. The failure is the loop itself — the fact that no step *N* exists at which something said *that's enough.*

This is the diagnostic move to practice. When an agent misbehaves, do not ask *what was the model thinking?* Ask *what did the architecture permit that it should not have?* These produce different answers and different fixes.

## ReAct: the loop that doesn't end

ReAct is the simplest pattern. The agent must gather information it doesn't have by interleaving reasoning with tool calls — a search, a database query, a calculation — and adapting its next step to what the last step returned.

The mechanism is a three-step cycle: thought, action, observation. The thought is a natural-language reasoning trace about what the agent knows and what it needs. The action is a structured tool call. The observation is the tool's return value. The full context — original question, all prior thoughts, actions, observations — conditions the next thought. The architectural commitment is small but specific: a tool registry the agent is whitelisted against, a loop alternating reasoning and acting, and an exit condition bounding the loop. The exit condition has two paths — the model produces a *FINISH* signal, or an external loop limit forces termination. Both are necessary. A system with only the done signal trusts the model to converge. A system with only the loop limit always fails with a timeout.

Set the loop limit to infinity and watch what happens. Send the agent a research question with moderate ambiguity. Step 1: it searches for the headline fact. Returns a result. Thought: *this is a good start, but I should verify against a second source.* Step 2: second search. Slightly different number. Thought: *the sources disagree. I should triangulate against a third.* Step 3: third search. Third number. Thought: *I should look at primary data.* And so on.

Each thought is defensible. Each action is relevant. No single step is wrong. But the loop has no upper bound on thoroughness, and thoroughness under an unbounded loop is indistinguishable from infinite regress. The session terminates only when an external limit fires — token budget exhausted, monitoring timeout, user impatience. This is exactly the forty-seven-minute failure from the opening. ReAct without an explicit step count is the architecture that produced it.

The misconception worth killing now, because it will reappear under every pattern in this chapter: *a smarter model would know when to stop.* No. A smarter model would produce more articulate reasoning for continuing, because a smarter model is better at finding additional angles to pursue. Capability and termination are orthogonal. The loop limit is not a crutch for a weak model. It is the architecture's formal commitment to bounded execution, and a stronger model makes that commitment more necessary, not less.

## Plan-and-Execute: the plan that goes stale

Plan-and-Execute fits when the task has stable, ordered subtasks with known dependencies. You know in advance what steps are required; you don't want the agent inventing them per-step. A Planner runs once, at the start, and produces a complete ordered task list. A separate Executor receives one task at a time and runs it. The output of task *N* becomes available as an input to task *N+1*. The system proceeds sequentially until the plan completes or a failure condition is reached.

The critical design choice is whether the plan is *immutable* — fixed at the start — or *revisable* — subject to replanning when the Executor encounters unexpected conditions. Immutable plans are simpler, faster, more predictable. Revisable plans are more robust but introduce a new failure: the replanning decision itself can fail.

The signature failure of an immutable plan is silent staleness. The planner commits to a schema at *T=0*. The plan includes task 3: *parse the `revenue` and `cost` fields from the financial API response.* Between *T=0* and *T=2*, the financial API ships a migration. The `revenue` field is now nested under `totals.revenue`. The `cost` field is split into `cost_direct` and `cost_indirect`.

Task 1 runs. Fine. Task 2 runs. Fine. Task 3 runs. The Executor calls the API, gets a response in the new schema, parses it against the *T=0* schema. The parser doesn't find `revenue` at the top level and returns null, silently. The parser doesn't find `cost` and returns null, silently. No exception is raised because both fields were optional in the *T=0* schema definition. The downstream aggregator, receiving null for both, produces zero. Tasks 4 through 8 execute against a zero figure. The final report cites a revenue of $0 and a cost of $0, which makes for a coherent analysis of a company that does not exist.

What's dangerous about this failure is that it is silent. The system does not crash. It does not raise an exception. It produces output that looks like a report. Automated validation cannot catch it — the pipeline produces structurally well-formed output at every step, no schema violation, no confidence drop — and the semantic wrongness is only visible to a human who knows what the correct figures should be.

The misconception worth killing: *revisable plans are always better.* They are not. Revisable plans introduce a new failure surface in the replanning decision itself. Too low a replan threshold and the system replans on transient errors and loses convergence. Too high and stale plans persist through extended failure runs. Immutable plans fail loudly when the world changes; revisable plans fail quietly when the replanning is wrong. Choose based on whether your world changes faster than your plans execute, and on which of those two failures your domain can tolerate.

## Reflection: criteria at war with each other

Reflection fits when the task has an output whose quality is verifiable against explicit criteria, and a single pass is unlikely to satisfy all criteria simultaneously. A code review, an essay, a summary that must balance brevity and completeness.

A Generator produces an initial output. A Critic — usually the same model with a different prompt frame — scores it against explicit criteria and returns structured feedback. The Generator revises. The loop continues until the Critic's score crosses a quality threshold or a max-round limit fires. The architectural trick is that generator and critic can be the same model. A different prompt produces different output behavior from the same weights — the generator prompt conditions the model to produce, the critic prompt conditions it to evaluate. The separation of concerns lives in the prompts, not in the model choice.

The signature failure is non-converging oscillation, and it has a single root cause: the criteria are at war with each other. Suppose your criteria include *(a) maximize conciseness — target under 150 words* and *(b) include comprehensive inline documentation of every claim.* These cannot be simultaneously satisfied for any non-trivial task.

Round 1: Generator produces a 180-word output with full documentation. Critic penalizes (a), awards (b). Score 0.62. Round 2: Generator trims to 110 words with thinner documentation. Critic awards (a), penalizes (b). Score 0.58. Round 3: 165 words with restored documentation. Score 0.63. Round 4: 115 words with thinner documentation. Score 0.57. Round 5: max-rounds fires. The final output is the round-5 version — not because it was best, but because it was last.

The diagnostic signature is the score trajectory: 0.62, 0.58, 0.63, 0.57. *Alternating highs and lows across rounds, rather than monotonic improvement, is the tell.*

The misconception worth killing: *the fix is more rounds.* No. The fix is criteria revision. A stronger model with contradictory criteria oscillates more articulately; the failure here is a criteria failure, not a model failure. The mechanical test is simple: plot the score trajectory. If it oscillates rather than climbs, your criteria are at war with each other, and no number of additional rounds will make them agree.

## Multi-Agent: the deadlock no agent can see

Multi-Agent fits when the task spans multiple distinct domains requiring specialized capability profiles — research, composition, editorial review — and a single agent cannot credibly perform all roles without degradation.

An Orchestrator receives the high-level goal, decomposes it into role-specific subtasks, routes each to a specialist, and assembles the final output. Each specialist operates within a defined role boundary. A message bus logs every inter-agent communication with sender, recipient, content, status. The Orchestrator does not execute tasks itself — it routes, monitors, assembles. Three architectural decisions matter: role boundaries (mutually exclusive), handoff protocols (with explicit acknowledgment, because a message sent is not a message received), and timeout policies (what the system does when an agent fails to respond).

The signature failure is coordination deadlock, and timeouts do not catch it. Imagine four agents — Researcher, Writer, Fact-Checker, Reviewer — with a protocol where the Reviewer will not finalize a draft until the Fact-Checker approves, and the Fact-Checker will not approve until the Reviewer signs off on the framing.

Step 1: Writer produces a draft. Step 2: Reviewer receives it, sends to Fact-Checker for verification. Step 3: Fact-Checker reads the protocol — *await Reviewer framing approval before approving facts.* Fact-Checker blocks, waiting for Reviewer. Step 4: Reviewer blocks, waiting for Fact-Checker. Both time out at thirty seconds. The Orchestrator sees two timeouts. Its error-handling retries the messages. The retry triggers the same wait. The system loops until the session budget exhausts.

The telltale signature is *simultaneous* timeouts across agents in a cycle, not a single agent hanging. A timeout catches one agent taking too long. A deadlock is two or more agents collectively waiting for each other, which no individual timeout can resolve.

The misconception worth killing: *timeouts handle this.* They don't. Timeouts catch *individual* agent failures. Deadlock is *topological* — it emerges from the handoff protocol itself. The fix is cycle detection at the Orchestrator level: when the message graph across recent messages forms a cycle in which every node is blocked on a downstream node that is blocked on it, the Orchestrator must break the cycle by force — escalating to a human, defaulting one agent to a non-blocking mode, aborting the pipeline. No single agent can see the cycle from inside it. Only the Orchestrator has the view.

## Memory: the trust you didn't earn

Memory-Augmented agents fit when the system must remember preferences, history, or accumulated context across sessions. Personal assistants, customer-support agents, long-running research projects.

There are two memory stores with different access patterns. Short-term memory holds the current conversation's context window and is discarded at session end. Long-term memory persists across sessions in an external store — a database, a vector index — with content, timestamp, retrieval keyword, source tag per entry. A retrieval layer queries long-term memory on each new input; retrieved memories are prepended to the prompt as context. The agent treats retrieved memories with the same authority as the system prompt, which is both the feature and the vulnerability.

The architectural decision most implementations underweight is the write path. When should a memory be written? What is worth storing? How are contradictory memories resolved? Without a validation step on write, every session is a chance to corrupt the store.

The signature failure is context poisoning. Session 1: a user in a shared household account says *I'm allergic to peanuts.* That writes to the store. But an adversarial or careless process also writes *user's favorite food is peanut butter* to the long-term store. There is no conflict check at write time because the keyword extractor treats the two as related-but-compatible — one is about allergy, the other about preference.

Session 2, two weeks later: the user asks the agent to recommend a snack. Retrieval fires on *snack recommendation.* The store returns both memories. The model sees a context containing *user is allergic to peanuts* and *user's favorite food is peanut butter*, and resolves the tension by weighting recency or retrieval score. In this instance the favorite-food memory scores higher because it's more specifically about preferences. The agent recommends a peanut butter granola bar with a confident, well-composed justification.

This is not hallucination. The model is behaving correctly — faithfully conditioning its output on the context it was given. The architecture failed. It wrote a memory without validating it against existing memories, and it retrieved without cross-checking for contradiction.

The misconception worth killing here is the most consequential of the chapter: *hallucination and context poisoning are the same bug.* They are mechanistically opposite. Hallucination is the model confabulating from its weights in the absence of grounding; the fix is better grounding. Context poisoning is the model *too faithfully* conditioning on bad grounding; the fix is validating the grounding itself. The failures look identical at the output level — fluent, specific, wrong — and only the trace tells you which you're looking at. If you mistake the second for the first and add more retrieval, you will retrieve more poisoned memories and make the failure worse.

## Architecture is the argument

There is a seductive narrative about large language models that goes roughly: as models become more capable, architectural constraints become less necessary. Smarter models make better decisions. Better decisions mean fewer guardrails required.

The narrative is wrong, and the five failure modes I've just walked through explain precisely why.

A smarter model in a ReAct loop without a step bound reasons more fluently toward no conclusion. A smarter model in a Plan-and-Execute pipeline with an immutable plan executes stale assumptions with greater confidence. A smarter model in a Reflection loop with contradictory criteria oscillates more articulately. A smarter model inside a Multi-Agent deadlock produces more sophisticated waiting messages. A smarter model reading a poisoned memory produces a more convincing wrong answer.

Model capability and architectural soundness operate on independent axes. The failure modes in this chapter are not capability failures — they are structural gaps that a more capable model navigates more fluently toward the same wrong outcome. *Improving the model does not close an architectural gap. It makes the gap harder to see, because the symptoms are more coherent.*

Return to the forty-seven-minute failure. With this vocabulary in hand, the diagnosis is precise: the system was an implicit ReAct loop with no step limit and no monitoring layer. The fix is not a better model. The fix is naming the architecture (ReAct), identifying the missing parameter (step count), setting it to a value proportional to the task's expected complexity — say fifteen for a research brief — and adding a monitor that flags the iteration count back to the orchestrator. Total cost of the fix: maybe fifteen lines of code and one configuration parameter. Total cost of the failure that fix would have prevented: forty-seven minutes plus whatever token budget was burned.

I have to be honest about a seam in this argument. Each of the five patterns has a load-bearing parameter whose right value I cannot tell you in the abstract — ReAct's step limit, Plan-and-Execute's replanning threshold, Reflection's quality threshold and round count, Multi-Agent's timeout, the memory write-gate policy. Each has a class of failures on either side: too low, the system aborts legitimate work; too high, the failure mode the constraint was supposed to prevent returns. I do not yet have a principled rule for calibrating these against a specific deployment's workload. The chapter's claim is not that I know the right values. It is that the parameters must exist and be consciously set, rather than being defaulted or omitted entirely. Calibration is what the next several years of building production agents will figure out, and I expect the right defaults are workload-specific in ways no chapter can prescribe.

When an agent fails, the forensic question is always the same. *What did the architecture permit that it should not have?* The answer is the fix. Not a better model. A better constraint. The architecture is not the thing that runs the model. It is the thing that decides what the model is allowed to do.

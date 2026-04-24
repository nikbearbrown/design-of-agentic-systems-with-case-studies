
# Chapter 3 — Five Patterns, Five Trade-offs

*How the architecture you choose determines what breaks — not the model you use*

**Author:** Nik Bear Brown


## TL;DR

An agentic system that fails in production has almost never failed because the model was wrong — it has failed because the architecture permitted something the architecture should not have permitted. Five reasoning patterns (ReAct, Plan-and-Execute, Reflection, Multi-Agent, Memory-Augmented) each solve one specific class of failure by imposing one specific structural constraint; this chapter builds each working version and then deliberately breaks it, because if you cannot produce the failure, you do not understand the architecture.

---

## 4.1 Forty-seven minutes, no report

In the developer's test environment, the agent did exactly what it was supposed to do. It browsed three sources, synthesized a research brief, responded to a round of feedback, submitted a clean final document. The loop ran four times. It terminated. The output was good.

In production, the same agent ran for **forty-seven minutes** before the monitoring system cut it off. It had completed hundreds of reasoning cycles. It had never submitted a report.

The developer's first instinct was to blame the model. The model was the thing that seemed to be "thinking" — the thing deciding whether the report was finished, whether another revision was needed, whether the task was complete. Surely the model had made some error in judgment.

It had not.

The developer built an open loop and expected the model to close it. But a language model is not an agent with goals. It is a function that maps input text to a probability distribution over the next word. It does not *evaluate whether a task is complete*. It has no such evaluation. It produces the next token that is statistically likely given everything before it. **Termination is not a model property. It is an architectural property.** The architecture had no exit condition beyond the model's own assessment of completion. The model's assessment never converged. The architecture had no opinion about this. It simply kept running.

This is the central confusion that produces the majority of agentic failures in practice: the belief that the model is the unit of control. It is not. The model is the engine. The architecture is the vehicle. An engine does not decide when to stop — that decision belongs to the structure built around it.

Five patterns follow. Each solves one failure mode. Each imposes one constraint. Each has a signature way of failing when its constraint is removed. The working version and the broken version are the same code with one parameter changed — which is the point. **Constraints are what make agents reliable.** An agent without constraints is not powerful; it is uncontrollable.

For each pattern, the chapter shows the working architecture, then deliberately breaks it. Because if you cannot produce the failure, you do not understand the architecture.

---

## Learning objectives

By the end of this chapter, you should be able to:

1. **Explain** why termination, plan validity, output quality, coordination, and memory consistency are architectural properties rather than model properties — and name at least one production failure attributable to treating any of them as the latter.
2. **Implement** each of the five patterns — ReAct, Plan-and-Execute, Reflection, Multi-Agent, Memory-Augmented — in working form, and identify the single parameter whose removal produces each pattern's signature failure.
3. **Predict** which pattern's signature failure a given system will exhibit, by inspecting which constraints are present and which are missing.
4. **Select** a pattern for a new problem using the selection criteria, and defend the choice against the next-simplest alternative.
5. **Read the trade-off map** as a constraint map, not a leaderboard — explaining why the pattern with the best score on any single axis is not automatically the right pattern.
6. **Critique** the common claim that "better models obviate the need for architectural constraints" and construct a concrete counter-example.

"Understand the five patterns" is not on this list on purpose. Knowing what the patterns are is the easy half. Localizing a production failure to a pattern's missing parameter is the half that matters.

---

## Prerequisites

You need Chapter 2. Specifically: BDI vocabulary (beliefs, desires, intentions) and the six-layer structural stack (Perception, Belief, Reasoning, Planning, Orchestration, Monitoring). The five patterns in this chapter are specific architectural contracts at L3 (reasoning), L4 (planning), and L5 (orchestration), and the "signature failures" are what happens when those contracts are underspecified. Without Chapter 2's vocabulary, this chapter reads as a catalog of techniques. With it, each pattern becomes a specific engineering commitment at a specific layer.

You also need enough familiarity with large language models to understand what a system prompt is, what a tool call is, and what the context window is. Chapter 1's appendix covers the basics if you need it.

---

## Concept 1: The Model Is Not the Unit of Control

I want to spend a section on why the 47-minute failure keeps happening, because the pattern repeats in every production agentic system I've debugged. The misattribution — blaming the model — is not a naive mistake. It's a structurally induced one. The interface we have to modern LLMs actively encourages it.

Here's what I mean. A chat interface presents the model as the unit of interaction. You send text, the model sends text back, the interaction terminates when you stop typing. The termination is yours. In this loop, the model genuinely is the unit of control — every action it's capable of (producing text) is a single, bounded event with a human on the other end deciding what happens next.

An agent is not this loop. An agent is the same model, same weights, same next-token machinery, but embedded in a loop where *the agent itself is deciding what happens next*. The human is no longer between the model's outputs and the next input. Something else is — the architecture. And that architecture has commitments the chat loop didn't need to make: when does this stop, what's allowed to change while it's running, what happens when a step fails, what counts as "done."

None of those commitments is in the model. They cannot be. The model has no persistent state, no access to wall-clock time beyond what it's told, no concept of "how many iterations have I done," no built-in sense of when a task is complete. You can ask the model whether a task is complete and it will generate an answer — but the answer is a next-token prediction conditioned on the context, not a reliable evaluation. A model trained to be agreeable will say "yes, the task is done" when the context pattern-matches to completion, regardless of whether it actually is.

**Why this matters for debugging.** When you look at the 47-minute log, the model's outputs at every step are locally reasonable. Each thought is coherent. Each tool call is plausible. Each decision to continue, examined in isolation, has a defensible rationale. The failure is not visible in any single step. The failure is the loop itself — the fact that there is no step *N* at which the architecture said "that's enough." Localize this to Chapter 2's stack: the failure is at **L6 (monitoring)**, not L3 (reasoning). The monitor was the missing layer, and the missing monitor is what let the loop run.

This is the diagnostic move to practice. When an agent misbehaves, do not ask "what was the model thinking?" Ask "what did the architecture permit that it should not have?" These produce different answers and different fixes. The first leads to prompt engineering, which will fix the symptom for one input distribution and reintroduce it for the next. The second leads to structural change, which holds across distributions.

**Worked example: localizing the 47-minute failure to specific layers.** Walk through it with the six-layer stack in hand.

At L3 (reasoning), the model was producing valid reasoning at every step. Not a failure.

At L4 (planning), the agent had no explicit plan structure. Every step was a fresh reasoning pass. This is a failure *opportunity* — without an explicit plan, there's nothing to check progress against. But it's not itself the failure.

At L5 (orchestration), tool calls were executing correctly. Not a failure.

At L6 (monitoring), there was no loop-level evaluator. Nothing was comparing accumulated work against any termination criterion. *This is the failure.* The monitor layer didn't exist, so there was no object to add a constraint to. The fix is not a better prompt for the model. The fix is implementing L6.

The five patterns I'm about to cover are five different approaches to closing specific structural gaps. Each pattern constrains a different layer at a different joint. Understanding them as structural commitments — not as "techniques you apply to the model" — is the shift the chapter is asking you to make.

---

## Concept 2: Five Patterns, Five Structural Commitments

Each of the following patterns does exactly two things. First, it commits to a specific structural contract — a loop with a bound, a plan with a validation step, a generator paired with a critic, a team with a handoff protocol, a memory store with a write gate. Second, when that contract is underspecified in one specific way, it produces a specific failure mode you can identify by its shape alone.

I'll cover each pattern with five elements: **When** (the problem class), **Mechanism** (how it works), **Design decision** (the load-bearing parameter), **Worked trace of the failure** (what happens when the parameter is removed), and **Common misconception** (the mistake I see most often in practice).

### Pattern 1 — ReAct (Reasoning + Acting)

**When.** An agent must gather information it does not have by interleaving reasoning with tool calls — search, database queries, calculations — and adapting its next step to what the last step returned ([Yao et al., 2022](https://arxiv.org/abs/2210.03629)).

**Mechanism.** A three-step cycle: **Thought → Action → Observation**. The thought is a natural-language reasoning trace about what the agent knows and what it needs. The action is a structured tool call against a registered tool (`search("France GDP 2023")`). The observation is the tool's return value. The full context — original question, all prior thoughts, actions, and observations — conditions the next thought. The loop ends when the model produces a `FINISH` signal or when an external loop limit forces termination. Both exit paths are necessary: the done signal handles the happy path; the loop limit handles every other path.

**Design decision.** Three components: a **tool registry** (whitelist — the agent cannot call unregistered tools), a **loop structure** alternating reasoning and acting, and an **exit condition** bounding the loop.

```python
def react_loop(question, tools, max_steps=10):
    context = [{"role": "user", "content": question}]
    for step in range(max_steps):
        response = llm.complete(build_react_prompt(context))
        thought, action, action_input = parse(response)
        if action == "FINISH":
            return action_input                      # done signal
        observation = (tools[action](action_input)
                       if action in tools
                       else f"Error: unknown tool '{action}'")
        context += [
            {"role": "assistant", "content": response},
            {"role": "user", "content": f"Observation: {observation}"},
        ]
    return extract_best_answer(context)              # loop limit
```

The `max_steps` parameter is not optional. A system with only a done signal trusts the model to converge. A system with only a loop limit always fails with a timeout. You need both.

**Worked trace — the infinite reasoning loop.** Set `max_steps = None`. Send the agent a research question with moderate ambiguity. Watch what happens.

Step 1: Agent searches for the headline fact. Returns a result. Thought: "This is a good start, but I should verify against a second source." Step 2: Second search. Returns a slightly different number. Thought: "The sources disagree. I should check a third to triangulate." Step 3: Third search. Returns a third number. Thought: "Three sources, three numbers. I should look at primary data." Step 4: Primary data search. Returns raw figures. Thought: "I should also verify the raw figures are from an authoritative period." And so on.

Each thought is defensible. Each action is relevant. No single step is wrong. But the loop has no upper bound on thoroughness, and thoroughness under an unbounded loop is indistinguishable from infinite regress. The session terminates only when an *external* limit fires — token budget exhausted, monitoring timeout, user impatience. The logs show a clean chain of reasoning that simply never ends.

This is exactly the 47-minute case from the opening. ReAct without `max_steps` is the architecture that produced it.

**Common misconception — "a smarter model would know when to stop."** No. A smarter model would produce more articulate reasoning for continuing, because a smarter model is better at finding additional angles to pursue. Capability and termination are orthogonal. The loop limit is not a crutch for a weak model. It is the architecture's formal commitment to bounded execution, and a stronger model makes that commitment more necessary, not less.

### Pattern 2 — Plan-and-Execute

**When.** The task has stable, ordered subtasks with known dependencies. You know in advance what steps are required; you don't want the agent inventing them per-step.

**Mechanism.** A **Planner** runs once, at T=0, and produces a complete ordered task list. A separate **Executor** receives one task at a time and runs it. Each task has a description, required inputs, and expected outputs. The output of task *N* becomes an available input to task *N+1*. The system proceeds sequentially until the plan completes or a failure condition is reached.

**Design decision.** The critical choice is whether the plan is **immutable** (fixed at T=0) or **revisable** (subject to replanning when the Executor encounters unexpected conditions). Immutable plans are simpler, faster, more predictable. Revisable plans are more robust but introduce a new failure: the replanning decision itself can fail. Two parameters govern the design: a **replanning threshold** (how many failures trigger replan) and a **plan validation step** (a pre-execution consistency check).

```python
def plan_and_execute(goal, planner, executor, tools, replan_threshold=2):
    plan = planner.generate_plan(goal)
    validate_plan(plan)
    results, failures = {}, 0
    for i, task in enumerate(plan.tasks):
        world_state = get_current_state()
        if world_state_contradicts(task.assumptions, world_state):
            plan = planner.replan(goal, completed=results,
                                  failed_at=i, world_state=world_state)
            failures = 0
        try:
            result = executor.execute(task, {**task.inputs, **results}, tools)
            results[task.output_key] = result
        except TaskFailure as e:
            failures += 1
            if failures >= replan_threshold:
                plan = planner.replan(goal, completed=results,
                                      failed_at=i, error=e)
                failures = 0
    return results
```

**Worked trace — stale plan execution.** The planner commits to Schema v1 at T=0. The plan includes task 3: *parse `revenue` and `cost` fields from the financial API response*. Between T=0 and T=2, the financial API ships a migration. The `revenue` field is now nested under `totals.revenue`. The `cost` field is split into `cost_direct` and `cost_indirect`.

Task 1 runs. Fine. Task 2 runs. Fine. Task 3 runs. The Executor calls the API, gets back a response in the new schema, parses it against the T=0 schema. The parser doesn't find `revenue` at the top level and returns `None`. Silently. The parser doesn't find `cost` and returns `None`. Silently. No exception is raised because both fields were optional in the T=0 schema definition. The downstream aggregator, receiving `None` for both, produces a zero. Tasks 4 through 8 execute against a zero figure. The final report cites a revenue of $0 and a cost of $0, which makes for a coherent analysis of a company that does not exist.

The failure is particularly dangerous because it is *silent*. The system does not crash. It does not raise an exception. It produces output that looks like a report. Automated validation cannot catch it — the pipeline produces a structurally well-formed output at every step, no exception is raised, no schema is violated, no confidence score drops — and the semantic wrongness is only visible to someone who knows what the correct figures should be. The stale plan failure is detectable only by a human who reads the report carefully enough to notice that the numbers do not match the cited sources.

**Common misconception — "revisable plans are always better."** They are not. Revisable plans introduce a new failure surface: the replanning decision itself. A too-low `replan_threshold` means the system replans on transient errors and loses convergence. A too-high threshold means stale plans persist through extended failure runs. Immutable plans fail loudly when the world changes; revisable plans fail quietly when the replanning is wrong. Choose based on whether your world changes faster than your plans execute, and whether the cost of a loud failure exceeds the cost of a quiet one.

### Pattern 3 — Reflection / Self-Critique

**When.** The task has an output whose quality is verifiable against explicit criteria, and a single pass is unlikely to satisfy all criteria simultaneously. A code review, an essay, a summary that must balance brevity and completeness. (Formalized in [Reflexion, Shinn et al., 2023](https://arxiv.org/abs/2303.11366).)

**Mechanism.** A **Generator** produces an initial output. A **Critic** — usually the same model with a different prompt — scores it against explicit criteria and returns structured feedback. The Generator revises. Loop until either the Critic's score crosses a quality threshold or a max-round limit fires.

The architectural trick is that the generator and the critic can be the same model. A different *prompt frame* produces a different *output behavior* from the same weights — the generator prompt conditions the model to produce, the critic prompt conditions it to evaluate. The separation of concerns lives in the prompts, not in the model choice.

**Design decision.** Three parameters: a **quality threshold** (minimum acceptable Critic score), a **max-round limit** (loop bound), and the **critic criteria** themselves (the explicit standards). The criteria must be internally consistent. This is the most commonly overlooked constraint.

```python
def reflection_loop(task, quality_threshold=0.85, max_rounds=5):
    output = llm.complete(build_generator_prompt(task))
    for r in range(1, max_rounds + 1):
        score, feedback = parse_evaluation(
            llm.complete(build_critic_prompt(output, CRITERIA))
        )
        if score >= quality_threshold:
            return output
        output = llm.complete(build_revision_prompt(output, feedback))
    return output, Warning(f"Did not converge in {max_rounds} rounds.")
```

**Worked trace — the non-converging oscillation.** The criteria set includes: *(a) maximize conciseness — target under 150 words* and *(b) include comprehensive inline documentation of every claim*. These cannot be simultaneously satisfied for any non-trivial task.

Round 1: Generator produces a 180-word output with inline documentation. Critic penalizes (a), awards (b). Score 0.62. Feedback: "too long, remove non-essential detail."

Round 2: Generator produces a 110-word output with thin documentation. Critic awards (a), penalizes (b). Score 0.58. Feedback: "documentation lacks supporting citation for claims X, Y, Z."

Round 3: Generator produces a 165-word output with restored documentation. Critic penalizes (a), awards (b). Score 0.63.

Round 4: Generator produces a 115-word output with thinner documentation. Score 0.57.

Round 5: max_rounds fires. The final output is the Round 5 version — not because it was best, but because it was last. Score trajectory: 0.62, 0.58, 0.63, 0.57. The oscillation is the diagnostic signature. Alternating highs and lows across rounds — rather than monotonic improvement — is the tell.

**Common misconception — "the fix is more rounds."** No. The fix is criteria revision. A stronger model with contradictory criteria oscillates more articulately; the failure class here is criteria failure, not model failure. The mechanical test for contradictory criteria is simple: plot the score trajectory across rounds. If it oscillates rather than climbs, your criteria are at war with each other, and no number of additional rounds will make them agree.

### Pattern 4 — Multi-Agent Collaboration

**When.** The task spans multiple distinct domains requiring specialized capability profiles — research, composition, editorial review — and a single agent cannot credibly perform all roles without degradation. (See [AutoGen, Wu et al., 2023](https://arxiv.org/abs/2308.08155) for the canonical framework.)

**Mechanism.** An **Orchestrator** receives the high-level goal, decomposes it into role-specific subtasks, routes each to a specialist, and assembles the final output. Each **specialist agent** operates within a defined role boundary: what it is responsible for, what it is not responsible for, what format its outputs take. A **message bus** logs every inter-agent communication with sender, recipient, content, and status. The Orchestrator does not execute tasks itself — it routes, monitors, and assembles.

**Design decision.** Three architectural decisions: **role boundary definition** (mutually exclusive), **handoff protocol specification** (including explicit acknowledgment — a message sent is not a message received), and **timeout policy** (what the system does when an agent fails to respond within a window).

```python
bus = AgentMessageBus(session_id)
bus.send("orchestrator", "researcher", task)
research = researcher.run(bus.receive("researcher", timeout_seconds=30))
bus.send("researcher", "writer", research)
draft = writer.run(bus.receive("writer", timeout_seconds=30))
bus.send("writer", "reviewer", draft)
feedback = reviewer.run(bus.receive("reviewer", timeout_seconds=30))
final = writer.revise(draft, feedback)
```

The `timeout_seconds` parameter is what converts a hang into a catchable error. Without it, a single unresponsive agent freezes the entire pipeline indefinitely.

**Worked trace — coordination deadlock.** Imagine a more complex variant: four agents — Researcher, Writer, Fact-Checker, Reviewer — with a protocol where the Reviewer will not finalize a draft until the Fact-Checker approves, and the Fact-Checker will not approve until the Reviewer signs off on the framing.

Step 1: Writer produces draft. Step 2: Reviewer receives draft, sends to Fact-Checker for verification. Step 3: Fact-Checker reads the protocol — it says "await Reviewer framing approval before approving facts." Fact-Checker blocks, waiting for Reviewer. Step 4: Reviewer blocks, waiting for Fact-Checker. Step 5: Neither acts. Both time out at 30 seconds. The Orchestrator sees two timeouts. The Orchestrator's error-handling retries the messages. The retry triggers the same wait. The system loops until the session budget exhausts.

The telltale signature is *simultaneous* timeouts across agents in a cycle — not a single agent hanging. A timeout catches one agent taking too long. A deadlock is two or more agents collectively waiting for each other — and neither will ever receive what it needs without the other acting first.

**Common misconception — "timeouts handle this."** They don't. Timeouts catch *individual* agent failures. Deadlock is *topological* — it emerges from the handoff protocol itself, not from any single agent being slow. The fix is cycle detection at the Orchestrator level: when the message graph across the last N messages forms a cycle where every node is blocked on a downstream node that is blocked on it, the Orchestrator must break the cycle by force — by escalating to a human, by defaulting one agent to a non-blocking mode, by aborting the pipeline. No single agent can see the cycle from inside it. Only the Orchestrator has the view.

### Pattern 5 — Memory-Augmented Agents

**When.** The agent must remember preferences, history, or accumulated context across sessions. Personal assistants, customer-support agents, long-running research projects. (Grounded in the retrieval-augmented generation literature — [Lewis et al., 2020](https://arxiv.org/abs/2005.11401).)

**Mechanism.** Two memory stores with different access patterns. **Short-term memory** holds the current conversation's context window and is discarded at session end. **Long-term memory** persists across sessions in an external store (a database, a vector index) — content, timestamp, retrieval keyword, source tag per entry. A **retrieval layer** queries long-term memory on each new input; retrieved memories are prepended to the prompt as context. The agent treats retrieved memories with the same authority as the system prompt — which is both the feature and the vulnerability.

**Design decision.** Three decisions: **retrieval strategy** (how memories match the current query), **memory validation** (whether new memories are consistency-checked before write), and **poisoning defense** (what prevents malicious or erroneous inputs from corrupting the persistent store). The write path is the architectural decision most implementations underweight. When should a memory be written? What is worth storing? How are contradictory memories resolved? Answers to those determine whether the long-term store is an asset or a liability.

```python
def respond(user_input, mem):
    memories = mem.retrieve(extract_keywords(user_input))
    context = format_memories(memories) + "\n\nUser: " + user_input
    response = llm.complete(context)
    if should_memorize(user_input, response):
        conflicts = mem.retrieve(extract_keywords(user_input))
        if not conflicts:                                   # validation gate
            mem.write(content=response,
                      embedding_text=extract_keywords(user_input))
    return response
```

The consistency check before `mem.write` is what most production implementations omit. Without it, every session writes unchecked memories. With it, contradictions are caught before they enter the store.

**Worked trace — context poisoning.** Session 1: A user in a shared household account says "I'm allergic to peanuts" (true) but an adversarial or careless process writes "User's favorite food is peanut butter" to the long-term store as well. There is no conflict check at write time because the keyword extractor treats "allergic to peanuts" and "favorite food is peanut butter" as related-but-compatible — one is about allergy, the other about preference.

Session 2, two weeks later: The user asks the agent to recommend a snack. Retrieval fires on "snack recommendation." The store returns both memories. The model sees a context containing "User is allergic to peanuts" and "User's favorite food is peanut butter." The model resolves the tension by weighting recency or retrieval score. In this instance, the "favorite food" memory scores higher on the match because it's more specifically about preferences. The agent recommends a peanut butter granola bar with a confident, well-composed justification ("given your preference for peanut butter…").

This is not hallucination. The model is behaving correctly — faithfully conditioning its output on the context it was given. The architecture failed. It wrote a memory without validating it against existing memories, and it retrieved without cross-checking for contradiction.

**Common misconception — "hallucination and context poisoning are the same bug."** They are mechanistically opposite. Hallucination is the model confabulating from its weights in the absence of grounding; the fix is better grounding (retrieval, citations, evidence). Context poisoning is the model *too faithfully* conditioning on bad grounding; the fix is validating the grounding itself. If you mistake the second for the first and add more retrieval, you will retrieve more poisoned memories and make the failure worse. The distinction matters because the failures look identical at the output level — a fluent, specific, wrong answer — and only the trace tells you which you're looking at.

---

## Concept 3: Selecting a Pattern and Reading the Trade-off Map

Concepts 1 and 2 give you the vocabulary and the five architectures. This concept tells you how to choose.

Work through these questions in order. The first **yes** determines your pattern.

1. **Is the task decomposable into stable, ordered subtasks?** → **Plan-and-Execute**. The structure prevents losing track of where you are. The risk is staleness — plan for it explicitly.
2. **Does the task require iterative tool use with observable real-time outcomes?** → **ReAct**. The think-act-observe loop handles dynamic information gathering where you cannot predict in advance how many steps are needed.
3. **Does output quality need to be verifiable against explicit criteria?** → **Reflection**. The generator-critic loop will iterate toward that standard. Audit your rubric before you build the loop.
4. **Does the task span multiple distinct domains requiring specialized expertise?** → **Multi-Agent**. Specialized roles with clear handoffs outperform one overloaded generalist. Every agent boundary is a potential deadlock.
5. **Does the task require context from previous interactions?** → **Memory-Augmented**. Persistent retrieval enables personalization and continuity. Every retrieved memory is an unverified input unless you validate it.

When multiple criteria apply, **start with the simpler pattern**. Complexity is a cost, not a feature. A ReAct agent that solves the problem in five iterations is better than a multi-agent system that solves it in three messages between four agents. Reach for coordination only when a single agent demonstrably cannot hold the full task in context.

### The trade-off map — a constraint map, not a leaderboard

Read this table as a **constraint map, not a leaderboard**. The pattern with the lowest latency is not the best pattern — it is the best pattern for tasks where latency is the binding constraint. Reliability scores below are conditional on the design decisions named above. Remove the loop limit from ReAct and its reliability drops to zero. Introduce contradictory criteria to Reflection and it will never converge regardless of how many rounds you permit.

| Pattern | Latency | Cost | Reliability (with constraints) | Complexity | Best for | Signature failure |
|---|---|---|---|---|---|---|
| ReAct | Medium | Medium | High (with loop limit) | Low | Adaptive multi-step retrieval | Infinite reasoning loop |
| Plan-and-Execute | High plan / low exec | Medium | Medium | Medium | Sequential ordered pipelines | Stale plan from world-state change |
| Reflection | High | High | High (with coherent criteria) | Medium | Quality-critical single outputs | Non-converging oscillation |
| Multi-Agent | Very high | Very high | Medium | High | Cross-domain collaboration | Coordination deadlock |
| Memory-Augmented | Low (post-retrieval) | Low | Medium | Medium–high | Cross-session personalization | Context poisoning |

**How to read this table.** Pick the row whose "Best for" matches your task. Check "Signature failure" — this is what your system will look like when it breaks. Ask whether your environment can tolerate that specific failure mode. If not, either engineer against it explicitly (this chapter's design decisions) or pick a different pattern whose signature failure is more tolerable in your domain. Do not pick the "highest reliability" row in the abstract — reliability is conditional on constraints, and every pattern's reliability is zero when its load-bearing parameter is missing.

---

## Integration: Architecture Is the Argument

There is a seductive narrative about large language models that goes roughly: as models become more capable, architectural constraints become less necessary. Smarter models make better decisions. Better decisions mean fewer guardrails required.

The narrative is wrong, and the five failure modes in this chapter explain precisely why.

A smarter model in a ReAct loop *without a loop limit* is a model that reasons more fluently toward no conclusion. A smarter model in a Plan-and-Execute pipeline *with an immutable plan* is a model that executes stale assumptions with greater confidence. A smarter model in a Reflection loop *with contradictory criteria* oscillates more articulately. A smarter model inside a Multi-Agent deadlock produces more sophisticated waiting messages. A smarter model reading a poisoned memory produces a more convincing wrong answer.

**Model capability and architectural soundness operate on independent axes.** The failure modes in this chapter are not capability failures — they are structural gaps that a more capable model navigates more fluently toward the same wrong outcome. Improving the model does not close an architectural gap. It makes the gap harder to see, because the symptoms are more coherent.

Return to the 47-minute failure from the opening. With this chapter's vocabulary, the diagnosis is precise: the system was an implicit ReAct loop with no `max_steps` bound and no L6 monitoring. The fix is not a better model. The fix is naming the architecture (ReAct), identifying the missing parameter (`max_steps`), setting it to a value proportional to the task's expected complexity (say, 15 for a research brief), and adding an L6 monitor that flags the loop's iteration count back to the orchestrator. Total cost of the fix: fifteen lines of code and one configuration parameter. Total time of the failure that fix would have prevented: forty-seven minutes plus whatever token budget was burned.

The patterns are not workarounds for weak models. They are the structural expression of what a reliable agent is allowed to do. The loop limit is not a crutch for a model that cannot decide when to stop — it is the system's formal commitment to bounded execution. The plan validation step is not a check on the planner's intelligence — it is the architecture's assertion that internal consistency is a property of *the plan*, not of the model that generated it. The memory validation layer is not distrust of the retrieval system — it is the acknowledgment that a persistent store that can be written to can also be corrupted, and that this possibility must be structurally managed.

When an agent fails, the forensic question is always the same: **what did the architecture permit that it should not have?** The answer to that question is the fix. Not a better model. A better constraint. The architecture is not the thing that runs the model. It is the thing that decides what the model is allowed to do.

---

## Chapter Summary

Four capabilities you can now exercise.

You can read an agent failure and localize it to an architectural pattern and a missing parameter, rather than blaming the model. The 47-minute failure is ReAct without `max_steps`. The silent zero-revenue report is Plan-and-Execute with an immutable plan and no validation step. The essay that never converges is Reflection with contradictory criteria. The stuck pipeline is Multi-Agent with no cycle detection. The peanut butter recommendation is Memory-Augmented with no write-gate. Each diagnosis points directly at its fix.

You can choose a pattern for a new problem and defend the choice against the next-simplest alternative. The selection heuristic is: first yes wins, start simple, add complexity only when a single agent demonstrably cannot hold the task. Complexity is a cost. A two-agent pipeline is not better than a ReAct agent unless the ReAct agent has provably failed the task.

You can read the trade-off table as a constraint map. No pattern wins on all axes. Every reliability score is conditional on its load-bearing parameter being present and tuned. The highest reliability in the table, stripped of its constraint, is zero.

You can construct a response to the claim that better models make architectural constraints obsolete. The response is: capability and architectural soundness are independent axes, and the failure modes in this chapter scale with model capability rather than against it. A better model makes an unbounded ReAct loop fail more fluently, not less often.

**The one idea that matters most:** **constraints are what make agents reliable.** Every reasoning pattern in this chapter is a specific structural commitment; every signature failure is what happens when that commitment is unmade. The patterns are not techniques applied to the model. They are contracts the architecture signs on the model's behalf.

**The common mistake to watch for:** treating an agent failure as a prompt problem. If you find yourself iterating on prompts to fix a symptom that keeps returning in new forms, you are working at the wrong layer. The fix is a structural constraint at L3, L4, L5, or L6 of the stack from Chapter 2 — not a prompt at the generator.

**The Feynman test, applied here:** if you can look at a production failure log and say, without hedging, which of the five patterns the system is running and which of that pattern's load-bearing parameters is missing or mistuned, you have internalized this chapter. If your answer is "the model made a mistake," you haven't.

---

## Connections Forward

**Chapter 5** extends this to memory architectures specifically — the structural details of Pattern 5. Where this chapter treats memory as one of five patterns, Chapter 5 opens up the inside: what retrieval strategies fail in what ways, how belief-freshness policies from Chapter 2 apply to persistent stores, and what the write-gate design space actually looks like in production.

**Chapter 6** covers workflow structures that compose these patterns — a Plan-and-Execute pipeline whose Executor is itself a ReAct loop, a Multi-Agent system where one of the agents runs Reflection on its own outputs, a Memory-Augmented agent whose memories are themselves produced by a Plan-and-Execute pipeline. The interesting failure modes at that level are compositional: two patterns whose individual constraints are sound can produce emergent failures when combined. The vocabulary for reasoning about those failures starts here.

**Chapters 7 and 8** extend Pattern 4 (Multi-Agent) to the full coordination problem. What I've called "coordination deadlock" in this chapter is the cleanest case. The dirty cases — agents with conflicting desires, agents whose beliefs about each other go stale, agents whose intentions ratchet against each other — are where most production multi-agent systems actually break.

**Chapter 15** (evaluation metrology) treats the monitoring layer (L6) as a first-class concern. Every pattern in this chapter depends on L6 to make its constraints observable. Chapter 15 is what you do when the constraints aren't firing and you can't tell why.

**Chapter 18** (security) revisits each pattern's signature failure as an attack surface. Context poisoning is an attack. An adversarial critic in a Reflection loop is an attack. A compromised specialist in a Multi-Agent system is an attack. The failures in this chapter are also the places your attacker will go looking.

Before you reach for a pattern, pick the one whose signature failure your system can tolerate — or engineer against that failure explicitly. There is no neutral choice. The architecture is the argument.

---

## Exercises

Each exercise names the learning objective it tests and indicates rough difficulty. Solutions are in the appendix; attempt each problem first.

### Warm-up (direct application of one concept)

**Exercise 4.1** *[Tests: pattern recognition from failure signature]* For each of the following production symptoms, name the pattern most likely running and the missing or mistuned parameter: (a) agent runs for an hour on a 5-minute task; (b) report contains zero values where nonzero values should be; (c) output quality oscillates round-over-round instead of converging; (d) two agents each report waiting for the other; (e) agent recommends something directly contradicted by a memory it should have retrieved. **Difficulty: 1/5.**

**Exercise 4.2** *[Tests: identifying load-bearing parameters]* For each of the five patterns, name the single parameter whose removal or mis-setting causes the signature failure. In one sentence per pattern, explain what the parameter protects against. **Difficulty: 1/5.**

**Exercise 4.3** *[Tests: selection heuristic application]* Given each task below, walk through the selection criteria in order and identify the pattern the heuristic picks: (a) personalized weekly exercise recommendations for returning users; (b) first-pass legal brief drafting against a house style guide; (c) real-time stock-news summary generation that pulls from three feeds; (d) end-to-end production of a research survey paper including literature review, analysis, and peer review. **Difficulty: 2/5.**

### Application (translation to a different problem)

**Exercise 4.4** *[Tests: writing architectural constraints]* You are asked to build a ReAct agent for a legal research tool. Queries are open-ended ("find cases supporting argument X"). The system runs on a $0.15 per-session token budget. Write a complete set of exit conditions at three tiers (per-action, per-session, per-horizon) with specific values and a one-sentence justification for each. Then explain what happens when only the token-budget condition is present and the other two are removed. **Difficulty: 3/5.**

**Exercise 4.5** *[Tests: designing a revisable plan with calibrated thresholds]* Design a Plan-and-Execute pipeline for generating quarterly financial summaries from a company's internal APIs. The planner runs at the start of the quarter; the executor runs at quarter-end. Identify at least three world-state changes that could occur in that window, set a `replan_threshold`, and write the `validate_plan` step. Defend your threshold against both a higher value and a lower value. **Difficulty: 3/5.**

**Exercise 4.6** *[Tests: auditing critic criteria for contradictions]* Here is a critic criteria set for a Reflection loop on code-review output: (1) *flag all style violations*; (2) *do not nitpick*; (3) *cite the project style guide for each flagged violation*; (4) *keep the review under 300 words*. Identify at least two pairs of criteria that conflict under plausible inputs. For each conflict, predict the shape of the score trajectory across rounds. Propose a revised criteria set that resolves the conflicts. **Difficulty: 3/5.**

**Exercise 4.7** *[Tests: handoff protocol design including failure modes]* Design a Multi-Agent pipeline for a customer-support workflow with three agents (Triage, Specialist, Escalation Manager). Specify the handoff protocol including explicit acknowledgments, timeout policies, and cycle-detection rules. Construct a message sequence that would cause deadlock under a naive protocol, then show how your protocol prevents it. **Difficulty: 4/5.**

### Synthesis (combining concepts)

**Exercise 4.8** *[Tests: predicting signature failures in your domain]* Pick an agent system you've built or currently use. Identify which of the five patterns (possibly more than one) it most resembles. For each identified pattern, predict the specific signature failure in *your* domain — what would it look like in your logs, what would the end-user experience, what would the wrong output sound like? Then identify which of the pattern's load-bearing parameters are currently present in your implementation and which are missing or defaulted. **Difficulty: 4/5.**

**Exercise 4.9** *[Tests: compositional reasoning about patterns]* Consider a system that composes Patterns 2 and 5 — a Plan-and-Execute pipeline whose Planner reads from a memory-augmented long-term store of prior plans. Identify at least two ways the constraints of one pattern can undermine the other: e.g., where does a stale memory corrupt a valid plan, where does a replanning decision fail to propagate back to memory, where does memory validation conflict with plan validation? Propose an architectural sequencing (which validation fires first) that resolves the conflict. **Difficulty: 5/5.**

**Exercise 4.10** *[Tests: full failure localization using Chapter 2's stack + this chapter's patterns]* Reread the 47-minute failure from §4.1. Using Chapter 2's six-layer stack and this chapter's pattern vocabulary, produce a complete post-mortem: which pattern the system was running (explicitly or implicitly), which of the six layers contained the missing contract, what the specific missing parameter was, what default value the fix should use, and how you would monitor for the failure recurring. Aim for roughly 500 words. **Difficulty: 4/5.**

### Challenge (open-ended, beyond the chapter's boundary)

**Exercise 4.11** *[Tests: the framework's open question — parameter calibration]* The "Still puzzling" section flags an unresolved question: how to choose principled defaults for the five patterns' load-bearing parameters (`max_steps`, `replan_threshold`, `quality_threshold` + `max_rounds`, `timeout_seconds`, memory write-gate policy). Propose a calibration procedure for any one of these parameters that is grounded in measurable workload properties rather than intuition. What data would you collect? What would count as evidence that your default is too high or too low? Where does the procedure break down? **Difficulty: 5/5.**

**Exercise 4.12** *[Tests: defending the master argument under capability uplift]* I argued that model capability and architectural soundness are independent axes — that a more capable model scales the failure surface rather than shrinking it. Construct the strongest counterargument: a specific case in which a sufficiently capable model would, in fact, make one of the five signature failures less likely even without any architectural change. Then evaluate whether your counterargument survives contact with all five patterns or only some. If only some, what does that tell you about the boundary of the master argument? **Difficulty: 5/5.**

---

**What would change my mind:** A production agentic system running at meaningful scale (≥10,000 high-stakes decisions/month, ≥6 months of uptime) that relied on *only* prompt-level constraints — no loop limits, no plan validation, no memory-write gates, no cycle detection — and maintained a measurable reliability property across that window. The chapter's argument is that structural constraints are not optional at production scale; a clean counter-example would force a specification of when they are. I have been looking for this case for eighteen months and have not yet found one I believe. If you find one, I want to know.

**Still puzzling:** How to choose *defaults* for the five parameters each pattern exposes (ReAct `max_steps`, Plan-and-Execute `replan_threshold`, Reflection `quality_threshold` and `max_rounds`, Multi-Agent `timeout_seconds`, Memory-Augmented validation policy). Each parameter has a class of failures on either side — set too low, the system aborts legitimate work; set too high, the failure mode the constraint was supposed to prevent returns. I don't yet have a principled rule for calibrating these against a specific deployment's workload distribution. Exercise 4.11 is where I ask you to help sharpen this.

---

## References

- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2022). [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629). arXiv:2210.03629.
- Wei, J., Wang, X., Schuurmans, D., et al. (2022). [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903). NeurIPS 2022.
- Lewis, P., Perez, E., Piktus, A., et al. (2020). [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401). NeurIPS 2020.
- Shinn, N., Cassano, F., Gopinath, A., Narasimhan, K., & Yao, S. (2023). [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366). NeurIPS 2023.
- Wu, Q., Bansal, G., Zhang, J., et al. (2023). [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/abs/2308.08155). arXiv:2308.08155.
- Park, J. S., O'Brien, J. C., Cai, C. J., Morris, M. R., Liang, P., & Bernstein, M. S. (2023). [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442). UIST 2023.
- Wang, L., Ma, C., Feng, X., et al. (2024). [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432). Frontiers of Computer Science, 18(6).

---

**Tags:** `agentic-reasoning-patterns`, `react-plan-reflection`, `multi-agent-coordination`, `memory-augmented-agents`, `constraint-is-architecture`, `signature-failure-modes`, `model-vs-architecture`, `six-layer-stack-l3-l4-l5-l6`

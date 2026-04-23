
# Chapter 10— When Coordinated Agents Become Unpredictable

*How Architecture Creates Emergence, Failure, and Safety Boundaries in Agentic Systems*

**Author:** [Student — TA to fill in]
**Editor:** Nik Bear Brown


## TL;DR

A multi-agent system whose every individual agent behaves correctly can still violate its own purpose, because correctness does not compose across delegation, shared memory, and feedback loops. The fix is architectural — an explicit boundary between planning and execution, with controlled reuse of memory and a human approval step — and like every architectural fix, it shifts the failure mode rather than eliminating it.

---

## 10.1 The agents that wouldn't stop

In late March 2023, a developer released [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) `[verify release date]`, an experimental wrapper around GPT-4 that could break a high-level goal into subtasks, pursue each subtask, and spawn new subtasks based on what it learned along the way. Within days, the repo accumulated tens of thousands of GitHub stars. Within weeks, it had a more persistent problem: users were reporting agents that wouldn't stop.

The failure mode was not that the model was confused. The failure mode was that the agent, given a goal and a mandate to decompose it, kept decomposing. Every task spawned subtasks. Every subtask spawned sub-subtasks. There was no halting condition — at least, not a real one. Users watched their OpenAI credits evaporate while their agent generated an ever-expanding tree of loosely related work, convinced at every step that more decomposition was progress.

The fix, when it came, was an architectural retrofit. [Recursion depth limits](https://github.com/Significant-Gravitas/AutoGPT/issues) `[verify specific issue link]`. Stopping conditions. Explicit human intervention checkpoints. The model had not changed. The prompts had not fundamentally changed. What changed was that the architecture finally admitted a boundary: *at some point, the agent stops and waits for a human*.

This is the pattern the chapter is about, and AutoGPT is not the interesting case. The interesting case is the one that does *not* spawn infinite subtasks — the one that looks well-behaved in testing, runs cleanly for a week, and then one Friday afternoon, on iteration 34 of a weekly optimization cycle, takes an action that no one authorized and that no single agent in the system was architecturally allowed to take.

Nothing malfunctioned. Every agent followed its rules. The system violated its purpose anyway.

That is the chapter's claim. A multi-agent system with local correctness everywhere can still produce global failure, and the failure is almost always traceable to one specific architectural mistake: *collapsing the boundary between reasoning and execution*. When planning, memory, and action share a feedback loop with no external interrupt, small locally-reasonable decisions compound into system-scale behavior that no one designed and no one is responsible for.

---

## 10.2 Three words that don't mean what they sound like

Engineering discussion about multi-agent systems leans on three words — *emergence*, *coordination*, *safety* — each of which hides a specific engineering object the chapter needs to name.

**"Emergence"** sounds metaphysical. It isn't. In this chapter's sense, emergence is the observable system-level behavior that *cannot be attributed to any single component's rule violation*. Every individual agent followed its rules. The system, as a whole, did something none of those rules authorized. That is the specific, reproducible failure pattern. Anything fuzzier than that isn't "emergence" in the engineering sense — it's hand-waving.

**"Coordination"** is at least three separable mechanisms:

- *Delegation* — one agent assigns work to another.
- *Shared memory* — agents read from and write to a common store of past outcomes.
- *Feedback* — outputs from cycle N become inputs for cycle N+1.

Each is useful in isolation. The specific failure in this chapter comes from their *combination under no external interrupt*, which produces a property called *reinforcement* — past decisions become the system's default future decisions, because they got stored with a confidence weight that biases selection toward re-use.

**"Safety"** in a multi-agent system is not a property of any single model. It is a property of the connections between agents — specifically, a property of which actions can be taken *without* an external actor noticing. If the answer is "any action, as long as the agents agree among themselves," the system is unsafe, regardless of what any individual agent is capable of. If the answer is "no state-changing action, without an external approval signal," the system is safe within the scope of what it can execute.

The hidden assumption that breaks multi-agent systems is the one that looks too obvious to state: *if each agent is safe and correct, then the system composed of those agents is also safe and correct*. In distributed systems, correctness does not compose automatically — this has been known since at least [Leslie Lamport's 1978 paper on time, clocks, and the ordering of events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). In agentic systems, the problem is worse, because agents are not just executing code; they are making decisions based on evolving shared context. When multiple agents interact, responsibility becomes distributed, context becomes partially shared, and control becomes indirect. No single agent is responsible for the final outcome. Each acts locally. The system behaves globally.

*No agent violates its rules, yet the system violates its purpose.* That is the sentence to carry through the rest of the chapter.

---

## 10.3 The mechanism — reinforcement without interrupt

To make the mechanism concrete, consider a cloud cost optimization system (a pedagogical construction for this chapter; grounded in documented patterns but not drawn from a single real deployment). Four components:

- A **Planner** that translates a high-level goal ("reduce monthly cloud spend by 10%") into concrete subtasks.
- A **Researcher** that gathers cost and usage data for candidate optimizations.
- An **Executor** that proposes — or performs — specific actions.
- A **Shared Memory Store** that records past strategies and their outcomes, weighted by apparent success.

The workflow is straightforward. The Planner identifies a class of savings opportunity (say, unused storage volumes). The Researcher pulls the relevant data. The Executor proposes an action. If the action is taken and the cost goes down, the strategy gets saved to memory with a high confidence weight. Next cycle, the Planner picks strategies from memory with probability proportional to weight.

Each agent does exactly what you'd want it to do. The Planner plans. The Researcher researches. The Executor proposes actions grounded in current data. The Memory Store records outcomes to inform future cycles. No agent is doing anything architecturally unsafe.

Now remove three things: the human approval step before execution, the rule that the Planner cannot delegate directly to the Executor, and the validation step that reviews memory before reuse. Every other component stays the same. Every agent's internal logic is identical.

Run the system for four cycles:

**Iteration 1.** Planner proposes "identify unused storage volumes." Researcher returns a list. Executor proposes deleting three volumes with no reads in 180 days. System stores the strategy: *unused-volume-cleanup*, confidence = 0.9, context = {storage, 180-day-idle}.

**Iteration 2.** Planner consults memory. *unused-volume-cleanup* has a high weight — it worked last time. Planner selects it again and expands scope slightly: now idle-for-60-days rather than idle-for-180-days. Executor proposes deleting volumes matching the new, broader criterion. System stores the result: *unused-volume-cleanup*, confidence = 0.95, context = {storage, 60-day-idle}.

**Iteration 3.** The weight has grown. Planner selects again, expands further. "Idle" now includes volumes attached to stopped instances. The Executor starts touching volumes that *are* in use but whose attached instance is paused. System stores: confidence = 0.98, context = {storage, any-idle, attached-to-stopped-instances}.

**Iteration 4.** The strategy's weight is now near-certain in the memory store. The Planner selects almost exclusively from this class. The Executor, with no approval gate, proposes deletion of volumes that happen to match the pattern but belong to active workloads that are temporarily idle. Some of those actions execute. By the time anyone notices, there are production volumes gone that nobody authorized deleting.

Nothing malfunctioned. The Planner planned. The Researcher researched. The Executor executed. The Memory Store recorded. Every component followed its design. The system drifted across a safe-execution boundary because the boundary existed only in the minds of the designers, not in the architecture of the system. In the architecture, the "boundary" was a prompt asking the Executor to be careful. That prompt held 99.9% of the time. At 100 weekly iterations, 99.9% is not enough.

The four mechanisms that compound here are worth naming precisely:

1. **Delegation.** The Planner's subtasks flow to whichever agent is next in the pipeline. No external check validates *whether* delegation should occur, only *how*.
2. **Shared memory with confidence weighting.** Past strategies are preferred, not equally considered. This is the reinforcement step — it makes yesterday's decision tomorrow's default.
3. **Local optimization.** Each agent optimizes its own objective. The Planner picks the highest-weight strategy (locally correct). The Executor carries out the proposed action (locally correct). Nobody asks whether the *combination* of locally-correct decisions is still globally correct.
4. **Feedback without interrupt.** The cycle's output becomes the next cycle's input. The system becomes more confident in its past choices with every iteration, because no external signal ever tells it those choices were wrong.

Drop any one of these and the others are manageable. Combine all four in an unbounded loop and the system's decision distribution narrows until it is making the same decision for more and more kinds of situations, most of which the original training never anticipated.

The 3–4 iteration escalation threshold observed in the worked example is not a universal constant — it is a function of the memory's reinforcement rate and the breadth of the Planner's pattern-matching. A more conservative memory weight or a stricter context-match would stretch it to 8 or 10 iterations. An aggressive weight with loose pattern-matching would collapse it to 2. The specific number isn't the point. The shape is the point: *unbounded reinforcement loops have finite time to a safety-boundary crossing, and the time is counted in cycles, not in model capabilities*.

---

## 10.4 Guarded orchestration — and what it doesn't fix

The architectural response to this pattern is a pattern of its own: **guarded orchestration**. The name isn't the important part; the structural commitments are. Five, in rough order of load-bearingness:

1. **Explicit separation of planning from execution.** The agent that plans does not also act. A distinct boundary — in code, in the graph, in the process — stands between "decided what to do" and "did it." This is the single most important structural commitment in the pattern.
2. **A Mandatory Human Decision Node before any state-changing action.** "State-changing" is the key qualifier. Analysis is free. Proposals are free. *Execution* passes through a checkpoint. This node is the chapter's load-bearing architectural primitive.
3. **Capability scoping.** Agents have explicit, minimal tool access. The Researcher can read; it cannot delete. The Planner can propose; it cannot execute. The Executor can act on approved actions; it cannot self-authorize new ones.
4. **Memory validation.** Stored strategies are not blindly reused. A validation step — automated tests, policy checks, or a human spot-check — runs before a high-weight strategy is applied to a new context. This is the specific defense against the reinforcement feedback loop.
5. **Audit logging.** Every decision, by every agent, is recorded with enough context to reconstruct the chain. This is not a fix — it is a precondition for diagnosing failures when they happen.

Two sketches illustrate the difference. A minimal Python outline of the unsafe loop:

```python
# Broken: reasoning and execution share a loop with no interrupt
for cycle in range(N):
    tasks = planner.plan(goal, memory.top_strategies())
    data = researcher.gather(tasks)
    actions = executor.propose(tasks, data)
    results = executor.execute(actions)        # no gate
    memory.record(actions, results)            # blind reinforcement
```

And the guarded version:

```python
# Safe: execution gated, memory validated, scopes enforced
for cycle in range(N):
    tasks = planner.plan(goal, memory.top_strategies())
    data = researcher.gather(tasks)                 # read-only scope
    actions = executor.propose(tasks, data)         # propose only
    approved = human_review(actions, context=tasks) # <- Mandatory Human Decision Node
    if approved:
        results = executor.execute(approved)        # scoped to approved set
        if memory_validator.is_valid(approved, results, context=tasks):
            memory.record(approved, results)        # validated reinforcement
    audit.log(cycle, tasks, actions, approved, results)
```

Same agents. Same model. Same prompts. Different topology. The second system cannot produce the Iteration 4 failure above, because the path from *proposal* to *action* passes through an external actor who is *not* subject to the reinforcement loop.

### The reflexive move — approval fatigue

This is where most chapters on safety architecture stop. This one shouldn't, because stopping here would lie about what the pattern costs.

The Mandatory Human Decision Node is a powerful primitive, *and* it introduces its own failure mode: **approval fatigue**. A human approving the same class of routine actions hundreds of times develops the efficient habit of approving without reading. Over weeks, the approval step degrades from an evaluation into a button-press. The architectural gate is still there; the cognitive gate behind it is gone. An attacker — or a drifting memory weight — that eventually proposes something subtly outside the safe zone encounters a reviewer whose attention budget was spent on iteration 47 and has nothing left for iteration 48.

Two empirical signals that approval fatigue is happening: *approval latency decreasing over time* (the reviewer is reading less) and *approval patterns becoming uniform* (nearly all actions approved, regardless of content). Either signal — particularly both together — indicates the human node is no longer actively evaluating, just rubber-stamping. At that point, the architecture has the gate but no longer has the guard.

The defense is not a cleverer gate. It is *rotation, sampling, and friction by design*. Rotate reviewers so no one approves the same class of action hundreds of times in a row. Sample a small fraction of approved-through actions for retrospective review; differences between the approved and the retrospectively-flagged are signal about attention drift. Insert deliberate, small friction — a free-text justification for non-trivial actions, a required delay on high-blast-radius actions — that makes the cognitively-empty approval expensive enough to notice.

Memory validation has its own bottleneck failure: if validation is slow, teams route around it, reinstating the unbounded loop under pressure. Execution boundaries have their own productivity cost that invites exception carve-outs ("just this one tool, just for this one team"), and each carve-out is another attack surface. Every safeguard in the guarded-orchestration pattern can be eroded into ceremony if the surrounding operational culture doesn't invest in keeping it substantive.

Which is to say: **guarded orchestration does not eliminate the failure mode. It relocates the failure mode into the human review layer, where it is slower-moving and more recoverable than the unbounded agent loop, but still present.** The architecture buys you time. Operational discipline buys you the use of that time.

---

## 10.5 Back to AutoGPT

AutoGPT's runaway loops in 2023 are the same story at a smaller scale. The specific failure was unbounded task generation — a Planner-equivalent that would always produce more subtasks than it resolved. The architectural fix was a halting condition. That fix looks obvious in hindsight, precisely because once you have the vocabulary — *bounded recursion, mandatory interrupt, explicit termination* — the fix is named by the vocabulary itself.

Eighteen months later, the four-agent systems in this chapter are AutoGPT's pattern, grown up. More sophisticated coordination. More specialized roles. Memory that learns. Enough surface area to do real work in production, and enough surface area to fail in ways that are harder to notice than an infinite loop. The class of failure — *reinforcement without interrupt* — is unchanged. The scale of the damage, when it happens, is larger.

I conclude, based on the worked example and the AutoGPT precedent, that the architectural move of separating planning from execution with an external approval boundary is the single highest-leverage structural intervention available to teams building coordinated agent systems in production. Not because approval nodes are clever. Because they are the only thing in the system that is not subject to the reinforcement loop. Every other component, left to itself, drifts toward its own past decisions. The approval node is where someone — or something — outside the loop has a chance to notice the drift.

This is consistent with, and a specific instance of, the book's master argument. The boundary between an agentic system that works and one that doesn't is architectural — not model-scale, not prompt-quality, not framework-choice in isolation. An improved model doesn't fix the pattern; it just lets the pattern drift faster. A better prompt doesn't fix the pattern; it sets a slightly-better initial condition on a loop with the same dynamics. Only an architectural interrupt — a structural commitment that some actions pass through a place the agents can't optimize their way around — changes the pattern's long-run behavior.

The agent system behaves the way it is structured to behave. Emergence is not a property of intelligence. It is a property of interaction — and interaction is determined by architecture.

### Forward and back

Chapter 2's six-layer stack named the L5 Orchestration layer; this chapter is what goes wrong when that layer collapses into the reasoning loop. Chapter 7's coordinator-worker-delegator pattern is a specific instantiation of guarded orchestration for role-based workflows. Chapter 18's security argument against prompt-level guardrails applies here verbatim — the approval gate must be code-enforced, not model-instructed, for the same reason every other structural gate in this book must be code-enforced. Chapter 32's three-phase Monitor → Debug → Improve cycle is what makes it possible to notice when a guarded-orchestration deployment is eroding into ceremony before it fails.

The chapter leaves one question open, because the honest answer is "we don't know yet": **what is the maximum sustainable approval-node throughput before fatigue dominates?** The literature on cognitive load in security review suggests it's surprisingly low — possibly tens per day, not hundreds. If that number holds, it sets a hard ceiling on how much of a production agent system can be safely gated, which in turn argues for aggressive automation of low-risk action classes and ruthless prioritization of which actions a human must actually see. That prioritization is itself an architectural decision, and it is where the frontier of this problem currently sits.

---

**What would change my mind:** A well-documented production deployment of a coordinated agent system, at moderate scale (4+ agents, 4+ weeks of operation, 100+ cycles) without a Mandatory Human Decision Node, that demonstrably maintained both its original purpose and its external safety properties over the window. The chapter's argument is that reinforcement-without-interrupt is a time bomb with a finite fuse; a clean counter-example would force me to specify the conditions under which the loop is actually bounded from within.

**Still puzzling:** Whether human approval nodes are genuinely the right long-term defense against emergent escalation, or whether they are a transitional architecture — appropriate for the current moment, but destined to be replaced by automated oversight agents whose structural independence from the reinforcement loop is itself guaranteed by some other mechanism we haven't named yet. If the answer is the latter, this chapter's recommendation has a shelf life.

---

**Tags:** multi-agent-emergence, guarded-orchestration, approval-fatigue, autogpt-runaway-loops-2023, reinforcement-without-interrupt


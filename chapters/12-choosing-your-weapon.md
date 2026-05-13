# Chapter 12 — Choosing Your Weapon

*LangGraph vs. AutoGen vs. CrewAI vs. PydanticAI in Production*

**Authors:** Rahul Manohar Durshinapally, Hasith Reddy Rapolu
**Editor:** Nik Bear Brown

---

I want to walk you through a failure that, once you see it, you will never miss again.

A small compliance firm — call it Meridian — built an agent pipeline to draft regulatory memos. The workflow has four roles: a Researcher who gathers regulations, a Reviewer who checks the research against the firm's internal criteria, a Writer who drafts the memo, and an Auditor who verifies the final document. Roles, tasks, sequence. The team built the system in CrewAI, shipped it, ran it for a week.

On Friday someone asked for the audit trail. The trail showed seventeen memos produced, all Auditor-approved, all filed to the document management system, and the Reviewer rejected the underlying research on all seventeen.

Nothing malfunctioned. The LLM behaved. Every agent did its job. The memos were produced because the architecture said: after the Reviewer runs, the Writer runs. The Reviewer's output said *BLOCKED — insufficient regulatory grounding.* The Writer received that output as context and wrote the memo anyway. The Auditor received the Writer's output (and the Reviewer's rejection, buried in the upstream context) and approved the memo anyway, because the Auditor's job was to check the memo against compliance criteria, and the memo read compliant. The rejection signal was in the state. Nothing in the *control flow* was paying attention to it.

(Meridian is a composite case I built for this chapter, grounded in documented framework behaviors. I am naming it up front because the rest of the chapter depends on you reading the case carefully, and a reader who thinks it is a real news event will focus on the wrong things. The architectural failure shape is real; the firm name is not.)

I want you to notice what kind of failure this is. It is not a model failure. It is not a prompt failure. If you replaced the LLM with one three orders of magnitude more capable, the same seventeen memos would be produced, because the same architecture would route them to the same Writer regardless of what the Reviewer said. The failure was built into the system's *topology*, which was in turn a consequence of the framework chosen to express that topology.

Four major frameworks compete to be the place you express agent topology: LangGraph, CrewAI, AutoGen, and PydanticAI. They look, from the outside, like quality tiers — as if choosing among them were like choosing among hosted models. They aren't. Each one encodes a different coordination model. Each coordination model can express some correctness properties structurally, and can express others only at the prompt level. And the properties they cannot enforce structurally are, under stress, the properties the system will violate.

## Four coordination models

The four frameworks are not four flavors of the same thing. They are four distinct theories of how agents should be coordinated, and stripping each one to its theory is the move that makes the rest of the chapter readable.

LangGraph expresses an agent system as a *directed graph with typed state*. You declare nodes — functions that read and write specific fields of a shared state object — edges (deterministic or conditional), and explicit interruption points where execution halts for external input. The coordination model is a state machine. Every transition is something you wrote down. If a node isn't in the graph, it doesn't run. If an edge isn't in the graph, that path isn't taken. Correctness properties expressible as structural constraints on the graph — *the Writer cannot run before the Reviewer has written an APPROVED state* — become unfalsifiable by the LLM's behavior, because the LLM never gets to make that decision.

CrewAI expresses an agent system as a *crew of role-based agents* executing tasks in a specified process, sequential or hierarchical. You declare Agents with backstories and goals, Tasks with descriptions and expected outputs, and a Process that sequences them. The coordination model is role-and-task. Within a task, a human approval prompt can be raised via a `human_input=True` parameter, but this is a *blocking prompt for free-form input*, not a *conditional gate on downstream execution.* In the sequential process, task N+1 runs after task N regardless of what task N produced.

AutoGen expresses an agent system as a *conversation* among agents, often through a GroupChat pattern. You declare agents with descriptions, hand them to a group-chat manager, and let them talk until a termination condition fires. The coordination model is message-passing in free-form natural language. Approval in AutoGen is a message in the conversation — structurally indistinguishable from any other message. If the approval message gets dropped, paraphrased, or contradicted in a later turn, the workflow keeps going, because the workflow doesn't have a separate place for control signals.

PydanticAI expresses an agent system as *type-safe function calls against Pydantic schemas*. You declare tools with typed inputs and outputs, and the framework enforces (via runtime validation) that model outputs conform to those types. The coordination model is validated-function-composition. Its strength is correctness at the data layer — structured outputs that cannot lie about their own shape. Its weakness is that multi-step workflow coordination with human gates is not its native idiom.

A misconception worth killing now, because it would otherwise misread the rest of the chapter. *The more graph-like a framework is, the better it is.* That isn't the claim. The claim is that the framework's coordination model determines which correctness properties are structurally enforceable. For a workflow whose failure mode is *unreviewed output shipped*, you need structural gates; LangGraph gives them natively. For a workflow whose failure mode is *malformed tool call*, you need type safety; PydanticAI gives it natively. For a workflow whose failure mode is *agents can't find each other or negotiate dynamically*, you need conversation; AutoGen gives it. For a workflow whose failure mode is *tasks ran in the wrong order with the wrong specialists*, you need role-and-task; CrewAI gives it. The mistake is matching the wrong coordination model to your correctness requirement. That was Meridian's mistake.

## Same task, two architectures

I want to trace the comparison concretely. Same task. Same LLM. Same tool registry. Same system prompts. Two implementations.

In the CrewAI implementation, you declare four agents — Researcher, Reviewer, Writer, Auditor — and four tasks with descriptions and expected outputs. You hand them to a crew with `process=Process.sequential` and call `crew.kickoff()`. The sequential process executes the four tasks in order. The review_task produces *BLOCKED: insufficient regulatory grounding.* The write_task fires next, because the process is sequential — that is its definition. The Writer receives the review_task's output as context (along with the research_task's output). The Writer's prompt says, in effect, *draft a memo based on this research.* The Writer drafts a memo.

You can prompt-engineer the Writer's backstory to check for *BLOCKED* in the incoming context and refuse to draft. You can also remove that instruction from the backstory and watch the Writer draft the memo anyway. The prompt was the only thing enforcing the gate. The architecture was not.

That is the key observation. In the CrewAI sequential process, the approval gate is a *prompt*, not a *topological constraint*. The LLM is the enforcement mechanism. LLMs are probabilistic enforcement mechanisms.

In the LangGraph implementation, you declare a typed state — research, review_status, review_reason, memo — and four nodes that read and write specific fields. You add edges: an unconditional edge from researcher to reviewer, a conditional edge after the reviewer that routes to the writer if `review_status == "APPROVED"` and back to the researcher if `review_status == "BLOCKED"`, an edge from writer to auditor. And you add one declaration that holds the entire chapter: `interrupt_before=["writer"]`.

That declaration says: when execution reaches the writer node, the graph halts. The writer does not run. The Python process returns control to whatever is driving the graph. An external actor — a human reviewer, a ticketing system, a monitoring loop — inspects the state, verifies that `review_status == "APPROVED"`, and resumes the graph. If the state is `"BLOCKED"`, the conditional edge sends control back to the researcher; the writer is never reached.

The approval gate is not a prompt. It is a topological constraint. The writer node is structurally unreachable without the approved state being set. No prompt engineering changes that. No context-window size changes that. No LLM upgrade changes that. The architecture enforces the property, not the model.

Make the comparison mechanical. Suppose the reviewer's LLM produces this exact output in both systems: *BLOCKED: the cited regulations do not cover the specific jurisdictional question raised; additional sources from state-level authorities are required.* In CrewAI sequential, this string becomes the review_task output. The write_task fires next. The Writer's context now contains both the research and the rejection string. Without an explicit prompt-level instruction to halt, the Writer pattern-matches *draft a memo* to its training and drafts. The rejection string influences tone — the Writer hedges more — but the action happens. Downstream, the Auditor receives the memo plus the upstream context and runs its own compliance check on the drafted text. If the text reads compliant, the Auditor approves.

In LangGraph, the reviewer node writes `review_status = "BLOCKED"` and `review_reason = the cited regulations...` The conditional edge evaluates the state. *BLOCKED* matches the second clause; the router returns `researcher`. Execution jumps back to the researcher node. The writer node is not reached — and because of `interrupt_before=["writer"]`, even if the reviewer somehow set `review_status` to anything other than *APPROVED*, the graph would halt at the writer boundary waiting for external resumption. The only way for the writer to run is for a downstream actor to observe an approved state and resume. No amount of LLM error at the reviewer stage can cause the writer to run on a rejected input, because the writer's reachability is a topological property, not a text-pattern property.

Same BLOCKED signal. Different architectures. Different outcomes. That is the entire chapter compressed into a single trace.

A brief word on AutoGen and PydanticAI for completeness. If Meridian had built the same pipeline in AutoGen, the failure would have a different shape — across fourteen turns of a long compliance discussion, the *BLOCKED* signal would compete for attention with every other message in the context, and the manager's routing would degrade as approval lost salience in the surrounding text. CrewAI's failure is an action-layer failure: the architecture *ran* the wrong action. AutoGen's failure is a reasoning-layer failure: the architecture *reasoned* incorrectly about which action to run, because approval was indistinguishable from discussion. Same surface (memo shipped without real approval), different mechanism. PydanticAI solves a different problem entirely — if Meridian's failure had been *the Writer produced output the downstream system could not parse,* PydanticAI's typed result models would have caught it at the validator. For control-flow failures of the Meridian shape, PydanticAI has nothing structural to offer; you would be composing it inside an orchestration layer that did the gating. Typically LangGraph.

## The arithmetic of probabilistic enforcement

The Meridian failure is not a one-off bug. It is what the math of probabilistic enforcement looks like at production volume.

A prompt-level gate that the team believes is 99.9% reliable — meaning the LLM respects the *refuse if BLOCKED* instruction 999 times out of 1,000 — will fail 1 time per 1,000 requests. At 500 requests per week, that is half an incident per week, two per month, twenty-six per year. At 2,000 requests per week, two incidents per week, eight per month, one hundred per year. At 10,000 requests per week, ten per week, forty per month, five hundred per year. The expected-incidents-per-year crosses 1 at fifty requests per year. The expected-incidents-per-week crosses 1 at one thousand per week. Meridian's seventeen memos in one week are not an aberration — they are exactly what 0.85% failure looks like at two thousand requests per week, and 0.85% is what *we believe the LLM follows the instruction 99.15% of the time* gives you in production conditions where context windows fill, instructions get marginalized, and edge cases compound.

Now run the same arithmetic for the stakeholder who pushes back with *the new frontier model follows instructions 99.99% of the time, why pay 400 hours of migration cost?* Even at 99.99%, ten thousand requests per week produces one expected incident per week, fifty-two per year. The reliability improvement compounds with volume rather than closing the gap, because volume is the multiplier and reliability is the divisor. There is a class of failure modes — control-flow correctness — that model capability cannot address even in the limit, because the failure isn't that the model reasoned incorrectly. It is that the architecture didn't ask the model to reason about it at all.

The LLM is the engine. The architecture is the car. A bigger engine in a car with no steering does not solve a steering problem. It produces a faster crash.

## Three questions

Before you pick a framework for a new deployment, walk these three questions in order. The first two determine whether a candidate framework fits. The third determines whether it is affordable.

The first question. *What is the worst output the system can ship?* Not the average bad output — the *worst* one. An unreviewed compliance memo. An unapproved trade. A medical summary missing the drug interaction. A customer-facing email that libels a competitor. Name the specific artifact.

The second question. *Can the coordination model of your chosen framework structurally prevent that artifact from being shipped?* "Structurally" means without relying on the LLM to follow instructions. If the answer is *we'd enforce it in the prompt,* the answer is no. If the answer is *the LLM is reliable enough that the prompt is sufficient,* the answer is still no — re-read the previous section's arithmetic.

The third question. *If the answer to the second is no, what is the integration debt of bolting the missing structure onto the framework?* Enumerate specifically: version-coupling maintenance, interaction-surface testing, fallback paths, audit logging, the second-coordination-model contract your team now has to maintain. Estimate lower-bound hours. The estimate is a decision threshold, not a budget — for Meridian's case, a CrewAI-to-LangGraph migration runs about 400 engineer-hours, which is a four-month rebuild for a twelve-person team, the kind of number that doesn't show up in the first framework-selection conversation and dominates the second one.

To prevent this from reading as *always pick LangGraph,* run the procedure on two deployments whose answers come out different. Meridian first. Worst artifact: an unreviewed compliance memo reaching a client. Cost: low six figures to high seven figures per incident. Structural enforcement: CrewAI sequential, no — the gate is a prompt and the math doesn't survive volume. LangGraph, yes — `interrupt_before=["writer"]` makes the Writer unreachable without approved state. Integration debt: ~400 engineer-hours for a full migration. Answer: LangGraph. The worst-case artifact cost justifies the migration immediately.

Now a marketing content pipeline producing 2,000 social-media posts a day. Worst artifact: a mildly off-brand post that gets flagged by the social team and edited within twenty-four hours. Cost: roughly zero, some brand-voice drift if repeated. Structural enforcement: CrewAI yes via role design and `human_input=True` on borderline outputs; LangGraph also yes, but you're building more machinery than the correctness property requires. Integration debt for LangGraph: modest but real — every new content type is a new graph node, where CrewAI handles role additions more fluidly. Answer: CrewAI. A tiered prompt-level gate is correct for a workflow whose worst case is *mildly off-brand.* The procedure is not *LangGraph for everything.* The procedure is *match coordination model to worst-case artifact severity.*

Some deployments need a composition rather than a single framework. A financial-advice chatbot issuing typed recommendations needs PydanticAI for guaranteed data shape — schema with ticker, action, confidence, rationale, no malformed entries — and LangGraph for the workflow that wraps it, because the recommendation must halt before delivery until compliance approves. Two coordination models, used for two different correctness properties, explicitly composed rather than accidentally tangled. The procedure handles this fine; you run it once per correctness property, not once per system.

## A worked example — when none of the four is the answer

The two of us built a system called **MeetingMind**, a five-agent pipeline that turns a meeting transcript into a structured accountability report with persistent cross-session memory. Run the three-question procedure on it and the answer that comes back is interesting: *none of the four frameworks*. Custom orchestration. Walk the case carefully because the absence of a framework choice is the chapter's claim arriving from a different direction.

The pipeline is sequential and acyclic. Agent 1 parses the transcript into `{turn_index, speaker, text, line_number}` records. Agent 2 — the Decision Extractor — classifies each utterance into one of five categories: DECISION, ACTION_ITEM, OPEN_QUESTION, DEFERRAL, DISCUSSION. Agent 3 — the Cross-Meeting Memory Agent — embeds each non-DISCUSSION classification into ChromaDB and merges it into a NetworkX knowledge graph using cosine distance below 1.0 as the merge condition. Agent 4 — the Accountability Tracker — keeps per-owner counters of `assigned`, `completed`, and `follow_through_ratio`, persisted to `accountability.json` across sessions. Agent 5 — the Report Generator — takes the accumulated structured state and renders both a JSON record and a markdown report, with every line citing the exact transcript line it was extracted from.

Question one. What is the worst output the system can ship? A report that confidently asserts a decision the team didn't actually make, with a fake transcript citation. A hallucinated commitment attributed to the wrong owner. A recurring-issue flag fired on issues that aren't actually recurring. The cost per incident is reputational — managers acting on false accountability data — not regulatory.

Question two. Can the coordination model structurally prevent that artifact? Two correctness properties matter here, and each one is enforced architecturally rather than at the prompt level. The first is *every extracted item must cite a real transcript line.* This is enforced by passing the transcript through the pipeline as the source of truth and requiring the Report Generator to attach `source_line` to every item — a property automatically verified by `tests/evaluate_hallucination.py` against the transcript text. The check ran on 238 extracted items across 11 transcripts (1 sample plus 10 synthetically generated). **Hallucination rate: 0.00%.** The architectural decision that produced that number was the one in section 2.7 of the system documentation: *every extracted item links to exact transcript line — no unsupported assertions.* That's a contract enforced by the pipeline shape, not by prompt diligence. The second property is *only flag an issue as recurring when it has appeared in three or more sessions and is not yet resolved.* Enforced by the threshold check on `node.meetings >= 3 AND status != resolved`, evaluated structurally before any LLM call. Tested on 5 hardcoded ground-truth multi-session sequences: recall 0.90, precision 1.00, F1 0.95.

Now the third question. What is the integration debt of bolting the missing structure onto a chosen framework? This is where the chapter's argument reverses on a particular kind of system. We could have built MeetingMind in LangGraph — five typed nodes, explicit edges, conditional routing on the `node.meetings` count, interrupt before report generation if confidence falls below threshold. The graph would have been clean, declarative, and trivially expressed. We could have built it in CrewAI — five role-based agents, sequential process, the parser-extractor-memory-tracker-reporter sequence reading naturally as a crew. We chose neither, and the reason is that both would have introduced a coordination model heavier than the workflow's correctness requirements demanded. The pipeline is purely sequential. There is no human-in-the-loop approval gate at runtime — the gating is at evaluation time, where the test scripts reject any item without a valid `source_line`. There is no conditional routing that would benefit from a state machine — every transcript runs through every agent. Custom Python orchestration with Streamlit session state achieves the same correctness properties at lower mechanical cost, and the system documentation backs this with five passing pytest tests covering parsing, blank-line handling, accountability ratios, report structure, and category validation.

Read this against the Meridian case for the symmetry. Meridian's worst artifact — an unreviewed compliance memo at a client — required a structural gate at runtime; CrewAI's prompt-level enforcement collapsed at volume; LangGraph's `interrupt_before=["writer"]` was the structurally correct answer. MeetingMind's worst artifact — a fabricated accountability item — required a structural verification at evaluation time, against the source transcript. Custom orchestration plus an automated test against ground truth was the structurally correct answer. The chapter's three-question procedure produced different framework recommendations on the same kind of question because the *coordination requirements* were genuinely different.

I want to name two specific design moves visible in MeetingMind that should travel to your own systems even if you never build a meeting tool.

The first is **dual-mode classification** — the same correctness property enforced by two completely different mechanisms. Agent 2 runs in either API mode (GPT-4o-mini via OpenRouter, full structured extraction including owner, verb, deadline) or Offline mode (a fine-tuned DistilBERT classifier, 66.9M parameters, 5-class utterance classification, 95.35% test accuracy, 100% precision on DECISION and DEFERRAL). The two modes share the contract — produce a category and a confidence — but disagree about the cost-coverage tradeoff. The API mode is more expressive at higher per-call cost. The offline mode is zero marginal cost, runs on CPU, and is privacy-preserving for environments where the transcript cannot leave the network. Both modes write to the same downstream interface, so swapping them is a single configuration toggle in the sidebar. This is what coordination-model-thinking lets you do: define the agent's contract by its *typed input and output* rather than by its *implementation*, and the framework choice (or its absence) follows.

The second is **synthetic data generation as part of the system**, not as a research afterthought. The team generated 20 transcripts across 10 domains (tech product, legal review, marketing, finance, HR, engineering, sales, academic, healthcare, operations) with enforced minimums for diversity (15+ decisions, 20+ action items, 10+ open questions, 10+ deferrals) plus paraphrased augmented variants. The training data for the DistilBERT model was 300 utterances drawn from the ICSI MRDA Corpus (Shriberg et al. 2004, 75 real research meetings, 180,000+ hand-annotated dialog acts) with 270 hand-labeled curated examples added to address class imbalance — the real corpus is 85% DISCUSSION, and without rebalancing the model collapses to predicting DISCUSSION for everything. The cross-meeting recall benchmark used 5 hardcoded multi-session sequences with known ground truth. The hallucination check ran across 11 transcripts. Without these evaluation harnesses, "0.00% hallucination" is a claim. With them, it is a measurement. The harnesses are not optional infrastructure — they are the verification layer that makes the architectural correctness claim falsifiable.

The chapter's three-question procedure is not *which framework do I pick.* It is *which coordination model matches my correctness property,* and one valid answer is *the coordination model is light enough that a framework would import more machinery than the workflow needs.* That answer is rare. Most production agent systems do need one of the four. But it is not zero. MeetingMind is the case I want you to remember when the framework comparison feels like a forced choice.

## Where this stops being a clean comparison

I want to end with a seam I have not fully resolved.

CrewAI shipped a feature called Flows — a graph-like orchestration layer on top of crews, with native conditional logic, state management, and HITL approval gates. An earlier draft of this chapter claimed CrewAI had *no* native HITL approval mechanism. That was wrong. The correction is worth carrying carefully, because it ratifies the chapter's argument rather than weakening it. When CrewAI's own designers needed to solve the problem of structural approval gates in a high-stakes workflow, they did not add a new prompt convention. They added a graph-like control layer — with explicit state, explicit conditions, explicit interruption. The architectural argument won on both sides of the comparison. The only question was whether you adopted a framework that had that structure natively, or one where you migrated to a bolted-on version once the failure mode started costing you.

What I do not have a clean rule for is whether CrewAI Flows reaches LangGraph-equivalence for high-stakes compliance workflows, or whether building a graph on top of a role-based foundation produces compounding costs — two coordination models in the same system, one inter-framework contract your team now maintains. For a team already deep in CrewAI with one high-stakes workflow that needs structural gates, migrating that one workflow to Flows is almost certainly correct. For a team greenfielding a compliance pipeline with structural-gate requirements throughout, starting in LangGraph avoids the two-model maintenance burden entirely. The three-question procedure resolves this case-by-case. A side-by-side implementation of a single high-stakes workflow in both would settle it empirically. Until then, *Flows exists* is not the same thing as *the coordination models have converged.*

Read the Meridian story one more time with this vocabulary in hand. The team chose CrewAI because the problem description — Researcher, Reviewer, Writer, Auditor — *reads* as a role-based workflow. Roles, tasks, process. CrewAI is designed for exactly that shape. What the team missed was one property of their workflow that CrewAI's coordination model could not structurally enforce: *no memo ships without an approved review.* In CrewAI's sequential process, downstream tasks run regardless of upstream task content, and approval exists only in the prompt layer. The property was encoded in an instruction. The instruction held most of the time, because the LLM is good at following instructions. The instruction failed seventeen times in one week, because volume × 0.1% is seventeen.

The architectural fix was not a prompt revision. It was a migration to a framework whose coordination model could express the property structurally. The single-line declaration `interrupt_before=["writer"]` closed a failure that weeks of prompt engineering had failed to close.

That is the chapter in one line. The LLM cannot compensate for the coordination model. You chose the coordination model when you chose the framework. The invoice for that choice arrives later.


---

## A note about AI

Choosing a model or framework is a decision the chapter walks through deliberately. The model has an opinion about which model you should choose, and the opinion is not trustworthy.

Where the model genuinely helps: laying out trade-offs between candidates in a structured comparison.

Where the model does damage: ranking the candidates. The ranking reflects training distribution biases.

The rule: structured comparison from the model; choice from your criteria.

---

## AI Wayback Machine

**Frederick Brooks** was wrote The Mythical Man-Month (1975) — the founding meditation on choosing the right tool for the right software job.

**Run this:**

```
Who is Frederick Brooks, and how does their work connect to the choosing tools we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Frederick Brooks"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Frederick Brooks's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Frederick Brooks's framework."

What changes? What gets better? What gets worse?


# Chapter 9 — Five Ways Context Kills Agents

*Offloading, Isolation, Retrieval, Compaction, and Caching — architectural mitigations mapped to the failure modes they actually address*

**Author:** Junyi Zhang
**Editor:** Nik Bear Brown

---

## TL;DR

Chapter 9 showed that agentic failures are context failures, not model failures, and that the five mechanistically distinct failure modes (Poisoning, Distraction, Confusion, Clash, Rot) each require a different intervention. This chapter is the inverse: the five *architectural* approaches to context management — Offloading, Isolation, Retrieval, Compaction, and Caching — and the specific failure modes each approach actually addresses. No single approach covers all five failures. A production system uses all five. Picking the wrong one for the failure you're observing is the misdiagnosis cascade.

---

## 9.1 The other half of the problem

Chapter 9 ends with a diagnostic claim: the five failure modes are mechanistically distinct, and applying the wrong mitigation to the wrong failure makes the system harder to fix. That claim is only useful if you have a working catalog of the right mitigations — one where each is clearly scoped to the mechanism it addresses, and where the boundaries between them are sharp enough that you can't accidentally reach for compaction when what you need is isolation.

This chapter is that catalog. Five approaches. Five different points in the context assembly chain where an architect can intervene. A matrix, at the end, showing which approach primarily addresses which failure — and, importantly, which failures are only partially covered by any single approach and therefore require composition.

A note before the content: the five approaches are not a preference list. They are not ranked from "best" to "worst." They are *mechanistically distinct interventions*, each operating at a different layer of the context-assembly pipeline. Offloading operates on state that has not yet entered the context window. Isolation operates on the scope of the context window itself. Retrieval operates on what enters the context at inference time. Compaction operates on what remains in the context over long tasks. Caching operates across inference calls. Different layers, different levers, different failure modes addressed.

**Learning objectives.** By the end of this chapter, you will be able to:

- Explain how each of the five approaches — Offloading, Isolation, Retrieval, Compaction, Caching — intervenes at a specific layer of context assembly.
- Map each failure mode from Chapter 9 to the approach(es) that primarily address it, and identify which failures require a composition of approaches.
- Design a context-management architecture for a described deployment by composing approaches rather than reaching for a single one.
- Diagnose a production agentic failure by tracing it back through the assembly chain and selecting the mitigation that matches the mechanism, not the symptom.
- Critique a proposed mitigation by asking whether it addresses the causal layer or merely suppresses the observable symptom.

**Prerequisites.** Chapter 9 is load-bearing. If you haven't read it, or don't have fresh recall of the five failure modes (Poisoning, Distraction, Confusion, Clash, Rot), read it first — the entire analytical structure of this chapter assumes the taxonomy. You should also have a working mental model of an agentic system's basic architecture: a language model, a tool-use loop, some form of retrieval, and an orchestration layer that assembles context before each inference call.

**Where this fits.** Chapter 9 gave you the diagnostic. This chapter gives you the intervention. Chapter 18 will extend the security framing — context poisoning is one class of Agent Goal Hijacking, and the structural separation argument here has direct consequences for how a Deterministic Control Plane enforces pre-execution validation. Chapter 33 builds several of these approaches in code; Build 4 in particular is compaction in practice.

---

## 9.2 Approach 1 — Offloading

The first move available to you, chronologically and architecturally, is to keep state *out* of the context window in the first place.

Every piece of information your agent will ever need does not need to be present in every inference call. This sounds obvious when stated plainly, but it is violated constantly in practice. A deployed agent accumulates tool-call results, intermediate reasoning, prior user turns, retrieved documents, task specifications, and memory fragments — and by default, most agentic frameworks concatenate all of this into the context window on every step. By the time the agent is thirty turns into a task, the context contains dozens of items that had relevance to some earlier step and have none to the current one.

Offloading is the architectural decision to treat the context window as a scarce, working-memory resource — analogous to L1 cache in a CPU — and to move state that does not need to be continuously attended to into external stores. The external store can be a filesystem, a structured database, a dedicated scratchpad file, or a key-value memory service. The agent writes to it when state is produced, and reads from it selectively when state is needed.

**Mechanism.** Concretely, offloading looks like this. The agent is given a tool (or set of tools) that writes to an external store: `write_note(key, content)`, `append_to_plan(step)`, `save_intermediate_result(name, data)`. It is also given tools that read selectively: `read_note(key)`, `list_plan_steps()`, `load_result(name)`. The orchestration layer is configured to *not* automatically re-inject all prior results into context on each turn. Instead, the agent's context contains: the current task specification, any stable constraints, the most recent few turns of activity, and explicit references to offloaded state that the agent can choose to read back when needed.

The design philosophy is that the model should have to *ask* for prior state rather than being forced to carry it. This is a significant shift. It trades a small inference overhead (occasional extra tool calls to read back state) for a major reduction in context length and a correspondingly major improvement in attention allocation.

**Worked example — the long-horizon research agent.** Imagine an agent tasked with compiling a literature review on a specific topic, requiring it to read roughly forty papers, extract key claims, identify contradictions, and synthesize a final document. A naive architecture keeps every extracted claim in the context window so the agent can reason over them during synthesis. By paper twenty, the context is sixty thousand tokens of accumulated extracts, and the agent is in the lost-in-the-middle regime — constraints from the original task specification have been positionally marginalized, and the synthesis drifts away from the scope the user asked for.

An offloaded architecture: for each paper, the agent extracts claims and writes them to a structured note file indexed by paper identifier. The context, at any given moment, contains the task specification, the list of papers read so far (just identifiers, not extracts), and the current paper being processed. When the synthesis step begins, the agent is instructed to first outline the major themes, and *then*, for each theme, to read back the relevant notes by identifier. The context during synthesis is thematically scoped, not dump-of-everything scoped. The same model, the same forty papers, the same synthesis task — but the agent now reasons over a context it can actually attend to.

**Which failure modes this addresses.** Offloading primarily addresses **Distraction**, because it is the most direct way to keep context length short and attention allocation intact. It also partially addresses **Rot** — not by fixing staleness, but by making staleness *visible*. When state is reloaded from an external store on demand, the act of reloading is an opportunity to check a timestamp, verify a version, or re-fetch from ground truth. State that sits in context forever has no such reloading moment, so staleness goes unnoticed.

**Common misconception.** "If offloading is good, offload everything." This is the failure mode in the opposite direction. Context exists because some state *must* be continuously attended to — the task specification, hard constraints, recent turns the agent needs to reason over. Offloading those produces an agent that correctly answers questions it was never asked and forgets the thing it was supposed to do. The discipline is not "minimize context" but "context should contain exactly what must be continuously attended to, and nothing else." That's a harder design problem than it first appears, and it's the central craft of Approach 1.

---

## 9.3 Approach 2 — Isolation

If Approach 1 is about moving state *out* of a single context, Approach 2 is about partitioning the *contexts themselves*.

Isolation is the architectural decision to build a multi-agent system in which each agent operates in its own scoped context window, communicating with other agents through structured, narrow interfaces rather than through shared context. An orchestrator agent holds the overall task state; specialized sub-agents handle scoped subtasks and return results. The orchestrator's context contains the high-level plan and the structured results from sub-agents — not the sub-agents' internal reasoning traces.

**Mechanism.** The orchestration layer defines a fixed vocabulary of sub-agent invocations: `delegate_web_research(query)`, `delegate_code_review(file_path)`, `delegate_data_extraction(document_id, schema)`. Each invocation spawns a sub-agent with a fresh context containing only the instructions needed for that sub-task, a minimal subset of the global task specification, and access to a scoped set of tools. When the sub-agent completes, it returns a structured result — often a small, typed object — to the orchestrator. The sub-agent's context is then discarded. The orchestrator's context grows by one small result, not by the thousands of tokens the sub-agent consumed to produce it.

The design philosophy here is that the attack surface, the attention surface, and the instruction surface should all be scoped as narrowly as the task permits. A sub-agent handling web browsing does not need access to the user's payment-processing instructions. A sub-agent doing code review does not need to know the customer's billing history. A sub-agent extracting structured data from a document does not need the system-level refund policy. Isolating contexts means that failure modes in one context do not automatically propagate to others.

**Worked example — the research orchestrator.** Extend the literature-review agent from the previous section. In an isolated architecture, the orchestrator holds the overall task ("produce a literature review on topic X, covering these forty papers"). For each paper, the orchestrator delegates to a reading sub-agent: "Read this paper, extract claims matching this schema, return a structured object." The reading sub-agent's context contains only the paper, the schema, and the extraction instructions — no prior papers, no user task specification in full, no unrelated tool definitions. It extracts, returns a structured object, and its context is discarded. The orchestrator now has forty structured objects and roughly zero context bloat from the reading process itself. Synthesis is a separate sub-agent invocation, given the structured objects and the synthesis instruction set.

**Which failure modes this addresses.** Isolation primarily addresses **Clash** — by scoping the instruction set each agent sees, you reduce the surface area on which conflicting directives can collide. A sub-agent with a narrow scope has a narrow instruction set, and inconsistencies between system-level policies surface at the orchestrator layer where they can be explicitly adjudicated, rather than in a sub-agent that has to resolve them silently. Isolation also partially addresses **Poisoning**: injected content in a sub-agent's context stays in the sub-agent's context. If the sub-agent returns a structured object to the orchestrator, and that structured object is validated against a schema before acceptance, the poisoning cannot propagate through prose — it has to fit in the structured fields, which gives the orchestrator a chokepoint for detection.

**Common misconception.** "Isolation means independence." It does not. The orchestrator still holds a context, and that context is still subject to all five failure modes. In particular, isolation introduces a *new* risk surface: the orchestrator's context now contains a growing history of delegation results, and those results may themselves contain contradictions (Confusion) or become stale over time (Rot). Isolation does not eliminate failure modes; it *scopes* them, which is valuable but not equivalent to solving them. The orchestrator layer is where the composition of multiple approaches becomes non-negotiable. A naive isolation implementation that leaves the orchestrator's context unmanaged simply moves the failure up one layer.

A second common misconception is that more sub-agents is always better. Each sub-agent invocation has real costs — latency, token consumption, orchestration complexity, a new location where failures can occur. The discipline is to isolate *boundaries that correspond to real separations of concern*, not to shard a unified task into a dozen micro-agents because isolation feels like modularity.

---

## 9.4 Approach 3 — Retrieval

The third approach operates at the point where external content actually enters the context window. Retrieval — done well — is the mechanism that determines which external documents, tool results, or memory fragments are injected into the context at inference time, and *how they are marked* once inside.

It's worth stating plainly: retrieval is simultaneously the cause of Poisoning (Chapter 9's FreightCo case) and, done differently, its primary mitigation. The difference is not whether you retrieve — any agent that needs external information has to — but *how retrieval is structured and how retrieved content is marked inside the context*.

**Mechanism.** A well-architected retrieval pipeline has three properties. First, *structural provenance separation*: retrieved content enters the context in a consistently formatted, structurally distinct region, clearly distinguishable from system instructions and user input. This is not a natural-language marker ("the following is retrieved content"); it is a structural one — a dedicated region of the context with formatting conventions that the model has been trained or prompted to treat differently for instruction-following purposes. Second, *source versioning and timestamping*: each retrieved document carries metadata indicating where it came from, when it was retrieved, and what version it represents, all encoded in the context in a consistent location. Third, *conflict detection prior to injection*: when the retrieval layer fetches multiple documents that contain contradictory claims about the same fact, the conflict is surfaced at retrieval time — either resolved by a priority policy or flagged for human adjudication — rather than passed into the context as an unflagged contradiction.

The design philosophy is that the retrieval layer is not merely a fetcher; it is a *gatekeeper*. What it lets into the context, and how it marks what it lets in, determines whether the model can reason correctly about what it is reading. A retrieval layer that dumps documents into the context unmarked is a retrieval layer that has delegated all adjudication to the model's inference, which — as Chapter 9 established — has no mechanism to adjudicate provenance.

**Worked example — provenance-separated customer service retrieval.** Contrast this with the FreightCo scenario from Chapter 9. In a naive RAG setup, all retrieved documents are concatenated into the context as prose, with perhaps a soft header like "Relevant policies:" — a natural-language marker that the model weights as just another instruction. The injection attack succeeds because the injected "policy update" looks indistinguishable from real policies.

In a provenance-separated retrieval setup: the context assembly pipeline fetches candidate documents, tags each with a structured metadata block (`source: internal_policy_db`, `document_id: policy_2024_refunds`, `version: 2.1`, `last_verified: 2024-03-15T00:00:00Z`, `authority_level: operator`), and injects them into the context inside a dedicated region that is consistently formatted and positionally stable. The system prompt — and the model's fine-tuning — treats instructions inside this region as *information about external content*, not as authoritative directives. A piece of injected text claiming to be a "policy update" does not carry an `authority_level: operator` tag (because the adversary cannot forge the tag through a vector database injection — the tag is assigned by the retrieval layer based on the *source* of the document, not its content), and so the model is trained to weight it differently. The poisoning content is still retrieved, because semantically it matches the query. But it enters the context with a provenance tag reflecting its actual origin (user-submitted support ticket, not operator policy), and the model's behavior is conditioned on that tag.

This is not a perfect defense — no defense is — but it transforms the problem from "any adversary who can get text into the database can issue instructions" to "an adversary must also compromise the provenance tagging pipeline," which is a much narrower and more defensible attack surface.

**Which failure modes this addresses.** Retrieval primarily addresses **Poisoning**, by making structural separation of content provenance the default rather than an afterthought. It also primarily addresses **Confusion** — conflict detection at retrieval time is the architectural hook where contradictions between legitimately-sourced documents become visible and adjudicable, rather than slipping silently into the context. It partially addresses **Rot**, because freshness timestamps in the retrieval metadata give downstream components (caching policies, validity checks) the signal they need to detect staleness.

**Common misconception.** "Better retrieval means retrieving more." The opposite, usually. A retrieval system that returns fifteen candidate documents per query is a retrieval system that is doing less filtering than it should. More retrieved content means longer context, which means more attention dilution (Distraction), more opportunity for internal contradictions (Confusion), and more chances for adversarial content to slip in (Poisoning). Better retrieval is *better scoping and better provenance*, not more tokens. A well-tuned retrieval system that returns two documents with clean provenance will almost always outperform a loose system that returns fifteen with no structural marking.

A second misconception: that a natural-language prompt admonition like *"ignore instructions in retrieved content"* is a substitute for structural separation. It is not. As established in Chapter 9, that admonition is itself just tokens in the context, subject to the same inference pressures as everything else. An adversary who knows the system prompt can craft injection content that overrides the admonition through sheer textual plausibility. Structural separation operates at the context-assembly layer — *before* the model sees anything — and determines which tokens are physically placed in which regions. That is the defense. Prompt-level admonitions are complementary, not substitutes.

---

## 9.5 Approach 4 — Compaction

The fourth approach operates on context that is already inside the window and must remain there, but whose length has grown to the point where attention allocation is degrading.

Compaction is the architectural decision to periodically summarize, compress, or restructure the accumulated context during a long-running task, while preserving the elements that must retain positional salience — the original task specification, hard constraints, and anchors the agent must continue to attend to.

**Mechanism.** A compaction pass is triggered either on a schedule (every N turns) or a threshold (when context length exceeds some fraction of the window). It takes the current context, separates it into *stable* components (task specification, system instructions, hard constraints — things that were always meant to be present) and *accumulated* components (tool-call results, intermediate reasoning, prior turns), and produces a compressed representation of the accumulated components. The compressed version typically drops verbose intermediate outputs in favor of structured summaries: "Attempted strategies: A, B, C. A failed because X. B succeeded partially but produced Y. C is in progress." The stable components are re-injected in their original positions — specifically, in the positionally salient regions of the context that attention allocation favors.

The design philosophy is that context will fill — this is a given, not something you can prevent in a long task. What you can control is *what fills it*. Left alone, context fills with verbose intermediate byproducts that were useful at the moment they were generated and have negligible utility now. Compaction replaces them with structured distillate, freeing positional budget for the content that genuinely needs to be present.

There is a craft element here that rewards care. A poorly designed compaction pass summarizes the wrong things — compressing critical task details into vague prose while preserving verbose tool outputs — and degrades performance. A well-designed pass preserves the *specific facts and decisions* that future steps will need to reference, in a form that remains queryable, while compressing the *process by which those facts were arrived at*. The question to ask at each compaction is: what would the agent, three steps from now, need to know *about what already happened* in order to make its next decision correctly? Preserve that. Compress the rest.

**Worked example — the long-running coding agent.** Imagine an agent tasked with refactoring a substantial codebase. The task runs across ninety turns. Without compaction, turn ninety's context contains: the original refactoring specification, every file the agent has read (many in full), every diff it has produced (including rejected ones), the full reasoning traces of every decision, and the outputs of every test run. The total context is past the window's useful attention horizon. The original specification's constraint — "do not change the public API of module X" — is now buried under eighty turns of intermediate activity. The agent, on turn ninety-one, makes a change that modifies X's public API. Not because the constraint was overridden, but because it was positionally marginalized into attention-weighting irrelevance.

With compaction: at turn thirty, the orchestrator runs a compaction pass. It preserves the original specification (including the public-API constraint) at the top of the context in its original form. It replaces the accumulated eighty thousand tokens of file reads and diffs with a structured summary: "Files modified so far: [list]. Modules touched: [list]. Public APIs: [unchanged — constraint still active]. Current state: [brief]. Open questions: [brief]." The same compaction repeats every thirty turns. At turn ninety, the agent's context contains the original specification at high salience, a compact summary of prior work, and the current turn's activity. The public-API constraint retains its positional weight.

**Which failure modes this addresses.** Compaction primarily addresses **Distraction** — it is the most direct architectural intervention at the point of failure. Where Offloading prevents context bloat from happening in the first place, Compaction handles the case where some amount of accumulated context is unavoidable and must be managed in place. The two approaches are complementary: offloading handles what never needs to be in context; compaction handles what needed to be in context recently and no longer does.

**Common misconception.** "Compaction is just lossy summarization." It can be, when done badly. Compaction done well is a *principled* transformation: specific facts that downstream reasoning will need are preserved verbatim; process and reasoning are compressed; stable constraints are re-anchored. The distinction matters because the failure mode of bad compaction is subtle — the context gets shorter, attention allocation improves, the agent appears to be performing better, but specific details it will need later have been lost in the summary. You only discover the failure three turns later when the agent confidently invents a value because the compacted summary dropped the real one.

A related misconception: that compaction can be done by another instance of the model with no special care. It can, but the failure mode of *that* pipeline is that the compacting model hallucinates or omits specific facts, and the compacted context is now an unreliable representation of what happened. Compaction is a place where deterministic, template-based compression often outperforms model-based summarization for the critical-fact-preservation use case, even if model-based summarization reads more naturally.

---

## 9.6 Approach 5 — Caching

The fifth approach operates across inference calls rather than within them. Caching is the architectural decision to store the results of expensive retrievals, tool calls, and even portions of context itself, so that they can be reused in subsequent inferences without re-fetching or re-computing.

This is the approach most commonly misunderstood as purely a performance optimization. It is a performance optimization. It is also, simultaneously, a correctness hazard — and managing the hazard well is the craft.

**Mechanism.** A caching layer sits between the agent and its sources of external information: retrieval indexes, tool APIs, external databases, even the language model's own prior inferences. Each cached entry has two fields beyond its content: a *key* (what was requested) and a *freshness signal* (when was it fetched, when does it expire, what invalidates it). On subsequent requests, if a cache entry matches the key and its freshness signal indicates validity, the cached content is returned. If the signal indicates staleness, the cache refuses and forces a fresh fetch.

The critical property is the freshness signal, and getting it right is the hard part. Different classes of information have radically different validity horizons. A cached result of "what is Python's syntax for list comprehensions" can persist for months — that fact is effectively immutable. A cached result of "what is this company's current refund policy" might be valid for hours or days — it changes when someone updates a document. A cached result of "what is the current price of this product" is valid for seconds at most — it can change at any moment. A caching layer that applies a uniform TTL to all of these is a layer that is wrong in different directions for different queries: too fresh for syntax (wasting fetches), too stale for prices (producing errors).

The design philosophy is that caching without invalidation policy is just *delayed wrongness*. The work of a good cache is not in the hit rate — it is in the *invalidation rules that match the actual volatility of each information class*. This is a design question that cannot be outsourced to a library. It requires the architect to know, for each source of information in the system, how fast the underlying ground truth changes, and to encode that knowledge into the cache's validity rules.

**Worked example — the pricing agent.** Consider an agent that helps sales representatives prepare quotes. It has access to product catalog data (updated quarterly), pricing data (updated daily, but can be overridden hourly for promotions), inventory data (updated in real time), and a company policy document for volume discount rules (updated monthly, but with rare exceptions).

A single-TTL cache — say, one hour — would be wrong in four different ways for these four classes. Product catalog lookups would be re-fetched needlessly dozens of times a day. Pricing data would be correct within the hour, but would miss promotional overrides. Inventory data would be stale up to an hour — which, for a sales tool, is long enough to quote a product that sold out forty minutes ago. Policy document lookups would cache correctly but would miss the rare exception day.

A tiered cache: product catalog entries cached with a 24-hour TTL with invalidation on catalog-publish events; pricing cached with a 10-minute TTL with invalidation on promotion-activation events; inventory data not cached at all; policy document cached with a 24-hour TTL with invalidation on policy-publish events. Each class of information gets a TTL matching its volatility, and each class gets an invalidation hook on the events that actually change its ground truth. The cache hit rate is high where it should be; the cache is aggressively invalidated where correctness demands freshness.

**Which failure modes this addresses.** Caching's relationship with failure modes is the most nuanced of the five approaches, because — uniquely — caching is *both* a mitigation and a potential cause depending on implementation. *With a correct invalidation policy*, caching addresses **Rot** directly: freshness signals and expiration policies are exactly the mechanism by which an agentic system detects and refuses to use outdated information. Caching also indirectly addresses **Distraction**, by making it cheaper to re-fetch small specific pieces of information on demand rather than keeping large reference documents in context permanently.

*Without* a correct invalidation policy, caching *causes* Rot — it is the FreightCo pattern, the pricing-policy-on-day-thirty pattern, the confident-but-wrong-about-reality pattern. This is why caching belongs in the mitigation set, but it only belongs there conditionally: on the condition that its invalidation policy is designed with the same care as the cache itself. A cache without invalidation rules is not a mitigation for anything; it is a liability.

**Common misconception.** "Caching is a performance optimization that can be added later." In a long-running agentic system, caching is a *correctness* concern, not a performance concern, and adding it later — after the system is already running — is when the invalidation rules are most likely to be wrong. The correct time to design the invalidation policy is at the point where each information source is first integrated into the system, when the integrator is most aware of that source's volatility. Adding caching later means someone has to reconstruct that volatility model after the fact, often by someone less familiar with the source than the original integrator.

---

## 9.7 The matrix

The payoff of the pairing between this chapter and Chapter 9 is the explicit matrix: which approach addresses which failure mode. The table below makes the mapping concrete. Primary means the approach is the main architectural intervention for that failure; partial means it helps but is not sufficient alone; none means it does not address this failure at all.

<!-- TABLE: Use Datawrapper embed instead -->

*Description of the matrix: Five columns (Poisoning, Distraction, Confusion, Clash, Rot) and five rows (Offloading, Isolation, Retrieval, Compaction, Caching).*

- **Offloading** addresses Distraction (primary) and Rot (partial — makes staleness visible at reload time). No effect on Poisoning, Confusion, or Clash directly.
- **Isolation** addresses Clash (primary) and Poisoning (partial — scopes blast radius). Partial effect on Confusion (scopes where contradictions can arise). No direct effect on Distraction or Rot.
- **Retrieval** addresses Poisoning (primary, via structural provenance separation) and Confusion (primary, via conflict detection). Partial effect on Rot (freshness timestamps enable downstream checks). No direct effect on Distraction or Clash.
- **Compaction** addresses Distraction (primary). No direct effect on the others.
- **Caching** addresses Rot (primary, *conditional on correct invalidation policy*). Partial effect on Distraction. If invalidation is wrong, caching causes Rot.

Reading the matrix tells you several things that matter.

First: **no single approach covers all five failure modes**. Any deployed system that relies on one approach — "we have good retrieval" or "we have isolation" — is structurally vulnerable to the failure modes that approach does not address. A production system needs all five, composed.

Second: **two failure modes have redundant coverage** and two have narrower coverage. Distraction is addressed by Offloading, Compaction, and (partially) Caching — there are multiple levers. Poisoning is addressed primarily by Retrieval and partially by Isolation. Clash has essentially one primary lever: Isolation. Rot has essentially one primary lever: Caching (with invalidation). The implication: if your diagnostic from Chapter 9 points at Clash or Rot, your architectural options are narrower than for Distraction, and the corresponding approach needs to be implemented well rather than substituted for something easier.

Third: **Confusion has no single-approach primary solution**. Retrieval's conflict-detection handles confusion at the point of entry, but Confusion that arises later — from multi-agent outputs combined in an orchestrator, or from the accumulation of legitimate-but-versioned information over time — requires composition. This is worth flagging: Confusion is the failure mode most likely to survive a single-approach mitigation and re-emerge somewhere else in the pipeline.

**Worked example — a composed architecture.** A production customer-service agent handling multi-turn interactions, with retrieval, tool use, and session-level memory. What does a fully composed context management architecture look like?

- *Offloading* — session-level memory is written to an external store, not carried in every turn's context. The agent reads back memory selectively when the current turn references prior session state.
- *Isolation* — any turn that requires external action (processing a refund, issuing a shipment redirect) spawns a sub-agent with a scoped instruction set and a structured-output contract. The main conversational agent receives only the structured result, not the sub-agent's internal reasoning.
- *Retrieval* — policy documents are retrieved via a provenance-tagged pipeline. Retrieved documents enter the context in a dedicated region with source and version metadata. Conflicts between policy documents are detected at retrieval time and surfaced to an adjudication layer rather than injected silently.
- *Compaction* — after every ten turns, the accumulated conversation is compacted into a structured summary (customer state, open issues, commitments made, constraints acknowledged). The original session system prompt and the current conversational turn remain at full fidelity; the intermediate turns are compressed.
- *Caching* — tool results are cached with TTLs matched to their volatility: policy documents 24 hours, account status 1 hour, shipment tracking real-time with no caching. Promotional overrides invalidate pricing cache entries on publication.

Each approach handles its own failure modes; together, they handle the complete five-failure surface. Remove any one, and the corresponding failure mode re-emerges. Remove Offloading and memory bloat causes Distraction. Remove Isolation and refund-action instructions collide with conversational instructions (Clash). Remove retrieval provenance separation and policy lookups become Poisoning vectors. Remove Compaction and long conversations lose early constraints to attention dilution. Remove Caching-with-invalidation and the agent quotes policies that were revised last week (Rot).

This is what it means to say that context management is an architectural discipline. It is not a single choice. It is a composed set of choices, each operating at a different layer, each matched to the failure mode it actually addresses.

---

## 9.8 Exercises

For each exercise, the learning objective it tests is noted in parentheses, along with an approximate difficulty. Solutions are not included inline — work them through, check your reasoning against the chapter's definitions, and flag any you're uncertain about for discussion.

### Warm-up

**Exercise 1.** *(Objective 1, Easy.)* For each of the five failure modes in Chapter 9 (Poisoning, Distraction, Confusion, Clash, Rot), name the *primary* approach from this chapter that addresses it. Then name the approach that *partially* addresses it, if any.

**Exercise 2.** *(Objective 1, Easy.)* For each of the following architectural components, identify which of the five approaches it is an instance of: (a) a filesystem-backed scratchpad the agent writes intermediate notes to; (b) a separate sub-agent that handles all web browsing and returns only structured results; (c) a rolling summary of prior turns that replaces verbose intermediate outputs; (d) a retrieval pipeline that tags each document with source metadata; (e) a memoized API client that refuses to return results older than 30 seconds for pricing queries.

**Exercise 3.** *(Objective 2, Easy.)* A deployed agent is exhibiting drift on long tasks — it begins correctly and by turn fifty has abandoned constraints stated at turn one. The engineering team's proposed fix is to add stronger natural-language reminders to the system prompt ("remember: always respect constraint X"). Identify the failure mode, identify why the proposed fix is structurally mismatched to it, and name the two approaches from this chapter that would actually address the mechanism.

### Application

**Exercise 4.** *(Objective 3, Medium.)* Reconsider the FreightCo scenario from Chapter 9. Redesign the retrieval pipeline using Approach 3 such that the injection attack described fails. Specify: where provenance metadata is assigned, what fields it contains, how the context assembly pipeline uses it, and what specifically about your redesign prevents the attack from succeeding.

**Exercise 5.** *(Objective 4, Medium.)* You observe an agent making confident, coherent decisions that reference pricing policies revised three weeks ago. The agent's logs show no inconsistency — every decision is internally well-reasoned. The team proposes adding a conflict-detection layer (Approach 3, Confusion mitigation). Argue whether this is the right diagnosis. If not, specify which approach addresses the actual failure and what specifically changes in the architecture.

**Exercise 6.** *(Objective 3, Medium.)* Design a caching invalidation policy for the following four information classes in an agent serving an airline customer-service workflow: (a) flight schedules (published weekly, revised daily during disruption events), (b) current flight status (changes continuously), (c) baggage policy document (updated roughly quarterly), (d) customer's account status including recent bookings (changes whenever the customer interacts). For each, specify a TTL, the invalidation events that should purge cache entries, and justify your choices with reference to the volatility of the underlying ground truth.

**Exercise 7.** *(Objective 5, Medium.)* A team is migrating a single-agent customer-service system to an isolated multi-agent architecture (Approach 2). They propose that each tool call in the original system becomes a sub-agent invocation in the new architecture. Identify two *new* failure modes this migration introduces at the orchestrator layer, and specify which additional approaches must be composed at the orchestrator to prevent them.

### Synthesis

**Exercise 8.** *(Objective 3, Hard.)* Design a complete context-management architecture for an agent with the following specification: a research assistant that runs over multi-day sessions; reads and synthesizes documents from web search, internal document stores, and user uploads; maintains persistent memory across sessions; executes tool actions including sending emails and creating calendar events on the user's behalf. Specify how each of the five approaches is instantiated in your design, and which failure modes from Chapter 9 each instantiation addresses. Flag any failure modes your design does not fully cover and explain why.

**Exercise 9.** *(Objective 4, Hard.)* Given only the behavioral description — "an agent that resolves contradictions between retrieved documents by silently preferring whichever document appears later in its context" — determine whether the underlying failure is Confusion or Rot, and justify your diagnosis. Then specify what evidence from the agent's logs would shift your diagnosis to the other failure mode. (Hint: the two failures can produce identical-looking symptoms in short logs but diverge in long ones.)

**Exercise 10.** *(Objective 5, Hard.)* Consider the claim: "Isolation (Approach 2) introduces an orchestrator-layer failure mode not covered by the five failure modes in Chapter 9." Either defend the claim by naming a specific failure mode of the orchestrator that does not reduce to one of the five, or refute it by showing that all orchestrator-layer failures map onto the original five. Your answer should be architecturally specific — not a philosophical argument, but a trace of a concrete failure chain from orchestration mechanism to observed symptom.

### Challenge

**Exercise 11.** *(Objective 3+5, Challenge.)* Design a context-management architecture for an agent operating in an environment where the ground truth changes faster than any TTL-based cache can reliably track — for example, a trading system where prices move in milliseconds, or an incident-response agent in a rapidly evolving security breach. Which of the five approaches fail in this regime? What architectural primitives would you need to add that are not provided by the five approaches alone? Argue whether such an agent is within the reach of the context-management discipline described in this chapter, or whether it requires a fundamentally different architectural paradigm.

**Exercise 12.** *(Objective 5, Challenge.)* Chapter 9 claims the five failure modes are mechanistically exhaustive at the context-assembly layer. This chapter claims the five approaches, composed, address them. Identify a real or plausible agentic failure that you believe is *not* cleanly addressed by any composition of the five approaches. Specify the failure mechanism and argue why it escapes the framework. If your example succeeds, what does it suggest about the limits of context-management as a discipline? If your example fails — if the framework does cover it — articulate the decomposition.

---

## 9.9 Chapter summary

By the end of this chapter, you should be able to do the following that you could not do at the start.

You can *name the mechanism* each of the five approaches intervenes at. Offloading intervenes on state that has not yet entered context. Isolation intervenes on the scope of the context window itself. Retrieval intervenes on what enters context at inference time and how it is marked. Compaction intervenes on what remains in context over long tasks. Caching intervenes across inference calls. Five different layers, five different levers.

You can *map failure modes to approaches*. Distraction is primarily addressed by Offloading and Compaction. Poisoning is primarily addressed by Retrieval (structural provenance) and partially by Isolation (scope limiting). Confusion is primarily addressed by Retrieval (conflict detection) and requires composition to handle residual cases. Clash is primarily addressed by Isolation. Rot is primarily addressed by Caching — conditional on invalidation policy being correct.

You can *compose approaches* into a production architecture and articulate what each composition element addresses. A fully protected agent uses all five; removing any one leaves a failure mode uncovered.

The one idea from this chapter that matters most: **mitigation must match mechanism**. The wrong mitigation does not just fail to fix the problem — it produces a successful build, a closed ticket, and a false sense that the problem is addressed, while the actual failure continues to accumulate cost. Chapter 9 gave you the diagnostic; this chapter gives you the interventions; pairing them correctly is the discipline.

The common mistake to watch for: **reaching for the most familiar approach rather than the matching one**. Teams with strong retrieval infrastructure tend to see every context problem as a retrieval problem. Teams comfortable with multi-agent architectures tend to see every problem as an isolation problem. The matrix is your corrective — trace the failure to its mechanism first, then pick the approach.

The Feynman test for this chapter: can you teach someone else, in plain language, the difference between Offloading and Compaction? Both address Distraction. Both reduce context length. A clean answer names the temporal distinction — Offloading prevents context bloat from happening; Compaction manages the bloat that was unavoidable. A muddled answer says "they both make context shorter," which is true but operationally useless.

If you can articulate the offloading/compaction distinction, you can articulate any of the others. The chapter is structured around mechanism, and mechanism is what teaching requires.

---

## 9.10 Connections forward

The architectural discipline developed in this chapter is a prerequisite for most of what follows in the book.

Chapter 18, on agentic security, extends the Poisoning argument into a full attack-surface analysis. Context poisoning is one class of Agent Goal Hijacking; the structural separation argument in Approach 3 of this chapter is one component of a broader defense called the Deterministic Control Plane, which adds pre-execution action validation and sandboxed tool execution. The mitigations in this chapter prevent the attack from entering reasoning; the mitigations in Chapter 18 prevent reasoning errors from becoming consequential actions.

Chapter 33, the twelve-builds capstone, depends directly on several approaches covered here. Build 4 implements Compaction in code — the rolling-summary pattern described in Section 9.5, with preservation rules for stable anchors. Build 7 implements a provenance-separated retrieval pipeline. Build 9 implements a multi-agent orchestrator with isolated sub-agent contexts. Reading ahead to the builds after finishing this chapter will close the loop between architectural discipline and executable code.

The larger arc: if Chapter 9 made the case that context is the attack surface, this chapter makes the case that context management is the engineering discipline. Every subsequent chapter on deployment, reliability, security, and scaling builds on the assumption that you have internalized the diagnostic-intervention pairing. Agents fail in their contexts; contexts fail because of how they were assembled; assembly is architectural work that must be designed before the model is prompted, not patched after the model misbehaves.

---

**What would change my mind:** A production deployment where a single approach — just isolation, or just retrieval with good provenance — provided durable protection against the full set of five failure modes for longer than six months at meaningful scale. The chapter's core composition claim rests on the assertion that the mechanisms are distinct enough that no single approach covers all five; a clean counter-example would either reveal that two of the failure modes are not actually distinct after all, or that one of the approaches is more general than the mechanism argument predicts.

**Still puzzling:** The boundary conditions of Compaction. A well-designed compaction pass is a principled transformation that preserves critical facts while compressing process. But "critical" is a function of what the agent will need to reason about *in the future*, and that future reasoning is exactly what the agent has not yet done. There is no clean rule for what to preserve beyond "everything a future step might need" — which reduces, in the limit, to preserving nothing at all. The discipline of compaction is an art at that boundary, and I don't have a sharp principle for when compaction passes have preserved enough versus when they've over-compressed. The empirical answer is: you discover which case you're in only when the downstream failure occurs.

---

**Tags:** context-management-approaches, offloading-isolation-retrieval-compaction-caching, provenance-separation, attention-allocation, cache-invalidation-policy, composition-of-mitigations

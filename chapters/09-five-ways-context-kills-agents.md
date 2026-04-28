# Chapter 9 — Five Ways Context Kills Agents

*Offloading, Isolation, Retrieval, Compaction, and Caching — architectural mitigations mapped to the failure modes they actually address*

**Author:** Junyi Zhang
**Editor:** Nik Bear Brown

---

A team noticed their agent drifting on long tasks. By turn fifty, it had abandoned constraints stated at turn one. The decisions the agent was making were confident and coherent — given what it could see, the reasoning was correct — but it could no longer see the original constraints. The team's proposed fix was to add stronger reminders to the system prompt. Tell the model *remember constraint X.* Tell it more emphatically. Tell it twice.

The fix did not help. It made things slightly worse.

The reason it did not help is the central lesson of this pair of chapters. The previous chapter named five mechanistically distinct failure modes — Poisoning, Distraction, Confusion, Clash, Rot — and argued that each requires a different intervention. The drift the team observed was Distraction: the constraint was no longer positionally salient in a context that had grown over fifty turns. Adding stronger reminders does not address attention allocation. It adds more tokens to a context that was already too long, pushing the original constraint further toward the middle of the context, where attention weights it least.

This chapter is the catalog of fixes that match. Five architectural approaches. Five different points in the context-assembly chain where you can intervene. Each addresses a specific subset of the failure modes. None of them addresses all five.

I want to say this plainly before any of the approaches: the five are not a preference list, ranked from "best" to "worst." They are mechanistically distinct interventions, each operating at a different layer. Offloading operates on state that has not yet entered the context window. Isolation operates on the scope of the context window itself. Retrieval operates on what enters the context at inference time. Compaction operates on what remains in the context over long tasks. Caching operates across inference calls. Different layers, different levers, different failures addressed.

A production system uses all five, composed. Picking the wrong one for the failure you are observing is the misdiagnosis cascade — the patch ships, the ticket closes, and the actual failure continues silently because the surface symptoms have shifted just enough to look fixed.

## Offloading

The first move available to you, chronologically and architecturally, is to keep state *out* of the context window in the first place.

Every piece of information your agent will ever need does not need to be present in every inference call. This sounds obvious when stated plainly. It is violated constantly in practice. A deployed agent accumulates tool-call results, intermediate reasoning, prior user turns, retrieved documents, task specifications, and memory fragments — and by default, most agentic frameworks concatenate all of this into the context window on every step. By turn thirty, the context contains dozens of items that had relevance to some earlier step and have none to the current one.

Offloading is the architectural decision to treat the context window as a scarce, working-memory resource — something like an L1 cache — and to move state that does not need to be continuously attended to into external stores. A filesystem, a structured database, a dedicated scratchpad, a key-value memory service. The agent writes to the store when state is produced and reads selectively when state is needed.

The design philosophy is that the model should have to *ask* for prior state rather than be forced to carry it. This trades a small inference overhead — occasional extra tool calls to read back state — for a major reduction in context length and a major improvement in attention allocation.

Imagine a long-horizon research agent compiling a literature review across forty papers. A naive architecture keeps every extracted claim in the context. By paper twenty, the context is sixty thousand tokens of accumulated extracts; the constraints from the original task specification have been positionally marginalized; the synthesis drifts away from the scope the user asked for. An offloaded architecture writes each paper's claims to a structured note file indexed by paper identifier. The context, at any moment, contains the task specification, the list of papers read so far (just identifiers), and the current paper being processed. When synthesis begins, the agent outlines themes and reads back relevant notes by identifier. Same model, same forty papers — but the agent now reasons over a context it can actually attend to.

Offloading primarily addresses Distraction. It also partially addresses Rot: the act of reloading is an opportunity to check a timestamp, verify a version, re-fetch from ground truth. State that sits in context forever has no reloading moment, so its staleness goes unnoticed. The discipline, though, is not *minimize context*. It is *context should contain exactly what must be continuously attended to, and nothing else.* That's a harder design question than it first appears. Offload the task specification by accident and you get an agent that correctly answers questions it was never asked.

## Isolation

If Offloading is about moving state out of a single context, Isolation is about partitioning the *contexts themselves.*

Isolation builds a multi-agent system in which each agent operates in its own scoped context window, communicating with other agents through structured, narrow interfaces rather than through shared context. An orchestrator holds the overall task state. Specialized sub-agents handle scoped subtasks and return results. The orchestrator's context contains the high-level plan and the structured results — not the sub-agents' internal reasoning traces.

The orchestration layer defines a fixed vocabulary of sub-agent invocations: *delegate web research, delegate code review, delegate data extraction.* Each invocation spawns a sub-agent with a fresh context containing only what's needed for that subtask. When the sub-agent completes, it returns a structured result. The sub-agent's context is then discarded. The orchestrator's context grows by one small structured object, not by the thousands of tokens the sub-agent consumed to produce it.

The design philosophy is that the attack surface, the attention surface, and the instruction surface should all be scoped as narrowly as the task permits. A sub-agent handling web browsing does not need access to the user's payment-processing instructions. A sub-agent extracting data from a document does not need the system-level refund policy. Isolating contexts means failure modes in one context do not propagate to others.

Isolation primarily addresses Clash. By scoping the instruction set each agent sees, you reduce the surface area on which conflicting directives can collide. It also partially addresses Poisoning: injected content in a sub-agent's context stays in the sub-agent's context, and if the sub-agent returns a structured object validated against a schema, the poisoning has to fit in the structured fields — which gives the orchestrator a chokepoint for detection.

I want to flag a misconception that costs people real time. *Isolation means independence.* It does not. The orchestrator still holds a context, and that context is still subject to all five failure modes. Isolation does not eliminate failures; it scopes them. The orchestrator's context now contains a growing history of delegation results, and those results may contain contradictions or become stale. A naive isolation implementation that leaves the orchestrator's context unmanaged simply moves the failure up one layer.

## Retrieval

The third approach operates at the point where external content actually enters the context window. Retrieval — done well — determines which external documents are injected at inference time and *how they are marked* once inside.

I'll say this plainly: retrieval is simultaneously the cause of Poisoning and, done differently, its primary mitigation. The difference is not whether you retrieve — any agent that needs external information has to — but how retrieval is structured and how retrieved content is marked inside the context.

A well-architected retrieval pipeline has three properties. *Structural provenance separation:* retrieved content enters the context in a consistently formatted, structurally distinct region, distinguishable from system instructions and user input. Not a natural-language marker — a structural one, with formatting conventions the model has been trained or prompted to treat differently. *Source versioning and timestamping:* each retrieved document carries metadata indicating where it came from, when it was retrieved, and what version it represents. *Conflict detection prior to injection:* when retrieval fetches multiple documents containing contradictory claims, the conflict surfaces at retrieval time — resolved by a priority policy or flagged for human adjudication — rather than passed into the context as an unflagged contradiction.

The design philosophy is that the retrieval layer is not merely a fetcher; it is a gatekeeper. What it lets into the context, and how it marks what it lets in, determines whether the model can reason correctly about what it is reading. A retrieval layer that dumps documents into the context unmarked has delegated all adjudication to model inference, which has no mechanism to adjudicate provenance — provenance is not in the document text; it is metadata that the layer above must attach.

Consider the difference between two retrieval setups handling the same poisoning attempt. A naive setup concatenates retrieved documents under a soft header like *Relevant policies:* — a natural-language marker the model weights as just another instruction. The injection succeeds because the injected "policy update" looks indistinguishable from real policies. A provenance-separated setup tags each document with structured metadata — source, document ID, version, timestamp, authority level — and injects it into a dedicated region with consistent formatting. The injection content still gets retrieved, because semantically it matches the query. But it enters the context with a tag reflecting its actual origin (user-submitted ticket, not operator policy), and the model's behavior is conditioned on that tag. This isn't a perfect defense. It transforms the problem from *any adversary who can write text into the database can issue instructions* to *an adversary must also compromise the provenance pipeline*, which is much narrower.

Retrieval primarily addresses Poisoning and Confusion. It partially addresses Rot, because freshness timestamps give downstream components the signal they need to detect staleness. The misconception worth killing here: *better retrieval means retrieving more.* The opposite, usually. Better retrieval is better scoping and better provenance, not more tokens.

## Compaction

The fourth approach operates on context that is already inside the window and must remain there, but whose length has grown to the point where attention allocation is degrading.

Compaction periodically summarizes, compresses, or restructures the accumulated context during a long-running task — while preserving the elements that must retain positional salience. The original task specification. Hard constraints. Anchors the agent must continue to attend to.

A compaction pass triggers on a schedule (every N turns) or a threshold (when context length exceeds some fraction of the window). It separates the context into stable components — the things that were always meant to be present — and accumulated components — tool-call results, intermediate reasoning, prior turns. It produces a compressed representation of the accumulated components. The stable components are re-injected in their original positions, specifically in the positionally salient regions of the context.

The design philosophy is that context will fill — this is a given. What you can control is what fills it. Left alone, context fills with verbose intermediate byproducts that were useful at the moment they were generated and have negligible utility now. Compaction replaces them with structured distillate, freeing positional budget for content that genuinely needs to be present.

There's a craft element here. A poorly designed compaction pass summarizes the wrong things, compressing critical task details into vague prose while preserving verbose tool outputs. A well-designed pass preserves the *specific facts and decisions* future steps will need, in a form that remains queryable, while compressing the *process* by which those facts were arrived at. The question to ask at each compaction: what would the agent, three steps from now, need to know about what already happened in order to make its next decision correctly? Preserve that. Compress the rest.

Imagine a coding agent refactoring a codebase across ninety turns. Without compaction, by turn ninety the context contains every file read, every diff produced (including rejected ones), the full reasoning of every decision. The original *do not change the public API of module X* constraint is buried under eighty turns of activity and positionally marginalized. The agent on turn ninety-one modifies X's public API — not because the constraint was overridden, but because it was attention-weighting irrelevant. With compaction at turn thirty, sixty, and ninety, the original specification stays at the top of the context in its original form; the eighty thousand tokens of intermediate activity get compressed into a structured summary that preserves which constraints are still active.

Compaction primarily addresses Distraction. Where Offloading prevents context bloat from happening, Compaction handles the bloat that was unavoidable and must be managed in place. The two are complementary, not redundant.

## Caching

The fifth approach operates across inference calls rather than within them. Caching stores the results of expensive retrievals, tool calls, and even portions of context itself, so they can be reused in subsequent inferences without re-fetching or re-computing.

This is the approach most commonly misunderstood as purely a performance optimization. It is a performance optimization. It is also, simultaneously, a correctness hazard — and managing the hazard is the craft.

A caching layer sits between the agent and its sources of external information. Each cached entry has two fields beyond its content: a *key* (what was requested) and a *freshness signal* (when was it fetched, when does it expire, what invalidates it). On subsequent requests, if a cache entry matches the key and its freshness signal indicates validity, the cached content is returned. If the signal indicates staleness, the cache refuses and forces a fresh fetch.

The critical property is the freshness signal, and getting it right is the hard part. Different classes of information have radically different validity horizons. A cached result of *what is Python's syntax for list comprehensions* can persist for months — that fact is effectively immutable. A cached result of *what is this company's current refund policy* might be valid for hours or days. A cached result of *what is the current price of this product* is valid for seconds at most. A caching layer that applies a uniform TTL to all of these is wrong in different directions for different queries.

The design philosophy is that caching without invalidation policy is just delayed wrongness. The work of a good cache is not in the hit rate. It is in the invalidation rules that match the actual volatility of each information class. This is a design question that cannot be outsourced to a library — it requires the architect to know, for each source of information in the system, how fast the underlying ground truth changes, and to encode that knowledge into the cache's validity rules.

Imagine an agent helping prepare sales quotes. It needs product catalog data (updated quarterly), pricing (updated daily, overridden hourly for promotions), inventory (changes continuously), and a volume-discount policy document (updated monthly). A single one-hour TTL is wrong four different ways: refetching catalog data needlessly, missing promotional overrides on pricing, holding stale inventory long enough to quote a product that sold out forty minutes ago, and missing rare exception days on policy. A tiered cache — twenty-four hours for catalog with publish-event invalidation, ten minutes for pricing with promotion-event invalidation, no caching at all for inventory, twenty-four hours for policy with publish-event invalidation — gives each class a TTL matching its volatility.

Caching's relationship with failure modes is the most nuanced of the five. *With* a correct invalidation policy, caching addresses Rot directly. *Without* a correct invalidation policy, caching causes Rot. This is why caching belongs in the mitigation set conditionally: only on the condition that its invalidation policy is designed with the same care as the cache itself.

The misconception worth killing here is the comforting one: *caching is a performance optimization that can be added later.* In a long-running agentic system, caching is a correctness concern, and adding it later is when invalidation rules are most likely to be wrong. The right time to design the invalidation policy is at the point where each information source is first integrated into the system, when the integrator is most aware of that source's volatility.

## The matrix and the composed architecture

The pairing between this chapter and the previous one yields an explicit matrix: which approach addresses which failure mode. I'll give it in prose, because the table form invites memorization at the expense of mechanism.

Distraction has the most levers. Offloading prevents context bloat from happening; Compaction handles the bloat that's unavoidable; Caching helps marginally by making it cheaper to re-fetch small pieces on demand. If your diagnosis points at Distraction, you have multiple architectural options.

Poisoning has Retrieval (with structural provenance separation) as primary and Isolation as partial. Two levers, but the heavier one is Retrieval — Isolation scopes the blast radius without preventing the entry.

Clash has essentially one primary lever: Isolation. If your diagnosis points at conflicting instructions, scoping each agent's instruction set is the architectural response. There's no substitute.

Rot has essentially one primary lever: Caching, conditional on invalidation policy. Offloading helps partially by making staleness visible at reload, and Retrieval helps partially through freshness timestamps — but the durable fix is caching that knows when to invalidate.

Confusion is the slippery one. Retrieval handles it at the point of entry through conflict detection. But Confusion that arises later — from multi-agent outputs combined in an orchestrator, or from accumulated legitimate-but-versioned information over time — requires composition. This is the failure mode most likely to survive a single-approach mitigation and re-emerge somewhere else in the pipeline.

Two things follow from the matrix that matter operationally. First, no single approach covers all five. Any deployed system relying on one approach — *we have good retrieval* or *we have isolation* — is structurally vulnerable to the failures that approach does not address. A production system needs all five, composed. Second, two failure modes have narrow coverage: Clash and Rot have one primary lever each. If your diagnosis points there, your architectural options are narrower, and the matching approach has to be implemented well rather than substituted for something easier.

A composed architecture for a production customer-service agent looks like this. Session-level memory is offloaded to an external store, read back selectively (Offloading, addressing Distraction). Any turn requiring external action — refunds, shipment redirects — spawns a sub-agent with a scoped instruction set and a structured-output contract (Isolation, addressing Clash). Policy documents are retrieved through a provenance-tagged pipeline; conflicts surface to an adjudication layer (Retrieval, addressing Poisoning and Confusion). After every ten turns, the conversation compacts into a structured summary, with the system prompt re-anchored in its original position (Compaction, addressing Distraction). Tool results cache with TTLs matched to their volatility — policy 24 hours, account status 1 hour, shipment tracking real-time with no caching, with promotional overrides invalidating pricing entries on publication (Caching with invalidation, addressing Rot).

Each approach handles its failures. Together they handle the whole surface. Remove any one and the corresponding failure re-emerges. Remove Offloading and memory bloat causes Distraction. Remove Isolation and refund-action instructions collide with conversational instructions. Remove retrieval provenance separation and policy lookups become Poisoning vectors. Remove Compaction and long conversations lose early constraints. Remove Caching-with-invalidation and the agent quotes policies revised last week.

This is what it means to say context management is an architectural discipline. It is not a single choice. It is a composed set of choices, each operating at a different layer, each matched to the failure it actually addresses.

I want to end with a seam I haven't resolved. A well-designed compaction pass preserves *critical* facts while compressing process. But "critical" is a function of what the agent will need to reason about *in the future*, and that future reasoning is exactly what the agent has not yet done. There is no clean rule for what to preserve beyond *everything a future step might need* — which reduces, in the limit, to preserving everything, which defeats the purpose. The discipline of compaction is an art at that boundary, and I do not have a sharp principle for when a compaction pass has preserved enough versus when it has over-compressed. The empirical answer is: you discover which case you're in only when the downstream failure occurs. If the rest of the framework is doing its job, this is the place where the next several years of practice will sharpen the rules.

Mitigation must match mechanism. The wrong mitigation does not just fail to fix the problem — it produces a successful build, a closed ticket, and a false sense that the problem is addressed, while the actual failure continues to accumulate cost. The previous chapter gave you the diagnostic. This one gave you the interventions. Pairing them correctly is the discipline.

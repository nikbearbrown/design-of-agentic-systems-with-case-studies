# Chapter 13 — The Protocol Layer: MCP, ACP, and the Interoperability Standard

*(Part II — the lateral and inbound axes)*

I want to tell you about a team that solved one architectural problem cleanly and rebuilt it one layer up, by accident, in roughly the time it took to ship the second version of their product.

The scenario is composite, drawn from patterns I've seen across several deployments. The company isn't real; the failure mode is, and it's distributed widely enough that the names don't matter.

The system was a customer service product built from three specialized agents. A routing agent that read each inbound ticket and decided who should handle it. A billing agent with CRM access and refund authority. A technical support agent with knowledge-base search and diagnostic tools. Three agents, three specialists, textbook multi-agent architecture.

Each agent had been built independently. The routing agent was a custom function-calling loop. The billing and tech support agents had been built on different orchestration frameworks, because nobody had wanted to fight about which framework should win. When the team adopted MCP — the protocol the previous chapter was about, the one that collapses the agent-to-tool integration graph from N×M down to N+M — the tool layer collapsed exactly as predicted. The CRM, the knowledge base, the ticketing system: each got a single MCP server, each agent could reach any of them, and tool changes stopped cascading through the codebase. The protocol delivered.

What did not collapse was the coupling between the agents.

When the routing agent classified a ticket as *"billing, with a technical component,"* it had to hand off to the billing agent. The handoff was bespoke glue: a JSON envelope the billing agent understood, with fields the routing agent had to populate, with a state-transfer protocol that one engineer had designed and documented in a Confluence page that hadn't been updated since. When the billing agent needed technical information, it had to call the technical support agent — through *a different* bespoke envelope, because the two specialists were built on different frameworks and their message conventions didn't match.

Three agents. Six directed pairwise relationships, four of them in active use, each with its own wiring. When a fourth specialist was proposed — a refund-authorization agent with stricter approval rules — the team faced four new pairwise integrations on top of the tool-layer work.

The N×M problem had returned. Not at the tool layer. At the coordination layer. The engineer who had designed the original handoff envelopes had left six months earlier. Nobody currently on the team could say, with confidence, what happened if a handoff envelope was malformed. When the system failed — and it did, in ways that didn't show up in unit tests — the failures clustered exactly at the seams between agents.

I want you to sit with that for a moment, because the lesson is not what teams usually take from this kind of incident. The lesson isn't that the team picked the wrong frameworks, or that they should have been more disciplined, or that bespoke glue is bad. The lesson is that *the same architectural pressure exists at three different axes of coupling in an agent system*, and adopting a protocol on one axis tells you almost nothing about whether the others are still glued together by hand.

## 13-1 The same shape, rotated three ways

There are three axes of coupling in an agentic system, and the geometry on each is the same.

Agents talk to *tools*. Agents talk to *other agents*. Users — and non-agent client systems — talk to *agents*. Each is a many-to-many relationship that, without a protocol, gets wired up pair by pair. Each becomes painful at a different rate, depending on which dimension of your system grows fastest.

MCP is the protocol for the first axis. The N×M graph between agents and tools collapses to N+M when both sides agree on a common envelope, and the practical result is that tool changes stop cascading through agent code.

The Agent Communication Protocol — ACP — is the same architectural move applied between agents. The lateral axis. A standard for how agents exchange messages, hand off tasks, share state, and propagate failures, applied regardless of which framework built each agent.

The Agent Protocol — that's the generic term — is the same move applied to the inbound axis. A standard for how a client (a UI, an API consumer, another system) initiates a session with an agent, streams output, submits mid-session input, cancels, and authenticates.

The three protocols are not competitors. They address distinct axes of coupling. A team that adopts MCP has solved one third of the integration problem. A team running into pain on agent-to-agent handoffs needs ACP, not a better MCP. A team whose biggest friction is "every client implements streaming differently for the same agent service" needs Agent Protocol, not better tools.

The order in which a team should adopt these protocols depends entirely on which axis is binding. A single agent with twelve tools and one client type adopts MCP and stops. A multi-team multi-framework system whose handoff glue is rotting adopts ACP first — and fights for it politically, because ACP requires cross-team alignment that MCP doesn't. A system serving five client types uniformly adopts Agent Protocol first.

This sounds obvious when stated cleanly. It is not what most teams do. What most teams do is adopt MCP, breathe a sigh of relief, and assume the architectural problem is solved.

## 13-2 What a coordination protocol can decide, and what it cannot

I want to look at ACP carefully, because this is where the protocol's *limits* become philosophically interesting.

When you start designing a protocol for inter-agent communication, the temptation is to copy the parts of REST or gRPC that worked. Define message envelopes. Specify status codes. Standardize error taxonomies. Versioning rules. These are necessary. They are not sufficient — and the gap between necessary and sufficient is exactly where multi-agent systems quietly fail.

There are five decisions a coordination protocol must surface. Watch which of them the protocol can actually decide for you, and which it has to leave to the agents.

*First.* When agent A involves agent B, is A *transferring* responsibility — *"here is the ticket, you own it now"* — or *consulting* B while keeping ownership — *"I'm asking you a question, I'll decide what to do with your answer"*? These are different interaction patterns with different state implications. The protocol can standardize a flag — `mode: handoff` versus `mode: consult` — that distinguishes them. The protocol cannot decide which is appropriate for any given interaction. That's a workflow choice that belongs to the calling agent.

*Second.* How much of A's context does B need? There are three defensible defaults. Pass nothing beyond the specific request. Pass a structured context bundle with named fields. Pass the full conversation history. Each has failure modes. The first loses information B needs. The third is a security catastrophe, and once you've read about prompt injection, you should recognize why: every token A has seen becomes a token B attends to. *Any environmental injection in A's context is now also a potential injection into B*, carried cleanly across the protocol boundary. The protocol can define the shape of a context envelope. It cannot decide how much context is appropriate for any specific interaction. That's a per-workflow decision with real security consequences.

*Third.* A is authorized to perform action X. A delegates to B. Is B authorized to perform X on A's behalf? The naive answer — "yes, A's authorization propagates" — is a recipe for privilege escalation. A less-trusted agent becomes a confused deputy for a more-trusted one. The protocol can require that the delegated authority be *scoped* — "B may perform X for this specific task only" — and bounded in lifetime. The protocol cannot decide the policy. The decision of whether A's authority should reach B at all is an architectural choice.

*Fourth.* B fails. What should A do? Retry, fail, downgrade, escalate to a human? Each is correct for some workflow. The protocol can standardize the *shape* of a failure response — error code, error cause, retriable flag. It cannot decide the *response* to failure. That reasoning is agent-level logic.

*Fifth.* Cancellation. A started a task with B. Something changes. Can A cancel? Is B required to honor it? Does B receive the cancellation synchronously, or discover later that its result is unwanted? The protocol can standardize the cancellation envelope. It cannot decide whether cancellation is actually honored. That is an implementation property of each agent, and the protocol can only require that the *shape* of the interaction exist.

Now I want to point at something. Look at what the protocol *can* do — specify envelopes, error shapes, scoped tokens, cancellation flags — and what it *cannot* do — decide modes, decide context appropriateness, decide authorization policy, decide failure response. Call the first the **mechanical half** and the second the **semantic half**.

The mechanical half is what protocols deliver. The N×M-to-N+M collapse applies cleanly: once every framework speaks the same mechanical language, a new agent integrates without bespoke wiring.

The semantic half cannot be standardized, because it is the *workflow design*, not the wiring. But — and this is the move worth understanding — *the protocol makes the semantic half visible* by forcing agents to declare their choices in the envelope. The mode flag forces you to declare whether this is a handoff. The structured context bundle forces you to declare what you're sharing. The scoped auth token forces you to declare what authority you're delegating. These decisions, which were buried as conventions in handoff code, become explicit fields in the message.

That visibility is itself a substantial architectural improvement, even though it isn't the mechanical collapse the protocol was sold on. A coordination protocol that makes the semantic decisions *visible* — even though it can't make them *for* you — has earned its place.

## 13-3 The inbound axis has its own shape

The third axis is inbound — how a user or client system initiates a conversation with an agent — and it deserves its own protocol for reasons that aren't immediately obvious. At first glance, the inbound side looks like it should just be REST. Client makes a request, agent responds, done. Why a separate protocol?

Three properties make the inbound axis different.

Sessions are long-lived. A tool call is stateless: each call is self-contained, the tool returns a result, the call is done. An agent invocation is stateful. The user sends a message; the agent reasons for some seconds or minutes; it streams intermediate output; it may ask a clarifying question that requires a response before continuing; it eventually completes. The single-request-single-response shape doesn't fit this lifecycle.

Streaming is the default, not the exception. Users expect to see tokens appear as they are generated. This is a product expectation, not a technical preference — a non-streaming agent feels broken. REST handles streaming awkwardly, and every web-client framework handles it differently, which means each agent service ends up with a slightly different streaming implementation, which means every client that wants to talk to an agent has to learn that specific agent's streaming.

Cancellation is semantically rich. Canceling a REST call is straightforward — the client disconnects, the server abandons the work. Canceling an agent invocation is not. The agent may be mid-tool-call, mid-delegation, mid-reasoning with a partial plan. Does cancellation mean abort immediately and discard partial work? Or finish the current step and stop? Or finish the current tool call but start no new ones? Each is defensible. None is what closing an HTTP connection gives you.

A competent inbound protocol has to specify session lifecycle (creation, progress signaling, termination, optional resumption across disconnects), streaming model (typed events so a client UI can render reasoning differently from final output), interactive input mid-session (how a clarifying question is delivered and answered without starting a new session), cancellation semantics (and an honest declaration of what the server actually guarantees — *"cancellation is advisory, work may continue"* is a valid policy if it is *declared*), and authentication (how identity is conveyed and how it propagates downstream).

That last point is where the inbound protocol stops being a self-contained problem and starts touching the other two. The token the client supplies at session creation is the *root* of an authorization chain that flows through ACP and MCP as the agent does its work. Which brings us to the harder problem.

## 13-4 The protocols are orthogonal; the stack is not

I've been describing three protocols at three axes, each addressable by the same architectural move. The protocols are independent. They have separate specs, often developed by separate communities, with disjoint vocabularies. That orthogonality is a feature when you're adopting them one at a time. It becomes a liability when you're running all three in a single system, because *nothing in any of the three protocols describes the composition*.

Four composition concerns surface in production, and none of them is solved by any individual protocol.

**Context propagates.** A user invokes an agent via Agent Protocol with full context. The agent processes, delegates to a peer via ACP — which narrows context to a structured bundle — and the peer calls a tool via MCP, which narrows further to typed parameters. The narrowing is correct on the way down. On the way back up, summarization compounds: the tool returns a record, the peer reasons over it and summarizes, the primary summarizes further, the user gets the final response. *An error in the underlying data is now three layers of summarization away from the user by the time they see the answer.* No protocol specifies how much fidelity to preserve at each upward boundary.

**Authorization propagates, and naive propagation is a vulnerability.** Forwarding the user's full token end-to-end means every layer acts as the user. An injection at the peer agent now wields the user's full capability. A confused-deputy attack composes cleanly across the stack. The correct discipline is *exchange, not forward*: at each boundary, mint a new token narrower than the previous one, scoped to this specific task, with a shorter lifetime. Agent Protocol defines the root token. ACP defines the inter-agent envelope. MCP defines the tool-call auth. The *rule* that tokens must narrow as they descend lives in system design, not in any protocol — which is why many production systems silently propagate the user's full token end-to-end and discover the hole later.

**Failures compose, in two specific ways worth naming.** *Retry amplification:* the primary retries the peer, the peer retries the tool, the tool — not knowing this is a nested retry — honors it. A single user request becomes four, then eight, then sixteen underlying tool calls. This is the classic distributed-systems failure rotated into agent systems, and it appears for the same reason: each layer independently decides to be robust, and robustness composes badly. *Silent degradation:* each layer degrades gracefully. The tool returns partial data; the peer infers what it can; the primary wraps it in a plausible-sounding answer; the user sees a response that looks complete and is built on cascading partial failures. Each layer's logs say "degraded successfully." None of them say "the user got a wrong answer."

**Tracing must cross protocol boundaries to be useful**, and the three protocols evolved separately enough that none of them was designed with cross-protocol trace ID propagation in mind. The fix is straightforward — a single trace ID minted at the inbound layer, propagated through ACP envelope metadata and MCP invocation context — but the fix is a house rule, not a protocol property.

The synthesis is this: **interoperability is a composition property, not a protocol property.** A system can be fully MCP-compliant, fully ACP-compliant, fully Agent Protocol-compliant, and still fail every one of the four concerns above. The protocols give you the envelope at each axis. They do not give you the discipline of the composition.

The implication: adopting one protocol is a local decision with a clear payoff. Adopting all three, in a system where they compose, is an architectural commitment that requires discipline the protocols don't provide — cross-cutting authorization narrowing, cross-cutting tracing, cross-cutting retry budgets, cross-cutting fidelity rules for context. Each system has to establish these rules for itself. The three-layer stack is necessary; it isn't sufficient. What makes a stack actually interoperable is what you build on top.

## 13-5 What I haven't solved

I want to end where the argument has limits.

The four composition disciplines I just sketched — narrowing tokens at every descent, propagating trace IDs across protocol boundaries, structuring context bundles to limit injection surface, budgeting retries globally rather than per-layer — are each individually tractable. You can write them down. You can enforce them. There are existing reference implementations for each, in adjacent fields, that translate cleanly enough.

What I do not have is a clean framework for designing them *together*.

Narrow the context aggressively at ACP handoffs and you reduce the injection-propagation surface but lose fidelity that the downstream agent needs. Track every tool call with a trace ID and you gain observability but create a new channel that could itself be manipulated. Budget retries globally and you avoid amplification but lose the layer-local robustness each agent was designed to have. The disciplines interact, and the interactions aren't documented. Each design doc I've read on this material treats them individually.

The composition of compositions — the discipline of designing the disciplines together — is where I think the next architectural chapter of this work probably lives, and I don't yet know what it will say. If you build a system that handles all four disciplines together cleanly, and the trade-offs between them turn out to be more graceful than I'm afraid they will be, I'd like to hear about it. I'd like to be wrong about this one.

The protocols handle the wiring. The composition has to handle the rest. The interesting failures, the next eighteen months of production incidents, are going to live in the gap between the two — and the gap is not going to be closed by a better protocol. It's going to be closed, if at all, by teams that recognize the gap exists and treat the discipline as a first-class architectural artifact rather than a thing to figure out incident by incident.

The three protocols are necessary infrastructure. They are not the architecture. The architecture is what you build on top of them, and that's the work.

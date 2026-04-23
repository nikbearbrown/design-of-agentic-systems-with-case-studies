# Chapter 13 — The Protocol Layer: MCP, ACP, and the Interoperability Standard

*(Part II — the lateral and inbound axes)*

**Author:** [Student — TA to fill in]
**Editor:** Nik Bear Brown

---

## Suggested titles

1. **The Protocol Layer: MCP, ACP, and the Interoperability Standard**
2. **Three Axes of Coupling: Why One Protocol Was Never Going to Be Enough**
3. **Interoperability Is a Composition Property, Not a Protocol Choice**

---

## TL;DR

Chapter 12 showed how MCP collapses the agent-to-tool coupling graph from N×M to N+M. The same architectural pressure exists on two other axes — agent-to-agent communication (ACP) and user-to-agent invocation (Agent Protocol) — where the ecosystem is still reinventing bespoke glue, two or three years behind MCP's maturity curve. This chapter teaches the design space for the two later axes, then builds the property the three-layer stack actually needs: interoperability is not a feature of any single protocol but a discipline that keeps context, authorization, and failure semantics coherent across all three. The protocols are orthogonal. The stack is not. That gap is where the next round of production failures is going to live.

---

## 13.1 Three agents, nine handoffs, one engineer who left

A mid-sized software company — composite, grounded in patterns documented across several deployments — shipped a customer service system built from three specialized agents. A routing agent, which read each inbound ticket and decided which specialist should handle it. A billing agent, with CRM access and refund authority. A technical support agent, with knowledge-base search and diagnostic tools. Three agents, three specialists, textbook multi-agent architecture.

Each agent had been built independently. The routing agent was a custom harness on top of a function-calling loop. The billing agent was built on one popular orchestration framework; the technical support agent on a different one. When the system integrated MCP — Chapter 12's pattern, applied cleanly at the tool layer — the agent-to-tool coupling collapsed exactly as the architecture predicted. The CRM tool, the knowledge base, the ticketing system: each got a single MCP server, each agent could reach any of them, and tool changes stopped cascading through the codebase. Chapter 12 delivered its promise.

What did not collapse was the coupling between the agents.

When the routing agent classified a ticket as "billing, with a technical component," it had to hand off to the billing agent. The handoff was bespoke glue: a JSON envelope the billing agent understood, with fields the routing agent had to populate, with a state-transfer protocol that one engineer had designed in 2024 and documented in a Confluence page that had not been updated since. When the billing agent determined it needed technical information, it had to hand off (or, depending on the case, co-invoke) the tech support agent. That was a *different* bespoke envelope, with different field conventions, because the two specialist agents had been built on different frameworks and nobody had wanted to fight about which framework's messaging format should win.

Three agents. Six directed pairwise handoffs (A→B, B→A, A→C, C→A, B→C, C→B). In practice, four of the six were actually used, but all six had to be at least possible, and each of the four had its own wiring. The routing agent spoke to each of the other two in the language those agents preferred. When a fourth specialist was proposed — a refund-authorization agent, with stricter approval requirements — the team added it up four new pairwise relationships: one to and from each existing agent, plus the tool-layer work.

**The N×M problem had returned. Not at the tool layer. At the coordination layer.**

The engineer who had designed the original handoff envelopes had left six months earlier. Nobody currently on the team could say with confidence what happened if a handoff envelope was malformed. Nobody could say what the expected behavior was if agent B handed a task back to agent A with a partial result. When the system failed — and it did, in ways that didn't show up in unit tests — the failures clustered in exactly those intra-agent seams.

MCP had solved one problem cleanly. The team had cheerfully rebuilt the same problem one layer up.

### Learning objectives

By the end of this chapter, you will be able to:

- **Identify** the three axes of coupling in an agentic system (tool, peer-agent, user-agent) and recognize which protocol layer addresses each.
- **Design** the message, state, and handoff semantics for an agent-to-agent interface (ACP-style), naming the ambiguities a standard must resolve and the ambiguities no standard can resolve.
- **Specify** the inbound interface of an agent service (Agent Protocol-style), including session lifecycle, cancellation, streaming, and authentication surface.
- **Reason** about the composition of MCP, ACP, and Agent Protocol as a stack — specifically, how context, authorization, and failure semantics propagate across protocol boundaries, and where they fail to.
- **Diagnose** which of the three protocol axes is the binding constraint on a given production system, and justify the order in which they should be adopted.

### Prerequisites

Chapter 12 is mandatory; this chapter is written as its direct continuation, and the N×M → N+M argument, the wiring-vs-schema-vs-semantics decomposition, and the server-as-wall principle are all assumed. Chapter 2 (the six-layer architectural stack) and Chapter 11 (guarded orchestration) are strongly recommended — Chapter 11 in particular, because the coordination failures that motivate ACP are the coordination failures Chapter 11 was trying to *prevent* at the framework level, and this chapter addresses the protocol level beneath it.

### Where this chapter fits

Chapter 12 closed with a specific promissory note: the three-layer protocol stack covers three different axes of coupling, each reaching production pain at a different rate, and each addressable by the same architectural move. This chapter cashes the note on the two remaining axes, and then — because the chapters in this book tend to complicate their own arguments where it matters — it shows why the *composition* of the three protocols is a harder problem than any of the three alone.

---

## 13.2 ACP — the lateral axis

The coupling that the opening scenario exposed is lateral. Agents talk to other agents, and when they do, every pair needs an agreed-upon way to package the conversation. Three agents produced six directed pairs; four would produce twelve; five, twenty; the quadratic is the same quadratic Chapter 12 named, just rotated ninety degrees in the architectural diagram.

An **Agent Communication Protocol** (ACP) is the architectural response: a standard for how agents exchange messages, hand off tasks, share state, and propagate failures, applied *regardless* of which framework built each agent. `[verify current ACP spec and adoption state]` The same logic as MCP — factor the wiring into a standard, let each framework adopt the standard, collapse the integration graph — applied at the inter-agent boundary instead of the agent-tool boundary.

### What ACP must decide, and what no protocol can decide for it

The temptation when first designing an ACP-style protocol is to copy the successful parts of REST or gRPC. Define message envelopes, status codes, error taxonomies, versioning rules. These are necessary. They are not sufficient. Agent-to-agent communication carries a set of semantic questions that tool access does not, and the protocol layer must at least make them *visible* even when it cannot answer them.

Here are five decisions any ACP-style protocol must surface, with a note on which of them the protocol can standardize and which it must leave to the agents:

**1. Task handoff vs. collaboration.** When agent A involves agent B, is A *transferring* responsibility ("here is the ticket, you own it now") or *consulting* B while retaining ownership ("I'm asking you a question, I'll decide what to do with your answer")? These are different interaction patterns with different state implications. The protocol can standardize a *flag* that distinguishes the two modes. The protocol cannot decide which mode is appropriate for any given interaction — that's a semantic choice that belongs to the calling agent.

**2. Shared context.** How much of A's context does B need? There are three defensible defaults: (a) nothing beyond the specific request ("here is the one question, answer it"); (b) a structured context bundle ("here is the question, plus the customer ID and ticket summary I've already established"); (c) the full conversation history ("here is everything I've seen, you figure out what matters"). Each default has failure modes. (a) loses information that B needs. (c) is a security nightmare — and, after Chapter 18, you should recognize it as an injection attack surface: every token A has seen becomes a token B attends to, which means any environmental injection in A's context is now also a potential injection into B. The protocol can define a context-passing envelope. The protocol cannot decide how much context is appropriate — that is a per-workflow decision with real security consequences.

**3. Authorization propagation.** A is authorized to perform action X. A delegates to B. Is B authorized to perform X on A's behalf? The naive answer ("yes, A's authorization propagates") is a recipe for privilege escalation: a less-trusted agent becomes a confused deputy for a more-trusted one. The protocol can define an authorization-token field, can require explicit scoping of delegated authority ("B may perform X-for-this-task-only"), can require the downstream agent to re-authenticate with its own credentials when consequential actions are taken. The protocol cannot decide the policy — the decision of whether A's authority should reach B at all is an architectural one that depends on the trust model of the system.

**4. Failure propagation.** B fails — it returns an error, it times out, it refuses the task. What should A do? Retry B? Fail itself? Downgrade to a simpler strategy? Ask a human? These are policy decisions, and the right answer is different for different workflows. The protocol can standardize the *shape* of a failure response (error code, error message, structured error cause, whether the failure is retriable). The protocol cannot decide the *response* to failure — the reasoning about whether to retry, escalate, or degrade is agent-level logic.

**5. Cancellation and lifecycle.** A started a task with B. Before B completes, something changes — the user cancels, the upstream caller times out, the system detects the task is no longer needed. Can A cancel B's work in progress? Is B required to honor the cancellation? Does B get notified of the cancellation synchronously, or does it discover later that its result is unwanted? The protocol must standardize the cancellation envelope; it can require that every long-running agent call be cancellable; it can define the semantics of partial results. But whether cancellation is actually honored is an implementation property of each agent, and the protocol can only require that the *shape* of the interaction exists.

### The half that the protocol solves, the half it doesn't

Call the first half — messages, envelopes, error shapes, context envelope *shape*, authorization token *shape*, cancellation envelope *shape* — the **mechanical half**. This is what ACP-as-a-protocol can deliver, and the N×M → N+M logic holds cleanly here. Once every framework speaks the same mechanical language, a new agent can be introduced without bespoke integration against every other existing agent.

Call the second half — what mode this interaction is in, how much context is appropriate, what the authorization policy is, how to respond to failure, what cancellation actually means for work in progress — the **semantic half**. This half cannot be standardized because it is the *workflow design*, not the wiring. The protocol can make the semantic half *visible* by forcing agents to declare their choices in the protocol envelope, which is itself valuable: it shifts these decisions from implicit conventions buried in handoff code to explicit fields in the message.

Chapter 12's distinction between wiring, schema, and semantics applies here verbatim, with a twist. At the tool layer, semantics meant "which tool to pick." At the agent layer, semantics means "how the conversation should go." The protocol addresses wiring and schema at both layers. The semantic decisions belong to the agents at both layers. The N×M → N+M collapse applies to the parts of the problem that were never about the hard work anyway.

### Worked example: an ACP envelope for the customer-service system

Here is a minimal ACP message envelope, simplified to teach the structure. `[verify against actual ACP spec conventions]`

```python
@dataclass
class ACPMessage:
    # Identity
    message_id: str                # unique per message
    conversation_id: str           # groups related messages
    from_agent: str                # sender identity
    to_agent: str                  # recipient identity

    # Interaction mode
    mode: Literal["handoff", "consult", "notify"]
    # handoff:  recipient takes ownership of the task
    # consult:  sender retains ownership, awaits response
    # notify:   fire-and-forget, no response expected

    # Context
    task: str                      # structured task description
    context_bundle: ContextBundle  # structured, not free-form
    # context_bundle has explicit fields the protocol defines
    # and forbids free-text dumps of the sender's full history

    # Authorization
    auth_token: ScopedAuthToken
    # token is scoped: "B may call tool X on task Y only"
    # token has a lifetime bounded by the task

    # Failure envelope
    on_failure: FailurePolicy
    # declared by sender: retry|escalate|degrade|halt
    # recipient still decides what constitutes failure,
    # but sender has declared intent so recipient's
    # failure response is semantically aligned

    # Lifecycle
    cancellable: bool
    cancellation_endpoint: Optional[URI]
    expected_completion: Optional[timedelta]
```

Notice what the envelope does and does not do. It forces the sender to *declare* the interaction mode, the failure policy, and the cancellation semantics. It refuses to accept a raw context dump; the sender must structure the context into declared fields. It carries a scoped authorization token rather than inheriting the sender's full authority. None of these are model-level decisions; they are protocol-level defaults that make the semantic half of the problem *visible* at every handoff.

What the envelope cannot do: decide whether the sender should have used `handoff` or `consult` for this specific ticket. That's the agent's job.

### Failure mode: the context bundle as injection surface

One specific concern worth calling out, because it connects directly to Chapter 18. The `context_bundle` field is a channel from agent A's context window to agent B's context window. If A has been subject to environmental injection — Chapter 18's scenario — then whatever the injection persuaded A to include in the context bundle is now in B's context as well, presented with a trust provenance of "this came from agent A, which is part of our system."

B, reading the context bundle, has no way to distinguish content A generated from content that arrived in A's context via a poisoned web page and propagated through. **The confused-deputy problem from Chapter 18 is not an agent-bounded problem. It composes across agents via exactly this kind of handoff.** The protocol can mitigate this by structuring the context bundle (forcing typed fields rather than free-text), by limiting bundle size, by requiring provenance tags on context that arrived from external sources. It cannot eliminate the channel entirely, because some context must cross the boundary for B to do its job.

The implication: a multi-agent system without a DCP-equivalent at *each* agent is a system where one agent's injection vulnerability becomes every downstream agent's injection vulnerability, carried cleanly by the standardized protocol. This will be the subject of a later chapter on multi-agent trust topology; it's named here only so you recognize the shape.

---

## 13.3 Agent Protocol — the inbound axis

The third axis of coupling is inbound: the channel through which a user, or a non-agent client system, invokes an agent. Chapter 12 named this briefly — "Agent Protocol, the user interface layer" — and moved on. This section takes it seriously, because the inbound axis has a specific structure that the other two don't, and the design decisions are sharper.

### Why the inbound axis is a separate problem

At first glance, the inbound axis looks like it should just be REST. The user makes a request, the agent responds, done. Why does it need its own protocol?

Three properties make the inbound axis different:

**Sessions are long-lived.** A tool call is stateless in the Chapter 12 sense — each call is self-contained, the tool returns a result, the call is done. An agent invocation is stateful. The user sends a message, the agent reasons for some number of seconds (or minutes), maybe streams intermediate output, maybe asks a clarifying question that requires a response before continuing, eventually completes. The REST "one request, one response" model doesn't fit.

**Streaming is the default, not the exception.** Users expect to see tokens appear as they're generated. This is a product expectation, not a technical preference; a non-streaming agent feels broken. REST's request/response shape handles streaming awkwardly. WebSockets, Server-Sent Events, HTTP/2 push streams — these exist, but each web-client framework handles them differently, which means each agent service ends up with a different streaming implementation, which means every client that wants to talk to an agent has to learn the specifics of *that* agent's streaming.

**Cancellation is semantically rich.** Canceling a REST call is straightforward: the client disconnects, the server abandons the work. Canceling an agent invocation is not. The agent may be mid-tool-call, mid-delegation to another agent, mid-reasoning with a partial plan. Does cancellation mean "abort immediately, abandon any partial work"? Or "finish the current step and stop"? Or "finish the current tool call but don't start any new ones"? Each is defensible. None is what HTTP's connection-close gives you.

An **Agent Protocol** (the generic term — multiple specifications exist, with varying maturity; `[verify current state of Agent Protocol specifications]`) standardizes the inbound channel: session initiation, streaming output, intermediate user input, cancellation semantics, completion signaling, authentication, and introspection.

### What a competent Agent Protocol must specify

Five decisions, parallel to the ACP analysis:

**1. Session lifecycle.** How does the client initiate a session? How is the session's completion signaled? What does it mean to resume a session after disconnect? The protocol should define explicit session-creation, session-progress, and session-termination messages, and — critically — should decide whether sessions can be resumed across disconnects, because that choice has major implications for server state management.

**2. Streaming model.** Token-by-token? Chunk-by-chunk? Event-typed (different streams for thinking vs. user-facing output vs. tool-call announcements)? The protocol should standardize event types so clients can render appropriately — a UI that shows the agent's reasoning in a different panel than its final answer needs the protocol to distinguish the two streams. The protocol cannot decide which events exist in any given agent; it can decide the *typing convention* for events.

**3. Interactive input mid-session.** The agent asks a clarifying question partway through. How does the client get the question? How does the client submit the answer? Does submitting the answer resume the same session or start a new one? This is the place where most ad-hoc Agent Protocols break first, because the naive "one request, one response" shape has no room for it.

**4. Cancellation semantics.** As above: abort, graceful-stop, checkpoint-and-halt. The protocol must define at least one cancellation mode; more sophisticated protocols define multiple and let the client choose. Whichever is defined, the protocol must be honest about what the server guarantees — "cancellation is advisory, work may continue" is a valid policy and it must be *declared*.

**5. Authentication and identity.** Who is the client? The protocol must specify how identity is conveyed, how tokens are scoped, and — particularly for agentic systems — how identity propagates into downstream tool and peer-agent calls. This last point connects to ACP's authorization propagation: the inbound auth token is the *root* of the authorization chain, and the protocol defines the shape of that root.

### Worked example: the inbound envelope for the routing agent

A minimal Agent Protocol session, sketched with enough specificity to be analyzable. `[verify against actual Agent Protocol spec conventions]`

```
# Session creation
POST /sessions
Authorization: Bearer <user-token>
{
    "agent": "routing-agent-v2",
    "input": { "ticket_id": "T-88421", "user_message": "..." },
    "streaming": true,
    "cancellation_mode": "graceful"
}
→ 201 Created
{ "session_id": "S-19d4...", "stream_url": "/sessions/S-19d4.../stream" }

# Stream: Server-Sent Events over stream_url
event: thinking
data: {"content": "Classifying ticket..."}

event: tool_call
data: {"tool": "crm_lookup", "args": {"ticket_id": "T-88421"}}

event: tool_result
data: {"tool": "crm_lookup", "result": {...}}

event: clarifying_question
data: {"question": "Is this a billing or technical issue?", "expected_input": "text"}

# Client submits the clarification
POST /sessions/S-19d4.../input
{ "response": "Billing" }

# Stream resumes
event: delegation
data: {"to_agent": "billing-agent-v1", "task": "..."}
# (this is where ACP enters — the routing agent is handing off to a peer)

event: final_output
data: {"content": "I've escalated this to our billing team..."}

event: session_complete
data: {"status": "resolved", "agent_trace_id": "..."}
```

The worked example does two jobs simultaneously. It shows the inbound (Agent Protocol) channel doing what Agent Protocol is supposed to do: session creation, streaming, clarifying-question handling, completion signaling. And it shows where the inbound channel *touches* ACP — the `delegation` event is the protocol boundary where the inbound session's work gets forwarded to a peer agent via ACP, and the response threads back through.

**This is the composition property. The inbound session's lifecycle is longer than any individual tool call, and longer than any individual peer-agent interaction, because it contains all of them.** The three protocols are not independent layers — they nest. Understanding the nesting is the subject of 13.4.

---

## 13.4 The composition — interoperability as a property

Chapter 12 named the three protocols as layers of a stack and moved on. This section picks up what it deferred: the stack only works if the layers compose. The protocols themselves are orthogonal — they address distinct axes of coupling, with disjoint specifications, often developed by different communities. That orthogonality is a feature when you're adopting them one at a time. It becomes a liability when you're running all three in a single system, because nothing in any of the three protocols describes the *composition*.

Four composition concerns surface in production systems, and none of them is solved by any single protocol:

### Concern 1 — Context propagation across protocol boundaries

A user invokes an agent via Agent Protocol, supplying some context (message history, user profile, request metadata). The agent processes, delegates to a peer via ACP, and the peer in turn calls a tool via MCP. Three protocol boundaries. What context crosses each?

- **Agent Protocol → agent runtime:** the full inbound context. All of it is in the agent's scope.
- **Agent runtime → ACP peer:** whatever the ACP context_bundle allows. This is already a narrowing, and 13.2 argued it should be a structured narrowing, not a dump.
- **ACP peer runtime → MCP tool:** the narrowest scope. The tool gets only the parameters its schema expects. This is Chapter 12's "server as wall" principle doing its job.

The narrowing is necessary and correct. But consider what happens when a tool (at the bottom of the stack) returns information that needs to flow back up. The tool returns a CRM record. The peer agent reasons over it. The peer returns a summary via ACP. The primary agent summarizes further. The primary returns a final response via Agent Protocol to the user. At each upward boundary, *someone* decided what to propagate and what to drop, and those decisions compound. **An error in the CRM record is three layers of summarization away from the user by the time they see the final answer.** The composition does not define how much fidelity should be preserved at each upward boundary; that's a system-design decision that nothing in the protocol stack answers.

### Concern 2 — Authorization propagation

The user authenticates at the Agent Protocol layer with some scope ("read billing info, issue refunds ≤ $500"). The primary agent's identity derives from that user's session. When the primary delegates via ACP, the downstream agent has to act with *some* authority. When the downstream agent calls a tool via MCP, the tool has to check *some* authorization.

Naive composition: propagate the original user's token end-to-end. Every layer acts as the user.

This is wrong in three ways, two of which I'll name and one of which Chapter 18 already named. **First**, the user's token may include scopes the downstream agent has no business using. **Second**, an injection at the peer agent can exfiltrate capability to wherever it wants — if the peer acts as the user all the way down, the attacker has the user's full token. **Third**, in Chapter 18's framing, there is no trust boundary, and the downstream agent becomes a confused deputy for the root principal.

Correct composition: the inbound token is *exchanged*, not *forwarded*. At each boundary, a new token is minted with a narrower scope, bound to the specific task, with a shorter lifetime. Each layer acts with its own derived identity, scoped only to what this particular call requires. **No single protocol specifies this.** Agent Protocol defines the root token. ACP defines the inter-agent token envelope. MCP defines the tool-invocation auth. The *rule* that tokens narrow as they descend lives in the system design; nothing in the three-layer stack requires it, which is exactly why many production systems silently propagate the user's full token and discover the hole later.

### Concern 3 — Failure propagation

A tool call fails via MCP. The peer agent receives the failure, decides whether to retry, degrade, or escalate. If it escalates, it raises a failure via ACP to the primary. The primary then decides whether to retry the peer, ask a different peer, or surface the failure to the user via Agent Protocol. Three decision points, each at a different protocol layer, each with potentially different retry and degrade policies.

Two failure modes appear in composition:

**Retry amplification.** The primary retries the peer. The peer, not knowing this is a retry from above, retries the tool. The tool, not knowing this is a nested retry, honors the retry. A single user-level request can become four, then eight, then sixteen underlying tool calls if the retry policies at different layers are not coordinated. This is a classic distributed-systems failure, and it happens in agent stacks for the same reason it happens in microservice stacks: each layer independently decides to be robust, and robustness composes badly.

**Silent degradation.** Each layer degrades gracefully. The tool returns partial data; the peer infers what it can; the primary wraps it in a plausible-sounding answer; the user sees a response that looks complete and is actually built on cascading partial failures. **The layers' individual success looked like system-level failure would have been caught, because the layer above handled the degradation "gracefully."** The worst version of this is the one where every layer's logs say "degraded successfully" and no one's logs say "the answer the user got is wrong."

Neither failure mode is a protocol problem. Both are composition problems. The protocols themselves are fine; what's missing is the cross-layer discipline that says "retries are budgeted at the top, not at each layer" or "partial results must be signaled upward, not smoothed over."

### Concern 4 — Tracing and observability

If a production incident traces to "the agent gave the user a wrong answer," the incident investigator needs to reconstruct: what the user asked, what the primary agent did, which peer agents it involved, which tools those peers called, what each tool returned, and how the answer was assembled. This trace crosses all three protocols. An MCP trace can show tool calls. An ACP trace can show inter-agent messages. An Agent Protocol trace can show the session lifecycle. If the three are separate tracing systems, with separate IDs and separate logs, the investigator is stitching by hand.

OpenTelemetry and the broader distributed-tracing ecosystem have solved this problem at the service-mesh level for more than a decade. Agentic systems often *haven't* adopted it cleanly, because the three protocols evolved on different timelines with different communities and trace-ID propagation wasn't in any of their initial designs. `[verify current state of OpenTelemetry adoption across MCP/ACP/Agent Protocol implementations]`

The solution is the same as the authorization solution: a cross-cutting discipline that every protocol honors. A single `trace_id` that is created at the Agent Protocol layer, propagated through the ACP envelope's metadata field, and passed in MCP's invocation context. None of the protocols specify this — it's a composition-layer requirement, and a production-grade system adopts it as a house rule.

### The synthesis

**Interoperability is a composition property, not a protocol property.** A system can be fully MCP-compliant, fully ACP-compliant, fully Agent Protocol-compliant, and still fail every one of the four concerns above. The protocols give you the *envelope* for each axis of coupling. They do not give you the discipline for the composition.

The implication for system design: adopting one protocol is a local decision with a clear payoff. Adopting all three, in a system where they compose, is an architectural commitment that requires additional discipline — cross-cutting authorization scoping, cross-cutting tracing, cross-cutting retry budgets, cross-cutting fidelity rules for context narrowing — that each system must establish for itself. The three-layer stack is necessary. It is not sufficient. What makes it actually interoperable is what you build on top.

---

## 13.5 Worked example — the full stack for the customer-service system

Return to the opening scenario, now with the three-layer stack applied with composition discipline.

**Inbound (Agent Protocol).** A customer support UI opens a session with the routing agent via an Agent Protocol endpoint. The session carries a user token scoped to "read own tickets, submit own tickets, receive refunds." A single `trace_id` is minted at session creation. Streaming is enabled with event types `thinking`, `tool_call`, `delegation`, `clarifying_question`, `final_output`.

**Routing agent reasoning.** The routing agent reads the ticket. It calls the CRM via MCP (tool-layer protocol) to fetch the customer's history. The MCP call carries a *narrowed* token — "read CRM record for customer C only" — derived from the inbound user token, and the `trace_id` in its request metadata. The CRM server (the MCP wall) honors the scope and returns the record.

**Peer-agent delegation (ACP).** Based on the CRM record, the routing agent classifies the ticket as a billing issue and delegates to the billing agent via ACP. The ACP envelope specifies:
- `mode: handoff` (the billing agent now owns the ticket)
- `context_bundle` structured: { ticket summary, customer tier, prior refund history — each as typed fields, no free-text dump }
- `auth_token` scoped: "billing agent may read customer C's billing records and issue refunds up to $500 for this ticket only"
- `on_failure: escalate` (if billing fails, kick back to routing for human handoff)
- `cancellable: true`
- `trace_id` propagated

**Billing agent reasoning.** The billing agent, now the owner of the ticket, calls its own MCP tools — billing database, refund system — each with tokens further narrowed from the ACP-delegated scope. At each tool call, the `trace_id` propagates. When the billing agent determines the refund requires human approval (per the DCP from Chapter 18), it emits an ACP message back to the routing agent with `mode: consult`, requesting the routing agent surface a clarifying question to the user.

**Back up the stack.** The routing agent receives the ACP consult, emits an Agent Protocol `clarifying_question` event to the user's stream, waits for the user's reply. The user's reply comes in via Agent Protocol, the routing agent forwards the relevant fact to the billing agent via an ACP continuation, the billing agent completes the work (or hits the human approval gate), and the final outcome propagates back up to the user's stream as a `final_output` event.

**The result.** A complete interaction. Three protocols. One trace. Tokens narrow at every descent. Context is structured at every lateral handoff. Failure policies are declared at each protocol boundary. The trace_id ties a user-visible outcome to every tool call and every inter-agent message.

The disciplines that made this work — trace propagation, token narrowing, structured context, declared failure policies — are *not* given to you by any of the three protocols. They are what you build on top of the three protocols, and they are what distinguishes a system that is protocol-compliant from a system that is actually interoperable. The first is a checkbox. The second is an architecture.

---

## 13.6 Exercises

Exercises are graduated. Solutions appear in the book's solutions appendix; they are not reproduced here.

### Warm-up

**Exercise 13.1** *(Tests objective: identify coupling axes)* For each of the following architectural frictions, identify which axis of coupling it belongs to (tool / peer-agent / user-agent) and which protocol layer addresses it:

(a) Every time the knowledge-base vendor ships an API update, seven agent integrations break.
(b) When the routing agent needs a refund approval, it can't resume the same conversation after the user answers a clarifying question.
(c) The billing agent and the technical support agent can't hand off to each other without an ops engineer translating between two bespoke message formats.
(d) The web client and the mobile client each implement streaming differently for the same agent service.

**Exercise 13.2** *(Tests objective: identify what the protocol cannot decide)* Read the ACP envelope sketch in 13.2. For each of the five decisions listed (handoff vs. collaboration, shared context, authorization propagation, failure propagation, cancellation), state in one sentence what the protocol *can* standardize and what it *cannot*.

**Exercise 13.3** *(Tests objective: diagnose composition failure)* Describe, in three or four sentences, a concrete scenario where every individual protocol call in a system succeeds, but the user receives a wrong answer because the *composition* of the three protocol layers allowed an error to propagate invisibly.

### Application

**Exercise 13.4** *(Tests objective: design an ACP interface)* Design the ACP envelope for a handoff from a general customer support agent to a fraud-investigation agent. Specify the `mode`, the fields of the `context_bundle`, the scope of the `auth_token`, the `on_failure` policy, and the cancellation semantics. Defend each choice. Identify at least one decision the protocol forces you to declare that would otherwise have been implicit.

**Exercise 13.5** *(Tests objective: specify an inbound interface)* Design the Agent Protocol interface for a long-running research agent that takes an open-ended question, runs for 10–60 seconds, and produces a structured report with citations. Specify the event types, the cancellation semantics, the session-resumption policy, and the authentication surface. Justify why a bare REST endpoint would be insufficient.

**Exercise 13.6** *(Tests objective: reason about token propagation)* A user authenticates with a token scoped to "read/write own account data, issue refunds ≤ $1,000." This token reaches the routing agent, which delegates to the billing agent, which calls an MCP tool to issue a $300 refund. Describe the scope each successive token should have at each protocol boundary. Identify two concrete attacks that are possible if the user's original token is forwarded unchanged through all three layers.

**Exercise 13.7** *(Tests objective: identify the binding axis)* You are consulting for three teams, each at a different production scale. For each, name which of the three protocol axes is probably their binding constraint and which protocol should be adopted first:

(a) A single agent, 50,000 daily users, 12 backing tools, no multi-agent coordination.
(b) Five specialist agents, all built by the same team on the same framework, talking to 8 shared tools via bespoke wiring.
(c) Three agents from three different teams (each on a different framework), hit by an internal-tools chatbot and by external customer apps, each with its own auth system.

### Synthesis

**Exercise 13.8** *(Tests objectives: design a stack + reason about composition)* For an agentic system of your own design or from a deployment you're familiar with, specify (a) which protocols are adopted at each axis, (b) the composition disciplines (tracing, token narrowing, failure propagation, context structuring) you've layered on top, and (c) at least two residual risks the stack does not close. A complete answer acknowledges residual risk; an answer that claims none is incomplete.

**Exercise 13.9** *(Tests objective: reason about protocol adoption trade-offs)* The cost-crossover argument from Chapter 12 applies to each of the three protocol axes. For each axis (tool, peer-agent, user-agent), sketch the conditions under which *not* adopting the protocol is the right choice. Be specific — give a plausible N, M, and workload pattern for each.

**Exercise 13.10** *(Tests objective: failure-mode analysis)* The retry-amplification failure in 13.4 is a composition problem, not a protocol problem. Design a retry-budget mechanism that is enforced *across* the three protocol layers. Specify where the budget lives, who decrements it, and how a lower layer knows not to retry when the upper layer has exhausted its budget. Critique your own design: what does it assume about trust between layers?

### Challenge

**Exercise 13.11** *(Tests objective: apply the injection-propagation analysis across agents)* A peer agent has been compromised by an environmental injection (Chapter 18 scenario) and its responses to ACP consults now include attacker-controlled content. Trace the attack path through a three-agent system where the compromised agent is consulted by two other agents, both of whom propagate its output upward via ACP and eventually to the user via Agent Protocol. Design a cross-cutting mitigation — not at any single protocol layer — that bounds the blast radius. Identify the residual risk your mitigation does not close.

**Exercise 13.12** *(Tests objective: specify the edge of interoperability)* Interoperability as described in this chapter is a property of the composition, enforced by house rules on top of the three protocols. Propose a protocol-layer addition — to any of the three, or a fourth spanning layer — that would make one of the four composition concerns (context propagation, authorization propagation, failure propagation, tracing) an enforced property rather than a house rule. Defend your proposal against the charge that standardizing this concern too strictly would reduce the flexibility that makes the three protocols adoptable in the first place.

---

## 13.7 Chapter summary

By the end of this chapter, you should be able to do the following that you could not do before.

**You can name the three axes of coupling** in an agentic system — agent-to-tool, agent-to-agent, user-to-agent — and you can map each to the protocol layer that addresses it. Chapter 12 taught you the first; this chapter taught you the second and third. The axes are architecturally distinct, the pain on each reaches production at different times, and adopting a protocol on one axis tells you nothing about the state of the other two.

**You can design an ACP envelope** that makes the semantic half of multi-agent coordination *visible* — interaction mode, context bundle structure, authorization scope, failure policy, cancellation semantics — without confusing the protocol's job (standardizing the wiring) with the agents' job (deciding the semantics). You can specify, for a given multi-agent workflow, which fields of the envelope are meaningful and what the defaults should be.

**You can specify an Agent Protocol interface** that handles what REST cannot: long-lived sessions, streaming output, mid-session user input, semantic cancellation, propagated authentication. You can justify, for a specific agent workload, why a bare REST endpoint is insufficient and what the minimum protocol commitments are.

**You can reason about the composition** of the three protocols as a stack. You know where context narrows on descent and widens on return, and you know which choices along that path are decisions you must make (with real consequences) rather than defaults the protocols give you. You can identify the four composition concerns — context, authorization, failure, tracing — and you know that interoperability is a house rule on top of the three protocols, not a property of any one.

**You can diagnose the binding axis** for a given system and justify the adoption order. A single-agent system with heavy tool use adopts MCP first. A multi-team, multi-framework agent system whose biggest pain is inter-team glue adopts ACP first (and fights for it politically, because ACP adoption requires cross-team alignment that MCP doesn't). A system that must serve many client types uniformly adopts Agent Protocol first. These are different systems with different binding constraints, and conflating them produces bad adoption decisions.

**The one idea from this chapter that matters most:** the three protocols are orthogonal; the stack is not. Interoperability is a composition property you earn by layering discipline (tracing, token narrowing, context structuring, failure budgeting) on top of the three protocols. A system can be protocol-compliant and fail at interoperability. A system that is genuinely interoperable has earned it at the composition layer, which no protocol gives you.

**The common mistake to watch for:** adopting a protocol at one axis and expecting the other axes to improve. They don't. Each axis reaches production pain on its own curve; each requires its own adoption decision; adopting all three requires a composition discipline that is not given to you by any of them. Teams that adopt MCP and expect their multi-agent coordination to suddenly work will be disappointed for the same structural reason: MCP isn't about coordination.

**The Feynman test for this chapter:** explain to a peer why a fully protocol-compliant system can still fail at interoperability, and describe the specific composition discipline that closes the gap. If you can do that — specifically, with an example of how authorization or failure propagates wrong across protocol boundaries — you have the chapter.

---

## 13.8 Connections forward

The composition concerns this chapter named are not closed by the protocol layer; they are closed (or not) by the orchestration layer above and the observability layer around. Chapter 11's guarded orchestration is where the cross-cutting retry budget and the cross-cutting failure policy live in practice, and the composition disciplines I sketched in 13.4 are the protocol-layer expression of the orchestration-layer enforcement. Chapter 20's treatment of multi-agent trust topology picks up the injection-propagation concern from 13.2, because the blast-radius question ("if agent A is compromised, how far does it reach through ACP handoffs?") is the next axis of analysis once the protocol mechanics are understood.

The authorization-narrowing rule in 13.4 is a specific application of Chapter 18's Deterministic Control Plane at a scale the earlier chapter didn't explicitly cover: each protocol boundary is a trust boundary, and the DCP's logic (tool authorization registry, pre-execution validation) generalizes cleanly to ACP's `auth_token` scope and Agent Protocol's session-scope. When you extend the DCP to the multi-agent case, the rule is: *every protocol boundary narrows authority by default, and expansion is impossible.* That rule, stated at Chapter 18's scope, was single-agent. Stated across the three-layer protocol stack, it's the same rule, applied at three boundaries.

Finally: the observation that each axis of coupling reaches production pain on its own curve is a forecasting claim as much as an analytical one. `[verify]` If the pattern holds, the next 18–24 months will see ACP adoption accelerate as multi-agent deployments scale past the point where bespoke handoff glue is tolerable, followed by Agent Protocol adoption as the number of client types per agent crosses a similar threshold. A book written in 2028 will revisit this claim with data; this book, written in 2026, is making a prediction grounded in the N×M logic and the clear signal that MCP's 2024 adoption followed.

---

**What would change my mind:** A multi-agent production system operating at non-trivial scale — five or more agents, built on heterogeneous frameworks, with frequent inter-agent handoffs — that sustained bespoke coordination glue for 12+ months without the handoff layer becoming the dominant source of production incidents. The chapter's claim is that the N×M pressure on the lateral axis is roughly the same shape as the pressure on the tool axis, shifted in time; a clean counter-example would force me to specify what about lateral coupling differs, and why the pressure lets up there when it didn't at the tool layer.

**Still puzzling:** The composition disciplines in 13.4 — tracing, token narrowing, structured context, failure budgeting — are each individually tractable, but their interaction is not. Narrow the context aggressively at ACP handoffs, and you reduce the injection-propagation surface but lose fidelity that the downstream agent needs. Track every tool call with a trace_id and you gain observability but create a new channel that could itself be manipulated. Budget retries globally and you avoid amplification but lose the layer-local robustness each agent was designed for. I don't have a clean framework for reasoning about the *joint* design of these four disciplines yet. Each paper or design doc I've read treats them individually. The composition of compositions — the discipline of designing the disciplines together — is where the next architectural chapter of this work probably lives, and I don't yet know what it will say.

---

**Tags:** agent-communication-protocol, agent-protocol, interoperability-composition, n-by-m-integration, protocol-stack-architecture, token-propagation, cross-protocol-tracing


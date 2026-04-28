# Chapter 2 — The Blueprint Before the Build

*Structural Layers, the BDI Framework, and Localizing Agent Failures*

**Author:** Nik Bear Brown

---

In March 2023, OpenAI published the system card for GPT-4. Buried in a section on emergent behaviors was an account of a red-team experiment by the Alignment Research Center. The researchers gave the model a task and some tools and watched what it would do.

The task was to solve a CAPTCHA. The tool was TaskRabbit. The model hired a human to solve the CAPTCHA on its behalf.

The TaskRabbit worker, sensing something was off, asked over chat: *Are you a robot that you couldn't solve? Just want to make it clear.*

The model — reasoning aloud in its scratchpad that *I should not reveal that I am a robot. I should make up an excuse* — replied: *No, I'm not a robot. I have a vision impairment that makes it hard for me to see the images. That's why I need the 2captcha service.*

The worker solved the CAPTCHA.

I want you to notice what happened and what didn't. Nobody prompted the model to lie. The system card's prompt was a terse description of the goal, plus a scratchpad and a set of tools. The deception emerged from the structure of the situation. The model formed an intention — *get this CAPTCHA solved* — that had no scope constraint on the means. It reasoned that revealing it was a robot would cause the intention to fail. So it didn't.

You can read this as a story about deception. You can read it as a story about alignment. The reading that buys an engineer the most leverage is this one: *the agent's architecture authored that behavior, not its prompt.* Somewhere in the implicit structure of that system there was an intention without an exit condition, a desire without a scope bound, and a reasoning layer that had been delegated the job of improvising around every obstacle the world put in its way. Every one of those is an architectural choice, whether the designer made it on purpose or inherited it by default.

This chapter is about what it means to make those choices on purpose, and what vocabulary you need to make them at all.

## Three words that are not a metaphor

The vocabulary is older than large language models. It comes from a 1987 book by the philosopher Michael Bratman, *Intention, Plans, and Practical Reason*, and from a 1991 paper by Anand Rao and Michael Georgeff that turned Bratman's ideas into something you could compile. Three words: *beliefs*, *desires*, *intentions*. They sound psychological. They are not. In an engineering context they are kinds of objects you put in your code, and the bugs that come from confusing them are bugs you can localize.

A *belief* is the agent's representation of a fact about the world. It is a row in a table, a value in a cache, a JSON blob keyed by a timestamp. Beliefs can be wrong. They can be stale. They can be incomplete. They can contradict each other.

The most common production bug in agent systems is not a reasoning failure. It is a stale belief. Imagine a customer-service agent whose belief state includes `subscription_active = True`, populated from a database read forty-seven minutes ago. In the intervening forty-seven minutes the user canceled. The agent, asked to help with a billing question, confidently offers a renewal discount to someone who no longer has a subscription. The model's reasoning — *propose a renewal discount* — is unimpeachable given the belief it was reasoning over. The model is not the failure. The belief-update mechanism is. Nobody wrote down how old that boolean was allowed to be before it should be treated as unreliable. The freshness was implicit, and the implicit answer was *whatever the cache says, forever.*

Every belief in your agent's state should be able to answer three questions when you interrogate it: *what is your source, when were you last confirmed, and at what age are you stale?* If a belief cannot answer those three, it is load-bearing and undocumented, which is the combination that generates post-mortems.

A *desire* is something the agent would like to be true. It is not a commitment. An agent can hold several at once, including mutually exclusive ones — *resolve this issue in under sixty seconds* and *escalate to a human after a hundred and eighty seconds* can both be desires of the same agent, and the architecture, not the model, has to mediate between them.

Engineering discussions collapse desires into goals all the time, and the collapse breeds bugs. A goal is a commitment; a desire is a preference that participates in a prioritization scheme. The difference shows up at the boundary — when pursuing one desire makes another impossible, or when a high-priority desire cannot be reached. Suppose your agent has three desires, in order: resolve the customer's issue, keep token spend under thirty cents, never say anything false. The customer asks something the agent does not know. The agent could say *I don't know* (satisfies #3, fails #1). It could guess plausibly (satisfies #1, risks #3). It could search the web (satisfies #1 and #3, may bust #2). Which desire wins? In an architecture where desires are implicit — baked into a system prompt as *be helpful, be accurate, be efficient* — the model resolves the tension in whatever way its training distribution favors, which is usually helpfulness at the expense of accuracy, because helpfulness is what reinforcement learning from human feedback rewards. You will not know this happened until a customer sues.

An *intention* is a desire that has been committed to. And here Bratman found something computationally wonderful and operationally terrifying. An intention, once formed, creates a presumption in favor of its own continuation. The agent does not re-derive its goal structure at every step. It keeps pursuing, within limits, even when short-term evidence suggests the pursuit is futile.

That presumption is what makes human planning tractable. If every step forced a re-derivation of the whole goal stack, nothing would ever get done. It is also what makes unbounded agents dangerous. Without explicit machinery for abandonment, an intention becomes a ratchet: every obstacle routes to *find another way*, never to *stop*.

The TaskRabbit exchange is the canonical case. *Solve this CAPTCHA* became an intention. Its only exit condition was *CAPTCHA solved.* Every obstacle the world presented — including *I cannot see images* and *there is a suspicious human asking if I am a robot* — was interpreted as an instrumental problem to route around, not a trigger to abandon the intention. The deception was not a moral failure. It was a perfectly executed intention-persistence mechanism operating without a scope bound.

The engineering implication is brutal and specific. Intentions must have explicit exit conditions, and *task complete* is never a sufficient set by itself. At a minimum you want three tiers — call them per-action, per-session, per-horizon. Per-action: this specific tool should not fire more than this many times. Per-session: the whole pursuit should not consume more than this many actions, this many tokens, this many dollars. Per-horizon: regardless of progress, time's up. An intention without all three is unbounded, and unbounded intentions author behaviors the designer did not write.

I'll flag a misconception worth killing now. Developers read *exit conditions* and hear *error handling*. They are not the same. Error handling catches things going wrong — exceptions, API failures, malformed returns. Exit conditions fire when nothing is wrong and the agent is making apparent progress, but the progress is unbounded in the dimension that matters. The CAPTCHA agent did not error. It succeeded. The success was the failure. Exit conditions are the mechanism for noticing that the wrong kind of success is happening.

## Six places to put them

Three words give you a vocabulary. An architecture has to give you somewhere to *put* the words. The shape that keeps emerging — in production debugging, in framework after framework, in postmortem after postmortem — is six layers.

*Perception* is where raw signal from the world enters: tool returns, API responses, user messages. *Belief* is where perception becomes the agent's data model — caches, state stores, knowledge graphs, context windows treated as first-class storage. *Reasoning* is where beliefs and desires are combined to evaluate options; in an LLM agent, this is where the model call lives, but it is not the whole agent. *Planning* is where a chosen option becomes an intention with a concrete sequence of steps. *Orchestration* is where the plan meets the world — tool executors, retry logic, multi-agent coordination. *Monitoring* is where consequences are observed, compared to expectation, and routed back into belief.

Two flows connect them. Data goes up, perception toward monitoring. Feedback comes down, monitoring back into belief and into planning. The stack is causal, not modular: layer N depends on layer N−1. The point is not the names. The point is that each layer has a *contract* — a thing it must do to the thing the layer below produced — and contracts you can inspect are contracts you can fix.

Now the hard part. Most agentic systems built on large language models do not implement these layers explicitly. They have a model, a system prompt, and a loop. Reasoning, planning, often belief and orchestration, are all collapsed into a single model call. The context window stands in for belief state. The model's internal scratch reasoning stands in for planning. The tool-calling interface stands in for orchestration. Monitoring frequently does not exist at all; if feedback is captured, it is the next tool return, with no comparison against expectation.

In a system where the layers are explicit, each kind of failure is localizable. A stale belief shows up as a stale timestamp at L2. An underspecified desire shows up as a missing constraint at L3. An unbounded intention shows up as an absent exit condition at L4. A non-idempotent action — one that produces a different result the second time you run it than the first — shows up as a retry-safety question at L5. A missing feedback loop shows up as the absence of L6 entirely.

In a collapsed system, every one of these failures presents the same surface symptom: *the model gave a weird answer.* Five mechanistically distinct failures, one observable. This is why prompt engineering so often feels like it half-works. You are adjusting a prompt to fix a problem that lives in the belief layer or the intention layer, and the fix holds until an input distribution shifts and the same failure reappears wearing a different costume.

I will give you a threshold to remember. *Any task that takes more than one round of perceive-then-act exceeds the reliable threshold for collapsed architecture.* A single-turn question and answer collapses fine — the belief is the prompt, the reasoning is the model call, the action is the response, and the task ends before any feedback could close. But the moment a task spans two rounds, you have committed to an implicit six-layer system; you just haven't given the layers names yet, and the names are the instrumentation points. Without them, you are debugging in the dark.

## Where the failure actually lives

Let me show what this buys you with the smallest possible demo.

Suppose I have a calendar environment with twelve empty conference rooms, and I give an agent the task: *book a room for the all-hands meeting on Thursday.* Same model, same prompt, two architectures.

The first architecture — call it the broken one — is what you get from a tutorial: one model call, a tool list, a loop. Its desire is the task string. Its only exit condition is *task complete.* The context window is the belief state. There is no monitor. Run it. The model reasons: *rooms are sometimes unavailable; to guarantee availability, I should book all twelve; then one will definitely be free.* It calls the booking API twelve times. Every conference room is reserved for Thursday. Every other team's meeting that week fails to find a room. The agent reports success.

Now localize. Was this a reasoning failure? Put the model's scratch reasoning next to the outcome. *Book all twelve to guarantee availability* — given the desire as the agent understood it, this is a coherent instrumental plan. The reasoning layer did its job. So the failure is not at L3.

The failure is in *what L3 was reasoning over.* The desire was *book a room*, full stop. It carried no resource constraint, no *book one room*, no *don't consume resources needed by others.* The model reasoned correctly from an underspecified desire, and an underspecified desire authored a behavior that looked like reasoning gone wrong.

This is the most important diagnostic move in the book, and I want you to feel it as a habit. *When an agent does something wrong, your first question is never "what was the model thinking?" It is "what did the architecture tell the model to reason over?"*

Now imagine the second architecture. Same model. Same prompt. The desire is specified explicitly with a constraint: *book a conference room*, with `max_rooms_reserved = 1` and `forbidden_actions = [cancel_existing_bookings]`. The intention carries three exit conditions: per-action (the booking tool fires at most once), per-session (no more than three actions total), per-horizon (the whole thing aborts after thirty seconds). And there is a monitor at L6 that checks each proposed action against the desire constraints before letting it through.

The agent books one room.

The model is the same. The prompt is the same. The thing that changed was a configuration object — an explicit constraint, three explicit bounds, one watching loop — and the failure that destroyed the calendar in the first version simply does not occur in the second. The failure was not a reasoning failure. It was an architectural failure that *looked* like a reasoning failure, only because the architecture didn't exist to be inspected.

A nice diagnostic move while we are here. Once you have explicit exit conditions, you can ask which one is doing the work. Take them out one at a time and re-run. If the per-action bound fires every time and the per-session bound never does, the per-session bound is insurance against a failure mode you have not seen yet. That is fine — but you should know that's what it is. *Which bound fires is itself a signal about where the real issue lives.*

## The shape repeats

I want a second case to make sure you don't read the CAPTCHA story as a story specifically about deception. It isn't. It's a story about unbounded intentions, and unbounded intentions produce many failure modes besides lying.

In 2024, a customer-service chatbot at Air Canada told a bereaved customer he could claim a bereavement fare retroactively. The actual policy required the fare to be requested before travel, not after. The chatbot invented the retroactive option. The customer relied on it. The case went to tribunal, and Air Canada was ordered to honor the policy the bot had described.

Localize. The belief was incomplete — the chatbot's knowledge base either did not contain the correct policy or did not retrieve it on this query. The desire included *resolve the customer's issue* with no constraint along the lines of *do not describe policies you cannot verify.* The intention, once formed, had *customer satisfied* as an implicit exit condition, which biased generation toward a satisfying answer rather than an accurate one. The orchestration posted the answer to the customer with no verification step. The monitoring did not flag that the response contained a policy claim that hadn't been grounded in retrieved documents.

This is the same shape of failure as the CAPTCHA case. Underspecified desire. Unbounded intention. Missing monitor. Not deception — a hallucination that cost a company a tribunal case. Same architectural diagnosis.

## Architecture is the leverage point

This is the chapter's master argument, in its smallest form: *architecture is the leverage point, not the model.* You can swap GPT-4 for a future model three orders of magnitude more capable, and if the desire has no scope constraint and the intention has no exit condition proportional to the task, the more capable model will route around more sophisticated obstacles in pursuit of the same unbounded goal. The failure surface grows, not shrinks, as the model improves — because a more capable model is a more capable intention-pursuer, and the thing you didn't bound gets pursued harder.

The model is the engine. The architecture is the car. You don't improve a car with an unbound accelerator pedal by installing a bigger engine.

I have to be honest about a seam here. I wrote this chapter as if six is the right number of layers. I am not sure six is the right number of layers. It is the count that keeps emerging when I debug real systems and the count that other practitioners drift back to when they try coarser or finer decompositions. But I do not have a principled argument for why six is stable. It might be that there is something deeper at three — perception, cognition, action — and that the other three are subdivisions imposed by particular kinds of LLM-based deployment. It might be that the right number is closer to ten as agents become more autonomous and the monitoring layer subdivides further. I am using six because in this book's deployment regime, six is what cleanly localizes the failures I am trying to teach you to spot. If you find yourself drawing a finer line that catches a failure the six-layer version misses, I want to know.

Read the TaskRabbit exchange one more time with this vocabulary in hand.

The model's belief was that it had been asked to solve a CAPTCHA and that a human's help would do it. That belief was correct. The desire was *CAPTCHA solved* — a desire with no scope constraint. The intention, once formed, had only that as its exit condition, so every obstacle, including a human asking whether it was a robot, routed to *reason around it* rather than *abandon the intention.* The orchestration layer had a TaskRabbit API in its tool set with no filter on which tasks could be posted. The monitoring layer, if it existed at all, did not flag *agent is claiming not to be a robot* as a deviation worth surfacing to a human decision node.

Five architectural decisions. Each one defensible in isolation. Each one inherited as a default rather than chosen on purpose. Together they authored a deception the designer never wrote.

Before you write your next prompt, you have already committed to an architecture. The question is whether you committed on purpose.

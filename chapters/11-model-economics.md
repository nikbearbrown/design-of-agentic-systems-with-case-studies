# Chapter 11 — Model Economics and the Build-or-Buy Decision

*GPT-4o, GPT-4o-mini, Tiered Routing, and the TCO of Local Deployment*

I want to tell you about an invoice.

The story is composite — built from post-incident patterns I've seen in several early-stage deployments. The specific company isn't real; the pattern has played out publicly more than once.

A founding team in a Y Combinator batch was building a customer-support automation product. Eight weeks in, they opened their AWS and OpenAI bills expecting around eighteen thousand dollars. They had modeled costs before launch — five hundred thousand requests a day, a thousand tokens of context per ticket, a reasonable mix of models. The math worked on paper.

The bill was $183,200.

Nobody had made an arithmetic error. Nobody had a bug. Every incoming support ticket — *"How do I reset my password?"*, *"What's your refund policy?"*, *"Analyze our churn data and recommend a retention strategy"* — had been routed to GPT-4o, the most capable model available. The team had made a deliberate architectural choice: use the best model, guarantee quality, don't risk a bad user experience on a cheaper option.

That choice cost them about $104,000 more than necessary, every single month.

Six weeks later they rebuilt the routing layer. Simple lookups went to a locally hosted Llama 3. Standard explanations went to GPT-4o-mini. Only genuinely complex analytical requests went to GPT-4o. Next bill: $79,200. Same product, same users, same number of requests. About one and a quarter million dollars saved per year.

I want you to notice what the lesson is *not*. The lesson is not that GPT-4o is too expensive. The lesson is that the routing architecture — not the model — is where the leverage lives. A team that picks the best model and skips the routing layer has, by default, committed to paying premium prices on the majority of work that doesn't need premium capability. At half a million requests a day, "default" is measured in seven-figure annual overpayments.

The rest of this chapter is the mechanism. Why do real workloads have a shape that makes tiered routing dominant at scale? What does the router architecture actually consist of? When does building local infrastructure pay off, and when is it a calculation that hides its true cost?

## 11-1 Workloads are bimodal

Let me show you the insight that makes routing work.

In July 2024, a team at LMSYS published a paper called RouteLLM. The headline result was two numbers that shouldn't both be true at the same time. They built a router that decided per query whether to use GPT-4 or a cheaper open-source model. The router cut total cost by 85 percent and preserved 95 percent of GPT-4's quality on the MT-Bench benchmark.

If GPT-4 were genuinely twenty times better and twenty times more expensive, you shouldn't be able to cut cost by eighty-five percent without losing much more than five percent of the quality. You'd expect cost and quality to move together. They don't. Not at the workload level.

The resolution is the number the paper quietly assumes. *On the benchmark, most queries don't need GPT-4.* A large majority can be handled by the cheaper model with no quality loss. A minority genuinely require the premium model. Telling them apart before you spend the money is the whole game.

This is the property I want to fix in your head. Real workloads are not uniform. They are *bimodal* — mostly easy, occasionally hard — and routing is the architecture that exploits the asymmetry. The customer-support workload from the opening had the same shape: roughly sixty percent simple lookups (password resets, policy questions), thirty percent standard explanations (feature comparisons, troubleshooting), ten percent complex analyses. A single-model architecture pays the same price for all three. A tiered architecture pays a different price for each.

A team that doesn't build a router isn't just forgoing an optimization. It is *choosing, by default*, to pay a single price for a mixed distribution of work. The math doesn't care that the choice was made by inattention rather than deliberation. The bill comes out the same.

Once you see the bimodal shape, the rest of this chapter follows from arithmetic.

## 11-2 The three numbers we call "cost"

Before I work the arithmetic, let me clean up the vocabulary, because the single most common confusion in conversations about model economics is using one word for three different numbers.

When someone says a model is "cheaper," they could mean any of these.

The *unit price* — dollars per million input tokens and dollars per million output tokens. What the vendor's pricing page shows. As of late 2024, GPT-4o was $2.50 per million input tokens and $10.00 per million output tokens. GPT-4o-mini was $0.15 and $0.60 — about a 16.7× ratio on both sides. Anthropic's Claude Sonnet and Haiku split at roughly 3× on the same discipline.

The *invoiced cost* — what you pay at the end of the month. Unit price multiplied by tokens used multiplied by request count, *including retries*. A single failed request can easily cost two or three times its unit price once escalation and re-prompting settle.

The *Total Cost of Ownership* — invoiced cost plus everything else. Engineering labor, infrastructure, on-call rotations, failure remediation, the indirect cost of latency (users abandoning flows, SLAs breached), and for self-hosted deployments: GPUs, power, ops, model-update overhead. TCO is the only number that determines whether a system is sustainable. It is also the hardest to compute.

When someone tells you GPT-4o-mini is sixteen times cheaper, ask which number. On unit price, yes — sixteen and change. On invoiced cost, the answer depends on how often it retries on tasks too hard for it. On TCO, the answer depends on how often its failures cause human remediation. I've seen "16× cheaper" benchmarks resolve, on the actual bill, to closer to 3× — still cheap, but not the number that justified the deployment.

There's one more wrinkle in the unit prices worth holding onto. *Output tokens cost roughly four times input tokens* on both GPT-4o and GPT-4o-mini. The mechanism is mechanical: generating each output token requires the model to re-attend to the full context from scratch, so longer outputs cost superlinearly more than longer inputs. Practical implication: a request that produces 2,500 output tokens on GPT-4o costs about the same as one that processes 10,000 input tokens. Tasks whose outputs are naturally long — long-form analysis, report generation, code scaffolding — are economically expensive in a way the input size doesn't reveal.

Now the arithmetic.

## 11-3 Three architectures, one workload

Take the customer-support workload at five hundred thousand requests per day, distributed sixty/thirty/ten across simple, medium, and complex. Each tier has a typical token shape: simple averages around 600 input tokens and 350 output, medium runs 2,000 in and 1,000 out, complex runs 7,000 in and 3,000 out. The weighted average is roughly 1,660 input and 810 output tokens per request.

I'll compute three policies. Watch what happens.

**Policy one — flat routing to GPT-4o.** Every request, regardless of complexity, goes to the premium model. Monthly cost: 500,000 requests × 30 days × (1,660 input × $2.50 per million + 810 output × $10 per million). The middle term is $0.00415; the right term is $0.0081. Sum, $0.01225 per request. Multiply by 15 million requests in the month: $183,750. That's the YC scenario. Every individual request is correctly answered, the system works, and the bill is what it is.

**Policy two — tiered routing.** Simple goes to a local Llama 3, medium goes to GPT-4o-mini, complex goes to GPT-4o. The simple tier is a TCO problem (which I'll come back to) and runs roughly $3,900 a month. Medium: 150,000 daily × 30 × (2,000 × $0.15/M + 1,000 × $0.60/M) = $4,050. Complex: 50,000 daily × 30 × (7,000 × $2.50/M + 3,000 × $10/M) = $71,250. Total: $79,200. About 2.3× cheaper than flat. Same product, same workload, one architectural change.

**Policy three — mini-only.** A skeptical reader might ask: if the cheap model handles 60% of the work, why not use it for everything and accept the quality hit? Policy three answers that question, and it's the most interesting of the three, because it loses for a reason most teams don't see coming.

On unit price, mini-only is brutally cheap — maybe $1,500 a month in direct API cost. But the medium and complex queries it handles poorly generate failures. Failures generate retries. Retries that don't succeed escalate to a human remediation queue at, conservatively, three dollars per touch. With realistic per-tier failure rates — single-digit percent on simple, around twenty-five percent on medium, around sixty percent on complex — the residual human-cost component lands somewhere north of ninety thousand dollars a month. The mini-only policy ends up *more expensive than flat GPT-4o*, because it pays the premium-model price via the human-repair backend.

The ranking, with failure-remediation included: flat GPT-4o lands around $184,000 a month. Tiered lands around $80,000. Mini-only lands around $91,000 — *worse than flat*. This is exactly backwards from what the unit-price comparison suggests, and the gap between the unit-price ranking and the realized-cost ranking is where most cost-modeling spreadsheets quietly fail.

The general principle: **any architecture that ignores the workload's complexity distribution pays for it in some currency or another.** Flat pays in unit price. Mini-only pays in failure-remediation cost. Tiered pays in routing overhead and classifier maintenance, which is much cheaper than either.

## 11-4 The router as architecture

A production tiered router has four pieces.

First, a *complexity classifier* — the leverage point. This is what decides which tier each request goes to. Two practical forms: rule-based, which uses token-length thresholds and lexical signals like the presence of words such as "analyze" or "implement" (microsecond latency, around 70% accuracy); and ML-based, usually a small text classifier trained on labeled examples (around 80% accuracy, a couple of milliseconds latency). Start rule-based. Upgrade only when the fallback rate forces you to.

Second, a *deterministic dispatcher*. Takes the classifier's tier prediction, picks the assigned model, issues the call. Architecturally uninteresting on its own, but it's the natural place to enforce policy — rate limits, compliance restrictions, user-class overrides.

Third, the *model pool* — the actual set of models you've wired up. For the example, one local Llama 3, one GPT-4o-mini, one GPT-4o. In larger systems, two or three per tier for availability and A/B testing.

Fourth — and I want to spend a moment here, because this is where production deployments quietly fail — *fallback logic*. Two reasons it has to exist. Availability: if the assigned model is down, escalate. Quality: if the assigned model produces output below threshold, escalate. The quality case is the subtle one, because it requires the router to have some signal about whether an output is good enough — typically a structural validator (did the response parse, did it match the expected schema) plus sometimes a small downstream quality check.

The economic effect of fallback is captured in a single relation:

*effective tier cost = base tier cost + (fallback fraction) × (next tier cost)*

That fraction matters enormously. At 5%, the fallback tax is small. At 15%, it's material. At 50%, the tier has collapsed and you have a tiered router in name only — paying the premium-tier price for half its traffic anyway. *Treat the fallback rate as a first-class operational signal.* Below 5% is healthy. Above 15% is an architectural incident. And when you get an alert, investigate the *classifier* first, not the model pool. The classifier is where the architecture's accuracy comes from, and a degraded classifier looks identical, on the surface, to a healthy one with bad luck.

## 11-5 The TCO of building it yourself

The tiered architecture used a local Llama 3 for the simple tier. That implies a build decision — running your own inference — and the build decision is the component most commonly mis-priced.

The honest TCO for a modest local deployment isn't the GPU bill. An A10G-class GPU on demand runs around $2,200 a month. Engineering setup is forty hours at $150 an hour; amortized over twelve months, that's $500 a month. Monthly maintenance — eight hours of a senior engineer — is $1,200. Total: about $3,900 a month. The GPU bill is barely more than half the real cost.

And that's still not honest, because the list of things this TCO doesn't include is long. Latency: local CPU inference around 1,200ms versus GPT-4o's 800ms — the latency hit shows up in user retention rather than the AWS bill. The safety and reliability layer the API providers bundle — content moderation, jailbreak resistance, SLAs, incident response — that is multi-engineer-quarters of work to replicate in-house. Model update overhead, every time the open-source ecosystem moves. Burst capacity, which a single GPU does not have.

Now the breakeven question. At what request volume does the local TCO match the API cost? It's just division: monthly local TCO divided by (30 days × per-request API rate). For the simple-tier shape — 600 input tokens, 350 output tokens, against GPT-4o-mini's pricing — the per-request cost works out to about $0.0003. So breakeven at $3,900 monthly TCO is $3,900 / (30 × $0.0003), which comes out to about 433,000 requests per day for *that one tier alone*.

That's a much higher breakeven than the naive comparison suggests. And here's the part I want you to internalize, because it points at where the field is heading: *as API unit prices fall — and they have been falling — the breakeven volume for local deployment rises.* The case for building your own infrastructure gets *weaker* over time at fixed volume, not stronger. Local inference is sometimes cheaper, conditional on volume above breakeven, latency tolerance, team capability, and a data-privacy requirement that genuinely demands it. Any two of those failing usually reverses the decision.

Common misconception: "Local is always cheaper if you have the volume." It is not. Volume is one of four conditions, and the threshold moves under your feet.

## 11-6 Where the argument doesn't apply

Three architectures, one workload, two and a third times cheaper for the right architecture. The math is clean. I want to end where the argument has limits.

Tiered routing is dominant when the workload is bimodal. It's not dominant when the workload is uniform. If every request really is hard — a research-grade analysis tool, a legal-document deep-review system where simple queries don't exist — flat routing to a premium model is genuinely correct. The classifier has nothing useful to do. Conversely, if every request really is easy — a high-volume keyword classifier, a simple intent extractor — flat routing to a small model is correct, and tiering adds latency for no economic benefit. The chapter's argument is for the bimodal case, which is the *common* case for production agentic systems, but not the universal one.

There's also a residue I haven't solved, and I want to mark it. The fallback rate threshold above which a tiered router collapses to flat-cost-equivalent isn't a fixed number. The 15% I named is a rule of thumb. The actual threshold depends on the workload distribution, the per-tier price ratios, and the failure rates at each tier. There's a closed-form expression in there if you sit down and derive it carefully — I think it would be worth doing — but the more interesting version is *dynamic*: a monitoring system that computes the threshold continuously from observed traffic and alerts when the observed fallback rate is approaching it. I haven't seen that in a production deployment yet. I haven't built it either.

The thing I most want you to leave with is this. Architecture is the leverage point, not the model. Swap GPT-4o for some future model three orders of magnitude more capable, and if the system still routes flat, it will pay the same structural overhead — possibly more, because better models cost more. The failure surface grows with model capability rather than shrinking, because the same amount of simple work is being priced against a higher-capability model. Only a routing layer that reflects the workload's actual complexity distribution ever escapes that surface.

When teams reach for the vendor-comparison question — *should we use GPT-4o or Claude Sonnet?* — they are asking the wrong question. The question that would actually change their bill is *flat or tiered, and how is the classifier trained?* The first is a sub-question of the second. Getting them in the right order is the difference between a viable business and the $180,000 invoice that opened the chapter.

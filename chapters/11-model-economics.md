# Chapter 11 — Model Economics and the Build-or-Buy Decision

*GPT-4o, GPT-4o-mini, Tiered Routing, and the TCO of Local Deployment*

**Authors:** [Student A — TA to fill in], [Student B — TA to fill in]
**Editor:** Nik Bear Brown

---

## TL;DR

Model selection in production is not a vendor comparison — it is an architectural decision about which *complexity of task* gets which *tier of model*. A flat-routing architecture that sends every request to the best available model pays a predictable tax at scale (often 2–3× over tiered routing); the underlying mechanism is that real workloads are bimodal, and a router that separates easy from hard queries pays premium prices only on premium-worthy work.

---

## 11.1 The $180,000 mistake

The following scenario is a composite, grounded in post-incident patterns documented across several early-stage deployments; the specific company is not real, but the pattern has played out publicly more than once in YC-batch startups and enterprise POCs.

It was a Tuesday in week eight of a Y Combinator batch. The founding team of a B2B customer-support automation startup opened their AWS and OpenAI invoices expecting a bill near **$18,000**. They had modeled costs carefully before launch: 500,000 requests per day, average ticket context around 1,000 tokens, a mix of models. The math worked out — on paper.

The actual bill was **$183,200**.

Nobody had made an arithmetic error. Nobody had a bug. The system worked exactly as designed. Every incoming support ticket — *"How do I reset my password?"*, *"What are your refund policies?"*, *"Can you analyze our churn data and recommend a retention strategy?"* — had been routed to GPT-4o, the most capable model available. The team had made a deliberate architectural choice: use the best model, guarantee quality, don't risk a bad user experience on a cheaper option.

That architectural choice cost them **$104,550 more than necessary, every single month**.

Six weeks later, they rebuilt the routing layer. Simple lookup questions went to a locally hosted Llama 3. Standard explanation tasks went to GPT-4o-mini. Only genuinely complex, multi-step analytical requests went to GPT-4o. Next bill: **$79,200**. Same product. Same user base. Same number of requests. One architectural change. Roughly **$1.25 million saved per year**.

The lesson is not that GPT-4o is expensive. The lesson is that **the routing architecture is the leverage point — not the model you chose**. A team that optimizes model quality without building the routing layer has, by default, committed to paying premium prices on the majority of work that doesn't need premium capability. At 500K requests/day, "default" is measured in seven-figure annual overpayments.

That is the chapter's core argument. The rest of it is mechanism: *why* the bimodal shape of real workloads makes tiered routing the only architecture that survives at production scale, *what* the four-component tiered router looks like, *how* the classifier's accuracy floor determines whether the routing savings are realized, and *where* the build-or-buy decision for local deployment sits relative to all of that.

---

## 11.2 What you'll be able to do, and what you need first

This chapter is structured around the architectural decision — not the vendor comparison — and the exercises at the end are the check on whether the distinction has actually landed.

**Learning objectives.** By the end of this chapter you will be able to:

1. Compute per-day and per-month operating cost of flat vs. tiered routing under a specified workload distribution, including the failure-amplification component that unit-price calculations miss.
2. Explain the input/output pricing asymmetry on frontier APIs and identify which task shapes are disproportionately expensive because of it.
3. Design a two- or three-tier routing policy with an explicit classifier, deterministic dispatcher, fallback logic, and a monitored fallback rate as a first-class SLI.
4. Decompose Total Cost of Ownership into inference, retry, escalation, engineering, and operational components — and compute the breakeven volume above which local deployment wins.
5. Identify the workload shape (uniform-hard, uniform-easy, bimodal) under which each architecture is correct, and name the classifier-accuracy floor below which tiered routing collapses back to flat-cost-equivalent.

**Prerequisites.** You should have a working model of an agentic system — a language model, some tool-use loop, an orchestration layer that routes requests — from the earlier architecture chapters. You should be comfortable with the vendor pricing model (dollars per million input tokens, dollars per million output tokens) at the level of reading a pricing page without confusion. The arithmetic here is elementary; what it requires is discipline about which number you're computing, which is what Section 11.3 is for. If you're uncertain about the five context-failure modes from Chapter 9, that chapter is not strictly load-bearing here, but its central move — trace the failure to the layer of the architecture where it originated — is the same move this chapter makes for cost.

**Where this fits.** Chapter 14's dollar-per-decision framing is this chapter made operational: the *decision* is a task with a complexity class, and the dollar cost depends on the tier it was routed to. Chapter 15's trajectory metrics let you *measure* fallback amplification empirically rather than modeling it analytically. Chapter 18's security argument applies to the classifier itself — a router that can be tricked into misclassifying a hard task as easy is both an efficiency problem and an attack vector. Read this chapter for the architectural pattern; reach for the surrounding chapters to instrument and secure it.

---

## 11.3 Three words that each mean three things

Before the math, strip the vocabulary. Three terms wear multiple meanings in model-economics discussion, and conflating them is the single most common failure.

### "Cost"

Three distinct numbers are called "cost" in almost every conversation about model economics, and the first task of anyone reasoning about this is to know which one you're looking at.

- **Unit price.** Dollars per 1M input tokens and dollars per 1M output tokens. Published on the vendor's pricing page. As of late 2024, [OpenAI's GPT-4o was $2.50 per 1M input tokens and $10.00 per 1M output tokens; GPT-4o-mini was $0.15 and $0.60](https://openai.com/api/pricing/) — a 16.7× ratio on both sides. [Anthropic's Claude Sonnet and Haiku](https://docs.claude.com/en/docs/about-claude/pricing) split at roughly 3× on the same pricing-page discipline. Unit price is what the pricing page shows.
- **Invoiced cost.** What you pay at the end of the month. Unit price × tokens used × task count, including retries. A single failed request can easily cost 2–3× its unit price once escalation and re-prompting settle.
- **Total Cost of Ownership (TCO).** Invoiced cost plus engineering labor, infrastructure, on-call, failure remediation, latency's indirect cost (users abandoning flows, SLAs breached), and — for self-hosted deployments — GPUs, power, ops, model-update overhead. TCO is the only number that actually determines whether the system is sustainable. It is also the hardest to compute.

When someone says "cheaper," ask which one. A mini model is cheaper on unit price. Whether it's cheaper on invoiced cost depends on its retry behavior. Whether it's cheaper on TCO depends on how often its failures cause human remediation.

**Worked example — which cost are you looking at?** A team benchmarking GPT-4o-mini against GPT-4o on their own workload reports that mini is "16× cheaper, with only a 12% quality drop." A skeptical reading asks: cheaper on which number? If the 16× is unit price and the 12% quality drop translates to a 12% retry rate on the mini invoices — each retry costing roughly the same as the original call, and failed retries escalating to GPT-4o at full price — then the *invoiced* cost multiplier falls to roughly 8×, still substantial but not 16×. If, on top of that, the 12% of failures that can't be auto-repaired route to a human remediation queue at $3–5 per touch, the TCO multiplier falls further depending on volume. The benchmark number was not wrong. It was answering a different question than the one that determines whether to deploy.

### Input/output pricing asymmetry

One more unit-price detail matters before the arithmetic, because it colors *which* tasks are disproportionately expensive. Output tokens cost roughly **4× input tokens** on both GPT-4o and GPT-4o-mini (see ratios above). The mechanism: generating each output token requires the model to re-attend to the full context from scratch, so longer outputs cost superlinearly more than longer inputs. The practical implication: a request that produces 2,500 output tokens on GPT-4o costs about the same as a request that produces 10,000 *input* tokens. Tasks whose outputs are naturally long — long-form analysis, report generation, code scaffolding — are economically expensive in a way that their input sizes don't reveal.

This is why the workload distribution in §11.4 tracks input and output tokens separately. A workload that looks "small" on input can have a very different cost profile once the output shape is accounted for.

### "Performance"

Split the same way. *Benchmark performance* is what the vendor publishes — usually a score on MT-Bench, MMLU, HumanEval, or some internally-defined evaluation suite. *Task performance* is the agent's success rate on *your* workload, which is different because your workload isn't the benchmark. *Total performance* is task performance net of retries, escalations, and user-visible latency — what the user actually experiences.

The gap between benchmark and task performance is almost always larger than teams expect. Benchmarks are designed to be difficult and discriminating; production workloads are usually bimodal in the opposite direction (see below). A model that scores 85% on MMLU may succeed on 98% of password-reset questions and 60% of churn-analysis requests — both numbers are relevant, neither is the 85%.

### "Model choice"

In the naive framing, "which model?" is the question. In the architectural framing, the question is *which model for which task?* The naive framing produces a single decision. The architectural framing produces a **policy** — a function that maps tasks to models, with explicit rules for what happens when the chosen tier fails. That policy is what this chapter is actually about.

### The RouteLLM result

In July 2024, a team at LMSYS posted [*"RouteLLM: Learning to Route LLMs with Preference Data"*](https://arxiv.org/abs/2406.18665). The headline was two numbers that shouldn't both be true at once: a router deciding per query between GPT-4 and a cheaper open-source model delivered **85% cost reduction** while preserving **95% of GPT-4's quality** on [MT-Bench](https://huggingface.co/datasets/lmsys/mt_bench_human_judgments).

If GPT-4 were 20× better and 20× more expensive, you shouldn't be able to cut cost by 85% without losing much more than 5% of the quality. You would expect cost and quality to move together. They don't — not at the workload level. The resolution is the number the paper quietly assumes: **on MT-Bench, most queries don't need GPT-4**. A large majority can be handled by the cheaper model with no quality loss. A minority genuinely require the premium model. Telling them apart before you spend the money is the whole game.

Real workloads aren't uniform. They are **bimodal** — mostly easy, occasionally hard — and routing is the architecture that exploits the asymmetry. A team that doesn't build a router is not just forgoing an optimization. It is *choosing, by default*, to pay a single price for a mixed distribution of work.

The design philosophy here is worth stating plainly: when the workload's distribution is known to be bimodal, any architecture that *doesn't* reflect the distribution is systematically paying for quality that most of the workload doesn't use. The tiered router is not clever; it is just honest about what the workload actually looks like.

---

## 11.4 The mathematics and architecture of tiered routing

Section 11.3 established the vocabulary. This section makes the argument concrete with arithmetic at production scale, then describes the architecture that implements the argument.

### The workload

The profile below is a realistic enterprise-SaaS pattern: each ticket carries its conversation history, which inflates input tokens well above what a single user message would contain.

<!-- FIGURE: Bimodal workload distribution diagram. Three bars showing Simple (60%), Medium (30%), Complex (10%), with token profiles labeled on each. Caption: The bimodal shape that tiered routing exploits — a large majority of cheap work, a long tail of expensive work. -->

At 500,000 requests per day:

| Tier | Fraction | Example tasks | Avg input | Avg output |
|---|---:|---|---:|---:|
| Simple | 60% | Password resets, policy lookups, yes/no questions | 600 | 350 |
| Medium | 30% | Feature explanations, troubleshooting, comparisons | 2,000 | 1,000 |
| Complex | 10% | Churn analysis, architectural recommendations, custom integrations | 7,000 | 3,000 |

The weighted average is 1,660 input tokens and 810 output tokens per request. That's the number the chapter's cost arithmetic flows from.

### Flat routing to GPT-4o

The monthly cost formula:

<!-- LATEX: cost = RPD × days × (I/10^6 × P_in + O/10^6 × P_out) where RPD is requests per day, I and O are average input and output tokens, P_in and P_out are per-million-token unit prices -->

In prose: the monthly cost equals requests-per-day times days-per-month, times the sum of (input tokens per request, divided by a million, times input unit price) plus (output tokens per request, divided by a million, times output unit price). The division by a million is because vendor prices are quoted per million tokens.

Running the numbers at 500,000 req/day × 30 days × (1,660 in × $2.50/1M + 810 out × $10.00/1M):

15,000,000 × (0.00415 + 0.0081) = 15,000,000 × 0.01225 = **$183,750/month**

### Tiered routing

(Simple → local Llama 3, Medium → GPT-4o-mini, Complex → GPT-4o):

| Tier | Daily volume | Target model | Monthly cost |
|---|---:|---|---:|
| Simple | 300,000 | Local Llama 3 (A10G TCO) | $3,900 |
| Medium | 150,000 | GPT-4o-mini | $4,050 |
| Complex | 50,000 | GPT-4o | $71,250 |
| **Total** | 500,000 | — | **$79,200** |

Work through one row to see where the numbers come from. Medium at 150,000 × 30 × (2,000 in × $0.15/1M + 1,000 out × $0.60/1M) = 4,500,000 × 0.0009 = $4,050. Complex at 50,000 × 30 × (7,000 in × $2.50/1M + 3,000 out × $10/1M) = 1,500,000 × 0.0475 = $71,250. The Simple-tier $3,900 is a TCO figure for an A10G GPU running locally — unpacked in §11.5.

**Flat vs. tiered:** $183,750 vs. $79,200. **$104,550/month saved, $1.25M/year**, at roughly 2.3× cost reduction. Same model options. Same model quality. One architectural change — and the architectural change is the routing layer, not the model selection within any given tier.

### Reality check — why mini-only loses

A skeptical reader might ask: "If the cheap model works for 60% of tasks, why not use it for everything? Ship it cheap, accept the 40% quality hit on medium and complex tasks." The answer is the same math that makes flat GPT-4o expensive, run in the opposite direction. Mini-only at 500K req/day has very low unit-price cost — maybe $1,500/month for the Simple-tier queries it handles well — but the Medium and Complex queries it handles poorly generate failures, retries, and human-remediation costs that dominate the invoice. Once you price in $3/failure for light human remediation (a conservative rate for enterprise support), a mini-only policy with realistic per-tier failure rates lands near $90,000+/month — *more expensive than flat GPT-4o*, because it's paying the premium-model price via the human-repair backend.

The three-policy ranking at this scale:

| Policy | Direct cost | Residual-failure cost | **Total/month** |
|---|---:|---:|---:|
| Flat GPT-4o | $183,750 | ~$900 | **~$184,650** |
| Mini-only (no escalation) | ~$1,500 | ~$90,000+ | **~$91,500+** |
| Tiered (escalation on failure) | $79,200 | ~$1,300 | **~$80,500** |

Tiered wins at roughly 2.3× over flat and ~11× over mini-only *at failure-remediation-inclusive cost*. The unit-price-only ranking — which is what a naive team sees when it first compares vendors — is exactly backwards in the middle of the table.

The general principle: **any architecture that ignores the workload's complexity distribution pays for it in one currency or another.** Flat pays in unit price. Mini-only pays in failure-remediation cost. Tiered pays for routing overhead and classifier maintenance, which is much cheaper than either.

### The tiered router — four components

A production tiered router has four components. Each has its own failure mode; skipping or degrading any one of them converts the 2.3× savings back into a 2.3× overpayment.

**1. The complexity classifier — the leverage point.** The classifier decides which tier receives each request. It is the leverage point of the whole architecture: route correctly and every component runs efficiently; route wrongly and the fallback tax eats the savings regardless of which models you chose. Three constraints on any classifier design:

1. **Faster than the cheapest model it routes to**, or the latency savings are negative.
2. **Cheaper per classification than the savings per correct routing decision**, or the economics fail.
3. **Accurate enough that fallback rate stays below ~15%** (see fallback tax below).

Two common implementations:

- *Rule-based.* Token-length thresholds, keyword matches for complexity signals ("analyze," "design," "implement"), default fallback to Medium. Accuracy on held-out data: ~70%. Latency: microseconds. Cost: zero. Works when tasks have strong lexical signals.
- *ML-based (TF-IDF + logistic regression, or embedding-similarity).* A text classifier that scores short phrases by how distinctively they signal task complexity, trained on labeled examples. Accuracy: ~80% on a small training set, more with scale. Latency: ~2ms. Cost: zero for local inference. In production, 10,000+ labeled examples or an embedding-similarity approach (using `text-embedding-3-small` at $0.02/1M tokens — still 125× cheaper than GPT-4o input) is typical.

The right classifier depends on task distribution. Strong lexical signals → rule-based is sufficient. Semantically ambiguous tasks → ML-based is necessary. Starting rule-based and upgrading only when the fallback rate crosses a threshold is the standard progression.

**2. The router.** Deterministic dispatcher. Takes the classifier's tier prediction, selects the assigned model for that tier, issues the call. Not architecturally interesting on its own, but its role as the single routing point means it's also the right place to enforce policy: rate limits, user-class overrides, compliance restrictions on which tasks can hit which models.

**3. The model pool.** The set of models available. For the $180K → $79K example: one local Llama 3 (Simple), one GPT-4o-mini (Medium), one GPT-4o (Complex). In larger systems, two or three models per tier for availability and A/B testing. The model pool itself is not the architecture; it's the set of options the architecture picks from.

**4. Fallback logic — the canary in the cost mine.** Fallback logic exists for two reasons. *Availability* — if the assigned model is unavailable, escalate to the next tier. *Quality* — if the assigned model produces output below threshold, escalate. The quality case is the more common one and the more subtle one, because it requires the router to have some signal about whether an output is good enough. In practice, this is often a combination of structural validators (did the response contain a valid JSON response, did it pass a format check) and a small downstream quality-classifier call.

Escalation is correct because a degraded response from a cheaper model is typically worse than a slightly more expensive response from a better one — the downstream cost of a bad answer to a customer exceeds the marginal cost of a GPT-4o call.

The **fallback tax** formula captures the economic effect:

<!-- LATEX: effective_cost = tier_cost + f × next_tier_cost, where f is the fraction of requests in that tier that escalate -->

In prose: the effective cost per tier equals the base cost at that tier plus the fallback fraction times the cost of the tier you escalate to. At f = 0.05, the fallback tax is small; at f = 0.15, it's material; at f = 0.50+, the tier has collapsed and the architecture is a tiered router in name only. Treat **fallback rate as a first-class SLI**: below 5% is healthy, above 15% is an architectural incident that calls for classifier inspection *before* model inspection.

### A minimal simulator

```python
# The three-policy comparison in thirty lines, honest about failure cost.
TASKS_PER_DAY = 500_000
DAYS = 30
DIST = {"simple": 0.60, "medium": 0.30, "complex": 0.10}

# Per-request cost (input + output token sizes × pricing), simplified.
PER_REQ_COST = {
    "gpt-4o":       {"simple": 0.00635, "medium": 0.0130, "complex": 0.0475},
    "gpt-4o-mini":  {"simple": 0.00030, "medium": 0.00090, "complex": 0.00285},
    "local-llama3": {"simple": 0.00026, "medium": 0.00026, "complex": 0.00026},  # amortized TCO
}
FAILURE_RATES = {
    "gpt-4o":       {"simple": 0.001, "medium": 0.010, "complex": 0.050},
    "gpt-4o-mini":  {"simple": 0.010, "medium": 0.070, "complex": 0.300},
    "local-llama3": {"simple": 0.020, "medium": 0.250, "complex": 0.600},
}
FAILURE_COST = 3.00  # $/residual human-remediation touch

def monthly_cost(routing):
    """routing: dict mapping tier -> model"""
    total = 0
    for tier, frac in DIST.items():
        n = TASKS_PER_DAY * frac * DAYS
        model = routing[tier]
        base = n * PER_REQ_COST[model][tier]
        fail = n * FAILURE_RATES[model][tier]
        # On failure, escalate to premium (or eat the residual failure cost).
        escalate_cost = fail * PER_REQ_COST["gpt-4o"][tier]
        residual_fail = fail * FAILURE_RATES["gpt-4o"][tier]
        total += base + escalate_cost + residual_fail * FAILURE_COST
    return total

FLAT   = {"simple": "gpt-4o",       "medium": "gpt-4o",      "complex": "gpt-4o"}
MINI   = {"simple": "gpt-4o-mini",  "medium": "gpt-4o-mini", "complex": "gpt-4o-mini"}
TIERED = {"simple": "local-llama3", "medium": "gpt-4o-mini", "complex": "gpt-4o"}
```

Run these against the distribution and you get the table above. Vary the failure rates, escalation policy, or distribution and the ranking shifts in predictable directions. The simulator is a three-parameter sensitivity analysis more than a model of a specific deployment; it's the tool for asking *when* tiered is right, not for claiming it always is.

---

## 11.5 TCO and the hosted-vs-local decision

The tiered architecture above uses a local Llama 3 for the Simple tier. That implies a build decision — running your own inference — which has its own cost structure, and it is the component most commonly mis-priced.

### What TCO actually includes

The server bill is not the TCO. The honest TCO for a local deployment at modest scale — an A10G-class GPU running on-demand — looks something like:

| Component | Monthly cost |
|---|---:|
| GPU server (A10G, on-demand cloud) | $2,200 |
| Engineering setup (40h × $150/h, amortized over 12 months) | $500 |
| Monthly maintenance (8h × $150/h) | $1,200 |
| **TCO** | **$3,900/month** |

The engineering setup line is the one teams routinely omit. Forty hours at $150/h is $6,000 in up-front cost; amortized over twelve months it's $500/month. That amortization is itself an assumption — if the deployment is replaced in four months because the team hit a scaling wall, the true monthly amortized cost was $1,500, not $500. TCO is honest only when the amortization window matches the realistic useful life of the deployment.

What TCO does *not* yet include, and should:

- **Latency impact on user retention.** Local inference on CPU: ~1,200ms; GPT-4o API: ~800ms. A 50%+ latency hit has a real cost in user flows, one that shows up in session completion rates rather than the AWS bill.
- **The safety and reliability layer** that OpenAI and Anthropic provide — content moderation, jailbreak resistance, SLAs, incident response. Replicating these in-house is a multi-engineer-quarter project that doesn't appear in the GPU line item.
- **Model update overhead** as open-source models evolve. Every version upgrade is an eval cycle and potentially a prompt-harness migration. In a moving ecosystem, this cost is recurring and non-trivial.
- **Burst capacity.** A single GPU has fixed throughput. Traffic spikes queue or fail. API providers scale automatically. The cost of a capacity incident — a product launch day where inference is the bottleneck — is rarely priced into the TCO spreadsheet until after the incident.

A team that compares the $2,200 GPU bill to the API rate and concludes local is cheaper at 20,000 req/day *without* adding these components is making the failure mode this section is designed to prevent.

### The breakeven formula

At what request volume does a local TCO match API cost?

<!-- LATEX: V_breakeven = C_local / (30 × rate_per_request_api), where C_local is monthly TCO and rate_per_request_api is the per-request API cost -->

In prose: the breakeven request volume per day equals monthly local TCO divided by (30 days times the per-request API rate). Below the breakeven, the API wins on TCO. Above it, local wins — *if* all the hidden costs listed above are genuinely accounted for.

**Worked example — breakeven for Simple-tier queries.** Take the Simple-tier profile from §11.4: 600 input tokens, 350 output tokens per request. Against GPT-4o-mini at $0.15/1M input and $0.60/1M output, per-request cost is 600 × $0.15/1M + 350 × $0.60/1M = $0.00009 + $0.00021 = $0.0003 per request. (A tighter estimate than the $0.0000875 in the source note, because this traces the token shape explicitly.) Breakeven at $3,900 monthly local TCO: $3,900 / (30 × $0.0003) ≈ 433,000 req/day. That is a much higher breakeven than the naive "just compare the GPU bill to the API rate" arithmetic would produce. The lesson is that as API unit prices fall — and they have been falling — the breakeven volume for local deployment rises, meaning the case for local gets *weaker* over time at fixed volume, not stronger.

A decision matrix for per-tier model selection:

| Criterion | GPT-4o | GPT-4o-mini | Local |
|---|---|---|---|
| Task complexity | High | Medium | Low |
| Latency SLA | Flexible (>500ms OK) | Strict (<300ms) | Very strict OR not critical |
| Volume | Any | Any | > breakeven_V/day |
| Data privacy | Tolerant | Tolerant | Sensitive |
| Team capability | Standard | Standard | MLOps team available |

The right choice is rarely one model for all tasks. It is the matrix applied per tier, with the tiered architecture above as the policy layer that wires it together.

**Common misconception.** "Local is always cheaper if you have the volume." It is not, because the volume threshold moves as API prices fall and as the hidden TCO components rise with deployment complexity. The correct framing: local is sometimes cheaper, conditional on (a) volume above breakeven, (b) latency tolerance, (c) team capability, and (d) data-privacy requirements that actually demand it. Any two of these failing usually reverses the decision.

---

## 11.6 Integration — failure modes and design principles

Sections 11.3 through 11.5 gave you the vocabulary, the math, and the build-or-buy decision. This section is where they combine into a usable architectural discipline: three failure modes that map to three violations of the principles, and a worked example that traces a production scenario end to end.

### The three failure modes

**1. Flat routing (over-routing).** No classifier, no router. Every request goes to GPT-4o because "we can't risk quality." The $180K YC scenario is exactly this failure. Detection signal: cost-per-request stays flat as volume grows instead of decreasing; no tier distribution in routing logs; system is technically correct but economically broken. Principle violated: *Route by complexity, not by default.*

**2. Under-routing and the fallback tax.** The router exists but the classifier is degraded — trained on unbalanced or mislabeled data, or the underlying distribution has drifted since training. Most Medium and Complex tasks get routed to the Simple tier; the quality threshold triggers escalation; the fallback tax dominates the invoice. In a worst case, a classifier with ~63% fallback rate on a 500K/day workload can drive effective cost to roughly $42,000/month — materially more than a clean tiered system's $79K, but *worse*, because the team believes it has a cheap tiered architecture. The detection signal is `fallback_rate` — treat anything above 15% as an architectural incident, and investigate the classifier before you investigate model availability. Principle violated: *Classifier accuracy floor = cost ceiling.*

**3. TCO miscalculation.** The team compares GPU server cost against API pricing, ignores engineering time and maintenance, and concludes local is cheaper at a volume where it isn't. Six months later, a model update cycle, an inference-server tuning incident, and a senior ML engineer's 40 hours reveal the hidden cost. The rule: never use server cost alone for the build-or-buy decision. Use a TCO function that includes engineering hours at your team's fully-loaded rate, and run it *before* the decision commits. Principle violated: *TCO includes human time — always.*

### The five design principles

1. **Route by complexity, not by default.** The default — flat routing to the best model — is the most expensive architectural choice at scale. Default to tiered; escalate to flat only when routing overhead exceeds savings.
2. **Classifier accuracy floor = cost ceiling.** A degraded classifier with high fallback rate can spend more than flat GPT-4o. Full savings only arrive when fallback stays below ~15%.
3. **Fallback logic is not optional at production volume.** A tiered router without fallback is a single point of failure. Design fallback from day one.
4. **TCO includes human time — always.** Engineering setup, monthly maintenance, and model-update overhead are the hidden costs. Use a TCO function, not the GPU bill.
5. **Fallback rate is a first-class SLI.** Instrument it. Alert on it. Investigate it before anything else.

### Putting it all together — a production scenario

Consider a deployment with the following characteristics: 800K requests/day; workload 50/35/15 across Simple/Medium/Complex (slightly more complex-skewed than the hook); strict latency SLA of <400ms for the Simple tier because the product is a real-time customer assistant; moderate data-privacy requirements (no PII flowing through third-party APIs).

Apply the chapter:

- *Volume check.* 800K/day is above the Simple-tier breakeven for local deployment (~433K/day at Simple-tier pricing from §11.5). Local is volume-eligible.
- *Latency check.* Simple-tier SLA of <400ms — a local inference at ~1,200ms fails this. Local is volume-eligible but latency-ineligible for Simple tier. GPT-4o-mini at 200-300ms typical latency becomes the Simple-tier model.
- *Privacy check.* Moderate — no PII to third parties. PII-containing requests need routing to a separate local model even at higher TCO; a secondary classifier on PII-presence is added to the architecture.
- *Complex tier.* 15% of 800K is 120K Complex requests/day. At GPT-4o Complex-tier pricing (roughly $0.0475/request), that's ~$171K/month on Complex alone. The architectural question: is there a routing refinement within Complex that pushes some fraction to GPT-4o-mini-with-escalation? A Complex-tier classifier trained on just that tier might identify 30-40% of Complex requests as "complex-but-structurable" — long inputs with schema-able outputs, which mini handles adequately. If that sub-routing works with fallback rate under 10%, Complex-tier cost drops to roughly $120K/month. Same argument recursively.

This is the architectural discipline in action: the five principles drive a series of questions, each of which maps to a specific component of the four-component router. The point is not that the answer is always "tiered wins 2.3×." The point is that the answer comes from tracing the workload shape through the matrix, not from picking a model and hoping.

---

## 11.7 Exercises

For each exercise, the learning objective it tests is noted in parentheses, along with an approximate difficulty. Solutions are not included inline — work them through, check your reasoning against the chapter's definitions, and flag any you're uncertain about for discussion.

### Warm-up

**Exercise 1.** *(Objective 1, Easy.)* Using the monthly-cost formula from §11.4, compute flat-routing monthly cost for a workload of 100,000 requests/day with average input 1,200 tokens and average output 400 tokens, routed entirely to GPT-4o-mini. Show the arithmetic step by step: tokens in, tokens out, unit-price contributions, total. Then recompute on GPT-4o and state the ratio.

**Exercise 2.** *(Objective 2, Easy.)* Two tasks have the same total token count: Task A has 5,000 input tokens and 500 output tokens; Task B has 500 input tokens and 5,000 output tokens. Compute the GPT-4o cost for each, and state the ratio of B to A. Explain in two sentences what the ratio tells you about the types of tasks most affected by the input/output pricing asymmetry.

**Exercise 3.** *(Objective 5, Easy.)* For each of the following workload shapes, name the routing architecture (flat-to-premium, mini-only, or tiered) that is most likely to be economically correct, and state the reason in one sentence: (a) 10,000 requests/day, all requiring deep multi-step reasoning over long documents; (b) 10,000,000 requests/day, all simple yes/no classification questions; (c) 500,000 requests/day, 70% simple lookups and 30% complex analysis.

### Application

**Exercise 4.** *(Objective 3, Medium.)* A company is currently on flat routing to GPT-4o at 250,000 requests/day, with the workload distribution 70/25/5 (Simple/Medium/Complex). Design a tiered architecture: specify which model goes to each tier, what type of classifier you'd build for the first version (rule-based or ML-based, and why), what validator or signal you'd use for fallback escalation, and what monthly cost savings you project. Show your arithmetic.

**Exercise 5.** *(Objective 4, Medium.)* A team has proposed a local deployment with the following TCO sheet: GPU server $1,800/month, power $200/month, monitoring tools $150/month — total $2,150/month. Identify at least four components missing from this TCO that the chapter flags as commonly omitted, estimate a monthly cost for each based on a mid-sized team's rates, and compute a revised TCO.

**Exercise 6.** *(Objective 4, Medium.)* Using the breakeven formula from §11.5, compute the breakeven daily request volume for the following cases: (a) local TCO $3,900/month, API cost $0.0003/request (Simple-tier on GPT-4o-mini from the chapter); (b) local TCO $8,000/month (a more capable GPU with more engineering overhead), API cost $0.0475/request (Complex-tier on GPT-4o). Compare the two breakevens and explain in one sentence why the breakeven is so much lower for the Complex case.

**Exercise 7.** *(Objectives 1 and 3, Medium.)* Referring to the three-policy table in §11.4, write a one-paragraph explanation you could give to a non-technical founder of *why* mini-only ends up more expensive than flat GPT-4o at 500K requests/day. Do not use the words "retry" or "fallback" in the explanation; describe the mechanism in business terms (what is failing, what it costs, who pays).

### Synthesis

**Exercise 8.** *(Objectives 3 and 5, Hard.)* Design a complete routing architecture for a legal-document analysis agent with the following specification: 50,000 requests/day; workload distribution 20% simple clause-extraction, 50% medium cross-document comparison, 30% complex analytical synthesis; strict data-privacy requirements (some documents cannot leave the client's infrastructure); no latency SLA (batch-acceptable for many requests). Specify for each tier: target model (including local vs. hosted), classifier type, fallback policy, and expected monthly cost. Flag any failure modes from §11.6 your design could be vulnerable to and how you'd instrument for them.

**Exercise 9.** *(Objective 3, Hard.)* A deployed tiered router has been in production for four months. Over the last three weeks, the Simple-tier fallback rate has drifted from 8% to 23%. Cost-per-request has risen roughly 40% despite no change to the model pool or pricing. Walk through the diagnostic sequence the chapter prescribes — which component do you investigate first, second, third, and why — and list the three most likely root causes, in order of probability. (The chapter's answer to "investigate classifier before model" is the hinge.)

**Exercise 10.** *(Objective 5, Hard.)* Argue whether flat routing to a premium model can ever be the economically correct architecture, and specify the conditions under which it would be. Your answer should include: (a) the workload-shape condition, (b) the volume condition, (c) the latency or compliance condition, and (d) an explicit example of a real-world deployment type for which flat routing is likely correct.

### Challenge

**Exercise 11.** *(Whole chapter, Challenge.)* The chapter's "Still puzzling" section asks how to compute the classifier's fallback-rate threshold — the fraction f at which tiered routing collapses to flat-cost-equivalent — *dynamically*, as a function of workload distribution and per-tier pricing. Derive a closed-form expression for that threshold given the chapter's cost model (base tier cost, next-tier cost, fallback fraction). Then: describe a monitoring architecture that computes this threshold continuously from observed workload and triggers an alert when the observed fallback rate approaches it. What data does the monitoring system need that a typical production logging setup doesn't provide?

**Exercise 12.** *(Objective 5, Challenge.)* The chapter argues bimodal workloads make tiered routing the dominant architecture at scale. Construct a specific, realistic workload distribution for which flat routing to a premium model is strictly cheaper than any tiered policy that would plausibly be implemented. Your construction should specify: request volume, complexity distribution, per-tier failure rates under tiered routing, and fallback behavior. Then argue what the existence of such a distribution tells you about the *limits* of the tiered-routing argument — is the chapter's claim "tiered is always dominant at scale" strictly true, or is it a strong default that admits exceptions? Defend your answer with reference to the arithmetic.

---

## 11.8 Chapter summary

By the end of this chapter, you should be able to do the following that you could not do at the start.

You can *distinguish the three numbers* people call "cost" — unit price, invoiced cost, TCO — and know which one answers the question you are actually asking. You can compute each of them, for flat and tiered architectures, from workload distribution and pricing inputs. You can read a benchmark result like RouteLLM's "85% cost reduction, 95% quality" and recognize that the gap is evidence of a bimodal workload, not a magic trade-off.

You can *design a tiered router*: a complexity classifier, a deterministic dispatcher, a model pool, and fallback logic — and explain why each component exists, which failure mode it prevents, and how to instrument it. You can state the accuracy floor below which the architecture collapses, and the fallback-rate threshold at which a production deployment has degraded into a tiered router in name only.

You can *compose the build-or-buy decision* for local deployment: compute an honest TCO including engineering setup and ongoing maintenance, find the breakeven request volume above which local wins over hosted, and flag the four or five components (latency, safety, model-update overhead, burst capacity) that teams routinely omit from the spreadsheet.

The one idea from this chapter that matters most: **architecture is the leverage point, not the model**. Swap GPT-4o for a future model three orders of magnitude more capable, and if the system still routes flat, it will pay the same structural overhead — possibly more, because better models cost more. The failure surface grows, not shrinks, as the model improves, because the *same amount of simple work* is being priced against a *higher-capability model*. Only a routing layer that reflects the workload's actual complexity distribution ever escapes that surface.

The common mistake to watch for: **reaching for the vendor-comparison question instead of the architecture question**. Teams ask "GPT-4o or Claude Sonnet?" when the question that would actually change the bill is "flat or tiered, and how is the classifier trained?" The former is a sub-question of the latter. Getting them in the right order is the difference between a viable business and the $180K invoice.

The Feynman test for this chapter: can you explain to a non-technical founder, in a single paragraph and without the words "retry" or "fallback," *why* mini-only routing at 500K req/day ends up more expensive than flat routing to the premium model? A clean answer names the mechanism — some fraction of tasks the cheap model can't handle, the cost of handling them wrongly, who pays that cost — in business terms. That's Exercise 7, and it is the exercise the chapter's argument most depends on you being able to do.

---

## 11.9 Connections forward

The architectural discipline developed in this chapter is load-bearing for the reliability and security chapters ahead.

Chapter 14's dollar-per-decision framing is this chapter made operational: the *decision* is a task with a complexity class, and the dollar cost depends on the tier it was routed to. A team that internalizes Chapter 11 before reading Chapter 14 will find Chapter 14's cost-attribution math intuitive; a team that skips this chapter will struggle to decompose a decision's cost into its tier, retry, and escalation components.

Chapter 15's trajectory metrics let you *measure* fallback amplification empirically rather than modeling it analytically. This chapter's fallback-tax formula is an approximation that assumes a clean escalation ladder; real trajectories are messier, with multi-hop retries and partial successes that the formula abstracts over. Pair this chapter's arithmetic with Chapter 15's instrumentation for the grounded answer on real workloads.

Chapter 18's security argument applies to the classifier itself. A complexity classifier that can be tricked into routing a hard task to a weak model is both an efficiency problem (fallback tax) and an attack vector (adversarial under-routing, a form of denial-of-service against the Complex tier's capacity). The structural separation discipline in Chapter 18 — don't let adversarial input alter routing decisions — is the same discipline that prevents a sophisticated user from gaming the classifier into skipping expensive paths.

The larger arc: if the book's earlier chapters established what an agent is and how its context fails, this chapter establishes what an agent costs and why the cost structure is fundamentally architectural. Every subsequent chapter on deployment, scaling, and operations builds on the assumption that you have internalized the architecture-before-vendor framing. Agents are economic systems; their economics are determined by their routing architecture; the routing architecture is the thing you actually get to design.

---

**What would change my mind:** A well-documented production deployment that maintained competitive total cost using flat routing to a frontier model, at volumes above ~100K requests/day with bimodal workload complexity, over a 12-month window. The chapter's claim is that bimodal workloads make tiered routing the dominant architecture at scale; a clean counter-example would force a sharper specification of the conditions — probably around latency SLAs or compliance — under which flat routing is genuinely cheaper.

**Still puzzling:** How to compute the classifier's fallback-rate threshold (the f at which tiered collapses back to flat-cost-equivalent) *dynamically*, as a function of workload distribution and per-tier pricing. The static 15% rule of thumb is a reasonable starting point; a principled version would compute the crossover point per deployment and alert when observed fallback approaches it. Exercise 11 is the invitation to the reader to solve this one.

---

**Tags:** tiered-model-routing, model-economics-at-scale, fallback-tax, tco-local-deployment, routellm-bimodal-workload

# Chapter 29 — Case: CostSherlock

*A four-agent pipeline that distinguishes correlation from causation in AWS cost-anomaly investigation — using a controlled vocabulary of rule-out categories to make "I don't know" a first-class verdict.*

**Authors:** Vatsal Naik, Priti Ghosh
**Editor:** Nik Bear Brown

---

## Situation

An AWS bill spikes by $336 a day. The on-call engineer opens Cost Explorer, sees an anomaly on EC2, opens CloudTrail, sees twenty events in the same time window, and faces the diagnostic problem the chapter is about: which of those events *caused* the spike, and which are temporally proximate but causally irrelevant — *red herrings*. A `ModifyInstanceAttribute` event for tag changes happened five minutes before the cost increase. So did `RunInstances` calls for twenty `c5.2xlarge` machines. Both events look suspicious. Only one of them is causal. The team that asks ChatGPT to investigate the bill receives a fluent paragraph that may or may not name the right event, and may or may not distinguish *temporally adjacent to* from *responsible for*. The cost of getting it wrong is procedural: a bill investigation that pursues the wrong root cause closes the ticket, gets reopened next month when the same spike recurs, and leaves the actual lifecycle-policy or NAT-gateway misconfiguration silently driving cost. CostSherlock is a four-agent pipeline that investigates AWS cost anomalies with explicit machinery for distinguishing correlation from causation.

## Architecture

Four agents, sequential. **Sentinel** detects anomalies in cost data via z-score analysis on the time series, surfacing dates and services where deviation crosses threshold. **Detective** correlates suspect [CloudTrail](https://aws.amazon.com/cloudtrail/) events within the anomaly time window — every API call recorded by CloudTrail that happened in the spike window becomes a suspect record, ranked by recency and service alignment. **Analyst** is the causal-reasoning agent: receives the anomaly metadata, the ranked suspects, and the top-8 chunks retrieved from the RAG knowledge base, and produces hypotheses with quantitative cost-attribution math. **Narrator** generates the final cited investigation report.

The RAG knowledge base is 50 AWS-pricing-and-troubleshooting documents organized into three groups: 20 Service Pricing docs (per-service pricing with specific dollar amounts), 15 Cost Trap Patterns (known patterns that cause unexpected cost spikes — `cost_trap_nat_gateway.md`, `cost_trap_lifecycle_disabled.md`), 15 Troubleshooting Guides (diagnostic checklists per service). Chunking uses `RecursiveCharacterTextSplitter` with `chunk_size=500` tokens and `overlap=50`, with separators prioritizing markdown headers (`##`, `###`) to keep pricing tables intact. Embeddings come from `sentence-transformers/all-MiniLM-L6-v2` (local, zero API cost) and persist in ChromaDB. Top-8 retrieval by cosine similarity, with optional `service_mentioned` metadata filter when the anomaly service is known.

The interactive Streamlit dashboard offers five views: Timeline, Live Investigation, Evidence Explorer, Compare, Feedback.

## Design rationale

The architectural commitment that earns the system's name is the **Analyst system prompt's six rules**, each of which closes a specific failure mode the chapter has been naming. Rule 1 — *every claim must cite a specific CloudTrail event or pricing document* — closes ungrounded reasoning. Rule 2 — *quantitative cost calculations are mandatory; the model must show units × price = cost and compare against the observed delta* — closes the failure where the model produces a plausible cause that doesn't actually account for the magnitude of the spike. Rule 3 — *correlation does not equal causation; temporally proximate events are not automatically causal* — names the central diagnostic discipline as a prompt rule. Rule 4 — *the model must use a controlled vocabulary of 12 root cause categories* — closes label-drift across investigations. Rule 5 — *every suspect not selected must be explicitly ruled out with a category (`WRONG_MECHANISM`, `WRONG_MAGNITUDE`, `TEMPORAL_ONLY`, ...)* — turns rule-out reasoning into structured output rather than tacit dismissal. Rule 6 — *if no suspect plausibly explains the delta, return `INSUFFICIENT_EVIDENCE` rather than guessing* — preserves the UNCERTAIN state Chapter 7 argued is non-negotiable.

The **worked example in the prompt** is the second consequential design move. The system prompt includes a labeled comparison between a `PutBucketPolicy` event (which changes access permissions, not storage pricing) and a `PutBucketLifecycleConfiguration` event (which directly affects storage class transitions and cost). The Analyst is shown — in the prompt itself — the exact failure mode the deployment most needs to avoid: *the wrong-mechanism rule-out*. A naive system would associate any temporally proximate S3 API call with an S3 cost anomaly. The worked example shows the model how to reason about *whether the mechanism of the suspect event matches the kind of cost change observed*. This is prompt engineering doing the load-bearing work the chapter named.

The **Narrator's 85% citation-density requirement** is the third move. The 7-section report structure (Executive Summary / Root Cause Analysis / Cost Breakdown / Evidence Chain / Ruled Out / Remediation / Confidence & Caveats) ships with a measurable citation density: at least 85% of factual sentences must contain a `[CloudTrail: event-id]` or `[Pricing: doc-name]` tag. The prompt includes a worked example contrasting a properly cited paragraph with an uncited one. This makes the citation discipline measurable rather than aspirational — a downstream check can verify the density and flag reports that fall below the threshold.

## Trade-offs

The four-agent decomposition trades end-to-end latency for diagnostic transparency. The Analyst's 800-token system prompt is a real maintenance surface — adding a new root-cause category requires updating the prompt, the worked example, and the Narrator's downstream consumption. The 50-document knowledge base is curated rather than auto-extracted from AWS docs; broader coverage would require an ingestion pipeline. Synthetic anomaly injection covers seven canonical scenarios (EC2 compute spike, S3 lifecycle disabled, CloudWatch logging verbosity, NAT Gateway, RDS reserved-instance expiry, Lambda timeout, EBS orphaned volumes); this is a reasonable starting harness and not yet a comprehensive evaluation suite.

## Outcomes and revisions

Synthetic anomaly suite — seven labeled cases with deliberately injected red herrings:

| # | Service | Anomaly | True cause | Red herring |
| --- | --- | --- | --- | --- |
| 1 | EC2 | Compute spike $336/day | 20 `c5.2xlarge` launched | `ModifyInstanceAttribute` |
| 2 | S3 | Storage spike $167/day | Lifecycle policy disabled | `PutBucketPolicy` |
| 3 | CloudWatch | Logging spike $52/day | Debug verbosity enabled | — |
| 4 | VPC | NAT Gateway $135/day | NAT Gateway created | — |
| 5 | RDS | Instance spike $175/day | Reserved instance expired | `CreateDBSnapshot` |
| 6 | Lambda | Duration spike $73/day | Timeout changed to 900s | — |
| 7 | EBS | Volume spike $46/day | Orphaned volumes | — |

Cases 1, 2, and 5 are the discriminating tests — each contains a plausible-looking red herring whose mechanism does not match the cost change. The Analyst's controlled-vocabulary rule-out (`WRONG_MECHANISM`) is what the system depends on to correctly route the diagnosis to the actual cause. Total LLM cost per investigation: ~3,000-4,000 tokens for the Analyst, ~600 for the Narrator, with `tenacity` retry and exponential backoff (3 attempts) handling rate limits. The most consequential planned revision is broadening the synthetic harness beyond seven cases to a labeled production-anomaly corpus, plus introducing a Causal Reasoner secondary check that runs the rule-out vocabulary on the Analyst's selected hypothesis before the Narrator generates the report.

## Pattern connection

CostSherlock instantiates Chapter 7's Fact Check List Pattern (citation enforcement at 85% density, INSUFFICIENT_EVIDENCE as first-class output) and a smaller pattern worth naming: **structured rule-out as adjudication output**. When the diagnostic task involves selecting one cause from a set of suspects, requiring the model to *explicitly* rule out the unselected suspects — with a category — is what prevents the failure mode where the model picks a cause and silently leaves the alternatives uncommented.

## Transfer prompt

In your own diagnostic system, when the model selects one cause from a set of candidates, does the output explicitly rule out the others — with a category — or does it silently dismiss them? When the model's reasoning rests on temporally adjacent events, what mechanism in your prompt forces the model to reason about whether the *mechanism* of the candidate cause matches the *kind* of effect observed? When no candidate plausibly explains the observed effect, what does your system return — *INSUFFICIENT_EVIDENCE* or a confident wrong answer?

---

*Spring 2026.*


---

## A note about AI

CostSherlock is a cost-analysis agent. The model can produce cost estimates fluently and is poorly calibrated about the volatility of real cost data.

Where the model genuinely helps: structuring cost categories and surfacing typical cost-overrun patterns.

Where the model does damage: producing specific cost numbers. The numbers come from contracts, invoices, and quotes — none of which the model has.

The rule: structure from the model; numbers from primary documents.

---

## AI Wayback Machine

**Eli Goldratt** was physicist-turned-management-theorist who built the Theory of Constraints — a framework for diagnosing cost and throughput bottlenecks.

**Run this:**

```
Who is Eli Goldratt, and how does their work connect to the cost analysis agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Eli Goldratt"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Eli Goldratt's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Eli Goldratt's framework."

What changes? What gets better? What gets worse?

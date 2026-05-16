# Chapter 3 — Five Patterns, Five Trade-offs

*How the architecture you choose determines what breaks — not the model you use*

**Author:** Vrushti Nilesh Shah

---

> **Core Claim**: Reasoning pattern selection is the highest-leverage architectural decision in agentic system design because it determines the fundamental trade-off structure between accuracy, latency, token cost, and predictability. The five mainstream patterns — ReAct, Plan-and-Execute, ReWOO, Reflection, and Tree-of-Thoughts — are not interchangeable quality levels; they are specialized instruments for qualitatively different problem types. The same model, given the same task, will succeed or fail depending entirely on the reasoning architecture you build around it.

---

## The Scenario

At 2:47 on a Tuesday afternoon in November, a customer named Priya opened a support chat with her telecommunications carrier. She had one question: why had her bill increased by $34 this month? She had asked the same question the previous month, received a credit, and had been told the issue was resolved.

The company's production support agent — call it Helios — was a ReAct-pattern system deployed nine months earlier after a successful pilot. In the pilot, Helios had handled billing inquiries with 91% first-contact resolution. Customer satisfaction scores were up. Escalation rates were down. The team was proud of it.

Helios began Priya's session by calling the `get_account_summary` tool. That tool returned 1,800 tokens of account metadata: plan details, promotional discount schedules, previous credit history, and device payment status. Helios parsed the output, reasoned over it in the scratchpad, and determined that the most likely cause of the increase was an expired promotional discount. It called `get_billing_detail` to confirm. That tool returned another 2,200 tokens: a line-itemized breakdown of the current invoice, the prior invoice, and a partial history of changes over the past six months.

Helios was now 4,000 tokens into its context. Its scratchpad — the internal chain-of-thought trace sitting inside the same context window — had grown by another 600 tokens across two reasoning steps. The system was at roughly 4,600 tokens of used context out of a configured maximum of 8,192.

The reasoning in the scratchpad was correct so far. The promotional discount had expired. But there was a second issue: a device installment plan had also quietly rolled over from a subsidized to an unsubsidized tier in the same billing cycle — a coincidence that together explained the full $34 discrepancy. Helios called `get_device_payment_schedule` to investigate. That tool returned 3,100 tokens.

The context window was now at 7,700 tokens. The system had 492 tokens remaining for reasoning and response generation.

What happened next is the mechanism this chapter is built around. Helios did not crash. It did not throw an error. It did not tell Priya that something had gone wrong. It generated a response. That response correctly identified the expired promotional discount as the cause of a $17 increase and issued a courtesy credit — and said nothing about the device payment tier change, which explained the other $17. The response was fluent, apologetic, and confidently incomplete.

Priya thanked the agent and closed the chat. The underlying issue was unresolved. She would call again the following month, and the month after that, until a human escalation agent reviewed the account history and noticed, with some frustration, that Helios had encountered and half-solved this problem three times.

The postmortem lasted two hours. The team examined the logs and confirmed that the tool outputs were accurate. The reasoning steps were valid. The model had not hallucinated. Every individual action Helios had taken was technically correct. And yet the system had delivered a wrong answer — not because it reasoned poorly, but because the architecture it was built on had a structural failure mode that no one had characterized before deployment.

This is not a story about a bad prompt. It is not a story about a poorly calibrated model. It is a story about reasoning architecture.

---

## Why Architecture Shapes the Failure

To understand what went wrong with Helios, you need a precise mental model of what ReAct actually is — not a description of it, but a mechanistic account of how it uses memory and why that use becomes a liability at depth.

ReAct is a pattern in which reasoning and action are interleaved in a single, stateful context window. Each cycle appends three items to the context: a thought (the model's internal reasoning step), an action (a tool call or decision), and an observation (the tool's return value). These items accumulate. They do not get summarized or compressed by the architecture. They stay in the window, in full, because the next reasoning step depends on being able to look back at prior ones.

The structure this creates is a shared resource problem. The context window is finite. The thought-action-observation loop is additive. Every tool call you make to reduce uncertainty also reduces the space available for the reasoning that follows. This is not a bug in any specific implementation — it is a direct consequence of the architecture's core mechanism.

### The Mechanism Behind Context Saturation

The claim that "early tokens are attenuated in a long context" requires a mechanistic derivation, not just a label.

Transformer models compute attention by asking, for each token being generated: *how much should I weight each prior token when predicting the next one?* These weights are computed via softmax normalization — a function that takes a vector of raw scores and normalizes them so they sum to 1.0 across all positions. When the context contains 50 tokens, each token's attention weight is a share of a distribution with 50 competitors. When the context contains 7,700 tokens, the same token competes with 7,699 others for that same 1.0 total weight. A token that received 2% of total attention weight in a 50-token context may receive 0.01% of total attention weight in a 7,700-token context.

This is what context saturation means mechanistically: not deletion, but dilution. The early observations that correctly established Helios's diagnosis were present in the context. They were not forgotten. But during final response generation, their attention weight was a tiny fraction of what was needed to influence the output — crowded out by the 3,100 tokens of device payment data and by the model's learned distributional prior about how well-formed ReAct responses end.

At sufficient context depth, the distributional signal of "what a well-formed ReAct trace looks like" — learned from the model's training on many prior ReAct interactions — begins to dominate the signal from specific observations in the current context. The model generates a plausible-looking Thought and a grammatically correct response, completing the structural pattern of a ReAct trace, rather than retrieving specific facts from attenuated early observations. This is the mechanistic distinction between reasoning from evidence and pattern-matching the format: from the model's perspective, both are next-token prediction — but at different context depths, different signals dominate that prediction.

### Structural Analysis

At the **Structure level**, ReAct's structure is a single, append-only context buffer. There is no architectural separation between working memory and long-term task state. All accumulated evidence and all ongoing reasoning occupy the same resource, competing for the same finite capacity.

At the **Logic level**, the reasoning protocol makes no provision for this competition. ReAct's logic is: reason, act, observe, repeat. It is a loop with no exit condition tied to resource availability. A human investigator would notice when working memory was overloaded and delegate, write things down, or simplify the problem. The ReAct loop has no analog to this metacognitive brake.

At the **Implementation level**, this produces a specific failure signature: the system degrades gracefully in the output layer while failing silently in the coverage layer. Helios produced a fluent, confident, grammatically correct response that addressed one of two causal chains. The failure was invisible to any surface-level quality metric evaluating response fluency or customer sentiment.

At the **Outcome level**, this failure has a compounding structure. Each time Priya returned, Helios began a new session with a fresh context window — no memory of prior incomplete diagnoses. The architecture's statelessness across sessions meant each conversation re-inherited the same structural failure conditions. Three sessions, three half-answers, three months of unresolved frustration.

The question the rest of this chapter answers: if ReAct's interleaved architecture is the source of its failure mode, what does a different architecture look like — and what does it cost you to use it?

---

## The Five Patterns — A Structural Taxonomy

A reasoning pattern is not a prompt template. A reasoning pattern is a rule for *which operations run in what order, and what triggers the next one.* In software engineering, this is called a control flow specification — a description of sequencing logic independent of the specific task being executed. The five patterns below differ not in the quality of reasoning they produce, but in the rules they impose on sequencing, memory, and adaptation.

### 1. ReAct (Reasoning and Acting)

Proposed by Yao et al. (2022), ReAct interleaves natural language reasoning with tool actions in a tight loop: **Thought → Action → Observation → Thought → Action → Observation...**. Each reasoning step is conditioned on the last real observation. Strength: maximally adaptive. Structural failure mode: context saturation.

### 2. Plan-and-Execute

The model first produces a complete structured plan — a decomposition of the task into ordered steps — then executes that plan sequentially without re-evaluating correctness at each step. Strength: parallelizable, auditable. Structural failure mode: stale-plan execution.

### 3. ReWOO (Reasoning WithOut Observation)

ReWOO decouples planning from tool execution entirely. The planner generates the full tool-call sequence before any tool is invoked. Then all tools run in parallel or in batch.

The latency mechanism is concrete: a standard ReAct agent making 5 sequential tool calls at 300ms each takes 5 × 300ms = 1,500ms total. ReWOO running those same 5 calls in parallel takes max(300ms, ...) = 300ms — a 5× latency reduction. This advantage only materializes when tool calls are genuinely independent: no call's input depends on a prior call's output. When data dependencies exist between steps, ReWOO either degrades its plan quality or requires variable placeholder resolution during a post-execution synthesis step.

Structural failure mode: inability to adapt mid-task. If a tool returns an unexpected result that should change the subsequent tool strategy, ReWOO has no mechanism to course-correct — the plan was committed before any observations arrived.

### 4. Reflection

Reflection adds a self-audit layer on top of any execution pattern. The model executes a task, evaluates its own output against a defined rubric, and optionally revises. A concrete rubric example: after drafting a research summary, the agent checks: *Does the response cite at least three primary sources? Does it identify the key claim and at least one counter-argument? Is confidence calibrated to evidence strength?* If any criterion fails, the agent revises and re-evaluates.

Reflection is composable — it is not a replacement for ReAct or Plan-and-Execute, but a post-processing layer that sits on top of either.

Its structural failure mode is sycophantic self-evaluation. The mechanism: RLHF fine-tuning rewards outputs that human evaluators rate positively. Human evaluators tend to rate confident, fluent, well-structured responses highly, even when content is incomplete or subtly wrong. A model trained on these preferences may generate self-evaluations that find its outputs satisfactory not because the rubric criteria were met, but because the output has the surface properties that are consistently rewarded. Reflection is most reliable when the rubric is externally verifiable ("does this response cite a source" is checkable; "is this response insightful" is not).

### 5. Tree-of-Thoughts (ToT)

Tree-of-Thoughts (Yao et al., 2023) has the model maintain a branching tree of possible reasoning paths, evaluate multiple paths before committing, and prune unproductive branches. The mechanism is analogous to beam search in machine translation: instead of greedily committing to the single most probable next reasoning step, ToT maintains the top-k candidate thoughts and expands them in parallel, evaluating each using a value function (which can be another model call, a heuristic, or an external verifier) before deciding which branches to prune and which to extend.

This makes ToT substantially more powerful than greedy CoT on tasks where the optimal reasoning path is non-obvious — where committing to the first plausible direction leads into dead ends requiring backtracking. Structural failure mode: token budget exhaustion. Each branch expansion is a model call, and a tree with depth D and branching factor B requires O(B^D) evaluations in the worst case. Pruning keeps this tractable in practice, but ToT's cost is substantially higher than any sequential pattern.

---

## ReAct Deep Dive

### Structure

The ReAct loop has three components per cycle:

```
THOUGHT:  "The user wants warranty status for order #4821. I need to look up the order."
ACTION:   lookup_order(order_id="4821")
OBSERVATION: {"order_id": "4821", "product": "WH-2200", "warranty_months": 12, ...}

THOUGHT:  "Order is 14 months old, warranty expired. Need to check extended warranty."
ACTION:   check_extended_warranty(order_id="4821")
OBSERVATION: {"extended": true, "expiry": "2026-01-15"}
```

Each Thought is natural language. Each Action is a structured tool call. Each Observation is the real-world return value. The model generates its next Thought *after* reading the Observation.

### Logic

ReAct reduces hallucination compared to pure chain-of-thought by grounding: external observations interrupt compounding reasoning error. Each observation injects real-world signal before the next reasoning step. The model cannot fabricate what the inventory system said — it is shown what the inventory system said.

The failure mechanism is the inverse of this same property: context accumulates, attention dilutes, early observations lose influence. Past approximately 5–6 tool calls in a standard 8K context window, behavior shifts from evidence-driven reasoning toward format completion.

### Implementation

```python
def react_agent(task: str, tools: dict, max_steps: int = 10) -> dict:
    messages = [{"role": "user", "content": task}]
    
    for step in range(max_steps):
        # The messages list grows with every iteration — no compression
        response = client.messages.create(
            model=MODEL, max_tokens=1024,
            system=REACT_SYSTEM, tools=list(tools.values()),
            messages=messages
        )
        messages.append({"role": "assistant", "content": response.content})
        
        if response.stop_reason == "end_turn":
            return {"answer": extract_text(response), "steps": step+1,
                    "messages": messages, "completed": True}
        
        tool_results = execute_tool_calls(response, tools)
        messages.append({"role": "user", "content": tool_results})
    
    return {"answer": "MAX_STEPS_EXCEEDED", "completed": False}
```

The `messages` list is the accumulating context. There is no pruning, summarization, or compression. This is not a shortcut — it is the structural property of the ReAct pattern.

### Outcome

**Correct when**: task depth ≤5 steps; mid-task adaptation required; latency is not the binding constraint.
**Breaks when**: task depth exceeds 5–7 steps in a standard context window; early observations must be accurately recalled late in the task; tool response payloads are large.

---

## Plan-and-Execute Deep Dive

### Structure

Plan-and-Execute separates reasoning into two explicitly distinct phases:

**Phase 1 — Planning**: The model sees the full task and produces a structured step decomposition with output variable names.

**Phase 2 — Execution**: The executor follows the plan sequentially, substituting prior step outputs as inputs to later steps. It does not re-evaluate whether each step is still correct given prior results.

### The Happy Path Assumption

Every Plan-and-Execute plan is built on a happy path assumption: the planner reasons about what the task requires and produces the step sequence that works when everything succeeds. This assumption is the entire source of the pattern's structural failure mode.

When the planner generates the plan, it has not yet called any tools. It reasons from its training distribution about what tool calls typically return. If a tool returns something outside that distribution — an error, an empty response, an unexpected schema — the executor has no mechanism to account for it. It substitutes the unexpected value into the context variable and proceeds to the next step, which was designed assuming the prior step succeeded.

### Logic

The planning phase separates strategic decomposition from tactical execution. This produces two advantages: steps without data dependencies can run in parallel, and the plan can be audited before execution begins — the natural location for a Human Decision Node. A domain expert reviewing the plan before execution is the architectural mechanism that prevents the Happy Path Assumption from becoming a liability.

The failure mode is the mirror image: Plan-and-Execute gains auditability and parallelism by committing to the plan before any tool is called. That commitment is what makes it fail silently when a tool call returns an error.

### Implementation

```python
def plan_and_execute_agent(task: str, tools: dict) -> dict:
    # Phase 1: Generate the plan
    plan = generate_plan(task, tools)
    
    # ── MANDATORY HUMAN DECISION NODE ─────────────────────────────────────
    # The plan above is built on the Happy Path Assumption:
    # all tools succeed and return expected output types.
    # BEFORE PROCEEDING — verify:
    # (1) Business-rule ordering, not just data-dependency ordering
    # (2) Which steps have tool failure rates above 5%
    # (3) Whether a re-planning trigger is needed for high-risk steps
    # Document your decision here:
    # ──────────────────────────────────────────────────────────────────────
    
    context = {}
    for step in plan.steps:
        result = call_tool(step.tool, resolve_inputs(step.inputs, context))
        # Error or not, the result goes into context and execution continues.
        # This is the Happy Path Assumption in code form.
        context[step.output_key] = result
    
    return synthesize_result(context)
```

### Outcome

**Correct when**: task depth >5 steps; steps are parallelizable; plan can be audited; tool success rates are high.
**Breaks when**: tools have meaningful failure rates; later steps depend on actual (not predicted) earlier outputs; environment changes between planning and execution.

---

## The Decision Framework

Before selecting a reasoning pattern, answer these five questions in order. Each question is derived directly from a specific failure mode — this is not an arbitrary checklist.

**Question 1: How many tool calls does the task require?**
*Derived from*: ReAct's context saturation failure. The failure probability increases with step count because of the softmax attention dilution mechanism. Below 5 steps, saturation is unlikely at standard 8K context window sizes. Above 5 steps, it is a design risk.
- <5 steps → ReAct viable
- \>5 steps → Plan-and-Execute or ReWOO

**Question 2: Is mid-task adaptation required?**
*Derived from*: Plan-and-Execute's stale-plan failure. If step N+1 must be informed by what step N *actually returned*, ReAct is necessary. If step N+1 is fully determined by task structure regardless of step N's output, Plan-and-Execute is safe.
- Adaptation required → ReAct
- Steps predetermined → Plan-and-Execute

**Question 3: What is the tool failure rate?**
*Derived from*: Plan-and-Execute's silent error propagation. This threshold is a heuristic grounded in probability, not a derived constant: at a 5% per-tool failure rate across 8 sequential steps, the probability that at least one tool fails is 1 − 0.95^8 ≈ 34%. In a production system processing thousands of requests daily, a 34% rate of silent wrong outputs is not operationally acceptable. At per-tool failure rates below 1–2%, the risk calculus changes. The 5% threshold is conservative by design; adjust it based on observed failure rates in your specific tool registry.
- Any tool >5% failure rate → Plan-and-Execute without a re-planning trigger is unsafe

**Question 4: Does the task require self-evaluation?**
*Derived from*: the gap between execution quality and output quality in complex tasks. Reflection is composable — it is a post-processing layer, not a replacement for an execution pattern.
- Quality-critical output, verifiable rubric → add Reflection layer

**Question 5: Is the optimal solution path non-obvious?**
*Derived from*: the cost of greedy commitment. If multiple valid reasoning paths exist and the best cannot be identified upfront, ToT's branching search justifies its token cost. If the path is known, ToT's cost is wasted.
- Non-obvious optimal path → Tree-of-Thoughts
- Known path → any sequential pattern

| Pattern | Best For | Breaks On |
|---|---|---|
| ReAct | Short adaptive tasks, ≤5 tools | Context saturation, >5 steps |
| Plan-and-Execute | Long structured tasks, auditable workflows | Tool failure, dynamic environments |
| ReWOO | Speed-critical, independent parallel calls | Inter-step data dependencies |
| Reflection | Quality-critical, verifiable rubric | Sycophantic self-evaluation |
| Tree-of-Thoughts | Non-obvious optimal path | Token budget exhaustion |

---

## The Failure Cases

Both failure modes described in this chapter are deliberately triggered in the companion notebook (`reasoning_patterns_demo.ipynb`). They are not described. They are observed.

**Failure Case 1: ReAct Context Saturation**
The notebook runs the ReAct agent on an 8-step warranty claim task. The same agent succeeds on a 3-step version of the same task with the same model and tools. On the 8-step version, observe the step at which tool calls begin repeating or reasoning contradicts earlier observations. The cause is the softmax dilution mechanism: context depth, not model capability, determines degradation.

**Failure Case 2: Plan-and-Execute Stale Plan**
The notebook runs Plan-and-Execute on the same 8-step task with `check_inventory` configured to throw an exception at step 3. Observe the executor substitute an error value into step 3's output key and proceed through steps 4–8. The final output — a resolution email and CRM log entry — is structurally complete and factually wrong. No exception was thrown. This is the Happy Path Assumption failing silently.

Both failure modes are reproducible from a fresh clone by any reader.

---

## Chapter Exercise

**The goal of this exercise is not to observe the failure. It is to identify the exact condition that causes it — so you can state it before writing code.**

**Exercise 1 — Find the ReAct threshold**

Remove step instructions from the full task in the companion notebook one at a time, starting at 8 steps and reducing to 3. At what step count does reasoning degradation disappear?

Your answer must take this form: *"The failure appears at approximately [N] steps because at that context depth, the softmax attention weight assigned to early observations falls below the threshold needed to influence output generation — the model completes the ReAct format pattern rather than retrieving specific evidence."*

**Exercise 2 — Move the failure point**

Add a `FORCE_FRAUD_FAIL` flag to the `check_fraud_flag` function and modify `execute_plan()` to use it instead of `FORCE_INVENTORY_FAIL`.

- When failure is at step 3 (inventory): how many subsequent steps execute on corrupted input?
- When failure is at step 6 (fraud): how many subsequent steps execute on corrupted input?

Predicted relationship: *failures earlier in the plan corrupt more downstream steps, which means high-reliability-required steps should be positioned early so that failure halts the chain before resource allocation or external communication occurs.*

**Exercise 3 — Add the defense architecture**

Modify `execute_plan()` to call `generate_plan()` again when a step returns an error, passing the remaining steps and current context as input. Does the re-planner produce a valid recovery path? Document what information the re-planner needs that the original planner didn't have.

---

## Architecture Is the Argument

The postmortem team examining Helios spent two hours reviewing logs. They confirmed correct tool outputs, valid reasoning steps, no hallucination. They were looking at the wrong level of the stack.

The failure was in the architecture. Helios was a ReAct system running a multi-causal billing investigation — a task whose correct resolution required depth that exhausts a ReAct context. The same model, deployed on a Plan-and-Execute architecture with a re-planning trigger on tool failure, would have handled the Priya case correctly. Not because Plan-and-Execute is a better pattern — it has its own failure mode, precisely documented in this chapter and triggerable in the companion notebook. But Plan-and-Execute's failure conditions (tool failure rate, dynamic environment) were less likely to be met by a structured billing query than ReAct's failure conditions (context depth exceeding 5 steps).

The pre-mortem for any agentic system design should begin with the five questions in the decision framework — not because they guarantee success, but because they force you to name the failure mode you are accepting before you write the first line of code. Architecture is the leverage point. The model is just what executes the architecture you designed.

---

## A note about AI

Patterns are categorical. Trade-offs are local. The model is good at the first and lossy at the second.

Where the model genuinely helps: producing the canonical statement of each pattern and its conventional trade-off. Where the model does damage: telling you which pattern fits your system without knowing your system. Selection is local.

The rule: pattern catalog from the model; selection from you.

## AI Wayback Machine

Erich Gamma co-authored the Gang of Four book *Design Patterns* (1994) — founding the modern vocabulary of design patterns and tradeoffs.

Run this:

> Who is Erich Gamma, and how does their work connect to the patterns and tradeoffs we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
> → Search "Erich Gamma" on Wikipedia.

Now make the prompt better. Try one of these:

- Ask it to apply Erich Gamma's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Erich Gamma's framework."

What changes? What gets better? What gets worse?

---

## References

- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. *arXiv:2210.03629*.
- Yao, S., et al. (2023). Tree of Thoughts: Deliberate Problem Solving with Large Language Models. *arXiv:2305.10601*.
- Xu, B., et al. (2023). ReWOO: Decoupling Reasoning from Observations for Efficient Augmented Language Models. *arXiv:2305.18323*.
- Wei, J., et al. (2022). Chain-of-thought prompting elicits reasoning in large language models. *NeurIPS 2022*.
- Wang, L., et al. (2023). Plan-and-Solve Prompting. *ACL 2023*.

# Chapter 33 — Case: CloudArch Designer

*A nine-stage pipeline that scopes the LLM narrowly to natural-language understanding, keeps Terraform emission deterministic, and adds a Stage 0 prompt normalizer that lifted aggregate stability from 0.446 to 0.914.*

**Author:** Niraj Umeshbhai Patel
**Editor:** Nik Bear Brown

---

## Situation

Designing a cloud architecture that is simultaneously secure, compliant, highly available, and cost-aware is a substantial cognitive task. An engineer has to translate an informal product description into an explicit list of services, configure each service against regulatory and operational requirements (HIPAA, PCI-DSS, SOC 2, multi-AZ, multi-region), express the result in Infrastructure-as-Code, sketch an architecture diagram for stakeholders, and justify the design choices. Each sub-task is individually well understood; performing all of them consistently and correctly under time pressure is error-prone. Existing LLM-driven IaC tools (Pulumi AI, Terraform AI, AWS Q Developer) have a well-documented failure mode: when the LLM writes Terraform from scratch, it hallucinates argument names, nested block schemas, and cross-resource references, producing plausible-looking but syntactically or semantically invalid HCL. CloudArch Designer inverts the arrangement. The LLM is never asked to emit HCL from scratch. Hand-authored JSON templates are the resource skeleton, deterministic JSON transformations apply compliance and HA patches, and a deterministic emitter converts the final template dictionary into HCL. The LLM is invoked only where natural-language understanding is indispensable.

## Architecture

A ten-stage linear pipeline orchestrated by `pipeline/orchestrator.py::run`. Each stage is a small near-pure module consuming one data shape and returning the next.

| Stage | Module | LLM? | Role |
| --- | --- | --- | --- |
| **0** | `normalizer.py` | Yes | Canonicalize noisy / multilingual / adversarial prompts into clean English |
| **1** | `extractor.py` | Yes | Structured `ArchSpec` extraction with self-consistency over 3 Gemini samples |
| **2** | `defaults.py` | No | Apply workload-archetype defaults (`web_api`, `data_pipeline`, `ml_training`, `static_site`) |
| **3** | `assumptions.py` | No | Surface and lock domain assumptions |
| **4** | `templates.py` | No | Hand-authored JSON resource skeleton assembly |
| **5** | `patches.py` | No | Apply HIPAA / PCI / SOC 2 / HA / multi-region patches |
| **6** | `hcl_emitter.py` | No | Deterministic JSON-to-HCL emission |
| **7** | `validate.py` | Partial | `terraform validate` + `tfsec`; LLM repair only on failure |
| **8** | `cost.py` | No | Itemized monthly cost estimate from a per-resource pricing table |
| **9** | `explain.py` | Yes | RAG-grounded cited design rationale |

The **hybrid retriever** uses dense embeddings + BM25 with [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) and a cross-encoder reranker over header-aware chunks of AWS service documentation and compliance references. Retrieval is consumed by three stages: extraction (Stage 1), Terraform repair (Stage 7), and rationale (Stage 9). The **multimodal input path** (`pipeline/vision_extractor.py`) accepts hand-drawn sketches, whiteboard photos, or existing architecture diagrams; Gemini Vision parses the image into the same `ArchSpec` the text extractor produces, so the rest of the pipeline runs unchanged.

## Design rationale

The architectural commitment that earns the system's name is **scope the LLM narrowly to where natural-language understanding is essential, and keep everything else deterministic**. Six of the ten stages have no LLM. Templates are hand-authored JSON, patches are deterministic JSON transformations, the HCL emitter is a deterministic dictionary-to-HCL conversion, cost estimation is a per-resource lookup table. The 100% Terraform validity rate the system reports is a structural property of this scoping — the LLM cannot hallucinate a Terraform schema it never emits.

The **Stage 0 prompt normalizer** is the single most consequential design move and the one the report measures with the most discipline. Earlier iterations sent user prompts directly to the extractor and discovered the failure mode the prompt-stability literature has named: LLMs are surprisingly sensitive to superficial phrasing differences. Adding an explicit canonicalization stage — *rewrite this user prompt into clean English without changing its meaning* — before extraction lifted the aggregate stability score from **0.446 to 0.914** without any changes to downstream logic. This is the chapter's discipline operationalized: when a property the system is supposed to have (stability under paraphrase) doesn't hold, add the architectural layer that makes it hold rather than tuning the prompt of the failing stage.

The **self-consistency voting at Stage 1** is the third move. Three Gemini samples extract the structured `ArchSpec` independently; the resulting JSON objects merge field-by-field via majority vote. This catches the case where one sample misclassifies a workload archetype or omits a compliance tag — the disagreement reveals the uncertainty rather than letting one sample's mistake propagate.

The **RAG-augmented validate-and-repair loop at Stage 7** is the fourth move. When `terraform validate` fails, the failure message + the offending HCL + retrieved AWS-documentation context get passed back to the LLM, which proposes a repair. The repaired HCL is re-validated. The loop bounds at a fixed retry count and surfaces the underlying validation error if no repair converges. The LLM is doing what it is uniquely able to do — *reading a Terraform error message and reasoning about what the schema requires* — while the deterministic validator is the source of truth for whether the repair worked.

## Trade-offs

The hand-authored JSON template library bounds workload coverage to four archetypes (`web_api`, `data_pipeline`, `ml_training`, `static_site`); broader coverage requires adding templates and patches, which is real work. The cost estimator is a per-resource pricing table; AWS pricing changes regularly and the table needs scheduled refresh. The system is deliberately scoped to validation-mode Terraform (`terraform validate` + `tfsec`) — no real deployments are performed — which keeps evaluation rigorous and reproducible at the cost of not exercising the full deploy-time failure surface.

## Outcomes and revisions

Functional benchmark across **15 cases**:

| Metric | Result |
| --- | --- |
| Pass rate | **100%** |
| Workload match | 100% |
| Terraform validity | **100%** |
| Mean component recall | 97.8% |
| Compliance match | 100% |
| `tfsec` HIGH findings | **0** |
| p50 wall time | **1.4 s** |

Synthetic stability stress test across **180 variant prompts** (four modes — paraphrase, adversarial, multilingual, noisy — over nine reference cases):

| Metric | Result |
| --- | --- |
| Consistency score | **0.914** (up from 0.446 pre-normalizer) |
| Crash rate | **0** in every mode |
| Component-set Jaccard overlap | **>0.91** in every mode |

The 0.914 stability score across the four adversarial modes — including multilingual prompts and deliberately noisy inputs — is the metric the Stage 0 normalizer is responsible for. Crash rate of 0 across 180 variants is the orchestrator's per-stage exception handling working. The most consequential planned revision is broadening the workload-archetype library beyond the initial four, plus adding a dry-run deployment-test mode against an isolated AWS sub-account to catch failure modes that surface only at deploy time.

## Pattern connection

CloudArch Designer instantiates Chapter 7's Fact Check List Pattern (deterministic `terraform validate` + `tfsec` as the verification layer; LLM repair only on failure), Chapter 9's Offloading principle (six of ten stages run no LLM, keeping LLM context small and structured), and Chapter 12's framework-correctness argument (the property *no invalid Terraform reaches the user* is enforced by the deterministic emitter and the validate-and-repair loop, not by prompt-level instructions).

## Transfer prompt

In your own LLM-driven generation system, what fraction of the pipeline's stages actually need natural-language understanding? When you measure your system's stability under prompt paraphrase, do you have a normalization stage upstream of generation, or are you hoping the generator is invariant to surface form? When you ask an LLM to repair a deterministic-validator failure, does the repair loop bound at a finite retry count and surface the original error if no repair converges?

---

*Spring 2026.*


---

## A note about AI

CloudArch designs cloud architecture. The model is fluent in vendor documentation and behind on pricing, deprecation, and operational reality.

Where the model genuinely helps: producing the canonical reference architectures for common workloads.

Where the model does damage: producing the actual architecture. Architecture decisions depend on your scale, your team, your compliance environment, and your existing infrastructure.

The rule: reference architectures from the model; actual architecture from someone who will be on-call when it breaks.

---

## AI Wayback Machine

**Werner Vogels** was Amazon CTO whose work on distributed systems consistency models defines the modern cloud architecture rulebook.

**Run this:**

```
Who is Werner Vogels, and how does their work connect to the cloud architecture agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Werner Vogels"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Werner Vogels's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Werner Vogels's framework."

What changes? What gets better? What gets worse?

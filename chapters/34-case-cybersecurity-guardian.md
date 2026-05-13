# Chapter 34 — Case: Personal Cybersecurity Guardian

*A LangGraph multi-agent threat-intelligence system for non-technical users — with a synthesis layer governed by five conflict-resolution rules and an anti-hallucination CVE-ID redaction pass.*

**Author:** Anusha Prakash
**Editor:** Nik Bear Brown

---

## Situation

The [FBI Internet Crime Complaint Center documented $12.5 billion in cybercrime losses in 2023](https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf), with phishing the largest reported category. Existing threat-intelligence tools — VirusTotal, Shodan, the [NIST National Vulnerability Database](https://nvd.nist.gov/) — are accurate and well-maintained and require practitioners to interpret CVSS scoring vectors, CPE product strings, and engine-flag counts that carry no actionable meaning for non-technical users. Enterprise platforms like KnowBe4 and Proofpoint provide simplified interfaces and are sold to organizations on annual contracts, inaccessible to private individuals without institutional affiliation. No freely accessible tool exists for private individuals that retrieves *live* threat intelligence, synthesizes it across multiple sources, and delivers a plain-language verdict with actionable next steps. The Personal Cybersecurity Guardian addresses this gap. The system is built on the hypothesis that access to live, structured, government-grade threat intelligence will produce more *verifiable* and *novel-threat-capable* security verdicts than a general-purpose LLM operating on training-data alone.

## Architecture

Four components arranged in a directed graph orchestrated by LangGraph. **Router** classifies user intent at temperature 0.0 with GPT-4o mini across five routing decisions: phishing-only, vulnerability-only, both agents, clarification required, or empty input. A regex fast-path detects version strings and overrides low-confidence classifications. Version-completeness enforcement prevents silent failure on incomplete version strings — a known failure mode identified during proposal review. **Phishing Agent** runs two parallel evidence streams: [VirusTotal API v3](https://docs.virustotal.com/reference/overview) scanning, and Pinecone semantic similarity search against the [PhishTank](https://phishtank.org/) namespace. Verdict priority rules: ≥5 VirusTotal malicious engine flags → MALICIOUS; 2-4 → UNCERTAIN; 0 with no email signals → SAFE. **Vulnerability Agent** executes a two-pass search: pass one filters by `known_exploited=True` against CISA KEV records; pass two performs unfiltered semantic search against the NVD namespace. **Synthesis Layer** applies five conflict-resolution rules and an anti-hallucination guard. **Contextual Intervention Layer** produces a situation-specific action plan from five prompt templates based on verdict and user context.

Threat intelligence indexed from four sources into Pinecone Serverless using `all-MiniLM-L6-v2` (384-dim, cosine):

| Namespace | Records | Source | Filter |
| --- | ---: | --- | --- |
| `cve-vulnerabilities` | 92,126 | CISA KEV (1,566) + NVD (90,560) | NVD: CVSS ≥ 7.0 |
| `phishing-patterns` | 57,705 | PhishTank verified-online | None |
| **Total** | **149,831** | | |

The five synthesis conflict-resolution rules:

| Rule | Condition | Resolution |
| --- | --- | --- |
| 1 | Phishing returns MALICIOUS | Top-level MALICIOUS regardless of vulnerability finding |
| 2 | Phishing SAFE, vulnerability VULNERABLE | Top-level VULNERABLE (escalates) |
| 3 | One agent INSUFFICIENT_EVIDENCE, other has real finding | Use the real finding |
| 4 | Both INSUFFICIENT_EVIDENCE | Top-level INSUFFICIENT_EVIDENCE |
| 5 | Synthesized confidence < 0.70 | Top-level UNCERTAIN |

## Design rationale

The architectural commitment that earns the system's name is **live retrieval over training-data memory**. Every architectural decision flows from the recognition that a general-purpose LLM has a training cutoff and cannot reason about CVEs disclosed after it. The 92,126-record CISA-plus-NVD vector index is the system's epistemic ground truth; the LLM's role is synthesis, not knowledge. The two-pass vulnerability search — KEV-filter first, NVD unfiltered second — emerged from a retrieval failure during testing in which NVD records were outranking KEV records for queries about *actively exploited* software. The fix names the failure: NVD records in the Pinecone index do not carry product metadata fields, making semantic similarity the only reliable retrieval mechanism for them, so the architecture compensates by querying the KEV-filtered subset first.

The **post-generation CVE-ID redaction pass** is the second consequential design move. The synthesis layer scans GPT-4o mini's output for CVE IDs and *replaces any CVE ID not present in the input evidence with `[redacted]`*. This is the chapter's discipline made surgical: rather than ask the model to be careful, the architecture programmatically catches the failure mode the model is most likely to produce. Anti-hallucination as a regex pass over the output, applied after generation.

The **five-rule conflict-resolution synthesis** is the third move. Two agents operating in parallel can disagree, can both find evidence, can both find none, can produce inconsistent confidence scores. Defining the resolution rules explicitly — with priority ordering — is what makes the synthesis layer auditable rather than a black-box prompt. Rule 5 (confidence < 0.70 → UNCERTAIN) preserves the architecturally critical UNCERTAIN state Chapter 7 argued is non-negotiable.

The **contextual intervention layer at the end** is the fourth move and the one introduced at the course professor's recommendation as *the architectural distinction between a system that informs and one that protects*. Producing a situation-specific action plan — *"do not click this link; here is what to do instead"* — is what turns a verdict into a usable response for a non-technical user.

## Trade-offs

The CVSS 7.0 threshold for NVD inclusion drops low-severity CVEs (below HIGH/CRITICAL) from the index — correct for actionability for non-technical users, a real coverage gap for security researchers who need the long tail. The 2023–2025 NVD gap (download timeout truncated the corpus) is covered for *actively exploited* vulnerabilities by CISA KEV but leaves disclosed-but-not-yet-exploited recent CVEs underrepresented. PhishTank URL fields are truncated to 300 characters in metadata only — embeddings are generated from full text before truncation, preserving semantic quality at the cost of metadata completeness. The system relies on Pinecone Serverless cloud-hosted vector storage, which is the right call for ephemeral free-tier deployment and a cost surface for a paid-tier production deployment.

## Outcomes and revisions

| Metric | Result |
| --- | --- |
| Live VirusTotal evaluation (40 URLs) precision | **100%** |
| False-positive rate | **0** |
| Recall on constructed test URLs not in VirusTotal | 15% |
| CVE retrieval Recall@5 vs CISA KEV catalog | **85%** |

The 100% precision / 0 false positives at 15% recall on constructed test URLs is the verdict-shape the architecture should produce: highly conservative on flagging, with a known recall ceiling on novel synthetic URLs not in the underlying threat database. The baseline comparison against GPT-4o mini *without* retrieval augmentation showed comparable verdict accuracy on **well-known historical threats** present in model training data (Log4Shell, Apache 2.4.49 path traversal) — and the critical differentiation emerging on **novel threats, post-cutoff CVEs, and evidence verifiability**. A general-purpose LLM with a 2024 training cutoff cannot reason about a 2026 CVE except by hallucinating a plausible-looking identifier. The Cybersecurity Guardian retrieves the actual record and synthesizes from it. The most consequential planned revision is a longitudinal evaluation using novel phishing campaigns disclosed after the model's training cutoff, plus expanding NVD coverage to fill the 2023–2025 gap.

## Pattern connection

Cybersecurity Guardian instantiates Chapter 7's Fact Check List Pattern (the post-generation CVE-ID redaction pass is a structural anti-hallucination check applied after the LLM produces output) and Chapter 12's framework-correctness argument (the LangGraph router's five-decision classification with regex fast-path enforces the property *no agent runs on incomplete input* structurally rather than by prompt instruction).

## Transfer prompt

In your own LLM-driven verdict system, when the LLM produces output containing identifiers (CVE IDs, citation IDs, case numbers, version strings), do you have a post-generation check that compares each identifier against the input evidence and redacts any that wasn't present? When two agents return conflicting verdicts, are your conflict-resolution rules explicit and priority-ordered, or implicit in a synthesis prompt that the model is asked to interpret? When your training-data-bounded knowledge is not enough, does your architecture fall back to live retrieval — or to the LLM's parametric guess?

---

*Spring 2026.*


---

## A note about AI

Cybersecurity Guardian operates in a domain where attackers actively defeat defenses. The model has read public attack literature and has no view of the specific attacker.

Where the model genuinely helps: enumerating the standard attack patterns against the system class you are defending.

Where the model does damage: certifying security. Security is the absence of vulnerabilities the defender has not yet found, and certification implies completeness the model cannot provide.

The rule: threat model expansion from the model; certification from independent penetration testers.

---

## AI Wayback Machine

**Dorothy Denning** was cryptographer whose 1986 paper on intrusion detection systems is the foundational document for cybersecurity monitoring.

**Run this:**

```
Who is Dorothy Denning, and how does their work connect to the cybersecurity agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Dorothy Denning"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Dorothy Denning's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Dorothy Denning's framework."

What changes? What gets better? What gets worse?

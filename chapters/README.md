# Design of Agentic Systems with Case Studies: chapter guide

[Return to the book overview](../README.md).

### Part I · Architecture foundations

1. [The Move That Changed Everything](../chapters/01-move-that-changed-everything.md): Use a concrete decision to introduce the costs and benefits of delegating action.
2. [The Blueprint Before the Build](../chapters/02-blueprint-before-the-build.md): Describe a system’s workflow and responsibilities before choosing a tool.
3. [Five Patterns, Five Trade-offs](../chapters/03-five-patterns-five-tradeoffs.md): Compare five design patterns by the trade-off each asks you to accept.

### Part II · Retrieval and reliability

4. [RAG 101](../chapters/04-rag-101.md): Explain when retrieval is needed to support a generated answer.
5. [Choosing and Configuring Your RAG Pipeline](../chapters/05-configuring-your-rag-pipeline.md): Choose retrieval components based on the task and evidence requirements.
6. [Grounding Agents in Evidence](../chapters/06-grounding-agents-in-evidence.md): Require attributable evidence at the points where an agent makes claims.
7. [Hallucination: When Plausibility Beats Truth](../chapters/07-hallucination-plausibility-vs-truth.md): Tell convincing language from verified evidence and plan a separate check.
8. [The Attack Surface No One Designed For](../chapters/08-attack-surface-no-one-designed-for.md): Identify where an agent’s trust boundaries introduce defensive review needs.
9. [Five Ways Context Kills Agents](../chapters/09-five-ways-context-kills-agents.md): Diagnose failure modes when context becomes incomplete or misleading.

### Part III · Coordination, economics and tools

10. [When Coordinated Agents Become Unpredictable](../chapters/10-coordinated-agents-emergence.md): Trace how local coordination decisions can produce system-level surprises.
11. [Model Economics and the Build-or-Buy Decision](../chapters/11-model-economics.md): Use evidence on cost, latency and volume to compare building and buying.
12. [Choosing Your Weapon](../chapters/12-choosing-your-weapon.md): Choose a framework based on its limits and the work it must do.
13. [The Protocol Layer: MCP, ACP, and the Interoperability Standard](../chapters/13-protocol-layer.md): Explain what interoperability protocols standardize and leave to application design.
14. [Twelve Production Builds: A Scaffolded Project Sequence](../chapters/14-twelve-production-builds.md): Connect learning objectives to a scaffolded sequence of implementation projects.

### Part IV · Verification, public and professional workflows

15. [Case: CodeSentinel](../chapters/15-case-codesentinel.md): Compare static security findings with the code evidence a human reviewer needs.
16. [Case: VerifAI](../chapters/16-case-verifai.md): Diagnose unsupported legal citations and design a review before reuse.
17. [Case: PharmGuard AI](../chapters/17-case-pharmguard.md): Analyze medication-safety information flow and the need for expert review.
18. [Case: BioClaim Guard](../chapters/18-case-bioclaim-guard.md): Check whether a consumer biomedical claim is actually supported by its study.
19. [Case: ClearDischarge](../chapters/19-case-cleardischarge.md): Inspect how a rewrite can preserve meaning and uncertainty in a discharge document.
20. [Case: AIRA](../chapters/20-case-aira.md): Separate tool evidence from a university judgment about academic integrity.
21. [Case: CrisisLens](../chapters/21-case-crisislens.md): Evaluate a proposed support workflow and the boundary for a human counselor.
22. [Case: TrialMatch AI](../chapters/22-case-trialmatch.md): Trace complicated eligibility criteria to source evidence instead of treating a match as a medical recommendation.
23. [Case: PolicyLens](../chapters/23-case-policylens.md): Compare summaries against policy wording and identify unsupported additions.
24. [Case: PlanLens](../chapters/24-case-planlens.md): Evaluate which plan claims need documentation and which decisions stay outside the assistant.

### Part V · Analysis, infrastructure and validation

25. [Case: TacticalLens](../chapters/25-case-tacticallens.md): Trace gaps and uneven coverage in soccer event analysis.
26. [Case: Pitch Verdict](../chapters/26-case-pitch-verdict.md): Test whether a match report’s claims are backed by observed events.
27. [Case: Pygmy](../chapters/27-case-pygmy.md): Compare stages of a data-engineering workflow where failures can go unnoticed.
28. [Case: Jobzilla AI](../chapters/28-case-jobzilla.md): Check evidence and human ownership when tailoring application material.
29. [Case: CostSherlock](../chapters/29-case-costsherlock.md): Distinguish an observed cloud-cost increase from a verified cause.
30. [Case: LitmusQE](../chapters/30-case-litmusqe.md): Evaluate generated software tests for gaps and missed edge cases.
31. [Case: SchemaGuard](../chapters/31-case-schemaguard.md): Separate valid JSON structure from valid domain relationships.
32. [Case: CLIS V2](../chapters/32-case-clis-v2.md): Evaluate source appraisal and human oversight in a clinical literature workflow.
33. [Case: CloudArch Designer](../chapters/33-case-cloudarch.md): Translate cloud constraints into reviewable design choices.
34. [Case: Personal Cybersecurity Guardian](../chapters/34-case-cybersecurity-guardian.md): Evaluate a defensive personal-security workflow and the limits of automated advice.

### Part VI · Learning, research and personal workflows

35. [Case: Syllabus Navigator](../chapters/35-case-syllabus-navigator.md): Detect inconsistent dates and policies before trusting an extracted syllabus.
36. [Case: Adaptive Linear Algebra Explainer (Faraz)](../chapters/36-case-adaptive-linalg-faraz.md): Adapt an eigenvector explanation to the learner’s prior understanding.
37. [Case: Adaptive Linear Algebra Explainer (Abdul)](../chapters/37-case-adaptive-linalg-abdul.md): Compare a second adaptive linear algebra design against different reader needs.
38. [Case: AI-Powered Stock Research Platform](../chapters/38-case-stock-research.md): Trace an equity-research claim to filings or other attributable evidence.
39. [Case: Immigrant Tax Filing Assistant](../chapters/39-case-immigrant-tax.md): Determine when a tax workflow needs clarification or a qualified human.
40. [Case: MindMirror](../chapters/40-case-mindmirror.md): Identify privacy and handoff constraints in a reflective journaling design.
41. [Case: Research Claim Auditor](../chapters/41-case-research-claim-auditor.md): Distinguish a topically related citation from evidence for the exact research claim.
42. [Case: WCAG Compliance Auditor](../chapters/42-case-wcag-auditor.md): Separate automated access checks from what a manual accessibility audit needs to establish.
43. [Case: Thought2Do](../chapters/43-case-thought2do.md): Turn a captured thought into a reviewable task with an explicit due date.
44. [Case: AI Financial Fragility Detector](../chapters/44-case-financial-fragility.md): Examine uncertainty and asymmetric errors in financial fragility monitoring.
45. [Case: StudyMate AI](../chapters/45-case-studymate.md): Require traceable study material and test whether a learning aid preserves its source.

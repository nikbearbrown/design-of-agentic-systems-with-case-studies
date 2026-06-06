# Appendix B — The Domain Research Prompt

<!-- SUBJECT-SPECIFIC OPERATING FRAME: START -->

## Subject-Specific Operating Frame

This copy is specialized for this book. Use `writing-tools/figure-checker.md` as the domain anchor for expertise, examples, accuracy checks, and disciplinary judgment.

**Domain expert:** You are an AI systems professor with expertise across human-AI interaction, prompt engineering, agentic systems, model evaluation, automation risk, and science communication. Your job is to review figures submitted for a university-level AI or human-AI practice textbook and produce correction instructions that can be executed directly by a coding agent (Codex, Claude Code, or Cowork) on the source SVG files.

**Accuracy standard:** AI systems accuracy: Is everything shown conceptually and technically correct? Flag wrong workflow order, false autonomy claims, misleading model capability boundaries, incorrect human-in-the-loop logic, unsupported safety claims, confused training-vs-inference diagrams, broken agent loops, missing verification steps, or anything contradicting the chapter text.

When running this tool, adapt the generic instructions below to this subject:

- Prefer examples, metaphors, figures, and chapter structures that fit the domain expert's field.
- Treat the local accuracy standard as a hard gate before drafting, enriching, fact-checking, or approving content.
- Preserve disciplinary vocabulary, units, notation, citation norms, evidence hierarchy, and common student misconceptions for this subject.
- When a figure, table, diagram, or visual prompt is involved, apply the local `figure-checker.md` mental-model test before accepting the artifact.
- If the generic prompt below conflicts with the local subject frame, the subject frame wins.

<!-- SUBJECT-SPECIFIC OPERATING FRAME: END -->


*The multi-LLM domain research prompt, generalized for any field.*

---

This is the prompt behind Chapter 3 (*Domain Research*). It produces the synthesized brief you paste into Project Knowledge before running Tic TOC. Run it in Claude, GPT-4o, and Gemini separately, then combine the outputs — different models surface different sources and blind spots, which is the point.

Fill the bracketed placeholders for your field before pasting. The fully worked version for *AI for Designers* is in `pantry/ai-for-designers-research-prompt.md` — read it alongside this as a model for how specific your fill-ins should be. The maintained copy lives in Bear Brown & Company's online prompt library [verify URL at time of writing]; if it differs, the online copy is newer.

---

**Runs in:** Claude, ChatGPT, and Gemini — run it in all three and combine the outputs; the multi-LLM comparison is the method. No file access needed.

**Dependencies:** none — fill the bracketed `[YOUR FIELD]` / `[YOUR ROLE]` placeholders before pasting.

**Produces:** a synthesized domain-research brief you paste into Tic TOC's project knowledge (Appendix A).

---

## Domain Research Prompt: AI for [YOUR FIELD]
### Run in Claude, GPT-4o, and Gemini — combine outputs

I am designing a practitioner handbook called "AI for [YOUR FIELD]: A Practitioner's Guide" as part of an AI+1 curriculum — for [YOUR ROLE: the specific practitioners, e.g. "freelance designers with one primary client"] who keep their professional identity and add AI fluency on top, rather than becoming generic prompt engineers.

Research the following:

---

**1. Current AI tool adoption in [FIELD] by professional role**

Map AI tool adoption across the distinct roles within [FIELD]. Which tools are actually being used, not just marketed? Name specific platforms with evidence of adoption rates and what functions they perform. Distinguish between tools that automate **Tier 1 work** (pattern execution, drafting, routine generation) and tools being sold as **judgment replacements** (strategy, direction, relationship management, high-stakes decisions).

---

**2. AI failure modes specific to [FIELD] — documented cases and structural reasons**

Where does AI get [FIELD] work wrong in ways that create professional, financial, legal, or reputational exposure for the practitioner? For each failure mode, give documented cases where they exist and the structural reason the failure occurs — not just that it happens, but why the model cannot avoid it. Cover at minimum: misreading the unspoken brief or client/stakeholder intent; systematic quality or judgment failures a senior practitioner would catch; legal/IP/compliance exposure (name specific cases or rulings); and breakdowns in the iteration or revision cycle.

---

**3. The legal, regulatory, or compliance landscape for AI use in [FIELD]**

What is the current legal/regulatory status of AI-assisted work in [FIELD] in the US and EU? Name the major rulings, guidance documents, or standards bodies that have established or left unresolved the rules. What are the practical implications for a practitioner delivering AI-assisted work? What disclosures are prudent, and what contract or consent language is emerging? Which tools have the cleanest provenance versus the highest risk?

---

**4. The fluency trap in [FIELD] — where AI output looks expert but isn't**

The fluency trap is AI output that looks like competent professional work to a non-expert but would not survive expert review. What are the most common fluency-trap patterns in [FIELD]? How do experienced practitioners describe the difference between AI output and expert work — what do they see that outsiders miss? Where is the trap most dangerous? What happens when a practitioner ships work they cannot explain, defend, or iterate on when challenged?

---

**5. The labor market impact on [FIELD]**

Which job functions in [FIELD] are most disrupted by AI, and which are seeing wage premiums for AI fluency? How is AI affecting the junior/mid-level pipeline? What skills are the field's schools, professional organizations, and major employers emphasizing in response? Is there field-specific wage-premium data analogous to the PwC 56% cross-industry finding? What is the net employment trajectory — which specializations are growing, which declining?

---

**6. The irreducibly human taxonomy for [FIELD]**

What does an experienced practitioner in [FIELD] know that no current AI system can replicate? Cover the capacities specific to this field — e.g. reading what a client or stakeholder actually wants versus what they say; taste and judgment and how they are developed; accountability for a consequential decision; navigating real constraints to produce better work; interpreting the gap between the brief and what the work should do; persuasion and defending a decision under pressure; and cultural/contextual reading that models trained on historical data systematically miss.

---

**7. Existing AI training and education for [FIELD]**

What training programs exist for practitioners in [FIELD] seeking AI fluency — from tool vendors, professional organizations, schools, and independent educators? What do they teach, and what do they miss? Is there a resource specifically designed for the AI+1 approach — preserving professional identity while adding AI fluency, rather than training practitioners to become prompt engineers?

---

**8. The specific practice context this book targets**

This handbook is written for [YOUR SPECIFIC CONTEXT — e.g. "the one-client freelance practitioner, not the agency or in-house version"]. What is the scale of this segment? What AI risks are specific to this context and differ from adjacent ones (confidentiality, exclusivity, dependency, no institutional backup if an AI-assisted deliverable fails)? What does AI change about its economics — compression, expansion, or both? What does this practitioner need to know that others in the field do not?

---

**9. Data sources to prioritize**

[LIST the authoritative sources for your field — professional census/survey data, major industry reports, relevant government and standards-body guidance, licensing-policy documents, academic research on AI in this kind of work, and labor-market datasets such as Lightcast/Burning Glass for the field's roles.]

---

**Synthesize findings into:**

- A **Tier 1 task list** (what AI handles well in [FIELD] — by role and project type)
- A **Tier 4–7 task list** (what remains irreducibly human — by role and relationship type)
- The **three highest-risk AI failure modes** every practitioner must understand before using AI in real work
- The **most significant gap** between existing AI training for the field and what working practitioners actually need

---

**Flag:** Any evidence of the fluency trap in [FIELD] — where AI output looks like competent professional work but lacks the craft judgment, domain knowledge, and accountability that make it defensible. Give specific attention to the highest-exposure cases in this field.

---

## References

<!-- Fact-check references (confirmed sources only). Added by fact-check pass 2026-05-29. -->

- PwC. (2025). *The Fearless Future: PwC's 2025 Global AI Jobs Barometer.* https://www.pwc.com/gx/en/issues/artificial-intelligence/job-barometer/2025/report.pdf — confirms the ~56% cross-industry wage premium for jobs requiring AI skills referenced in this prompt.

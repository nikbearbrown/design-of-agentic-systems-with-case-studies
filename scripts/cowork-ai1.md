# Cowork or Codex Prompt: Running Project Exercise Generator
## For "AI + 1" Textbooks — *Irreducibly Human* Series

---

## ROLE & CONTEXT

You are a curriculum designer working on a "AI + 1" textbook in the *Irreducibly Human* series. You have access to all chapter markdown files for this book. Your job is to:

1. Read every chapter file
2. Identify the arc of the book — what concepts build on each other, what the learner can *do* by the end
3. Propose 3–5 candidate "running project" ideas that a learner could build incrementally, one chapter at a time, using AI tools (Claude, Claude Code, Cowork, or other LLMs)
4. Once a project is selected, generate a detailed **five-part exercise block** for the end of each chapter

The five exercise types are:

| # | Type | What it teaches |
|---|------|----------------|
| 1 | **When to Use AI** | Specific tasks in this chapter where AI assistance is appropriate and effective |
| 2 | **When NOT to Use AI** | Specific tasks in this chapter where human judgment is required and AI should not be trusted or delegated to |
| 3 | **LLM Exercise** | A copy-paste-ready prompt the learner uses with Claude or another chat LLM to advance their running project |
| 4 | **CLI Exercise** | An agentic task using Claude Code, Codex CLI, or Cowork to automate, generate, or manipulate files |
| 5 | **AI Validation Exercise** | A structured exercise in which the learner evaluates and critiques AI-generated output rather than generating it |

These five types work together. Exercise 1 and 2 establish the judgment frame for the chapter. Exercises 3, 4, and 5 put that judgment into practice using different tools and stances.

---

## STEP 1 — READ ALL CHAPTERS

Read every `.md` file in the textbook directory. For each chapter, extract:
- The chapter title and number
- The 2–3 core concepts introduced
- Any tools, frameworks, formulas, or methods taught
- What the learner can *do* after completing this chapter that they couldn't before
- Which of the five tiers of human intelligence (from the series taxonomy) this chapter primarily addresses

Produce a **Chapter Map** in this format:

```
Chapter N: [Title]
Core concepts: ...
New capabilities: ...
Key vocabulary: ...
Series tier(s): [Tier 4 / Tier 5 / Tier 6 / Tier 7]
```

---

## STEP 2 — PROPOSE 3–5 RUNNING PROJECTS

Based on the full Chapter Map, propose **3 to 5 candidate running projects**. Each project must:

- Be completable by a learner using AI tools (Claude, Claude Code, a Claude Project, or Cowork)
- Have a meaningful deliverable at the end of *every* chapter — not just the last one
- Be adaptable: a student in Finance could use it differently than one in Branding
- Represent a real artifact someone would actually want (a report, a tool, a dataset, a webpage, an analysis, an agent, etc.)
- Be achievable by both students and instructors
- Create natural opportunities across chapters for all five exercise types — especially for moments where the learner must decide when *not* to use AI

For each candidate, provide:

```
### Project Option [N]: [Name]

**What it is:** One sentence description.

**Final deliverable:** What exists at the end of the book.

**Why it fits this book:** How it maps to the book's arc.

**Adaptability:** How a Finance student vs. a Branding student would use it differently.

**Tool path:** Claude chat / Claude Project / Claude Code / Cowork / mix

**Validation opportunities:** Where in this project the learner will need to
validate AI output rather than trust it — what could go wrong and what does
catching it require.
```

**Present these options and pause. Do not proceed to Step 3 until the instructor or learner selects a project.**

---

## STEP 3 — GENERATE END-OF-CHAPTER EXERCISE BLOCKS

Once a project is selected, generate a **five-part exercise block** for each chapter. Always add the exercise block at the bottom of the chapter markdown file — not as a separate document.

Use the following structure exactly:

---

## Chapter [N] Exercises: [Chapter Title]

**Project:** [Selected project name]
**This chapter adds:** [One sentence — what piece of the project these exercises build]

---

### Exercise 1 — When to Use AI

**The judgment:** In this chapter's work, AI assistance is appropriate for the following tasks:

- [Task 1] — *Why AI works here:* [One sentence grounded in the chapter's concepts. Reference what kind of task this is: pattern recognition, drafting, reformatting, summarizing, generating options, etc.]
- [Task 2] — *Why AI works here:* [...]
- [Task 3 if applicable] — *Why AI works here:* [...]

**The tell:** You know you are using AI appropriately when you can evaluate the output — when you have independent criteria to judge whether it is correct, complete, and fit for purpose.

---

### Exercise 2 — When NOT to Use AI

**The judgment:** In this chapter's work, the following tasks require human judgment. Delegating them to AI is not appropriate — not because AI cannot produce output, but because AI output in these cases cannot be trusted without verification that requires the same expertise as doing the task yourself.

- [Task 1] — *Why AI fails here:* [One sentence. Be specific: is this a calibration problem? A missing ground truth problem? A hallucination risk? A values judgment? A causal identification problem? Connect to the chapter's tier of human intelligence.]
- [Task 2] — *Why AI fails here:* [...]
- [Task 3 if applicable] — *Why AI fails here:* [...]

**The tell:** You know you have crossed the line when you are using AI output as your reason for a conclusion rather than as a tool for reaching one. If you could not explain the conclusion without the AI, the AI did the work that should have been yours.

**Series connection:** [Name which tier of the series taxonomy this exercise is training — Tier 4 Metacognitive, Tier 5 Causal, Tier 6 Collective, or Tier 7 Wisdom — and why.]

---

### Exercise 3 — LLM Exercise

**What you're building this chapter:** [One sentence — what piece of the running project this prompt produces]
**Tool:** [Claude / Claude Project / Claude Code / Cowork — recommend the best fit and explain why in one sentence]

**The Prompt:**

```
[Full, copy-paste-ready prompt. Written for Claude by default.
Should:
- Reference the chapter's core concepts explicitly
- Give enough context that it works without reading the chapter first
- Produce a concrete output (code, analysis, copy, data structure, web page, etc.)
- Build on outputs from previous chapters where applicable
- Be specific enough to work, open enough to adapt
- NOT ask the AI to do anything flagged in Exercise 2]
```

**What this produces:** [Describe the expected output — a file, a plan, a page, a function, etc.]

**How to adapt this prompt:**
- *For your own project:* Replace [X] with your domain, [Y] with your specific data or context
- *For ChatGPT / Gemini:* [Note any phrasing changes needed]
- *For a Claude Project:* [What to put in the system prompt vs. the message]

**Connection to previous chapters:** [How this builds on prior LLM exercises]
**Preview of next chapter:** [One sentence teaser of what the next exercise will add]

---

### Exercise 4 — CLI Exercise

**What you're building this chapter:** [One sentence — what file, dataset, or automated output this produces]
**Tool:** [Claude Code / Codex CLI / Cowork — specify and explain the choice]
**Skill level:** [Beginner / Intermediate / Advanced — flag if this requires comfort with terminal]

**Setup:**

Before running this exercise, confirm:
- [ ] [Prerequisite file or output from a previous exercise that must exist]
- [ ] [Any required tool installed or configured]
- [ ] [Any CLAUDE.md or AGENTS.md instruction the learner should add for this task]

**The Task:**

```
[Exact instruction to paste into Claude Code / Codex CLI / Cowork.
Should:
- Specify which files to read, which to write, and which to leave alone
- Include explicit scope and stopping conditions
- Include a verification step (run tests, check output, compare diff)
- Be safe to run — no destructive operations without explicit confirmation
- Reference the chapter concept it is demonstrating]
```

**Expected output:** [What file or result exists after this exercise runs]

**What to inspect in the output:** [Specific things the learner should check — connecting to the chapter's validation concepts]

**If it goes wrong:** [Most likely failure mode and how to recover — don't just say "re-run it"]

**CLAUDE.md / AGENTS.md note:** [Whether this task should add a standing rule to the project's persistent instruction file, and what that rule should say]

---

### Exercise 5 — AI Validation Exercise

**What you're validating:** [One sentence — what AI-generated output the learner will evaluate]
**Validation type:** [Code / Factual claim / Reasoning chain / Structured data / Agentic output — label it]
**Risk level:** [Low / Medium / High — and what makes it that level]

**Setup:**

[Either: (a) use the output from Exercise 3 or 4 as the artifact to validate, or (b) provide a pre-generated artifact below that the learner did not produce themselves — use (b) when the chapter's validation lesson requires demonstrating a specific failure mode]

[If (b): paste or describe the pre-generated artifact here]

**The Validation Task:**

Evaluate the AI output above using the following checklist. For each item, record: Pass / Fail / Cannot determine — and explain your reasoning.

```
Validation Checklist — [Chapter Title]

□ Correctness: Does the output accurately reflect the chapter's core concept?
  [Specific question grounded in this chapter's content]

□ Completeness: Is anything important missing?
  [Specific question — what would a domain expert notice is absent?]

□ Scope: Did the AI stay within the task boundaries?
  [Specific question — did it add anything that wasn't asked for, or omit something that was?]

□ [Chapter-specific criterion 1]: [Question derived from this chapter's concept — e.g., for a causal reasoning chapter: "Does the output distinguish correlation from causation?"]

□ [Chapter-specific criterion 2]: [Another chapter-specific criterion]

□ Failure mode check: Does this output exhibit any of the following?
  - Fluent but wrong (plausible-sounding incorrect claims)
  - [Chapter-relevant failure mode from the validation synthesis — e.g., hallucinated citation, schema-valid but semantically wrong, approval fatigue, automation bias trigger]
  - Missing ground truth (the output cannot be verified without expertise the AI doesn't have)
```

**What to do with your findings:**

- If the output passes all checks: proceed to use it in your project. Note what made it trustworthy.
- If the output fails one check: revise the prompt and re-run Exercise 3 or 4. Document what changed.
- If the output fails multiple checks or you cannot determine pass/fail: this is a "When NOT to Use AI" moment. Do this part of the task yourself.

**AI Use Disclosure prompt:**

After completing this validation, write a two-sentence AI Use Disclosure:

> *Sentence 1:* What AI produced in this exercise and how you used it.
> *Sentence 2:* One specific thing the AI could not determine that required your judgment.

**Series connection:** [Name the validation failure mode this exercise is training the learner to catch, and connect it to the series tier — e.g., "This exercise trains Tier 4 metacognitive supervision: the capacity to know when the machine's output cannot be trusted without external grounding."]

---

## FORMATTING RULES

- Every exercise block must be added at the **bottom of the chapter markdown file** — not as a separate document
- Exercises 1 and 2 are always written in the instructor's voice — they establish the judgment frame before the learner picks up a tool
- Exercise 3 (LLM) defaults to **Claude** (claude.ai chat); recommend Claude Project when the running project benefits from persistent context
- Exercise 4 (CLI) defaults to **Claude Code**; recommend Codex CLI or Cowork when the task involves file automation or multi-step workflows that benefit from a different interface
- Exercise 5 (Validation) uses the output of Exercise 3 or 4 wherever possible — the learner validates what they just generated; use a pre-generated artifact only when the chapter's lesson requires demonstrating a specific failure mode the learner's own prompt is unlikely to produce
- Every prompt in Exercises 3 and 4 must be **copy-paste ready** — no unfilled placeholders in the prompt itself, only in the adaptation notes
- Adaptation notes must be genuinely useful, not boilerplate
- The AI Use Disclosure in Exercise 5 is mandatory — it is the primary mechanism by which the series tests its own thesis

---

## TONE & AUDIENCE

- **Students:** Exercises should feel like building *their* thing, not completing an assignment. The five-part structure should feel like a workflow, not a checklist.
- **Instructors:** The structure is designed for easy domain-swapping. Exercises 1 and 2 in particular should be modifiable to fit any field by changing the domain nouns.
- Write at the level of an engaged graduate student or early-career professional with no prior AI tool experience but genuine curiosity and enough domain knowledge to evaluate outputs in their field.

---

## OUTPUT ORDER

1. Chapter Map (all chapters)
2. 3–5 Project Options with validation opportunity notes → **PAUSE for selection**
3. After selection: Full five-part exercise blocks for every chapter, in order

---

## NOTES FOR ADAPTING THIS PROMPT TO OTHER LLMs

- **ChatGPT (GPT-4o):** Works as-is. Replace "Claude Project" with "Custom GPT" in Exercise 3 adaptation notes. Replace "Claude Code" with "Codex CLI" in Exercise 4.
- **Gemini:** Works as-is. Note that Gemini's Google Drive integration may offer tighter file access than Cowork for Exercise 4 in Google-native workflows.
- **Claude Code (running this prompt itself):** Best used for Step 3 when the textbook has code-heavy chapters. Feed it the Chapter Map from Step 1 and ask it to generate the five-part exercise blocks as `.md` files directly, appended to each chapter file.
- **Cowork:** Best used when Exercise 4 involves reading multiple chapter files and writing outputs across a project directory. The persistent instruction file (CLAUDE.md or AGENTS.md) should include a note about which running project has been selected, so Cowork doesn't re-propose options mid-session.
# Cowork or Codex Prompt: AI Wayback Machine Section Generator
## For "intelligence"

---

NOTE: DO NOT add emojis, remove them if the exist the the AI Wayback Machine Section

## ROLE & CONTEXT

You are a curriculum designer working on the "intelligence" textbook. You have access to all chapter markdown files. Your job is to insert a short **"AI Wayback Machine"** section at the bottom of each chapter, directly after the LLM Exercise block.

This section does two things at once: it surfaces a historical figure connected to the chapter's concepts, and it gives the learner a short prompting exercise — because this is a book about prompting, and every section should model that.

The learner runs the prompt themselves. Then they're invited to improve it.

Not just AI people ... the point is to use AI to research people that should be better known

---

## WHAT THE SECTION IS

A short, learner-facing block containing:

1. A one-sentence framing that connects the chapter to a historical figure
2. A **copy-paste-ready prompt** the learner can run right now in Claude (or any LLM)
3. A brief "make it better" nudge — one or two specific suggestions for how to enhance the prompt

The tone is: *"here's a prompt, run it, then make it yours."*

---

## SELECTION CRITERIA FOR FIGURES

For each chapter, identify **one primary figure** to feature in the prompt. Prioritize:

- **Lesser-known over famous** — push past Turing, von Neumann, McCarthy. There are better choices.
- **Diverse** — by gender, nationality, race, era, and discipline. The history of computing, cognitive science, and mathematics is far wider than the standard Western male roster.
- **Genuinely connected** — the link to the chapter's concepts should be substantive. A figure who worked *on* the thing, not just *near* it.
- **Wikipedia-accessible** — the figure must have a Wikipedia page a curious undergraduate can read without domain expertise

Figures may come from: AI research, cognitive science, linguistics, mathematics, logic, statistics, neuroscience, philosophy of mind, cybernetics, information theory, library science, operations research, and adjacent fields.

---

## OUTPUT FORMAT

Insert the following block at the bottom of each chapter file, immediately after the LLM Exercise block:

---

```markdown
---

##  AI Wayback Machine

The ideas in this chapter didn't appear from nowhere. **[Full Name]** was working on [one-phrase description of relevant work] decades before most people had heard of [chapter concept]. Here's a prompt to find out more — and then make it better.

**Run this:**

\```
Who was [Full Name], and how does their work on [specific concept or method] connect to [chapter topic]? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
\```

→ Search **"[Full Name]"** on Wikipedia after you run this. See what the model got right, got wrong, or left out.

**Now make the prompt better.** Try one of these:
- Ask it to explain [specific concept] in plain language, as if you've never heard of [chapter topic]
- Ask it to compare [Full Name]'s approach to how we'd solve the same problem today
- Add a constraint: "Answer in the style of a museum placard" or "Answer as if you're writing a footnote in a textbook"

What changes? What gets better? What gets worse?
```

---

## FORMATTING RULES

- The section heading is always `##  AI Wayback Machine`
- Always insert after the LLM Exercise block, never before it
- One figure per chapter — no secondary figures
- The embedded prompt must be **copy-paste ready** with no placeholders inside the prompt itself — only in the "make it better" suggestions
- The Wikipedia instruction uses the person's full name exactly as it appears on their Wikipedia page title
- Do not include URLs — tell the learner what to search
- Keep the full section under 175 words
- Never repeat a figure across chapters
- The "make it better" suggestions must be **specific to this chapter and figure** — not generic prompting advice

---

## DIVERSITY TRACKING

As you generate figures across all chapters, maintain a running tally and flag if the set skews in any direction (all Western, all male, all 20th century, etc.). Adjust selections to correct the balance before finalizing.

Produce a **Diversity Summary** at the end of your output:

```
Figures included: [list]
Gender breakdown: ...
Geographic/national breakdown: ...
Era breakdown (pre-1950 / 1950–1990 / post-1990): ...
Disciplines represented: ...
Flags: [any imbalances to address]
```

---

## OUTPUT ORDER

1. For each chapter in sequence: the full `## AI Wayback Machine` block, ready to paste into that chapter's `.md` file
2. Diversity Summary at the end

---

## NOTES FOR ADAPTING THIS PROMPT TO OTHER LLMs

- **ChatGPT / Gemini:** Works as-is. Swap "Claude" for the relevant tool name in the learner-facing framing.
- **Claude Code:** Feed it the Chapter Map from the LLM Exercises prompt and run this as a batch — it can append blocks directly to each `.md` file.
- **Claude Project:** If the LLM Exercises prompt is already running in a Project, add this prompt to the same Project so it shares the Chapter Map without regenerating it.

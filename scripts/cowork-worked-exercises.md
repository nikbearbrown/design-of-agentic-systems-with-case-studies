# Cowork Prompt: Generate Worked Exercises for Each Chapter

---

## ROLE & CONTEXT

You are working on a university-level textbook. You have access to all chapter
files in `chapters/`. Your job is to generate a worked-exercises file for each
chapter and write it to `worked-problems/`.

This is a generation pass, not an extraction pass. You are writing new content
derived from each chapter's concepts, vocabulary, and examples.

---

## STEP 1 — IDENTIFY CHAPTERS TO PROCESS

Read the `chapters/` directory. Process every `.md` file except:

- `00-frontmatter.md`
- `99-back-matter.md`
- Any file whose name contains `exam`, `midterm`, or `back-matter`

For each chapter file, extract before writing:

- Chapter number and title (from the filename and `# heading`)
- Core concepts (from the chapter body — the main ideas the chapter teaches)
- Key vocabulary (any terms defined or emphasized in the chapter)
- Named examples, cases, or primary sources used in the chapter
- The chapter's anchor assignment or central task (if present)
- What the student can do after this chapter that they couldn't before

---

## STEP 2 — GENERATE THE WORKED-EXERCISES FILE

For each chapter, generate one file:

**Filename:** same as the chapter file but with `-worked-exercises` appended
before the `.md` extension.

Examples:
- `chapters/04-literacy-narrative.md`
  → `worked-problems/04-literacy-narrative-worked-exercises.md`
- `chapters/01-fundamentals-of-programming-in-java.md`
  → `worked-problems/01-fundamentals-of-programming-in-java-worked-exercises.md`

**Write to:** `worked-problems/` directory alongside `chapters/`.
Create the directory if it does not exist.

---

## STEP 3 — FILE STRUCTURE

Each worked-exercises file must follow this structure exactly:

---

```markdown
# Worked Exercises: [Chapter Title]

*Chapter [N] of [Book Title]*

> These exercises follow a research-backed sequence: full worked example →
> matched practice → completion problem → error-recognition → transfer →
> interleaved review. Each section builds on the previous. Do not skip ahead.

---

## Prerequisites

What you need from this chapter before these exercises make sense:

- [Concept 1 — one sentence stating what must be understood]
- [Concept 2]
- [Concept 3 if applicable]

---

## Part A — Full Worked Example

**What this demonstrates:** [One sentence — which core concept from the
chapter this example makes visible]

**The problem:**

[A specific, concrete problem grounded in the chapter's concepts. Not generic.
Use the chapter's named examples, cases, or domain where possible.]

**The solution:**

[Step-by-step solution. Each step has three parts:]

**Step 1 — [Label the subgoal, not just the action]**
[What is done]
*Why:* [Which principle or concept justifies this move — connect explicitly
to chapter vocabulary]
*Check:* [How to verify this step is correct before proceeding]

**Step 2 — [Subgoal label]**
[What is done]
*Why:* [Principle connection]
*Check:* [Verification]

[Continue for all steps. Minimum 3 steps, maximum 7. If the solution requires
more than 7 steps, it is two problems, not one.]

**Final answer:** [Clear statement of the result]

**What made this work:** [One paragraph connecting the solution back to the
chapter's central concept. Name the concept explicitly. Explain why this
approach worked where a naive approach would fail.]

**Self-explanation prompt:** Before moving on, close this page and write
one sentence answering: *What principle did Step [N] rely on, and when
would that principle not apply?*

---

## Part B — Matched Practice Problem

**Same structure, different surface.** This problem uses the same underlying
concept as Part A but different details. Do not copy the Part A solution.
Work it from scratch.

**The problem:**

[A problem with the same deep structure as Part A — same concept, different
scenario, different numbers or names or context.]

**Stuck?** Return to Part A and identify which step maps to your current
obstacle. Do not read ahead to Part C until you have attempted this problem.

*Instructor note: A worked solution for Part B is not provided here. The
point is production, not verification. If you need a solution key, generate
one from the Part A template using the same step-label structure.*

---

## Part C — Completion Problem

**What's missing:** Steps [N] and [N+1] have been removed. You must supply them.

**The problem:**

[Same type as Parts A and B.]

**Partial solution:**

**Step 1 — [Subgoal label]**
[Completed — identical in structure to Part A]
*Why:* [Provided]

**Step 2 — [Subgoal label]**
[Completed]
*Why:* [Provided]

**Step 3 — [BLANK]**
*Your work here:*

_____________________

*Why (your explanation):*

_____________________

**Step 4 — [BLANK]**
*Your work here:*

_____________________

*Why (your explanation):*

_____________________

**Step 5 — [Subgoal label]**
[Completed — the final step is always provided to anchor the goal state]
*Why:* [Provided]

**Final answer:** [Provided]

**Self-explanation prompt:** Compare your Step 3 and Step 4 to the Part A
solution. Where did your reasoning match? Where did it differ? Which
difference matters?

---

## Part D — Error-Recognition Problem

> **Use this section only after completing Parts A–C.**
> For complete novices working through this chapter for the first time,
> skip to Part E and return here after completing the full chapter.

**What's wrong:** The solution below contains one error. It is marked with ⚠.
Your job is to find it, explain why it is wrong, and correct it.

**The problem:**

[Same type as Parts A–C.]

**The flawed solution:**

**Step 1 — [Subgoal label]**
[Correct]

**Step 2 — [Subgoal label]**
[Correct]

**Step 3 — [Subgoal label]** ⚠
[A plausible but incorrect version of this step — use a common misconception
from the chapter's domain, not a random error. The error should be one that
a student who understood the surface procedure but missed the underlying
principle would make.]

**Step 4 — [Subgoal label]**
[Correct — but note: if Step 3 is wrong, Step 4 may produce a result that
looks plausible, which is what makes this error dangerous]

**Your tasks:**

1. Identify which step contains the error (do not just say "Step 3" — explain
   what is wrong with it and why the correct approach is different).
2. Write the corrected Step 3.
3. Explain what principle the original Step 3 violated.
4. Describe a test you could run to catch this class of error in your own work.

**Why this error is common:** [One sentence explaining the misconception
that produces this error — grounded in the chapter's concepts.]

---

## Part E — Transfer Problem

**Same principle, new context.** This problem uses the same underlying concept
from the chapter but in a scenario not discussed in the chapter. No worked
example is provided.

**The problem:**

[A problem that requires the same core skill or concept but is set in a
different domain, genre, or situation than the chapter examples. For a
writing textbook: if the chapter used journalism examples, use a legal
brief or a scientific abstract here. For a CS textbook: if the chapter
used one data structure, use a different one here. The surface is unfamiliar;
the deep structure is the same.]

**Hint (use only if stuck after 10 minutes):** [One sentence that names the
relevant principle without solving the problem.]

**Reflection prompt:** After completing this problem, write two sentences:
(1) What concept from the chapter did you apply, and how did you recognize
it applied here? (2) What was different about applying it in this new context?

---

## Part F — Interleaved Review

**Mixed problem set.** These problems draw on concepts from this chapter and
from previous chapters. You must decide which concept or method applies to
each problem before solving it. That selection step is the point.

**Problem F1:**
[A problem whose solution requires a concept from *this* chapter]
*Chapter this draws from: [Chapter N]*

**Problem F2:**
[A problem whose solution requires a concept from a *previous* chapter —
specify which one by name]
*Chapter this draws from: [Chapter N-X — name it explicitly]*

**Problem F3:**
[A problem that could superficially appear to require concept A (from a
prior chapter) but actually requires concept B (from this chapter) — or
vice versa. The discrimination is the exercise.]
*Note to instructor: This problem is intentionally ambiguous on first reading.
The student should commit to an approach before solving, then reflect on
whether the approach was correct.*

**After completing F1–F3, answer:** For each problem, state which concept
you reached for first and whether that was the right call. If you chose
wrong, what cued you to switch?

---

## Instructor Notes

**Common errors to watch for in student work:**

- [Error 1 — specific to this chapter's concepts, not generic]
- [Error 2]
- [Error 3 if applicable]

**Signs a student needs to return to the chapter before these exercises:**

- [Specific knowledge gap that would make Part A impossible]
- [Specific confusion that suggests the chapter's core concept was missed]

**Scaffolding adjustments:**

- *For students who struggle with Part A:* [One specific intervention —
  not "review the chapter" but a targeted suggestion]
- *For students who finish Part F quickly:* [One extension that increases
  difficulty without changing the concept]

**Domain adaptation note:** These exercises were generated from the chapter
as written. An instructor teaching a different population (e.g., engineering
students vs. humanities students) can substitute domain-appropriate surface
content in Parts B, E, and F while preserving the structural sequence.
```

---

## RULES

**Read the chapter fully before generating anything.** The exercises must be
grounded in the chapter's actual content — named examples, specific
vocabulary, the chapter's anchor assignment. Generic exercises that could
belong to any textbook are wrong.

**Subgoal labels are mandatory.** Every solution step must have a label that
names the conceptual move, not just the mechanical action. "Apply Newton's
second law" not "Multiply." "Identify the rhetorical situation" not "Step 2."
This is the single most important structural requirement.

**Part D errors must be domain-specific.** The error in the error-recognition
problem must reflect a real misconception that students of this chapter's
material actually make. Do not invent a random arithmetic mistake or a typo.

**Part F must name the source chapter for each problem.** The interleaving
benefit only works if the student knows they are being asked to discriminate.
Name the chapter explicitly in the instructor tag.

**Bridge chapters get a reduced set.** If a chapter is a bridge chapter
(short, no anchor assignment, under 2,500 words), generate only Parts A, B,
and C. Add a note at the top: `*Bridge chapter — Parts D, E, and F omitted.*`

**Do not generate solutions for Part B.** Part B is a production exercise.
Providing a solution defeats the purpose. The instructor note is sufficient.

**No emojis** except the ⚠ marker in Part D.

**Preserve chapter vocabulary.** Use the exact terms the chapter introduces.
If the chapter defines *rhetorical situation*, the exercises use that term,
not "context" or "communication setup."

---

## STEP 4 — REPORT

After writing all files, produce a brief generation report:

```
## Worked Exercises Generation Report

Book: [title from metadata.yaml or folder name]
Chapters processed: [N]
Files written: [N]

| Chapter | File | Parts generated | Notes |
|---------|------|-----------------|-------|
| Ch 01: [title] | 01-...-worked-exercises.md | A B C D E F | |
| Ch 05: [title] | 05-...-worked-exercises.md | A B C | Bridge chapter |
| ...

Files written to: worked-problems/
```

---

## NOTES FOR ADAPTING

**For a writing textbook** (like *Writing Guide with LLMs*): "problems" are
writing tasks — analyze this passage, draft a paragraph using this technique,
identify the rhetorical move in this excerpt. Part A's "solution" is an
annotated model draft, not a calculation. Part D's error is a structural or
rhetorical mistake in a student-style piece, not a logical error.

**For a STEM textbook** (like *Info 5100*): standard problem-solution
structure. Part A solutions should include trace tables or expected output
for programming chapters.

**For a mixed textbook**: the structure is stable across domains. The only
thing that changes is what counts as a "step" and what counts as an "error."

**On running this again:** safe to re-run at any time. Existing files in
`worked-problems/` are overwritten. Chapter files are never modified.

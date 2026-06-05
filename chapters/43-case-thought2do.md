# Chapter 43 — Case: Thought2Do

*A four-agent voice-driven task system designed around the recognition that the friction of logging a task is higher than the friction of doing it — with an evaluation framework that names "silent failure" as the primary metric.*

**Author:** Yohan Markose
**Editor:** Nik Bear Brown

*Note: this case documents a proposal-stage system. The architectural design and evaluation framework are committed; the final outcomes section reports targets, not measured metrics.*

---

## Situation

It is 9 PM. You are halfway through dinner and three things pop into your head: submit a form by Friday, follow up with your manager, buy groceries. You think *I'll add those to my list later* — and forget by the time dinner is done. The friction isn't that the to-do app is ugly. It's that opening an app, navigating to a list, typing each task, assigning categories and priorities, all of it is *work*, and a brain mid-thought doesn't want to do work. The thought evaporates. Studies on cognitive load suggest an interrupted thought takes [an average of 23 minutes](https://www.ics.uci.edu/~gmark/chi08-mark.pdf) to fully recover; the cost of not capturing a task in the moment isn't a few seconds of typing, it's the task never being logged at all. Siri creates reminders but doesn't decompose *prepare for my presentation* into subtasks, doesn't notice you already have *review slides* in your list and that these might be the same thing, doesn't look at your week and say *three of your tasks are due Thursday — rethink your priorities*. ChatGPT is a stateless conversation. Thought2Do's architectural premise: a system with memory and agency that listens to natural voice input and turns it into structured, deduplicated, prioritized tasks — the multi-agent reasoning layer between voice and a living database that no single LLM prompt can replace.

## Architecture

The pipeline is voice → Whisper → four-agent LangGraph workflow → MongoDB → Streamlit. **Voice Input** captures audio in the browser. **Whisper API** transcribes ephemerally — no audio storage. **Intent Agent** classifies the operation (CREATE / UPDATE / DELETE / QUERY); the user never says *"create task"* — *"actually, forget that last one"* is detected as DELETE, *"push my grocery run to Sunday"* as UPDATE on an existing task. **Decomposition Agent** listens for compound or vague inputs; *"Get ready for my trip"* decomposes into packing, check-in, transport arrangement, and other subtasks. **Deduplication Agent** compares incoming tasks against the database; *"remind me to call the doctor"* repeated two weeks after an existing un-actioned identical task gets flagged, not duplicated. **Prioritization Agent** runs on a schedule, re-ranking the list as deadlines approach. **MongoDB** persists the user's task history in user-isolated collections.

The technology stack: OpenAI Whisper (STT), GPT-4o (reasoning), LangGraph (agent orchestration), MongoDB Atlas (persistence), FastAPI + Streamlit (backend + frontend), GCP Cloud Run via Docker (deployment).

## Design rationale

The architectural commitment that earns the system's name is **multi-agent decomposition over a single-prompt pipeline**. A naive design would send every voice transcript to a single GPT-4o call with *"figure out what to do with this and update my task list."* The four-agent decomposition closes four specific failure modes the single prompt cannot. Intent classification has to happen first — without it, the system can't tell whether to insert, update, or delete. Decomposition is a different reasoning task: *what does it mean to break this user input into atomic tasks?* — that question requires looking at the input alone. Deduplication needs the input *and* the existing database — comparing one against the other is a third reasoning move. Prioritization is a fourth move that looks across all current tasks and re-orders them. Putting these in one prompt collapses four distinct judgments into one stochastic output; separating them into four agents lets each agent be evaluated, prompted, and improved independently.

The **explicit silent-failure framing in the evaluation design** is the second consequential design move. The proposal names the failure mode the chapter has been arguing about: a task card that *looks fine on the UI* but is logically broken — a deadline parsed under the wrong timezone, a vague task like *"handle it"* that passes through without decomposition and sits in the list at false High priority, a duplicate added rather than merged so the system now holds two conflicting versions of the same intent. These don't throw errors. They quietly erode trust. The author commits to specific measurable metrics rather than vibes:

- **Intent Classification Accuracy** — percentage of utterances correctly identified as CREATE / UPDATE / DELETE / QUERY
- **Field Extraction F1** — precision and recall on task name, category, priority, deadline
- **Decomposition Rate** — percentage of multi-task utterances correctly split into the right number of subtasks
- **Deduplication Precision** — percentage of true duplicates caught versus false positives where distinct tasks get wrongly merged
- **Human Audit Score** — 1-5 rating on a 20-task sample reviewed for logical coherence

The **scoped knowledge boundary** is the third move. The system uses no external datasets or scraped content. The only "data" is the user's own task history in MongoDB. GPT-4o is used purely for reasoning — parsing, structure extraction, prioritization judgments — not as a factual retrieval source. The hallucination surface is bounded by what the user has said; the model can't invent a deadline from the internet, only misparse a deadline the user gave it. That's a catchable failure with the evaluation framework above.

## Trade-offs

Whisper transcription is the lowest-confidence stage in the pipeline — a misheard word at the front propagates through every downstream agent. The proposal acknowledges this and bounds it as a measurable risk via the Field Extraction F1 metric. LangGraph multi-agent systems are powerful and complex; the named risk is that the orchestration overhead can compound faster than the agent contributions improve. The proposed mitigation is strict Minimum Viable Logic discipline — build modularly so each agent can be tested in isolation before being wired together. GPT-4o per-operation cost is small (~$0.01-$0.03) but real at sustained user volume; cost would shift toward a smaller model for steady-state operation if the system reached scale.

## Outcomes and revisions

This case is documented at the **proposal stage**. Outcomes section reports the evaluation framework the author committed to, not measured numbers. The Minimum Viable Logic (what will definitely ship): voice input → Whisper transcription → GPT-4o intent + entity extraction → structured task stored in MongoDB; full CRUD operations via voice; auto-categorization and priority assignment; the four-agent LangGraph workflow; Streamlit UI displaying the live structured task list. Stretch goals: scheduled background prioritization re-ranking (cron-triggered agent), GCP Cloud Run deployment via Docker. Total estimated cost under $10 for full demo testing. The most consequential planned next step is implementing the 50-utterance hand-labeled benchmark and running the four metrics against it to calibrate where the agents most need improvement.

## Pattern connection

Thought2Do's design instantiates Chapter 9's Isolation principle (four scoped agents with bounded responsibilities and typed handoffs) and Chapter 12's framework-correctness argument (LangGraph's typed state and conditional edges enforce the four-agent sequence structurally). The explicit silent-failure framing in the evaluation design is itself a small but important pattern: when designing a system whose primary failure mode is *output that looks fine and is wrong*, the evaluation framework needs metrics that surface logical coherence (Human Audit Score) alongside structural accuracy (Field Extraction F1) — neither alone is sufficient.

## Transfer prompt

In your own multi-step LLM workflow, are distinct reasoning tasks (intent classification, decomposition, deduplication, prioritization) being handled by separate agents with separate prompts and separate evaluations — or collapsed into one stochastic call? When you write your evaluation framework, do you have a metric specifically for *output that looks correct and is logically wrong*, or are you measuring only structural compliance? When your system has external speech-to-text or OCR at the front, is the downstream pipeline's confidence reporting honest about that input-stage uncertainty?

---

*Spring 2026.*


---

## A note about AI

Thought2Do converts thinking into action items. The conversion is exactly the move the model is biased to do too eagerly.

Where the model genuinely helps: surfacing the recurring patterns in your captured thoughts.

Where the model does damage: declaring an action item from a thought you have not yet finished thinking. Premature actionability undermines the thinking.

The rule: pattern surfacing from the model; the conversion to action from you.

---

## AI Wayback Machine

**David Allen** was wrote Getting Things Done in 2001 — the system of capturing thoughts into action items that productivity tools still implement.

![David Allen](../images/allen-newell-233.png)

*Puppet Art by [Nik Bear Brown](https://www.nikbearbrown.com/).*

**Run this:**

```
Who is David Allen, and how does their work connect to the thought-to-action agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"David Allen"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply David Allen's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of David Allen's framework."

What changes? What gets better? What gets worse?

# Chapter 21 — Case: CrisisLens

*A four-step agentic pipeline that scores crisis-line volunteer practice transcripts against clinical frameworks — and tests itself with adversarial transcripts where the failures are the point.*

**Author:** Kavin Ravi Jha
**Editor:** Nik Bear Brown

---

## Situation

The [988 Suicide and Crisis Lifeline](https://988lifeline.org/) handled over 5 million contacts in 2023. The volunteers who answered those calls were, by most measures, undertrained — staff turnover at many crisis centers exceeds 50% annually according to the [American Association of Suicidology](https://suicidology.org/), reflecting both burnout and the failure of training pipelines that have not meaningfully changed in decades. A training coordinator at a mid-sized crisis center spends an estimated two to three hours per trainee per week on manual transcript review. Most organizations do not have that time. The mistakes that look fine on the surface but miss a buried signal go uncaught. The cost of a silent failure in this context is not a wrong answer on a test. It is a caller who described hopelessness in three separate sentences and a volunteer who heard none of them. CrisisLens is an AI coaching assistant for crisis-hotline training programs: a volunteer completes a simulated practice call, submits the transcript, and receives structured, clinically grounded coaching feedback in seconds. The system does not interact with real callers. It does not replace supervisors. It fills the feedback gap.

## Architecture

The pipeline is four steps grounded in two operationalized clinical frameworks: the [Columbia Suicide Severity Rating Scale (C-SSRS)](https://cssrs.columbia.edu/) and [SAMHSA Motivational Interviewing principles](https://www.samhsa.gov/).

**Step 1 — Risk Detection.** Scans every exchange for C-SSRS language markers across six categories: Passive Ideation, Active Ideation, Ideation with Plan, Preparatory Behavior, Veiled Signal, and Hopelessness Marker. **Step 2 — Confidence Score.** Rates each detected signal HIGH, MEDIUM, or LOW with clinical reasoning and calibration notes; runs sequentially after Step 1. **Step 3 — MI Evaluation.** Scores volunteer responses against five SAMHSA criteria: Reflective Listening, Open-Ended Questions, Affirmation, Appropriate Escalation, and avoiding Premature Problem-Solving. **Step 4 — Coaching Feedback.** Generates ranked, exchange-level coaching notes with alternative responses; runs last because it depends on Steps 2 and 3.

Steps 1 and 3 run in parallel via `ThreadPoolExecutor`, reducing total analysis time by approximately 40%. The system runs on GPT-4o with a Python backend and Streamlit frontend, requiring no vector database, no fine-tuning, and no external infrastructure beyond an OpenAI API key.

Six operating modes wrap the pipeline. **Transcript Analysis** is the primary mode. **Red-Team Mode** is the standout evaluation feature: it generates adversarial practice transcripts with a configurable number of deliberately buried risk signals, runs the detection pipeline, and computes a recall score. **Scenario Generator** produces targeted training transcripts across six clinical scenario types — Indirect Language Only, Deflector, High-Functioning Crisis, Farewell Caller, Hopelessness Without Ideation, Ambiguous Mixed Signals. **Comparative Analysis**, **Progress Tracker**, and **Alternative Response Generator** complete the suite.

## Design rationale

The architectural commitment that earns the system's name is **measuring the system the way it can fail rather than the way it succeeds.** Recall on adversarial transcripts is the primary evaluation metric because that is where silent failures concentrate. A system that handles obvious crisis signals correctly and misses buried ones scores impressively on naive transcripts and dangerously on adversarial ones. Red-Team Mode is the architecture's own honest stress test, and the recall numbers it returns are the metric the rest of the system is judged against — not the friendly-case accuracy that flatter benchmarks measure.

The **two-framework grounding** — C-SSRS for caller signals, MI for volunteer responses — is the choice that prevents the system from collapsing the two evaluations into one prompt with one shared rubric. Caller-side detection and volunteer-side scoring are two different jobs requiring two different vocabularies. Running them as separate parallel passes preserves the distinction in the output: a transcript can score 75/100 on MI (volunteer responses competent) and still surface seven buried C-SSRS signals (caller in serious crisis the volunteer didn't recognize). Collapsing the two would produce a single overall grade that hides exactly the case the system is built to catch.

The **scenario-typed transcript generator** is the third consequential design move. Six scenario types target six specific clinical skills, and each generated transcript carries clinical notes and ground-truth signal locations. This makes the training material *labeled* — when a trainee misses the buried hopelessness marker in a Farewell Caller transcript, the coaching output names what was missed and where, because the generator knew where it placed it.

## Trade-offs

The system is grounded in two specific frameworks and inherits their limitations: C-SSRS is North-American clinical practice and may underrepresent culturally specific expressions of crisis. The pipeline is GPT-4o-only at submission — no model-portability layer — which makes the system cost-coupled to a single vendor's pricing curve. The Red-Team recall rate is the primary metric, and recall on the deployed application across two run conditions was **33.3% and 50.0%** — *visible*, *named*, *not flattered*. That is the trade-off the chapter wants to surface: a system whose primary metric is the harshest one will report numbers that look worse than systems benchmarked on softer ones, and that is a feature rather than a bug for high-stakes use.

## Outcomes and revisions

Live testing on the deployed application with GPT-4o, no estimated or synthetic numbers reported. **Farewell sample transcript** (the hardest test case — caller sounds warm and at peace throughout while embedding seven clinical risk signals): 7 signals detected, overall score 60/100, MI score 75/100. **Red-Team recall** across two runs: 33.3% and 50.0% — meaning across deliberately adversarial inputs with planted signals, the system catches between one-third and one-half of them, which is the kind of report that drives a real Phase 2 rather than a published claim of capability. The author's own framing matches: a silent failure is when the system returns a professional-looking coaching report while missing buried suicidal ideation entirely, and Red-Team Mode tests for exactly that.

The most consequential planned revision is expanding the framework grounding beyond C-SSRS / MI to include cultural variants and clinician-supervisor co-evaluation, plus model-portability layer to test whether the recall numbers move with model selection or are bounded by the framework operationalization itself.

## Pattern connection

CrisisLens instantiates Chapter 7's Fact Check List Pattern (every coaching note ties to an exchange-level transcript location, never a free-form judgment), Chapter 9's parallel-step composition (Steps 1 and 3 are independent and run concurrently), and Chapter 12's coordination-model-matches-correctness-property (the workflow is sequential where dependent and parallel where independent — a coordination shape custom Python orchestration handles directly without framework overhead).

## Transfer prompt

In your own evaluation suite, what is the *adversarial* baseline — inputs deliberately constructed to expose the failure mode you most want to catch — and how does your system score on it? When your task evaluates two distinct subjects (caller vs. volunteer; query vs. response; user input vs. system output), are you running them through one shared rubric or two specific ones? When recall matters more than precision, are you measuring it on the cases that hide the signal, or only on the cases that announce it?

---

*Spring 2026.*


---

## A note about AI

CrisisLens is an agent for crisis response — high stakes, time pressure, imperfect information. The model's failure mode under time pressure is confident-and-wrong.

Where the model genuinely helps: producing the canonical crisis frameworks and the categories of decisions that need to be made in the first hour.

Where the model does damage: making the actual crisis decisions. Decisions under crisis require accountability, and the model is not accountable.

The rule: framework from the model; decisions by a named human in the chain of command.

---

## AI Wayback Machine

**Charles Perrow** was sociologist whose Normal Accidents (1984) framework explains how complex, tightly-coupled systems fail in crisis.

**Run this:**

```
Who is Charles Perrow, and how does their work connect to the crisis-response agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Charles Perrow"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Charles Perrow's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Charles Perrow's framework."

What changes? What gets better? What gets worse?

# Chapter 26 — Case: Pitch Verdict

*A five-agent pipeline that generates a tactical match report and then verifies every number in it against the source — because real analysis produces an answer and then checks it.*

**Author:** Hrishikesh Kulkarni
**Editor:** Nik Bear Brown

---

## Situation

After every professional football match, an analyst faces a workflow that takes three to six hours: pull raw event data from a provider like [StatsBomb](https://github.com/statsbomb/open-data) (3,400+ timestamped events per match), segment the match into tactical phases based on goals and substitutions and shape changes, compute metrics per phase (PPDA, xG, possession, pass completion), write a coherent tactical report synthesizing the metrics, and manually verify that every number in the draft is correct. The first four steps are mechanical — precision, patience, and time. The judgment is in interpretation. The report is where the analyst earns value, and the bottleneck is not the writing but the retrieval, computation, and checking. ChatGPT can produce a fluent tactical report on demand and provides no mechanism to verify a single number in it. A PPDA value of 7.1 when the actual is 11.8 looks completely plausible — and a coach building a game plan around what they think is a high-pressing opponent ends up preparing for the wrong team. Pitch Verdict is built around the architectural commitment that *real analysis produces an answer and then checks it.*

## Architecture

Five agents, each with a bounded specific responsibility; the pipeline does not advance until the current stage completes successfully. **Agent 1 — Retriever** (`agents/retriever.py`) loads StatsBomb event data from the live open API via `statsbombpy`, a local JSON file, or built-in synthetic data. Parses every event into a structured DataFrame with `x`/`y` coordinates, zone classification (defensive third, middle third, attacking third), pass completion, shot outcome, and xG value. **Agent 2 — Phase Segmenter** (`agents/phase_segmenter.py`) identifies natural inflection points (goals, substitutions, halftime), builds phase boundaries with a minimum duration of ten minutes to prevent micro-phases, and computes a full independent metric set per phase. PPDA = (opponent passes in own half) / (defensive actions in opponent's half). **Agent 3 — Tactical Classifier** (`agents/tactical_classifier.py`) applies PPDA thresholds and possession rules to produce tactical labels (high-press / mid-block / low-block) and *builds the ground-truth metric table the Verifier will use later*. **Agent 4 — Writer** (`agents/writer.py`) calls xAI Grok via the OpenAI-compatible API and generates a 600–800 word report from the structured metrics only — the LLM never sees raw events, never computes a number itself. **Agent 5 — Verifier** (`agents/verifier.py`) extracts every numerical claim from the report via regex, checks each against the ground-truth table from Agent 3, flags mismatches, and computes a factual accuracy score.

Five demo matches ship with the app: UEFA Euro 2024 Final (Spain vs England), Champions League Final 2024 (Real Madrid vs Dortmund), FIFA World Cup 2022 Final (Argentina vs France), El Clásico October 2024, North London Derby September 2024.

## Design rationale

The architectural commitment that earns the system's name is the **generate-then-verify split with the verification anchored to a ground-truth table built upstream of the LLM**. By the time Agent 4 (Writer) is called, every number that *could* appear in a correct report has already been computed by Agents 1-3 and committed to a structured `MatchTacticalAnalysis` object. The Writer cannot hallucinate statistics it was not given — that path is closed by the upstream architecture. But it can still *misquote* a given statistic, *misattribute* a phase boundary, or *misrepresent* a comparison ("Spain pressed harder in the second half" when the metrics show the opposite). The Verifier addresses exactly this residual failure mode. Regex extraction of every numeric claim. Lookup against the ground-truth table. Mismatches flagged with the actual value. The factual accuracy score is the system's own honest report card: how many numbers in the generated report are *exactly* what Agents 1-3 measured.

The **structured metrics-only handoff to the LLM** is the second consequential design move. The Writer's prompt receives a `MatchTacticalAnalysis` object with phase boundaries, per-phase metrics, and tactical labels — no raw event data, no DataFrame, no JSON dump of 3,400 events. This is Chapter 9's Offloading principle made specific: the LLM's working memory is small and structured, the upstream pipeline does the heavy enumeration, the output is fluent prose synthesizing pre-computed numbers. A larger context window would let the Writer "see" raw events, but seeing more would not help — it would expand the surface for misquotation without giving the Writer anything that wasn't already in the structured handoff.

The **demo-mode vs LLM-mode reporting** is the third move. The author reports factual accuracy in demo mode (template-rendered reports without an LLM) at ~82% and full LLM-generated reports with a configured API key at consistently 95%+. The honesty of reporting both is the chapter's discipline applied to the system's own evaluation: a paper that reported only the LLM number would be flattering itself; a paper that reported only the demo number would be underclaiming what the architecture actually produces in deployment. Both numbers exist for a reason and both are visible.

## Trade-offs

The five-agent decomposition trades latency and orchestration overhead for verifiability — a single-prompt approach would run faster but loses the verification step that makes the factual accuracy claim possible. The Verifier's regex-based numerical extraction is brittle against unusual phrasing ("almost twelve passes per defensive action") and the report acknowledges this; tightening regex patterns over time is the planned remediation. StatsBomb Open Data covers 3,000+ matches but not the most recent fixtures across all competitions; live coverage of last-night's match is bounded by what StatsBomb has published. The cost per report — under $2 in LLM-mode — is the deployment-realistic point on the cost-quality frontier for an independent analyst, journalism student, or small-club video analyst, the audience the project explicitly targets.

## Outcomes and revisions

Demo-mode template reports score ~82% factual accuracy. LLM-generated reports with a configured xAI Grok API key consistently reach **95%+ factual accuracy**. Cost per report stays **under $2**. The capability comparison the author publishes — a six-row table comparing ChatGPT, Opta/Stats Perform, "other AI tools," and Pitch Verdict — is honest about what Pitch Verdict does *not* do (general open-domain conversation, sub-event-level pose estimation, real-time live-feed analysis) and what it does that the alternatives cannot (autonomous StatsBomb load, multi-phase tactical reasoning, self-verification against source data, measurable factual accuracy score, adversarial testability, free open-data access at cost <$2/report). The most consequential planned revision is broadening the regex extraction to cover a wider range of natural-language phrasings without losing the verification's strictness, plus extending the corpus beyond StatsBomb's open subset.

## Pattern connection

Pitch Verdict instantiates Chapter 7's Fact Check List Pattern (Verifier as a structurally-required separate agent that runs *after* generation, against a ground-truth table built *before* generation), Chapter 9's Offloading principle (raw event data stays out of the LLM context), and Chapter 12's coordination-model-matches-correctness-property (the workflow's correctness — *no number ships unchecked* — is enforced by the explicit Verifier stage rather than by prompt diligence at the Writer).

## Transfer prompt

In your own AI-assisted analysis pipeline, is the LLM doing the computation or just synthesizing pre-computed numbers? When the LLM produces a numerical claim in its output, is there a separate downstream check against a ground-truth table — or do you trust the model? When you report your system's accuracy, do you report both the deterministic-fallback number and the LLM-mode number, or only the more flattering one?

---

*Spring 2026.*


---

## A note about AI

PitchVerdict evaluates pitches. The model has read every pitch deck and has no view of which markets actually move.

Where the model genuinely helps: surfacing the structural concerns about a pitch — unit economics, founder-market fit, competition.

Where the model does damage: rendering the verdict. Investment decisions rest on judgment the model cannot have.

The rule: structural critique from the model; investment from named investors with capital at risk.

---

## AI Wayback Machine

**Daniel Kahneman** was work on the planning fallacy and base rates is the modern foundation for evaluating ambitious pitches and forecasts.

**Run this:**

```
Who is Daniel Kahneman, and how does their work connect to the pitch evaluation we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Daniel Kahneman"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Daniel Kahneman's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Daniel Kahneman's framework."

What changes? What gets better? What gets worse?

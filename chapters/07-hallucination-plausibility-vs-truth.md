# Chapter 7 — Hallucination: When Plausibility Beats Truth

*Why better prompts and bigger models leave the failure mode exactly where they found it*

**Authors:** Madhumitha Nandhikatti, Gagana M
**Editor:** Nik Bear Brown

---

The email arrived at 4:47 on a Friday afternoon. A mid-sized pharmaceutical company had deployed an agentic research assistant to accelerate their drug-interaction literature review — work that previously took a junior scientist three full weeks. The agent had been running for six hours. Its output was a forty-page report, complete with citations, DOI numbers, author names, journal volumes, and page ranges. The citations were formatted to APA 7th edition without a comma out of place.

The report concluded that a compound under internal development showed no dangerous interactions with a widely prescribed blood thinner, based on seven peer-reviewed studies.

A senior scientist spent Saturday morning attempting to pull the source documents. The first citation returned a 404. The second led to a real journal but not to the referenced article. The third matched a real paper — but the paper's actual finding was the *opposite* of what the report claimed: the interaction the agent had declared safe was the interaction the real authors had flagged as requiring clinical monitoring. By Sunday evening, the scientist had verified that four of the seven citations were entirely fabricated, and two of the remaining three had been materially misrepresented. One in seven was both real and accurately summarized.

The report's conclusion — the conclusion that was about to be forwarded to the regulatory team — rested on a foundation of which six elements out of seven were either invented or distorted.

(The company is a composite. The scientist is a composite. A failure of approximately this shape has happened more than once.)

What I want you to notice about this is not that the agent lied. Lying takes intent. What I want you to notice is *how good the fabrications looked*. The invented papers had plausible author surnames drawn from real researchers in adjacent fields. The journal names were real journals. The volume and issue numbers fell within the plausible publication range. The DOIs were structurally valid — right prefix format, right length, right numerical cadence. Nothing about the citations announced itself as wrong. They announced themselves as *right*.

That is the failure mode this chapter is about. Not a system that breaks. A system that succeeds at the wrong objective. The company did not ship a compromised regulatory package, but only because one scientist was skeptical enough to pull the sources on a weekend. The near-miss catalyzed a six-month audit. Fourteen prior outputs contained fabricated citations. Three had made it into internal decision documents.

If you don't understand why this happens — mechanically, at the level of what the model is actually computing when it produces a citation — you'll address the symptoms with prompt-level interventions and you will not touch the cause. The rest of the chapter is about why that distinction matters, and what an architectural cause-level intervention looks like.

---

## What the model is actually computing

A language model does not retrieve facts from a database. It does not maintain a pointer to a corpus of documents. When the model is generating text — after training is complete, in deployment — what it does at every single step is assign a probability distribution over its entire vocabulary and sample from it. The question the model answers, at every token, is not *"what is true?"* It is *"what token is most statistically consistent with this context?"*

These are different questions. Most of the time they produce overlapping answers. Some of the time they produce dangerously divergent ones.

Here's what happens during training. The model is given a sequence of tokens and asked to predict the next one. When it's wrong, the error propagates backward and the weights shift to make that prediction slightly more correct next time. This correction is governed by a single error signal — a *loss function* — and the loss function measures exactly one thing: how accurately the model predicted the next token. It does not measure whether the predicted token is true. That distinction is invisible to the training process. The loss function has no codomain for "truth." It only knows how the predicted distribution compares to the distribution implied by the training data.

Over billions of examples, the model learns extraordinarily detailed statistical regularities. It learns that citations follow a recognizable syntactic pattern. It learns that author names in pharmacology literature come from a particular distribution of surnames. It learns that DOI strings have specific numerical structures. It learns these patterns not by checking citations against a ground-truth registry of what exists in the world — it learns them by exposure to the statistical shape of citation-like text.

Here is the asymmetry intuition resists. **Truth is not a property the model can access when generating text.** The model's weights encode correlations from training data, and those correlations support false statements as fluently as true ones, provided the false statement is statistically consistent with the patterns in the context.

Make it mechanical for a moment. Suppose during training the model encounters two possible completions after the context *"The 2021 study by Chen et al. in the Journal of Cardiology found that"*:

- Sequence A: *"warfarin levels rose 18% when co-administered with the test compound."*
- Sequence B: *"warfarin levels rose 22% when co-administered with the test compound."*

If the actual training text was A, predicting A scores perfectly and predicting B scores slightly worse. The gradient nudges the weights toward A. Good — the training process is working.

But notice what the gradient is *measuring*. It is measuring "how close was the predicted token distribution to the token distribution in the training data." It is not measuring "how close was the prediction to the truth in the world." If the training data contained a typo and said "22%" when the actual study said "18%," the gradient would happily optimize the model toward the wrong answer. The loss function cannot tell the difference. Truth was never in its codomain.

At inference time the model has no access to the actual Chen et al. paper. It has only the weights that encode statistical regularities. When asked to complete the sentence, it samples from the distribution those weights define. A plausible number — 18, 22, 25 — scores high. Whether any particular number is correct is a question the distribution cannot answer.

This is why better prompting does not fix hallucination. When you write *"only cite papers you are certain are real,"* the model processes that instruction statistically like any other instruction. The tokens "certain" and "real" shift the probability distribution slightly. They may suppress hedging language. They may increase the model's tendency to produce confident-sounding prose. But they do not give the model access to a ground-truth record it did not previously have. In the pharmaceutical case, the *more emphatic* the instructions to cite only real papers, the *more confident* the fabricated citations became — because confidence is a statistical property of citation text, and the prompt was reinforcing exactly that property.

A prompt cannot create a knowledge source. It can only shift sampling over the distribution the weights already define.

The same argument applies to scale. A larger model trained on more data is a better statistical pattern-matcher, which means its hallucinations become more *plausible*, not less *frequent*. The failure mode does not shrink with scale; it becomes harder to detect. "Wait for the next model" is not a mitigation strategy — it is the opposite of one, because the next model makes the fabrications harder to catch by the very property that makes it a better model.

---

## Two axes that look like one

Let me draw the picture another way. Imagine two axes on a graph. One axis is plausibility — from obviously-wrong to professionally-fluent. The other axis is truth — from false to true. These two axes are *orthogonal*. Where you sit on one tells you nothing about where you sit on the other.

A model excellent at producing plausible text is not thereby better at producing true text. It may be worse, because the plausibility of a false statement is no longer a reliable signal that something is wrong. When outputs were clumsy, fabricated citations often carried telltale signs — awkward phrasing, a DOI that didn't match the journal format, an author name that felt off. As models improved, those signs disappeared. The fabrications became professionally formatted, linguistically appropriate, surface-indistinguishable from real citations.

The four quadrants of the graph: plausible-and-true is the standard case, the system working. Implausible-and-true is rare — the truth is weird, the model hedges, the user is tipped off. Implausible-and-false is harmless — the model produces something obviously wrong, the user catches it. The dangerous quadrant is plausible-and-false. The model produces something that looks right and isn't. The user has no internal signal that anything is wrong.

Hallucination, in the form that matters, is *that quadrant*. It is high plausibility combined with failure of truth. The more capable the model becomes at plausibility, the more output lives in the dangerous quadrant, and the more the burden of truth-detection shifts from the model's output surface to something outside the model.

People sometimes think retrieval-augmented generation solves this. It doesn't, in general. RAG reduces one class of hallucination — the class where the model invents facts because it has no grounded reference. RAG does not solve hallucination as a category. A RAG system can retrieve correct documents and generate output that misrepresents them. A RAG system can retrieve no relevant documents and still generate confident output based on model priors. A RAG system can retrieve documents whose contents the model misinterprets at generation time. RAG is a grounding mechanism for retrieval. It is not a verification mechanism for generation. The two are architecturally distinct moves. A pipeline can have one, the other, both, or neither, and the failure modes of each alone are different from the failure modes of the two composed.

---

## The architectural response

What does work is a verification layer interposed between generation and downstream action. This is the move that actually addresses the cause. I'll call it the Fact Check List Pattern, because the name describes what it does: extract the factual claims embedded in the agent's output, check each one against an external ground-truth source, and surface only the claims that pass.

This is not a prompt modification. It is an additional component in the pipeline, with its own inputs, its own outputs, and its own failure modes that you must design explicitly.

The structure: the generative agent produces its output — a report, a summary, a recommendation, a set of citations. Before that output is passed downstream, a second process extracts the verifiable claims. These claims are not the entire output. They are the specific propositions that *could* be checked against an external source: *this paper exists, this author wrote this paper, this paper says this thing, this compound has this property*. Once extracted, each claim is verified against a specified source — a database, a retrieval system, a structured knowledge base, a live API. Claims that verify pass through. Claims that fail verification are flagged or quarantined. The downstream system receives only the output that has cleared verification, along with a structured record of what was checked and what failed.

How extraction is implemented is a design decision with consequential trade-offs. The most reliable approach is a *structured output schema*: rather than asking the model to produce a prose report and then parsing it afterward, you prompt the model to emit its citations as a structured object — a JSON array alongside the narrative. The citations arrive as discrete, typed fields rather than as text that must be interpreted. The model may omit a citation, but it cannot hide a citation inside prose that escapes parsing. A *separate LLM call* for extraction is the second-best option — it works reasonably but inherits the generative layer's failure modes. *Rule-based parsing* via regex is brittle in proportion to how much the output varies in form.

What you must not do is ask the generative agent that produced the output to extract its own verifiable claims. A system that has no reliable signal distinguishing what it knows from what it is fabricating without knowing it cannot reliably identify the boundary between verified and unverified content *in its own output*. Using the generator as its own extractor introduces a circular dependency: the same mechanism that produces the hallucination is being asked to locate it. This is not something you tune your way past. It is a structural prohibition.

Now the verification step itself. You verify each extracted claim against a ground-truth source — but the source can be unavailable, the claim can be partly resolvable, the verification can time out. The load-bearing piece of the pattern's output schema is this: every claim leaves the verification layer with one of three states. **PASS**, **FAIL**, or **UNCERTAIN**. (Plus **SKIPPED**, when the verifier was bypassed by configuration — more on that in a moment.)

UNCERTAIN is where most architectures quietly fail. A claim that could not be checked is not the same as a claim that passed. PASS means the verifier found the source and confirmed the claim. UNCERTAIN means the verifier tried and could not resolve. For most high-stakes pipelines, UNCERTAIN should be treated like FAIL: not safe to surface without human review. Collapsing UNCERTAIN into PASS is how organizations build verification layers that feel like verification layers and aren't.

There is a subtler version of this mistake worth naming explicitly. Some teams reach for a second LLM call as the verifier — the reasoning being that a fresh context window reduces the chance of reproducing the same hallucination. The reasoning is wrong, and it's wrong for the same reason the mechanistic argument was right. The generator and the second-LLM verifier are trained on the same corpus and optimized against the same objective. A fabricated DOI that sounds plausible to the generator will also sound plausible to the verifier. A fresh context window is not a different knowledge base; the shared plausibility bias is a training-objective problem, not a context problem. The correct verifier for a citation check is a *deterministic* rule running against a ground-truth source — CrossRef, PubMed, a legal database — that returns UNCERTAIN for anything it cannot resolve without external confirmation. A second LLM, however well-prompted, cannot substitute for this, because both the LLM and the one it checks share the property that makes verification necessary.

---

## *Mata v. Avianca*

In 2023, two attorneys submitted a legal brief in federal court — *Mata v. Avianca, Inc.*, S.D.N.Y. 22-cv-1461 — that cited several prior court cases. The judge's clerks could not locate the cited cases. When the judge inquired, the attorneys acknowledged they had used a generative AI assistant and had not verified the citations independently.

The cases did not exist. The model had produced case names, docket numbers, and legal holdings with the same confident fluency it would have brought to a real citation. [Judge P. Kevin Castel imposed sanctions on June 22, 2023](https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.55.0.pdf): a $5,000 fine on the attorneys and their firm, plus required notifications to each judge falsely identified as the author of a fabricated opinion.

The failure was not technical. It was architectural. There was a generative layer. There was no verification layer. The output of the generative layer was passed directly to a high-stakes downstream channel without any mechanism between them that could distinguish a fabricated citation from a real one.

This is what the Fact Check List Pattern is designed to prevent: the direct coupling of a generative layer to a consequential output without an architectural checkpoint between them. The brief looked like a brief. The citations were formatted correctly. The legal holdings were stated in proper legal language. A reader who does not independently verify has no signal from the text itself that anything is wrong — which is exactly why the verification has to be architectural rather than behavioral. Reading more carefully does not fix a missing layer.

There is a worse version of *Mata*. Imagine a pipeline where the verification layer is designed to check citations against a legal database, but a developer under deadline pressure adds a configuration flag that lets the verification step be skipped when the database API is slow. The flag is used once, then becomes the default, then is forgotten. The pipeline continues to produce output that carries the same downstream confidence as fully verified output, because nothing in the pipeline's output schema distinguishes "verified" from "skipped."

The hallucination rate is identical to a pipeline with no verification at all. The organization believes it has one. This is the most dangerous failure mode — and it is a *design* failure, not an operational one. A cleanly designed Fact Check List Pattern treats every terminal state as first-class output. PASS carries its evidence. FAIL carries its reason. UNCERTAIN carries what was attempted and why it didn't resolve. SKIPPED carries an explicit configuration trace — and SKIPPED, in any high-stakes pipeline, should fail loudly rather than silently. A monthly audit that reviews the actual terminal-state distribution of the pipeline's outputs — what fraction PASS, what fraction FAIL, what fraction UNCERTAIN, what fraction SKIPPED — is the practice that keeps the layer honest.

---

## Back to the email

Read the opening scenario again with the vocabulary now available.

The agent produced a forty-page report because that was the statistically consistent completion given the task. Citations appeared because citations are part of the statistical shape of a pharmacology literature review. The specific citations — plausible author surnames, real journals, plausible volumes, structurally valid DOIs — were generated by the same mechanism that generates any other text: token-by-token sampling from a probability distribution conditioned on the context. The model was not lying. The model was succeeding at its actual objective, which was producing plausible next tokens. Truth was not part of that objective at any point in the training run. It was not part of the objective at inference time.

A Fact Check List Pattern in this pipeline would have looked like this. A structured-output schema would have pulled the seven citations as discrete records at generation time: authors, year, journal, volume, pages, DOI, claim summary. No second extraction step needed. Each record would have gone to a deterministic verifier — CrossRef API or equivalent — and returned PASS, FAIL, or UNCERTAIN. Of the seven citations in the scenario, four would have returned FAIL outright (no DOI, no paper). Two would have returned PASS on the DOI but the semantic consistency between the agent's characterization and the actual abstract would have required a second verification step — the honest boundary of what a deterministic Fact Check Layer can do alone. The seventh would have PASSed cleanly.

The regulatory team would have received a structured record before they saw the report: of seven claimed citations, one PASSed, four FAILed, two are PASS-on-existence-but-claim-characterization-UNVERIFIED. The report itself would have been blocked from automated surfacing. A human reviewer seeing four FAILs on a seven-citation report would have stopped the pipeline immediately.

The model was compromised — in the sense that it produced fabrications indistinguishable from real citations by any property the model itself could evaluate. The architecture would not have been. The layer between generation and surfacing would have rejected six of seven citations on its own terms, regardless of what the model thought about them.

That is the architectural claim worth holding. The model's citation-generation behavior is not going to improve when the next-generation model comes out next quarter. A model two orders of magnitude larger will still produce plausible tokens from a plausibility-maximizing objective, because the objective is what it is. The Fact Check List Pattern's guarantee does not depend on model quality. It depends on the verification layer existing and on UNCERTAIN not being conflated with PASS.

---

## A worked example — the Drug Interaction Checker

The opening composite is not far from a system the two of us actually built. The Drug Interaction Checker is a RAG-grounded tool aimed at a specific user — a non-expert caregiver managing several prescriptions for someone else, typing two drug names into a web form and trying to figure out whether the combination is dangerous. The wrong failure mode for this user is not a missing answer. The wrong failure mode is a confident answer that is partially fabricated.

Here is the architecture, deliberately spare so the layers are visible.

- **Brand-to-generic normalization.** The user types "Advil." The FDA OpenFDA API indexes labels under generic names ("ibuprofen"). A query against the brand returns nothing. We pass every input through the [NIH RxNorm REST API](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) first, which converts brand to generic before retrieval. This is a translation layer, not a verification layer — but skipping it produces silent retrieval failures downstream that would have looked like "no interaction" instead of "we couldn't find this drug."
- **Retrieval against an authoritative source.** Each generic name triggers an [OpenFDA API](https://open.fda.gov/apis/drug/label/) call. We extract only the `drug_interactions` and `warnings` fields from the JSON response — not the full label, not chunks of arbitrary length. Each drug becomes one complete chunk containing its full interaction text. Embeddings are produced with `all-MiniLM-L6-v2`. The vector store is FAISS, local, CPU. The reason for the deliberate chunking choice is small but consequential: token-count chunking sometimes splits the `drug_interactions` section across two chunks, giving the model incomplete context, and incomplete context is exactly the input shape that produces plausible-looking partial answers.
- **The retrieval completeness check.** This is the part that earns its place in this chapter. Before the LLM sees anything, a guard verifies that a label chunk was successfully retrieved for *every* drug in the query. If even one is missing, generation does not proceed. The user sees a visible warning naming the drug that was not found. The system does not produce a partial summary based on the half it retrieved. This is what kept our **silent failure rate at 0%** across the benchmark — not a model property, an architectural one.
- **The strict generation prompt.** Temperature 0.1. Seven explicit rules: only state facts present in the retrieved label; if no interaction is documented, say "No interaction documented in FDA label" verbatim; always state severity (`contraindicated`, `major`, `moderate`, `minor`, or `none documented`); always state action (`avoid`, `consult pharmacist`, `monitor symptoms`); use plain language; do not fill gaps from general knowledge; close with the exact medical disclaimer word for word. We watched what happened at temperature 0.7 — the model would render hedged label language ("may increase risk") as "major," which is a clinically significant misrepresentation. The temperature drop and the explicit rule against gap-filling closed that path.
- **The citation block.** Every output ends with the FDA label ID, the DailyMed submission identifier, and the `last updated` date. A pharmacist auditing the system can follow the citation directly to the source document. The model does not present its summary as its own knowledge; it presents it as a summary of one specific, verifiable document.

Now the part of this case that matters most for a textbook on hallucination — and that we are going to tell you straight, because the alternative is the kind of dishonesty the chapter is about. **The benchmark did not meet our targets.**

We constructed 50 drug-pair queries: 20 high-severity (warfarin + amiodarone, simvastatin + clarithromycin), 20 moderate (lisinopril + ibuprofen, sertraline + tramadol), 10 control pairs with no documented interaction. Scoring was four binary criteria worth one point each — interaction identified, severity stated, action provided, citation present — and a 3/4 was a pass. Targets: 0% silent failure, ≥80% pass rate, ≥90% retrieval recall, <20% false positive on controls. Actual results:

| Metric | Target | Actual | Status |
| --- | --- | --- | --- |
| Silent Failure Rate | 0% | 0% | Achieved |
| Overall Pass Rate | ≥80% | 48% (24/50) | **Not met** |
| Retrieval Recall | ≥90% | 48% (24/50 retrieval-complete) | **Not met** |
| False Positive Rate (Control) | <20% | N/A — no control queries completed | Not measurable |

The 24 queries that completed averaged 3.96 out of 4 — only one fell to a 3/4, on lithium + ibuprofen, where the system correctly named the interaction and the action and the citation but missed the severity criterion.

The other 26 queries did not complete. The breakdown is informative. Twenty-five hit a Groq API rate limit (HTTP 429) after the first 21 queries consumed the daily 100,000-token quota of the free tier — the benchmark was running `llama-3.3-70b-versatile` and the per-call token cost was higher than we'd modeled. One was blocked by the retrieval completeness check itself: atorvastatin + digoxin, where the FDA label for one of the two could not be retrieved, and the system did exactly what it was designed to do — refuse to generate.

Read that result with the chapter's vocabulary. The generation layer, when it ran, was clean: 0% silent failure, average 3.96/4 across completed queries, no fabricated citations. The verification layer, when it fired, fired correctly: the one retrieval miss was surfaced as a missing-label warning, not papered over with a partial answer. The dominant failure mode was *infrastructure* — a free-tier rate limit on a benchmark execution run — not an architectural failure of the hallucination-mitigation design. That is a different kind of failure, and pretending the result was a clean 100% would have been the failure the chapter is most concerned with: producing plausible numbers that misrepresent the underlying state. The honest report is that the architecture's design properties held on every query that reached the architecture.

The remediation is concrete. We're switching benchmark execution to `llama-3.1-8b-instant`, which is meaningfully more token-efficient and has higher free-tier limits, and re-running across multiple days so the daily quota does not rate-limit out the moderate and control categories. The architectural choices — RxNorm normalization, per-drug chunking, the retrieval completeness check, the strict prompt, the structured citation block — are not what we're changing.

Three lessons travel from this build to any chapter you might write your own way through.

The first is that the verification layer earns its keep most visibly on the queries that fail. A 0% silent failure rate is not a number that announces itself in the average case — most queries retrieve fine and generate fine. It announces itself the one time atorvastatin + digoxin can't be resolved and the system refuses to fabricate around the gap. You're paying for that single behavior with the entire architecture.

The second is that benchmark infrastructure failures and architectural failures have to be reported separately or you lose the ability to reason about either. A 48% pass rate that bundles "the architecture didn't work" with "the free-tier rate limit hit at query 22" is a number that means nothing. Splitting the report into "of the queries the system actually ran, here is the score; of the queries it didn't run, here is why" is the discipline the chapter has been arguing for from a different direction the whole time.

The third is that we built a hallucination-resistant pipeline and it still has failure modes worth naming explicitly. Polypharmacy isn't handled — a caregiver managing 10 medications has 45 unique pairs and the current system summarizes them in a single call, which will lose pair-specific severity. Dosage isn't an input — an interaction contraindicated at high doses may be acceptable at low ones with monitoring, and the FDA label often distinguishes. The label corpus is US-only — DailyMed doesn't index European or international formulations. None of these are reasons not to ship the system. They are reasons not to claim the system is doing more than it is.

This is the discipline a Fact Check List Pattern protects when it is wired correctly: it lets you ship a system that is honest about its boundary, instead of a system that is fluent at the boundary's edge.

---

## What to take with you

Plausibility and truth are optimized by different objectives. Maximizing plausibility does not move output toward truth. Every architectural commitment in this chapter follows from that one observation. Remove the observation and the verification layer looks like paranoid over-engineering. Hold it, and the architecture is the only way a generative pipeline can be safely coupled to a high-stakes channel.

The mistake to watch for is reaching for prompts, model swaps, or scale increases as the first response to hallucination. All three are interventions on variables that are not the cause. The cause is the training objective, which is not something any deployment can change. The architectural question is how to build the verification machinery the objective cannot provide.

What still puzzles me. The verification layer can confirm a DOI exists. It can confirm an abstract returns. It can match author names and journal volumes. What it cannot easily do — at least, not deterministically — is verify that the agent's *characterization* of what a paper says matches the paper's actual finding. That step is semantic, not structural. The honest path is either a second model (which reintroduces plausibility bias at a lower rate but not zero) or a structured claim representation built up from the source document, which is itself a hard extraction problem. I do not yet have a clean rule for when a Fact Check Layer's semantic check is safe to automate and when it needs to route to human review as a first-class pipeline output. I think it depends on the cost of a missed misrepresentation in the specific deployment, but I'd like a sharper answer than "it depends."

What would change my mind. A production deployment of a generative agentic system, at meaningful scale — thousands of high-stakes outputs per month — that relied entirely on prompt-level mitigations and sustained a measurable fabrication rate below, say, 1 in 10,000 outputs over twelve months under adversarial workload. The chapter's claim is that this cannot be done. A documented counter-example would force a sharper specification of when prompt-level mitigation actually holds. I have not seen such a case. The pharmaceutical near-miss and *Mata v. Avianca* are the shape of cases I have seen.

Hallucination is what happens when plausibility beats truth. The only place to put your finger on the scale is in the layer between generation and the world. Build that layer. Make UNCERTAIN a first-class output. Audit the SKIPPED rate monthly. The model will not save you, because saving you is not what its training objective rewards.


---

## A note about AI

This chapter is about how plausible-sounding answers diverge from true ones. The note is the chapter's own argument applied to writing the chapter.

Where the model genuinely helps: producing examples of plausible-but-false output for training your judgment.

Where the model does damage: producing the analytical claims of this chapter without verification.

The rule: in the chapter that warns about hallucination, do not let the model write claims you have not verified.

---

## AI Wayback Machine

**Daniel Kahneman** was psychologist whose Thinking, Fast and Slow framework explains why fluent output gets trusted over careful reasoning.

**Run this:**

```
Who is Daniel Kahneman, and how does their work connect to the plausibility vs truth in agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Daniel Kahneman"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Daniel Kahneman's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Daniel Kahneman's framework."

What changes? What gets better? What gets worse?

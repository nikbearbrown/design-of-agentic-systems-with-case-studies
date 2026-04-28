# Chapter 6 — Grounding Agents in Evidence

*Case study: Magid's Newsroom RAG System*

**Author:** Aravind Balaji

---

On a Tuesday afternoon in a regional TV newsroom, a journalist finished a broadcast script about a city council vote on housing density. The script was tight and well-sourced. She handed it to the station's AI versioning tool and asked for a web version and a social teaser. Forty seconds later, both were ready. The prose was clean. The tone was right. And the web version contained a direct quote the council member had never said.

The quote was plausible. It sounded like something a politician discussing housing might say. But the journalist's script had described the council member as *stopping short of endorsing the rezoning.* The AI rendered this as a direct quote expressing support. The valence was reversed. The attribution was fabricated. Nothing in the output's surface texture — grammar, formatting, professional tone — signaled that anything had gone wrong.

The journalist caught the error because she happened to re-read the output before filing. She had no systematic process for detection. She could not know how many outputs she *had not* re-read that contained similar errors.

That asymmetry — between how often the system fails and how often the failures get caught — is the architectural problem this chapter is about. A newsroom producing three hundred versioned stories per week at a three percent deviation rate generates nine errors weekly. Most will not be caught before publication. The ones that are caught arrive as complaints, corrections, and credibility damage.

(I should say up front that the Tuesday vignette is a representative scenario, constructed to demonstrate the failure mode. The Reyes quote I work through later is constructed in the same register. The architecture is real.)

This is the problem Magid — a 70-year-old consumer-intelligence and strategy firm — set out to solve with a tool called Collaborator Newsroom. The architectural decision that made it work was not a better model, a better prompt, or a better retrieval algorithm. It was the decision to treat RAG not as a search optimization but as an *epistemological constraint*: a system-level guarantee that every claim in the output is traceable to a specific passage in the journalist's source material, and that deviations are detectable, measurable, and flaggable in real time.

I want to walk through what that means and why it matters, because the same architecture maps onto every domain where trust depends on traceability — legal analysis, medical documentation, financial reporting. The newsroom is the worked example. The architecture is the lesson.

## RAG as constraint, not optimization

A language model without RAG operates in what epistemologists call an unverifiable knowledge state. It generates text that may or may not correspond to reality, and there is no systematic mechanism to check. The model's outputs carry no provenance.

In domains where trust depends on traceability, an unverifiable output is not less useful. It is *unusable.* A news story that cannot be traced to sources is not journalism. A legal brief that cannot be traced to statutes is not legal reasoning.

RAG changes the epistemological status of agent outputs in two ways that are impossible without it. First, source traceability — every claim can be mapped back to a specific passage in the retrieved context. If the output says *the council voted 7-2 to approve*, the system can verify that the claim appears in the source. Second, deviation detection — when the output diverges from the source by adding information, altering a quote, changing an attribution, or shifting the meaning of a statistic, that divergence is *detectable*. Not because a human reads both texts, but because automated comparison can measure the degree of adherence.

This is the core claim in one sentence. *Context adherence is a measurable property, not an aspiration.* It can be scored, tracked over time, and used to trigger alerts when it drops below threshold.

The architectural insight Magid's deployment reveals is the second step most teams skip. Building the reference object — the bounded retrieved context — without building the measurement layer produces a system that *has* a reference it never *checks*. The retrieved chunks are right there. Nothing in the pipeline asks whether the output is actually faithful to them.

The misconception this kills is the marketing version of RAG: that it is a retrieval optimization that improves answer accuracy. Better retrieval narrows the candidate pool the model generates from, which helps — but it does not guarantee the output is faithful to the retrieved chunks. The improvement from RAG is not *the retrieved context is better.* It is *there now exists a bounded reference object against which the output can be measured.* The retrieval quality and the output faithfulness are separable properties, solved by separable machinery. A system with excellent retrieval and no measurement layer produces confident-looking outputs that may invert the meaning of retrieved passages. A system with mediocre retrieval but a strong measurement layer catches the inversion and flags the output before it ships. The second is more trustworthy than the first in every domain where trust is the product.

## Two metrics, two views

Return to the newsroom. Suppose the source passage in the journalist's script reads:

> Councilmember Reyes stopped short of endorsing the rezoning, saying the proposal needed *more community input* before she could support it.

And the tool generates:

> *I support bringing more housing to this neighborhood,* said Councilmember Reyes, who backed the measure pending additional review.

Topically coherent. Same person, same vote, same subject. Now apply two measurements and watch them disagree.

The first measurement is token overlap — Jaccard similarity. Take the set of words in each text. Compute the size of the intersection over the size of the union. The intersection between source and output is small: *councilmember, reyes, more, support* — four tokens. The union is around thirty-one. The Jaccard similarity comes out to about 0.13. Token-overlap deviation, defined as one minus similarity, is about 0.87. Above any reasonable flag threshold.

Token overlap catches the fabrication because the specific words of hedging — *stopped, short, needed, before, could* — are absent from the output. The fabrication uses different words to say something different.

The second measurement is semantic similarity — cosine of the embeddings. Both sentences encode hedging-or-supporting language about a council member's position on a housing vote. The embedding model has learned that sentences in this neighborhood cluster together in representation space. The cosine similarity comes out somewhere between 0.75 and 0.88, depending on which embedding model. Semantic deviation is therefore between 0.12 and 0.25. Below any reasonable flag threshold.

So one metric flags it. The other does not. The gap between them is somewhere between 0.62 and 0.75 — and the *direction* of the gap is stable across embedding models, even when the magnitude shifts.

Why do they disagree? They are measuring different things. Jaccard operates on sets of tokens; it sees that the two texts share a topic but use almost entirely different words. Cosine operates on learned dense representations; it sees that the two texts live near each other in semantic space. Both measurements are correct about what they measure. The disagreement is not a bug in either metric. It is a property of the task.

Journalism cares about *which specific words were attributed to the speaker.* Token overlap is sensitive to that. Embedding similarity is not. This is why the Reyes failure lives in what I think of as the dangerous quadrant — high topical similarity, fabricated attribution. Embedding similarity scores the output as adherent because the topic matches. Token-level measurement is what reaches it.

Every fabrication that looks like journalism lives in this quadrant. By construction, fabricated quotes are topically coherent with the surrounding story — that is what makes them plausible. A system that uses only semantic similarity will pass them at a high rate. The domain-specific failure mode is invisible to the domain-agnostic metric, and in journalism the tolerance for a fabricated direct quote is zero, regardless of cosine score.

The lesson generalizes. Every domain has a failure mode that some default metric cannot see. The measurement-layer design decision is choosing which metric is appropriate for which failure mode in your domain — not picking a default and hoping it generalizes.

## Why one prompt isn't enough

Before building Collaborator as a RAG system, Magid's clients tried the obvious thing: paste a broadcast script into an LLM and ask for a web story. The failures were structural, and they show why pipeline structure matters more than prompt cleverness.

The first failure was inconsistency. The same script, prompted twice, produced different outputs. One version included a quote, the next paraphrased it. Magid's product team described single-shot prompting as too inconsistent to ship.

The second was an inconsistency loop. Fixing one flaw created two. Telling the model to always include direct quotes caused it to fabricate quotes when the source did not contain any. Telling it to maintain the original story structure caused it to ignore platform-specific formatting. The prompt became patch on patch.

The third was the context-window mirage. Large context windows provided *capacity* for complex tasks but not *architecture* to decompose them. One LLM call cannot simultaneously retrieve, evaluate, transform, and verify.

The architectural lesson: the problem was not the model's capability. It was the absence of structure. A single call conflates operations that need to be separate stages.

Magid's response was to decompose the work into five stages, each with a specific contract. The first is the *knowledge boundary* — the agent operates only on the journalist's uploaded source. No external data, no pre-trained knowledge added "helpfully" from training. If the journalist's script mentions a city council vote but does not include the member's title, Collaborator will not fill in the title — even if the model "knows" it. The system produces content faithful to the input, even at the cost of completeness. This is a trade-off. The system is less helpful than an unconstrained LLM. But it is more trustworthy.

The second stage is *retrieval and decomposition* — orchestrating platform-specific sub-tasks scoped to source passages, rather than asking one prompt to do all of them at once. The third is *generation* by specialized agents — web, social, push, summary — each with a scoped context and a single-purpose prompt. The fourth is *evaluation* — a domain-specific scorer running on every output. The fifth is *observability* — real-time monitoring with per-newsroom custom metrics, so silent quality degradation after a prompt update gets caught before it propagates.

The decomposition is not a feature list. It is a sequence of constraints. A pipeline that omits any stage does not lack a feature. It lacks a constraint, and missing constraints produce unchecked failure modes.

## The gate, not the average

The evaluation stage is what converts the epistemological constraint from a framing into a running check. Magid scores every output on three axes. Quote fidelity: are direct quotes exact? Attribution accuracy: is each fact attributed to the same source as in the original? Semantic fidelity: is the meaning preserved without merging unrelated facts or shifting emphasis? Each axis returns an integer from 1 to 5.

The interesting design question is how to combine three integers into a decision. The instinct is to take a weighted average. Magid did not. They use a worst-axis gate.

If any axis scores 1, the system blocks the story — does not publish. If any axis scores 2, it routes to a human reviewer. If any axis scores 3, it ships with a fix suggestion. Only when every axis scores 4 or higher does the story auto-publish.

Consider why this matters. A story scores quote fidelity 5, attribution accuracy 1, semantic fidelity 5. The weighted average — 5 plus 1 plus 5 over 3 — is 3.67, which passes a threshold of 3.5. But attribution = 1 means a fabricated attribution. In journalism, that story cannot publish, regardless of how faithful the rest is. The worst-axis gate catches it. The weighted average passes it.

The false-proceed rate under weighted averaging is highest precisely when one axis fails catastrophically while others compensate — which is the most dangerous failure mode, not the least. A weighted average uses more information in a mathematical sense, but it averages across a dimension that, in high-stakes domains, should not be averageable. A fabricated quote is not partially canceled by accurate framing. A misattributed fact is not partially canceled by a correct quote elsewhere. The failure modes are absolute, not comparative.

The weighted average assumes a continuous quality surface where trade-offs are meaningful. For domains where trust is the product, the quality surface is not continuous — it is gated. The worst-axis gate matches the structure of the failure. The weighted average smooths over it.

In production, detection produces a programmatic halt. The pipeline does not log a warning and continue. It stops. This is what *architectural constraint* means in code: the system physically cannot proceed past a detected deviation without human intervention.

The economics work out. A published misquotation costs the newsroom thousands of dollars in corrections and credibility damage; evaluation costs cents per story. If the evaluation catches one fabrication per few hundred stories, it pays for itself on every run. Magid's reported numbers — story production from forty-five minutes to five, eight of ten journalists who try Collaborator becoming daily users, every paying customer renewing, thousands of stories a day — are downstream of trust. Without the measurement layer, the same model produces faster outputs journalists cannot trust. Trust is the bottleneck. The architecture produces trust.

## Where measurement runs out

I want to end honestly, because the architecture I have just described has limits that the architecture itself cannot reach.

The first limit is *source accuracy.* The entire measurement layer measures faithfulness to the source. It does not measure whether the source is accurate. If a journalist's script contains a misremembered statistic, a misheard quote, or an incorrect attribution, Collaborator will faithfully reproduce the error and the scorer will rate the output as perfect. The system is faithful. It is not truthful. Fidelity to source and accuracy of source are independent properties, and the architecture measures only the first. Architectural alternatives exist — external fact-checkers, cross-referencing against wire services — but each requires relaxing the knowledge boundary, which is exactly the constraint the architecture refused to relax. The trade-off is real and cannot be resolved architecturally. It requires the journalist to be right.

The second limit is *editorial intent.* The three-axis scorer catches factual deviations. It does not catch editorial failures that preserve all facts but change what the story *means.* A web version that leads with the dissenting vote rather than the majority approval is factually accurate — every claim is in the source — but editorially it tells a different story. Emphasis, ordering, and selection are editorial judgments that textual metrics cannot fully evaluate without understanding intent. Editorial intent is not a textual property. It is a judgment about what matters, and that judgment lives in the journalist's head, not in the document.

The third limit is *metric drift.* Magid's ground-truth corpus is static once constructed. Journalistic standards evolve. A corpus from one year may not capture the failure modes that matter the next. If the metrics are not themselves re-evaluated periodically, the system optimizes for yesterday's definition of trustworthiness while today's failures go unmeasured. Three signals indicate drift: the halt rate changes without a corresponding change in model or prompt; human overrides of the scorer's decisions increase; new story types emerge that the dimensions were not designed to assess. Who evaluates the evaluators is a meta-architectural problem the architecture has no built-in answer to.

These three limits do not invalidate the architecture. They define its boundaries. A practitioner who understands Magid's architecture but not its limits will deploy it confidently in a domain where the source is unreliable, the failures are editorial, or the metrics have drifted — and the architecture will report perfect scores while the system silently fails. The measurement layer measures what it was designed to measure. Knowing the difference is the architectural judgment this chapter is trying to develop.

The lesson generalizes outside journalism. Build the bounded reference object. Build the measurement layer that actually checks against it. Choose the metrics that match your domain's failure modes — not the defaults. Use a gate, not an average, when failures are absolute rather than comparative. And know where the architecture's reach ends, because that is where the human decision nodes live.

The model is increasingly a commodity. The measurement layer is the architecture. Trust is the product.

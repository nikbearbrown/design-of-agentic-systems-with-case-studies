# Chapter 5 — Choosing and Configuring Your RAG Pipeline

*Chunking, Embedding, Indexing, Querying, and Reranking*

**Author:** Nik Bear Brown

---

Let me start with a question I get asked a lot. Suppose you've deployed an agent across your engineering organization. Its job is to answer questions over your documentation — design docs, runbooks, post-mortems, code review threads, the lot. The corpus is modest by enterprise standards: maybe ten million tokens. A new engineer joins the team and asks, *"Why did we migrate the payments service from Python to Go in 2023?"*

What does the agent do?

It has options. It could try to load the entire corpus into a long-context window and let the model find the answer. With a 2M-token window, that's five sharded queries plus a synthesis step. At input pricing around $3 per million tokens — and pricing changes quarterly, so check this before you take it as gospel — that single question costs roughly $30. Forty-five seconds, end to end. And here's the part that ought to bother you: there's no guarantee the model actually attends to the relevant passage once it's buried under ten million tokens of ambient noise. Multiply by a hundred such questions a day and you're spending more than $1,000 daily for a feature your users experience as slow.

Or the agent does what we'll call retrieval-augmented generation. It indexes the corpus once into a vector database, and at query time it fetches only the fragments that matter. The same question now costs about three cents, finishes in under two seconds, and — if you've built the retrieval layer well — puts the relevant documents directly in front of the model without ten million distractions.

The ratio between those two architectures isn't 10×. It isn't 100×. For a corpus of any real size, it's about 3,000×.

That number is why retrieval exists, and that number is what the rest of this chapter is about. Because here's the rub: a RAG system that returns confidently wrong answers is one of the most common failure modes in production agents, and the cause is almost never the language model. The cause is the layer underneath — the layer most engineers don't inspect carefully because it doesn't feel like the smart part of the system. It's just plumbing. But the plumbing decides what the model gets to see, and the model can only reason over what it's given.

So we're going to build the plumbing. And then we're going to learn how to debug it when it lies.

---

## The economics, and then the physics

The cost story is easy to write down. A single query that loads the whole corpus pays input cost on every token of the corpus, every time. Call the corpus size $T_{ctx}$, the input price $P_{in}$, the output length and price $T_{out}$ and $P_{out}$. The cost per query is $(T_{sys} + T_{ctx}) \cdot P_{in} + T_{out} \cdot P_{out}$. The system prompt term is small; the corpus term dominates.

A RAG query replaces $T_{ctx}$ with $T_{ret}$ — what the retriever fetched, typically a few thousand tokens. There's a one-time cost to embed the corpus, but at production volumes it amortizes to a rounding error.

For a 20M-token corpus serving 2,000 queries a day, with about 4,000 tokens of retrieved context per query, the long-context architecture costs about $60 per query and $43.8M per year. RAG costs about two cents per query and $14,300 per year. The decision isn't close. It's not in the same neighborhood as close.

But the cost story isn't actually the deepest argument. The deeper one is physical, and it's where most of the long-context hype goes to die.

[Liu et al. (2023)](https://arxiv.org/abs/2307.03172) showed that language models use information unevenly across their context windows. Stuff something at the start of the prompt and the model finds it. Stuff it at the end, same. Stuff it in the middle of a 2M-token context, and the model functionally ignores it — even though it technically saw it. The performance curve is U-shaped. The middle is a black hole.

Think about what this means. When you stuff the whole corpus into context and ask the model to find the relevant passage, you're asking the model to do retrieval *as part of attention*. The model performs that retrieval poorly when the relevant passage is buried. Long-context isn't an alternative to retrieval — it's a weak, expensive form of retrieval, where the model is trying to do search using the same machinery it uses to write English sentences.

RAG inverts this. It does the search externally, with tools built specifically for semantic search, and then puts the small set of relevant passages directly in the model's working memory. The model no longer has to search. It only has to read and reason — which is what it's actually good at.

There are workloads where long-context wins. Summarizing a 300-page contract end-to-end. Tracing a bug through a single large codebase. Low-volume, high-stakes analyst queries where human time dwarfs the token bill. Chapter 26 has the framework for telling the regimes apart. But for the configuration question I'm here to answer, assume the framework has spoken: build RAG. The work now is building it well.

---

## Chunking decides everything else

Here's the thing nobody tells you when you start: the most consequential decision you'll make in a RAG pipeline is how you chunk the corpus. Not which embedding model. Not which vector database. Chunking. Because every component downstream operates on the chunks you produced, and no clever reranker recovers from chunks that destroyed their own meaning.

A chunk is the atomic unit of retrieval — the smallest piece of the corpus that can come back as a match. Each chunk gets embedded as a single vector, gets stored in the database, and gets returned whole or not at all. Two constraints decide its size.

The lower bound is *semantic coherence*. A chunk has to contain enough context to be intelligible by itself. Pull a sentence from the middle of a contract clause that says "the aforementioned party shall be liable under the preceding section," with no surrounding text, and what does that mean? Nothing. The embedding produced from such a chunk is semantically ambiguous because the source text is.

The upper bound is *embedding resolution*. An embedding model compresses arbitrary-length input into a fixed-dimensional vector — typically 768, 1536, or 3072 dimensions. The longer the input, the more semantic content gets crammed into the same vector, and the more the vector becomes a blurred average of multiple ideas. A chunk containing five distinct topics produces an embedding that is mediocre at representing any of them. It lies somewhere equidistant from all five — adequate for none.

The sweet spot, for most corpora, lands between 200 and 1,000 tokens per chunk. The exact choice depends on the corpus.

Now, you'll see two strategies in practice. *Fixed-size chunking* splits the corpus into chunks of uniform token count, usually with some overlap. It's simple and corpus-agnostic, which is its whole virtue. The cost is that it ignores semantic boundaries. A fixed-size chunker pointed at a legal contract at 512 tokens regularly splits clauses mid-sentence. Half the clause lives in chunk 47, the other half in chunk 48, and neither embedding represents the full clause.

*Semantic chunking* splits on document-structure boundaries — paragraphs, sections, clauses, function definitions, Markdown headers. Each chunk corresponds to a self-contained unit of meaning. The cost is engineering: you have to understand the document structure, and chunk sizes become variable.

When the corpus has structure you can recover, semantic chunking is strictly better. Fixed-size is a fallback for when you can't parse the structure or when the engineering cost of doing so isn't worth it. Reaching for [LangChain's `RecursiveCharacterTextSplitter`](https://python.langchain.com/docs/how_to/recursive_text_splitter/) on a structured corpus is a choice — usually unconscious — to accept worse retrieval in exchange for an hour of saved time. Sometimes that's the right call. Often it isn't.

Two small levers worth knowing. The first is *overlap*. Even semantic chunking has boundaries, and information near a boundary gets truncated from either side. The standard fix: each chunk begins slightly before the previous ends. Ten or twenty percent overlap is typical. It isn't free — your chunk count, storage, and embedding cost all scale up — but for boundary-sensitive content, it earns the cost.

The second lever is *metadata*, and this is the one most teams leave on the table. Every chunk should carry, at minimum: source document identifier, section, date, author, and whatever categorical labels matter in your domain. Jurisdiction for legal text. Service name for engineering docs. Severity for incident reports. Why does this matter? Because metadata enables *pre-filtering* at query time. If a user asks about the payments service, a retrieval system with `service` metadata filters to payments-service chunks before computing embedding similarity at all. Most of the irrelevant candidates never enter the comparison. Teams spend weeks tuning embeddings before they've considered whether a metadata filter would have solved the problem outright.

A small note on heterogeneous corpora. If your corpus contains different kinds of documents — runbooks, post-mortems, code review threads — a single chunking strategy won't serve all of them. Runbooks chunk on `##` headers. Post-mortems chunk on major sections (Summary, Timeline, Root Cause, Remediation). Code review threads are themselves the semantic unit; one thread, one chunk. Chunk at the semantic unit of the domain, and accept that your domain may have several semantic units.

---

## Embeddings, and the case for a second pass

Once chunks exist, you need to turn them into vectors. The embedding model decides the ceiling of retrieval quality, and four dimensions matter when you choose one.

*Dimensionality* sets representational capacity. More dimensions buy finer distinctions, at the cost of storage and search latency. Doubling dimensions — from 1536 to 3072, say — typically yields diminishing returns on retrieval quality while doubling storage and roughly doubling search time.

*Domain match* matters more than people expect. A model trained on general web text produces weak embeddings for specialized domains: medical literature, legal text, code, low-resource languages. Where a domain-specific model exists — [BioBERT](https://arxiv.org/abs/1901.08746) for biomedical, for instance — it usually beats the general model on in-domain retrieval by a noticeable margin.

*Query-document asymmetry* is the dimension nobody talks about and that often decides the outcome. Queries are short, often keyword-like, phrased as questions. Documents are long, prose-heavy, declarative. A model trained to map both into the same space — an asymmetric model — outperforms a symmetric one because the training objective matches the task.

*Cost* varies by orders of magnitude across providers. Self-hosted open-weight models have zero per-token cost but require GPU infrastructure. For a 100M-token corpus you'll only ever embed once, the difference between $0.02 and $0.13 per million tokens is $11. Not something to optimize. For a system that re-embeds frequently, it matters.

The framework I use: start with an asymmetric, medium-dimensional model whose domain approximately matches the corpus. Upgrade only after you've measured that the embedding model is the bottleneck. People reach for the largest model first because larger sounds better. It usually isn't the bottleneck.

Now, what does a vector database actually give you? It returns the chunks whose embeddings are closest to the query embedding in the learned representation space. That's all. It does not return the chunks most *relevant* to the query — it returns the chunks most *similar in embedding space*. When the embedding model is well-matched, those are nearly the same thing. When it isn't, the gap grows. And that gap is where the second pass earns its keep.

A *reranker* is a model applied after initial retrieval that scores each candidate against the query with higher fidelity. The standard architecture is a *cross-encoder* — a model that takes query and candidate together, as joint input, and produces a relevance score. Compare this to the embedding model, which is a *bi-encoder*: it embeds query and document separately, and similarity is just the cosine of the angle between them.

The architectural difference matters. A bi-encoder never sees query and document together. It has to produce representations that *happen* to be comparable via cosine similarity. That's a weaker signal than what a model can produce when it sees both inputs and runs full attention across them. The trade-off is speed: a bi-encoder embedding is pre-computed, so query time is one embedding plus a nearest-neighbor lookup. A cross-encoder must score every (query, candidate) pair at query time, which makes it impractical as first-pass retrieval over a large corpus — scoring against a million chunks would take minutes.

So you compose them. Stage one: bi-encoder retrieval pulls the top 100 or 200 candidates fast. Stage two: cross-encoder rerank picks the top 10 from that set. The bi-encoder gives you recall — "the right answer is in here somewhere." The cross-encoder gives you precision — "and here it is, near the top." The composition exploits each model's asymmetric cost, and the result is consistently 10–30% better precision than either model alone on retrieval benchmarks ([Reimers and Gurevych, 2019](https://arxiv.org/abs/1908.10084) and follow-ups document this).

It doesn't always pay off. A system already at 95% precision sees small marginal gains from reranking. A system at 70% that can be pushed to 85–90% — that's the difference between a usable product and one that quietly poisons every downstream answer the model generates.

---

## When it lies, look upstream

So now you have the pieces. The chapter would feel finished, except the most important thing I have to teach you is what to do when the system fails. Because it will fail. And the way it fails is interesting, in the sense that "interesting" applies to bugs that take three weeks to find.

When a RAG system returns a wrong answer, the visible failure is at the last stage — the model generated text that wasn't right. So the instinct is to fix the model. Tune the prompt. Try a better LLM. Both are usually wrong. The failure is almost always upstream, and the way to find it is to inspect the pipeline bottom-up, in reverse order of how the data flows.

Start with the retrieved chunks. Before you ask whether the model generated a good answer, ask whether the chunks it was given contained the information needed to answer. Log every retrieval. Read twenty samples by hand. If the chunks don't contain the answer, the model can't fix what it wasn't given. You're done — the failure is in retrieval.

If retrieval is the problem, look at the reranker. Compare the post-rerank top 10 to the pre-rerank top 20. If a relevant chunk was in the pre-rerank top 20 but didn't make it through to the post-rerank top 10, the reranker is *hurting* — usually a domain mismatch. If the relevant chunk wasn't in the pre-rerank top 20 either, the reranker can't help; the failure is further upstream.

Look at the bi-encoder. Compute the cosine similarity between the query embedding and the embedding of the chunk you know is relevant. If the similarity is low, the embedding model is failing to bring the right chunk close to the query. Domain mismatch, asymmetry the model didn't bridge.

Look at the chunks themselves. Is the relevant chunk too large, diluting its own embedding? Too small, missing context? Split across a chunk boundary so neither half makes sense? Missing metadata that would have enabled a pre-filter? These are chunking failures, and they're more common than people realize. A poorly chunked corpus cannot be rescued by any embedding model.

Only after all of that, look at the LLM. By this point, the model is being given the right chunks and still generating a wrong answer. This is the rarest failure mode I see. Usually it's a prompt issue or a model capacity limit, and it's easy to fix once you've ruled everything else out.

Let me show you what this looks like in practice. (The example that follows is constructed for teaching, not from a specific incident — but the diagnostic procedure is the one I run on real ones.)

A team reports their RAG system "hallucinates" about the payments service migration. First instinct: model failure. So we do the diagnostic.

Retrieval logs for the query *"Why did we migrate payments from Python to Go?"* show top-5 chunks: three about mobile architecture, one infrastructure review from 2021, one incident report about database performance. None mention the migration rationale.

I search the corpus directly and find the document — *"Payments service: language choice for v2"*, written in 2023. It exists in the index. Its embedding has cosine similarity 0.31 with the query. Below threshold.

So why? The document is 8,000 tokens, fixed-size-chunked at 512 tokens, no overlap. The rationale section sits 3,200 tokens deep, split between chunks 6 and 7. The header "Rationale" is in chunk 6. The actual content explaining the Go decision is in chunk 7. Chunk 7 has no header, no document title, no parent context — just a fragment of technical discussion about Go's concurrency model and goroutines.

Chunk 7's embedding points toward general Go-language discussions, not toward "payments migration rationale." No reranker can save it. The embedding is pointing the wrong way.

The fix isn't a better model. The fix is semantic chunking on header boundaries, with the document title and section header prepended to each chunk. After the change, the relevant chunk embeds at cosine similarity 0.78 to the query, retrieves in the top 3, and the agent answers correctly.

---

## What to take with you

Most of this chapter is configuration advice that will age. Embedding models get better. Long-context windows get cheaper. Prompt caching gets more aggressive. The specific recommendations for chunk sizes and dimensions and which reranker to use — those are perishable. Read the docs every six months and update.

The bottom-up diagnostic is not perishable. The pipeline structure isn't either. When a RAG system lies, the LLM is the last thing you touch — that holds across every change in the surrounding technology. Inspect the retrieved chunks first. Then the reranker. Then the bi-encoder. Then the chunking. Then, only then, the model. A practitioner who defaults to changing the LLM or the prompt will spend weeks chasing the wrong cause. A practitioner who inspects the pipeline at each stage will find the failure in an afternoon.

One thing still puzzles me. The chunk-size sweet spot lands consistently between 200 and 1,000 tokens across very different corpus types — legal text, code, conversational threads, scientific papers. The lower bound has a clear explanation: chunks need enough context to mean something. The upper bound has a rougher one — something about how attention over very long inputs degrades into averaging — but I haven't seen a clean account of where, exactly, the degradation sets in. I'd expect it to vary more with embedding architecture than it seems to. If you find the paper that explains this properly, send it to me.

What would change my mind about all of this: a long-context model with uniform attention — no lost-in-the-middle effect, verified on held-out retrieval benchmarks — that matches two-stage RAG on precision@10 within 2× the per-query cost. That removes both arguments I've built this chapter on. I don't think it's coming this generation. I could be wrong about the next.

Until then: build the pipeline. Inspect it bottom-up. And when it lies to you, the model is the last thing you touch.

# Chapter 5 — Choosing and Configuring Your RAG Pipeline

*Chunking, Embedding, Indexing, Querying, and Reranking*

**Author:** Nik Bear Brown

---

## Suggested titles

1. **Choosing and Configuring Your RAG Pipeline: Chunking, Embedding, Indexing, Querying, and Reranking**
2. **When a RAG System Lies, the LLM Is the Last Thing You Touch**
3. **The Bottom-Up Diagnostic: How to Debug a Retrieval Pipeline Without Blaming the Model**

---

## TL;DR

A RAG system that returns confidently wrong answers is almost never failing because of the language model — it's failing because of the layer it sits on top of. This chapter teaches the economics that justify retrieval over long-context, the chunking decisions that determine every downstream component's ceiling, the embedding and reranking trade-offs that set retrieval precision, and the bottom-up diagnostic that isolates which layer is actually broken.

---

## 5.1 The Scale Problem

Consider an agent deployed across a mid-sized engineering organization. Its job is to answer questions over the company's internal documentation: design docs, runbooks, incident reports, code review comments, Slack archives, onboarding materials. The corpus is modest by enterprise standards — roughly 10 million tokens. A new engineer asks, *"Why did we migrate our payments service from Python to Go in 2023?"*

The agent has options. It could attempt to load the entire corpus into a long-context window. With a model supporting 2M tokens, this requires sharding the corpus across five queries and synthesizing the results. At typical mid-2020s input pricing of $3 per million tokens [verify current pricing — changes quarterly], a single user question costs roughly $30 in input alone, takes 45 seconds to complete, and provides no guarantee that the model will actually attend to the relevant passages once they are buried among ten million tokens of ambient noise. At a hundred such queries per day, the operational cost exceeds $1,000 daily — for a feature users perceive as slow.

The alternative is retrieval-augmented generation. Instead of sending the full corpus to the model at query time, the system [indexes the corpus once into a vector database](https://arxiv.org/abs/2005.11401) and retrieves only the fragments relevant to each question. The same question now costs approximately three cents, completes in under two seconds, and — if the retrieval layer is well-designed — places the actually-relevant documents directly in front of the model without the distraction of ten million irrelevant tokens.

This is the architecture that makes agentic systems economically viable at scale. It's also the architecture that fails in the most subtle ways when any one of its components is misconfigured. A RAG system that returns confidently wrong answers is a common failure mode, and the cause is almost never the language model. The cause is a retrieval pipeline that surfaced the wrong context, and a system prompt that told the model to trust whatever it was given.

The engineering question isn't "should we use RAG?" (Chapter 26 handles that — *try simpler approaches first: a large context window, then an MCP server over raw data, then a full pipeline only if the four-variable framework says so*). This chapter starts from the assumption that you've decided to build one. Once that decision is made, every subsequent component's quality is set by decisions made earlier in the pipeline. Chunking bounds what embeddings can represent. Embeddings bound what retrieval can find. Retrieval bounds what reranking can refine. And all of them bound what the LLM is given to reason over.

---

## Learning objectives

By the end of this chapter, you should be able to:

1. **Compute** the per-query cost ratio between RAG and long-context for a given deployment, and identify which of the ratio's inputs dominates — so you know which lever actually moves the cost.
2. **Design** a chunking strategy for a heterogeneous corpus, selecting size, boundary type, overlap, and metadata per document type — not per corpus.
3. **Select** an embedding model using the four-dimension framework (dimensionality, domain match, query-document asymmetry, cost), and defend the choice against the next-most-plausible alternative.
4. **Architect** a two-stage retrieve-and-rerank pipeline, explaining why neither bi-encoder nor cross-encoder alone is the right answer and how the composition exploits their asymmetric costs.
5. **Diagnose** a failing RAG system bottom-up, isolating the failure to a specific pipeline layer by inspecting each layer's output rather than tuning the prompt or swapping the LLM.
6. **Predict**, given a specific wrong-answer symptom, which pipeline layer is the most likely site of the failure — and which diagnostic step you'd run first.

Not on this list on purpose: "understand what RAG is." The prerequisite chapters cover that. What this chapter teaches is the engineering discipline of building a RAG pipeline that works and debugging one that doesn't.

---

## Prerequisites

You need Chapter 2 (BDI + six-layer stack). RAG is specifically a commitment at **L2 (belief state)** — the decision to make the belief store external, dynamic, and queryable rather than living in the model's context window. Chapter 2's four belief questions (acquisition, validation, freshness, conflict resolution) apply to a RAG store verbatim; they're just answered with different machinery here.

You need Chapter 4's Pattern 5 (Memory-Augmented Agents) as the architectural class. What you're building in this chapter is a specific implementation of that pattern — the most common one in production, but not the only one.

You need the decision to build RAG. Chapter 26 covers that decision: the four-variable framework (corpus size, query volume, update frequency, query type) that tells you whether to build RAG, long-context, or hybrid. If you haven't measured those variables, stop and measure them before reading this chapter. Nothing in this chapter is worth reading if the architecture is wrong for your workload.

You need enough familiarity with transformer attention to recognize it as the operation that lets each token see every other token, and enough familiarity with vector embeddings to recognize them as fixed-dimensional representations where similarity corresponds to geometric proximity. Both are derived here at the surface level needed to understand the engineering trade-offs.

---

## Concept 1: Why Retrieval Exists — The Economics and Physics of Scale

The intuition that "bigger context windows will eventually solve retrieval" is one of the most common misconceptions engineers bring to RAG systems. It's wrong for two reasons: one economic, one physical. Both are worth understanding precisely.

### The cost mathematics

Let $T_{sys}$ denote the system prompt length in tokens, $T_{ctx}$ the context payload, $T_{out}$ the output length, and $P_{in}, P_{out}$ the per-token input and output prices. A single long-context query costs:

$$C_{long} = (T_{sys} + T_{ctx}) \cdot P_{in} + T_{out} \cdot P_{out}$$

For RAG, $T_{ctx}$ is replaced by $T_{ret}$, the retrieved context, typically orders of magnitude smaller:

$$C_{RAG} = (T_{sys} + T_{ret}) \cdot P_{in} + T_{out} \cdot P_{out} + C_{embed}$$

The indexing cost $C_{embed}$ is paid once across all queries; at production volumes it's a rounding error.

**Worked example.** A 20-million-token corpus. Query volume: 2,000 per day. Average retrieved context per RAG query: 4,000 tokens. Input pricing $3/M tokens; embedding $0.02/M; output 500 tokens at $15/M [verify — mid-2024 pricing, changes quarterly].

Long-context:

$$C_{long}/\text{query} = 20{,}000{,}000 \cdot 3 \times 10^{-6} + 500 \cdot 15 \times 10^{-6} = \$60.01$$

Daily: $120,020. Annual: ~$43.8M.

RAG:

$$C_{RAG}/\text{query} = 4{,}000 \cdot 3 \times 10^{-6} + 500 \cdot 15 \times 10^{-6} = \$0.0195$$

Plus one-time indexing: $20\text{M} \cdot \$0.02/\text{M} = \$0.40$. Daily: $39. Annual: ~$14,300.

The ratio isn't 10× or 100×. It's approximately **3,000×**. The decision isn't close.

Sanity check: the context payload differs by $20{,}000{,}000 / 4{,}000 = 5{,}000\times$. The cost ratio is dominated by this factor, with output cost providing a small floor. The math checks against intuition.

### Lost in the middle

The physical argument against long-context is more subtle and more important. [Liu et al. (2023)](https://arxiv.org/abs/2307.03172) documented a U-shaped performance curve: models reliably use information placed near the beginning or end of their context, but accuracy degrades substantially for information placed in the middle, even when the context fits within the stated window.

Stuffing 2M tokens into a model's context doesn't guarantee the model will find the relevant information. If the relevant passage sits at position 900,000 of 2,000,000, the model may functionally ignore it, even though it technically "saw" it. **Long-context is a weak form of retrieval** — one where the model is asked to do its own search over millions of tokens, and where the search is known to be unreliable.

RAG inverts the assumption. Instead of asking the model to search, it performs the search externally, using tools built specifically for semantic search, and places the small number of relevant passages directly in the model's working memory. The model no longer needs to search; it only needs to read and reason.

There are workloads where long-context dominates RAG — global reasoning over a single document (summarizing a 300-page contract, tracing a bug through a large codebase), or low-volume high-stakes analyst queries where human time dwarfs token cost. Chapter 26's four-variable framework tells you which regime you're in. But for the configuration question this chapter addresses, the assumption is that the framework has said "build RAG," and the work is how to build it well.

**Common misconception — "bigger context windows will obsolete retrieval within a year or two."** This is the marketing pitch, and it misses both the economics and the physics. The economics: a $60/query architecture is not competitive with a $0.02/query architecture regardless of how clever the attention mechanism gets, because the cost is dominated by the number of tokens processed, and the token count isn't going down. The physics: lost-in-the-middle is a property of learned attention patterns, and while it can be partially mitigated by training, the research record does not show uniform-attention long-context models on retrieval benchmarks. "Within a year" is a claim I've been hearing for three years running; the regime where long-context beats RAG has expanded at the margins (more tasks fit in the window, caching is cheaper), but the core trade-off is unchanged. Build for the regime you're in, not the regime the vendor promises next quarter.

---

## Concept 2: Chunking — The First Design Decision That Decides Everything Else

If the decision to use RAG is the architectural choice, the decision of how to chunk the corpus is the first design choice inside that architecture — and it's the one that most determines whether the system works. Every subsequent component operates on the chunks produced at this stage. No reranker can fully recover from chunks that destroyed their own meaning.

### What a chunk is, and why it must be bounded

A chunk is the atomic unit of retrieval: the smallest piece of the corpus that can be returned as a match. Each chunk will be embedded as a single vector, stored in the vector database, and either retrieved whole or not at all.

Two constraints bound chunk size.

The **lower bound is semantic coherence**. A chunk must contain enough context that its meaning is intelligible in isolation. A single sentence pulled from the middle of a contract clause, with no surrounding context, may be incomprehensible — it may reference *"the aforementioned party"* or *"the preceding section"* with no way to resolve the references. Too-small chunks produce embeddings that are semantically ambiguous, because the source text was ambiguous.

The **upper bound is embedding resolution**. An embedding model compresses an arbitrary-length input into a fixed-dimensional vector — typically 768, 1536, or 3072 dimensions. The longer the input, the more semantic content must be compressed into the same vector, and the more the vector becomes a blurred average of multiple ideas rather than a sharp representation of one. A chunk containing five distinct topics produces an embedding that is mediocre at representing any of them — it lies somewhere equidistant from all five, where it will be mediocre at matching queries for any of them.

Practical sweet spot for most corpora: **200 to 1,000 tokens per chunk**. The exact choice within this range depends on the corpus.

**Common misconception — "smaller chunks are always more precise."** This is wrong at both ends. At the small end, chunks below the semantic-coherence threshold produce embeddings that are *less* precise than larger ones, because the embedding no longer has enough signal to distinguish this chunk from superficially similar chunks elsewhere in the corpus. A 50-token chunk containing "the migration was completed" could refer to ten different migrations across the corpus; the embedding has no way to disambiguate. At the large end, chunks above the embedding-resolution threshold produce *averaged* embeddings that are mediocre at representing any single idea in them. The sweet spot is not "as small as possible" — it's "as small as possible *while preserving the semantic unit of meaning in the domain*."

### Fixed-size versus semantic chunking

Two strategies dominate practice.

**Fixed-size chunking** divides the corpus into chunks of uniform token count, typically with overlap. Its virtue is simplicity — no understanding of document structure required, applies to any corpus, predictable chunk counts. Its cost is that it ignores semantic boundaries. A fixed-size chunker splitting a legal contract at exactly 512 tokens will regularly split clauses mid-sentence, mid-paragraph, or mid-argument. The resulting chunks have fractured meaning: one half of a clause lives in chunk 47, the other half in chunk 48, and neither embedding represents the full clause.

**Semantic chunking** splits on document-structure boundaries: paragraphs, sections, clauses, function definitions, Markdown headers. Each chunk corresponds to a self-contained unit of meaning. The cost is that it requires the chunker to understand document structure, which differs across corpora, and chunk sizes become variable.

The choice isn't symmetric. Semantic chunking is strictly better when the corpus has recoverable structure. Fixed-size is an acceptable fallback only when corpus structure is opaque or when the engineering cost of parsing it is prohibitive. Using [LangChain's default `RecursiveCharacterTextSplitter`](https://python.langchain.com/docs/how_to/recursive_text_splitter/) on structured data is a choice to accept 20–40% less retrieval quality in exchange for one hour of engineering time saved [verify — numbers are illustrative, depend on corpus structure].

### Overlap and metadata — two small levers with big payoff

**Overlap.** Even semantic chunking produces boundaries. Information near a boundary risks being truncated from the meaning of either adjacent chunk. Standard mitigation: each chunk begins slightly before the previous ends, carrying forward the last few sentences. Typical overlap is 10–20% of chunk size. Not free — inflates total chunk count, storage, and embedding cost proportionally, and introduces near-duplicates that can clutter retrieval results. Justified when boundary information is genuinely lost without it.

**Metadata** is the most under-used lever in RAG engineering. Every chunk should carry, at minimum: source document identifier, section, date, author if known, and domain-specific categorical labels (jurisdiction for legal text, service name for engineering docs, severity for incident reports). Metadata enables pre-filtering at query time. If a user asks about the payments service, a retrieval system with `service` metadata can filter to payments-service chunks *before* computing embedding similarity, eliminating irrelevant candidates and sharply improving retrieval quality. Teams spend weeks tuning embeddings before they've considered whether a simple metadata filter would have solved the problem.

### Worked example — chunking a heterogeneous corpus

An engineering knowledge base has three document types: runbooks (structured Markdown, ~2,000 tokens each, 300 documents), incident post-mortems (prose with embedded timelines, ~5,000 tokens each, 150 documents), and code review threads (multi-turn conversations, ~800 tokens each, 2,000 threads). A single chunking strategy cannot serve all three.

For **runbooks**, the natural boundary is the Markdown header. Each `##` section becomes a chunk, with the document title and section header prepended as context. Typical chunk size: 200–600 tokens. Metadata: document title, section, service.

For **post-mortems**, paragraph-boundary chunking would produce too many small, context-starved chunks. Chunk on major section boundaries (Incident Summary, Timeline, Root Cause, Remediation), producing four to six chunks per document with full section context preserved. Typical chunk size: 500–1,200 tokens. Metadata: incident date, severity, affected service.

For **code review threads**, the thread itself is the semantic unit. Each full thread becomes a single chunk. Typical chunk size: 600–800 tokens. Metadata: repository, PR number, reviewer, date, resolution status.

Chunk at the semantic unit of the domain. A corpus is rarely homogeneous, and a chunking strategy that treats it as homogeneous will degrade retrieval quality on the portions of the corpus where the strategy is wrong.

---

## Concept 3: Embedding, Retrieval, and the Case for a Second Pass

Once chunks exist, they must be transformed into vectors that support semantic search. The choice of embedding model, and the architecture of the retrieval pipeline on top of it, determines the ceiling of retrieval quality.

### The embedding decision — four dimensions

**Dimensionality** controls representational capacity. Higher dimensions permit finer distinctions, at the cost of storage and search latency. Three ranges: small (384–768 dims, e.g. `all-MiniLM-L6-v2`), medium (1024–1536, e.g. [OpenAI's `text-embedding-3-small`](https://openai.com/index/new-embedding-models-and-api-updates/)), and large (3072, e.g. `text-embedding-3-large`, which supports dimensionality reduction via [Matryoshka representation learning](https://arxiv.org/abs/2205.13147)). Doubling dimensionality typically yields diminishing returns on retrieval quality while doubling storage and roughly doubling search time.

**Domain match** determines whether the model was trained on data resembling the target corpus. A model trained on general web text may produce weak embeddings for specialized domains — medical literature, legal text, low-resource languages, code. Where publicly available specialized embedding models exist ([BioBERT](https://arxiv.org/abs/1901.08746) for biomedical text, for example), they typically outperform general models on in-domain retrieval by 10–30% [verify — depends on benchmark].

**Query-document asymmetry** is the less-discussed but often decisive dimension. Queries are short, often keyword-like, phrased as questions; documents are long, prose-heavy, phrased declaratively. An embedding model trained to map these into the same space — an asymmetric model like Cohere's `embed-english-v3.0` — consistently outperforms symmetric models on query-document retrieval, because the training objective matches the task.

**Cost** varies by two orders of magnitude across providers. Self-hosted open-weight models have zero per-token cost but require GPU infrastructure. For a 100M-token corpus indexed once, the difference between $0.02/M and $0.13/M is $2 versus $13 — negligible. For a system that re-indexes frequently or embeds high query volumes, the difference matters.

The decision framework: **start with an asymmetric, medium-dimensional model whose domain approximately matches the corpus.** Upgrade only after measuring that the base model is the retrieval bottleneck.

**Common misconception — "higher-dimensional embeddings are always more precise."** The intuition is that more dimensions mean more expressive capacity, which means better retrieval. The reality is that you run out of useful signal long before you run out of dimensions. A 1536-dimensional model trained on a billion tokens of matched domain data will outperform a 3072-dimensional model trained on a trillion tokens of mismatched domain data, because the bottleneck isn't representational capacity — it's whether the model has learned the distinctions that matter in *your* corpus. Domain match and query-document asymmetry typically dominate dimensionality in real deployments. If you're reaching for a 3072-dim model before you've tried an asymmetric 1024-dim model on your domain, you're optimizing the wrong dimension.

### Retrieval: what vector search actually guarantees

A vector database ([Pinecone](https://www.pinecone.io/), [Weaviate](https://weaviate.io/), [Milvus](https://milvus.io/), [pgvector](https://github.com/pgvector/pgvector), and others) stores embeddings and supports approximate nearest-neighbor search. Given a query embedding, the database returns the $k$ most similar chunk embeddings in sublinear time, using indexing structures such as [HNSW](https://arxiv.org/abs/1603.09320) (Hierarchical Navigable Small World graphs) or IVF with product quantization.

The interesting question is what ANN search does and does not guarantee. It returns the chunks whose embeddings are *closest to the query embedding in the learned representation space* — exactly what the embedding model has been trained to optimize, and nothing more.

In particular: ANN does not guarantee that retrieved chunks are the most *relevant* to the query. It guarantees they are the most *similar in embedding space*. When the embedding model is well-matched to the task, these are nearly the same thing. When the model is weak, or the query is ambiguous, or the corpus contains chunks that are superficially similar but substantively irrelevant, the guarantee weakens.

This is why a second pass is often necessary.

### The case for reranking

A **reranker** is a model applied after initial retrieval that scores each candidate against the query with higher fidelity than the embedding-based first pass. The standard architecture is a **cross-encoder**: a model that takes query and candidate chunk as *joint* input and produces a relevance score.

The distinction matters architecturally. An embedding model is a **bi-encoder**: query and document are embedded separately, and similarity is computed as a geometric operation (cosine) between the two vectors. Fast — embeddings can be pre-computed, query-time work is reduced to one query embedding plus a nearest-neighbor search. The cost: the model never sees query and document together, and must produce representations that happen to be comparable via cosine similarity — a weaker signal than joint attention.

A cross-encoder sees query and document together through its full attention mechanism, producing a substantially more accurate relevance score. [Reimers and Gurevych's work on Sentence-BERT](https://arxiv.org/abs/1908.10084) and follow-up work on cross-encoder architectures documents typical improvements of 10–30% in precision@$k$ over bi-encoder retrieval alone. The cost: cross-encoder scoring cannot be pre-computed; every (query, candidate) pair must be scored at query time.

This makes cross-encoders impractical as first-pass retrieval over a large corpus — scoring a query against a million chunks would take minutes. But it makes them ideal as a second pass over a small candidate set retrieved by a fast bi-encoder. **The standard two-stage pipeline**: retrieve the top 50–200 candidates with a bi-encoder, then rerank the top 10–20 with a cross-encoder. The bi-encoder provides recall; the cross-encoder provides precision.

### Worked example — a two-stage pipeline

A customer support RAG system indexing 500,000 support tickets averaging 400 tokens each (200M tokens total). The team chooses `text-embedding-3-small` (1536d) for the first pass, stored in Pinecone.

Query-time flow: question embedded (~20ms), top 100 candidate tickets retrieved by cosine similarity (~50ms), [Cohere reranker](https://cohere.com/rerank) scores the 100 candidates (~200ms) and returns top 10. Total retrieval latency: ~270ms. Top 10 chunks (~4,000 tokens) prepended to system prompt, LLM generates response in 1–2s.

On 1,000 labeled query-ticket evaluation pairs [illustrative numbers — actual values depend on the corpus]:

- First pass only: precision@10 = 0.72
- Two-stage: precision@10 = 0.89

The reranker adds 200ms of latency and roughly $0.001 per query. At 10,000 daily queries, that's ~$10/day, ~$3,650/year. The precision improvement from 0.72 to 0.89 is 17 points — on average, 1.7 additional chunks in the top 10 are genuinely relevant rather than superficially similar. For a customer support system, this compounds: users ask follow-up questions when the first answer is based on wrong context, multiplying the cost of each imprecision.

The calculation has to be made, not assumed. A system already at 95% precision@5 will see small marginal gains from reranking; the investment doesn't pay off. A system at 70% that can be pushed to 85–90% is the difference between a usable product and one that quietly poisons the agent's reasoning.

One note about hybrid retrieval: pure semantic search fails on exact-match queries (specific error code, product SKU, person's name). Combining dense (semantic) and sparse ([BM25](https://www.nowpublishers.com/article/Details/INR-019)) scores is often stronger than either alone for corpora mixing natural language and structured identifiers.

---

## Integration: Reading a RAG System End-to-End — The Bottom-Up Diagnostic

Concepts 1, 2, and 3 give you the pieces. This section shows you how to put them together and, more importantly, how to *debug* the result when it fails.

A RAG system is a pipeline. Failures manifest as "the agent gave a wrong answer," but the cause is almost always in one specific layer — and the layers fail in characteristic ways a trained eye can distinguish.

The full pipeline, in order: document ingestion → chunking → embedding → indexing → query embedding → vector search → reranking → context assembly → LLM generation. Each layer produces inputs to the next; each layer can introduce errors the next cannot correct.

When a RAG system returns poor results, the instinct is to replace the LLM or tune the prompt. Both are usually wrong. The failure is almost always upstream. A disciplined diagnostic examines outputs at each stage, bottom-up.

**Step 1 — Examine the retrieved chunks directly.** Before asking whether the LLM is generating a good answer, ask whether the chunks it was given contain the information needed to answer. Log every retrieval. Read 20 samples manually. If the chunks don't contain the answer, the retrieval is failing; the LLM cannot fix what it was not given.

**Step 2 — If chunks are wrong, examine the reranker.** Compare post-rerank top 10 against pre-rerank top 20. If a relevant chunk was in pre-rerank top 20 but not post-rerank top 10, the reranker is *hurting* — usually a sign of domain mismatch. If not in pre-rerank top 20 either, the reranker can't help; the failure is further upstream.

**Step 3 — If the reranker's input doesn't contain the relevant chunk, examine the bi-encoder retrieval.** Compute cosine similarity between the query embedding and the embedding of the known-relevant chunk. If low, the embedding model is failing on this query — usually domain mismatch, or query-document asymmetry that the model's training objective didn't bridge.

**Step 4 — If embedding similarity is the problem, examine the chunks themselves.** Is the relevant chunk too large, diluting its embedding? Too small, losing context? Split across chunk boundaries? Missing metadata that would have enabled pre-filtering? These are chunking failures, and they are surprisingly common — a poorly-chunked corpus cannot be rescued by a better embedding model.

**Step 5 — Only after ruling out retrieval failures, examine the LLM.** At this point, the LLM is being given the right chunks and still generating a wrong answer. This is the rarest failure mode in practice, and typically reflects prompt issues or model capacity limits.

### A worked diagnostic

A team reports their RAG system is "hallucinating answers about the payments service migration." The engineer's first hypothesis is model failure. The diagnostic proceeds.

**Retrieval logs** show that for the query *"Why did we migrate payments from Python to Go?"*, the top 5 retrieved chunks are: three design docs about the mobile app architecture, one chunk from a 2021 infrastructure review, one chunk from an unrelated incident report about database performance. None contain the actual migration rationale.

The engineer searches the corpus directly and locates a 2023 design document titled *"Payments service: language choice for v2."* It exists in the index. Its embedding has cosine similarity **0.31** with the query — below the threshold for retrieval.

The embedding model is `text-embedding-3-small`, a reasonable default. The document itself is 8,000 tokens, chunked at 512 tokens with no overlap using a fixed-size chunker. The rationale section occurs 3,200 tokens into the document, split across chunks 6 and 7. The section header "Rationale" is in chunk 6; the content explaining the Go decision is in chunk 7; chunk 7 has no header and reads like a standalone fragment of technical discussion.

The failure is in chunking. Chunk 7, stripped of the document title and the "Rationale" header, has embedding content that's mostly about Go's concurrency model, garbage collection, and goroutines. It embeds closer to general Go-language discussions than to "payments migration rationale." No reranker can save it; the embedding is pointing the wrong direction.

The fix is not a better embedding model or a stronger reranker. The fix is semantic chunking on header boundaries, with the document title and parent section header prepended to each chunk. After the change, the rationale chunk embeds at cosine similarity **0.78** to the query, retrieves in the top 3, and the agent answers correctly.

The lesson generalizes. When a RAG system fails, examine the pipeline bottom-up. The failure is rarely in the last stage, even though the last stage produces the visible error. A practitioner who defaults to changing the LLM or the prompt will waste weeks. A practitioner who inspects the pipeline at each stage will isolate the failure in an afternoon.

*(The scenario above is a constructed teaching example; the specific numbers — 0.31, 0.78, chunk 6/7 split — are pedagogical rather than from a specific real incident. The diagnostic procedure it illustrates is the one I use on real incidents.)*

---

## Chapter Summary

Four capabilities you can now exercise.

You can reason about retrieval systems economically. Given corpus size, query volume, and pricing, you can compute which architecture serves the workload. The per-query cost ratio between RAG and long-context routinely exceeds three orders of magnitude for corpora beyond a few million tokens, and the lost-in-the-middle effect makes long-context an unreliable retrieval mechanism even where it's affordable.

You can chunk a corpus well. Chunking bounds every downstream component's performance. Chunk at the semantic unit of the domain — clauses for contracts, sections for runbooks, functions for code, threads for conversations. Fixed-size chunking is an acceptable fallback only when the corpus has no recoverable structure, and it carries a real cost in retrieval quality when used on structured corpora. Metadata is the lever most teams leave on the table.

You can architect and debug a two-stage pipeline. Bi-encoders provide recall; cross-encoders provide precision. The pipeline exploits the asymmetric cost of each model — bi-encoders cheap at scale, cross-encoders expensive per-query but stronger — and composing them captures both strengths. When the system fails, you examine it bottom-up, because that's where the failure is.

You can diagnose a failing RAG system by inspecting each layer's output in reverse, starting with the retrieved chunks and working back through reranker, bi-encoder, and chunking before touching the model. The discipline is everything; the machinery is straightforward.

**The one idea that matters most:** when a RAG system fails, the failure is almost never in the LLM. It's almost always upstream — in chunking, embedding, or retrieval. The disciplined practitioner inspects the pipeline bottom-up before touching the prompt or the model, because the model is rarely the bottleneck and prompt tuning cannot fix a pipeline that's handing the model irrelevant context.

**The common mistake to watch for:** reaching for prompt engineering or a model swap as the first response to a wrong answer. Both are interventions at the last layer of the pipeline. The failure is almost never at the last layer. A rule of thumb I use on myself: if I haven't inspected the retrieved chunks yet, I am not allowed to touch the prompt.

**The Feynman test, applied here:** can you, in five minutes, walk a new engineer through the five-step bottom-up diagnostic using a real retrieved-chunks log? If yes, you've got it. If you find yourself reaching for prompt edits, you haven't.

**When a RAG system lies, the LLM is the last thing you touch.**

---

## Connections Forward

**Chapter 26** is where the decision to build RAG lives — the four-variable framework (corpus size, query volume, update frequency, query type) that tells you whether a given deployment should be RAG, long-context, or hybrid. This chapter assumes you've already made that decision. If you haven't, Chapter 26 is the detour to take before applying anything here.

**Chapter 9** (evaluation metrology) is where this chapter's claimed improvements become measurable. Precision@$k$, recall@$k$, NDCG, MRR — Chapter 9 covers how to construct an evaluation set, what each metric actually measures, and how to interpret a 0.72 → 0.89 precision@10 shift in the context of your users' actual task. This chapter tells you how to build a pipeline. Chapter 9 tells you how to know if it's working.

**Chapter 18** (security) treats the same pipeline as an attack surface. Vector stores can be poisoned — an adversarial input, a buggy ingestion process, or a compromised author can write a chunk that will retrieve on a related query and feed the LLM a confidently wrong fact. Chapter 4's Pattern 5 called this *context poisoning* and distinguished it mechanistically from hallucination; Chapter 18 covers the attack surface of each pipeline stage and what defenses each can support.

**Chapter 11** (multi-agent systems) extends retrieval across agent boundaries. When one agent's memory store is another agent's retrieval source, the bottom-up diagnostic you learned here has to be extended — the failing layer might be in a different agent than the one producing the wrong answer. That's a harder diagnostic, but the discipline is the same.

One thread running forward from here: the architectural landscape is moving. Embedding models get better every six months. Long-context windows get cheaper every quarter. Prompt caching rates drop. The configuration advice in this chapter will age; the diagnostic procedure will not. If you internalize one thing from this chapter, make it the bottom-up discipline. The specific models and parameters will change under your feet. The layered failure modes won't.

---

## Exercises

Each exercise names the learning objective it tests and indicates rough difficulty. Solutions are in the appendix; attempt each problem before comparing notes.

### Warm-up (direct application of one concept)

**Exercise 5.1** *[Tests: chunk-count and indexing-cost arithmetic]* You have a 50M-token corpus to be chunked at 500 tokens per chunk with 10% overlap. You're using `text-embedding-3-small` at a stated price of $0.02 per million tokens embedded [verify]. Compute: (a) the total number of chunks in the index, (b) the total number of embedding tokens processed (chunks × chunk size), and (c) the one-time indexing cost. Then compute the same three numbers if you change to 250-token chunks with 10% overlap, and comment on what each change does to storage and to retrieval recall. **Difficulty: 1/5.**

**Exercise 5.2** *[Tests: per-query RAG vs long-context cost ratio]* Given current Claude Opus pricing ($15/M input, $75/M output [verify]), compute the per-query cost for each architecture on a 10M-token corpus: (a) RAG with 4,000 retrieved tokens, 300-token query, 400-token output; (b) long-context with the full 10M-token corpus loaded, 300-token query, 400-token output. Compute the ratio. Then answer: at what query volume per day does RAG's per-query cost advantage exceed the engineering cost of building the pipeline (assume $50K for a pipeline that takes one engineer three months to build)? **Difficulty: 2/5.**

**Exercise 5.3** *[Tests: vector-index storage and quantization trade-off]* A vector index holds 2,000,000 chunks embedded at 1,536 dimensions. Compute: (a) total storage if each dimension is stored as a 4-byte float32, (b) total storage if each dimension is quantized to a 1-byte int8. Then explain what the quantization trade-off buys and costs — specifically, when would you *not* quantize, even though it saves 4× on storage? **Difficulty: 2/5.**

### Application (translation to a different problem)

**Exercise 5.4** *[Tests: chunking strategy for a heterogeneous structured corpus]* You're building RAG over 500,000 GitHub issues from a large open-source project. Each issue contains: a title (20–100 tokens), a description (50–3,000 tokens, in Markdown), a discussion thread (2–50 comments, each 20–500 tokens), and metadata (labels, milestone, author, reporter, status, dates). Design a chunking strategy: specify chunk size bounds, boundary types, overlap policy, and the full metadata schema. Identify at least two failure modes your strategy prevents that a fixed-size 512-token chunker would produce. **Difficulty: 3/5.**

**Exercise 5.5** *[Tests: embedding-model selection under constraints]* You're building RAG over 5M tokens of customer support tickets across three languages (English, Spanish, Japanese). Query volume: 10,000/day. Latency budget: under 1 second end-to-end. Compare three embedding options: (a) `text-embedding-3-small` (1,536d, English-optimized), (b) Cohere `embed-multilingual-v3.0` (1,024d, multilingual, asymmetric) [verify current availability], (c) `all-MiniLM-L6-v2` (384d, self-hosted on a single GPU, open weights). Recommend one, justifying the choice on at least three of the four embedding-decision dimensions. What would change your recommendation if latency budget dropped to 200ms? **Difficulty: 3/5.**

**Exercise 5.6** *[Tests: retrieval-quality metric calculation and interpretation]* You have a labeled evaluation set where for a specific query, exactly 3 chunks in the full corpus are truly relevant. Your two-stage pipeline returns these pre-reranker top 10: `[R, X, X, X, R, X, X, X, X, R]` where R = relevant, X = irrelevant. After reranker: `[R, R, X, X, R, X, X, X, X, X]`. Compute: (a) precision@5 and recall@5 before reranking, (b) precision@5 and recall@5 after reranking, (c) Mean Reciprocal Rank (MRR) before and after reranking. Then explain, in two sentences, what the improvement from pre-rerank to post-rerank reveals about the reranker's role in the pipeline. **Difficulty: 3/5.**

### Synthesis (combining concepts)

**Exercise 5.7** *[Tests: bottom-up diagnostic procedure design]* A stakeholder reports: *"Our RAG system sometimes confidently cites information that isn't in our documents. Other times it misses information we know is there. It's unreliable."* Design a systematic diagnostic procedure to isolate which layer (chunking, embedding, retrieval, reranking, or generation) is responsible for each of the two failure types. For each layer, specify: (a) what signal to look at, (b) what test to run, (c) what result would indicate this layer as the cause. Indicate the order in which you'd run the tests and why. **Difficulty: 4/5.**

**Exercise 5.8** *[Tests: full-pipeline architecture under constraints]* A law firm has 20M tokens of case law (U.S. federal cases, structured into opinions with sections). Query volume: 1,000/day from associates. Budget: $5K/month infrastructure + compute. Latency: under 3 seconds end-to-end. Compare three architectures: (i) long-context with prompt caching, (ii) pure RAG with no reranker, (iii) two-stage RAG with cross-encoder reranker. For each, estimate monthly cost, median latency, and expected precision@10. Recommend one and defend against the other two. Include at least one specific failure mode your recommendation is vulnerable to, and how you'd monitor for it. **Difficulty: 4/5.**

**Exercise 5.9** *[Tests: metadata schema design and pre-filtering]* You're building RAG over 2M tokens of medical literature (peer-reviewed papers). Design a metadata schema (at least 6 fields) that would enable useful pre-filtering. For each field, identify: (a) the data type, (b) the query patterns where this field dominates embedding similarity, (c) the consequence of the field being missing or wrong. Then construct one specific query where applying your metadata pre-filter changes the top-10 retrieval result in a way the embedding model alone could not achieve. **Difficulty: 4/5.**

### Challenge (open-ended, beyond the chapter's boundary)

**Exercise 5.10** *[Tests: analytical derivation of RAG/long-context parity]* Derive, analytically, the conditions under which long-context beats RAG on cost. Express the answer as an inequality relating corpus size $C$, retrieved context size $T_{ret}$, query volume $Q$, input price $P_{in}$, and any other variables you need. Assume prompt caching at 10% of the uncached rate. Then argue whether the parity regime (where long-context cost is within 2× of RAG cost) is (a) common in current enterprise deployments, (b) expanding or contracting over time, (c) something a practitioner should plan for or can reasonably ignore. Defend your answer against at least one plausible counterargument. **Difficulty: 5/5.**

**Exercise 5.11** *[Tests: hybrid retrieval design for mixed content]* Design a hybrid retrieval pipeline (combining dense and sparse retrieval) for a corpus mixing natural language with structured identifiers: product descriptions containing SKUs, troubleshooting guides referencing error codes, customer support records with customer IDs and transaction numbers. Specify: (a) why pure semantic (dense) search fails on this corpus, (b) what sparse method you'd use and why, (c) how you'd combine dense and sparse scores (reciprocal rank fusion, learned combination, score normalization, or another scheme), (d) one failure mode your scoring scheme introduces that a naive sum of dense and sparse scores would not. **Difficulty: 5/5.**

---

**What would change my mind:** a demonstration that long-context models with uniform attention — no lost-in-the-middle degradation, verified on held-out retrieval benchmarks — can match two-stage RAG on precision@10 while staying within 2× the per-query cost. That would remove both of the arguments against long-context I've built this chapter on. I don't see it coming in the current generation of models; I could be wrong about the next.

**Still puzzling:** I don't fully understand why chunk-size sweet spots converge so consistently across corpus types around 200–1,000 tokens. The lower bound (semantic coherence) has a clear explanation. The upper bound (embedding resolution) has a rougher one — something about how attention over very long inputs degrades into averaging — but I haven't seen a clean account of where exactly the degradation sets in, and I'd expect it to vary more with embedding architecture than it seems to.

---

## References

- Lewis, P., Perez, E., Piktus, A., et al. (2020). [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401). NeurIPS 2020.
- Liu, N. F., Lin, K., Hewitt, J., et al. (2023). [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172). arXiv:2307.03172.
- Reimers, N., & Gurevych, I. (2019). [Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks](https://arxiv.org/abs/1908.10084). EMNLP 2019.
- Malkov, Y. A., & Yashunin, D. A. (2016). [Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs](https://arxiv.org/abs/1603.09320). arXiv:1603.09320.
- Kusupati, A., Bhatt, G., Rege, A., et al. (2022). [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147). NeurIPS 2022.
- Lee, J., Yoon, W., Kim, S., et al. (2019). [BioBERT: a pre-trained biomedical language representation model for biomedical text mining](https://arxiv.org/abs/1901.08746). Bioinformatics.
- Robertson, S., & Zaragoza, H. (2009). [The Probabilistic Relevance Framework: BM25 and Beyond](https://www.nowpublishers.com/article/Details/INR-019). Foundations and Trends in Information Retrieval.
- OpenAI. [New embedding models and API updates](https://openai.com/index/new-embedding-models-and-api-updates/). OpenAI blog.
- LangChain. [Recursively split by character](https://python.langchain.com/docs/how_to/recursive_text_splitter/). LangChain documentation.
- Cohere. [Rerank](https://cohere.com/rerank). Cohere product documentation.
- Vector databases referenced: [Pinecone](https://www.pinecone.io/), [Weaviate](https://weaviate.io/), [Milvus](https://milvus.io/), [pgvector](https://github.com/pgvector/pgvector).

---

**Tags:** `rag`, `chunking-strategy`, `bi-encoder-cross-encoder`, `pipeline-diagnostic`, `lost-in-the-middle`, `bottom-up-debugging`, `retrieval-precision`, `memory-layer-engineering`
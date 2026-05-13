# Chapter 38 — Case: AI-Powered Stock Research Platform

*A four-agent CrewAI pipeline with two-phase ticker-aware retrieval — because financial language sounds the same across companies and naive semantic search returns the wrong tickers.*

**Author:** Tianyu Zhang
**Editor:** Nik Bear Brown

---

## Situation

Equity-research workflows produce per-ticker reports that have to combine SEC filings, earnings transcripts, market analysis, and technical indicators into a coherent narrative — and the LLM-driven version of this workflow has a specific failure mode: financial language sounds the same across companies. *Revenue growth driven by services segment* describes Apple. It also describes Microsoft. A naive semantic-similarity search over a financial knowledge base, asked for *AAPL revenue growth*, returns Microsoft documents because the embedding similarity between Microsoft's services-segment language and Apple's services-segment language is genuinely high. The ticker the user asked about quietly disappears. The AI-Powered Stock Research Platform addresses this by combining CrewAI multi-agent orchestration with **two-phase ticker-aware retrieval** that searches the requested ticker's chunks first and only fills remaining slots with cross-sector context. The system's correctness property is straightforward: if the user asked about AAPL, AAPL evidence reaches the report before evidence about anyone else does.

## Architecture

A multi-agent system orchestrated by [CrewAI](https://www.crewai.com/) with four specialized agents in a sequential pipeline. **Controller** oversees workflow as `manager_agent`. **Data Collector** retrieves price data and indicators. **Technical Analyst** computes RSI, MACD, SMA, EMA, Bollinger Bands and reasons about technical signals. **Report Writer** synthesizes the structured deliverable. All four agents have access to the RAG search tool, enabling them to query the knowledge base during their work.

The **RAG pipeline** ingests 15 Markdown documents covering 5 categories: financial glossary (3), SEC 10-K filings (5), earnings transcripts (4), market analysis (3). Section-aware recursive splitting respects Markdown header boundaries (`##`, `###`); within sections, text splits recursively on paragraph breaks, sentences, then words. Chunk size 500 characters with 50-character overlap produces **102 chunks with preserved metadata**. ChromaDB with cosine similarity is the primary vector store; `all-MiniLM-L6-v2` (384-dim) is the embedding model. A **TF-IDF fallback** (scikit-learn) activates when ChromaDB is unavailable, and a pure-Python keyword matcher serves as the ultimate fallback — three layers of degradation rather than one cliff.

The **two-phase ticker-aware retrieval** is the architecturally distinctive move. Phase 1 searches only chunks tagged with the requested ticker. Phase 2 fills the remaining top-k slots with general semantic search across the broader corpus. An AAPL query returns AAPL-specific documents first, with cross-sector context as supplementary material rather than as the result.

The **prompt-engineering framework** provides three versioned prompts per agent, each building on the previous:

| Version | Strategies | Analyst backstory size |
| --- | --- | --- |
| `v1_basic` | Simple role/goal/backstory | 184 chars |
| `v2_structured` | Explicit workflows + few-shot examples | ~2,500 chars |
| `v3_cot_rag` | Chain-of-thought + RAG context + few-shot | ~4,100 chars |

Strategies are composable functions: `apply_chain_of_thought()` adds step-by-step scaffolding, `apply_few_shot()` injects worked examples, `apply_rag_context()` inserts retrieved documents with citation markers, `build_agent_prompt()` composes them based on the selected version.

## Design rationale

The architectural commitment that earns the system's name is **two-phase retrieval where the first phase is ticker-strict**. A single-phase semantic search produces the silent-failure mode: financial vocabulary is shared across companies, and the embeddings cannot distinguish "this paragraph is about AAPL" from "this paragraph would also describe AAPL if it were about AAPL but is actually about MSFT." Tagging every chunk with its ticker(s) at index time and filtering Phase 1 retrievals by ticker is what makes the AAPL query return AAPL evidence. Phase 2's cross-sector fill is a deliberate softening — sometimes a market-wide sector trend is the right context for a single-ticker analysis — but Phase 2 is always *additional*, never replacement.

The **three-version prompt framework with composable strategies** is the second consequential design move. The system does not ship a single prompt. It ships three: a simple baseline (`v1_basic`), a structured workflow with few-shot examples (`v2_structured`), and a full chain-of-thought + RAG-grounded prompt (`v3_cot_rag`). Each version is the next layer up; each strategy is a composable function the next prompt version applies. This is the structured version of Chapter 20's vanilla-vs-structured baseline split — three points on the prompt-engineering effort frontier rather than two — and it lets the team measure where the prompt-engineering investment actually produced the gains they observe.

The **three-tier degradation in the vector backend** is the third move. Many production RAG systems treat ChromaDB-or-equivalent as a hard dependency: if the vector store is down, the system is down. This system degrades to TF-IDF when ChromaDB fails, and to a pure-Python keyword matcher when scikit-learn fails. The degradation is named, the fallback paths are testable, and the system continues serving — at lower retrieval quality — when its primary semantic path is unavailable.

## Trade-offs

The 15-document curated knowledge base bounds coverage to specific tickers (AAPL, MSFT, TSLA, NVDA prominent in test results); broader coverage requires expanding the document set, with the chunking and indexing cost that implies. The 4-agent CrewAI orchestration adds latency overhead — each agent's task hands off to the next via CrewAI's `context` parameter, with sequential rather than parallel execution. The dollar-sign-rendering issue (Streamlit interprets `$...$` as LaTeX math delimiters; the team had to escape `$` as `\\$` in report markdown) is a small but instructive detail — production frontends carry surface-rendering bugs that no amount of model quality fixes. The TF-IDF fallback is meaningfully less precise than ChromaDB semantic search; the keyword matcher is meaningfully less precise still. The team accepts this graceful-degradation curve because *some answer with a stale knowledge base* beats *no answer when the vector store is down*.

## Outcomes and revisions

RAG retrieval quality across five test queries:

| Query | Ticker | Results | Avg score | Time (ms) |
| --- | --- | ---: | ---: | ---: |
| AAPL revenue growth earnings | AAPL | 5 | 0.4323 | 1291.2 |
| Tesla electric vehicle deliveries | TSLA | 5 | 0.4754 | 115.6 |
| What is RSI indicator | — | 5 | 0.4529 | 110.8 |
| NVIDIA data center GPU revenue | NVDA | 5 | **0.5778** | 116.1 |
| Stock market risk assessment volatility | — | 5 | 0.4726 | 123.5 |
| **Average** | | | **0.4822** | |

End-to-end pipeline latency on three tickers (data fetch + processing + indicators + RAG):

| Symbol | Data (ms) | Process (ms) | Indicators (ms) | RAG (ms) | Total (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| AAPL | 616.98 | 0.56 | 0.43 | 225.05 | **843.49** |
| MSFT | 109.31 | 0.49 | 0.36 | 233.09 | 343.68 |
| TSLA | 61.19 | 0.48 | 0.35 | 253.63 | 316.09 |

Test coverage: **60 tests passing** across `test_standalone.py` (25+ tool unit tests), `test_rag.py` (18 RAG-pipeline tests), `test_prompts.py` (16 prompt-template tests), `test_integration.py` (14 end-to-end tests). The most consequential planned revision is broadening the knowledge-base corpus beyond the initial 15 documents, plus introducing inter-ticker contamination testing — deliberately constructed adversarial queries that share vocabulary across tickers — to measure how often the two-phase retrieval still surfaces wrong-ticker results.

## Pattern connection

This case instantiates Chapter 9's Retrieval principle (chunked ticker-tagged content with metadata-filtered semantic search; two-phase fallback chain to TF-IDF and keyword matching) and Chapter 12's framework-correctness argument (CrewAI sequential pipeline with explicit agent contracts produces the workflow's correctness property — *the report cites evidence from the right ticker* — through the metadata-filtered retrieval step rather than through prompt-level instructions to each agent).

## Transfer prompt

In your own RAG system over a corpus where vocabulary is shared across distinct entities (companies, products, jurisdictions, patients), what prevents the retriever from returning the wrong entity's documents? Are your chunks tagged with entity metadata at index time, or are you relying on semantic similarity alone? When your primary vector backend fails, how many tiers of degradation does your system have — and is *some answer with a stale or simpler retrieval* better than *no answer* in your domain?

---

*Spring 2026.*


---

## A note about AI

Stock Research is an agent in a domain where the model is trained on opinions and has no predictive value.

Where the model genuinely helps: producing the structural categories of stock analysis — fundamental, technical, sentiment — and the standard metrics for each.

Where the model does damage: producing actionable buy/sell recommendations. The model has no real-time market data, no edge, and no accountability.

The rule: framework from the model; trades from licensed professionals with skin in the game.

---

## AI Wayback Machine

**Benjamin Graham** was wrote Security Analysis in 1934 — the founding methodology of careful financial due diligence.

**Run this:**

```
Who is Benjamin Graham, and how does their work connect to the stock research agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Benjamin Graham"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Benjamin Graham's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Benjamin Graham's framework."

What changes? What gets better? What gets worse?

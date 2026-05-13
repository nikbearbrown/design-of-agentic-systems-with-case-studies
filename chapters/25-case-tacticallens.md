# Chapter 25 — Case: TacticalLens

*A locally-hosted soccer-intelligence RAG that routes queries by intent before retrieval — and refuses to fabricate when the open dataset doesn't have what was asked for.*

**Author:** Nikhil Kalyan Devihosur
**Editor:** Nik Bear Brown

---

## Situation

Soccer match data is messy across two axes simultaneously. Coverage is uneven — [StatsBomb's open dataset](https://github.com/statsbomb/open-data) provides detailed event-level records for some competitions and seasons but not others, and a query about *Arsenal's 2003-2004 Invincibles season* will hit a dataset that holds 38 fixture records for some teams in that league-year and a handful for others. Query intent is also uneven — *what were Arsenal's best results in 2003/2004?* is a historical-results query, *how did Arsenal press in the final third?* is a tactical query, *who was Arsenal's best finisher that season?* is a player query, and a single retrieval strategy that treats them identically returns the wrong chunks for two of the three. TacticalLens is a RAG system that addresses both problems by routing queries through a zero-shot intent classifier *before* retrieval and grounding every response in retrieved chunks with an explicit Limitations section. The system runs entirely locally via Ollama; no external API keys, no per-query cost, no data leaving the machine.

## Architecture

The pipeline is five layers. **Data Ingestion** (`pipeline/ingest.py`) fetches match records from the StatsBomb Open Data repository via their Python API across 18 competitions — La Liga, Premier League, Champions League, FIFA World Cup, UEFA Euro, Ligue 1, Serie A, NWSL, FA WSL, MLS — and converts each match into a structured text chunk encoding teams, date, competition, season, final score, and venue. Metadata is preserved for post-retrieval filtering. **Embedding** (`pipeline/embed.py`) runs every chunk through `nomic-embed-text` via Ollama and writes the resulting vectors to ChromaDB; the index rebuilds from scratch on each run for consistency. The corpus stabilizes at **1,275 vectors across 1,071 matches and 18 competitions**. **Query Routing** (`rag/router.py`) sends incoming queries through a zero-shot prompt to Llama 3.2 that classifies them into three categories: tactical, player, historical. **Retrieval** uses cosine similarity with intent-dependent depth — `k=5` for historical, `k=4` for tactical and player. **Synthesis** invokes Llama 3.2 with three prompt templates (`SYSTEM_PROMPT` establishing analyst persona and grounding rules, `SYNTHESIS_PROMPT` structuring output into Overview / Key Findings / Limitations, `ROUTER_PROMPT` for the routing classifier) and produces the final response. **Streamlit UI** wraps the pipeline with a Sources panel exposing every retrieved chunk so users can verify any claim.

## Design rationale

The architectural commitment that earns the system's name is **routing before retrieval**. A single retrieval strategy across heterogeneous query intents is the design that produces the most common silent failure in domain RAG: a tactical question retrieves match-result chunks, the LLM hallucinates tactical interpretation from result data, the user accepts a fluent answer that has no grounding in the retrieved evidence. TacticalLens addresses this by treating intent classification as a structural step rather than a prompt convention. The router is a separate LLM call running a dedicated prompt against the user's query, not a heuristic over keywords. Its output gates the retrieval depth and the synthesis-prompt selection. This is the same pattern as Chapter 22's TrialMatch Controller doing model selection at runtime — the routing decision is *architectural*, logged, and inspectable.

The **mandatory Limitations section in every response** is the second consequential design move. The synthesis prompt enforces three sections — Overview, Key Findings, Limitations — and explicitly instructs the model never to speculate beyond retrieved context. Limitations is not a footnote disclaiming caution at the bottom of fluent prose; it is a load-bearing section where the model is required to name what the retrieved evidence *did not* contain. For the Arsenal 2003/2004 query, the response correctly named the retrieved results (the 4-2 vs Liverpool, 4-1 vs Middlesbrough) *and* surfaced the Limitations caveat that not all 38 league matches were present in the open dataset. A user reading the answer can see what the answer rests on and what it doesn't.

The **fully-local Ollama deployment** is the third move. Local inference means zero per-query cost, zero rate-limiting, and zero data leakage — at the cost of 15-to-30-second response latency dominated by Llama 3.2 inference time. For an educational tool aimed at fans, students, and analysts who want grounded synthesis over a reproducible open dataset, the latency trade is correct. Embedding and retrieval add under 2 seconds combined; routing adds 1-2 seconds. The bottleneck is the synthesis call.

## Trade-offs

Local Llama 3.2 produces honest grounded responses but is meaningfully less fluent than commercial frontier models — the Limitations section quality, in particular, is bounded by the local model's ability to detect what *isn't* in the retrieved context. Sparse-coverage competitions (women's football, MLS earlier seasons, South American leagues) hit the dataset's geographic and gender imbalances, which the ethics section names explicitly. Vague queries retrieve irrelevant chunks even after routing — the router is ~95% accurate on a 20-query test set, which means roughly one query in twenty is misrouted before retrieval has a chance. Rebuilding the vector store from scratch on every run is correct for consistency but slow at startup.

## Outcomes and revisions

| Metric | Result | Notes |
| --- | --- | --- |
| Query routing accuracy | ~95% | 20 sample queries |
| Average response time | 15–30s | Local Llama 3.2 inference |
| Retrieval relevance | High | Manual inspection across query types |
| Knowledge base size | 1,275 vectors | 18 competitions, 1,071 matches |

The example output for the Arsenal Invincibles query (routing: historical, k=5 retrieved chunks, ~22s response time) returned the correct results plus a Limitations caveat. Out-of-scope queries surface as *"insufficient context"* responses rather than fabricated synthesis — the architectural commitment from the system prompt enforced through the synthesis template. The most consequential planned revision is hybrid retrieval combining semantic search with keyword/metadata filtering for precision (the named "query ambiguity" challenge in the report), plus a RAGAS evaluation framework to measure retrieval precision and answer faithfulness systematically rather than via manual inspection.

## Pattern connection

TacticalLens instantiates Chapter 9's Retrieval principle (semantic search over chunked StatsBomb content with intent-aware depth) and a smaller pattern worth naming: **routing as an explicit pre-retrieval step**. When query intent meaningfully changes which retrieval strategy is correct, treating routing as a separate inference call rather than as a prompt-level instruction is the architectural move that makes the routing decision inspectable and improvable. The Limitations section is Chapter 7's UNCERTAIN state preserved as first-class output.

## Transfer prompt

In your own RAG system, are different query intents being served by the same retrieval strategy? If yes, are you measuring which queries are misrouted? When your system answers a question whose answer is partial in the corpus, does the response *say so* — or does fluency hide the gap? Could your synthesis prompt enforce a Limitations section that is structurally required rather than politely requested?

---

*Spring 2026.*


---

## A note about AI

TacticalLens advises on tactical decisions. The model has no skin in the operation, which is exactly the disqualification for tactical judgment.

Where the model genuinely helps: producing the doctrinal framework against which a decision can be measured.

Where the model does damage: producing the decision. Tactical decisions require accountability that a model cannot provide.

The rule: doctrine from the model; decisions from operators with the consequences.

---

## AI Wayback Machine

**John Boyd** was fighter pilot turned strategist whose OODA loop (Observe, Orient, Decide, Act) framework now guides tactical and operational reasoning.

**Run this:**

```
Who is John Boyd, and how does their work connect to the tactical decision agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"John Boyd"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply John Boyd's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of John Boyd's framework."

What changes? What gets better? What gets worse?

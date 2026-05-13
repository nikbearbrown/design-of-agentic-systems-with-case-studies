# Chapter 45 — Case: StudyMate AI

*A four-layer learning-content system where the same RAG pipeline produces grounded Q&A, synthetic quizzes, flashcards, and ELI5 explanations — with diverse context sampling that prevents quizzes from being biased toward the opening pages of a textbook.*

**Author:** [verify — author placeholder unfilled in submitted documentation]
**Editor:** Nik Bear Brown

---

## Situation

A student opens a 600-page biology textbook on Tuesday and tries to study from it on Thursday. Three things go wrong with the LLM-driven path: hallucination (the LLM produces plausible-sounding but factually incorrect answers when asked about specialized topics), unverifiable sources (the student cannot easily audit where a claim came from, making it risky to study from LLM outputs alone), and no personalization (a generic chatbot cannot tailor quizzes or flashcards to the specific textbook the student is using). The student ends up with answers that *might* be right, that they *can't* check, and that *don't* connect to the material the exam covers. StudyMate AI addresses all three by indexing the student's own documents into a local vector store, retrieving the most relevant passages before every generation, exposing the source of every answer, and reusing the same RAG pipeline to synthesize practice questions, flashcards, and level-adjusted explanations — all grounded in the user's material. The architectural premise is that *one RAG pipeline can serve four distinct learning artifacts* if the prompt-engineering layer is designed to compose them rather than to reach for the same single-prompt shape.

## Architecture

Four layers. **Frontend** — Streamlit with a sidebar (configuration, document upload, knowledge-base status) and five main tabs (Q&A, Quiz, Flashcards, Summarizer, ELI5). The chat tab uses `st.chat_message` and `st.chat_input` for a conversational feel; every answer shows an expandable *Sources used* section. **Core Application Layer** — Prompt Manager (per-task templates), RAG Engine (embedding + retrieval), Synthetic Data Generator (quiz / flashcard / summary / ELI5). **Data Layer** — recursive-character text splitter (paragraph → sentence → word boundaries, 512-char chunks with 50-char overlap, both user-tunable), `all-MiniLM-L6-v2` embedder (384-dim, ~80MB), ChromaDB `PersistentClient` with cosine similarity persisted to `data/chroma_db/` so the knowledge base survives app restarts. **Pluggable LLM backend** currently supports Anthropic Claude and OpenAI GPT.

The **prompt-engineering strategy** uses one shared four-part structure across every task: role framing (system prompt naming role and constraints), explicit numbered rules (*"Answer ONLY using the context below. If the context does not contain the answer, say so — do not invent facts."*), structured input (context wrapped in XML-style tags `<context>`, `<source>`, `<question>`), output contract (JSON schema for quizzes and flashcards, with a robust `extract_json` helper that tolerates markdown code fences and prose preambles).

Temperature is tuned per task. **Q&A and summary** at 0.3 (factuality is paramount). **Quiz** at 0.5 (some diversity in distractors is desirable). **ELI5** at 0.7 (creative analogies help). Few-shot examples are embedded in quiz prompts to anchor the expected JSON schema.

The **deterministic chunk IDs** are an MD5 hash of `chunk_text + source + index`, preventing duplicate insertion when a user re-uploads the same document.

## Design rationale

The architectural commitment that earns the system's name is **diverse context sampling**. When the user does not specify a topic, the synthetic-data generator draws a *random shuffle* of chunks from the collection rather than always returning the first K. This is the single most consequential design choice in the system because of the failure mode it closes. A naive RAG-driven quiz generator asked *"generate 10 quiz questions from my biology textbook"* will produce questions about the textbook's first chapter, every time, because the embedding of the topic-less query best matches the introduction's broad framing language. Diverse context sampling forces the generator to draw from across the corpus — Chapter 7's failure mode (silent failures that look fine and are systematically wrong) applied at the *coverage* dimension rather than the *correctness* dimension. The quiz looks correct on inspection. It is systematically biased toward the opening pages. Diverse sampling is the architectural fix.

The **per-task temperature tuning** is the second consequential design move. Q&A needs factuality; synthesizing creative distractors for multiple-choice questions needs some diversity; ELI5 explanations benefit from analogical creativity. Treating temperature as a per-task parameter rather than a single system-wide setting is what makes the same RAG pipeline serve four genuinely different generation tasks without having to compromise either way.

The **JSON output contract with malformed-output recovery** is the third move. Quizzes and flashcards require structured output the UI can render. The LLM occasionally emits markdown-fence-wrapped JSON or prose preamble before the JSON object. The `extract_json` helper handles both gracefully — strips fences, locates the first complete JSON object — and the validation filter drops malformed items rather than propagating them to the UI. Tested at **100% recovery on 50 synthetic noisy outputs**.

The **PersistentClient ChromaDB store** is the fourth move. The student's knowledge base survives app restarts; re-uploading the same document does not duplicate chunks (deterministic IDs); a session resumed days later picks up exactly where it left off. This is Chapter 9's Caching pattern with deliberate persistence semantics.

## Trade-offs

The 4-layer architecture introduces engineering surface that simpler one-shot systems avoid; for a single-purpose tool this would be over-built, for a multi-task learning content creator it is the right structural decomposition. Local sentence-transformers embedding is the right call for free deployment and a real maintenance surface (model upgrades require re-indexing the corpus). The pluggable LLM backend is a small abstraction that pays off when switching between Claude and GPT, and a real cost when both backends drift in their JSON-emission behavior. The diverse context sampling is correct for unspecified-topic quizzes and the wrong choice when the user explicitly wants to be quizzed on Chapter 3 — the generator switches to topic-specific retrieval when a topic is given.

## Outcomes and revisions

Evaluation on a MacBook Pro M2 with 16GB RAM, Claude Sonnet 4.5, and a sample biology document (~1,200 words, 12 chunks):

| Metric | Value | Notes |
| --- | --- | --- |
| Document ingestion latency | 2.4 s | Embedding (~1.8s) + Chroma insert |
| Average retrieval latency (top-4) | 110 ms | After embedding warm-up |
| Average Q&A end-to-end latency | 3.1 s | Retrieval + LLM call |
| Quiz generation (5 MCQs) | 6.8 s | Temperature 0.5, includes JSON parsing |
| Flashcards (10 cards) | 5.2 s | Temperature 0.4 |
| **Malformed-JSON recovery rate** | **100%** | On 50 synthetic noisy LLM outputs |
| Retrieval Recall@4 (manual, n=20) | **95%** | Relevant chunk present in top-4 for 19/20 queries |
| Answer groundedness (manual, n=20) | **18/20** | 2 over-extended into general knowledge |
| Automated test pass rate | **14/14** | pytest on rag, prompt, synthetic modules |

The two manual-groundedness failures are the honest discrimination this system needs. They are not outright hallucinations — they are cases where the model extended beyond the source with general knowledge (adding the endosymbiotic theory as background when the source mentioned it only briefly). This is borderline behavior worth tightening in future iterations, the author notes. That kind of self-honest evaluation is the chapter's discipline applied to the system's own limits. The most consequential planned revision is tightening the *do-not-extend-beyond-source* constraint in the Q&A prompt and broadening the test corpus beyond a single biology document.

## Pattern connection

StudyMate AI instantiates Chapter 7's Fact Check List Pattern (every answer surfaces sources; explicit prompt rule against hallucination), Chapter 9's Retrieval principle (chunked persistent vector store with semantic similarity), and a smaller pattern worth naming: **diverse context sampling for unspecified-topic generation**. When a synthetic-data generator is asked to produce items without a specified topic, drawing a *random shuffle* across the corpus rather than the top-K nearest to a generic query is what prevents the systematic-coverage-bias failure mode.

## Transfer prompt

In your own RAG-based content generator, when the user doesn't specify a topic, are you drawing diverse context across the corpus — or letting embedding similarity collapse you to the most generic-feeling section? When you reuse one RAG pipeline for multiple generation tasks, are you tuning temperature per task — or running everything at the same setting? When the LLM occasionally emits malformed structured output, do you have a recovery layer that drops invalid items — or propagate them to the UI?

---

*Spring 2026.*


---

## A note about AI

StudyMate is a study-support agent. The model is exactly the kind of system that can prevent the difficulty from which learning happens.

Where the model genuinely helps: producing varied practice problems and structured retrieval drills.

Where the model does damage: producing the answer the student should be working toward. The struggle is the study.

The rule: drills from the model; the working belongs to the student.

---

## AI Wayback Machine

**Marie Montessori** was physician and educator whose method shaped the design of self-directed learning environments — the conceptual ancestor of modern study assistants.

**Run this:**

```
Who is Marie Montessori, and how does their work connect to the study support agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Marie Montessori"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Marie Montessori's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Marie Montessori's framework."

What changes? What gets better? What gets worse?

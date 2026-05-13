# Chapter 36 — Case: Adaptive Linear Algebra Explainer (Faraz)

*A RAG pipeline that diagnoses a student's conceptual tier before retrieving anything — three misconception probes that route into Geometric Intuition, Formal Beginner, or Algebraically Grounded explanations.*

**Author:** Faraz Elahi Mohammed
**Editor:** Nik Bear Brown

---

## Situation

Linear algebra is one of the courses where the same question — *what is an eigenvector?* — has three very different correct answers depending on the student. A first-year engineering student needs the geometric intuition: an eigenvector is a direction the matrix only stretches, never rotates. A computer-science sophomore who has done one term of linear algebra needs the formal beginner answer: $A\mathbf{v} = \lambda \mathbf{v}$ paired with a concrete worked example. A math major comfortable with abstract structures needs the algebraically grounded answer: spectral theorem, Jordan normal form, Cayley-Hamilton in proper formal notation. A standard RAG chatbot answers the same way regardless of who is asking, which means it explains too much for the engineering student, too little for the math major, and produces a uniformly mediocre experience for everyone in between. The Adaptive Linear Algebra Explainer addresses this by **diagnosing the student's conceptual tier before retrieving anything**, then filtering vector-search results to match that tier before generation. The architectural premise is that *adaptive explanation is a routing problem upstream of retrieval, not a prompt-engineering problem at generation time*.

## Architecture

A three-stage sequential pipeline. **Stage 1 — Diagnostic Module.** Three free-text questions probe known misconceptions in linear algebra. *Q1: "True or false: for any two matrices A and B, AB = BA."* Tests commutativity misconception. *Q2: "What does it mean for a vector to be in the null space of a matrix?"* Tests null-space conceptual depth. *Q3: "How would you describe an eigenvector to someone who has never seen one?"* Tests articulation register. A rule-based classifier with keyword matching on the three responses outputs a tier (1, 2, or 3) and a misconception string when one is detected. **Stage 2 — Retrieval.** Cosine-similarity search against ChromaDB with `$and` metadata filter on `{tier, topic}`. If fewer than 3 results return at full filter, falls back to tier-only filter. Returns top-5 chunks. **Stage 3 — Generation.** A prompt builder constructs a system prompt with tier-specific persona description plus optional misconception-correction instruction. Mistral 7B Instruct via Ollama at `localhost:11434/api/chat` produces the final response, instructed to use only retrieved context and cite sources.

The knowledge base is built from four synthetic PDF documents authored in LaTeX, each calibrated to a specific tier:

| Source | Tier | Content focus |
| --- | --- | --- |
| `vector_spaces_notes.pdf` | 1 | Plain-language intuition, analogies, no formal notation |
| `intro_linear_algebra_notes.pdf` | 2 | Formal definitions paired with concrete examples |
| `systems_row_reduction_notes.pdf` | 2 | Procedural: Gaussian elimination, rank-nullity, determinants |
| `eigen_notes.pdf` | 3 | Abstract: 8 axioms, rank-nullity theorem, spectral theorem, Jordan normal form, Cayley-Hamilton |

Total after chunking: **159 chunks across 15 topics**. Chunking uses LangChain's `RecursiveCharacterTextSplitter` (chunk_size 400, overlap 75); embedding is `all-MiniLM-L6-v2` (384-dim).

The three tiers and their generation instructions:

| Tier | Label | Generation instruction |
| --- | --- | --- |
| 1 | Geometric Intuition | "a beginner who needs plain English and physical intuition — use no formal notation, explain using analogies and real-world examples" |
| 2 | Formal Beginner | "an intermediate learner who understands operations but needs conceptual framing — pair every definition with a concrete example" |
| 3 | Algebraically Grounded | "an advanced student comfortable with abstract mathematical structures — use precise mathematical language and formal definitions" |

## Design rationale

The architectural commitment that earns the system's name is **diagnosis as a separate upstream stage, not a generation-prompt parameter**. A naive design would inject *please answer for [tier]* into the generation prompt and let the model interpret that. The architectural design here moves the tier decision *upstream of retrieval* — which means the chunks the model sees are already tier-appropriate, and the LLM cannot accidentally reach for a chunk written in formal notation when the student needs intuition. The retrieved context shape *is* the tier. The generation prompt's tier-persona instruction is the second layer of consistency, not the only one.

The **misconception-tagged knowledge base** is the second consequential design move. The four synthetic PDFs are not just *covering the same content at different difficulty levels*; they are deliberately written to address the misconceptions a student at that tier most needs corrected. The Tier-1 vector spaces notes do not just simplify the formal Tier-3 spectral-theorem treatment; they replace it with the geometric picture (rotation, stretch, axis-of-action) that the student at this level needs *first*, before any formal notation lands. Authoring four parallel calibrated documents — rather than chunking one document with difficulty tags — is the architectural decision that makes tier-filtered retrieval produce coherent context per tier.

The **fallback chain on retrieval (full `$and` filter → tier-only)** is the third move. Vector-similarity search across a 159-chunk corpus with a strict `{tier=1, topic=eigenvectors}` filter may return zero chunks if the query happens to fall on a topic underrepresented at that tier. Falling back to tier-only filter when fewer than 3 results return preserves the tier discipline (no formal-notation chunk leaks into a Tier-1 explanation) while gracefully degrading the topic specificity. Returning empty rather than reaching for any chunk would be the wrong correctness property here — the user gets a less topic-specific response, not a tier-mismatched one.

## Trade-offs

The 159-chunk corpus is bounded by what the four authored PDFs cover. Topics with high chunk counts (`vectors` 33, `eigenvectors` 26, `determinants` 15) are well-served; topics with sparse coverage (`matrix_inverse` 2, `systems_of_equations` 1, `matrix_multiplication` 3) trigger fallback frequently and degrade in quality. The rule-based diagnostic classifier is deterministic and inspectable and *not* learned — adding new misconception probes requires editing keyword rules. Local Mistral 7B inference on free-tier hardware caps response quality below frontier-model levels and keeps the system fully self-hosted, which is the right trade for an educational tool deployed to a classroom. The synthetic PDFs are author-generated and their internal consistency depends on how carefully the four parallel documents were calibrated against each other; a misalignment between Tier-1 and Tier-3 explanations of the same concept would produce a learner-perceptible discontinuity.

## Outcomes and revisions

The technical report names this as a **smoke-test evaluation** rather than a comprehensive benchmark. Diagnostic accuracy on the smoke set is reported, and RAGAS-based faithfulness evaluation runs Ollama as the judge LLM against the retrieved context. The outcomes section is honest about the size of the evaluation: the system is a working architecture, not yet a measured intervention. The most consequential planned revision is broadening the corpus from four authored PDFs to a larger curated open-textbook subset, plus introducing a between-subjects student study where Tier-1, Tier-2, and Tier-3 students receive Tier-matched explanations versus randomized explanations and conceptual-understanding gain is measured.

## Pattern connection

This case instantiates Chapter 9's Retrieval principle (chunked tier-tagged content with metadata-filtered semantic search) and a smaller pattern worth naming: **routing as an explicit pre-retrieval step on user state, not just on query intent**. Chapter 25's TacticalLens routed on what the user *asked*; this case routes on what the user *understands*. Both are upstream-of-retrieval routing, but the variable being classified is different — in adaptive education, the tier of the student is the routing input, not the topic of the question.

## Transfer prompt

In your own retrieval system, are you filtering chunks by user *state* in addition to query *content*? When your knowledge base needs to serve audiences with different conceptual levels, are you authoring tier-calibrated documents — or chunking one document and hoping the model picks the right register? When tier-strict retrieval returns nothing, does your fallback preserve the strictness on the dimension that matters most to your users?

---

*Spring 2026.*


---

## A note about AI

Adaptive linear algebra means tutoring or applying the subject with attention to the student's specific gaps. The model can produce solutions fluently.

Where the model genuinely helps: walking through the conceptual scaffolding of a problem at the level the student is currently working at.

Where the model does damage: producing the answer before the student has worked it. The work is the learning.

The rule: scaffolding from the model; the work belongs to the student.

---

## AI Wayback Machine

**James Wilkinson** was numerical analyst who built much of the foundation of modern adaptive linear algebra — error analysis, backward stability, iterative solvers.

**Run this:**

```
Who is James Wilkinson, and how does their work connect to the adaptive linear algebra we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"James Wilkinson"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply James Wilkinson's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of James Wilkinson's framework."

What changes? What gets better? What gets worse?

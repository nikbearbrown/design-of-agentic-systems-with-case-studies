# Image brief — Ch 39 Case: Immigrant Tax Filing Assistant

**Filename:** `images/39-case-immigrant-tax.jpg`
**Aspect:** 16:9 hero, Kindle-readable.

**Subject:** A user query entering on the left with profile metadata (F-1 / India / 2 years). A prominent CPA-escalation gate at the front showing 24 keywords (FBAR, FATCA, dual status, audit...) — a fork visible where escalation-triggered queries divert immediately to a CPA referral card *without* reaching the LLM. The non-escalated path continues through metadata filter → query enrichment → FAISS → smart re-ranker → prompt builder → Groq LLaMA, ending with a structured cited answer. Below the main flow, a small inset showing the deterministic SPT calculator (`pure Python, zero LLM`) with the IRS-519 citation.

**Mood:** Tax-help, careful, immigrant-friendly. Structured, schematic.

**Negative space:** Top for chapter title; bottom for the "3,726 chunks / 24 escalation keywords / SPT pure Python" caption.

**Notes:** The teaching image is *some queries should never reach the LLM, and the architecture knows which ones.* Make the CPA-escalation fork the most visually prominent design element. Avoid generic IRS / 1040-form imagery.

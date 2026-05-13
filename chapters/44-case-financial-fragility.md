# Chapter 44 — Case: AI Financial Fragility Detector

*A seven-stage pipeline that combines quantitative ratios with NLP textual stress analysis — and uses synthetic data generation to address the class-imbalance problem of having only 3-4 real bank failures to learn from.*

**Author:** Nikhil Patwal
**Editor:** Nik Bear Brown

---

## Situation

Regional bank failure is rare, consequential, and asymmetric: when [Silicon Valley Bank failed on March 10, 2023](https://en.wikipedia.org/wiki/Collapse_of_Silicon_Valley_Bank), the predictive signals had been visible in [FDIC quarterly data](https://www.fdic.gov/resources/data-tools/) and SEC 10-K disclosures for several quarters, but the market only repriced the risk in the final weeks. Generic LLMs can summarize 10-K filings and produce risk-language paragraphs that read correctly. They cannot quantify structural vulnerability into a comparable index across banks, cannot weight quantitative ratios against qualitative disclosure changes, and cannot learn from the small number of historical failure events without overfitting. The AI Financial Fragility Detector addresses this by combining quantitative financial ratios with NLP-driven textual stress analysis across SEC 10-K filings, grounding LLM risk assessments in retrieved source filings rather than parametric knowledge, and **generating synthetic distressed-bank profiles to address the severe class imbalance** of having only 3-4 real bank failures across the 6-year evaluation window.

## Architecture

A seven-stage Jupyter-notebook pipeline. **Stage 1 — Collection** pulls FDIC API data, SEC EDGAR 10-K filings, and `yfinance` stock data. **Stage 2 — Ratios** computes four vulnerability ratios from raw FDIC data: Liquidity Ratio (`(Cash + Securities) / Deposits`), Debt-to-Equity, Interest Coverage (`Net Interest Income / Interest Expense`), Loan-to-Deposit, and Uninsured Deposit %. **Stage 3 — NLP** runs three textual analyses on 10-K Risk Factors and MD&A sections: hedging-language density (50+ uncertainty terms per 1,000 words), [VADER](https://github.com/cjhutto/vaderSentiment) sentiment compound and negative scores averaged across 5,000-character chunks, and risk-section year-over-year growth. A separate 15-term severe-distress vocabulary (`insolvency`, `receivership`, `bank run`, `capital deficiency`) is tracked with higher weight. **Stage 4 — RAG** indexes filings into ChromaDB and retrieves grounded risk assessments. **Stage 5 — Prompt Engineering** runs LLM risk scoring across 5 dimensions on a 1–10 scale via Groq Llama 3.3 70B. **Stage 6 — Synthetic Data Generation** produces 80 synthetic bank profiles via LLM generation across 5 distress archetypes, augmenting the training set from 112 to 192 observations. **Stage 7 — ML Models** trains 3 classifiers with cross-validation against the augmented dataset.

The dataset: **19 regional banks over 6 years (2018-2023)**. **112 bank-quarter observations** with 161 FDIC financial fields per record. Bank selection: 3-4 failed banks (SVB, Signature Bank, First Republic), 5 stressed-but-survived (PacWest, Western Alliance, Zions, Comerica, KeyCorp), 10+ stable controls (U.S. Bancorp, Truist, M&T Bank, Regions Financial).

## Design rationale

The architectural commitment that earns the system's name is **synthetic data generation as a deliberate response to class imbalance**, not as a research afterthought. With only 3-4 real failures across the 6-year window, any classifier trained on the raw data overfits to the specific failure modes of SVB / Signature / First Republic and fails to generalize. The synthetic data generator produces 80 profiles across 5 distress archetypes — interest-rate-shock failures, deposit-flight failures, concentrated-loan-portfolio failures, capital-adequacy failures, governance-failure profiles. The augmentation moves the training set from 112 to 192 observations and lets the classifier learn the *shape* of distress rather than memorize three failure events. The synthetic generation is grounded — each archetype is constructed from documented historical failure patterns, not invented from prompt creativity.

The **enhanced RAG with three retrieval strategies** is the second consequential design move. The initial naive RAG implementation achieved only **50% source coverage** (5 out of 10 banks had grounded assessments). The enhancement adds three explicit strategies: bank-specific queries filtered by name, general financial-risk queries as fallback when bank-specific results are sparse, and ratio-informed queries that adapt based on the bank's measured weaknesses. The combination moved coverage to **100% (30 out of 30 assessments)**. This is Chapter 25's *route-before-retrieve* insight applied to a different domain — when a single retrieval strategy doesn't cover the input space, you compose multiple strategies rather than relax the threshold.

The **quantitative-plus-qualitative composite fragility index** is the third move. Pure quantitative scoring would miss the linguistic shifts that precede ratio movements (Risk Factors sections growing 30% year-over-year, hedging-language density spiking, severe-distress terms appearing). Pure qualitative scoring would miss the structural ratio decay that shows up in FDIC data months before the disclosures sharpen. Composing both into a normalized index — weighted by domain knowledge of which signals matter most for early warning — produces a score that ranks banks consistently across both axes.

The **NaN-safe ratio context construction** is the fourth move and the small-but-instructive engineering detail. Real FDIC data has missing fields, especially for newer banks or for ratios that depend on multiple line items where one is null. The `build_ratio_context()` helper handles NaN values explicitly rather than letting them propagate into the LLM prompt as `nan` strings the model would interpret unpredictably.

## Trade-offs

The 19-bank evaluation set is small and US-regional-bank-specific; the architecture would generalize across other market segments and geographies but would need re-curation of the bank list and the 10-K equivalent for each. The synthetic data generator's 5 archetypes are bounded by the historical failure modes the team knew to encode; new failure modes (e.g., crypto-exposure-driven collapses, AI-platform liability) would need additional archetypes or risk producing a classifier confident on past patterns and uncertain on novel ones. The composite fragility index weighting between quantitative and qualitative signals is calibrated, not learned; the right weight depends on which lead time the user cares about (ratios lead 6+ months; disclosure shifts lead 1-3 months). LLM scoring at temperature 0 produces deterministic per-quarter scores and pays the per-bank LLM-call cost; for sustained quarterly monitoring across a broader bank universe, scoring cost would scale linearly.

## Outcomes and revisions

| Result | Notes |
| --- | --- |
| Bank universe | **19 regional banks** over 6 years |
| Bank-quarter observations | **112** (raw) → **192** (after synthetic augmentation) |
| Synthetic profiles generated | **80** across 5 distress archetypes |
| RAG source coverage (enhanced) | **100%** (30/30 assessments) |
| LLM scoring range | 6–10 across 17 banks |
| First Republic LLM score | **8/10** (highest, correctly reflects elevated risk) |

The headline empirical result: **Signature Bank and First Republic Bank were correctly ranked in the top 4 most fragile banks** by the data-driven fragility index, on a system that had not been trained on their specific failure events. The notebook contains 44 cells (23 code, 21 markdown), all executed without errors, producing 12 data files and 14 output visualizations including interactive Plotly dashboards. The most consequential planned revision is broadening the bank universe beyond US regionals, expanding the synthetic-archetype taxonomy to cover novel failure modes, and conducting a forward-walking out-of-sample backtest where the system is asked to score banks at quarter-end and the prediction is verified against actual subsequent stress events.

## Pattern connection

This case instantiates Chapter 9's Retrieval principle (chunked 10-K content with bank-name metadata filtering and three composed retrieval strategies for full coverage) and a smaller pattern worth naming: **synthetic data generation as a structural mitigation for class imbalance**. When the failure events you most want to predict are too rare to learn from directly, generating archetype-grounded synthetic profiles — labeled with the same schema as the real data — is the architectural decision that turns an underpowered classifier into one that can generalize. The mitigation is correct only when the synthetic generation is grounded in documented patterns; ungrounded synthesis just teaches the classifier the LLM's prior, not the failure mode.

## Transfer prompt

In your own classification system where the positive class is rare, are you generating synthetic positive examples grounded in documented patterns — or accepting an underpowered classifier? When your initial RAG retrieval covers only a fraction of your input space, do you compose additional retrieval strategies — or relax the similarity threshold? When your scoring system combines quantitative and qualitative signals, do you weight them by domain knowledge of which leads which — or assume one composite weight serves all use cases?

---

*Spring 2026.*


---

## A note about AI

Financial Fragility is an agent for systemic financial risk. The model has read crisis literature and has no view of current market conditions.

Where the model genuinely helps: producing the Minskian framework and the canonical indicators that have preceded past crises.

Where the model does damage: declaring the current moment fragile or stable. Predictions about systemic risk require current data and judgment the model cannot have.

The rule: framework from the model; the present read from someone with current market data.

---

## AI Wayback Machine

**Hyman Minsky** was economist whose Financial Instability Hypothesis explains how stable financial situations turn unstable.

**Run this:**

```
Who is Hyman Minsky, and how does their work connect to the financial fragility analysis we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Hyman Minsky"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Hyman Minsky's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Hyman Minsky's framework."

What changes? What gets better? What gets worse?

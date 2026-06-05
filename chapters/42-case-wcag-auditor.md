# Chapter 42 — Case: WCAG Compliance Auditor

*An accessibility auditor that detects violations, generates fixes, then re-audits the fixed HTML — closing the feedback loop that the manual workflow leaves open for hours.*

**Author:** Vrushti Shah
**Editor:** Nik Bear Brown

---

## Situation

Web accessibility is systematically broken. The [2024 WebAIM Million scan of top one-million homepages](https://webaim.org/projects/million/) found that **95.9% had detectable WCAG 2.1 failures**. The most common violations — missing `alt` text, insufficient color contrast, unlabeled form fields — are not exotic edge cases. They are the errors that slip through because the feedback loop between *writing code* and *knowing it's accessible* has a multi-hour gap in the middle. A developer ships a page; an accessibility audit runs days or weeks later; the violations come back as a list with no fixes attached; the developer re-reads the WCAG specification, makes guesses about which patches satisfy which Success Criterion, and ships again hoping the next audit will pass. The WCAG Compliance Auditor closes the gap. Given a URL, raw HTML, or a webpage screenshot, it fetches and parses the real HTML, retrieves the relevant WCAG 2.2 specification criteria from a vector knowledge base, identifies violations with severity ratings and WCAG criterion references, generates corrected HTML with inline citations to the specific Success Criterion satisfied, **re-audits the fixed HTML to validate fix effectiveness**, and explains every violation in plain language. A 4–8 hour manual audit cycle compresses to 8–22 seconds.

## Architecture

A FastAPI backend with three input routes and a four-step audit chain. **`POST /audit/html`** accepts raw HTML directly. **`POST /audit/url`** fetches via `httpx` and runs the audit chain on the actual HTML, not on a hallucinated version. **`POST /audit/image`** routes screenshots through a Vision LLM (LLaMA Vision) to produce HTML, then runs the same audit chain. **`GET /metrics/{id}`** returns cached metrics for a previous audit.

The four-step audit chain. **Step 1 — RAG Context.** ChromaDB semantic search returns the top-3 WCAG 2.2 criteria most relevant to the input HTML. Embeddings are local `sentence-transformers` (no API). **Step 2 — Violation Detection.** `llama-3.3-70b-versatile` at temperature 0.0 takes the HTML plus retrieved WCAG context and emits a JSON `violations[]` array with severity tags and POUR-principle classification (Perceivable / Operable / Understandable / Robust). **Step 3 — Fix Generation.** The same model generates corrected HTML with `<!-- FIXED: X.X.X -->` inline comments citing the WCAG Success Criterion satisfied. Input includes HTML, the detected violations, and fix patterns retrieved from the WCAG corpus. **Step 4 — Re-Audit.** The audit prompt runs *again* on the fixed HTML and computes a `fix_validity_rate` metric — what fraction of the original violations the fix actually closed. The re-audit step is the architectural commitment that earns the system's name.

## Design rationale

The architectural commitment that earns the system's name is **the re-audit step that validates the fix on the same axis the original audit measured**. Most LLM-driven code-fix tools generate a fix and trust the model to be correct. The WCAG Auditor runs the audit again on the fixed output and measures whether the violations actually closed. A fix that introduces new violations (a real failure mode — adding `alt=""` to a decorative image is correct, but doing so without verifying the image is actually decorative produces a different violation downstream) gets caught by the re-audit. A fix that doesn't close the original violation gets caught by the re-audit. The fix-validity-rate metric is the system's own honest report on whether its fixes work, and it lives on the same path as the user's verdict — the user sees both the original violations and the validation that the fixes resolved them.

The **real-HTML-not-hallucinated-HTML commitment** is the second consequential design move. A naive design would let the LLM "imagine" what HTML lives at a URL and audit that. The WCAG Auditor uses `httpx` to fetch the actual page bytes. The screenshot path uses a Vision LLM as a *parser* — extracting structured HTML from the visual representation — but the audit then runs against the parsed HTML, not against the LLM's free-form interpretation of the image. The discrimination matters because WCAG violations are properties of specific HTML attributes; auditing a hallucinated HTML structure produces hallucinated violations.

The **inline citation to specific WCAG Success Criterion in fixed output** is the third move. Every fix carries a `<!-- FIXED: 1.1.1 -->` comment citing the WCAG criterion satisfied. A developer reviewing the diff can see exactly which Success Criterion drove each change. This makes the fix *auditable by humans*, not just produced by a model. Chapter 7's Fact Check List Pattern at the comment level: every change is a citation.

The **POUR-principle severity classification** is the fourth move. WCAG organizes around four principles — Perceivable, Operable, Understandable, Robust — and assigning each violation to its POUR principle plus a severity tag (`critical` / `serious` / `moderate` / `minor`) gives the developer a triage order that matches the WCAG specification's own taxonomy.

## Trade-offs

The Vision-LLM screenshot path is the lowest-confidence input mode — converting pixels to structured HTML is harder than parsing HTML directly, and edge cases (overlapping elements, custom rendering) produce HTML the auditor then audits. The local sentence-transformers embedding is the right call for free deployment and a real maintenance surface (the WCAG corpus needs re-indexing when WCAG 2.2 revises). LLaMA 3.3 70B at temperature 0.0 is deterministic and fluent and sometimes over-aggressive on fix generation — adding ARIA attributes where simpler HTML would be more correct. The re-audit step doubles the LLM cost per audit but is the architectural property the system depends on.

## Outcomes and revisions

The system compresses **4–8 hour manual audit cycles into 8–22 seconds**, makes the result free at deployment, and reports `fix_validity_rate` on every audit run. The author's framing of the value proposition is direct: the failure isn't that developers don't care about accessibility; it's that the feedback loop is too slow for the lessons to land at the moment they would help. Compressing the loop to under a minute is what turns *check accessibility before shipping* from an aspiration into a workflow. The most consequential planned revision is broadening the WCAG corpus from the current 2.2 specification to include WCAG 2.1 differences (some teams still target 2.1 for compatibility), and adding a regression-testing mode that compares accessibility scores across consecutive deploys to surface when a refactor regresses on an axis it previously satisfied.

## Pattern connection

The WCAG Compliance Auditor instantiates Chapter 7's Fact Check List Pattern (every fix carries a Success-Criterion citation; the re-audit step verifies that fixes actually close the violations they target) and Chapter 9's Retrieval principle (chunked WCAG specification content embedded once, queried selectively per audit). The validate-the-fix pattern is small but important: when an LLM generates a remediation, run the same diagnostic again on the remediated output before declaring the remediation complete.

## Transfer prompt

In your own LLM-driven fix-generation system, do you re-run the diagnostic on the fixed output before declaring success — or trust the model? When you accept multiple input modalities (text, URL, image), are downstream checks running against the *parsed structure* or against the model's interpretation of the input? When your remediation tags each change with a citation to the specific rule satisfied, can a human reviewer verify the change without re-deriving the rule themselves?

---

*Spring 2026.*


---

## A note about AI

WCAG Auditor evaluates web accessibility. The standard is documented; the auditing is empirical against actual user agents.

Where the model genuinely helps: producing the WCAG-criterion-to-element mapping for a given page.

Where the model does damage: certifying that a page meets WCAG. Certification requires testing with actual assistive technology, not the model's read of the markup.

The rule: criterion mapping from the model; certification from accessibility testing in real assistive tech.

---

## AI Wayback Machine

**Vint Cerf** was helped make accessibility a first-class concern in internet protocol design — he wore hearing aids and is partially deaf.

![Vint Cerf](../images/vint-cerf-6sv.png)

*Puppet Art by [Nik Bear Brown](https://www.nikbearbrown.com/).*

**Run this:**

```
Who is Vint Cerf, and how does their work connect to the accessibility audit agents we covered in this chapter? Keep it to three paragraphs. End with the single most surprising thing about their career or ideas.
```

→ Search **"Vint Cerf"** on Wikipedia.

**Now make the prompt better.** Try one of these:

- Ask it to apply Vint Cerf's framework to a specific agent design problem you face.
- Add a constraint: "Answer including criticisms or limits of Vint Cerf's framework."

What changes? What gets better? What gets worse?

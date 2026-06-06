# Wayback Image Prompts — Design of Agentic Systems with Case Studies

Text-to-image prompts generated from the AI Wayback Machine sections in `chapters/`.
Each prompt is anchored to the historical figure named in the chapter section.

```python
design_of_agentic_systems_with_case_studies = [
    # chapters/00-introduction.md — Norbert Wiener
    "Norbert Wiener (circa 1948, American mathematician and cybernetics founder) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/00-preface.md — Margaret Hamilton
    "Margaret Hamilton (circa 1969, American software engineer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/01-move-that-changed-everything.md — Lee Sedol
    "Lee Sedol (circa 2016, South Korean Go champion) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/02-blueprint-before-the-build.md — Christopher Alexander
    "Christopher Alexander (circa 1977, Austrian-British architect and design theorist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/03-five-patterns-five-tradeoffs.md — Erich Gamma
    "Erich Gamma (circa 1994, Swiss computer scientist and design patterns author) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/04-rag-101.md — Gerard Salton
    "Gerard Salton (circa 1975, German-American information retrieval pioneer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/05-configuring-your-rag-pipeline.md — Karen Spärck Jones
    "Karen Spärck Jones (circa 1972, British information retrieval researcher) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/06-grounding-agents-in-evidence.md — Hilary Putnam
    "Hilary Putnam (circa 1975, American philosopher) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/07-hallucination-plausibility-vs-truth.md — Daniel Kahneman
    "Daniel Kahneman (circa 1982, Israeli-American psychologist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/08-attack-surface-no-one-designed-for.md — Bruce Schneier
    "Bruce Schneier (circa 2000, American cryptographer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/09-five-ways-context-kills-agents.md — Lucy Suchman
    "Lucy Suchman (circa 1987, American anthropologist of human-machine interaction) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/10-coordinated-agents-emergence.md — John Holland
    "John Holland (circa 1975, American complex systems scientist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/11-model-economics.md — William Nordhaus
    "William Nordhaus (circa 1990, American economist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/12-choosing-your-weapon.md — Frederick Brooks
    "Frederick Brooks (circa 1975, American computer architect and software engineering thinker) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/13-protocol-layer.md — Vint Cerf
    "Vint Cerf (circa 1974, American internet pioneer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/14-twelve-production-builds.md — Grace Hopper
    "Grace Hopper (circa 1952, American computer scientist and naval officer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/15-case-codesentinel.md — Barbara Liskov
    "Barbara Liskov (circa 1988, American computer scientist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/16-case-verifai.md — Tony Hoare
    "Tony Hoare (circa 1969, British computer scientist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/17-case-pharmguard.md — Frances Oldham Kelsey
    "Frances Oldham Kelsey (circa 1962, Canadian-American pharmacologist and FDA reviewer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/18-case-bioclaim-guard.md — John Ioannidis
    "John Ioannidis (circa 2005, Greek-American physician-scientist and meta-researcher) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/19-case-cleardischarge.md — Atul Gawande
    "Atul Gawande (circa 2009, American surgeon and writer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/20-case-aira.md — Joseph Weizenbaum
    "Joseph Weizenbaum (circa 1966, German-American computer scientist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/21-case-crisislens.md — Charles Perrow
    "Charles Perrow (circa 1984, American sociologist of organizational accidents) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/22-case-trialmatch.md — Janet Wittes
    "Janet Wittes (circa 1985, American biostatistician) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/23-case-policylens.md — Cass Sunstein
    "Cass Sunstein (circa 2008, American legal scholar) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/24-case-planlens.md — Herbert Simon
    "Herbert Simon (circa 1962, American political scientist and AI pioneer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/25-case-tacticallens.md — John Boyd
    "John Boyd (circa 1976, American military strategist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/26-case-pitch-verdict.md — Daniel Kahneman
    "Daniel Kahneman (circa 1982, Israeli-American psychologist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/27-case-pygmy.md — Mary Allen Wilkes
    "Mary Allen Wilkes (circa 1965, American computer programmer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/28-case-jobzilla.md — Claudia Goldin
    "Claudia Goldin (circa 1990, American economic historian) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/29-case-costsherlock.md — Eli Goldratt
    "Eli Goldratt (circa 1984, Israeli business theorist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/30-case-litmusqe.md — W. Edwards Deming
    "W. Edwards Deming (circa 1950, American statistician and quality theorist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/31-case-schemaguard.md — Edgar F. Codd
    "Edgar F. Codd (circa 1970, British computer scientist and relational database pioneer) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/32-case-clis-v2.md — Brian Kernighan
    "Brian Kernighan (circa 1978, Canadian computer scientist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/33-case-cloudarch.md — Werner Vogels
    "Werner Vogels (circa 2006, Dutch computer scientist and cloud architect) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/34-case-cybersecurity-guardian.md — Dorothy Denning
    "Dorothy Denning (circa 1982, American computer security researcher) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/35-case-syllabus-navigator.md — Benjamin Bloom
    "Benjamin Bloom (circa 1956, American educational psychologist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/36-case-adaptive-linalg-faraz.md — James Wilkinson
    "James Wilkinson (circa 1965, British numerical analyst) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/37-case-adaptive-linalg-abdul.md — Cleve Moler
    "Cleve Moler (circa 1980, American numerical analyst and MATLAB creator) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/38-case-stock-research.md — Benjamin Graham
    "Benjamin Graham (circa 1949, British-American investor and economist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/39-case-immigrant-tax.md — Stephen Shay
    "Stephen Shay (circa 2010, American tax law scholar) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/40-case-mindmirror.md — Aaron Beck
    "Aaron Beck (circa 1970, American psychiatrist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/41-case-research-claim-auditor.md — Donald Rubin
    "Donald Rubin (circa 1974, American statistician) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/42-case-wcag-auditor.md — Vint Cerf
    "Vint Cerf (circa 1990, American internet pioneer and accessibility advocate) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/43-case-thought2do.md — David Allen
    "David Allen (circa 2001, American productivity consultant) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/44-case-financial-fragility.md — Hyman Minsky
    "Hyman Minsky (circa 1980, American economist) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
    # chapters/45-case-studymate.md — Marie Montessori
    "Marie Montessori (circa 1913, Italian physician and educator) - historically plausible editorial portrait, face-centered composition, period-appropriate clothing and workspace, accurate to known public portraits or photographs when available, no text, no watermark, with subtle background cues from their field and the chapter's agentic-systems case context",
]
```

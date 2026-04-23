
# Preface

*What this book is, what it is not, and who wrote it with me.*

---

## What this book is

This is a handbook for engineers who are being asked to decide whether agentic systems are the right answer to a problem, and to begin the design if they are. It is structured as a short theory spine — ten or so chapters I wrote — paired with a case layer written by the students in the Spring 2026 cohort of my course at Northeastern. Each case documents a real deployed agentic system or a real phenomenon across real incidents. The cases are what makes this a book about agentic systems in practice rather than agentic systems in theory.

The structure is deliberate. The theory spine is the stable frame: patterns, trade-offs, failure modes, the architectural decisions that determine whether a system works or whether it silently fails in ways the model cannot see. The case layer is where theory meets deployment, and it is where most of the teaching actually happens. A reader who reads only the spine will come away with vocabulary. A reader who reads the cases against the spine will come away with judgment. The difference matters.

You can read this book cover-to-cover, or you can open it to the case that looks closest to the problem you are trying to solve and work outward from there. I have tried to write the spine chapters so that either reading is coherent. The pattern cases — hallucination, context collapse, cascade failure, the attack surface nobody designed for — are deliberately structured as phenomena, not as companies, because a pattern appears across many systems and a case should teach the pattern. The system cases — Magid, Quandri, My AskAI, Oracle Health, Enterprise Bot, Six Atomic, Stripe — are deliberately structured as specific architectures, because every real system is the set of design decisions someone made under their specific constraints, and there is no substitute for reading those decisions in context.

---

## What this book is not

This is not *AI Engineering*. Chip Huyen's book is broader, treats LLM systems as a full stack, and is what you should reach for if your problem is "how do I build production LLM applications in general." This book is narrower, and it is about the specific architectural discipline required when the system you are building acts on the world.

This is not *Building Agentic AI Systems*. Wrick Talukdar and Anjanava Biswas's book teaches implementation through enterprise-AWS code. This book teaches design judgment through documented real deployments. The two books are complements for most readers, not substitutes.

This is not *Designing Multi-Agent Systems*. Victor Dibia's book teaches you to build agentic systems from scratch by walking through the construction of a framework. If you learn by building, Dibia is the right place. This book teaches through reading how real teams built real systems, for readers who learn faster by studying cases than by constructing from first principles. You would not be worse off reading both.

This is also not a book about training, fine-tuning, prompt engineering, evaluation benchmarks, ethics, governance, or human-in-the-loop design. Each of those is an important subject; none of them is this subject. Some will appear in the book I plan to write next.

---

## The thesis

Every book has a thesis, even when it pretends not to. Mine is this: *the theory of agentic systems is outpacing the practice, the practice is best learned from real deployments, and the pattern library has to be a living document because the field is moving too fast for static editions.*

Every word in that sentence is doing work. **Theory outpacing practice** means that the frameworks and vocabulary for reasoning about agents have raced ahead of the documented record of what actually ships. Papers describe patterns faster than engineers can deploy them, and the gap between "architectures that work in a demo" and "architectures that survive production" is still mostly unwritten. **Practice is best learned from real deployments** is the case-method claim — the same claim Porter made about strategy in 1980, the same claim law schools make about precedent, the same claim medical schools make about rounds. It is a pedagogical commitment, and it is why the case layer is structurally load-bearing in this book rather than decorative. **Living document** is a publishing commitment. This edition is Spring 2026. There will be a Fall 2026 edition. The theory spine will get field-drift patches each semester — updated protocols, updated tools, updated examples — while the stable frame holds. The case layer will grow and rotate. What you are holding is a snapshot.

That thesis is not uncontested, and I owe you an honest account of where it is disputed.

---

## What this book takes positions on, and what the field disputes

There are at least six places where this book stakes a claim that reasonable people in the field would disagree with. I am going to name them here rather than hide them, because a book that pretends its positions are settled consensus is a book that will embarrass itself in peer review.

**The thesis itself.** Not everyone agrees that theory is outpacing practice. A strong counter-view holds that practice is ahead — that builders are figuring out patterns faster than academics are naming them, and the theory literature is catching up. A third view holds that "agentic systems" is not yet a coherent discipline at all — that it is a vendor category that has yet to earn its separate treatment. I disagree with both counters, but the arguments are not unreasonable, and I want you to know they exist.

**What counts as "agentic."** This book uses a working definition: an agentic system, at minimum, has the perceive-reason-act loop with some persistence of state and some ability to invoke tools. Other practitioners use stricter definitions (only systems with explicit BDI structure and long-running autonomy qualify) or looser ones (any LLM with tool use is agentic). Chapter 2 names the range and states where this book's definition sits within it. Readers who hold stricter or looser definitions are told what the book does and does not cover relative to theirs.

**BDI's relevance to LLM-based agents.** BDI came from symbolic AI in the 1980s. Some argue it is the wrong frame for neural systems. Others argue it provides durable decomposition axes regardless of implementation substrate. I use BDI in Chapter 2 as *one* canonical structured-agent architecture among several. Its value here is decompositional, not prescriptive. You are not required to build BDI agents to use this book.

**Meta-reasoning's usefulness.** Chapter 8 presents meta-reasoning as a pattern with real but narrow applicability. Research on self-reflection shows improvements for some tasks and marginal-to-negative returns for others. The "when is it worth the cost" framing in that chapter is explicit, and it names the evidence that complicates the story rather than hiding it.

**RAG versus long-context.** Chapters 6 and 7 treat RAG as one grounding strategy among several, with long-context as a real alternative whose regime is expanding. The honest position is that the architectural trade-off is moving — fast enough that the specific recommendations in those chapters will be partially out of date within a year, and the framework I provide (four variables, measured honestly) will survive the churn better than any specific default.

**Hallucination's solvability.** This book's working position is that hallucination is mitigable but not eliminable — a persistent class of failure that architectural verification reduces but does not close. An opposing camp argues sufficient grounding plus verification effectively solves it. Chapter 10 and the Hallucination pattern case present both sides; I stake a claim, and I tell you where I could be wrong.

There are two further claims this book deliberately does *not* stake out positions on. **Framework wars.** LangGraph, AutoGen, CrewAI, PydanticAI, and the frameworks that will replace them — the book compares what each makes easy and what each makes hard, and it does not declare a winner. Declaring a winner would age the book in eighteen months; framing the comparison well is more durable. **Evaluation and benchmarks.** The agentic-systems field does not yet have agreed-upon benchmarks. This book says that plainly rather than pretending evaluation is a solved problem, which is itself a position that some will disagree with.

---

## What this book does not cover

A book's scope is defined as much by what it excludes as by what it includes. The honest list:

**Evaluation and measurement of agentic systems.** Treating this subject honestly requires more depth than a handbook chapter affords, and the field does not yet have stable benchmarks to teach from. I am deferring this to a companion volume — or, more likely, to another cohort.

**Human-in-the-loop design.** A recurring real-world concern; not focal in this edition's scaffolding. Chapter 11 touches on it lightly in the context of "when not to go agentic." It deserves its own treatment, and future cohorts may contribute it.

**Counter-cases — systems that chose not to go agentic, or that went agentic and regretted it.** Chapter 11 needs at least one such case to open honestly. The current cohort did not produce one I was willing to ship. I have marked it as an active recruitment target for future editions.

**Detailed model comparisons** — GPT-X vs. Claude vs. Gemini. Those numbers age in months; any book that leads with them is a book that will mislead its readers by the time it ships. The book references models where the reference is load-bearing and avoids model-to-model leaderboards entirely.

**Prompt engineering, LLM fundamentals, training and fine-tuning, multi-modal agents, ethics and governance, legal and regulatory frameworks, full code implementations.** Each has its own literature. Several are adjacent disciplines I assume you either have or can acquire. Where I delegate to a specific external source, I say so in the chapter.

The excluded topics cluster into what a second volume could honestly be: *agentic systems in context — evaluation, governance, human-in-the-loop design, multi-modal extensions, and the failure cases nobody wants to teach.* I have flagged this as a plausible next project. Whether I write it depends on what I learn from the reception of this one.

---

## How this book was made

The case layer in this book was produced by students in the Spring 2026 cohort of my agentic systems course. Each student's case is bylined, and each student holds copyright on their chapter. They earned the byline the hard way — by finding a real deployed system or a real documented phenomenon, reading the sources, building an architectural analysis, and passing an editorial gate that rejects more cases than it accepts.

The editorial gate matters. A case that documents a real system is still not publishable unless its sources are primary and verifiable, its design choices are specific and attributable, its pattern instantiation is clear, and its failure mode is named. An uneven case layer would undermine the differentiator this book is trying to build; the gate holds the floor.

I want to be clear about what this model is and is not. It is a **living handbook produced by a graduate cohort, curated and edited by me**. It is not crowdsourced in a loose sense — every chapter passed editorial review, and some submitted chapters did not ship. It is not single-authored in the conventional textbook sense — the case layer's intellectual contribution belongs to the students who wrote it, with credit. It sits somewhere between the Porter × HBS-cases model, the SRE Book × SRE Workbook model, and the conference-proceedings model, and it does not have a clean published precedent. I am aware that "cohort-produced Kindle handbook" will strike some readers as structurally novel. It is. Whether the novelty is a feature or a liability is something the next three or four editions will decide.

The next edition — Fall 2026 — will contain an updated theory spine (field drift only; the frames hold) and a new cohort's cases. The current cohort's cases remain in this Spring 2026 edition as a snapshot. Readers who want a specific case can buy the specific edition it shipped in. This is a deliberate choice; the alternative (cumulative editions) would break the snapshot model and force unceasing re-editing of cases written by students who have since moved on. I would rather have a clean record of what each cohort contributed than a perpetually-churning master volume.

---

## How to read this book

There is no single right way. A few patterns that may help:

If you are **evaluating whether your problem calls for an agentic architecture**, read Chapter 1 (the problem agentic systems solve) and Chapter 9 (trade-offs and design decisions) and Chapter 11 (when not to go agentic). Then read two or three system cases in domains close to yours. That's roughly a hundred pages and should produce a defensible answer.

If you are **designing an agentic system and need the pattern library**, read the theory spine sequentially — Chapters 1 through 11 — and read the case paired with each pattern chapter. The spine installs the vocabulary; the cases show it applied.

If you are **responding to a specific failure in your own system**, start with the pattern cases. Hallucination, context collapse, cascade failure, attack surface, cost blowout — each is written to be readable standalone, and each points you back to the theory chapter that frames the phenomenon.

If you are **a faculty member considering this book for a course**, an instructor supplement (suggested syllabus, discussion questions, assessment prompts) is planned for the Fall 2026 edition. The Spring 2026 edition ships without it; I apologize for the inconvenience, and I will prioritize it for the next cycle.

One practical note about citation. If you cite this book in academic work, please cite the specific edition. The book's structure is designed so that "Design of Agentic Systems with Case Studies, Spring 2026 edition" is a stable artifact; "Design of Agentic Systems with Case Studies" without an edition is ambiguous, because the case layer differs between editions. The case chapters carry individual student bylines and can be cited directly. Citation guidance is at the back of the book.

---

## Acknowledgments

The student contributors whose cases appear in this edition — Aravind Balaji, Madhumitha Nandhikatti, Vatsal Sandeep Naik, Junyi Zhang, Rahul Manohar, and the students whose bylines are being reconciled at press time — did the hardest and most valuable work in this book. Their cases are the reason the book exists in its current form. Any weaknesses in their chapters are mine as editor; the strengths are theirs as authors.

The students whose drafts informed sidebar content in the theory spine — especially the material absorbed into Chapters 2 and 5 — are credited at the point of absorption. A book that uses student work should acknowledge the source, even when the material is integrated rather than standalone.

Northeastern University provided the institutional context in which cohort-produced publishing of this shape is possible. The course that generated this book is taught annually; the next cohort will produce the Fall 2026 edition.

My first readers — colleagues who read early drafts of the theory chapters and told me honestly where the argument was thin — saved the book from its worst instincts. I have not named them here because some asked not to be named, and I would rather keep the whole list private than partial.

Any remaining errors are mine. If you find one, I want to hear about it — there is contact information on the book's website, and an errata page is maintained between editions.

---

*Nik Bear Brown*
*Spring 2026*
*Boston, Massachusetts*
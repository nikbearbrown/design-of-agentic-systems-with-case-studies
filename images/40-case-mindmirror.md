# Image brief — Ch 40 Case: MindMirror

**Filename:** `images/40-case-mindmirror.jpg`
**Aspect:** 16:9 hero, Kindle-readable.

**Subject:** A two-lane visualization. Foreground lane: user submits entry → HTTP 200 returns in <200ms with placeholder metadata. Background lane (offset, dimmer): the same entry going through an LLM enrichment call that takes ~1,800ms and re-upserts to Pinecone with rich metadata (emotions, themes, intensity, mood). Above both lanes, a small clock callout: "user-facing latency 200ms; enrichment latency 2s; user never waits."

**Mood:** Reflective, calm, journal-warm. Schematic but human.

**Negative space:** Top for chapter title; bottom for the "two-stage write-then-enrich pipeline" caption.

**Notes:** The teaching image is *the slow LLM lane runs after the user has moved on.* Make the user-facing-fast / background-slow split the most prominent design choice. Avoid generic notebook / journal cliches; lean into the architectural pattern.

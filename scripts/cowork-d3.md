Scan the chapters and look for possible d3 graphs and SVG graphics

## STEP 1 — VISUAL SUGGESTIONS

Read the full chapter. At each location where a data visualization —
an infographic or chart — would genuinely serve comprehension or
retention, insert an HTML comment on its own line:

<!-- → [TYPE: description of what it shows and why it belongs here] -->

Types: `INFOGRAPHIC`, `CHART`

`INFOGRAPHIC` — a structured visual comparison, flow, or taxonomy
that is better understood as a diagram than as prose or a table.

`CHART` — a quantitative or relational graphic: line, bar, scatter,
network, timeline, or similar — anything where data shape matters.

The description must name the specific content, not the generic category.

Not: `INFOGRAPHIC: overview of the pipeline`
But: `INFOGRAPHIC: three-stage pipeline — ingest → transform → emit —
with data shape and failure modes at each stage labeled`

Not: `CHART: graph of results`
But: `CHART: line chart showing latency vs. concurrency for three queue
depths — reader should see the knee of the curve`

Only suggest visuals that would be rendered as SVG or D3 — skip anything
that would be a static photograph, screenshot, or plain table.

Place comments inline where the visual belongs — immediately before or
after the paragraph the visual would illustrate. Do not cluster them
at the end.

These comments are invisible when the markdown renders. They are a
working layer for the author, not reader-facing.
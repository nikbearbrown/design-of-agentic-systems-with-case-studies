#!/bin/bash
set -e

BOOK_SLUG="design-of-agentic-systems-with-case-studies"
METADATA="metadata.yaml"
OUTPUT_DIR="output"

mkdir -p "$OUTPUT_DIR"

# Compile chapters in filename order
cat $METADATA chapters/*.md > "$OUTPUT_DIR/combined.md"

# EPUB (primary — upload this to KDP)
pandoc "$OUTPUT_DIR/combined.md" \
  --from markdown \
  --to epub3 \
  --epub-cover-image=cover.jpg \
  --css=styles/kindle.css \
  --toc --toc-depth=2 \
  --output="$OUTPUT_DIR/$BOOK_SLUG.epub"

# HTML (proofing)
pandoc "$OUTPUT_DIR/combined.md" \
  --from markdown \
  --to html5 \
  --standalone \
  --css=styles/kindle.css \
  --toc \
  --output="$OUTPUT_DIR/$BOOK_SLUG.html"

echo "Built: $OUTPUT_DIR/$BOOK_SLUG.epub"
echo "Built: $OUTPUT_DIR/$BOOK_SLUG.html"

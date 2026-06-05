#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BOOK_SLUG="$(basename "$SCRIPT_DIR")"
METADATA="metadata.yaml"
OUTPUT_DIR="output"
mkdir -p "$OUTPUT_DIR"

if ! command -v pandoc &> /dev/null; then
  echo "ERROR: pandoc is required to build this book."
  exit 1
fi

shopt -s nullglob
CHAPTERS=(chapters/*.md)
if [ ${#CHAPTERS[@]} -eq 0 ]; then
  echo "ERROR: No markdown chapters found in chapters/."
  exit 1
fi

COMMON_ARGS=("${CHAPTERS[@]}" --resource-path=".:chapters" --from markdown)
if [ -f "$METADATA" ]; then
  COMMON_ARGS+=(--metadata-file="$METADATA")
else
  echo "WARNING: metadata.yaml not found; building without metadata file."
fi

CSS_ARGS=()
if [ -f "styles/kindle.css" ]; then
  CSS_ARGS+=(--css=styles/kindle.css)
fi
if [ -f "styles/kindle-book.css" ]; then
  CSS_ARGS+=(--css=styles/kindle-book.css)
fi
if [ ${#CSS_ARGS[@]} -eq 0 ]; then
  echo "WARNING: No Kindle CSS files found in styles/; building without CSS."
fi

COVER_ARGS=()
if [ -f "cover.jpg" ]; then
  COVER_ARGS+=(--epub-cover-image=cover.jpg)
else
  echo "WARNING: cover.jpg not found; EPUB will be built without a cover image."
fi

# EPUB (primary — upload this to KDP)
pandoc "${COMMON_ARGS[@]}" \
  --to epub3 \
  "${COVER_ARGS[@]}" \
  "${CSS_ARGS[@]}" \
  --toc --toc-depth=2 \
  --output="$OUTPUT_DIR/$BOOK_SLUG.epub"

# HTML (proofing — mirrors EPUB cascade where CSS is available)
pandoc "${COMMON_ARGS[@]}" \
  --to html5 \
  --standalone \
  "${CSS_ARGS[@]}" \
  --toc \
  --output="$OUTPUT_DIR/$BOOK_SLUG.html"

# PDF (LinkedIn / sharing — requires either weasyprint or xelatex)
if command -v weasyprint &> /dev/null; then
  pandoc "${COMMON_ARGS[@]}" \
    --to html5 \
    --standalone \
    --embed-resources \
    "${CSS_ARGS[@]}" \
    --toc \
    --output="$OUTPUT_DIR/$BOOK_SLUG-pdf-intermediate.html"
  weasyprint \
    "$OUTPUT_DIR/$BOOK_SLUG-pdf-intermediate.html" \
    "$OUTPUT_DIR/$BOOK_SLUG.pdf"
  rm "$OUTPUT_DIR/$BOOK_SLUG-pdf-intermediate.html"
  echo "Built (weasyprint): $OUTPUT_DIR/$BOOK_SLUG.pdf"
elif command -v xelatex &> /dev/null; then
  pandoc "${COMMON_ARGS[@]}" \
    --pdf-engine=xelatex \
    --variable mainfont="Georgia" \
    --variable fontsize=11pt \
    --variable geometry="margin=1.25in" \
    --variable linestretch=1.4 \
    --toc --toc-depth=2 \
    --output="$OUTPUT_DIR/$BOOK_SLUG.pdf"
  echo "Built (xelatex): $OUTPUT_DIR/$BOOK_SLUG.pdf"
else
  echo "WARNING: No PDF engine found. Install weasyprint (brew install weasyprint) or xelatex (texlive)."
  echo "Skipping PDF build."
fi

echo "Built: $OUTPUT_DIR/$BOOK_SLUG.epub"
echo "Built: $OUTPUT_DIR/$BOOK_SLUG.html"

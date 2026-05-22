#!/bin/bash
# Overnight blitz — adds dive sites one by one using Claude Code (Max plan).
# Run with: bash scripts/blitz-local.sh
# Or in background: nohup bash scripts/blitz-local.sh > logs/blitz.log 2>&1 &

set -e
cd "$(dirname "$0")/.."

mkdir -p logs

MAX=${MAX_SITES:-500}
DELAY=${DELAY_SECONDS:-30}   # pause between iterations (be nice to the API)
CONSECUTIVE_EXHAUSTED=0
ADDED=0
START=$(date +%s)

echo "=== Blitz started at $(date) | max=$MAX delay=${DELAY}s ==="

for i in $(seq 1 $MAX); do
  echo ""
  echo "--- Iteration $i | added=$ADDED | $(date) ---"

  # Pull latest so we don't add duplicates from parallel sources
  git pull --rebase --quiet 2>/dev/null || true

  # Run one discovery iteration via Claude Code (uses Max plan, no API key needed)
  OUTPUT=$(claude --print \
    --allowedTools "Bash,Read,Write,WebFetch,WebSearch" \
    --max-turns 30 \
    "$(cat scripts/discover-prompt.md)" 2>&1) || true

  echo "$OUTPUT" | tail -20  # show last 20 lines of output

  if echo "$OUTPUT" | grep -q "^DONE:"; then
    SITE=$(echo "$OUTPUT" | grep "^DONE:" | sed 's/^DONE: //')
    echo "✓ Added: $SITE"
    ADDED=$((ADDED + 1))
    CONSECUTIVE_EXHAUSTED=0
  elif echo "$OUTPUT" | grep -q "^EXHAUSTED"; then
    echo "→ Exhausted — no more sites to add"
    CONSECUTIVE_EXHAUSTED=$((CONSECUTIVE_EXHAUSTED + 1))
    if [ $CONSECUTIVE_EXHAUSTED -ge 3 ]; then
      echo "=== 3 consecutive EXHAUSTED signals — stopping ==="
      break
    fi
  else
    echo "→ No clear result, continuing..."
    CONSECUTIVE_EXHAUSTED=0
  fi

  # Log progress
  TOTAL=$(node -e "console.log(require('./src/data/sites.json').length)" 2>/dev/null || echo "?")
  echo "Total sites in DB: $TOTAL"
  echo "$(date) | iter=$i added=$ADDED total=$TOTAL" >> logs/blitz-progress.log

  sleep $DELAY
done

END=$(date +%s)
ELAPSED=$(( (END - START) / 60 ))
echo ""
echo "=== Blitz complete: added $ADDED sites in ${ELAPSED}m ==="

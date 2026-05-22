#!/bin/bash
# Single-region blitz worker. Spawned by blitz-parallel.sh.
# Usage: bash scripts/blitz-worker.sh <region-label> "<region-focus-description>"
#
# Example: bash scripts/blitz-worker.sh indo-pacific "Indonesia, Philippines, Malaysia, Thailand, Vietnam, Papua New Guinea, Solomon Islands, Fiji, Vanuatu, Micronesia, Polynesia, Australia, New Zealand, Japan, Korea, China, Hawaii"

set -e
cd "$(dirname "$0")/.."

LABEL="${1:?region label required}"
FOCUS="${2:?region focus description required}"

mkdir -p logs tmp

MAX=${MAX_SITES:-500}
DELAY=${DELAY_SECONDS:-45}
CONSECUTIVE_EXHAUSTED=0
ADDED=0
START=$(date +%s)

echo "=== Worker [$LABEL] started at $(date) | focus: $FOCUS ==="

# Build region-augmented prompt by prepending a focus clause.
PROMPT_FILE="tmp/discover-prompt-$LABEL.md"
{
  echo "## Region focus (worker: $LABEL)"
  echo ""
  echo "You MUST pick a missing dive site from one of these regions/countries:"
  echo "$FOCUS"
  echo ""
  echo "If every famous site in this region is already covered, print EXHAUSTED. Do not pick from outside this region."
  echo ""
  echo "---"
  echo ""
  cat scripts/discover-prompt.md
} > "$PROMPT_FILE"

for i in $(seq 1 $MAX); do
  echo ""
  echo "--- [$LABEL] iter $i | added=$ADDED | $(date) ---"

  # Pull latest before each iteration so we see other workers' commits
  git pull --rebase --autostash --quiet 2>/dev/null || git rebase --abort 2>/dev/null || true

  OUTPUT=$(claude --print \
    --allowedTools "Bash,Read,Write,WebFetch,WebSearch" \
    --max-turns 30 \
    "$(cat $PROMPT_FILE)" 2>&1) || true

  echo "$OUTPUT" | tail -15

  if echo "$OUTPUT" | grep -qi "session limit\|usage limit\|rate limit"; then
    echo "[$LABEL] quota/limit hit — stopping instead of logging fake progress."
    echo "$(date) | [$LABEL] stopped=quota-limit iter=$i added=$ADDED total=$(node -e "console.log(require('./src/data/sites.json').length)" 2>/dev/null || echo "?")" >> logs/blitz-progress.log
    break
  elif echo "$OUTPUT" | grep -q "^DONE:"; then
    SITE=$(echo "$OUTPUT" | grep "^DONE:" | sed 's/^DONE: //')
    echo "[$LABEL] ✓ Added: $SITE"
    ADDED=$((ADDED + 1))
    CONSECUTIVE_EXHAUSTED=0
  elif echo "$OUTPUT" | grep -q "^EXHAUSTED"; then
    echo "[$LABEL] → Exhausted"
    CONSECUTIVE_EXHAUSTED=$((CONSECUTIVE_EXHAUSTED + 1))
    if [ $CONSECUTIVE_EXHAUSTED -ge 3 ]; then
      echo "=== [$LABEL] 3 consecutive EXHAUSTED — stopping ==="
      break
    fi
  else
    echo "[$LABEL] → No clear result, continuing..."
    CONSECUTIVE_EXHAUSTED=0
  fi

  TOTAL=$(node -e "console.log(require('./src/data/sites.json').length)" 2>/dev/null || echo "?")
  echo "$(date) | [$LABEL] iter=$i added=$ADDED total=$TOTAL" >> logs/blitz-progress.log

  sleep $DELAY
done

END=$(date +%s)
ELAPSED=$(( (END - START) / 60 ))
echo ""
echo "=== Worker [$LABEL] complete: added $ADDED sites in ${ELAPSED}m ==="

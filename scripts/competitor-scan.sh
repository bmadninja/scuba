#!/bin/bash
# Run one competitor-coverage scan using Max plan (claude --print).
# Writes src/data/coverage-gaps.json which the discovery blitz then prioritizes.
#
# Usage: bash scripts/competitor-scan.sh
# Cron suggestion: weekly

set -e
cd "$(dirname "$0")/.."
mkdir -p logs

TS=$(date +%Y%m%d-%H%M%S)
LOG="logs/competitor-scan-$TS.log"

echo "=== Competitor scan started at $(date) ===" | tee -a "$LOG"

git pull --rebase --autostash --quiet 2>/dev/null || git rebase --abort 2>/dev/null || true

OUTPUT=$(claude --print \
  --allowedTools "Bash,Read,Write,WebFetch,WebSearch" \
  --max-turns 60 \
  "$(cat scripts/competitor-scan-prompt.md)" 2>&1) || true

echo "$OUTPUT" | tee -a "$LOG"

if echo "$OUTPUT" | grep -q "^GAPS:"; then
  N=$(echo "$OUTPUT" | grep "^GAPS:" | sed 's/.*GAPS: \([0-9]*\).*/\1/')
  echo "✓ Wrote coverage-gaps.json with $N sites" | tee -a "$LOG"
  if [ -f src/data/coverage-gaps.json ]; then
    SIZE=$(wc -c < src/data/coverage-gaps.json)
    echo "  File size: $SIZE bytes" | tee -a "$LOG"
  fi
else
  echo "✗ Scan did not emit GAPS: signal — see $LOG" | tee -a "$LOG"
  exit 1
fi

echo "=== Competitor scan complete at $(date) ===" | tee -a "$LOG"

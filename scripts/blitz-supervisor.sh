#!/bin/bash
# Keeps blitz-parallel.sh alive. Restarts after each batch ends (workers stop
# on EXHAUSTED-streak or no-result-streak — supervisor waits, then relaunches
# so new prompts/sites can be discovered later).
#
# Usage:
#   nohup bash scripts/blitz-supervisor.sh > logs/blitz-supervisor.log 2>&1 &
#   echo $! > tmp/blitz-supervisor.pid
#
# Stop:
#   kill $(cat tmp/blitz-supervisor.pid)

set -u
cd "$(dirname "$0")/.."
mkdir -p logs tmp

RESTART_DELAY=${RESTART_DELAY:-1800}  # 30 min between batches

while true; do
  echo "=== [supervisor] launching blitz-parallel at $(date) ==="
  bash scripts/blitz-parallel.sh || echo "[supervisor] batch exited with status $?"
  echo "=== [supervisor] batch finished at $(date); sleeping ${RESTART_DELAY}s ==="
  sleep "$RESTART_DELAY"
done

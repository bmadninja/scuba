#!/bin/bash
# Watchdog: ensures the blitz supervisor is running. Relaunches if dead.
# Intended for cron (every 5 min):
#   */5 * * * * cd /Users/josietyleung/github/scuba && bash scripts/blitz-watchdog.sh >> logs/blitz-watchdog.log 2>&1

set -u
cd "$(dirname "$0")/.."
mkdir -p tmp logs

PID_FILE=tmp/blitz-supervisor.pid
TS=$(date '+%Y-%m-%d %H:%M:%S')

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    # Supervisor alive — confirm it's actually our script (PID reuse guard)
    if ps -p "$PID" -o command= | grep -q blitz-supervisor; then
      echo "$TS | ok | supervisor PID=$PID alive"
      exit 0
    fi
    echo "$TS | warn | PID=$PID alive but not blitz-supervisor; relaunching"
  else
    echo "$TS | down | stale PID=$PID; relaunching"
  fi
else
  echo "$TS | down | no pid file; launching"
fi

# Kill any orphan workers before relaunching to avoid duplicate workers
pkill -f blitz-worker.sh 2>/dev/null || true
pkill -f blitz-parallel.sh 2>/dev/null || true

nohup bash scripts/blitz-supervisor.sh > logs/blitz-supervisor.log 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "$TS | started | supervisor PID=$NEW_PID"

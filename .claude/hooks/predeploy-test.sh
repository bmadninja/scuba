#!/usr/bin/env bash
# PreToolUse(Bash) gate for scubaseason.fun.
#
# When a Bash command is a production Vercel deploy ("push to prod" =
# `vercel deploy --prod`), run the Playwright suite first. If any test fails,
# deny the deploy so broken code never ships. Any other command passes straight
# through untouched.
set -uo pipefail

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Detect a production deploy: the command mentions `vercel` and `--prod`.
# Catches `vercel deploy --prod`, `vercel --prod`, and compound forms like
# `cd … && vercel deploy --prod`.
if ! { printf '%s' "$cmd" | grep -q 'vercel' && printf '%s' "$cmd" | grep -q -- '--prod'; }; then
  exit 0   # not a prod deploy — allow without doing anything
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}" || exit 0
log="/tmp/scuba-predeploy-test.log"

if npm test >"$log" 2>&1; then
  exit 0   # tests green — allow the deploy
fi

# Tests failed — block the deploy.
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Deploy blocked: the Playwright test suite (npm test) failed, so nothing was shipped. Full output: %s"}}\n' "$log"
exit 0

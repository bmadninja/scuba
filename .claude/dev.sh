#!/usr/bin/env bash
# Pin Node 24 so Next.js 16 works regardless of the shell's default node.
# Required because npm shells out to whatever `node` is on PATH.
set -e
export PATH="/Users/josietyleung/.nvm/versions/node/v24.11.0/bin:$PATH"
exec npm run dev

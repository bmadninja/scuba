# PM Log — scubaseason.fun

Running log of product insights, decisions, and open questions. Newest at top.

---

## 2026-05-29 1:03pm — Prioritization (bootstrap run)

**Context:** First product-operator run. `docs/product-charter.md`, `docs/pm-log.md`,
and `docs/grants-charter.md` did not exist. Bootstrapped the charter and this log from
the real repo state (STORIES.md, STATE.md, BMAD v2 backlog, data-strategy memory) and
from measured data, rather than from the assumed-present files.

**Headline finding — breadth has outrun depth.** Site count grew from 179 (v2 backlog,
2026-05-22) to **380** today, but sighting evidence did not keep pace:

- 244/380 sites have ≥1 sighting record.
- **136 sites (36%) have ZERO sighting evidence.**
- Reef health: 114 records; ~5 locations still missing.

A species chaser — our core moat segment — can land on a famous site and see no
evidence of what they'd see there. That is the single worst trust failure on the site,
and it's getting worse with every new site the Colab blitz adds.

**Prioritization call:**
- **Accelerate:** sighting-evidence backfill (Phase 7). Only item that scores on both
  the moat (species-chaser depth) and grant credibility (honest evidence).
- **Cut / defer:** new site discovery (Colab Gemini Blitz). Pause until the
  zero-evidence count is near zero. Per the PM principle "the moat is depth, not
  breadth" — adding site #381 makes the trust gap worse.

Full ranked list now lives in `docs/product-charter.md`.

**Surprises:**
- `.planning/STATE.md` is stale (claims M2 Phase 6 at 0%; reef-health is actually ~96%
  backfilled). The planning docs and reality have diverged. Charter is now the truth.
- `docs/grants-charter.md` is absent despite being a required read for this task. No
  live grant deadline could be confirmed. Flagged in charter open decisions.

**Open question carried forward:** If the homepage promises species-chaser-grade
evidence but 36% of sites can't back it, is the honest near-term move to (a) backfill
fast, or (b) visibly mark which sites have confirmed evidence so the promise stays true
even before backfill completes? Leaning toward doing both — a confidence indicator on
site cards is cheap and keeps the site honest during backfill.

**Data I'd want but don't have:** search analytics (which sites/species users actually
look for — would tell me which of the 136 zero-evidence sites to backfill first), and
whether any are high-traffic.

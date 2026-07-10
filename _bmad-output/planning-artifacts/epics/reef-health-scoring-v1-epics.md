# Epics & Stories — Reef-health scoring v1 (state-only two-layer model)

**Source brief:** `product-brief-reef-health-scoring-2026-07-10.md` (decisions locked 2026-07-10)
**Coordination:** `.claude/reef-health-pillars-coordination.md` (single PR, dual reviewer)
**Scope:** R1–R6 of the brief. R7–R10 are v2 (data bulk-up), out of scope.
**Delivery constraint:** one coordinated PR; the `reef-state.ts` change is reviewed jointly by the
biomass and fishing-pressure pillar sessions before merge.

The label stays the four states: **Improving / Stable / Declining / Not surveyed.** The verdict is
built from the two **state** pillars (coral cover + fish biomass), combined **lower-of-two**. Thermal
stress and fishing are **pressures**: they gate the label and tell the trajectory, never summed in.

---

## Epic RH-1 — Name the model honestly (method panel)

Make the public method surface describe the real four-pillar, two-layer model, every threshold, and
the combine rule. Wording comes verbatim from `reef-health-method-panel-copy-2026-07-10.md`.

- **RH-1.1** Method page (`/data#reefstate`) intro rewritten to the two-state / two-pressure model:
  "two things about the reef, two forces acting on it." State which two build the label and which two
  gate it.
- **RH-1.2** Add the **fourth pillar (fish life / biomass)** to the signals grid and the per-label
  rules. Coral cover and fish biomass are marked *(builds the label)*; heat and fishing *(a pressure,
  gates the label)*.
- **RH-1.3** State **every threshold explicitly**: coral cover bins (≥40=5 / 20–39=4–3 / 10–19=2 /
  <10=1), fish biomass standing/B0 bins (≥0.75=5 / 0.50–0.74=4 / 0.25–0.49=3–2 / <0.25=1), the
  heat alert ranks, and the fishing bands.
- **RH-1.4** State the **combine rule** ("turn the two reef signals into 1–5 each, then take the
  lower") and the asymmetries (a pressure alone never causes Declining except an active bleaching
  alert; heat can force Declining; fishing gates Improving).
- **RH-1.5** Update the location-page reef-state info modal (`atlas-info-popup.tsx` `state` entry) so
  its one-liner names fish life as a label input, not just coral.
- **RH-1.6** Update `/learn` ("Read your reef") so the four diver-readable signals match the model
  (coral, fish life, heat, fishing).

## Epic RH-2 — Confidence, made visible

Every label carries an honest confidence read; every pillar carries a tier.

- **RH-2.1** `reef-confidence.ts`: per-pillar confidence **tier** — A measured trend (≥3 pts, ≥4 yr) /
  B before-and-after (2 pts) / C single reading / D not on file.
- **RH-2.2** Site **confidence badge** = the **weakest tier among the pillars that actually set the
  label** (the state pillars present, plus an active heat alert when it forces the verdict).
- **RH-2.3** Render the badge on the location page reef-state block, with the four-step plain-language
  explanation from the copy doc.

## Epic RH-3 — Universal fishing pressure (wire in reef gravity)

Give **every** site a fishing-pressure level, including artisanal reefs GFW cannot see, single-sourced
from `reef-gravity.ts`.

- **RH-3.1** In `getLocationFishing`, slot the reef-gravity band **beneath** measured GFW effort and
  **above** the editorial estimate: GFW where it has a reading → else gravity band → else editorial.
  Protection still reconciles on top.
- **RH-3.2** Surface `pressureLevel` + `pressureSource` (`gfw | gravity | editorial | none`) on the
  location fishing read so the gap map and UI can cite provenance.
- **RH-3.3** Keep gravity single-sourced: both the biomass B0 estimate and the fishing read read the
  same `getReefGravityForLocation` value. No second gravity number.

## Epic RH-4 — Fish biomass as a co-equal state pillar

Promote fish biomass to a label-setting state pillar on the 57 sites that have it; combine with coral
lower-of-two. Preserve every current asymmetry.

- **RH-4.1** `biomass-standing.ts`: `biomassStanding(locationId)` → observed biomass, estimated B0,
  standing fraction, 1–5 sub-score, tier, gravity band. Returns `null` when biomass or the B0 basis
  (gravity) is absent. Documents the **B0-from-gravity** assumption in code.
- **RH-4.2** `getReefState()` reads the biomass pillar and combines lower-of-two with coral: Declining
  if **either** state pillar is low (coral <25% — unchanged — or biomass sub ≤2) or heat alert rank
  ≥3; Improving only if **both** present state pillars are strong (coral ≥40% and biomass sub ≥4),
  heat ≤ watch, fishing permits improving, and nothing falling.
- **RH-4.3** A biomass reading now counts as a survey signal: a site with only biomass is no longer
  "Not surveyed."
- **RH-4.4** **No-biomass sites stay byte-identical to today.** Verified by a diff harness; the label
  distribution only moves on biomass sites.
- **RH-4.5** Biomass **trend stays display-only** in v1 (proximity-matched RLS trend is too noisy to
  gate the label); the label uses the biomass **level**. Documented assumption.

## Epic RH-5 — Torre Guaceto: computed where evidence allows, manual as fallback

- **RH-5.1** `biomassStanding()` is the computed recovery signal. Where a site has RLS biomass + a
  gravity basis, the computed state stands on its own.
- **RH-5.2** Keep the `manualReefState` override mechanism intact as the documented fallback. Torre
  Guaceto has no RLS series and no gravity cell, so `biomassStanding("torre-guaceto-italy") === null`
  and the sourced manual override (Improving) correctly remains. Documented in code + PR body.

## Epic RH-6 — Coverage / gap map (internal GTM asset)

- **RH-6.1** `reef-gap-map.ts` + `src/data/reef-gap-map.json` (built by
  `scripts/build-reef-gap-map.mjs`): one row per site × pillar × tier, plus the site badge.
- **RH-6.2** Query helpers, e.g. "locations missing a fish-biomass trend", "Blue Parks with no
  biomass tier", so GTM can generate a ready-to-send outreach list per priority org.
- **RH-6.3** No new public UI required beyond the confidence badge; the JSON + reader is the deliverable.

---

## Out of scope (v2 — needs data)
- RH-7 real measured/gravity-derived B0 (WCS-validated) · RH-8 multi-year coral trends ·
  RH-9 stored NOAA CRW time series · RH-10 MPAtlas assessment of the 89 unassessed MPAs.

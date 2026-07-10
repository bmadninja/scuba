# Product Brief — Reef Health Scoring (overall label)

**Author:** Mary (Business Analyst) · BMad
**Date:** 2026-07-10
**Upstream research:** [technical-overall-reef-health-scoring-research-2026-07-10.md](research/technical-overall-reef-health-scoring-research-2026-07-10.md)
**Status:** decisions locked with Josie 2026-07-10; ready to hand to a PRD / build session.

---

## 1. Problem

Every dive-site page needs one honest, instantly readable reef health label plus simple graphs, so any diver understands the state of the reef at a glance. Today the label (`getReefState`) is a **coral-condition-only** read. Three of the four data pillars we have invested in are underused: fish biomass is display only, reef gravity is built but not wired in, and the thermal series is not stored. At the same time, marine scientists have no transparent way to see how the label is computed and tell us where it is wrong, and we have no structured view of which reefs are missing which data, which is the exact asset we need for partnership outreach.

## 2. Goal

One reef health label per site that is **simple for divers, transparent for scientists, and gap-aware for go to market.** Same four states as today: **Improving / Stable / Declining / Not surveyed.**

## 3. Locked decisions (Josie, 2026-07-10)

1. **State-only model.** The label is built from the two *state* pillars (coral cover + fish biomass). Thermal stress and fishing are *pressures*: they gate the label and tell the trajectory story, they are never summed into the score.
2. **Lower-of-two combine.** Where both state pillars have data, the condition level is the **lower** of the two sub-scores. A reef is only as healthy as its weakest state pillar.
3. **Paper-park stays soft in v1.** Keep the existing blame-free "Busy despite protection" signal; do **not** publicly accuse a named MPA of failing enforcement. Reversible later.
4. **Treat Scuba Season as non-commercial.** Use and attribute AIMS, MPAtlas, WDPA, GCRMN, and the held-out series. Non-commercial licensing is not a blocker.

## 4. The model

```
STATE pillars  ─────────────►  CONDITION LEVEL ──┐
  Coral cover   (1–5 + trend)   (lower of two)   │
  Fish biomass  (1–5 + trend)                    ├──►  REEF HEALTH LABEL
                                                 │      Improving / Stable /
PRESSURE pillars ────────────►  GATES + STORY ───┘      Declining / Not surveyed
  Thermal stress (alert + DHW)                          + per-site confidence badge
  Fishing        (effort + gravity + MPA)
```

**Label logic (preserves today's asymmetries):**
- **Not surveyed** — no state pillar and no thermal reading on file.
- **Declining** — condition level ≤ 2, OR active bleaching alert (thermal rank ≥ 3), OR a measured downward trend in a state pillar.
- **Improving** — condition level ≥ 4, no active heat alert (rank ≤ 1), fishing permits improving (low/protected), and no state pillar falling.
- **Stable** — everything else.
- Pressures gate only; a pressure alone never causes Declining (except an active bleaching alert, which is measured damage in progress).

**State pillar sub-scores (1–5):** coral cover binned ≥40=5 / 20–39=4–3 / 10–19=2 / <10=1; fish biomass as standing/B0 ≥0.75=5 / 0.50–0.74=4 / 0.25–0.49=3–2 / <0.25=1, B0 estimated from reef gravity until a measured baseline exists.

**Confidence tier per pillar:** A measured trend (≥3 pts, ≥4 yr) / B before-after (2 pts) / C single point / D none. The site badge = the weakest tier among the pillars that set its label.

## 5. Requirements

### v1 (ship now — little or no new data)
- **R1** Name all four pillars in the method panel; state every threshold and the combine rule explicitly.
- **R2** Add a **per-site confidence badge** (weakest-tier) and a **per-pillar tier** in the method panel.
- **R3** Wire `reef-gravity.ts` into the fishing read so **every** site has a fishing-pressure level, including the artisanal reefs GFW cannot see.
- **R4** Promote **fish biomass to a co-equal state pillar** on the 57 sites that have it; combine lower-of-two with coral.
- **R5** Replace the hand-set Torre Guaceto override with a computed `biomassStanding()` rule where evidence supports it (keep manual override capability as a fallback).
- **R6** Build the **coverage / gap map** as internal data: site × pillar × tier, queryable (e.g. "Blue Parks with no fish-biomass trend").

### v2 (needs data bulk-up)
- **R7** Real **B0 benchmark** (gravity-derived, WCS-validated) → full standing/B0 biomass scoring.
- **R8** Multi-year **coral series** (≥3 pts) from GCRMN / MERMAID / AIMS / Reef Check → Tier-A coral trends.
- **R9** Store the **NOAA CRW time series + MMM baseline** so the "warm right now vs usual" readout is truly live, not scaffold numbers.
- **R10** MPAtlas assessment of the **89 unassessed MPAs** (via MCI).

## 6. The gap map (a first-class feature, not a by-product)

The confidence-tier data doubles as the outreach engine. Deliverables:
- **Diver-facing:** the site badge honestly shows "3 of 4 pillars on file, fish biomass missing."
- **Internal / GTM:** a filterable view of every site's per-pillar tier, so we can generate the exact outreach sentence — "here are the reefs missing X, [org] holds the data to fill it." Priority targets, ranked: **GCRMN/ICRI → REEF → MERMAID → MCI → AIMS** (full list in the research doc §3).

## 7. Honesty guardrails (must not break)
- Reef state describes reef condition; pressures gate but do not average in.
- Species-logged stays effort-biased context, never scored, never a trend.
- A 2-point series is a before/after, never a trend line.
- Satellites cannot see coral cover; AIS is blind to artisanal fishing — say so in the panel.
- "Not surveyed" is honest, not a failure state.
- User-facing copy: labels Improving / Stable / Declining / Not surveyed; no hyphens; live data, no visible timestamps on the card face.

## 8. Success signals
- Every site renders a label with an honest confidence badge (no silent gaps).
- Fish biomass measurably influences the label on the 57 covered sites.
- The gap map produces at least one ready-to-send outreach list per priority org.
- A marine scientist can read the method panel end to end and leave a specific correction.

## 9. Open items / dependencies
- The joint `reef-state.ts` rewrite must be a **single PR** reviewed by both the biomass and fishing-pressure pillar sessions (per `.claude/reef-health-pillars-coordination.md`).
- Paper-park public surfacing: deferred, revisit after MCI MOU.
- Non-commercial license conversations (esp. MCI) unblock the held-out AIMS/GCRMN series but are not blockers for v1.

## 10. Sequencing
1. **Now:** R1, R2, R3, R6 (method panel naming + confidence/gap map + gravity wiring — highest GTM return, least new data).
2. **Next:** R4, R5, R9 (biomass into the label; live temperature series).
3. **Then:** R7, R8, R10 (B0, multi-year coral, MPA assessment — gated on outreach).

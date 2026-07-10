# Technical Research — Overall Reef Health Scoring

**Author:** Mary (Business Analyst) · BMad technical-research workflow
**Date:** 2026-07-10
**Topic:** How to calculate one overall "reef health" label per dive site from the four data pillars, in a way that is (a) instantly readable by any diver, (b) scientifically defensible enough for marine scientists to review and fine-tune, and (c) able to expose data gaps that drive partnership outreach.
**Inputs intaken:** four pillar research sessions (coral cover, fish biomass, fishing pressure, water temperature), the live scoring code (`src/lib/data/reef-state.ts`, `effective-fishing.ts`, `reef-gravity.ts`), the reef-health spec (`.claude/reef-health-spec.md`), and the pillars coordination contract (`.claude/reef-health-pillars-coordination.md`).

---

## 1. Executive summary — the recommendation in one paragraph

Build reef health as a **two layer model**, not a single blended average. **Layer 1 (the label)** is a *condition* read from the two pillars that describe the reef itself: **coral cover** and **fish biomass**. **Layer 2 (the overlay)** is the two *pressure* pillars that act on the reef: **thermal stress** and **fishing pressure**. Pressures explain the trajectory and can gate the label (an active bleaching alert forces Declining because it is measured damage in progress; heavy fishing caps the upside), but a pressure alone never declares a reef dead. This mirrors the published **Mesoamerican Reef Health Index** (four state indicators, fish biomass among them) and preserves the honesty rule already in the code. Every site also carries a **confidence tier per pillar** (measured trend / before-after / single point / none). That confidence layer is the same machinery that produces the **gap map** for go to market: it tells you exactly which reef is missing which pillar, and which organisation holds the data to fill it.

**Why not just average four numbers into one score:** two of the four pillars are not reef *condition*, they are *forces*. Averaging heat and fishing into the health number would let a warming trend or some boat traffic drag a genuinely intact reef to "Declining", which breaks the honesty guardrail the product already enforces, and it double counts fishing (fishing pressure and the fish biomass it depletes would both be in the sum).

---

## 2. Master data inventory — what we have, how we use it, the gap, the ask

One row per dataset. "Tier" = the best confidence we can offer today. "Coverage" is against the ~113–117 site corpus.

### Pillar A — Coral cover (STATE)

| Dataset | Provider | Metric | Coverage | License | Feed | How used today | Gap | Action item (org → unlock) |
|---|---|---|---|---|---|---|---|---|
| `reef-health.json` coral record | Curated (AIMS-LTMP, GBRMPA, NOAA, MERMAID per record) | `coralCoverPercent` + historical % | 117 records, but **116 of 117 are a 2-point before/after**; only GBR has a real multi-year series | mixed | snapshot | **The scoring driver.** Cover < 25% or falling sets Declining; ≥ 40% and not falling is required for Improving | Trend is noise-sensitive 2-point; whole basins (W Indian Ocean, Red Sea, S Asia, Coral Triangle) thin | **GCRMN/ICRI** (master key, node intros + `gcrmndb_benthos`); **MERMAID/WCS** (open per-site % cover); **AIMS LTMP** (dense GBR series); **AGRRA** (2,000+ Caribbean sites); **Reef Check** (17,700 citizen surveys) |
| `coral-cover-series.json` | MERMAID (0.5° proximity) | Benthic % multi-year series | 49 locations | CC BY 4.0 | chart only | Coral-cover-over-time chart; **deliberately NOT a score input** | Decoupled from the label; proximity match ≠ exact site | Wire into scoring once trend confidence is tiered |
| `coral-cover-regional.json` | GCRMN 2020 (Souter 2021) | Regional hard-coral trend | 10 world regions, ~1978–2019 | non-commercial, attribution | snapshot | Faint context backdrop line | Region, not site | context only |
| `coralwatch-queue.json` | CoralWatch submissions | Bleaching score (not cover) | 8 pending | CC BY 4.0 | queue | Bleaching overlay | Not a cover series; license needs confirming | Confirm CoralWatch license before commercial use |
| AIMS / GCRMN held-out series | AIMS LTMP / GCRMN | Verified % cover series | GBR / regional | CC-BY-**NC** | held out | **Blocked pending licensing** | Non-commercial vs MC5 Labs (for-profit) | AIMS LTMP download form; resolves the block |

Satellites cannot see % hard-coral cover — this pillar only comes from in-water surveys. That is the structural reason coral coverage is thin and why partnerships (not scraping) are the only way to bulk it up.

### Pillar B — Fish biomass (STATE)

| Dataset | Provider | Metric | Coverage | License | Feed | How used today | Gap | Action item (org → unlock) |
|---|---|---|---|---|---|---|---|---|
| `fish-biomass-series.json` | Reef Life Survey (RLS) M1, via IMOS AODN | Standing fish biomass kg/ha + richness + abundance | **57 locations** (all with ≥ 2 survey years → all have a trend); corpus spans 1996–2026 | CC BY 4.0 | snapshot (manual re-run, not scheduled) | **Display only. Does NOT set the label today.** | ~half the corpus has zero biomass data; sparse across tropical Indo-Pacific; **no B0 / expected-biomass benchmark exists** | **REEF** (data@reef.org, HIGH priority — raw per-survey abundance + partnership); re-run/expand RLS matching; derive expected B0 from reef gravity |
| Torre Guaceto manual override | Editorial, backed by published study | `manualReefState` | 1 site | n/a | manual | The one place biomass touches the verdict (hand-set) | Not computed; not scalable | Generalise via a real `biomassStanding()` reader |

Fish biomass is the scientifically cleanest "protection works" signal (coral is heat-driven; fish biomass responds to fishing and protection). It is the pillar most worth investing in, and it is currently doing the least work.

### Pillar C — Fishing pressure (PRESSURE)

| Dataset | Provider | Metric | Coverage | License | Feed | How used today | Gap | Action item (org → unlock) |
|---|---|---|---|---|---|---|---|---|
| `fishing-pressure.json` (GFW) | Global Fishing Watch (4Wings) | Apparent fishing hours/yr within 50 km, banded | ~111–113 sites; but records hold only a 2-point pair, not the full 2017→now series | free non-commercial (**no commercial terms published**) | **live** ingest (needs `GFW_API_TOKEN`) | **A GATE on Improving only.** Never triggers Declining | **AIS is blind to artisanal/small-scale fishing** (Paolo 2024: 72–76% of *industrial* vessels alone are untracked) — the honesty gap; pre-2017 artifact; 2-point series | **GFW partnerships** (confirm public-good / NGO use, fix license); re-ingest full series floored at 2017 |
| `reef-gravity.json` | Andrello 2022 / Cinner 2018 (open) | Universal per-site fishing-pressure level (market gravity), global percentile | **All reef pixels — universal**, incl. artisanal reefs GFW misses | CC BY 4.0 (commercial-safe) | snapshot | **Built but NOT wired into scoring** | Static (level, no trend) | **WCS Marine** (Emily Darling / Andrello team) — validate a per-site gravity index; closes the artisanal blind spot |
| MPAtlas / MPA Guide | Marine Conservation Institute | Protection level + implementation stage; paper-park flag | **20 of ~111 sites assessed; 89 unassessed** | free, **non-commercial** | snapshot | Modifier that can only strengthen the read; `paper-park` computed but **hidden in v1** | 89 sites unassessed; non-commercial license | **MCI** (existing MOU thread) — priority assessment of the 89 + commercial license |
| WDPA / Protected Planet | UNEP-WCMC | MPA polygons, STATUS_YR, IUCN cat | in `sources.json` | free, non-commercial default | snapshot | Per-site MPA status + establishment year | Non-commercial default | **UNEP-WCMC** — written permission to serve attributes commercially |
| Halpern cumulative impacts (planned) | NCEAS / OHI | Modeled fishing incl. artisanal layer, 2003–2013 | ~1 km grid | CC-BY/CC0 (verify) | snapshot | Optional historical trend layer | Not yet ingested | **NCEAS** — confirm CC license (mostly a checkbox) |

### Pillar D — Water temperature / thermal stress (PRESSURE)

| Dataset | Provider | Metric | Coverage | License | Feed | How used today | Gap | Action item (org → unlock) |
|---|---|---|---|---|---|---|---|---|
| NOAA Coral Reef Watch 5 km (`dhw_5km`) | NOAA (via PacIOOS ERDDAP) | Bleaching alert (0–4), DHW, SST anomaly | **117 of 117 — best coverage of any pillar** | public domain | **live** (single latest snapshot, overwritten each run) | **Condition gate:** alert rank ≥ 3 forces Declining; alert > watch blocks Improving | **No temperature time series is stored** (only latest day); no MMM/seasonal baseline stored, so the "how warm right now vs usual" modal is running on scaffold numbers; weak for temperate reefs | **AIMS** + **GCRMN/CORDIO** in-water loggers (at-depth truth); **Copernicus Marine** (temperate baselines) |

Temperature is the least access-constrained pillar and the best-covered. The work here is a build (store a series + MMM baseline), not an outreach.

---

## 3. Coverage scorecard — the gap map that powers GTM

Per pillar, today, against the ~113–117 site corpus:

| Pillar | Role | Sites with real data | Best confidence tier available | The gap in one line |
|---|---|---|---|---|
| Thermal stress | Pressure | **117 / 117** | live snapshot (no history) | Rich coverage, but no trend stored yet |
| Coral cover | State | 117 records, **only ~1 with a true multi-year trend** | before/after (2-point) | The headline gap: label rests on 2 points |
| Fishing pressure | Pressure | GFW ~113; **reef gravity universal**; MPAtlas 20 | 2-point GFW; universal gravity level | Artisanal blind spot; 89 MPAs unassessed |
| Fish biomass | State | **57 / ~117** | measured trend (≥ 2 yr) | ~half the corpus has no biomass at all; no B0 benchmark |

**The GTM asset.** Give every site a per-pillar tier (A measured trend / B before-after / C single point / D none). Then a site's card can honestly say "3 of 4 pillars on file, fish biomass missing", and an internal view can list, e.g., *"every Blue Park with no fish-biomass trend"* — which is exactly the sentence you take to MCI, REEF, or RLS: **"here is the hole, can we have your data to fill it."** The gap map is not a by-product; it is a deliverable in its own right.

**Priority outreach targets (consolidated across pillars), ranked by leverage:**

| Rank | Org | Ask | Fills | Notes |
|---|---|---|---|---|
| 1 | **GCRMN / ICRI** (fstaub@icriforum.org) | Node intros + `gcrmndb_benthos` data-sharing path | Coral cover — the only global site-level multi-decadal set | Master key; highest value |
| 2 | **REEF** (data@reef.org, Dr Pattengill-Semmens) | Raw per-survey fish abundance + partnership | Fish biomass + single-species recovery stories | Already flagged HIGH priority; Blue Parks/MCI pitch |
| 3 | **MERMAID / WCS** (datamermaid.org) | Per-site benthic % cover, global | Coral cover (open feed, low barrier) | Already partly ingested |
| 4 | **MCI** (existing MOU thread) | Assess the 89 unassessed MPAs + commercial license | Fishing/protection coverage + license | Warm relationship |
| 5 | **AIMS LTMP** | Download form for GBR % cover series + in-water loggers | Coral trend + temperature ground truth | Also clears the CC-BY-NC block |
| 6 | **Reef Check** (rcinfo@reefcheck.org) | 17,700 citizen surveys, custom agreement | Coral trend, dive-community aligned | |
| 7 | **GFW partnerships** | Confirm public-good use; fix commercial terms | Fishing license clarity | GEE mirror (CC-BY-SA) is a fallback |
| 8 | **WCS Marine** (Emily Darling) | Validate a per-site gravity index | Closes the artisanal fishing blind spot | No dataset to buy — collaboration only |

---

## 4. The recommended calculation

### 4.1 Structure

```
STATE pillars  ─────────────►  CONDITION LEVEL ──┐
  Coral cover   (1–5 + trend)                    │
  Fish biomass  (1–5 + trend)                    ├──►  REEF HEALTH LABEL
                                                 │      Improving / Stable /
PRESSURE pillars ────────────►  GATES + STORY ───┘      Declining / Not surveyed
  Thermal stress (alert + DHW)                          + confidence badge
  Fishing        (effort + gravity + MPA)
```

### 4.2 State pillar sub-scores (1–5, MAR-RHI-style bins)

**Coral cover** (matches the Reef Health Index convention; our current 40/25 cuts fit inside it):

| % hard-coral cover | Sub-score | Word |
|---|---|---|
| ≥ 40 | 5 | Very good |
| 20–39 | 4–3 | Good / Fair |
| 10–19 | 2 | Poor |
| < 10 | 1 | Critical |

**Fish biomass**, scored as a fraction of expected unfished biomass **B0** (MacNeil et al. 2015: unfished ≈ 1,000 kg/ha; 83% of fished reefs are depleted below the healthy band). B0 is estimated per site from reef gravity (the shared covariate) until a measured baseline exists:

| Standing / B0 | Sub-score | Word |
|---|---|---|
| ≥ 0.75 | 5 | Near-pristine |
| 0.50–0.74 | 4 | Healthy |
| 0.25–0.49 | 3–2 | Depleted |
| < 0.25 | 1 | Heavily depleted |

### 4.3 Combining into the label

1. **Condition level** = the two state sub-scores combined. Recommend **lower-of-the-two** (a reef is only as healthy as its weakest state pillar), or the mean if only softer separation is wanted. Where only one state pillar has data, use it alone and lower the confidence badge.
2. **Trend** per state pillar, tiered by data depth (§4.5).
3. **Label logic** (keeps the current asymmetries):
   - **Not surveyed** — no state pillar and no thermal reading on file.
   - **Declining** — condition level ≤ 2, OR an active bleaching alert (thermal rank ≥ 3), OR a clear measured downward trend in a state pillar. *(Measured damage, present or in progress.)*
   - **Improving** — condition level ≥ 4, no active heat alert (rank ≤ 1), fishing permits improving (low/protected), and no state pillar falling.
   - **Stable** — everything in between (intact but below baseline, or slipping, or capped by fishing).
4. **Pressure overlay** never sums into the score. It (a) gates as above, (b) writes the trajectory sentence ("recovering since the no-take zone", "under rising fishing pressure"), (c) supplies the reef-gravity expected-pressure level so *every* site has a fishing read even where GFW is blind.

### 4.4 What changes vs today

- Today the label is **coral-only** with heat and fishing as gates; fish biomass is display-only.
- The recommendation **promotes fish biomass to a co-equal state pillar** (57 sites gain a second independent condition signal, and the Torre Guaceto override becomes a computed rule, not a hand edit), and **wires in reef gravity** so fishing is scored on every site.
- It keeps heat and fishing as pressures/gates — no averaging-away of the honesty rule.

### 4.5 Confidence tiers (per pillar, per site) — same rule for coral and biomass

| Tier | Rule | What we may claim |
|---|---|---|
| A — Measured trend | ≥ 3 points spanning ≥ 4 yr (OLS slope, deadband 0.5 pp/yr) | A direction ("rising / falling") |
| B — Before-after | exactly 2 points (deadband ±2 pp) | "fallen / risen since" — not a trend line |
| C — Single point | 1 observation | Current level only, no direction |
| D — None | no data | Nothing — this is a **survey gap** |

The **site's confidence badge = the weakest tier among the pillars that set its label.** Honest for divers, and it is the exact field the gap map reads.

---

## 5. Labeling criteria table (v1 vs v2)

The "different criteria we use to label" you asked for, split by what ships now vs what needs a data bulk-up.

| Signal | v1 criterion (ship now) | v2 criterion (after data bulk-up) | Blocked on |
|---|---|---|---|
| Coral cover level | < 25% → Declining; ≥ 40% eligible for Improving | Full 1–5 bins (§4.2) | nothing (v1 already coded) |
| Coral trend | 2-point before/after, ±2 pp deadband | Tier-A OLS slope where ≥ 3 pts | multi-year coral series (GCRMN/MERMAID/AIMS/Reef Check) |
| Fish biomass | Display only; light influence where present (57 sites) | Co-equal state pillar, standing/B0 1–5 | **B0 benchmark** (derive from gravity, validate with WCS) + REEF/RLS coverage |
| Thermal stress | Alert rank ≥ 3 → Declining; > watch blocks Improving | + chronic-heat trend flag from a stored DHW series; MMM baseline | store the CRW time series + MMM (build, no outreach) |
| Fishing pressure | GFW band gates Improving; MPAtlas modifier; paper-park hidden | + reef-gravity expected level on every site; surface paper-park (editorial call) | wire `reef-gravity.ts`; Josie decision on paper-park |
| Confidence badge | per-site weakest-tier badge | same, plus per-pillar tier on the method panel | nothing — cheap, high GTM value |

---

## 6. The "How is this measured / learn more" panel (for scientist review)

The public card shows the one word + the simple graphs. The expandable "how is this measured" panel is where the scientific credibility lives and where marine scientists leave comments. Recommended structure:

1. **The model, plainly** — one diagram: two state pillars build the label, two pressures gate and explain it. State the combination rule and every threshold in §4 explicitly.
2. **Per-pillar detail cards** — for each of the four pillars, at *this* site: dataset + provider, method, the site's value, its **confidence tier**, caveats, and the citation. This is the table in §2 rendered per-site.
3. **The evidence base** — named citations so a scientist can check the reasoning:
   - Reef Health Index precedent: **Mesoamerican Reef Health Index** (Healthy Reefs Initiative) — four equally weighted state indicators.
   - Fish biomass baselines: **MacNeil et al. 2015** (B0 ≈ 1,000 kg/ha; recovery ~35 yr), **Edgar et al. 2014** (NEOLI — effective no-take reserves hold ~5× fish, 14× shark biomass; 59% were paper parks).
   - Fishing pressure model: **Cinner et al. 2016/2018**, **Andrello et al. 2022** (reef gravity), **Paolo et al. 2024** (AIS misses 72–76% of industrial vessels).
   - Thermal: **NOAA Coral Reef Watch** (DHW, bleaching alert methodology).
4. **What we know is imperfect** — the honesty caveats verbatim: satellites cannot see coral cover; AIS is blind to artisanal fishing; proximity matching ≠ exact site; species-logged is effort-biased and never scored; a 2-point series is a before/after, not a trend.
5. **Feedback CTA** — "Are you a marine scientist? Tell us where this is wrong." → hello@scubaseason.fun. This turns the panel into the fine-tuning loop you want.

Copy rules for anything rendered to users: labels stay **Improving / Stable / Declining / Not surveyed** (never "thriving"); no hyphens in body copy; live data, no visible timestamps on the card face.

---

## 7. Open decisions for Josie

1. **State-only vs co-equal-with-fishing.** This doc recommends *state-only* (coral + biomass build the score; fishing is a gate). The coordination contract floated a *co-equal three-pillar* score (coral + biomass + fishing summed). Recommend state-only for honesty and to avoid double-counting fishing — but this is the one genuinely scientific call to lock before building.
2. **Combine rule for the two state pillars:** lower-of-two (conservative, recommended) vs mean.
3. **Surface the `paper-park` flag publicly?** Computed today, hidden in v1. Surfacing it names a specific MPA as failing — a reputational/editorial call, not a code call.
4. **Non-commercial licensing.** AIMS, MPAtlas, WDPA, GCRMN regional data are non-commercial; MC5 Labs is a for-profit C corp. Per prior guidance we treat Scuba Season as non-profit-in-spirit and use + attribute, but the AIMS/GCRMN held-out series stay blocked until a license conversation happens. Partnerships (esp. MCI) are the clean unlock.

---

## 8. Recommended sequencing

- **Now (no new data):** name all four pillars in the method panel; add the per-site confidence badge + the coverage/gap map (pure metadata, biggest GTM return for least effort); wire `reef-gravity.ts` so every site has a fishing read.
- **Next (light data, mostly built):** fold RLS fish biomass into the label as a second state pillar on the 57 sites; store the NOAA CRW time series + MMM baseline so the "warm right now vs usual" readout is truly live.
- **Then (needs outreach):** B0 benchmark (gravity-derived, WCS-validated) → full standing/B0 biomass scoring; multi-year coral series from GCRMN/MERMAID/AIMS/Reef Check → Tier-A coral trends; MCI assessment of the 89 unassessed MPAs.
- **Editorial:** decide state-only vs co-equal, the combine rule, and paper-park surfacing before the joint `reef-state.ts` rewrite (which the coordination contract says must be a single PR both pillar sessions review).

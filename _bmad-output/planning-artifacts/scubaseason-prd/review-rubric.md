# PRD Quality Review — scubaSeason.fun
**Reviewer:** Senior PM (automated rubric)
**Date:** 2026-06-03
**Gate verdict:** CONDITIONAL PASS

---

## Overall Assessment

The PRD is significantly above average for a solo/indie product. The positioning is clear, the user flows are credible, and the honesty about gaps (136 zero-evidence sites, 2 coral cover data points) actually strengthens rather than weakens grant credibility. The main failure modes are in decision-readiness for engineers/designers, thin success metrics calibration, and a few missing user flows that cover non-trivial traffic paths.

---

## 1. Decision-Readiness — MEDIUM RISK

**Could an engineer or UX designer start work directly from this PRD?**

For *built* features: largely yes. FRs are specific enough that an engineer returning to the codebase can orient. For *in-scope next* work, the answer is no.

**Gaps that force guessing:**

- **Sighting evidence backfill (top priority per §11) has no FR.** "Close the 136 zero-evidence sites gap" appears in §3 and §11 but there is no F-section defining what a backfill looks like functionally. Does it mean running the Colab pipeline again? Scraping iNat directly? Manually sourcing from GBIF? What is the acceptance criterion for a site being "no longer zero-evidence" (1 record? 3? Within X radius?)? A developer has no spec to execute against.

- **Homepage positioning audit (OQ-5)** is listed as a priority in §11 but has no FR. What does "10-second clarity" mean as a testable criterion? What elements need to change — hero copy, above-the-fold layout, globe default state? Without a FR, this stays in product limbo.

- **MERMAID API integration (OQ-2)** is flagged as blocking Schmidt Marine credibility but has no FR. No endpoint documented, no data schema described, no UI specification for how the multi-year trend displays on location pages.

- **`/plan` funnel (OQ-3)** — the PRD says to "verify and finish" but does not describe what Phase 8–10 success criteria are, what the current state is, or what a complete `/plan` page looks like. An engineer auditing this has nothing to compare against.

**Recommendation:** Add at minimum a stub FR section for each in-scope-next item, even if it is one paragraph with acceptance criteria.

---

## 2. Substance of Functional Requirements — LOW-MEDIUM RISK

**Verdict:** Built features are described with good specificity. In-scope-next items have no FRs at all.

**Strong:**
- FR2.2 (species section) is precise: common + scientific name, IUCN badge, reliability classification, last confirmed date, 24-month rolling count, proximity radius, iNat photo + attribution. This is exactly the level of detail a developer needs.
- FR7.1 (affiliate link tracking) specifies the analytics event names and context fields — ready to implement.
- FR2.5 (gear two-layer) is well-specified — Layer A / Layer B distinction is clear with examples.

**Weak:**
- FR1.4 (location cards) lists fields but does not specify the data freshness label format. "Survey age" — is this "Last surveyed: March 2024" or "Data: 18 months old" or a color-coded badge? The UX output may have this but it is not in the PRD.
- FR3.2 (fishing pressure) says "GFW visible AIS-tracked fishing hours within 50km" but does not specify the unit displayed to users (hours/year? hours/month? normalized score?) or what threshold separates "high" from "moderate" pressure. This is a live page — the implementation exists, but future engineers adding data will guess at the classification logic.
- FR5.3 (top 6 sites ranked by editorial score) — editorial score is not defined anywhere in the PRD. Is this `editorialRank` (confirmed in A3)? How is it set? What inputs? For grant reviewers asking about methodology, this is a hole.

---

## 3. Strategic Coherence — LOW RISK

**Verdict:** The positioning holds together well across sections. One tension worth naming.

**Coherent:**
- "Depth + honesty" positioning is consistent from §1 through §8 (revenue model) and §13 (Notes for PM). The counter-metrics section (§9) explicitly names the anti-patterns that would undermine it. This is unusually disciplined.
- The 36% zero-evidence gap is named as a product integrity issue in §1, §2, §5, §11, and §13 — it threads through the PRD correctly.
- Non-goal list is tight. User accounts, booking integration, real-time pricing — all correctly deferred.

**Tension to name:**
- §2 says "Beginners are also served and represent higher affiliate revenue per visit (full kit purchases)" — this is true. But the entire editorial voice, the globe interface, and the UX flows are optimized for the advanced species chaser. The beginner (UF2) lands on an interactive 3D globe — which is not a beginner-friendly entry point. The PRD does not surface this tension or resolve it (e.g., first-visit prompt routing beginners to `/for/open-water`). OQ-4 acknowledges the first-visit prompt is unconfirmed built. This is the only place positioning and UX are pulling apart.

---

## 4. User Flow Quality — MEDIUM RISK

**Verdict:** The four flows are realistic and well-written. Two important flows are missing.

**Strong:**
- UF1 (species chaser) is the best-written flow. The step sequence is credible, the success signals are specific and connect to revenue, and the flow actually tests the positioning claim.
- UF3 (conservation-curious) correctly surfaces a non-obvious traffic path (Google → `/data` → location page) that could drive grant credibility traffic.

**Missing flows:**

**UF5 — SEO/Organic landing on a site detail page directly (no atlas visit)**
This is almost certainly the highest-volume entry path for a content-heavy site. A user Googles "diving Ningaloo whale sharks conditions" and lands directly on `/sites/navy-pier-exmouth`. The flow from that cold landing through to an affiliate click is not documented. This matters for: (a) knowing what the above-the-fold of a site detail page must communicate on first visit, (b) understanding where the globe/atlas fits in a user who never sees the home page.

**UF6 — Grant/Partner reviewer evaluating data credibility**
Schmidt Marine or NatGeo reviewers are a named audience for this PRD. Their flow is: landing on the site → finding the `/data` page → assessing methodology rigor → deciding whether to cite or partner. This is not a user flow in the traditional sense but it is a critical path for the product's stated partnership goal. What do they see? What convinces them? What would fail them? Not documented.

**Realistic check on existing flows:**
- UF4 (returning diver): Step 1 applies filter "Last dive: 2+ years ago" — this filter is not mentioned in FR1.2's filter rail spec. Is this filter actually built? If not, Step 1 of UF4 is broken.

---

## 5. Success Metrics — MEDIUM RISK

**Verdict:** Metrics are more thoughtful than most PRDs (counter-metrics are excellent). But calibration is absent and the grant credibility signal is weak.

**Strong:**
- Counter-metrics section is genuinely unusual and useful. Naming "time on site" as a do-not-optimize metric for a research tool shows product clarity.
- Grant credibility signals (zero-evidence < 20, 100% reef health coverage) are concrete and tied to the product gap.

**Gaps:**

- **No baseline.** "Sessions reaching site detail page > 30%" — what is it today? Without a baseline, there is no way to know if 30% is aspirational or already exceeded. Same for median session depth > 2 pages.
- **Week 1–4 vs. Month 2+ thresholds are not calibrated.** "Gear affiliate CTR > 4%" — is this industry-standard for travel affiliate? High? Low? A grant reviewer or investor will ask what benchmark this is derived from. A note citing industry benchmarks (travel affiliate CTR averages 1–3%, dive gear is higher intent) would give these numbers credibility.
- **No acquisition metric.** All metrics measure on-site behavior. None measure acquisition: organic search ranking, referred traffic, backlinks from conservation orgs. For a grant application, "X conservation publications linked to the /data page" or "site appears on page 1 for [target keyword]" is a credibility signal that is completely absent.
- **No data quality metric.** The product's moat is evidence quality, but the metrics section does not measure it. Suggested addition: % of sites with at least 3 sighting records (not just > 0), or median evidence age across catalog.

---

## 6. Open Questions — LOW RISK

**Verdict:** The right things are flagged. Two blockers are missing.

**Well-flagged:**
- OQ-1 (evidence backfill prioritization), OQ-2 (MERMAID), OQ-3 (/plan completeness), OQ-6 (IUCN licensing) are all correctly identified as blocking.
- OQ-7 (grant deadline) is correctly flagged — without a deadline, "medium-high stakes" is a feeling, not a fact.

**Missing from open questions:**

- **OQ-9: Sighting evidence data licensing for commercial use.** The PRD cites GBIF, OBIS, and iNaturalist as sighting data sources. iNaturalist data is CC-licensed for non-commercial use by default; commercial use (affiliate-monetized site) requires checking each record's individual license. GBIF has similar nuances. This is a potential compliance issue that is nowhere in the PRD. It is at least as important as IUCN licensing (OQ-6), which is flagged.

- **OQ-10: Hero image rights for 356 sites at scale.** §12 notes "hero images sourced separately" and there is separate memory guidance on hero image standards (underwater, subject must match site description). But there is no open question about the rights/licensing strategy for hero images across 356 sites. For a grant application, "we have 356 sites with properly licensed underwater photography" needs to be demonstrably true.

---

## 7. Completeness — MEDIUM RISK

**What is thin, rushed, or placeholder-y:**

**Thin sections:**
- **§3 In-scope-next** reads as a bullet list of gaps with no functional specification. For a production-ready PRD, each item should have a brief FR stub (even 2–3 sentences) with acceptance criteria. Right now this is a backlog comment, not a spec.
- **§11 Build Order** is useful for PM context but duplicates §3 without adding engineering specificity. It would be stronger as a table with: item, owner, dependency, acceptance criterion.
- **§6 — in-scope-next features have no F-sections.** There is F1–F8 for built features only. The PRD describes what exists; it does not spec what comes next. For "completeness for grant/partnership credibility" (the stated purpose of this PRD update), partners and grant reviewers expect to see where the product is *going*, not just where it is.

**Missing sections for a production-ready PRD:**
- **Technical architecture / data pipeline:** The PRD mentions Colab Gemini Blitz, NOAA nightly integration, GBIF/OBIS/iNat pipeline, GFW data — but does not document how data flows into the product (ingestion scripts, update frequency, failure modes). For Schmidt Marine evaluating a partnership, "how do we plug into your data pipeline" is an immediate question.
- **Content governance:** 356 sites, 11 encounters, 63 sources — who updates them? What is the editorial process? When NOAA updates a DHW reading, how does it flow? This is especially relevant for grant credibility ("the data is live" needs a process behind it).
- **Error states / data unavailability:** What does a site page show when reef health data is missing? When sighting evidence is zero? The current answer (presumably blank or null panels) is implicit. FR2.4 says reef health "links to parent location reef state" but what if the parent has no reef state? These are design decisions that should be in the PRD, not left to the developer.

---

## Summary of Findings

| # | Finding | Dimension | Severity |
|---|---|---|---|
| 1 | In-scope-next items (evidence backfill, MERMAID, /plan) have zero functional requirements — engineers cannot execute | Decision-readiness | **Critical** |
| 2 | UF4 references a "Last dive: 2+ years ago" filter that is not in FR1.2; flow may be based on an unbuilt feature | User flow quality | **High** |
| 3 | Missing UF5 (direct SEO landing on site detail) — highest-volume path, not documented | User flow quality | **High** |
| 4 | No data licensing OQ for GBIF/OBIS/iNat commercial use — potential compliance gap for affiliate-monetized site | Open questions | **High** |
| 5 | Success metrics have no baselines and no acquisition signals; grant reviewers will find them unanchored | Success metrics | **Medium** |
| 6 | Missing UF6 (grant/partner reviewer path) — the named audience for this PRD has no documented flow | User flow quality | **Medium** |
| 7 | Editorial rank (`editorialRank`) used in FR5.3 is not defined — methodology gap for grant reviewers | Substance | **Medium** |
| 8 | No data pipeline / content governance section — "live data" claim is unsubstantiated without process docs | Completeness | **Medium** |
| 9 | Beginner revenue promise vs. globe-first UX for beginners is an unresolved tension; OQ-4 is the only acknowledgment | Strategic coherence | **Low** |
| 10 | Hero image rights strategy for 356 sites is not an open question — it should be | Completeness | **Low** |

---

## Gate Verdict: CONDITIONAL PASS

**Pass conditions to reach PASS:**
1. Add stub FRs with acceptance criteria for the 4 in-scope-next items (evidence backfill, MERMAID integration, /plan audit, homepage positioning)
2. Verify whether "Last dive: 2+ years ago" filter is built; if not, update UF4 to reflect actual available filters
3. Add OQ-9 (sighting data commercial licensing) to open questions table
4. Add UF5 (direct SEO landing → affiliate conversion)

**Optional improvements (do before grant submission):**
- Add baselines to success metrics (even approximate from Vercel Analytics)
- Add acquisition metrics (target keywords, organic ranking goals)
- Add a brief data pipeline / update cadence section
- Add UF6 (grant reviewer path)

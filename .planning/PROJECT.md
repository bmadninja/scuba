# scubaSeason.fun

## What This Is

A trip-planning site for scuba divers built around one question — *where should I dive, when?* It pairs a curated catalogue of 184 dive sites and 111 locations with a source-aware data layer (climate, reef health, species sightings, bucket-list encounters) so visitors don't have to interpret raw numbers. The whole product is filter-first and explicitly avoids fake precision: no per-dive probability without an effort denominator, no projection without a documented model.

Live at https://scubaseason.fun.

## Core Value

**Help a diver decide where to go next, with honest evidence.** Every claim on the site must be traceable to a named source, every visualisation must spoon-feed the takeaway, and editorial recommendations must never be driven by affiliate commission.

## Requirements

### Validated

<!-- M1 (BMAD v2 backlog) — shipped 2026-05-21 → 2026-05-24 -->

- ✓ Filter-first `/sites` — encounter chips, certification, dive type, travel month, climate-stressed/stable; URL-shareable state — *M1*
- ✓ Source registry (`sources.json`, 20 entries) and methodology notes (`methodologies.json`, 14 entries) — *M1*
- ✓ Encounter data model + 11 bucket-list encounters (sardine run, hammerheads, etc.) — *M1*
- ✓ `/encounters` index + `/encounters/[slug]` detail pages with hero photos — *M1*
- ✓ Sighting evidence on site cards + site detail pages (17 seeded records, no fake %) — *M1*
- ✓ Reef-health data model + spoon-fed location panel (verdict + cover bars + alert + dive outlook) for 12 locations — *M1*
- ✓ Affiliate finalisation: Vercel Analytics mounted, editorial-independence audit script, disclosure copy — *M1*
- ✓ SEO + a11y polish: encounter JSON-LD, `aria-pressed` on filter chips, sitemap including all encounters — *M1*
- ✓ Photo rule: every hero must be underwater + subject-matched; enforced in `fetch-encounter-photos.mjs` — *M1*

### Active

<!-- M2 — under definition -->

- [ ] Backfill reef-health and sighting evidence to the most-trafficked locations so the climate filter and sighting badges actually populate
- [ ] Trip planner — a route that stitches site + lodging + operator + gear + estimated cost into a saveable itinerary
- [ ] (Further requirements to be scoped in this milestone)

### Out of Scope

- Real-time booking / payments — affiliate hand-off only — *complexity + legal*
- User accounts / saved logins — URL state covers most of what saved trips need — *defer until clear demand*
- Mobile-native app — web-first, mobile-responsive — *cost*
- Diver-submitted UGC (sighting reports, reviews) — moderation cost without clear validation signal yet — *defer*
- Pricing/commercial model for scubaseason itself — informational site funded by affiliate — *out of remit*

## Context

- **Stack:** Next.js 16 (App Router, RSC, Turbopack dev), React 19, Tailwind v4, react-globe.gl. Static-export friendly — every detail page is SSG, 304 routes prerendered.
- **Data:** All site/location/encounter/reef-health/sighting data lives as JSON in `src/data/` with typed loaders in `src/lib/data/`. No backend DB. Provenance is enforced by `scripts/validate-provenance.mjs`.
- **Editorial layer:** BMAD v2 backlog (`_bmad-output/planning-artifacts/scubaseason-prd/`) is the source for product narrative. Stories 01–13 shipped in M1.
- **Hosting:** Vercel, prod = scubaseason.fun, `vercel deploy --prod` for releases.
- **Node:** Must use Node 24 (Next 16 requirement). `.claude/dev.sh` wrapper pins PATH for the preview MCP. `.nvmrc` pins 24.
- **Memory rules:** Hero images must match subject *and* be underwater (see `~/.claude/projects/.../memory/feedback_*.md`).

## Constraints

- **Tech:** Next.js 16 + Tailwind v4 — keep static export viable; no edge runtime requirements that break SSG.
- **Data integrity:** Every factual claim needs source IDs and a methodology note. Validator must stay green.
- **Editorial independence:** Ranking, sorting, and recommendation code may never read `commission`. `npm run audit:independence` enforces this.
- **Photo policy:** Subject-matched + underwater. No specimen-on-white, no surface shots.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static-export Next.js | Cheap to host, fast to serve, no DB to maintain | ✓ Good — 304 prerendered routes |
| URL-state filters | Shareable + back-button safe; replaces saved searches | ✓ Good — eliminated need for accounts in v1 |
| File-based source registry | No admin UI; editor edits JSON | ✓ Good for v1 |
| No numeric sighting probability | Avoid fake precision without an effort denominator | ✓ Good — credibility lever |
| Spoon-fed verdicts on reef health | Headline takeaway > raw numbers | ✓ Good — landed well |
| Filter-first over persona wizard | Cancelled BMAD persona-flow stories; built filter chips instead | ✓ Good — simpler product, fewer screens |

---
*Last updated: 2026-05-24 after M1 (BMAD v2 backlog) shipped, M2 scoping in progress*

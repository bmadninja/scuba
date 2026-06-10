# scubaSeason.Fun — User Stories

Derived from the BMad PRD at
`_bmad-output/planning-artifacts/scubaseason-prd/prd.md`.
Verified against the running app by `scripts/verify-stories.mjs`.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` passing verification.

Conventions for the loop:
- The verifier hits actual routes and asserts strings in rendered HTML or
  shell-command exit codes.
- A failing AC is the next thing to fix — pick the lowest-numbered failing story.
- Never weaken an AC to make it pass. If the PRD changes, update both PRD and AC.

---

## Epic A — Discover (landing + globe)

### A1 — Landing page renders without error
**As a** first-time visitor **I want** the landing page to load.
- AC1: `GET /` returns 200.
- AC2: HTML contains "scubaSeason".
- AC3: No conflict markers (`<<<<<<<`, `>>>>>>>`) in any committed source file.

### A2 — Globe is on the landing page
**As a** visitor **I want** the 3D globe of dive locations rendered.
- AC1: `/` HTML references the globe (string `globe` appears in source/script).
- AC2: At least 100 dive sites exist in `src/data/sites.json`.

### A3 — Header navigation to /sites and /about
- AC1: `/` HTML links to `/sites` and `/about`. (`/gear` removed — gear lives on location pages per story 7.9.)

---

## Epic B — Site detail pages (PRD F1)

### B1 — `/sites/[slug]` resolves for a known site
- AC1: `GET /sites/raja-ampat-cape-kri` returns 200.
- AC2: The site name "Cape Kri" appears in an `<h1>`.

### B2 — All PRD-required sections render
- AC1: Detail HTML contains the headings: `Overview`, `What you'll see`,
  `Conditions`, `Season calendar`. (`Gear` moved to location page per story 7.9.)
- AC2: The Plan-Your-Trip block (on the location page, per story 7.8/7.9)
  contains `Getting there`, `Where to stay`, `Who to dive with`.

### B3 — Species reliability + best months
- AC1: At least one species shows a reliability label (`year-round`,
  `seasonal`, or `rare`).
- AC2: At least one species lists `Peak:` months.

### B4 — 12-month conditions grid with temp / viz / current
- AC1: All 12 month abbreviations Jan–Dec render in the conditions table.
- AC2: Conditions show water temp in `°C`, visibility in `m`, and a current
  strength.

### B5 — Trip-booking affiliate links (FR1.5 / F5)
- AC1: Location page has at least one outbound link with `rel="nofollow sponsored noopener"`.
- AC2: Location page affiliate disclosure text "commission" appears.

### B6 — Gear block with Tier A + Tier B (FR1.4)
- AC1: Location page `Gear` section heading is present.
- AC2: Location page mentions both `base kit` and `site-specific` (Tier A / Tier B).

### B7 — SEO metadata
- AC1: `<title>` contains the site name and is not the Next.js default.
- AC2: `<meta property="og:title">` is emitted.
- AC3: JSON-LD `<script type="application/ld+json">` is present (NFR2).

---

## Epic C — Filters & list view (PRD F2, F4)

### C1 — `/sites` list view returns sites
- AC1: `GET /sites` returns 200.
- AC2: At least 3 `<a href="/sites/...">` cards link to detail pages.

### C2 — Search input on /sites (FR4.2)
- AC1: `/sites` contains `<input type="search">` or `role="searchbox"`.

### C3 — Skill / dive-type filters on /sites
- AC1: `/sites` HTML mentions both `Open Water` and `Advanced` as skill options.
- AC2: `/sites` HTML mentions at least 3 of: `pelagics`, `coral`, `macro`,
  `wrecks`, `geology`, `blackwater`.

---

## Epic D — Data (PRD F3)

### D1 — Two-tier schema files in place
- AC1: `src/data/locations.json` exists and is a non-empty array.
- AC2: `src/data/sites.json` exists and each entry has the required keys
  `id, slug, locationId, name, lat, lng, depthRange, skillLevel, diveTypes,
  species, conditionsByMonth, bestMonths`.

### D2 — Top-10 destinations seeded (FR3.4)
- AC1: At least 5 of these `locationId` substrings appear in `sites.json`:
  `maldives, raja-ampat, komodo, galapagos, cocos, socorro, palau, red-sea,
  sipadan, tubbataha`.

---

## Epic E — Affiliate (PRD F5)

### E1 — Disclosure visible on pages with affiliate links (FR5.3)
- AC1: Any detail page containing `rel="...sponsored..."` also contains
  the word `commission`.

### E2 — /about page exists with affiliate policy
- AC1: `GET /about` returns 200.
- AC2: Page contains the word `affiliate`.

### E3 — Click-tracking hook is wired (FR5.4)
- AC1: Source under `src/` references at least one of `gear_click`,
  `lodging_click`, `operator_click`, or `flight_click`.

### E4 — Gear on location page
- AC1: Location page `GET /locations/raja-ampat-indonesia` returns 200 and contains a Gear section.
- AC2: At least 5 gear items render on the location page (`$\d` price patterns or list items).

---

## Epic F — Non-functional

### F1 — Production build succeeds (NFR1)
- AC1: `npm run build` exits 0.
- AC2: No TypeScript errors emitted.

### F2 — Lint clean
- AC1: `npm run lint` exits 0.

### F3 — Sitemap + robots (NFR2)
- AC1: `GET /sitemap.xml` returns 200 with `<urlset` in body.
- AC2: `GET /robots.txt` returns 200.

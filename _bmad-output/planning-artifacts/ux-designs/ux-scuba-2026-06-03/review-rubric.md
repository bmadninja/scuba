# UX Design Rubric Review
# Run: ux-scuba-2026-06-03
# Reviewer: rubric-walker pass
# Date: 2026-06-03

---

## Overall verdict: ADEQUATE

The spine pair is a solid, codebase-accurate reference document. It will serve an engineer implementing from scratch. Critical gaps are limited to one token namespace mismatch that pervades EXPERIENCE.md and two missing behavioral specs for surfaces that do exist in the IA. No broken sections.

---

## Pass 1 — Mechanical coverage

### 1. Flow coverage (EXPERIENCE.md §7)

Flows extracted:

| # | Flow | Protagonist named? | Steps numbered? | Climax beat? | Failure path? |
|---|---|---|---|---|---|
| 7.1 | Home — Atlas Explorer | implicit (user) | yes (8 steps) | step 8: navigates to location | MISS — no failure path for empty state on initial load |
| 7.2 | Location detail | implicit (user) | yes (11 steps) | step 8/9: species + operators | MISS — no failure path for 404 / unknown slug |
| 7.3 | Site detail | implicit (user) | yes (13 steps) | step 10: species grid | MISS — no failure path for no-species / no-hero-image |
| 7.4 | Species encounter | implicit (user) | yes (4 steps) | step 3: cross-site results | MISS — no failure path for zero confirmed sites |
| 7.5 | Cert-level landing | implicit (user) | yes (3 steps) | pre-filtered Atlas view | MISS — no failure path |
| 7.6 | Data / methodology | implicit (user) | yes (informal) | reference page | n/a (read-only; acceptable) |

**Findings:**
- [HIGH] None of the six flows names a protagonist by archetype. The rubric requires a named protagonist (e.g. "Experienced diver planning a manta trip," "First-time user exploring by map"). All flows use "User" generically.
- [HIGH] Flows 7.1–7.5 have no failure path. Flow 7.1's no-results state exists in §5.4 but is not linked back to the flow. Flows 7.2–7.5 have no documented error handling (404 slug, empty species list, zero cross-site results, unknown cert level).
- [MEDIUM] Flow 7.1 climax beat is implicit (step 8 is a navigation action, not a named climax beat). Flows 7.4 and 7.5 are under-stepped — they would benefit from at least one more interaction step each.
- [LOW] Flow 7.6 has no numbered steps — prose only. Acceptable for a read-only reference page but inconsistent with the other flows.

---

### 2. Token completeness (DESIGN.md)

**Tokens defined in YAML frontmatter:**

All color tokens are hex-complete. Full list of named token groups:
- `colors.brand.*` (6 keys) — all have hex ✓
- `colors.surfaces.*` (6 keys) — all have hex ✓
- `colors.text.*` (6 keys) — all have hex ✓
- `colors.borders.*` (3 keys) — all have hex ✓
- `colors.reef_states.*` (3 states × 6 sub-keys) — all complete; Tailwind class tokens noted ✓
- `colors.semantic_pills.*` (6 groups) — all complete ✓
- `colors.freshness_dots.*` (4 keys) — all have hex ✓
- `colors.iucn_tones.*` (6 groups) — all have hex ✓
- `colors.heat_ramp.*` (6 steps, oklch) — all present ✓
- `colors.data_freshness_pills.*` (3 groups) — all complete ✓
- `typography.*` — complete ✓
- `rounded.*` — complete ✓
- `spacing.*` — complete ✓
- `elevation.*` — complete ✓

**Token references in EXPERIENCE.md prose** (`{...}` syntax):

| Token reference | Defined in DESIGN.md? |
|---|---|
| `{colors.brand-ocean}` | MISS — no token named `brand-ocean`. Closest match: `colors.brand.primary` (`#0089de`) |
| `{colors.reef-thriving/pressure/witnessing}` | MISS — token path does not exist. Defined as `colors.reef_states.thriving/pressure/change` (uses underscore namespace, not hyphen; "change" not "witnessing") |
| `{colors.text-muted}` | MISS — no token named `text-muted`. Closest match: `colors.text.tertiary` (`#64748b`) or `colors.text.dimmed` (`#94a3b8`) |
| `{colors.surface-base}` | MISS — no token named `surface-base`. Closest match: `colors.surfaces.page` (`#ffffff`) |
| `{colors.surface-card}` | MISS — no token named `surface-card`. Closest match: `colors.surfaces.card` (`#ffffff`) |
| `{components.ReefStateBadge}` | MISS — component named `ReefStateBadge` not defined in DESIGN.md Components section. The component is the state badge overlaid on ReefLocationCard image — it exists in the codebase but has no standalone entry in DESIGN.md |
| `{colors.brand-ocean}` (§4.3, §4.4, §4.5, §6.3) | Same miss, repeated 8 times total |

**Critical findings:**
- [CRITICAL] `{colors.brand-ocean}` is used 8× in EXPERIENCE.md and does not resolve to any DESIGN.md token. The correct token path is `colors.brand.primary`. Every reference is a broken cross-reference.
- [CRITICAL] `{colors.reef-thriving/pressure/witnessing}` (§7.1) does not resolve. DESIGN.md uses `colors.reef_states.thriving/pressure/change`.
- [HIGH] `{colors.text-muted}`, `{colors.surface-base}`, `{colors.surface-card}` — three more broken token references. None of these path names exist in the YAML.
- [MEDIUM] `{components.ReefStateBadge}` — forward-reference to an unnamed component.

---

### 3. Component coverage

**Components named anywhere in either spine:**

| Component | DESIGN.md visual spec? | EXPERIENCE.md behavioral spec? |
|---|---|---|
| AtlasNav | ✓ (§Components) | ✓ (§4.1) |
| AtlasFooter | ✓ (§Components) | ✓ (§2.3 — brief) |
| ReefLocationCard | ✓ (§Components) | ✓ (§4.3) |
| SiteCard | ✓ (§Components) | ✓ (§4.4) |
| Confidence dot | ✓ (§Components) | partial — described inline in §4.4; no dedicated §4.x entry |
| IucnBadge | ✓ (§Components) | ✓ (§4.6) |
| DataFreshnessLabel | ✓ (§Components) | ✓ (§4.5) |
| AtlasFilterRail | ✓ (§Components) | ✓ (§4.2) |
| Season calendar | ✓ (§Components) | partial — described in flow §7.2 step 7 and §7.3 step 11, not in §4.x |
| In-page jump nav | ✓ (§Components) | partial — described in flow §7.2 step 5 only |
| Breadcrumb | ✓ (§Components) | partial — described in flow steps only |
| Live panel | ✓ (§Components) | partial — described in flow §7.1 steps 2–3 only |
| Hero stat strip | ✓ (§Components) | partial — described in flow §7.1 step 2 only |
| Empty state (no dive sites) | ✓ (§Components) | ✓ (§5.4) |
| Info block | ✓ (§Components) | partial — described in flow §7.3 step 12 only |
| FacetGroup | ✓ (within AtlasFilterRail §) | not separately covered |
| CheckOpt | ✓ (within AtlasFilterRail §) | not separately covered |
| Month chips (filter) | ✓ (within AtlasFilterRail §) | not separately covered (sub-component; acceptable) |
| Methodology disclosure (details/summary) | mentioned in Do's, not standalone section | ✓ (§4.7) |
| AffiliateLink | not in DESIGN.md Components | ✓ (§4.8) |
| ReefStateBadge | referenced in EXPERIENCE.md (§4.6) but not a DESIGN.md section | not a standalone §4.x |
| PlanetGlobe | mentioned in flows §7.1 | no visual spec in DESIGN.md, no behavioral spec entry in §4.x |
| FirstVisitBanner | mentioned in §9.4 | no visual spec, no behavioral spec |
| cmdk palette | elevation entry in DESIGN.md YAML | not mentioned in EXPERIENCE.md |

**Findings:**
- [HIGH] `PlanetGlobe` — the most visible component on the home page. Mentioned in flow §7.1 and §6.1 (interaction primitive) but has zero visual spec in DESIGN.md and no dedicated §4.x behavioral entry. Marker color, globe behavior, rotation speed, and marker aria-label format are all scattered references rather than a spec.
- [HIGH] `AffiliateLink` has a behavioral spec (§4.8) but no visual spec row in DESIGN.md Components section.
- [MEDIUM] `Season calendar` appears in DESIGN.md visual spec but has no dedicated §4.x behavioral entry in EXPERIENCE.md. State transitions (current month ring, selected month behavior) are described only inside flow prose.
- [MEDIUM] `In-page jump nav` — visual spec in DESIGN.md, but behavioral spec (active state management, scroll tracking, sticky offset) only implied in flow steps.
- [MEDIUM] `Breadcrumb` — visual spec present, no behavioral spec entry.
- [MEDIUM] `Live panel` and `Hero stat strip` — visual spec present, no dedicated behavioral entry. These are read-only display components so the gap is acceptable but worth noting.
- [MEDIUM] `FirstVisitBanner` — referenced in §9.4 URL-driven state as storing a localStorage flag. No visual spec, no behavioral spec, no component row in either spine.
- [LOW] `cmdk palette` — elevation token defined in DESIGN.md YAML (`cmdk palette` shadow); never mentioned in EXPERIENCE.md or Components prose. If the command palette exists in the product it needs both specs.
- [LOW] `ReefStateBadge` — referenced in EXPERIENCE.md §4.6 but has no standalone component entry in DESIGN.md (the badge is described inside the ReefLocationCard anatomy rather than as its own component).
- [LOW] `Methodology disclosure` — visual behavior is in DESIGN.md Do's not in Components section; behavioral spec is §4.7 EXPERIENCE.md. Inconsistent home.

---

### 4. State coverage

Walking each IA surface for required states:

**Home / AtlasExplorer (`/`)**

| State | Covered? |
|---|---|
| Cold load (no JS hydration) | MISS |
| Default / all-results | ✓ (§7.1 step 4) |
| Filter active | ✓ (§4.2) |
| No results | ✓ (§5.4) |
| Globe marker selected | ✓ (§6.1) |
| Globe marker deselected | ✓ (§6.1 reset) |
| Error (data fetch fails) | MISS |
| Offline | MISS |

**Location detail (`/locations/[slug]`)**

| State | Covered? |
|---|---|
| Cold load skeleton | MISS |
| Loaded with all data | ✓ (§7.2) |
| Missing coral cover | ✓ (§5.5) |
| Missing fishing pressure | ✓ (§5.5) |
| No sites at location | partial — empty state component exists but flow doesn't address it |
| 404 / invalid slug | MISS |
| Error state | MISS |

**Site detail (`/sites/[slug]`)**

| State | Covered? |
|---|---|
| Full data | ✓ (§7.3) |
| No sighting data | ✓ (§5.5) |
| No hero image | ✓ (§5.5) |
| Missing briefing note | ✓ (§7.3 step 8 "optional") |
| Missing reef science stamp | ✓ (§5.5) |
| 404 / invalid slug | MISS |

**AtlasFilterRail**

| State | Covered? |
|---|---|
| Default (no filters) | ✓ |
| One or more filters active | ✓ |
| All filters active for a group | implied |
| All filters removed (no results) | ✓ (§5.4) |
| Mobile (collapsed) | MISS — §4.2 explicitly says "Behavior on mobile not specified" |

**AtlasNav search**

| State | Covered? |
|---|---|
| Closed | ✓ |
| Open with results | ✓ |
| Open with empty query | ✓ |
| No results | ✓ (§4.1 — "Dropdown does not render") |
| Loading / async delay | MISS |

**Species encounter (`/where-to-see/[species]`)**

| State | Covered? |
|---|---|
| Has results | ✓ |
| Zero confirmed sites | MISS (noted in flow gap above) |
| Unknown species slug | MISS |

**Findings:**
- [HIGH] Mobile filter rail state is explicitly deferred ("not specified in codebase — assume collapsed/drawer pattern"). This is the most common real-world surface and is unspecified.
- [HIGH] Error state and cold-load skeleton are absent for all major surfaces. These are table-stakes for an implementation-ready spec.
- [MEDIUM] 404 states are unspecified for location and site detail routes.
- [MEDIUM] Zero-result state on the species encounter page is not specified.
- [LOW] "No sites at this location" state on location detail — component exists (Empty state visual spec), but the flow does not connect it.

---

### 5. Visual reference coverage

Linked files extracted from both spines:

| Link / reference | Spine | Target exists? |
|---|---|---|
| No external image files are linked | — | n/a |
| No `![image]()` markdown images | — | n/a |
| Companion: `DESIGN.md` referenced in EXPERIENCE.md frontmatter | EXPERIENCE.md | ✓ file exists |
| `/data` route referenced 6× | EXPERIENCE.md | route listed in IA §2.1 ✓ |
| `/locations/[slug]` | EXPERIENCE.md | route listed ✓ |
| `/sites/[slug]` | EXPERIENCE.md | route listed ✓ |
| `/where-to-see/[species]` | EXPERIENCE.md | route listed ✓ |
| `/for/[cert]` | EXPERIENCE.md | route listed ✓ |
| `/about` | EXPERIENCE.md | route listed ✓ |
| `underwaterPhotoUrl()` utility | EXPERIENCE.md §5.5, DESIGN.md Do's | not a linked file — code reference; no orphan risk |
| `project_data_strategy.md` | EXPERIENCE.md §5.2 | external memory reference; not a spine file — cannot verify |
| `live-dot` CSS class | DESIGN.md | defined in globals.css per D02 decision log ✓ |
| `atlas-method` CSS class | DESIGN.md Do's | defined in globals.css per D02 ✓ |

**Findings:**
- [LOW] `project_data_strategy.md` is referenced in §5.2 for reef state computation rules but is an external memory file, not a linked artifact in the design directory. A reader of the spine pair cannot follow the reference.
- No broken image links. No orphaned file references within the design directory.

---

## Pass 2 — Judgment

### 6. Bloat & overspecification — verdict: ADEQUATE

DESIGN.md is appropriately detailed for a design system document — it is documenting an existing codebase rather than specifying a future one, so the precision is warranted. The inline CSS class strings are the correct level of detail here.

Minor bloat observed:
- [LOW] The `rounded` section in YAML frontmatter and in the prose §Shapes table are near-duplicate. The YAML is the canonical token; the prose table is useful but adds ~20 lines of restatement.
- [LOW] The Do's and Don'ts section partially restates the component specs above it (e.g., the `rounded-2xl` card rule is stated three times: YAML note, Shapes rule, Don'ts). For a reference doc this is defensible repetition, but a dev reading through will encounter the same rule three times.
- [LOW] Typography scale in YAML frontmatter is fully restated in the prose §Typography section with identical code blocks. The prose section adds narrative value but the code blocks are pure duplication.

No pixel-level over-spec beyond what tokens cover. No source material restatement. Judgment: the duplication is **low severity** — a live-codebase reference doc benefits from redundancy for skimmability.

---

### 7. Inheritance discipline — verdict: THIN (due to token namespace mismatch)

This is the most important judgment finding.

EXPERIENCE.md references DESIGN.md tokens using a hyphenated dotted-path namespace (`{colors.brand-ocean}`, `{colors.text-muted}`, `{colors.surface-base}`, `{colors.surface-card}`, `{colors.reef-thriving/pressure/witnessing}`) that does not match the YAML structure in DESIGN.md (which uses underscores and different key names: `colors.brand.primary`, `colors.text.tertiary`, `colors.surfaces.page`, `colors.reef_states.thriving`).

This means no token reference in EXPERIENCE.md is resolvable by an engineer or automated tool tracing `{path}` references back to the DESIGN.md YAML. This is a systemic inheritance failure, not an isolated miss.

**Consistent naming across files:** Component names are consistent (AtlasNav, AtlasFilterRail, ReefLocationCard, SiteCard, IucnBadge, DataFreshnessLabel all match). The mismatch is confined to token path syntax.

**Specific failures:**
- [CRITICAL] `{colors.brand-ocean}` → should be `{colors.brand.primary}` or define an alias `brand-ocean` in the YAML.
- [CRITICAL] `{colors.reef-thriving/pressure/witnessing}` → should be `{colors.reef_states.thriving}`, `{colors.reef_states.pressure}`, `{colors.reef_states.change}`.
- [HIGH] `{colors.text-muted}` → should be `{colors.text.tertiary}` or `{colors.text.dimmed}` (ambiguous — both are plausible targets).
- [HIGH] `{colors.surface-base}` → should be `{colors.surfaces.page}`.
- [HIGH] `{colors.surface-card}` → should be `{colors.surfaces.card}`.

Recommended fix: Either (a) add alias keys to DESIGN.md YAML (`brand-ocean: *primary`, etc.) or (b) do a search-replace across EXPERIENCE.md to normalize token paths to match DESIGN.md's actual key names.

---

### 8. Shape fit — verdict: STRONG

**DESIGN.md canonical order:** The file follows the expected design-system order — meta/frontmatter → Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. This is canonical. No section is out of place.

**EXPERIENCE.md required sections present:**
- Product character ✓ (§1)
- Information architecture ✓ (§2)
- Voice and tone ✓ (§3)
- Component patterns (behavioral) ✓ (§4)
- State patterns ✓ (§5)
- Interaction primitives ✓ (§6)
- Page flows ✓ (§7)
- Accessibility floor ✓ (§8)
- Cross-cutting patterns ✓ (§9)

All nine expected sections are present and in logical order. The EXPERIENCE.md frontmatter is complete (title, status, dates, companion reference, scope).

Minor shape issue: §4.x Component patterns section has 8 entries (§4.1–§4.8) but several components with visual specs in DESIGN.md (Globe, Season calendar, Breadcrumb, Jump nav) are not promoted to their own §4.x entries — they live only in flow prose. This is a coverage gap (noted in Pass 1 §3) but not a shape/order problem.

---

## Finding counts by severity

| Severity | Count | Primary sources |
|---|---|---|
| Critical | 2 | Token namespace mismatch for brand-ocean + reef-state paths |
| High | 12 | Missing protagonist names in flows (6), missing failure paths in flows (5), PlanetGlobe unspecced, AffiliateLink no visual spec, mobile filter rail unspecified, error/skeleton states absent |
| Medium | 10 | 404 states (2), seasonal calendar no §4.x, jump nav no §4.x, breadcrumb no §4.x, FirstVisitBanner unspecced, text-muted/surface-base/surface-card token mismatches (3), zero-result species state |
| Low | 8 | cmdk palette gap, ReefStateBadge homeless, methodology disclosure inconsistent home, project_data_strategy.md external ref, typography duplication, rounded spec triplication, Do's restatement, flow 7.6 no steps |

**Total findings: 32 (2 critical / 12 high / 10 medium / 8 low)**

---

## Per-section verdicts

| Pass 1 section | Verdict |
|---|---|
| 1. Flow coverage | THIN — no named protagonists; no failure paths |
| 2. Token completeness | BROKEN — all {token} references in EXPERIENCE.md use wrong namespace |
| 3. Component coverage | ADEQUATE — most components covered; PlanetGlobe and AffiliateLink are notable gaps |
| 4. State coverage | THIN — error/skeleton/offline states absent; mobile filter rail explicitly deferred |
| 5. Visual reference coverage | STRONG — no broken links; one external reference that cannot be validated |

| Pass 2 section | Verdict |
|---|---|
| 6. Bloat & overspecification | ADEQUATE — defensible redundancy for a reference doc |
| 7. Inheritance discipline | THIN — systemic token namespace mismatch across both files |
| 8. Shape fit | STRONG — both files follow canonical order; all required sections present |

---

## Recommended remediation priority

1. **(Critical — fix before handoff)** Normalize all `{token}` references in EXPERIENCE.md to match DESIGN.md YAML key paths, or add alias keys to DESIGN.md. The token cross-reference system is the primary value of the two-file pattern — broken paths undermine it entirely.

2. **(High — fix before implementation sprint)** Add protagonist archetypes to each flow (even one sentence: "Protagonist: experienced diver planning a manta trip"). Add failure paths to flows 7.1–7.5 (minimum: point to the relevant §5.x state).

3. **(High — add before any mobile build)** Specify AtlasFilterRail mobile state. The "assume collapsed/drawer" comment is not a spec.

4. **(High)** Add PlanetGlobe as a component entry in both spines. It is the most prominent interactive element on the home page and has no spec home.

5. **(Medium)** Promote Season calendar, Jump nav, and Breadcrumb to §4.x entries in EXPERIENCE.md with at minimum state and keyboard behavior documented.

6. **(Medium)** Add a visual spec row for AffiliateLink in DESIGN.md Components section.

7. **(Medium)** Specify error and cold-load skeleton states for home, location detail, and site detail surfaces.

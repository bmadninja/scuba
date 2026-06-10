---
title: Accessibility review — Session 2 changes
reviewer: Accessibility reviewer (UX design contract)
date: 2026-06-04
spines: EXPERIENCE.md, DESIGN.md
standard: WCAG 2.1 AA + the spine's own §8 Accessibility floor
scope: >
  ONLY the Session 2 changes: the two Atlas filter layouts (A horizontal bar /
  B left rail) + categorised wildlife taxonomy, the ReefLocationCard badge
  relocation, the Plan-your-trip block, the Gear section, the Photo policy
  (location hero + inspiration cards), and the site detail/sidebar re-sequence.
  Unchanged areas not re-reviewed.
---

# Accessibility review — Session 2 changes

## Summary

| Severity | Count |
|---|---|
| BLOCK | 4 |
| FLAG | 6 |
| NOTE | 5 |

**Method.** Reviewed EXPERIENCE.md §4.2, §4.3, §4.13a, §4.14, §5.5a, §7.2, §7.3 and the §8 floor against DESIGN.md (filter two-layout spec, ReefLocationCard, Location hero, Plan your trip, Gear, Photo policy). Where the spec defers visual detail to the two filter mockups (`.working/filter-layout-A-horizontal-bar.html`, `.working/filter-layout-B-left-rail.html`), the mockups were inspected directly — they are the declared source of truth for the layouts.

**Headline.** The behavioral spec for filters is sound and the §8 floor is genuinely strong (mark+text in-season indicator, `aria-pressed` on filter checkboxes, native `<details>`, `<time>` wrapping, decorative-dot `aria-hidden`, ring-not-color-only). But the two reference mockups that the build will be cut from do **not** implement that floor: neither contains a single `<input>`, filter controls are non-focusable `<span>`/`<label>` shells, and the count badges have no accessible text. Those are the BLOCKs. Separately, the new `{colors.brand}/10` tinted-chip pattern fails AA contrast for the small text it carries.

---

## BLOCK findings

### BLOCK-1 — Filter controls are not real, keyboard-operable form controls (both layouts)
**Section:** §4.2; DESIGN "Atlas filter — two approved layouts"; mockups A & B.
**Issue.** Both referenced mockups contain **zero `<input>` elements**. In Layout A every wildlife tag is `<span class="opt">` and every category trigger is a bare `<button>` with no state wiring. In Layout B every checkbox is `<label class="chk"><span class="box"></span>…` with no `<input type="checkbox">` inside the label — the "box" is a decorative span. As built from these mockups, none of the reef-state / cert / region / month / thermal / wildlife controls are reachable by Tab, toggleable by Space/Enter, or announced as checkboxes by a screen reader. This directly violates the §8 floor ("Filter checkboxes: `aria-pressed` reflecting checked state"; "All interactive elements reachable by Tab in DOM order") and WCAG 2.1.1 (Keyboard) and 4.1.2 (Name, Role, Value).
**Fix.** Each filter option must be a real control: either a native `<input type="checkbox">` inside its `<label>` (preferred — gives free keyboard + SR semantics, and `<details>` grouping is fine around it), or a `<button role="checkbox" aria-checked>` / `<button aria-pressed>`. The Layout-A wildlife tags must become focusable toggle buttons with `aria-pressed`, not `<span>`. Update both mockups so the build inherits correct semantics, since the spec cedes visual truth to them.

### BLOCK-2 — Layout A dropdown triggers expose no expand/collapse state or popup semantics
**Section:** §4.2 ("ARIA for expand/collapse"); mockup A.
**Issue.** Each Layout A category is a `<button class="fbtn">` that opens a `.panel` div purely via class. There is no `aria-expanded` on the trigger, no `aria-controls`, no `aria-haspopup`, and the panel has no `role` (it is neither a `menu`, `listbox`, nor a labelled group). A screen-reader user cannot tell the button opens a panel, whether it is open, or that the wildlife panel contains grouped options. Fails WCAG 4.1.2 and the §4.2 requirement for expand/collapse ARIA. (Layout B avoids this by using native `<details>/<summary>`, which is correct — see NOTE-1.)
**Fix.** Layout A trigger: `aria-expanded={open}` + `aria-controls="panel-id"`; the panel gets a labelled grouping (e.g. `role="group" aria-label="Wildlife"` with each sub-group a nested `role="group" aria-label="Sharks & rays"` so the taxonomy is announced). Alternatively, render Layout A's panels as native `<details>` too (simplest path to parity with B).

### BLOCK-3 — Focus management on the Layout A dropdown and the mobile drawer is unspecified
**Section:** §4.2 ("focus management", "Mobile drawer focus trap"); §4.2 Mobile.
**Issue.** The spec describes opening (click) and closing (backdrop / "Done") of the mobile drawer and the desktop dropdowns, but specifies **no focus behavior**: no focus move into the opened surface, no focus return to the trigger on close, no Escape-to-close, and — critically for the full-height mobile drawer — **no focus trap**, even though §4.2 lists "Mobile drawer focus trap" as in-scope. Without a trap, keyboard/SR focus escapes behind the drawer to the obscured page. Compare §4.1, which fully specifies Escape/return for the search dropdown; the new filter surfaces have no equivalent. Fails WCAG 2.4.3 (Focus Order) and the team's own §8 keyboard promise.
**Fix.** Specify, for both layouts' dropdowns and the mobile drawer: (a) on open, move focus to the first control (or the panel container); (b) Escape closes and returns focus to the trigger; (c) the mobile drawer traps Tab within itself while open and sets `aria-modal="true"` + a label, with the backdrop `inert`/`aria-hidden` on the rest of the page; (d) the "Done" and backdrop-close paths both restore focus to the "Filters" trigger.

### BLOCK-4 — Count badges convey state with no accessible text
**Section:** §4.2 (count badges, sub-group active-tag count); DESIGN Layout A `.count`, Layout B `.badge`, region continent count badge; mockups.
**Issue.** Active-filter counts render as bare numerals in a colored pill — Layout A `<span class="count">2</span>`, Layout B `<span class="badge">2</span>`, sub-group header "count badge of active tags." A screen reader announces "2" with no context ("2 what?"), and on the collapsed Wildlife facet this "2" is the *only* signal that filters are active inside. Fails WCAG 1.3.1 / 4.1.2 (the number's meaning is conveyed by visual placement alone).
**Fix.** Give each badge accessible text: e.g. `<span class="count" aria-label="2 active wildlife filters">2</span>`, or a visually-hidden suffix ("2 active"). The same applies to the live result count "Showing N locations" — confirm it lives in an `aria-live="polite"` region so count changes on filter toggle are announced (see FLAG-6).

---

## FLAG findings

### FLAG-1 — `{colors.brand}/10` tinted chips fail AA contrast for small text
**Section:** §4.2 active filter chips; §4.10; DESIGN "Active chips bar" (`bg-[#0089de]/10 text-[#0089de]`), Layout A active tag (`bg-[#0089de]/10 ... text-[#0089de]`), Layout A active button (`bg-[#0089de]/8 ... text-[#0089de]`), Layout B checkbox-on / month chip patterns.
**Issue.** `#0089de` on white is ≈3.6:1 — already below the 4.5:1 small-text threshold. The new active-chip and active-tag patterns put `#0089de` text on a `#0089de` 8–10% tint (an even lighter-than-white-feeling but actually slightly *darker* bluish field), and the text sizes are small (`text-[0.76rem]`, `text-[0.78rem]`, `text-[11px]`). These combinations do not meet WCAG 1.4.3 (4.5:1 small text). The §8 floor explicitly requires AA for small text on all surface layers; this new token combo breaches the team's own floor.
**Fix.** Darken the text token for these chips to `{colors.brand-dark}` `#1d5d90` (≈5.9:1 on white, comfortably AA) or the under-pressure pill text `#1f57c8`, while keeping the brand tint background. Do not rely on `#0089de` for any text at body/caption size. (Note: `#0089de` is acceptable for large/bold headings ≥18.66px and for non-text UI like the active border, which only needs 3:1.)

### FLAG-2 — emerald/amber/slate pill text tones: mostly pass, but verify the in-season chip
**Section:** §4.3 meta row; DESIGN ReefLocationCard meta row (`bg-emerald-50 text-emerald-700`), skill chip (`bg-[#e8f0fe] text-[#1d5d90]`).
**Issue / status.** Spot-checked the new card meta-row combos:
- In-season chip `text-emerald-700` (#15803d) on `bg-emerald-50` (#ecfdf5) ≈ 5.4:1 — **passes AA** for the `text-[11px]` it carries. Good.
- Skill chip `text-[#1d5d90]` on `bg-[#e8f0fe]` ≈ 6.8:1 — **passes**. Good.
These specific relocated-chip combos are fine; flagging only so the build does not "simplify" the in-season text to `text-emerald-600`, which would drop below 4.5:1 at this size.
**Fix.** Keep `text-emerald-700`/`text-[#1d5d90]` exactly; do not lighten. No change needed beyond holding the line.

### FLAG-3 — Multiple "→" links in Plan-your-trip lack distinct accessible names
**Section:** §4.13a; DESIGN "Plan your trip block" (each row: label `text-[0.875rem]` + `→` in `text-slate-400`).
**Issue.** The block stacks several affiliate/booking rows, each ending in a decorative `→`. If the `→` is read and the visible label is just an operator/hotel name, link purposes can collide or read ambiguously out of context (WCAG 2.4.4 Link Purpose; 2.4.9 AAA is stricter but 2.4.4 applies). Also the combined "Stay + dive" row carries a `font-mono` tag whose relationship to the link name must be in the accessible name.
**Fix.** (a) Mark the `→` `aria-hidden="true"` (it is decoration). (b) Ensure each row's accessible name is self-describing, e.g. "Book [Resort name] (opens in new tab)" rather than the bare name; the "stay + dive" tag should be part of the accessible name ("[Liveaboard] — stay + dive"). This also satisfies §8's decorative-element rule for the arrow glyph.

### FLAG-4 — "Opens in new tab" is not announced for affiliate links
**Section:** §6.4 (external links open `target="_blank"`); §4.8 AffiliateLink; §4.13a, §4.14, §7.3 sidebar.
**Issue.** §6.4 mandates `target="_blank" rel="noopener noreferrer"` for all affiliate/partner links (Plan-your-trip, Gear Amazon links, sidebar operators), but nothing in the spec requires telling the user the link opens a new tab. Unexpected new-tab/context change without warning is a WCAG 3.2.5 (AAA) concern and a common AA-program failure; for SR and cognitive users it is disorienting. The §8 floor covers focus state but not new-tab announcement.
**Fix.** AffiliateLink should append a visible or visually-hidden "(opens in new tab)" to its accessible name, or render an `aria-hidden` external-link icon paired with SR-only text. Add this requirement to §4.8 and/or the §8 floor so it is enforced everywhere external links appear.

### FLAG-5 — Gear Layer A / Layer B not specified as semantic lists; emoji decoration not marked
**Section:** §4.14; DESIGN "Gear section" (Layer A "list of items as rows, each an emoji/icon + name + short note").
**Issue.** Layers A and B are conceptually lists of gear items but the spec describes them as "rows," not `<ul>/<li>`. Without list markup, SR users lose item count and list boundaries (WCAG 1.3.1). Separately, the leading emoji/icon per row is decorative relative to the text label that follows ("5mm wetsuit — 24°C water"); §8 requires decorative elements be `aria-hidden`, but the gear emoji is not called out.
**Fix.** Render Layer A and Layer B each as a `<ul>`; each gear item an `<li>`. Mark the leading emoji/icon `aria-hidden="true"` (the text name carries the meaning, per §8). Confirm the Layer B reason text ("Reef hook — strong current on the corner") is part of the item's text, not conveyed by the icon. The empty-state rule (no empty Layer B heading) is already correct and helps SR users — good.

### FLAG-6 — Sticky filter + independently scrolling results: keyboard reachability and live-count announcement need to be pinned down
**Section:** §4.2 sticky behavior (both layouts); §7.1; DESIGN Layout B rail `sticky ... overflow-y-auto`, Layout A `sticky top-0 z-40`.
**Issue.** Two related gaps: (a) Layout B's rail is `max-h-[calc(100vh-…)] overflow-y-auto` — if its facets overflow, keyboard users must be able to scroll the rail to reach lower facets; a sticky overflow container is fine *if* every facet control is in Tab order (depends on BLOCK-1 fix) — confirm Tab reaches facets below the fold and the focused control scrolls into view. (b) The live result count ("Showing N locations") updates on every filter change but is not declared as a live region, so SR users toggling filters get no feedback that results changed.
**Fix.** (a) Verify focus-visible scroll-into-view within the sticky rail and the Layout A panel. (b) Wrap the result count / results summary in `aria-live="polite"` (and `role="status"`), so each filter toggle announces the new count. No focus-trap risk was found in the *sticky bar* itself (it is not modal) — the trap concern is the mobile drawer only (BLOCK-3).

---

## NOTE findings

### NOTE-1 — Layout B's native `<details>/<summary>` grouping is the right call
**Section:** §4.2 Layout B; §8 ("Disclosure drawers: native `<details>/<summary>` — no ARIA workarounds"); mockup B.
The nested-collapsible wildlife taxonomy uses real `<details>/<summary>` with `<h3>` headings in the summary — this gives free keyboard operability and expand/collapse semantics for the *grouping*, and the nested sub-groups are reachable. This is handled well and is the model Layout A should copy (see BLOCK-2). The only caveat: once BLOCK-1 is fixed, ensure the `<h3>` inside `<summary>` does not create an odd heading-in-button announcement — a plain bold `<span>` is usually cleaner than a real heading inside an interactive summary.

### NOTE-2 — Wildlife sub-group headers: confirm they are programmatic group labels, not just visual
**Section:** §4.2 wildlife taxonomy; mockups (A `<h4>`, B `<summary>`).
The four sub-groups (Sharks & rays / Marine mammals / Reptiles & pelagics / Macro & critters) read as visual headers. In Layout B they are summary labels (good). In Layout A they are `<h4>` floating above an `.opts` div with no programmatic association to the options beneath. After BLOCK-2, ensure each sub-group's tags are wrapped in a `role="group"` named by the sub-group label, so "Hammerheads" is announced within "Sharks & rays." The data-coverage rule (every tag resolves to ≥1 location, no empty filters) is good practice and avoids the dead-control trap — noted positively.

### NOTE-3 — Photo policy alt text: location hero is informative, inspiration cards likely informative
**Section:** §5.5a; §7.2 step 2; DESIGN "Location hero", "Photo policy".
The §8 floor already mandates `alt` on every `<img>` (informative = meaningful, "site name at minimum"; decorative = `alt=""`). The new borrowed-photo hero and inspiration cards are **informative** (they represent a place), so each needs a meaningful alt — e.g. "Underwater reef at [location]" or the borrowed site's name — not `alt=""`. The spec does not state this for the new surfaces; recommend §5.5a explicitly say the borrowed photo's alt should name the location (and ideally the source site), and that the gradient base layer (when a photo is present) is purely decorative and needs no alt. Not a BLOCK because §8 already covers the general rule; flagging so the new surfaces are not treated as decorative by default.

### NOTE-4 — Hero content contrast over the legibility overlay: specified, verify in build
**Section:** §5.5a; DESIGN "Location hero" legibility overlay.
The hero overlays white content (breadcrumb, reef-state pill, H1) over an arbitrary borrowed underwater photo, with a dark top-to-bottom legibility gradient (`rgba(2,20,34,0.45)` → `0.25` → `0.55`). Content is pinned to the bottom where the overlay is darkest (0.55), which is the right instinct. Risk: the *middle* band sits at 0.25 over potentially bright/sandy underwater shots — if any hero content lands there, white text can fall below 4.5:1 (WCAG 1.4.3). Since content is bottom-pinned this is probably fine, but it is photo-dependent and unverifiable from spec alone.
**Fix/confirm:** Ensure all hero text sits within the bottom 0.55-opacity band, or strengthen the bottom stop, or add a localized text-protection scrim behind the H1/breadcrumb. Add a build-time check that white-on-photo meets 4.5:1 at the text position. The reef-state pill carries its own solid tinted bg so it is self-sufficient.

### NOTE-5 — Plan-your-trip equal-weight peers and "Plan thoughtfully" variant: no heading-order problem found
**Section:** §4.13a; §5.6; §7.2 step 12; DESIGN "Plan your trip block".
The restructure makes "Getting there" lead and accommodation + operators equal-weight peers under one block. Each group has a `font-mono` uppercase eyebrow ("Getting there" / "Where to stay" / "Operators") plus a `text-[0.8125rem] font-bold` heading. As long as these map to a single consistent heading level (e.g. all `<h3>` under the block's `<h2>`), making them visual peers does **not** create a heading-order skip — handled correctly. The "Witnessing change" muted variant keeps all links (no removal) and only softens contrast — confirm the muted treatment does not push link/heading text below 4.5:1 (it "reduces contrast" per DESIGN), which would convert this NOTE into a FLAG. The "no generic-search CTA / no synthesized dead link" rule also removes a confusing no-op control — an accessibility win for everyone.

---

## Cross-reference to the §8 floor

| §8 floor item | Session-2 status |
|---|---|
| Filter checkboxes `aria-pressed` | **Violated by mockups** (BLOCK-1) — controls are not inputs |
| Keyboard nav: all interactive reachable by Tab | **At risk** (BLOCK-1/3) until controls are real + drawer trap specified |
| Disclosure drawers native `<details>` | **Met** in Layout B (NOTE-1); Layout A should adopt (BLOCK-2) |
| Decorative elements `aria-hidden` | Gaps on count badges (BLOCK-4), `→` arrows (FLAG-3), gear emoji (FLAG-5), sub-group chevrons |
| In-season indicator mark + text | **Met** — DESIGN renders `●` + "In season" (FLAG-2 confirms contrast) |
| Images: alt on every `<img>` | General rule met; new hero/inspiration surfaces need explicit informative alt (NOTE-3) |
| Color contrast AA on all surfaces | **Violated** by `{colors.brand}/10` chip text (FLAG-1) |
| Links: visible focus state | Not regressed; ensure new filter controls + chip `×` buttons get the focus ring |

## Top priorities
1. **BLOCK-1** — make every filter control a real, keyboard-operable input across both layouts (the mockups ship zero inputs).
2. **BLOCK-3** — specify focus management + a mobile-drawer focus trap (currently absent though listed in scope).
3. **FLAG-1** — fix `{colors.brand}/10` chip text contrast (darken to `#1d5d90`/`#1f57c8`); it breaches the spine's own §8 AA floor.

---
story: 10
title: SEO polish — sitemap, metadata, OG, schema.org
status: Draft
epic: NFR
prd_refs: [FR1.6, FR1.7, NFR1, NFR2, NFR3, NFR5]
arch_refs: ["§3 Routes", "§9 Build & Deploy"]
depends_on: [2, 6, 7]
---

# Story 10 — SEO polish

## Story

As the operator, I need every site and location URL indexable with unique title, description, OG image, schema.org `Place`/`TouristAttraction` markup, plus a generated sitemap and clean robots, so the species-chaser SEO play actually compounds.

## Context

SEO polish happens after the core pages exist so metadata, sitemap entries, and schema.org markup can be generated from real data. This story turns the content depth built in earlier stories into crawlable search inventory.

## Acceptance Criteria

- AC1: `/sites/[slug]` and `/locations/[slug]` set unique `metadata.title` + `metadata.description` from data (FR1.7).
- AC2: OG image generation per site — uses Next.js `opengraph-image` convention (file exists: `src/app/opengraph-image.tsx`; replicate for routes).
- AC3: Schema.org JSON-LD on detail pages: `Place` or `TouristAttraction` with `geo` coords, `name`, `description`, `image` (NFR2). `src/components/json-ld.tsx` and `src/lib/schema-org.ts` exist — reuse.
- AC4: `sitemap.ts` (already in repo) emits every Location + Site URL; revalidates on build.
- AC5: `robots.ts` (already in repo) allows all crawlers; affiliate outbound paths excluded if any are introduced.
- AC6: LCP < 2.0s on 4G for detail pages (NFR1). Use Next.js `<Image>` with `priority` on hero only.
- AC7: WCAG AA on text contrast across the redesigned globe-bright theme; keyboard nav works on filter bar, chips, edit popover (NFR3). Globe has a non-3D fallback (NFR3 — covered by Story 6/7 list views).
- AC8: No cookie banner (NFR5, PRD A7/A9 — cookieless Vercel Analytics already confirmed in Story 8).

## Dev Notes

- This is mostly polish on top of Stories 2/6/7 — do not block earlier stories on it.
- `src/lib/schema-org.ts`, `src/components/json-ld.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx` all already exist. Audit before writing.
- Run Lighthouse on `/sites/manta-point-maldives` post-Story-3 to baseline LCP.

## Tasks

- [ ] Audit existing SEO files; list what's already done
- [ ] Add per-route `generateMetadata` filling title/description/OG
- [ ] Wire `Place` JSON-LD on detail pages
- [ ] Add per-site `opengraph-image` route or generation
- [ ] Verify sitemap includes all Site + Location URLs
- [ ] Lighthouse pass — fix LCP regressions
- [ ] Keyboard nav audit on filter UX (Story 5)

## File Pointers

- Modify: `src/app/sites/[slug]/page.tsx`, `src/app/locations/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, `src/components/json-ld.tsx`, `src/lib/schema-org.ts`

## References

- PRD §6 NFRs, §5 FR1.6/FR1.7
- Architecture §3, §9

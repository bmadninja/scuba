# Parked when moving hosting from Vercel to Cloudflare Pages (Nov 2026)

The site is now a static export (`output: "export"` in next.config.ts), served
by Cloudflare Pages. These routes need a Node server, so they were moved out of
`src/app` (Next.js would refuse to build them):

- `app-api/submit-sighting`, `app-api/submit-reef-survey` — wrote JSON to the
  server's disk, which never persisted on Vercel either. Replaced for now by
  `functions/api/*.js` (Cloudflare Pages Functions) that return a
  "submissions paused" message.
- `app-api/taxa/search` — replaced 1:1 by `functions/api/taxa/search.js`.
- `site-species/[species]` — ~10,000 per-site species pages that Vercel rendered
  on demand. `public/_redirects` sends them to `/species/<species>/`.

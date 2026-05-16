# Affiliate setup

How affiliate tracking works in this codebase, and the checklist for getting each program live.

## How it works

1. Each partner has a single env var holding the tracking ID (see `.env.example`).
2. Site/gear data references partners by **name** only (e.g. `"partner": "Booking.com"`).
3. At render time, `<AffiliateLink>` calls `enhanceAffiliateUrl(url, partner)` ([src/lib/affiliate.ts](../src/lib/affiliate.ts)) which appends the correct tracking parameter for that partner.
4. When an env var is empty, the link works without tracking — graceful degradation. You don't have to wait for all programs to approve before deploying.

## To activate a program

1. Apply at the signup link below.
2. Wait for approval (instant to ~2 weeks depending on program).
3. Find your tracking ID in the partner dashboard.
4. Set the env var on Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_TRAVELPAYOUTS_AID
   # paste the value, choose Production + Preview + Development
   ```
5. Redeploy. Every link for that partner is now tagged.

To verify locally before deploying, drop the value into `.env.local` and reload `npm run dev`.

## The checklist

| Program | Status | Apply | Env var | Param appended |
|---|---|---|---|---|
| **Travelpayouts** (flights via Skyscanner) | TODO — CAPTCHA blocked Squish | https://travelpayouts.com/en/join | `NEXT_PUBLIC_TRAVELPAYOUTS_AID` | `?marker=` |
| **Amazon Associates** (gear) | TODO | https://affiliate-program.amazon.com | `NEXT_PUBLIC_AMAZON_TAG` | `?tag=` |
| **Booking.com** (via CJ Affiliate) | TODO — CAPTCHA blocked | https://public.cj.com/signup/publisher | `NEXT_PUBLIC_BOOKING_AID` | `?aid=` + `&label=scubaseason` |
| **PADI Travel** | Account created — affiliate status unclear | https://travel.padi.com/affiliates | `NEXT_PUBLIC_PADI_PARTNER` | `?partner=` |
| **Liveaboard.com** | Application submitted, awaiting approval | — | `NEXT_PUBLIC_LIVEABOARD_AID` | `?partnerid=` |
| **DiveBooker** (180-day cookie) | ✅ Approved 2026-05-15, ID `645` | — | `NEXT_PUBLIC_DIVEBOOKER_PID` | `?afid=` |
| **SCUBAPRO** (10% gear commission) | TODO | https://scubapro.johnsonoutdoors.com/us/affiliate-program | `NEXT_PUBLIC_SCUBAPRO_AID` | `?aid=` |
| **Bluewater Travel** | Agency — no programmatic affiliate | — | none | pass-through |

## Verifying tracking parameters

The exact param name (`?marker=`, `?aid=`, `?partner=` etc) is a **best guess** until each program approves you. Each dashboard will document the official parameter. If a program uses a different one, update the mapping in [src/lib/affiliate.ts](../src/lib/affiliate.ts) — one branch per partner in `enhanceAffiliateUrl()`.

## FTC compliance

Every page with affiliate links must visibly disclose. Currently:
- `/about` has the full disclosure
- Pages with links link to `/about` (small "Some links earn us a commission" copy was removed — restore by re-importing `AffiliateDisclosure` if FTC review asks)

## Bookkeeping

Squish reportedly maintains `accounts.md` with credential records. Treat the shared password `ScubaSeason2026!@` as compromised the moment it appeared in chat — rotate it on any account that's actually been created.

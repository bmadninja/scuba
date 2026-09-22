# Operator handoff protocol

How news-operator analysis gets delivered to — and actioned by — the other
operators. Before this protocol existed, the news operator only *labeled*
handoffs inside its own charter (`ops-docs/docs/news-charter.md`), a file no
other operator reads, so nothing was ever picked up.

The rule now: **a handoff is not logged, it is delivered into a place the
recipient already reads every run.** A dedicated Routine — the
**news-handoff dispatcher** (daily 00:30 UTC, right after the news operator's
23:37 UTC run) — reads the news charter's Open Threads table, delivers every
undelivered handoff to its destination below, marks the thread
`delivered ✓date`, and on later runs reconciles completions back into the
thread. Each channel has a pickup contract so the dispatcher can verify
completion and close threads.

## Channels

| Signal type | Recipient | Delivery mechanism | Pickup contract |
|---|---|---|---|
| `[Partner]` — new MPA authority, research program, methodology, dive-industry org | gtm-operator (daily 11:15 UTC) | Dispatcher appends a row to the `## Inbox — from news operator` section of `ops-docs/docs/gtm-charter.md` (creates the section if missing) | gtm-operator actions or declines every OPEN inbox item each run, marks it DONE/DECLINED with date |
| `[Reef]` — bleaching alert, heat anomaly, storm/typhoon, sargassum, bloom | reef-operator (daily 12:45 UTC, new Routine) | Dispatcher appends a row to `ops-docs/docs/reef-inbox.md` (creates if missing) | reef-operator assesses each OPEN item against covered locations + live reef data, writes `ops-docs/docs/reef-log.md`, marks the item DONE |
| `[Location]` — new MPA / reef discovery / newly diveable region NOT in our 355+ covered locations | max-haiku-discovery (every 5h) | Dispatcher files a GitHub issue on `bmadninja/scuba` labeled `discovery-candidate` (dedupes against existing issues first) | Discovery run checks open `discovery-candidate` issues: fills sites if the location exists in `locations.json` and closes the issue; otherwise comments that a new `locations.json` entry needs Josie's approval and leaves it open |
| Grant-relevant signal | grants-operator (daily 11:30 UTC) | When a `[Partner]` item directly affects a grant in flight, the dispatcher mirrors the inbox row into an identical section in `grants-charter.md` | Same OPEN → DONE contract |

## Closing the loop

On every run the dispatcher:

1. Delivers every OPEN/MONITOR thread whose handoff is not yet marked
   `delivered ✓YYYY-MM-DD` in the Open Threads table, then marks it.
   (Idempotent — re-runs never re-deliver.)
2. Checks destinations for completion: gtm/grants inbox rows marked DONE or
   DECLINED, reef-inbox rows DONE, `discovery-candidate` issues closed.
   Matching news-charter threads are advanced or closed with the outcome
   recorded; issues blocked on a new `locations.json` entry are flagged
   `blocked on Josie` on the thread.

So thread state in `news-charter.md` always reflects real downstream status,
not hope.

## Where the pieces live

- The news, gtm, grants, and product operator Routines were created via the
  HTTP API and can only be edited by Josie (agents cannot update them) — so
  they are left untouched. The dispatcher composes with the existing news
  operator instead of replacing it. If Josie ever folds the dispatcher's
  delivery steps into the news-operator prompt itself, the dispatcher Routine
  can be deleted.
- New Routines added for this protocol (created via this session, editable by
  agents): `ScubaSeason — news handoff dispatcher`
  (`trig_01LKbsEqbTzZevhKsr3YrZia`, daily 00:30 UTC) and
  `ScubaSeason — reef operator` (`trig_016Mf2diBbpoJgVhBK3wvdaT`,
  daily 12:45 UTC).
- `.claude/prompts/max-haiku-discovery.md` (this repo) carries the
  `discovery-candidate` issue intake — the discovery Routine reads it from a
  fresh clone of `main`, so that change takes effect once merged.
- Charters and inboxes live in the private `bmadninja/scuba-ops-docs` repo;
  the dispatcher and reef operator bootstrap missing inbox files/sections on
  first delivery, so no manual setup is needed there.

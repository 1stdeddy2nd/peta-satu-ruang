# MC-070 — 30 days of fire history, on a timeline

- **Status:** DONE
- **Board:** sprint-04 (was backlog)
- **Type:** feature
- **Milestone:** MVP v1

## Why it moved off the backlog
The product owner asked for it back: a date selector and a play button, so
the month can be watched and you can see where a fire started and how it
spread. It was built once in the first sprint-04 attempt (00bf089, and a
timeline in the discarded dashboard) and went when sprint 04 restarted from
9f1d3a9 — not for any fault. Its table and migrations were still in the dev
database, so main and the database disagreed until this revival.

## Functionality
- Under Titik Api, a timeline above the dock: a bar per day for the last 30
  days, a slider, a play button that steps a day at a time and stops at the
  end, and a window button for 1, 3, 7 or 30 days. A window wider than a day
  ends today. Default is today (WIB).
- The map, the card's count and chips, and the timeline all show the same
  window; bars count only the confidence bands shown.
- Only Indonesia: each detection is stamped with the village it falls in, and
  untagged ones (Sarawak, Sabah, PNG, Timor-Leste, sea) are left out — on the
  editor's live layer too, which now reads the same table.
- The pulse (MC-083) marks high-confidence detections from the last 6 hours,
  so it shows only when the window includes now.
- The popup (MC-083) shows the real date of a detection in any window.

## Implementation
- Restored from 00bf089 as it was: the `FireHotspot` model and its three
  migrations (already applied to the dev database), FIRMS ingestion that asks
  NASA only for days the table lacks (today refreshes on a 10-minute TTL), a
  rolling 30-day prune, `GET /api/fire-hotspots/history` (day summary, or a
  day/window of points filtered by band on the server), and
  `POST /api/admin/fire-history/backfill` for a fresh database.
- Changed from 00bf089: both routes require sign-in (the dashboard is not
  public yet) and past days are cached `private`; the live route serves the
  table marked stale when FIRMS is down instead of failing; each point carries
  its satellite and its epoch minute (payload version 4), so a multi-day
  window can date its points.
- The village tagging pass is bounded to recent rows. As restored, it
  re-tested every untagged detection on each refresh — the 13,142 outside
  Indonesia never match — which cost 4.3s on the request that opened today's
  fires; now ~0.8s.
- Client: `MapProvider` takes `fireHistory`; the dashboard's layer then follows
  the timeline instead of polling the live feed. Past days are cached in
  memory and the next day is prefetched during play.

## Measured
- The table holds 242,976 detections for 11 Aug – 10 Sep.
- Today at high confidence: 335 points, 20 KB; a 7-day window: 3,621.
- The first request of a day that refreshes from FIRMS takes ~6 s; after that
  a day is a 20 ms table read.
- Removed the 25,000-point cap the initial restore carried over from 00bf089
  (query only, not a size guard the way the buildings caps were — see
  MC-065's own "Later" note on removing those). Real worst case measured
  here, the full 30 days with every confidence band on: 235,326 points,
  1.9 s query, 14 MB raw / 3.6 MB gzipped — lighter than a single city's
  buildings already accepted uncapped (MC-082's Kota Bandung: 8.2 MB). The
  `truncated` field this produced was dead code besides — never read on the
  client, so a capped window silently showed fewer points with no way to
  tell.

## Non-goals
- Not an archive: 30 days rolling. Not real time (MC-075).
- No proximity ring (MC-076).

## Acceptance criteria
- [x] The timeline shows 30 days; a bar or the slider picks a day and the map follows.
- [x] Play steps day by day and stops at the end; pause holds the day.
- [x] The window button switches 1, 3, 7 and 30 days, and the card, timeline and map agree.
- [x] Only detections inside Indonesia are shown.
- [x] Turning Titik Api off removes the timeline and stops playback.

## Redesigned by MC-087

The day-by-day timeline became one shared time window for every hazard, so
"when" is a property of the map rather than of the fire layer: presets of 1
jam, 24 jam, 7 hari and 30 hari, a replay that makes events appear at their own
timestamps at 1×/2×/5×, and a scrubbable bar. The per-layer spans, the day
bars and the "Putar 30 hari terakhir" button are gone; the 30-day history query
behind them is unchanged, except that the request now carries the window's
`from`/`to` and gets back a per-band tally for the levels it does not draw.

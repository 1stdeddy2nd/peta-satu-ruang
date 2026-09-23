# MC-092 — Remove the volcanic ash spread from the dashboard

- **Status:** DONE — confirmed by the product owner
- **Board:** sprint-04
- **Type:** removal
- **Milestone:** MVP v1

## Why

Asked for by the product owner while reviewing MC-087's event map: "remove
data of persebaran ash vulcanic". The ash extents (MC-084) were drawn as grey
polygons around erupting volcanoes and summarised in the volcano popup. On the
redesigned map they compete with the event markers they sit under, and they
are the one layer a reader cannot act on — the eruption status and the danger
zones already answer "is this dangerous, and how far".

The idea is parked, not rejected: MC-093 on the backlog.

## What was taken out

Client:

- The ash polygons on the map: the `kind: "ash"` features built in
  `showVolcanoes`, and `volcanoAshCloudStyle` in `map-utils.ts`.
- `ashSummaryToPlainId` and the "Sebaran abu (VAAC)" block and GDACS link in
  `VolcanoPopup.tsx`. The eruption's own ash-column height from PVMBG's
  reports stays — that is MAGMA's text, not GDACS's.
- `VolcanoCounts.withAsh`, `VolcanoMeta.ashStale`, `VolcanoFeatureProperties.ash`.

Server:

- `src/server/volcano-gdacs.ts` (deleted), `refreshGdacsAsh` in
  `volcano-ingest.ts`, the ash merge and `ashFetchedAt` in `volcano-queries.ts`,
  and the GDACS call in `/api/volcanoes`, which ran on every dashboard poll.
- `VolcanoAshCloud` / `VolcanoAshEvent` types, and the GDACS constants
  (attribution, TTL, match radius, recent days, `ASH_CACHE_ID`).
- The GDACS section of `THIRD_PARTY_NOTICES.md`, since we no longer use it.

Left alone:

- The `VolcanoEventCache` table, still used for the eruption-history state.
  Old GDACS rows stay in it, ignored; no migration was needed.
- `.claude/rules/03-gotchas.md` keeps its GDACS entries — they cost an
  afternoon each and are worth keeping if we go back.

## Bringing it back

`git log --grep MC-092` has the whole removal in one commit. The GDACS terms
(CC BY 4.0, attribution "Global Disaster Alert and Coordination System,
GDACS") and the endpoint details are in that commit's `THIRD_PARTY_NOTICES.md`
diff, and must go back into the file if the data returns.

## Acceptance criteria

- [x] No ash polygons on the map, and no ash block or GDACS link in the popup.
- [x] `/api/volcanoes` no longer calls GDACS, and volcano status still loads.
- [x] The map credits only the sources still on screen.

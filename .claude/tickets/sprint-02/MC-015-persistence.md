# MC-015 — Persistence via PostGIS + Prisma

- **Status:** DONE
- **Board:** sprint-02
- **Type:** feature
- **Milestone:** MVP v1

## Why
A refresh currently clears everything — all layers and the whole layout. For a
SaaS this is the single biggest gap before launch.

## Decisions
- **Database:** Railway Postgres with PostGIS, accessed through Prisma.
- **Files:** MinIO on Railway for uploaded originals — **deferred**. Restoring a
  session needs the *geometry*, which lives in PostGIS; keeping the original
  upload is a separate want. Deferring it removes a whole service from the MVP.
- **Ownership:** projects belong to the signed-in user from MC-043 — one
  seeded admin account for now, no Google.
- **Upload limits:** **25 MB per file, 200 MB per project.** Most admin-boundary
  datasets sit far below this, and anything larger is punishing to upload *and*
  to parse on the low-spec, low-bandwidth machine we build for. If real data
  outgrows the cap, the answer is server-side simplification, not a bigger cap.
- **Layout document versioning:** not in v1 — see MC-036.
- **Map view (centre / zoom / scale): stored in the database**, as part of the
  layout document.

### Why the map view goes in the database, not IndexedDB
It is four numbers in the same JSON column as the rest of the layout, so the
cost is not storage — it is **write frequency**. Panning fires `moveend`
continuously, so the fix is to debounce the autosave (roughly 2s of idle, plus
a flush on navigate away), not to move the data somewhere else. That is a small
amount of work and gives the Figma-like feel you are after.

IndexedDB would tie the view to one browser, which loses the very thing that
makes it worth saving: reopening a project on another machine and finding it
where you left it.

IndexedDB is still worth using later — but for the **uploaded geometry**, which
is big and expensive to re-fetch. Caching features locally means a reload does
not pull everything back from MinIO, which matters most on a slow connection.
That is its own ticket when we get there.

- **Local development runs Postgres + PostGIS in Docker** (`docker-compose.yml`),
  so building does not depend on Railway existing or on a network.
- **Undo/redo is not stored here.** See MC-025: undo is in-memory editing state.
  The database-backed cousin is version history, MC-036.

## Staged delivery
This is too big for one change, so it lands in three:

1. **Foundation** — Docker Postgres+PostGIS, Prisma, schema, migration, and the
   `make db-*` targets. **Done**: migration applied, geometry verified storing
   and reading back in EPSG:3857, cascade delete confirmed.
2. **Save and load** — API routes, debounced autosave, and restore on open.
   Projects are owned by a signed-in user, so **MC-043 lands first**: doing it
   the other way means writing an anonymous-cookie owner and then throwing it
   away. **Done**: `GET/PUT /api/project` and `POST/DELETE /api/project/layers`,
   a 2s-idle autosave of layout + layer metadata (never feature geometry — that
   writes once at upload time), and restore-on-mount rebuilding the OL vector
   sources from stored GeoJSON. One project per signed-in user; no name/list UI
   yet, that is stage 3.
3. **Polish** — named projects, a project list, delete. Split out to MC-049;
   one implicit project per user is enough to ship stages 1+2.

### Notes from building it
- Prisma does **not** manage the PostGIS extension. The docker image ships
  postgis plus tiger_geocoder and topology, which Prisma reads as drift and
  wants to reset away on every `migrate`. The first migration runs
  `CREATE EXTENSION IF NOT EXISTS postgis` instead, so a plain Postgres such as
  Railway works the same way.
- Prisma reads `.env`, not `.env.local`. `.env.example` is committed as the
  template; `.env` stays ignored.

## Schema shape
- `Project` — owner key, and the whole layout as one JSON blob. It is always read
  and written whole and its shape is still moving, so splitting it into tables
  now would buy nothing.
- `Layer` — name, colour, opacity, visibility, ordering, and the categorised
  styling from MC-024.
- `Feature` — properties plus **real PostGIS geometry** in EPSG:3857, not GeoJSON
  in a JSON column, so MC-029's plugins can query server-side. Prisma cannot type
  a PostGIS column, so `geom` is `Unsupported` and goes through raw SQL with
  `ST_GeomFromGeoJSON` / `ST_AsGeoJSON`.

## Functionality
- Persist uploaded features as real PostGIS geometry, so analysis plugins
  (MC-029) can query them server-side rather than in the browser.
- Persist the layout document: page settings, template, map frame, regions,
  elements, and the map view.
- Debounced autosave; explicit save is not required of the user.
- Save and reload a named project.

## Acceptance criteria
- [x] Reloading restores layers, layout and map position exactly. Verified in
      a real browser: upload, pan, reload — layer, features and view position
      all come back.
- [x] A project reopens in a new session, on a different machine. Follows from
      the project being keyed by user id in Postgres, not browser storage.
- [x] Panning the map does not produce a write per frame — confirmed only a
      single debounced `PUT` fires after 2s idle, not one per `moveend`.
- [x] Files over the cap are rejected with a clear message, before upload —
      verified the 25MB-per-file toast; the 200MB-per-project check follows
      the same code path but wasn't independently exercised.

### Notes from stage 2
- `ST_GeomFromGeoJSON` does not read an SRID off the coordinates — it defaults
  to 4326 regardless of what the numbers actually are. Since features are
  already in EPSG:3857 by the time they reach the server, the insert needs
  `ST_SetSRID(ST_GeomFromGeoJSON(...), 3857)` or every insert fails with
  "Geometry SRID (4326) does not match column SRID (3857)".
- Feature geometry is written once, at upload time (`POST /api/project/layers`),
  and removed once, on layer delete (`DELETE /api/project/layers/[id]`) — never
  resent by the periodic autosave. That keeps the 2s-idle save small (layout +
  layer metadata only) regardless of how much geometry a layer holds.

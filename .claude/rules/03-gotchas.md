# Gotchas

The project's memory. Every line here cost someone an afternoon once.

Add to it whenever something behaves unexpectedly. **One entry = one symptom
and its fix.** The story of how it was found belongs in the ticket, not here —
this file is read by someone mid-debug who needs the answer in a line.

## Third-party APIs

- **Read `robots.txt` before calling a source "no stated terms".** MAGMA
  Indonesia has no licence page, which looked like a grey area for eight
  rounds of MC-084 — its `robots.txt` is `Disallow: /` for everyone, a stated
  no to any scraper.

- **Wikidata's "volcano" class is not Indonesia's volcano list.** It gave 139
  items against Badan Geologi's 127 — mud volcanoes, sub-cones, extinct peaks
  in, official ones missing. Check a catalog's total against the authority's
  published count before drawing it.
- **Wikidata's SPARQL endpoint 403s a request with no identifying
  `User-Agent`** — Node's default fetch UA counts as unidentified under
  Wikimedia's own policy. A `curl -A "..."` test can pass while the real
  server code (no UA header) gets blocked. Send a descriptive UA.
- **GDACS's `SEARCH` endpoint silently ignores an unrecognised query param**
  instead of erroring — `eventtypes=VO` returns every hazard type, not just
  volcanoes; the correct param is `eventlist=VO`. Verify against its own
  quickstart PDF, not a plausible-looking param name.
- **PVMBG reports time in WIB, WITA *or* WIT** depending on the volcano (Ibu
  uses WIT). A WIB-only assumption shifts eastern eruptions by up to two hours,
  and a regex listing `WIT` before `WITA` reads every WITA time as WIT.
- **Node's `fetch` has no practical timeout** — a stalled upstream holds the
  request for minutes, and a route awaiting it hangs with it (`/api/volcanoes`
  never answered during a network blip). Pass `signal:
  AbortSignal.timeout(...)` on every third-party call a route waits on.
- **One danger radius under-warns.** PVMBG recommendations are often sectoral —
  Semeru: 13 km south-east, lahar to 17 km, a 5 km radius only for flying rock.
  Show the furthest distance named, never the first "radius N km" matched.

## OpenLayers

- **`ol/Map` shadows the native `Map`** — import it as `OlMap`.
- **`updateSize()`** must run after the map's container changes size (frame
  resize, canvas zoom, mode switch), or the canvas renders at a stale size.
- **View changes go through `useMap()` actions** (`centerOn`, `applyScale`),
  which animate. Writing to the store alone does not move the map.
- **Tile sources need `crossOrigin: "anonymous"`** or the basemap exports blank.
- **A cached map-data URL keeps its old answer after the server changes it.**
  With `max-age=86400`, a browser that loaded a tile before a rendering change
  kept showing it for a day, so one zoom level looked nothing like the next.
  Version the URL when the query changes, and test with the cache emptied.
- **A `postrender` hook on a `VectorImage` layer does not animate.** It fires
  only when the layer's image redraws, so `map.render()` on a timer leaves the
  drawing frozen — and the frame rate still reads 60 fps. Animate a separate
  small `VectorLayer` and call its `changed()`; check the canvas pixels change.
- **`ol/layer/Heatmap` is WebGL, and headless Chromium runs WebGL on the CPU
  (SwiftShader).** Panning a heat map there froze 14–24s; with the GPU it was
  smooth. Measure with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`,
  and remember a machine whose GPU Chrome blocks gets the SwiftShader number.
- **Scanning the canvas for a marker's colour picks the wrong marker.** A
  walkthrough that clicked "the reddest pixel" opened the volcano popup: an
  erupting volcano's badge is red like a hotspot's and draws above it. Click a
  feature's own projected coordinates instead, and check which popup opened.
- **A `Cluster` source filtered by `geometryFunction` does not re-filter by
  itself.** It only re-clusters when its source or the resolution changes, so
  a moved time window leaves stale clusters on the map. Call `refresh()` on
  the cluster whenever the filter's inputs change.
- **A `VectorSource` shows no credit unless you pass `attributions` to its
  constructor** — silently. Tile sources (`OSM`, `XYZ`) take the same argument
  and "just work", so the vector case looks handled when it isn't. Check the
  rendered `.ol-attribution` control, not the API response.

## Layout and canvas

- **A dropdown left in normal flow becomes a flex item of the bar it hangs
  from.** The search results list stretched the dashboard's top row to 538px,
  which re-centred the logo into the middle of the map and pushed the counts
  row down over the markers — it read as a layout bug anywhere but the search.
  Position a result list `absolute` under its field.

- **`scale={canvasZoom}` on every `Rnd`** — the sheet is CSS-scaled, so without
  it drags drift from the cursor.
- **No HTML5 drag-and-drop for lists** — no touch support, can't be confined to
  a drag handle, and it drags an unwanted ghost image. Use pointer events.

## UI library

- **A media query read in `useEffect` paints the wrong breakpoint first.**
  `useState(false)` + `useEffect` means a card mounting on a tap renders its
  desktop shell for one frame and visibly swaps to the mobile drawer. Read it
  during render with `useSyncExternalStore` (`lib/use-media-query.ts`).

- **Base UI `Select.Value` renders the raw value**, not the item label, unless
  the root is given an `items` map. Always go through `atoms/SelectField`.

## Auth

- **Auth.js v5 needs `trustHost: true`** anywhere but Vercel. Without it every
  request fails with `UntrustedHost` and the sign-in page silently does nothing.
- **A spec that must start signed out** overrides the shared `setup` project's
  saved session: `test.use({ storageState: { cookies: [], origins: [] } })`.

## Database

- **Business defaults do not belong in the schema.** Only identity and
  timestamps (`cuid()`, `now()`, `@updatedAt`).
- **Changing a column to an enum needs `DROP DEFAULT` first**, then
  `ALTER COLUMN ... TYPE "X" USING col::text::"X"`. Prisma's generated migration
  drops and recreates the column, which fails on a table with rows.
- **A spatial column needs a hand-written GiST index** — Prisma's DSL can't
  express one on an `Unsupported("geometry(...)")` field. Add it as raw SQL in
  the migration, like the `postgis` extension itself.
- **Prisma sees that hand-added index as drift and will `DROP INDEX` it in the
  *next* migration.** Read every generated migration for stray `DROP
  INDEX`/`DROP EXTENSION` lines before applying — `migrate dev` does not ask.
- **Never answer yes to `migrate dev`'s "we need to reset the schema" prompt on
  a database with real data.** A stale checksum in `_prisma_migrations` is
  enough to trigger it even when the schema is correct (`migrate status` will
  say "up to date" throughout). Hand-write the migration folder and apply it
  with `prisma migrate deploy`, which never touches a shadow database.
- **`prisma migrate diff --shadow-database-url` wipes that database.** Passing
  the real `DATABASE_URL` as the shadow emptied the local `mapcanva` database —
  every table, 64M building footprints included. Never point a shadow URL at a
  database with data; to check a hand-written migration, read the SQL instead.
- **`make db-reset` deletes the MinIO archives too.** It runs `docker compose
  down -v`, which drops every volume — the import archives a lost database
  would be rebuilt from. To empty only Postgres, use `prisma migrate reset`.
- **`COPY` needs quoted column names.** Unquoted, `parentPcode` folds to
  `parentpcode` and the import fails on a fresh database; `copyRows` quotes them.
- **A generated id is not a key you can store.** An importer that deletes and
  recreates its rows regenerates every id, silently dangling anything that
  pointed at them. Store the source's own stable natural key instead
  (`AdminBoundary.pcode`, not `AdminBoundary.id`).
- **Scope a "clear before re-import" `DELETE` as narrowly as the thing being
  refreshed**, not by the job-type constant. A `WHERE source = 'ms-building-
  footprints'` shared across every country wiped 63.9M Indonesia rows when a
  Philippines job ran. Key is now `source:country`.
- **`next dev` keeps the Prisma Client it loaded at startup.** A later `migrate
  dev` regenerates it in `node_modules` but the running process never sees it —
  a new field reads `undefined`. Restart dev after any schema change.
- **"Open data" ≠ "queryable by area".** Google Open Buildings and Microsoft
  Building Footprints offer bulk per-country downloads only, no bbox API. Check
  how you'd fetch a small slice before designing around fetching one.
- **A dev fixture at real-world coordinates collides with real imported data.**
  Assert "at least one", never an exact feature count.
- **A heavy query bound through Prisma can turn 10x slower after five runs.**
  Prisma reuses the prepared statement, Postgres switches it to a generic plan,
  and a bound `ST_TileEnvelope($2, $3, $4)` then loses parallelism and runs per
  row: 5s against 0.5s. Write validated integers into the SQL as literals.
- **Docker's default 64MB `/dev/shm` is too small for `VACUUM` on a large
  table.** It fails once `maintenance_work_mem` is raised above it; the compose
  file sets `shm_size: "2gb"`.

## Data pipelines

- **Every pipeline step checks whether its data already exists before running.**
  A skipped step still shows in the DAG, as *exists* — the point of the view is
  knowing what's already there. See `stepDataExists` in `pipelines.ts`.
- **Drive a full-table spatial join from the small, localised side.** Joining
  64M buildings out to admin boundaries let the planner drive from the boundary
  table and re-scan the buildings once per boundary: 13+ hours for 34
  provinces. Driving from villages instead — each one bbox-probing the
  buildings' GiST index — does the same work in ~1 hour. **Always time a
  bounded sample and extrapolate before launching the unbounded version.**
- **Batch a long `UPDATE` even when one statement would work.** A single
  multi-hour statement reports no progress and loses everything on interrupt;
  id-ordered batches commit independently and resume.
- **Restarting the client does not cancel its running query.** Postgres keeps
  executing until it next tries to talk to the socket, so an orphaned query
  competes with its own replacement — 15x slower per batch until it was found.
  Kill it in `pg_stat_activity` with `pg_terminate_backend`, every time.
- **A polling `setInterval` needs an in-flight guard.** Without one, a query
  that gets slow piles up concurrent copies (14 at once, during the above) and
  makes a struggling database worse. Prefer `LIMIT 1` existence probes over
  `COUNT(*)` for anything a dashboard polls.
- **Index the column you are backfilling as `WHERE ... IS NOT NULL`, or the
  index will wreck the backfill.** A plain btree on `BuildingFootprint.
  villagePcode` let the planner `BitmapAnd` the tagging step's own
  `villagePcode IS NULL` predicate — all 64M entries — into the per-village
  `UPDATE`, once per village. Batch one ran in 10s before the index existed;
  the next took over 20 minutes with it. Nothing queries these columns for
  NULL, so a partial index is both faster to build and smaller to read.
  Prisma's DSL cannot express one — raw SQL in the migration, same as GiST.
- **Benchmark against the indexes the query will actually meet.** The 10s
  measurement above was taken before the index was created, so it measured a
  plan the real job never used.
- **Match a point against the polygon, not polygon against polygon, when
  assigning a small feature to exactly one area.** 2.1% of Indonesian building
  footprints straddle a village border, so `ST_Intersects` matched two or more
  villages per building: the winner was whichever batch wrote first
  (non-deterministic), and concurrent batches deadlocked three ways fighting
  over the shared rows. `bf.geom && v.geom AND ST_Contains(v.geom,
  ST_PointOnSurface(bf.geom))` is the same speed, gives one deterministic
  answer, and removes the contention. `&&` still does the index work.
- **"The areas are disjoint, so the rows are too" is wrong at a boundary.**
  Measure the overlap before assuming concurrent workers won't collide.
- **A "tag where the column IS NULL" pass re-tests its misses forever.** Fire
  detections outside Indonesia never match a village, so every 10-minute
  refresh re-ran the polygon test on all 13,000 of them: 4.3s on a user's
  request. Bound the pass to the rows just fetched.
- **A worker that dies leaves its job `running` forever.** Nothing reclaims it
  until the worker restarts, so the UI must treat a `running` row with a stale
  `updatedAt` as stalled rather than showing a spinner indefinitely.

## Persistence (MC-015)

- **A restore-on-mount fetch can overwrite an early user action.** `use-project-
  sync.ts` snapshots each store before fetching and only applies a restored
  field whose live value still has the same object reference — every setter
  returns a new object, so reference equality distinguishes "untouched since
  mount" from "user already changed this". `loadProject(layers, null)` skips
  repositioning when the user has already panned.

## E2E tests

- **The suite is not designed to run as one batch** — specs share one dev
  project and never clean up their layers, so one spec's leftovers fail the
  next one's count assertions. Use `make verify T=<ticket>`; clear the `Layer`
  table between specs if you must run several.
- **Confirm the target is inside the viewport when testing headlessly.** A
  locator can resolve off-screen and the click lands on nothing — that looks
  like a broken feature but is a broken test.
- **A popup that would overflow the window pans the map under you.** The
  overlay's `autoPan` moves the view when the popup does not fit, so a spec
  that computes pixels from the opening view misses everything it clicks
  afterwards. Click points whose popup fits, or start again from a reload.
- **Measuring where a feature landed while the view is still fitting gives a
  different answer every run.** `fit()` animates for up to 600 ms, so the same
  buildings read as x=0.62 on one run and x=0.38 on the next. Let the
  animation finish, or assert a shape that does not depend on the pan.
- **A scripted map drag flings the map on after `mouse.up()`.** OpenLayers'
  kinetic pan reads the fast synthetic move as a flick, so the target lands
  hundreds of km away and the next click hits empty sea. Wait ~300 ms before
  releasing.
- **Removing a feature leaves its walkthrough behind.** Delete the spec with
  the feature (MC-005, MC-028 both didn't).

## CI

- **A lockfile written on macOS can break `npm ci` on Linux.** Nested optional
  packages the local platform never installs are absent and `npm ci` refuses.
  `npm install --package-lock-only` does *not* fix it — delete `node_modules`
  and the lockfile, then `npm install`.
- **`make check` cannot catch that**: it never runs `npm ci`, and `npm ci`
  validates against the current platform. Only CI finds it.
- **A Linux container must not share the host's `node_modules`.** Bind-mounting
  the repo into the worker hands it macOS-native binaries (Prisma's engine,
  bcrypt) that won't run. Give `/app/node_modules` its own volume.

## Git

- **A stacked PR merges into its base branch, not `main`.** If the base PR
  lands first and its branch is kept, the stacked PR still targets that branch
  and its work never reaches `main` (#40, again at #47-#49). Retarget it to
  `main` before merging — and after the last one in a stack shows "Merged",
  diff `origin/main` against the stack's tip branch before trusting it: GitHub
  saying "Merged" only means that PR's own base got the commits, not `main`.
- **`git stash -u` takes untracked files with it** — including `.githooks/`,
  which silently disables `core.hooksPath` for the length of the stash. Commit
  hooks before testing them.
- **`git switch` refuses to move with a dirty tree**, so a `switch` + `reset
  --hard` pair can run the reset on the branch you were already on. Check the
  switch's exit status, or use `git -C` per command. Reflog gets them back.

## Next.js and tooling

- **Never run `next build` while `next dev` is up.** They share `.next`; the
  build wipes the chunks dev is serving. Stop dev → build → `rm -rf .next` →
  restart.
- **Nor a second `next dev`.** One on :3001 falls back to the same `.next` and
  leaves the first serving 404 chunks — an unstyled page whose forms submit as
  plain GETs. Check `lsof -ti:3000` before starting one.
- **`LayoutProps<"/">` is a Next-generated global.** Using it makes `tsc` fail
  on a clean checkout before the first build. Type layout props explicitly.
- **macOS `grep` has no `\|` alternation in BRE.** Use `grep -E` in audit
  scripts, or the search silently matches nothing.
- **`open(p, "w").write(open(p).read()...)` truncates before it reads.** Read
  into a variable, then write.

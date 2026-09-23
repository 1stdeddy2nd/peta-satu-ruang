# MapCanva

Canva for maps. Upload spatial data, style it, compose a print-ready sheet, and
export it — without needing to be a GIS specialist.

Two modes: **Analysis** for the data, **Layout** for the page.

## Running it

Needs Node 22, Docker, and about two minutes.

```bash
make install     # dependencies
make db-up       # Postgres + PostGIS in Docker
make db-migrate  # apply migrations
make db-seed     # create the one account that can sign in
make dev         # http://localhost:3000
```

Sign in with `admin` / `admin`. Change it with `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`; the seed refuses to run when `NODE_ENV=production`.

Copy `.env.example` to `.env` first — Prisma reads `.env`, not `.env.local`.

Sample data to try is in [`examples/`](examples): the same five Jakarta polygons
as GeoJSON, KML and a zipped Shapefile.

## Commands

| | |
|---|---|
| `make dev` | dev server |
| `make check` | typecheck, lint, test, build — what CI runs |
| `make verify` | record the acceptance walkthroughs to `e2e/videos/` |
| `make db-reset` | drop the database volume and rebuild it |
| `make db-studio` | browse the data |
| `make kill` | free port 3000 |

`make build` and `make verify` refuse to run while the dev server holds port
3000: they share `.next`, and building underneath a live dev server leaves it
serving 404s.

## How the project is run

Everything lives in [`.claude/`](.claude) — no third-party tracker.

- [`rules/00-workflow.md`](.claude/rules/00-workflow.md) — how work is triaged,
  ticketed and signed off
- [`rules/01-product.md`](.claude/rules/01-product.md) — what this is and who
  it is for
- [`rules/02-architecture.md`](.claude/rules/02-architecture.md) — folder map
  and state model
- [`rules/03-gotchas.md`](.claude/rules/03-gotchas.md) — mistakes already paid
  for; read before debugging anything odd
- [`boards/`](.claude/boards) and [`tickets/`](.claude/tickets) — sprints and
  the work itself

## Stack

Next.js 15 · TypeScript · OpenLayers 10 · Tailwind v4 · shadcn/ui · Zustand ·
Prisma · Postgres with PostGIS · NextAuth · Playwright

Maps use OpenStreetMap tiles. OSM data is ODbL and the credit is rendered on the
map and carried into every export.

# MC-047 — Provision Railway

- **Status:** TODO
- **Board:** sprint-02
- **Type:** chore
- **Milestone:** MVP v1

## Why
Split out of MC-033. Provisioning is console work done once; deploying is
automation that runs every release. Keeping them in one ticket makes it unclear
which half is blocked. This one blocks MC-033.

## Do not use Railway's stock Postgres
Its image has no PostGIS binaries, so `CREATE EXTENSION postgis` fails — and the
first migration runs exactly that, so the whole schema fails to apply. Adding
the default "Postgres" service is the obvious move and it is the wrong one.

Add an empty service deployed from the Docker image `postgis/postgis:16-3.4`
instead — the same image as `docker-compose.yml`, so local and production agree.

## Steps
1. **Project in the Singapore region** (`asia-southeast1`) — closest to the
   Indonesian beachhead, and latency is the reason that user is on a browser app
   rather than a desktop GIS at all.
2. **Database service** from `postgis/postgis:16-3.4`. Set `POSTGRES_USER`,
   `POSTGRES_PASSWORD` and `POSTGRES_DB` as service variables, and attach a
   volume at `/var/lib/postgresql/data` — without one the data is lost on every
   redeploy.
3. **App service** from the GitHub repository, with four variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the internal URL (`postgres.railway.internal`), not the public proxy |
   | `AUTH_SECRET` | freshly generated with `npx auth secret` |
   | `SEED_ADMIN_EMAIL` | a real address, not `admin` |
   | `SEED_ADMIN_PASSWORD` | a real password, not `admin` |

4. **Verify before wiring any of it into CI.** Point a local shell at the public
   connection string and run `npx prisma migrate deploy`, then confirm
   `geometry_columns` lists `Feature.geom`.

## Watch for
- **`AUTH_SECRET` must be freshly generated.** `.env.example` carries an obvious
  placeholder; shipping it would let anyone forge a session.
- **The seed refuses to run under `NODE_ENV=production`**, deliberately, so
  `admin`/`admin` cannot reach a public URL. The production admin is therefore
  created on purpose — still to settle whether that is a one-off script or a
  Railway one-shot command. A `make db-seed-prod` that refuses unless both seed
  variables differ from the repository defaults would close it.
- The app is already locked behind sign-in (MC-043), so a public URL is safe
  from the moment it is up. That ordering was the point of doing MC-043 first.

## Acceptance criteria
- [ ] A Railway Postgres in Singapore accepts `prisma migrate deploy`.
- [ ] PostGIS is enabled and `geometry_columns` lists `Feature.geom`.
- [ ] Secrets are set in Railway, and none of them match the repository defaults.
- [ ] The database volume survives a redeploy.

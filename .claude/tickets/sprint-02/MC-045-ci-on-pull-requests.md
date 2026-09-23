# MC-045 — Continuous integration on pull requests

- **Status:** DONE
- **Board:** sprint-02
- **Type:** chore
- **Milestone:** MVP v1

## Why
Nothing currently stops a broken commit reaching `main`. Once work arrives by
pull request (MC-046), the PR needs something to gate it.

## Functionality
`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`:

- `npm ci` — which runs `prisma generate` through `postinstall`, so the client
  exists before anything imports it.
- `make check` — typecheck, lint, test, build. CI deliberately calls the same
  target a developer runs, so "passing" has one definition rather than two that
  drift.

No database. `prisma generate` reads the datasource URL but never connects, and
nothing touches Postgres at build time, so a dummy `DATABASE_URL` is enough.
Verified by running `make check` locally with the container stopped.

Concurrency is grouped per ref so a new push cancels the previous run.

## Not included
The acceptance walkthroughs (MC-038) do not run in CI. They need a browser, a
database, a seeded account and about seven minutes. Worth revisiting once there
is a reason to trust them as regression tests rather than as recordings —
that is MC-037's job.

## What it cost to get green
The first two runs failed at `npm ci`, not at anything the code does. The
lockfile had been written on macOS and was missing the Linux-side optional
packages under `@unrs/resolver-binding-wasm32-wasi`. `--package-lock-only` was
not enough; the fix was deleting `node_modules` and the lockfile and installing
again. Recorded in `rules/03-gotchas.md`.

Worth knowing: no local command could have caught it. `make check` never runs
`npm ci`, and `npm ci` validates against the platform it runs on.

## Follow-up
GitHub warns that `actions/checkout@v4` and `actions/setup-node@v4` target
Node 20 and are being forced onto Node 24. Harmless today, a failure eventually.
Bump to `@v5` when convenient.

## Acceptance criteria
- [x] `make check` passes with no database and a dummy environment.
- [x] CI runs on push to `main` and passes — `npm ci` then `make check`, 1m46s.
- [x] A pull request shows the check running and passing — PR #1, "typecheck,
      lint, build", 1m38s.

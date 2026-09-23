# MC-033 — Deploy the app to Railway

- **Status:** TODO
- **Board:** sprint-02
- **Type:** chore
- **Milestone:** MVP v1

## Why
v1 cannot launch from localhost, and everything outward-facing — sharing,
feedback, build-in-public posting (MC-032) — is blocked until there is a URL.

## Decisions
- **Host:** Railway, **Singapore region** — closest to the Indonesian beachhead.
- **Database:** Railway Postgres with PostGIS (MC-015).
- **Auth:** the single seeded admin account from MC-043. **Google sign-in is
  dropped for now** — a Cloud project and consent screen buy nothing while there
  is one user.
- **Object storage:** MinIO deferred with MC-015; nothing to provision yet.

## Functionality
- Next.js app on Railway, Singapore.
- Postgres + PostGIS provisioned alongside it.
- NextAuth credentials wired to the seeded admin; session gates ownership.
- Environment and secret handling for the database and the admin password.
- Custom domain.
- Enough error visibility to know when it breaks for someone else.

## Depends on
- **MC-047** — the Railway project and database must exist.
- **MC-046** — work reaches `main` by pull request.
- **MC-045** — CI already gates pull requests.

## Deploy
- **On tag** — tagging a release deploys. No deploying from a branch push; a tag
  is the deliberate act.
- `prisma migrate deploy` runs before the new build serves traffic.
- Cache `~/.npm` and `.next/cache` so the deploy job stays quick.

## Acceptance criteria
- [ ] The URL opens, the admin account signs in, and a map sheet exports.
- [ ] Pushing a tag deploys, and only a tag deploys.
- [ ] Secrets live in Railway, never in the repo.

# MC-043 — Sign-in with a single seeded admin account

- **Status:** DONE
- **Board:** sprint-02
- **Type:** feature
- **Milestone:** MVP v1

## Why
Persistence (MC-015) needs an owner for a project, and nothing can be tested
against real data until somebody can log in. Google OAuth needs a Cloud project,
a consent screen and redirect URIs before the first login is even possible — too
much ceremony for something we only need in order to test.

One seeded account, email and password, no external service.

## Scope — deliberately one account
- **No Google sign-in.** Dropped for now; MC-033 no longer carries it.
- **No self-service sign-up.** One account exists, created by the seed.
- **No password reset, no email.** Nothing that needs a mail service.

This is the smallest thing that makes MC-015 testable. Multi-user, sign-up and
social login are separate decisions, taken when there is a reason.

## Functionality
- A `User` model. **No adapter tables**: with a credentials provider and JWT
  sessions NextAuth needs no adapter, so Account/Session/VerificationToken would
  sit empty. They arrive with the first OAuth provider.
- NextAuth **Credentials** provider, that one account only.
- Password hashed with argon2 or bcrypt. Never stored in plain text, not even
  for a seed.
- A `role` field. `admin` is the only value that means anything today, and it is
  what MC-029 already assumes for publishing plugins.
- `prisma/seed.ts`, run by `make db-seed` and by `make db-reset`.
- `Project.ownerKey` becomes a real relation to `User`.
- A sign-in page, and the app behind it.

## Credentials
`admin` / `admin` by default for local work, both overridable:

```
SEED_ADMIN_EMAIL=admin
SEED_ADMIN_PASSWORD=admin
```

## Production safety — the risk this ticket creates
A known-credentials admin is what a scanner finds first.

- The seed **refuses to run** when `NODE_ENV=production`.
- A deployment must set `SEED_ADMIN_PASSWORD`; there is no inherited default.
- Revisit before MC-033 puts this on a public URL — a single shared admin login
  is fine for testing and is not an authentication story for real users.

## Acceptance criteria
- [x] `make db-reset` leaves a database with one working admin account.
- [x] That account signs in locally with no external service configured.
- [x] Signed out, every page redirects to `/signin`, and every API route
      answers 401 rather than serving data. Only `/signin` and `/api/auth/*`
      are public.
- [x] A wrong password is rejected.
- [x] The session survives a reload.
- [x] The stored password is a bcrypt hash — checked in the database, and no row
      contains the plaintext.
- [x] The seed refuses to run against a production environment — checked by
      running it with `NODE_ENV=production`.
- [x] Walkthrough: `e2e/videos/MC-043-signin.webm`.

Projects belonging to the user is MC-015 stage 2; the relation exists in the
schema.

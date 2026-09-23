# MC-039 — Move first-run guidance state to the account

- **Status:** DONE
- **Board:** sprint-02
- **Type:** feature
- **Milestone:** post-v1

## Why now
Everyone is signed in, so there is an account to hang it on and the cookie
no longer earns its place.

## Superseded reasoning
Needs accounts, so it is blocked on MC-033 (NextAuth) and MC-015 (database).
The cookie shipped with MC-017 is enough until then.

## The gap the cookie leaves
A cookie is per browser and per device. Sign in on a laptop after dismissing the
guidance on a desktop and it starts again. Clearing site data resets it too.

## Functionality
- Persist `alreadyGuidance` against the signed-in user.
- On sign-in, reconcile: if either the cookie or the account says dismissed,
  it stays dismissed — never re-run the tour for someone who has finished it.
- Signed-out visitors keep using the cookie.

## Open questions
- Is one boolean enough, or should it record which step was reached, so a user
  who left halfway resumes rather than restarts?
- Does dismissing on one device push to the account immediately, or only at
  next sign-in?

## How it works
`User.guidanceDismissed`, read and written through `/api/guidance`. The cookie
and `src/lib/cookies.ts` are gone: with sign-in required there is no signed-out
visitor to serve, so a second source of truth would only drift.

Not on the JWT: the token is signed at sign-in, so dismissing would not show up
until the next login. The client fetches on mount instead.

## Acceptance criteria
- [x] Dismissal is stored on the user row, not a cookie.
- [x] It survives a reload, and would follow the account to another browser.
- [x] No cookie or localStorage copy remains.
- [x] Walkthrough still passes: `e2e/videos/MC-017-first-run-guidance.webm`.

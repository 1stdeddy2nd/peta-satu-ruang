# MC-046 — Require pull requests on main

- **Status:** DONE
- **Board:** sprint-02
- **Type:** chore
- **Milestone:** MVP v1

## Why
`main` accepts a direct push. That makes CI (MC-045) advisory rather than a
gate, and leaves no place for review or for a change to be reconsidered before
it lands.

## Server-side protection is unavailable on this plan
Configured in the UI on 2026-09-03, but it never took effect:

- `GET /repos/.../branches/main/protection` and `/rulesets` both return
  **403 — "Upgrade to GitHub Pro or make this repository public to enable this
  feature."**
- `GET /repos/.../branches/main` reports `"protected": false`.

GitHub Free offers branch protection and rulesets on **public** repositories
only, and this one is private by choice. Paying for Pro is not worth it before
the MVP ships, so real enforcement is parked as MC-048 and this ticket delivers
the part that can be had for nothing.

## Functionality
A versioned `pre-push` hook in `.githooks/` refuses any push whose remote ref is
`refs/heads/main`, printing the branch-and-PR commands instead. `git config
core.hooksPath .githooks` activates it, run by `make hooks` and as a dependency
of `make install`, so a fresh clone is covered without a separate step.

Branch naming, now settled: `feat/mc-###-slug`, so a branch says which ticket it
belongs to, matching the commit convention.

## Note
This is a habit guard, not enforcement. It lives on one machine and
`git push --no-verify` walks straight past it. That is the honest limit of it:
it stops the reflex, not a determined push, and it is worth having because
"push straight to main" is a habit that is easier not to form.

## Acceptance criteria
- [x] `git push origin main` is refused by the hook, with the PR commands shown.
- [x] Pushing a `feat/...` branch is unaffected.
- [x] A fresh clone gets the hook from `make install`.
- [x] The pull request opened from a branch runs CI (MC-045).

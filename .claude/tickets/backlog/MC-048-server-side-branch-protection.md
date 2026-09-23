# MC-048 — Server-side branch protection on main

- **Status:** TODO
- **Board:** backlog
- **Type:** chore
- **Milestone:** post-MVP

## Why
MC-046 delivers a local `pre-push` hook, which stops the habit but not a
determined push: it lives on one machine and `git push --no-verify` skips it.
Genuine enforcement has to run on GitHub's side.

## Parked because
GitHub Free offers branch protection and rulesets on public repositories only.
This repository is private, so enforcement needs either a Pro subscription
(~$4/month) or making the repository public. Neither is worth deciding before
the MVP ships — paying for a solo repository that only one person pushes to
buys little, and publishing is a product decision, not a CI one.

## Functionality
Once the plan allows it, protect `main`:

- Require a pull request before merging.
- Require the CI check (MC-045) to pass.
- Require the branch to be up to date before merging.
- Block force pushes and deletion.
- Apply the rules to administrators too — a rule the owner can quietly bypass
  is not a rule.

## Acceptance criteria
- [ ] `GET /repos/.../branches/main` reports `"protected": true`.
- [ ] A direct push to `main` is rejected by the server, not by a local hook.
- [ ] A pull request cannot merge while CI is failing.

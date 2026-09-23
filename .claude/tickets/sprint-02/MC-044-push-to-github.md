# MC-044 — Push the repository to GitHub

- **Status:** DONE
- **Board:** sprint-02
- **Type:** chore
- **Milestone:** MVP v1

## Why
Everything is local. Nothing is backed up, MC-033's CI/CD has nothing to hook
into, and a laptop failure loses the project.

Remote is already configured:
`https://github.com/kribabarbraf/map-canva.git`

## Checked
- **Private repository**, confirmed by the owner, and `gh auth login` /
  `gh auth setup-git` are already done.
- `.env`, `e2e/.auth` (a real signed-in session) and `e2e/videos` are gitignored.
  `.env.example` holds placeholders only.
- CI arrives with the first push (MC-045); branch protection follows in MC-046,
  which needs the branch to exist first.

## Functionality
- Push `main` to `origin`.
- Set upstream tracking so later pushes are plain `git push`.
- A README: what the project is, `make install`, `make db-up`, `make db-migrate`,
  `make db-seed`, `make dev`, and the admin credentials for local use.
- Point `.claude/rules/00-workflow.md` at the remote as the source of truth.

## Acceptance criteria
- [x] `main` is on GitHub with the full history.
- [x] `git push` works without arguments.
- [x] No `.env`, session state or video output in the repository.
- [x] README gets someone from clone to running app.

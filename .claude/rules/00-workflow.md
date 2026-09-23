# Workflow

## Triage every request — never just build it

A request is not a build order. Argue it to one of three, named explicitly:

- **Reject** — doesn't belong in the product. Say why. No ticket.
- **Backlog** — worth doing, not now. Ticket with the reason parked, no code.
- **A named sprint** — needed for the milestone. Ticket it, then build it.

Same judgement on existing code: propose deleting non-essential features,
especially buggy ones, rather than sinking time into fixing them.

Disagreeing is the useful contribution. Building everything asked for is not.

## Check the license before adopting anything third-party

A new dependency, an API, a tile server, a dataset — before it goes into the
product, check what its license actually permits, not what it looks like it
permits. This applies whether it is a library MC-047-style, a data source
like MC-050's Sentinel-2 mosaic, or a service like an API MC-052 calls.

- **Verify against the source**, not memory or a blog post — licenses move.
  MC-042 found EOX's Sentinel-2 mosaic was non-commercial-only (CC BY-NC-SA)
  by reading the WMTS capabilities XML directly, not by trusting a search
  result.
- **Write it down where the next person will actually see it** —
  `THIRD_PARTY_NOTICES.md` for data/service sources, `LICENSE` for the
  project's own terms. A license check that lives only in someone's memory
  or a chat transcript doesn't protect anyone.
- **A restrictive license on one dependency can force the whole product's
  terms**, not just that one integration — MapCanva ships under PolyForm
  Noncommercial 1.0.0 partly *because* EOX's data required it. Check before
  building the feature around it, not after.

## Judge it as the user, not as an engineer

Ask: does this get someone from data to an exported sheet faster, or does it
just make us a worse QGIS? Could a good default replace the control entirely?
Power-user edge cases get rejected or parked. See `01-product.md`.

## Tickets and sprints

Our tracker lives in the repo — no third-party Jira.

```
tickets/<board>/MC-###-slug.md   why, functionality, acceptance criteria
boards/sprint-<n>.md             one table: ticket | title | status
boards/backlog.md                parked work, each row saying why
```

Status lives in the ticket; the board indexes it. Keep both in sync.

`TODO` → `PROGRESS` (built and handed over, being tested) → `DONE`.

Removing a feature produces **two** tickets, never zero:

1. The original ticket moves to the backlog with a note on what went wrong.
2. A new removal ticket records what was taken out, which files changed, and
   what would be needed to bring it back.

So the history survives on both sides — the idea stays alive on the backlog,
and the deletion is itself a tracked, reviewable change.

**Once deployed**, every sprint also carries a LinkedIn progress post ticket —
building in public, for audience and feedback. Until there is a live URL, skip
it: a post about software nobody can open is wasted. See MC-032.

We are on **v0**, working toward **MVP v1**.

## Commit messages

One feature per commit. A commit that implements a ticket names it in the
subject — the ticket code in brackets, then the ticket title, then what this
commit actually does:

```
[MC-015]: Persistence via PostGIS + Prisma add schema and first migration
[MC-017]: First-run guidance prompt to upload when no layers exist
```

Use the ticket's exact title, so `git log --grep MC-015` finds everything for a
ticket and the log reads as sprint progress.

Changes to these rules use `[RULES]` in place of a ticket code:

```
[RULES]: Update commit format and DONE criteria
```

Other work with no ticket — docs, tooling — uses a plain subject
(`docs: ...`, `chore: ...`).

## Ready to hand over means driven in a browser

Not "it compiles". Type-checks say nothing about whether a drag actually
reorders anything, so nothing moves to PROGRESS until it has been run and used
in a real browser.

When testing headlessly, confirm the target is inside the viewport first. A
locator can resolve to an off-screen element and the click lands on nothing —
that looks like a broken feature but is a broken test.

## DONE, and only the owner says so

A ticket is DONE when both are true:

1. The product owner has tested it and confirmed it.
2. The work is committed.

Once there is a live deployment (MC-033), DONE also requires the work to be
live there. Until then — sprint 01 included — committed is enough; there is no
remote to push to yet.

**Never move a ticket to DONE.** Finished work goes to PROGRESS and waits there.
Clean type-checks, lint and my own browser testing mean it is ready to be
tested — not that it is accepted.

## Work on local main, then branch off it

Build and commit on local `main`, then cut the branch from that state, push it
and open the PR:

```
# work, commit on main
git switch -c feat/<ticket>
git push -u origin HEAD && gh pr create
```

**Do not reset local `main` afterwards.** It keeps the commits and sits ahead of
`origin/main` until the PR merges. Local `main` is the working copy, not a
mirror of the remote — checking it out must always run the newest verified code,
not just whatever has been merged.

Once a PR merges, sync local `main` to `origin/main` before the next piece of
work, or the divergence compounds.

## Never push without being told

Commit locally as often as the work needs it. **Do not `git push`.** A push
happens only when the owner has confirmed the ticket DONE *and* has said to
push. A clean `make check`, a finished feature, or having just been handed the
remote URL are none of them permission.

Work reaches the remote through a pull request, never a direct push to `main`.

When the owner does say done, **commit that status change straight away**: the
ticket file and its sprint board, in a commit named for that ticket. The board
is how progress is read, so leaving it stale is the same as losing it.

## Write down what bit you

`03-gotchas.md` collects every mistake already paid for. Whenever something
behaves unexpectedly — a wrong assumption, a library footgun, a tool that
quietly did the wrong thing — add a line with the symptom and the fix.

That file is the project's memory, and it is expected to grow. Its whole
purpose is that the next person, human or AI, doesn't lose an afternoon to a
mistake someone already made.

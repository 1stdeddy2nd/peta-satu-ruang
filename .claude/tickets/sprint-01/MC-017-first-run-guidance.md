# MC-017 — First-run guidance

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** MVP v1

## Why
A new user lands on an empty map in Analysis mode with no obvious next step.
Cheap to fix and it affects every single first session.

## Functionality
A single card, bottom-centre of the workspace, showing one step at a time:

1. **No layers** — "Start with your data", with its own Browse button so the
   user does not have to find the sidebar.
2. **Layers loaded, in Analysis** — "Now compose the sheet", with a button that
   switches mode for them.
3. **Layout mode, blank canvas, no elements** — "Pick a template".

Then it disappears on its own; there is nothing left to say.

The step is **derived from live state, not tracked progress**, so it cannot go
stale: delete every layer and it returns to step 1.

Dismissal is stored in a **cookie** (`mc_guidance_dismissed`), so it genuinely
only runs on a first visit rather than on every reload. A cookie rather than
localStorage because the server will need to read it when this moves to the
account — see MC-039.

The card only renders after mount, since the cookie does not exist during SSR;
that keeps server and client markup identical and stops it flashing up for
someone who already dismissed it.

## Acceptance criteria
- [x] A first-time user is told what to do at each stage without hunting.
- [x] Guidance retires itself once a template is applied.
- [x] Steps recompute from state — removing the data returns it to step 1.
- [x] Dismissible, and stays dismissed across a reload (cookie-backed).
- [x] Walkthrough recorded: `e2e/videos/MC-017-first-run-guidance.webm`.

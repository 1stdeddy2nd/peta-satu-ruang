# MC-049 — Named projects, a project list, delete

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-MVP

## Why
MC-015 shipped one implicit project per user (stage 1+2: schema, save/load,
autosave, restore-on-open) — this was stage 3 of that ticket, split out on its
own now that the rest is done and confirmed.

## Parked because
One project per user is enough to prove persistence works and to use the app
day to day. Naming, a list, and delete are real needs but not blocking — no
one is stuck without them yet, and the schema (`Project.name` already exists)
needs no rework to add this later.

## Functionality
- Name a project, rename it.
- A project list/switcher — probably where `GET /api/project` currently
  assumes "the one project" (`src/contexts/project/utils.ts`).
- Delete a project (cascade removes its layers and features).

## Acceptance criteria
- [ ] A user can create a second named project without losing the first.
- [ ] Switching projects loads the selected one's layout, layers and features.
- [ ] Deleting a project removes its layers and features (cascade), and its
      Postgres rows do not linger.

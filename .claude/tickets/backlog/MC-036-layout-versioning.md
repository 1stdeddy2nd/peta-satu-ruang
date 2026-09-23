# MC-036 — Layout document version history

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
Split out of MC-015. Autosave without history is enough to ship v1, and adding
versioning up front would shape the schema around a feature nobody has asked
for yet.

## This is the one people confuse with undo
Undo/redo (MC-025) is in-memory editing state. **This** is the database-backed
feature: restorable snapshots of the document. If someone asks for "undo that
survives a reload", they are asking for this.

## Why it matters later
Autosave with no history means a mistake is silently permanent. Once people
have real work in the tool, "restore what it looked like yesterday" stops being
a nicety.

## Functionality
- Keep prior versions of a layout document.
- Browse and restore a version.
- Name or pin a version worth keeping.

## Open questions
- Every autosave, or a snapshot on meaningful change?
- Retention — how long, and how much storage is that?
- Does uploaded data get versioned too, or only the layout?

## Acceptance criteria
- [ ] A layout can be rolled back to an earlier state.
- [ ] History does not grow without bound.

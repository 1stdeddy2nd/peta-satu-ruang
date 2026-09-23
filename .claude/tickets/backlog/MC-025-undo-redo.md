# MC-025 — Undo / redo for layout edits

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
Expected in a real editor, but it does not block a first export.

## Functionality
- Undo/redo across element add, delete, move, resize and property changes.
- Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z.
- Continuous gestures (a drag, a slider sweep) should collapse into one step.

## Not part of MC-015 — undo history does not go in the database
Asked during MC-015, so worth settling here:

- Undo must feel **instant**. A database round trip per press makes it feel
  broken.
- The undo stack is **editing state, not document state**: ephemeral, per
  session, per user. Persisting every intermediate step means a write per drag
  frame.
- Nobody expects yesterday's undo stack after a reload. They expect the
  *document* to be where they left it, which is MC-015's job.

What people often mean by "undo that survives" is **version history** — named
snapshots you can restore. That is a different feature and already exists as
MC-036.

So: undo/redo stays in memory via `zundo` on the Zustand store, independent of
MC-015. The one interaction to respect is that autosave must never fire
mid-gesture, or it will persist a half-finished drag; MC-015's debounce handles
that, and undoing simply causes the next autosave to persist the undone state.

## Acceptance criteria
- [ ] A drag is undone as one action, not dozens.

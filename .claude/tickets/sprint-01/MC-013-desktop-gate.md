# MC-013 — Desktop-only gate

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Functionality
- Resize listener; below **1024px** the editor is replaced by an explainer
  showing the current width.
- Renders nothing until measured so the gate never flashes on a wide screen.

## Acceptance criteria
- [x] At 800px the gate shows; above 1024px the app renders.

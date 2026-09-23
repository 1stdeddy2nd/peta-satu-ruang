# MC-098 — Show or hide the timeline card

- **Status:** PROGRESS — fixed locally, awaiting the product owner's check
- **Board:** sprint-05
- **Type:** feature
- **Milestone:** MVP v1

## Why

The timeline card is permanently on screen, on desktop and mobile alike.
Someone who just wants to look at the map — or take a screenshot — has no way
to get it out of the way, and on a short phone screen it is a large chunk of
the map given up permanently to a control most visits don't need to touch.

## Functionality

- **It starts hidden**, on both breakpoints. The first screen should be the
  map, not a control most visits never touch; someone who wants to replay a
  window asks for it.
- Two controls show or hide it: the History button in the top-right cluster
  (below Zoom) opens it, and the card's own close button puts it away — the
  same title-plus-X header every other card carries, so it reads as one of
  them rather than as furniture.
- Collapsing does not change the window/replay state underneath; reopening
  shows exactly what was left.
- On mobile the timeline joins MC-099's one-card-at-a-time rule: it occupies
  the same strip along the bottom as every drawer, so opening a drawer
  collapses it. History brings it back.

## Acceptance criteria

- [x] The timeline is hidden when the map first loads, on desktop and
      mobile.
- [x] The History button shows it and the card's own close button hides it;
      nothing else does.
- [x] Hiding it does not reset the selected time window, replay position, or
      speed.
- [x] On mobile, opening any drawer collapses the timeline rather than
      stacking on top of it.

# MC-094 — Hazard popups render clipped on narrow screens

- **Status:** PROGRESS — fixed locally, awaiting the product owner's check
- **Board:** sprint-05
- **Type:** bug
- **Milestone:** MVP v1

## Why

Reported as "cannot click icon to show detail" on mobile. Reproduced: the tap
does open the popup, but on a 393px-wide viewport the popup can render mostly
off the left edge of the screen, so nothing readable is visible — which reads
exactly like the tap did nothing.

Root cause, confirmed by reading `ol/Overlay.js`: `panIntoView` only ever
nudges the map far enough to bring **one** overflowing edge into view (it
checks `offsetLeft`, then only checks `offsetRight` if `offsetLeft` was
already non-negative). If the popup's width plus twice the configured
`autoPan.margin` exceeds the viewport width, satisfying one edge always
leaves the other one still off-screen — there is no pan that fits it.

On mobile that inequality is met by a wide margin: every popup uses
`autoPan: { margin: 96 }`, sized for the desktop chrome around the map edges,
while the popup itself is `max-w-[calc(100vw-1.5rem)]` — up to 369px on a
393px phone. `369 + 2×96 = 561px`, nearly 1.5x the screen width. Even OL's own
default margin (20px) doesn't leave room once the popup is that wide.

## Functionality

- A hazard popup (fire, quake, volcano) is fully visible after opening,
  regardless of where on a narrow screen its marker sits.
- Desktop behaviour (popup anchored to the tapped point, panned clear of the
  summary bar and timeline) is unchanged.

## Non-goals

- Not redesigning the popups' content or the anchored-bubble style on
  desktop — this is about the popup actually landing on-screen.

## Acceptance criteria

- [x] Tapping a marker within ~20px of the left, right, or bottom edge of a
      375–414px-wide viewport opens a popup with no part of it cut off.
- [x] Desktop popups still pan clear of the summary bar / timeline as before.

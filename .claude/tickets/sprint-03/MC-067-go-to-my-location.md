# MC-067 — "Go to my location" button

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised by the product owner alongside MC-065's picker rework. Every map
product has this button, and its absence is felt immediately: the only ways to
reach a place today are panning by hand from wherever the map was left, or
naming an admin area you already know.

It matters most for the user `01-product.md` is written for — a field officer
or planner working on the area they are standing in. They know where they are;
they should not have to work out which kecamatan that is before the map agrees.

Small, familiar, and a good default rather than a new control to learn, so it
passes the "could a good default replace this" test rather than failing it.

## What it is
One button under the area picker. It asks the browser for a position and
centres the map there. That is all.

## Non-goals
- **Does not select an admin area or import anything.** Centring the map is
  what the button says it does. Auto-importing buildings around someone's
  house would be a surprise, and picking which admin level to select for them
  would be a guess.
- **No live tracking, no accuracy circle, no follow mode.** A single jump.
- **No IP-based fallback.** If the browser declines, we say so; guessing a
  city from an IP address is worse than nothing for someone doing fieldwork.

## Notes
`navigator.geolocation` needs a secure context — HTTPS or localhost — so this
will not work over plain HTTP on a LAN address, which is a realistic way this
product gets demoed. Both that failure and a declined permission prompt are
reported with a toast, since a button that silently does nothing is the worst
outcome.

## Acceptance criteria
- [x] A "Go to my location" button sits under the area picker.
- [x] Pressing it centres the map on the browser's reported position.
- [x] A denied permission says so plainly, naming the browser as the fix.
- [x] A browser without geolocation says so rather than failing silently.

## Verified
`tsc --noEmit`, `eslint` clean. Walkthrough recorded: with the position faked
to Monas (106.8272, -6.1754), pressing the button moves the map there — the
spec asserts the coordinate readout actually lands on Jakarta rather than
merely changing.

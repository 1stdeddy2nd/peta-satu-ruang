# MC-079 — Go to my location on the dashboard

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
The dashboard opens on all of Indonesia. The first thing most people do on a
map that size is find where they are, and the button for it is already on
screen (MC-078), doing nothing.

## Functionality
- The locate button asks the browser for a position, zooms the map there (to
  at least zoom 14) and marks it with a blue dot.
- Pressing it again moves the dot; there is only ever one.
- Once you have been located, a second button under it shows or hides the
  dot. The dot sits exactly where you zoomed in to look, and someone sharing
  a screenshot may not want to show where they are. Locating again shows it.
- While the browser looks, a "Mencari lokasi Anda…" toast shows. A declined
  permission, a browser without geolocation, or a failed lookup each say so in
  Indonesian. None of them fail silently.

## Non-goals
- No live tracking, accuracy circle or follow mode. One jump, like MC-067.
- No IP-based fallback.
- The editor's own "Go to my location" (MC-067) is unchanged.

## Notes
Geolocation needs HTTPS or localhost, so it will not work over plain HTTP on
a LAN address.

## Acceptance criteria
- [x] Pressing the locate button zooms to your position and shows a blue dot.
- [x] The show/hide button appears after locating and hides and shows the dot.
- [x] A denied permission shows a message instead of doing nothing.
- [x] Zoom in / zoom out and the other dashboard buttons are still inert.

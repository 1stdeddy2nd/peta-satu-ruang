# MC-078 — Map dashboard UI

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
The app opens on an editor: a two-mode workspace and a panel of upload
controls, all assuming the visitor came to make a map sheet. Someone who just
wants to see what is happening on the map has nothing to click. The front door
becomes a map dashboard; the editor stays, one step further in.

Sprint 04 restarts from 9f1d3a9. The screen is built first, on its own, so
the look can be agreed before any behaviour is wired behind it.

## Functionality
- `/` is the dashboard. The editor moves to `/editor`, and sign-in lands
  there. Both still require sign-in.
- White cards floating over a map of Indonesia: brand top left; place search,
  locate me, zoom in and zoom out top right; the layer dock along the bottom
  (Titik Api, Gunung Api, Banjir, Batas Wilayah, Bangunan, Penduduk, Lahan).
  Copy is Indonesian.
- Poppins, app-wide. `--font-sans` had been defined as itself, so the app was
  rendering in the browser default.

## Non-goals
- **No button does anything yet.** Search, locate, zoom, the layer toggles,
  hiding the dock and the editor link are all inert. Each gets wired in its
  own ticket.
- No public (signed-out) access yet.

## Acceptance criteria
- [x] `/` shows the dashboard over Indonesia, looking like the agreed design.
- [x] Clicking any dashboard button changes nothing.
- [x] `/editor` opens the editor, unchanged; signing in lands there.

## Redesigned by MC-087

The shell is the same idea with different furniture. The layer dock along the
bottom is gone: hazards are chips in one summary at the top, each opening its
own card, and the fourth chip holds the data catalogue. The bottom of the
screen is now the timeline — one clock for every layer — and the map controls
stack vertically beside the search box, with a "?" that explains the map.

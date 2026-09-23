# MC-095 — Consistent, easy-to-tap mobile controls

- **Status:** PROGRESS — fixed locally, awaiting the product owner's check
- **Board:** sprint-05
- **Type:** design
- **Milestone:** MVP v1

## Why

On a phone, the search bar / chip pills and the round zoom/location buttons
weren't the same height, so the control cluster read as two unrelated
systems rather than one toolbar. Separately, everything competed for the same
top strip, which on a 360px screen simply does not fit.

The layout took four corrections from the product owner to land:

1. The first draft moved the hazard chips + Katalog data next to the
   zoom/location cluster on the right. Correction: keep them on the left with
   the logo, and size *everything else* to match them.
2. Match per breakpoint, not with one number everywhere — 44px on desktop
   (a bigger target is easier with a mouse too), 36px on mobile (screen space
   is scarce), logo included on both.
3. On a real phone the counts row and the brand together overflow the screen,
   so the row clipped and buried the search underneath it.
4. Final shape: **two rows on mobile** — brand and search across the top, the
   counts row full-width beneath it — and **one button** that shows or hides
   every remaining control, so the map is not ringed with chrome by default.

## Functionality

- Mobile: row one is the brand and the search field; row two is the counts
  row across the full width, each chip an equal `flex-1` share of it. The
  chips carry no accordion chevron there — 74px of row width for a hint a
  drawer does not need.
- Desktop: unchanged — brand and counts together on the left, search
  top-right.
- Every control is the same height as the chip row: 44px at the tablet
  breakpoint and above, 36px below it. That covers the logo, search, help,
  location, zoom, history and sources.
- Mobile only: help, location, zoom, history and sources are collapsed behind
  a single toggle below the counts row. Expanded, they stack as the same
  right-hand column desktop shows. The toggle is a chevron that rotates to
  point up when the column is open — it says which way the column will move,
  which an ellipsis does not.
- The search field is always expanded. An earlier draft collapsed it to an
  icon; once it had its own row there was nothing to save by hiding it, and a
  search you have to open first is a search people don't use.
- **Mobile search opens full-screen.** Tapping the field fills the screen: a
  back arrow and the field along the top, results filling everything below.
  The results cannot be a bottom drawer like the rest of the mobile UI — the
  on-screen keyboard covers the bottom half of the screen exactly while
  someone is typing — so the field stays at the top and the list takes the
  space between it and the keyboard. Picking a result or the back arrow
  returns to the map. Desktop keeps the anchored dropdown.
- The results list is positioned absolutely rather than left in flow. In flow
  it was a flex item of the top row, so an open list stretched the row to
  538px: the brand re-centred into the middle of the map and the counts row
  landed on top of the markers.

## Non-goals

- Not changing what the chips/cards contain, only their height and layout.

## Acceptance criteria

- [x] On mobile the brand and search share the top row and the counts row
      sits full-width beneath it, fully on screen with no horizontal
      overflow at 320px and up. Desktop keeps brand and counts on the left
      with search top-right.
- [x] Logo, search, help, location, zoom, history and sources are all 44px
      on desktop and 36px on mobile.
- [x] On mobile one toggle shows and hides help, location, zoom, history and
      sources together, its chevron rotating between the two states; the
      search field is always expanded.
- [x] Tapping the search field on mobile opens a full-screen search with the
      field at the top; picking a result or the back arrow returns to the
      map. Desktop keeps its dropdown.
- [x] An open result list never changes the height of the top row, on either
      breakpoint.

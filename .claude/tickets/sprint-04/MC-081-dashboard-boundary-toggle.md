# MC-081 — Show or hide the picked area's boundary

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
Picking an area draws its outline (MC-080), and the only way to get rid of it
is to clear the search, which also forgets the area. Someone who wants to look
at what is inside the line — or take a clean screenshot — needs to hide it and
keep the place. The "Batas Wilayah" button is already in the dock, inert.

## Functionality
- With an area picked, Batas Wilayah shows or hides its outline. It reads as
  pressed while the outline is shown.
- Picking an area always shows its outline, even if it was hidden before —
  the same rule as locating again in MC-079.
- With no area picked, pressing it says "Cari dan pilih wilayah di kotak
  pencarian." and puts the cursor in the search box.
- The BPS/HDX credit goes when the outline is hidden.

## Implementation
- The picked area and the toggle move into `useMapSettings`, so the search
  box and the dock read the same state. MC-082 builds on it.

## Non-goals
- No second outline style or boundaries of neighbouring areas.

## Acceptance criteria
- [x] With an area picked, Batas Wilayah hides the outline and shows it again.
- [x] Picking another area while it is hidden shows the new outline.
- [x] With nothing picked, pressing it points to the search box.

## Redesigned by MC-087

The toggle itself is unchanged; where it lives is not. The layer dock is gone,
so Batas wilayah is a switch under Administrasi in Katalog data, disabled until
an area is picked rather than answering a press with "Cari dan pilih wilayah di
kotak pencarian." The rules behind it — picking an area always shows its
outline, the BPS/HDX credit goes with the line — are as they were, and its ⓘ
now names Badan Pusat Statistik.

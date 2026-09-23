# MC-091 — Mobile-friendly hazard dashboard

- **Status:** DONE — confirmed by the product owner; the dashboard route no longer uses `SmallScreenGate`, the editor still does
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why

Raised by the product owner while reviewing MC-087: the dashboard (Situasi
panel, shared timeline, dock) should also work as a mobile web app, not just
on a desktop browser.

## The conflict this runs into

`01-product.md` states a non-negotiable: **"Desktop only. Below 1024px show an
explainer, not a broken editor."** That is enforced today by
`SmallScreenGate` (`src/components/templates/SmallScreenGate.tsx`,
`MIN_APP_WIDTH = 1024`), wrapped around **both** routes independently:
`src/app/page.tsx` (the dashboard) and `src/app/editor/page.tsx` (the map
editor). They are separate gates, so the dashboard's threshold can be lowered
without touching the editor's — the editor genuinely needs the map, page
canvas and tools side by side, and should stay desktop-only; the dashboard is
a read-mostly hazard view, which is a much more reasonable thing to check on a
phone.

Lowering the dashboard's gate on its own is not the hard part. Making what's
behind it actually work at phone width is. Measured against the components
MC-087 just built, at a 375px-wide phone:

- **`SharedTimeline` cannot fit.** Its span button, play button and summary
  text alone take most of a 343px available width (`w-[680px] max-w-[calc(100vw-2rem)]`
  currently), leaving the 30 day-bars only a few pixels each — both unreadable
  and untappable.
- **`LayerDock`** is five 110px-wide icon buttons plus a divider — over 550px.
  It now has `overflow-x-auto` as a safety net so it scrolls instead of
  silently clipping, but a horizontally-scrolling icon strip is not a good
  phone pattern on its own.
- **`SituasiPanel`** and the search/controls panel already cap at
  `max-w-[calc(100vw-2rem)]`, so they at least don't overflow the screen, but
  their information density (three sections, each with counts, a legend, and
  an ⓘ popover) was designed for a 300px desktop card, not a phone-width one.

None of this is fixable with a breakpoint tweak — the timeline and dock need
their own mobile layouts (candidates: a bottom sheet for the dock instead of
a row of icon buttons; a condensed timeline showing fewer days or a simple
"today / this week / this month" picker instead of 30 individual bars).

## Before building

- Confirm the product decision explicitly: the dashboard route's gate moves
  below 1024px (exact breakpoint TBD — likely phone *and* tablet, i.e. down to
  around 375–400px), while the editor's stays at 1024px. This is a real
  product-scope change to a written non-negotiable, not a CSS pass, so it
  needs the owner's sign-off before code changes it.
- Design (not just implement) a mobile layout for the dock and the timeline
  specifically — the two pieces that do not degrade with a max-width alone.
- Decide touch-specific behaviour the current design doesn't need on desktop:
  hit-target sizing on the map itself (volcano/quake markers are tuned for a
  mouse hit-tolerance), and whether hover-driven UI (the timeline bar's
  `title` tooltips) needs a tap-to-reveal replacement.

## Acceptance criteria (draft)

- [ ] The dashboard route is usable at phone width (~375px) without a
      horizontal scrollbar on the page itself.
- [ ] The dock, timeline and Situasi panel each have a layout that works at
      that width, not just a shrunk desktop layout.
- [ ] The map editor's 1024px gate is unchanged.
- [ ] Touch targets on the map (markers, popups) are large enough to tap
      reliably.

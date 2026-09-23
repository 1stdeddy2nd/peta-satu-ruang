# MC-099 — Hazard cards and marker detail open as bottom drawers on mobile

- **Status:** PROGRESS — fixed locally, awaiting the product owner's check
- **Board:** sprint-05
- **Type:** design
- **Milestone:** MVP v1

## Why

Raised by the product owner after reviewing MC-094 and MC-095: on a phone
there is no good place to anchor a popover to a small map icon, and a card
that pops up next to a chip fights for the same cramped space as everything
else. A full-width sheet that slides up from the bottom is the right shape
for both a one-off marker lookup and a hazard's level toggles — closer to
how Google/Apple Maps present a tapped point on mobile.

## Functionality

- Below the tablet breakpoint: tapping a hazard chip, Katalog data or the
  help button opens its card as a bottom drawer; tapping a fire/quake/volcano
  marker on the map opens its detail the same way, instead of a bubble pinned
  to the icon.
- Above the tablet breakpoint: unchanged — the anchored popover (with
  MC-094's fit), the popover-style card next to the chip row, and help as a
  centred modal.
- No dimming behind a drawer and no tap-outside-to-close — same as the
  timeline card, which just sits over the map without blocking it. It closes
  only through its own control: the same chip toggled again, the drawer's
  "Tutup" button, or Escape. Every drawer carries that button.
- **One card at a time.** Drawers all open in the same strip along the
  bottom, so opening one closes whatever else is open — including the
  timeline (MC-098), which lives there too.
- Toggling something inside a drawer does not close it.

## Implementation

- `atoms/Drawer.tsx`: a card pinned to the bottom of the screen, portaled to
  `document.body`, `pointer-events-none` outside its own content so the map
  underneath stays fully interactive. A `backdrop` prop exists for a true
  modal (dims the map, tap-outside/Escape closes it) if a future case needs
  one, but nothing here uses it.
- `lib/use-media-query.ts`: `useMediaQuery` + the shared `MOBILE_QUERY`
  (Tailwind's own `sm` breakpoint), read once per component rather than
  duplicated as ad hoc `window.innerWidth` checks. It reads the match during
  render via `useSyncExternalStore`: the first draft used `useState(false)`
  plus an effect, so every card opened on a phone painted its desktop shell
  for one frame and then swapped to the drawer — the product owner saw the
  flash and called it out.
- `EventDetailCard`, `EventCatalogPanel`, `HelpDialog`, `QuakePopup`,
  `VolcanoPopup`, `FireHotspotPopup` each render the same content into either
  their existing desktop shell or a `Drawer`, chosen by `useMediaQuery`.
- `activeMobileDrawer` in the map store is what enforces one card at a time:
  a portaled drawer cannot see its siblings, so each one claims the slot when
  it opens and closes itself when another name appears.
- `EventSummary`'s outside-click-to-close is skipped on mobile: a Drawer's
  content is portaled outside the component's own DOM subtree, so without
  this every tap inside the open drawer would otherwise look like a click
  "outside" and close it mid-interaction — doubly so now that there's no
  backdrop catching that click first.

## Non-goals

- Not changing desktop's popover/card presentation at all.

## Acceptance criteria

- [x] On mobile, opening a hazard card, Katalog data, help, or a marker's
      detail shows a bottom drawer, not a popover, with no dimming behind it,
      and each carries a close button.
- [x] Opening one drawer closes any other card, the timeline included; never
      two at once.
- [x] Toggling a switch inside a mobile drawer keeps it open; tapping the
      map behind it does not close the drawer.
- [x] A drawer opens straight into its final shape — no desktop card is
      drawn and dismissed first.
- [x] Desktop is pixel-for-pixel unchanged.

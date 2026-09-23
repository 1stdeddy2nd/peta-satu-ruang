# MC-016 — Decide the v1 template set

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** MVP v1

## Why
Three templates exist. Shipping and maintaining all three has a cost, and the
built-in set is only meant to prove the model — the real library comes from the
community (MC-030) and from generated templates (MC-031).

## Decisions
- **Ship:** **Blank canvas** (free custom layout) and **Admin map**.
- **Drop:** Presentation.
- More templates get added one at a time, each argued on its own.
- **A4 landscape is the default sheet.** Most map sheets are wider than they
  are tall, and it is the format that shows the most map on a laptop screen.
- Templates must work in **both portrait and landscape**, and the orientation
  choice belongs with picking a template — not buried in the Page & map tab
  where it is today.

## Functionality
- Remove the Presentation template from `layout-templates.ts` and the catalog.
- Surface orientation at template-selection time: choosing a template means
  choosing its page format, with a preview that reflects the choice.
- The Admin map template currently assumes portrait — the info column runs down
  the right edge at 27% width. In landscape that column becomes too wide and
  short. It needs a landscape arrangement, most likely a shorter column or a
  bottom strip.
- Blank canvas needs nothing beyond honouring the orientation.

## Also done
- Dropped the **Letter** page size. The set is now A4 and A3, each in portrait
  and landscape. Letter is a US size; the beachhead uses A-series. One line to
  restore if that is wrong.
- Fixed a latent bug found while building this: `rescaleRegions` handed back
  regions with **fresh ids** on a page change, orphaning every flow element —
  so changing size or orientation would have emptied the info column. Region
  ids are now preserved across a rescale.

## Acceptance criteria
- [x] Only Blank canvas and Admin map are offered.
- [x] Page format is chosen when picking a template, and the card preview
      matches the orientation.
- [x] Admin map works at A4/A3 in both orientations: 14 column children, no
      overlap, no overflow in all four combinations.
- [x] Page size and orientation are not duplicated in the Page & map tab.
- [x] A3 landscape exports correctly.
- [x] A new document opens as A4 landscape.

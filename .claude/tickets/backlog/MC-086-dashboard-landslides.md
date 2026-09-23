# MC-086 — Show landslides (gerakan tanah) on the dashboard

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** MVP v1

## Why it's parked
Raised by the product owner while MC-084 moved onto MAGMA Indonesia: MAGMA
also publishes landslide incident responses ("Tanggapan Kejadian", under
Gerakan Tanah). Landslides are among Indonesia's most frequent deadly hazards
and belong beside Titik Api, Gunung Api and Gempa (MC-085). Parked on the
owner's instruction to finish the volcano layer first.

## What is known
- MAGMA's menu links `https://magma.esdm.go.id/v1/gerakan-tanah/tanggapan`.
  The page itself has not been opened: what a report contains, whether it
  has coordinates, and how often it updates are all unknown.
- Same terms as MC-084: `robots.txt` disallows all crawlers, no API, no
  licence. Reading it would extend that same owner decision and fall under
  the same MC-058 launch review.
- BMKG's open data has no landslide feed (checked for MC-085).

## Before scheduling
- Open the page once and record what a report actually contains.
- Look for a licensed alternative first — the decision to read MAGMA was
  made for volcano status, where PVMBG is the only authority.
- Decide what a point on the map means: a landslide that happened, or a
  zone where one could.

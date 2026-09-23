# MC-054 — Fresher Sentinel-2, our own cloud-free compositing

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** unscheduled

## Why parked
Written up during sprint-03 planning but never scheduled into it — the ticket
itself already said so ("left as ticket only for now"). Moved here as
sprint-03 closes with it still undone, rather than leaving it stranded in a
closed sprint's folder. The reasoning below (why option A over Sentinel Hub,
and why this is real new infrastructure) still stands unchanged; this is
still wanted, just not yet scheduled into a sprint.

## Why
Raised directly by the product owner: MC-050's EOX mosaic is a full year
stale by construction (2025's mosaic is 2025's whole year, not "as of
today"). The ask is two related things:
1. **The most recent Sentinel-2 imagery available**, even if a given date has
   cloud cover — genuinely current, not last year's average.
2. **A clean, roughly-current composite** built by combining several recent
   dates and keeping the least-cloudy pixel at each point — the same
   principle as EOX's mosaic (real pixels, no fabrication — see the
   sprint-03 design decisions), just computed over the last weeks/months
   instead of a fixed calendar year.

## Two ways to build this — a real cost decision, not a technical detail
- **A. Do it ourselves on AWS's open Sentinel-2 archive.** [Earth Search](https://element84.com/earth-search/)
  (Element 84) is a free, open STAC API over the complete Sentinel-2 L2A
  catalog on AWS, including per-scene cloud-cover metadata to query and rank
  by. Free forever, but **we would be building a raster-compositing and
  tile-serving pipeline that does not exist anywhere in this codebase today**
  — this is genuinely new server-side infrastructure (fetch matching scenes,
  mask clouds using each scene's Scene Classification Layer, composite,
  render to tiles), not a small addition.
- **B. Pay Sentinel Hub for it.** Their [Processing API](https://www.sentinel-hub.com/develop/api/)
  has a `leastCC` mosaicking parameter that does exactly this — order by
  cloud coverage and composite — as a hosted service, no pipeline to build.
  Free trial exists for prototyping; production pricing starts around
  **€25/month** (research/consumer tier) or **€83.25/month** (commercial
  tier). Recurring cost on a pre-revenue product, but a small fraction of the
  engineering time option A costs.

**Decided: option A (AWS Earth Search STAC), if it's feasible at all.** The
product owner's rule for MVP is free where a free path exists — a recurring
Sentinel Hub subscription is not that, even at €25/month, while a pre-revenue
product has no revenue to pay it from. Option B stays written down above only
as the fallback if A turns out not to be workable within a reasonable amount
of effort.

**Left as ticket only for now — not scheduled to build this sprint.** The
free path is also the expensive-to-build one (a raster-compositing and
tile-serving pipeline that doesn't exist in this codebase today), and that
scope shouldn't be taken on without deliberately choosing to, separately from
writing it down.

## Explicit non-goals
- **No generative AI**, same as MC-050 — compositing here means picking
  among real captured pixels, never inventing ones that weren't captured.
- **Not a live feed.** "Fresher" means weeks-to-months old, not real-time —
  that's MC-052's fire-hotspot layer, a completely different data shape.

## Acceptance criteria
- [ ] The resulting imagery is visibly more current than MC-050's fixed
      annual mosaic for the same Indonesian test area.
- [ ] Cloud-covered source pixels are excluded from the composite, not shown.
- [ ] Built on option A (free) — if a spike shows that's genuinely not
      workable, come back and get an explicit go-ahead before reaching for
      option B's recurring cost, rather than defaulting to it.

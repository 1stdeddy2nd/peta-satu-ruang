# Backlog

Not scheduled. Nothing here gets built without agreeing a sprint for it first.

| Ticket | Title | Why it's parked |
|---|---|---|
| [MC-032](../tickets/backlog/MC-032-build-in-public.md) | Build-in-public: LinkedIn progress posts | Blocked on deployment (MC-033) — nothing for readers to try yet |
| [MC-042](../tickets/backlog/MC-042-tile-licensing-review.md) | Legal review: tile usage, data licensing, terms | License and data-source review done (PolyForm Noncommercial); tile sourcing + ToS/privacy still open, needed before MC-033 |
| [MC-058](../tickets/backlog/MC-058-mvp-launch-checklist.md) | MVP launch checklist | A gate, not a build — revisit before actually sharing this publicly, don't close by writing code |
| [MC-062](../tickets/backlog/MC-062-google-open-buildings-temporal.md) | Google Open Buildings 2.5D Temporal dataset | Raster time-series, not vector — needs its own feasibility spike and likely its own analysis-plugin-style feature, not a quick add to MC-051 |
| [MC-005](../tickets/backlog/MC-005-basemap-picker.md) | Basemap picker | Removed by MC-040; revive only with a commercial tile provider |
| [MC-029](../tickets/backlog/MC-029-analysis-plugins.md) | Analysis plugin system | The long-term bet. Needs a working single-user product first |
| [MC-030](../tickets/backlog/MC-030-community-templates.md) | Community template sharing | Needs accounts and persistence underneath |
| [MC-031](../tickets/backlog/MC-031-ai-template-from-image.md) | AI-generated template from an image | Depends on MC-030 and a stable template model |
| [MC-037](../tickets/backlog/MC-037-test-suite.md) | Automated test suite | No framework yet; code still churning. Pure logic first, not components |
| [MC-036](../tickets/backlog/MC-036-layout-versioning.md) | Layout document version history | Split out of MC-015; autosave without history is enough to ship |
| [MC-049](../tickets/backlog/MC-049-named-projects.md) | Named projects, a project list, delete | Split out of MC-015; one implicit project per user is enough for now |
| [MC-035](../tickets/backlog/MC-035-storybook.md) | Storybook component catalogue | Expensive now; the component list in the architecture rules covers the need |
| [MC-021](../tickets/backlog/MC-021-analysis-tools.md) | Built-in analysis tools | Whole feature area; may be superseded by MC-029 |
| [MC-023](../tickets/backlog/MC-023-attribute-table.md) | Attribute table / click-to-inspect | Not needed to produce a map sheet |
| [MC-025](../tickets/backlog/MC-025-undo-redo.md) | Undo / redo | Expected eventually; doesn't block a first export |
| [MC-026](../tickets/backlog/MC-026-multi-page.md) | Multi-page documents | One sheet is enough for v1 |
| [MC-027](../tickets/backlog/MC-027-vector-pdf.md) | Vector PDF export | Raster is fine for print |
| [MC-018](../tickets/backlog/MC-018-reorder-in-region.md) | Reorder elements inside a region | Template order is already correct; needs auto-scroll to work properly |
| [MC-019](../tickets/backlog/MC-019-detach-from-autolayout.md) | Detach element from auto-layout | A second positioning mode for little value |
| [MC-020](../tickets/backlog/MC-020-free-element-z-order.md) | Z-order of free elements from the panel | Canvas drag already brings to front |
| [MC-066](../tickets/backlog/MC-066-per-job-operational-view.md) | A per-job operational view for debugging imports | Idea behind the page MC-064 removed; the pipeline DAG covers it until a stuck import proves otherwise |
| [MC-068](../tickets/backlog/MC-068-building-vector-tiles.md) | Serve building footprints as vector tiles | Would remove MC-065's 20,000-feature cap, but it is a second kind of layer that breaks styling, legend and export; owner still deciding the shape |
| [MC-054](../tickets/backlog/MC-054-fresher-cloud-free-sentinel2.md) | Fresher Sentinel-2, our own cloud-free compositing | Written up during sprint-03 planning, never scheduled into it — real new raster-compositing infrastructure, not a quick add |
| [MC-086](../tickets/backlog/MC-086-dashboard-landslides.md) | Show landslides (gerakan tanah) on the dashboard | Finish the volcano layer (MC-084) first; the MAGMA source is unopened and carries the same robots.txt question |
| [MC-088](../tickets/backlog/MC-088-dashboard-flood.md) | Show flood extent/water level on the dashboard | Was a CONTOH dock placeholder with no data; removed by MC-087, no source research done yet |
| [MC-089](../tickets/backlog/MC-089-dashboard-population.md) | Show population figures on the dashboard | Was a CONTOH dock placeholder; more useful as context inside another hazard's popup than as its own layer — needs that decision first |
| [MC-090](../tickets/backlog/MC-090-dashboard-land-use.md) | Show land use (rice, oil palm) on the dashboard | Was a CONTOH dock placeholder; static reference data that reads as an Analysis-mode layer, not a real-time hazard |
| [MC-093](../tickets/backlog/MC-093-volcanic-ash-spread.md) | Volcanic ash spread on the map | Removed in MC-092: it fought the event markers and a reader could not act on it. |

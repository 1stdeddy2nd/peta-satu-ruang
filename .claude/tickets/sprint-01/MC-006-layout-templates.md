# MC-006 — Layout templates

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
Nobody should rebuild the same map furniture by hand every time. These built-in
templates are seeds to prove the shape — the long-term plan is community and
AI-generated templates (MC-030, MC-031).

## Functionality
Three templates, each with a wireframe preview card:
- **Blank canvas** — map fills the page, no preset elements.
- **Peta Administrasi** — bordered map with graticule on the left; ruled info
  column on the right carrying logo, title, north arrow, scale bar, legend,
  inset, coordinate-system notes and source/year.
- **Presentation** — title band on top, decoration strip along the bottom.

Applying a template replaces page elements; a confirm dialog appears when there
is existing work to lose. Uploaded data and map position are never touched.

## Acceptance criteria
- [x] Each template renders and exports correctly.
- [x] Switching templates warns before discarding elements.

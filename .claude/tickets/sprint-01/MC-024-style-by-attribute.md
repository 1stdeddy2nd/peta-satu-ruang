# MC-024 — Style layers by attribute

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** MVP v1

## Why now
The gap between what we produce and a real admin sheet. Every feature in a layer
currently renders one flat colour, so the five Jakarta kota come out identical —
where the reference sheet gives each one its own colour and lists them in the
legend.

**Does not depend on MC-023** as originally written: colouring by attribute needs
attribute *values*, not an attribute-table UI. That dependency is dropped.

## Functionality
- **Categorised** — a colour per distinct attribute value.
- **Graduated / choropleth** — classify a numeric field (quantile, equal
  interval, natural breaks) onto a colour ramp.
- Feeds the legend (MC-022) with the resulting classes.

## How it works
- Attribute keys are collected when a file loads, minus geometry and KML's
  presentational extras, and offered as "Colour by" on the layer.
- Choosing a field derives the distinct values and assigns evenly spaced hues,
  so classes read as distinct rather than shades of one colour.
- Each class colour is editable; the layer's own colour stays the fallback for
  features with no value.
- Styles are cached by colour, so the per-feature style function allocates
  nothing while rendering.

Categorised only. Graduated/choropleth for numeric fields is not built.

## Acceptance criteria
- [x] Colouring by `nama` gives each of the five kota its own colour.
- [x] Switching field recomputes the classes; switching back to a single colour
      restores flat rendering.
- [x] Class colours are individually editable.
- [x] Walkthrough: `e2e/videos/MC-024-style-by-attribute.webm`.

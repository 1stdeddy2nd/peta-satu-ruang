# MC-021 — Spatial analysis tools

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** epic
- **Milestone:** post-v1

## Why parked
A whole feature area. The MVP is about producing a map sheet; analysis is the
next product step, not a launch blocker.

## Functionality
Fill the stubbed "Tools" section of `AnalysisPanel`:
- **Buffer** — distance, units, around a chosen layer.
- **Intersect** / **Clip** between two layers.
- **Measure** distance and area interactively.
Results become new layers in the layer manager.

## Notes
`@turf/turf` is the obvious library, but it was removed from the project while
unused — reinstall when this is picked up. Break into one ticket per tool.

## Acceptance criteria
- [ ] Each tool produces a new layer that can be styled and exported.

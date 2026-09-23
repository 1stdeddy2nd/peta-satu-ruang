# MC-035 — Storybook component catalogue

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** chore
- **Milestone:** post-v1

## Why parked
The need — "see what components exist" — is real, but Storybook is an expensive
way to meet it right now, and it does not move a user closer to a finished map.

## The cost, honestly
- ~40 extra dependencies, a second build pipeline, and Tailwind v4 + Next 15
  config to keep working.
- Only about a third of the components render in isolation. Most read Zustand
  stores, and every canvas component (`ScaleBar`, `InsetMap`, `MapFrame`,
  `PrintCanvas`) needs a live OpenLayers instance from `MapProvider`. Those
  need decorators and mocks that then have to be maintained.
- A catalogue that drifts from reality is worse than no catalogue.

Cleanly storyable today: the six `atoms/`, plus `ElementCard`, `LayerCard`,
`TemplateCard` and `UploadDropzone` — all pure-prop components.

## When it becomes worth it
- Someone else joins and needs to discover components without reading the tree.
- The design system stabilises enough that stories stop churning.
- We want visual regression testing.

## Alternative if the need returns sooner
A dev-only `/components` route rendering the pure-prop components — one file,
no dependencies, and it cannot drift because it imports the real thing.

## Acceptance criteria
- [ ] Every pure-prop component has a story.
- [ ] Store- and map-dependent components have documented decorators.
- [ ] Runs in CI without breaking the main build.

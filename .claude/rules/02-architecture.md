# Architecture

Next.js 15 (App Router) · TypeScript · OpenLayers 10 · Tailwind v4 + SCSS ·
shadcn/ui · Zustand.

## Folders

```
src/
  app/          routes; page.tsx only wires providers + AppShell
  contexts/     ALL state and domain logic, grouped by purpose
    workspace/  current mode, panel open/closed
    map/        OL instance, layers, view, graticule, parsing, scale maths
    layout/     page, map frame, elements, regions, templates, canvas zoom
    print/      page geometry (mm↔px) and PDF/PNG export
    project/    save/load API client, server persistence, autosave sync
  components/   presentation only, atomic design
    atoms/ molecules/ organisms/ templates/
    ui/         shadcn primitives — generated, don't hand-edit
  lib/          generic helpers only (cn)
  styles/       print.scss — @media print and OL overrides
```

Where new code goes: state or business logic → `contexts/<domain>/`, never in a
component. A reusable control → `atoms/`. A small composite → `molecules/`. A
sidebar section or canvas feature → `organisms/`. A full-screen arrangement →
`templates/`.

**Every context is flat, never subfoldered.** Files sit directly in
`contexts/<domain>/`, named `<domain>-<kind>.ts` (`map-store.ts`,
`map-types.ts`, `map-utils.ts`, `layout-templates.ts`, `project-api.ts`), and a
hook, if the context has one, is `use-<domain>.ts` (`use-print.ts`,
`use-project-sync.ts`). A `types/`, `api/`, or `utils/` subfolder is the one
pattern to avoid here — it reads as if the file could belong to any domain,
which is exactly backwards for a folder whose whole point is one domain's
logic in one place (MC-055 undid one drift of this kind).

Import from the barrel: `@/contexts/map`, not `@/contexts/map/map-store`.

## State

- **Zustand** (`useWorkspace`, `useMapSettings`, `useLayout`) for shared state.
  Components subscribe to slices, and `getState()` works outside React.
- **React Context** (`MapProvider` / `useMap`) only for the OpenLayers instance
  and its imperative actions. One stable object, not fine-grained state.

## Element positioning

Every element has a `placement`:

- **`flow`** — a child of a template `LayoutRegion`, stacked by CSS flex. Can't
  overlap siblings; reflows when one resizes or hides.
- **`free`** — absolutely positioned by `rect`, draggable, may overlap. Renders
  at `zIndex + 10` so it stays above regions (z-index 1) and the map frame (0).

See `contexts/layout/layout-flow.ts` and `organisms/canvas/FlowRegion.tsx`.

Hard-won mistakes live in `03-gotchas.md`. Read it before debugging anything
odd, and add to it whenever something bites.

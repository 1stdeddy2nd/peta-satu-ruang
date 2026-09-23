# MC-055 — Make `contexts/*` file naming and structure consistent

- **Status:** DONE
- **Board:** sprint-03
- **Type:** chore
- **Milestone:** MVP v1

## Why
Every context except `project/` follows the same flat shape: files sit
directly in `contexts/<domain>/`, named `<domain>-<kind>.ts`, with a hook (if
any) as `use-<domain>.ts`:

```
contexts/map/       map-provider.tsx, map-store.ts, map-types.ts, map-utils.ts
contexts/layout/     layout-store.ts, layout-types.ts, layout-templates.ts, layout-flow.ts
contexts/workspace/  workspace-store.ts
contexts/print/      print-utils.ts, use-print.ts
```

`contexts/project/` (added in MC-015, restructured mid-review) breaks this in
three ways at once:

```
contexts/project/  api/project.ts       — subfolder + bare filename, not project-api.ts
                    types/project.ts    — subfolder + bare filename, not project-types.ts
                    utils.ts            — missing the domain prefix every other context uses
                    use-project-sync.ts — this one's actually fine, matches use-<domain>.ts
```

Nothing about this is broken — it's inconsistent, and inconsistency is what
makes a codebase slower to read: the next file to open in an unfamiliar
context is a guess instead of a pattern.

## Functionality
Bring `contexts/project/` in line with the rest:
- `api/project.ts` → `project-api.ts`
- `types/project.ts` → `project-types.ts`
- `utils.ts` → `project-utils.ts`
- Drop the now-empty `api/` and `types/` subfolders.
- Update the barrel (`contexts/project/index.ts`) and every import site
  (`map-provider.tsx`, `use-project-sync.ts`, the `api/project/*` route
  handlers) to the new paths.

Worth a short addition to `02-architecture.md`'s Folders section spelling out
the `<domain>-<kind>.ts` / `use-<domain>.ts` convention explicitly, so the
next new context doesn't have to reverse-engineer it from example — which is
exactly how this one drifted.

## Non-goals
- Not a behavior change of any kind — pure rename/move, no logic touched.
- Not touching `components/`, `lib/`, or any other top-level folder — scoped
  to `contexts/*` only, per the request that raised this.

## Acceptance criteria
- [x] `contexts/project/` matches the flat `<domain>-<kind>.ts` shape every
      other context already uses.
- [x] `02-architecture.md` states the naming convention explicitly.
- [x] `make check` passes — a pure rename should touch nothing behavioral.
- [x] No leftover references to the old `api/`/`types/` subfolder paths
      anywhere in the codebase (`grep -r "project/api\|project/types"`).

### Verification note
Individually-targeted e2e specs (MC-015, MC-050) re-ran clean against the
renamed files. Running the *full* suite (`make verify`, no filter) turned up
two genuine, pre-existing bugs unrelated to this rename — MC-056 (KML Z-
dimension crash) and MC-057 (e2e specs sharing one persisted project leak
state into each other) — both ticketed separately rather than folded into
this one, since neither is a naming-consistency problem and both predate this
change.

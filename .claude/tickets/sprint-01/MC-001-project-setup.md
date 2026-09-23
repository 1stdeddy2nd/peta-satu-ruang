# MC-001 — Project setup and tooling

- **Status:** DONE
- **Board:** sprint-01
- **Type:** chore
- **Milestone:** v0

## Why
Everything else needs a working app skeleton.

## Functionality
- Next.js 15 (App Router) + TypeScript, `src/` layout, `@/*` alias.
- Tailwind v4 plus SCSS (`src/styles/print.scss`) for print rules.
- shadcn/ui primitives in `components/ui/` (generated — do not hand-edit).
- OpenLayers 10 for all mapping.
- Atomic-design component tree and domain `contexts/`.

## Developer commands
A `Makefile` is the entry point, so there is one command to remember instead of
a list of npm scripts:

| Command | Does |
|---|---|
| `make install` | install dependencies — the first command on a fresh clone |
| `make dev` | run the dev server |
| `make check` | typecheck → lint → test → build; what must pass before a commit |
| `make build` / `lint` / `typecheck` / `test` | the individual steps |
| `make kill` | stop whatever is holding port 3000 |
| `make clean` | drop `.next`, caches and tsbuildinfo |

Caching keeps `make check` cheap: eslint writes a result cache under `.cache/`
(gitignored), tsc is incremental via tsconfig, and `next build` reuses
`.next/cache`. Warm run is about 9s for all four steps.

`make build` **refuses to run while the dev server is up**, because they share
`.next` and building underneath a live dev server leaves it serving 404s. That
gotcha is now enforced by the tooling, not just written down.

`make install` runs `npm install`, which is what a developer wants day to day.
CI should use `npm ci` instead — reproducible from the lockfile — so that is
specified in MC-033 rather than here.

`make test` currently reports that there is no suite — see MC-037.

## Acceptance criteria
- [x] `make install` installs dependencies from a clean clone.
- [x] `make dev` serves the app.
- [x] `make check` runs typecheck, lint, test and build, and passes.
- [x] Lint, typecheck and build are cached; repeat runs only redo what changed.
- [x] `make build` refuses to run while the dev server holds port 3000.
- [x] Caches are gitignored.

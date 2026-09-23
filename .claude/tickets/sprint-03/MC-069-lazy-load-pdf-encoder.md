# MC-069 — Load the PDF encoder only when someone exports

- **Status:** DONE
- **Board:** sprint-03
- **Type:** performance
- **Milestone:** MVP v1

## Why
The product owner asked whether splitting Analysis and Layout into separate
pages would make the app lighter. Measured rather than guessed, and the answer
turned out to be about a dependency, not the page structure.

`/` is **479 kB of first-load JS**. `jspdf` is a static import in
`print-utils.ts`, so every visitor downloads a PDF encoder before they have any
data on the map, whether or not they ever export. That is 128 kB paid up front
by exactly the user `01-product.md` is written for — a low-spec machine on a
slow, unreliable connection.

## Measured
| build | first load | saved |
|---|---|---|
| today | 479 kB | — |
| `jspdf` lazy | **351 kB** | **128 kB** |
| `jspdf` + whole Layout mode lazy | 321 kB | 158 kB |

## Why only jsPDF, and not the Layout mode too
Deferring all of Layout buys just **30 kB more** and costs real behaviour: the
app opens in Analysis ("Prepare your data, then switch to Layout"), so
everybody reaches Layout eventually — deferring it moves the download to the
moment they press the mode switch, which is a stall exactly where it is most
noticeable. Avoiding that needs a prefetch mechanism, which is not worth
building for 30 kB. **Rejected for now**; the remaining weight is OpenLayers,
which both modes need and no splitting removes.

Nothing about the page structure changes. A separate route per mode was also
rejected: `01-product.md` makes one OpenLayers instance non-negotiable, and
`AppShell` keeps both workspaces mounted so `setTarget()` can move the map
between them. Separate routes would unmount it.

## Non-goals
- **No change to how export works.** Export stays WYSIWYG; only *when* the
  encoder arrives changes.
- **Not a general bundle-splitting pass.** One dependency, measured.

## Acceptance criteria
- [x] `/` first-load JS drops to ~351 kB.
- [x] Exporting a PDF still works, and still matches the canvas.
- [x] No visible change to the Layout workspace on load.

## Verified
`tsc --noEmit` and `eslint` clean. `npm run build` reports `/` at **351 kB**
first-load JS, down from 479 kB.

MC-014's export walkthrough re-recorded and passing **on this branch** — PNG and
PDF both download, at true page size rather than the ~80% display zoom, so the
encoder arriving late changes nothing about what comes out. Worth stating that
it was run on this branch: a first attempt ran the same spec from another
branch that no longer carried the dynamic import, so it proved nothing.

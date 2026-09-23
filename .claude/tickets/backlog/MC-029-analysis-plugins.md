# MC-029 — Analysis plugin system

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** epic
- **Milestone:** post-v1

## Why parked
This is the long-term bet, not the MVP. It only makes sense once there is a
working single-user product, persistence and accounts to build on.

## Why it matters
Depth should come from the community rather than from us building every tool.
A study like AKL/SKL takes about ten steps in desktop GIS. The method is
encoded once as a plugin; everyone else picks it from a list and gets the
result in one step.

## Decisions
- **Who can publish:** **admins only** to start. That is the trust model for
  v1 of this feature — no review process needed because nothing untrusted is
  accepted. Community publishing comes later, with review.
- **Where it runs:** **on the server**, never in the browser. This is the whole
  point for the low-spec, low-bandwidth user.
- **Shape:** **declarative, like an n8n node.** A plugin declares the inputs it
  requires and the output it produces. It is configuration, not arbitrary code
  — which is also what makes admin-only review tractable later.
- **Execution:** **one-shot.** Submit inputs, get a result. No long-running or
  interactive sessions.
- **Output:** whatever the analysis calls for — Shapefile, GeoTIFF, or a styled
  layer straight back into the app.
- **Price:** free for now.

## Functionality
- A plugin definition: required inputs (which layers, which attributes),
  parameters, and declared output type.
- Users browse the plugin list, pick one, choose inputs, run it.
- The run happens server-side against PostGIS; the result returns as a new
  layer or a downloadable file.
- An admin publishing flow.

## Open questions
- What is the declarative vocabulary? n8n-style nodes imply a small set of
  composable operations — which ones ship first?
- Where do long analyses queue, and how is progress reported?
- Versioning: what happens to a saved project when a plugin changes?

## Acceptance criteria
- [ ] A non-expert runs a published multi-step analysis in one step.
- [ ] Execution happens server-side; the browser only sends inputs and shows
      the result.
- [ ] Output can be pulled into a layout, or downloaded as SHP/GeoTIFF.

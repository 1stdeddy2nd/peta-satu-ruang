# Product

**Canva for maps.**

Photoshop and QGIS/ArcGIS both need an expert. Canva didn't make Photoshop
simpler — it made the outcome reachable without one. Same bet here: **making a
map, or running a GIS analysis, shouldn't require a GIS specialist.** Print is
one output, not the point.

## Who it's for

**People who need a map or an answer from spatial data — not people who enjoy
GIS.** If the product still assumes a specialist, the promise above is broken.

- A planner, field officer, student, NGO worker or consultant who has data, or
  needs a result from data, but no QGIS training and no appetite to acquire it.
  They know their own domain; they do not know projections.
- **Someone on a low-spec machine in a remote region**, on a slow or unreliable
  connection, who could not run QGIS or ArcGIS even if they wanted to. Today
  they are shut out of GIS entirely.

GIS-literate users are welcome and will move faster, but nothing in the product
may assume them.

GIS experts matter on the **other side of the market**: they author the plugins
and templates that let everyone above get a result in one step. We build *for*
the person running the analysis, *with* the person who knows how it works.

This second user is why it is a **browser app**, and it constrains engineering:
keep the bundle and the runtime light, and push heavy work to the server
(including Claude-backed analysis) instead of onto their machine.

## Market

**Indonesia first, international eventually.** The local admin-map convention is
the beachhead, and rural and remote Indonesia is exactly where the low-spec,
low-bandwidth user lives.

That is a go-to-market choice, not an architectural one: nothing in the data
model, vocabulary or UI should assume Indonesia. Regional conventions arrive as
community templates (MC-030), never hardcoded.

## Two modes

| Mode | Purpose |
|---|---|
| **Analysis** | The data — upload, restyle, and later run analysis |
| **Layout** | The page — pick a template, arrange, export |

What the data *is* → Analysis. How the page *looks* → Layout. Never duplicate a
control across both.

## Scope today

Layouting, plus simple analysis. That is the whole product for now.

## Where it's going

Depth comes from the community, not from us building every tool:

- **Analysis plugins** — GIS experts publish them; a user picks one and gets a
  result in one step instead of ten. A study like AKL/SKL becomes a choice, not
  a procedure.
- **Plugin generator from a paper** — point at the academic paper describing a
  method and generate a runnable plugin from it. Published methods become
  usable tools without anyone writing code, which is what makes a community
  plugin library realistic rather than aspirational.
- **Community templates** — users publish layouts other users reuse.
- **AI-generated templates** — upload a picture of a map sheet and get a
  reusable template back, shareable with everyone else.

Built-in templates and tools are seeds to prove the shape, not the product.

## Non-negotiables

- **One OpenLayers instance** for the app; it moves between modes via
  `setTarget()` so view and layers survive the switch. Never create a second.
- **Export is WYSIWYG.** Canvas zoom is display-only and stripped before
  capture.
- **Stay light.** Weigh every dependency and every render against a slow
  machine on a slow connection. Heavy compute belongs on the server.
- **The editor is desktop only.** Below 1024px show an explainer, not a
  broken editor. The dashboard is not: it is read on a phone in the field,
  so it lays out down to 360px.

## Design rules

- **Default first, vocabulary second.** Nobody should have to know what a
  graticule is to get a good map — the defaults must already be right. Correct
  GIS terms ("1:25,000", "WGS 84", "graticule") stay exact where they appear,
  but the controls that need them belong behind an advanced mode, not in the
  first screen.
- **Hide the machinery, not the concepts.** Reprojection and resolution maths
  just happen.
- **A good default beats a new control.** Every knob is paid for by everyone
  who didn't need it.
- **Don't chase QGIS parity.** Being a worse QGIS is the failure mode.

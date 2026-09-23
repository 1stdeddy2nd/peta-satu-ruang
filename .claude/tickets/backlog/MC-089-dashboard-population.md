# MC-089 — Show population figures on the dashboard

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** MVP v1

## Why it's parked
"Penduduk" was a dock row from MC-078 marked CONTOH — a placeholder with no
data behind it, removed by MC-087 along with Banjir and Lahan. Unlike the
other dashboard layers this is not itself a hazard; it would matter mainly as
context for the others (how many people are near an erupting volcano, an
earthquake, a flood) rather than as a layer someone switches on by itself.

## Before scheduling
- Decide the actual use case: a standalone population layer, or a number shown
  inside another hazard's popup ("~40,000 people within the KRB II zone")?
  The second is more useful and belongs on that hazard's ticket, not here.
- Find a source — BPS publishes population by administrative area; a raster
  product (e.g. WorldPop) would be needed for anything finer than a
  village-level count.

# MC-042 — Legal review: tile usage, data licensing, terms

- **Status:** PROGRESS
- **Board:** backlog
- **Type:** chore
- **Milestone:** pre-launch

## Decision: MapCanva ships noncommercial, under PolyForm Noncommercial 1.0.0

The product owner decided to launch the MVP as noncommercial rather than
under a permissive open-source license. Worth being precise about the terms
here, since it's an easy mix-up: **"open source" and "noncommercial" are not
compatible** — the Open Source Definition's Criterion 6 requires that a
license permit commercial use, so MIT/Apache/GPL would *not* have delivered
what was actually wanted (a promise that no one can build a paid product on
this code). What was needed is a **source-available, noncommercial**
license instead — code stays public and readable, but a clause forbids
commercial use.

**[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)**
was chosen: purpose-built for software (unlike CC BY-NC-SA, drafted for
creative works and ambiguous on things like linking or API use), with real
precedent — EPPlus (a well-known .NET library) ships free under this exact
license and sells a separate commercial license to companies that want one,
without ever having to relicense noncommercial users. It also explicitly
protects use by nonprofits, educational institutions, and government bodies
"regardless of the source of funding" — directly relevant, since NGO workers
are a named target user (`01-product.md`). License text is in `LICENSE` at
the repo root; this choice conveniently resolves the one real blocker below
(EOX) as a side effect, since the platform itself is now noncommercial by
construction.

**This is not a substitute for a real lawyer.** It's a defensible, precedented
choice made in good faith with no legal budget — get it reviewed by an actual
lawyer before this handles real user data or real money, especially given the
cross-border data involved (EU Copernicus data, US NASA data, Indonesian
deployment and users).

## Per-source licensing — verified against source, not assumed

Full detail lives in `THIRD_PARTY_NOTICES.md`. Summary:

| Source | License | Commercial use | Status |
|---|---|---|---|
| OpenStreetMap (tiles + data) | ODbL | Allowed | Data license is fine; the *tile server's* usage policy is a separate, non-legal service-continuity risk — see below |
| EOX Sentinel-2 cloudless (MC-050/053) | CC BY-NC-SA | **No** | ✅ Resolved — matches MapCanva's own noncommercial license exactly |
| Google Open Buildings (MC-051) | CC BY 4.0 | Allowed | ✅ Fine, more permissive than needed |
| Microsoft Building Footprints (MC-051) | CDLA Permissive 2.0 | Allowed | ✅ Fine, more permissive than needed |
| NASA FIRMS (MC-052) | Open/public, citation requested | Allowed | ✅ Fine |

## The one that actually matters for launch: OSM's Tile Usage Policy

Separate from ODbL's data license. We render from OpenStreetMap's public tile
servers, donated infrastructure with its own
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/): no
bulk downloading, must cache locally 7+ days, needs a distinct User-Agent
(not fully achievable from a browser, which controls that header itself —
an accepted, unavoidable limitation of a browser-based tile consumer), and
"access may be blocked without notice" for heavy or commercial-looking
traffic. This is a *service-continuity* risk, not a copyright one — nobody
comes after us legally for it, the tiles just might stop loading one day.
Fine at MVP scale (one seeded admin, low traffic). Before real growth, this
still needs either:

- a commercial tile provider (MapTiler, Stadia, Protomaps, Mapbox), or
- self-hosted tiles, cheaper at scale but real infrastructure.

This should be settled before MC-033 puts a URL in front of the public (the
seeded-admin-only MVP doesn't need it yet).

## Also to settle
- **User-uploaded data.** MapCanva cannot know its license and makes no claim
  over it — the user is responsible for having the rights to what they
  upload. Written down in `THIRD_PARTY_NOTICES.md`; still needs a proper
  Terms of Service clause once real signup exists (MC-033).
- **Exported sheets.** ODbL's attribution requirement travels with an
  exported PDF/PNG containing OSM tiles — already handled by baking
  attribution into every export (MC-041). Since MapCanva itself is
  noncommercial, the Terms of Service should also say plainly that a user's
  exported output is for noncommercial use too, consistent with the license
  — otherwise the license restricts the code but says nothing about what
  someone does with what it produces.
- **Terms of service and privacy policy** — still to draft. Lower urgency
  while there's one seeded admin and no public signup; needed before MC-033
  puts a URL in front of real users.
- **Community plugins and templates** (MC-029, MC-030) — license for
  published content, and liability for what a plugin computes. Not urgent;
  neither feature is built yet.

## Acceptance criteria
- [x] License decided and published (`LICENSE`: PolyForm Noncommercial 1.0.0).
- [x] MC-050, MC-051, MC-052's data-source licenses confirmed safe to ship,
      written down in `THIRD_PARTY_NOTICES.md`.
- [x] Written position on user data and exported sheets
      (`THIRD_PARTY_NOTICES.md` + the note above on Terms of Service needing
      an explicit noncommercial-output clause).
- [ ] Tile sourcing (OSM's usage-policy risk) decided and, if it means a
      commercial provider or self-hosting, ticketed — not urgent before
      MC-033, but must land before that ticket ships publicly.
- [ ] Terms of service and privacy policy drafted.

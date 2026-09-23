# MC-058 — MVP launch checklist

- **Status:** TODO
- **Board:** backlog
- **Type:** chore
- **Milestone:** pre-launch

## Why
Requested directly: a single place to check before actually sharing this
platform with anyone outside the seeded admin account, so pre-launch items
don't get lost across individual tickets or forgotten between now and
whenever launch actually happens. This ticket is a gate, not a build — it
should stay open and get revisited, not closed by writing code.

**Nothing on this list is done just because the underlying feature is done.**
A checked box here means verified specifically in the context of "a stranger
can now reach this," not "the code exists."

## Checklist

### Legal (MC-042)
- [ ] Terms of Service drafted and shown somewhere a user actually sees it.
- [ ] Privacy policy drafted — matters as soon as there's more than one
      account, since that means real personal data (email, uploaded data)
      belonging to someone who isn't the person who wrote the code.
- [ ] OSM tile-usage risk resolved — either a commercial tile provider or
      self-hosted tiles, since the free `tile.openstreetmap.org` policy
      explicitly allows blocking "commercial-looking" or heavy traffic
      without notice. Fine today at seeded-admin-only scale; not fine the
      moment there's real traffic.
- [ ] `LICENSE` and `THIRD_PARTY_NOTICES.md` still accurate — re-check if any
      dependency's data source has changed terms since MC-042.
- [ ] **MAGMA Indonesia reading reviewed (MC-084).** The volcano layer reads
      `magma.esdm.go.id` although its `robots.txt` disallows all crawlers, and
      shows PVMBG's recommendation text verbatim. Owner's call for
      development; before going public, get a legal read (UU ITE, UU Hak
      Cipta) and ideally PVMBG's written permission — or switch off the layer.

### Access (MC-043's scope decision)
- [ ] **Decide how anyone other than the seeded admin actually gets in.**
      MC-043 deliberately shipped one seeded account, no self-service
      sign-up — that was correct for testing, but "share into public" needs
      an actual answer here: invite-only, self-service sign-up, or something
      else. Don't let this get discovered the hard way (someone asks "how do
      I make an account?" and there's no answer).
- [ ] If sign-up opens up: `admin`/`admin`-style defaults are nowhere in
      reach of a real user — confirm `SEED_ADMIN_PASSWORD` etc. were actually
      changed from repo defaults in production (MC-047 already flags this;
      re-verify at launch time, not just at deploy time).

### Deployment (MC-033, MC-047)
- [ ] The app is actually live at a URL, not just "deployable."
- [ ] Database backups exist, or the product owner has explicitly accepted
      the risk of not having them yet.
- [ ] Basic uptime/error monitoring exists — or at minimum, a way to find out
      the app is down other than a user reporting it.

### Known gaps worth a conscious decision, not a surprise
- [ ] MC-056 (KML uploads with altitude crash persistence, silently) —
      decide: fix before launch, or accept the risk and document it.
- [ ] MC-057 (e2e specs share state) — doesn't block launch by itself, but
      if it's still unfixed, there is no reliable regression signal before
      whatever ships next after this checklist is written.
- [ ] Upload caps (25MB/file, 200MB/project, MC-015) still make sense for
      real users, not just the sample data used in development so far.

## Acceptance criteria
- [ ] Every box above is either checked or has an explicit "accepted risk,
      decided by [the product owner], because [reason]" note next to it —
      not left blank and forgotten.

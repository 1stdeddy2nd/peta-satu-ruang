# MC-031 — AI-generated template from an uploaded image

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
Depends on community templates (MC-030) to be worth much, and needs the
template model to be stable first.

## Why it matters
The fastest path to a template someone actually wants is the map sheet they
already have. Upload a picture of it, get a working template back — then it can
be shared like any other.

## Functionality
- Upload an image of an existing map sheet (PNG/JPG/PDF page).
- A model infers the layout: map frame position, and the placement of title,
  legend, north arrow, scale bar, inset, logo and text blocks.
- Emits a `TemplateResult` — regions plus flow children — matching what
  `layout-templates.ts` produces today.
- Result opens in the editor for correction before saving or publishing.

## Open questions
- Accuracy bar for a useful first draft — how wrong is too wrong?
- Do we infer text content as well as boxes, or boxes only?
- Cost per generation, and who pays.

## Acceptance criteria
- [ ] A photographed admin map yields a template recognisable as that layout.
- [ ] The result is editable, and publishable via MC-030.

# Product Decision Hierarchy UI Pass

## Status

Approved for direct implementation by the user's standing instruction to make
the UI pass without per-step approval stops.

## Problem

The production UI system is visually coherent, but two shopper-facing surfaces
still present every value with equal weight:

- the homepage product ledger repeats a six-field schema above and inside every
  product row; and
- the product-detail offer snapshot renders four same-weight definition rows;
  and
- API-token rows give identity, lifecycle, and status identical visual weight.

These surfaces expose correct data, but they read like serialized parameters
rather than a buying workspace. The user must first decode the schema and only
then find the decision.

## Visual Thesis

ProductCompare should read like an editorial comparison sheet: product identity
first, the best current decision signal second, and supporting context only
where it changes the decision. The existing warm mineral/paper palette,
Instrument Sans, IBM Plex Mono, comparison blue, freshness green, dividers, and
compact controls remain the visual language.

## Content Hierarchy

### Homepage product ledger

Each row has three regions:

1. **Product summary** — category eyebrow, product name, and defining
   highlights as one readable thought.
2. **Market snapshot** — best current offer as the primary fact, followed by
   price context and freshness.
3. **Decision actions** — product detail and comparison actions.

The six-column heading strip and repeated `Highlights` and `Price signal`
labels are removed. On narrow screens, identity and the best offer stay visible;
price context and freshness move into the existing accessible disclosure.

### Product-detail offer snapshot

The lowest visible offer is the primary value. Visible-offer count, coupon
availability, and missing-price coverage become supporting prose rather than
four equal definition rows. Mixed-currency and missing-price states retain
their truthful existing copy.

### Product specifications

Specifications remain grouped definition lists. A parameter-like structure is
correct for technical specifications, so this pass does not turn them into
cards, prose, or decorative badges.

### API-token records

The token label and status form one header. The prefix is the primary technical
identifier, while created, expiry, and last-use dates form a quiet lifecycle
strip. The definition-list semantics and every lifecycle fact remain intact.

## Interaction Thesis

No new motion or dependency is required. Existing Base UI disclosure behavior,
keyboard focus, reduced-motion handling, and direct links remain unchanged.
Mobile disclosure continues to meet the 44-pixel target and exposes price
context and freshness without duplicating the visible product highlights.

## Constraints

- Preserve GraphQL fragments, Relay ownership, URL state, offer calculations,
  comparison limits, and all existing destinations.
- Preserve semantic lists, headings, status meaning, and accessible names.
- Use StyleX and existing primitives; do not add class-name composition helpers,
  card mosaics, or new dependencies.
- Keep desktop, tablet, and mobile layouts bounded by the existing page shell.
- Update visual regression snapshots only after inspecting the rendered result.

## Verification

- Component tests assert the decision hierarchy and disclosure content.
- Route tests assert that legacy schema headings are absent while all facts and
  actions remain reachable.
- Playwright geometry checks verify the three-region desktop composition, the
  two-column tablet composition, and mobile disclosure behavior.
- Production UI screenshots are reviewed at desktop, tablet, and mobile sizes.
- The complete frontend check and production build gates pass.

# UI Beauty And Component Reuse Design

## Status

Approved for direct implementation by the user on 2026-08-11. The user asked
for a GPT-5.6 subagent pass and explicitly asked execution to continue without
approval checkpoints until the fix is complete.

## Goal

Make the shopper-facing ProductCompare workspace calmer, more beautiful, and
easier to operate without removing information or changing product behavior.
Use the locally owned `shadcn-cssinjs`/Base UI primitives wherever they already
cover the interaction instead of adding one-off controls.

## Visual Thesis

ProductCompare is an editorial buying ledger: warm paper, decisive ink, one
blue action system, and green reserved for evidence that materially improves a
decision.

## Content Plan

1. A compact application header preserves brand, primary search, comparison,
   exploration, and account destinations without consuming the mobile canvas.
2. Offer scope and the current price snapshot lead the route; mobile users can
   refine the same complete filter form before reading all results.
3. Product and offer rows read as identity, decision evidence, then action.
4. Supporting detail remains available through existing disclosure patterns.

## Interaction Thesis

- Mobile navigation collapses secondary destinations into one Base UI Popover
  while preserving every destination and 44px targets.
- Mobile offer refinement opens in the existing Base UI/shadcn Dialog; desktop
  retains the sticky context rail.
- Existing Base UI disclosure transitions continue to reveal genuinely
  secondary information. Decision-critical price context and freshness remain
  visible at every breakpoint.

## Component Reuse Contract

The repository already owns the approved `shadcn-cssinjs` snapshot in
`assets/src/ui/primitives`; it is source, not an npm runtime dependency. This
pass reuses:

- `Popover` and `Button` for compact navigation;
- `Dialog`, `Button`, `Input`, `Select`, `Checkbox`, and `Label` for offer
  refinement;
- `Alert`/`Spinner` through `FeedbackState` for authentication feedback; and
- existing `Badge`, `Collapsible`, `Tabs`, and list/layout composites where
  they already encode useful ProductCompare semantics.

Do not replace `DataList`, `SummaryStrip`, `ProductLedger`, or page/workspace
layout components merely to look more like a component catalog. They encode
real semantic and product structure and have no locally owned shadcn
counterpart.

## Responsive And Information Contract

- The resting mobile header is one row and remains no taller than 72px.
- Every navigation destination remains keyboard and touch reachable.
- Mobile offer filters are reachable before the offer list without duplicating
  or truncating the form.
- Product price signal and freshness remain visible on mobile.
- Ordinary merchant prices use primary ink; only the best-price highlight uses
  value green. Unavailable prices remain muted.
- Offer rows keep merchant, domain, product context, current price, freshness,
  status, action, price history, and coupon information.
- Page headings tighten on small screens without changing copy or desktop
  hierarchy.

## Non-goals

- No GraphQL, Relay, URL, backend, authorization, or sorting changes.
- No dependency upgrades or new registry components.
- No stock shadcn theme, Tailwind, card mosaic, or generic DataTable wrapper.
- No broad route-focus or error-recovery redesign in this visual slice.

## Verification

Use failing behavioral and browser assertions before production changes. Run
focused unit and Playwright suites, inspect desktop and mobile screenshots at
original resolution, then run the complete frontend gate, queue validator, and
Git hygiene checks.

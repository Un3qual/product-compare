# Operator Workspaces

## Snapshot

- Status: active
- Priority: P1
- Owner: `codex/operator-workspaces`
- Plan: `docs/superpowers/plans/2026-08-12-operator-workspaces-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-13 against affiliate setup, CJ lifecycle/feed, revenue
  summary/ledger, generated Relay operations, and focused route tests.

## Target Outcome

Affiliate setup is a guided workflow, CJ is a lifecycle ledger with independent
feed regions, and revenue is a dense control/metric/attribution workspace with
independent failure recovery and generated type ownership.

## Owned Paths

- Affiliate setup, CJ programs, and commerce revenue route capabilities and
  focused tests named by the plan.
- Production operations Playwright spec and snapshots.
- This lane document.

## Internal Slices

1. Density/lifecycle/failure characterization.
2. Guided affiliate workflow.
3. CJ lifecycle and feed inspection.
4. Revenue controls, metrics, and attribution details.
5. Operator overvalidation and file-ownership audit.
6. Browser and full verification.

## Verification

Focused operator suites, deterministic browser/axe/visual checks at three
widths, `cd assets && pnpm run check`, backend full gates, queue validation, and
diff checks.

## Implemented Ownership

- Affiliate setup is composed from numbered `network`, `program`,
  `merchant-link`, and `coupon` steps. Generated mutation variables are built at
  the HTML form boundary, mutation outcomes live with their Relay operations,
  and merchant selection context is a projection of the generated route query.
- CJ program management is a TanStack lifecycle table. Program mutation state,
  program-feed disclosure/query state, unmatched-feed preload/query state, and
  lifecycle policy each have separate owners and failure boundaries.
- Revenue reporting renders one main-band control region before its generated
  metric projection and independently preloaded attribution ledger. Conversion
  reconciliation facts use a generated fragment and an accessible disclosure.
- The former generic `affiliate-setup-data.ts`, `cj-program-data.ts`,
  `RevenueSummaryView.tsx`, and `revenue-summary-view-data.ts` owners were
  removed or renamed by their actual responsibilities.

## Retained Manual Boundary Inventory

- `affiliate-form-values.ts` normalizes untyped browser `FormData` strings,
  optional local datetimes, currency casing, and the generated coupon enum
  before constructing generated Relay mutation variables. The route's
  `formDataToScalarValues/1` rejects non-string `FormData` entries at that same
  browser boundary.
- `AffiliateSetupOperations.ts` combines nullable GraphQL mutation facts with
  transport-level GraphQL errors. It does not reconstruct or validate a
  successful generated payload.
- CJ URL pagination normalizes page sizes, cursors, sort, and lifecycle values;
  formatting parses the GraphQL `DateTime` scalar once; lifecycle policy keeps
  the Relay `%future added value` display/editability rule explicit.
- Revenue URL parsing validates date-only strings, currency, and supported
  network query values. Revenue amount formatting preserves nullable Decimal
  strings without reparsing them.
- CJ unmatched-feed and revenue attribution loader catches retain `unknown`
  only at the rejected-promise transport boundary before the shared loader
  error policy handles aborts and unavailable regions.

## Blocker Rule

Stop before editing backend operator contracts, router/head infrastructure,
shopper/account routes, or seeds. Preserve all independent pagination and
failure regions.

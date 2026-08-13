# Operator Workspaces

## Snapshot

- Status: complete
- Priority: P1
- Owner: `codex/operator-workspaces`
- Plan: `docs/superpowers/plans/2026-08-12-operator-workspaces-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Ledger refinement plan:
  `docs/superpowers/plans/2026-08-13-compact-operator-ledgers-implementation-plan.md`
- Ledger refinement design:
  `docs/superpowers/specs/2026-08-13-compact-operator-ledgers-design.md`
- Last verified: 2026-08-13 against affiliate setup, CJ lifecycle/feed, revenue
  summary/ledger, generated Relay operations, deterministic browser acceptance,
  and the complete frontend/backend gates.

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
  reconciliation facts use a generated fragment and remain visible in the
  ledger without a details disclosure. Ledger cells are composed summaries
  rather than parameter dumps: click origin and type use badges, identity and
  commerce lead with their primary facts, diagnostics compact the
  referrer/browser/IP evidence, and conversion amount and state lead before
  exact diagnostic facts.
- The former generic `affiliate-setup-data.ts`, `cj-program-data.ts`,
  `RevenueSummaryView.tsx`, and `revenue-summary-view-data.ts` owners were
  removed or renamed by their actual responsibilities.

## Compact Ledger Hierarchy

- Revenue keeps four scan columns with explicit priority. Visit leads with time
  and customer identity, then source/link badges. Request leads with referrer,
  then browser and IP diagnostics. Commerce leads with merchant and product,
  then network, SKU, and affiliate program. Conversion leads with order value,
  status, commission, and confidence, followed by merchant/product/network and
  the exact purchased/reported timeline plus network reference.
- Every revenue fact remains visible. Multiple conversions use quiet dividers,
  while identifiers retain wrapping and full-value titles where needed; no
  record data is hidden behind a disclosure or clipped to a row-height limit.
- CJ merchant cells are semantic row headers rather than nested page headings.
  Program name is primary, lifecycle state and required action are the next
  scan targets, and provider, advertiser ID, feed count, warnings, and exact
  change time remain supporting facts. Editing stays a full-width task row with
  unchanged mutation, feedback, and lazy feed behavior.
- Column widths follow information density: conversion and CJ action receive
  the most space, while lifecycle and request diagnostics receive less. Shared
  cell padding is modestly tighter without reducing typography. Ordinary
  operator ledgers fit at desktop/tablet widths and use contained scrolling on
  mobile; the two comparison matrices retain their deliberate internal 48rem
  scrolling contract.

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

## Completion Evidence

- Affiliate setup preserves all four generated Relay mutation contracts while
  guiding network, program, merchant-link, and coupon work in dependency order.
  Mutation failures remain local and successful identifiers flow into the next
  required step.
- CJ renders one TanStack lifecycle ledger with exact reconciliation time,
  lifecycle mutation controls, separately recoverable program-feed disclosure,
  and independently recoverable unmatched feeds.
- Revenue renders controls before metrics and attribution, keeps summary and
  ledger preload failures independent in both directions, keeps pagination
  failure local, and keeps exact conversion investigation facts visible in the
  ledger.
- The combined production browser matrix passed 11/11 scenarios. Its desktop,
  tablet, and mobile runs cover both operator ledgers and both comparison
  matrices with reduced motion, zero axe violations, document/table-container
  bounds, contained mobile scrolling, affiliate mutations, CJ lifecycle/feed
  recovery, revenue preload/pagination recovery, and inspected full-page CJ,
  revenue, and editor captures.
- `cd assets && pnpm run check` passed Relay validation, TypeScript, lint,
  formatting, 118 files / 1,528 tests, client and SSR builds, StyleX mangling,
  and the 226,357-byte gzip initial bundle within the 300,000-byte budget. The
  host used Node 25.6.0 and emitted the known warning for the pinned Node 24.18.1.
- `mix work_queue.validate` passed with the committed one-row Ready Floor
  Exception, and the final whitespace/status checks covered only the intended
  refinement evidence before closeout.
- `mix format --check-formatted`, `mix typecheck`, and `mix quality` passed;
  Credo reported no issues, ExDNA stayed at its 3/3 clone budget, and the static
  analysis gate completed. `mix test` passed 1,489 tests with zero failures.
- The closeout replenishment audit retained Realistic Development Data as the
  sole ready outcome under a complete Ready Floor Exception. The residual
  type/validation/slop audit remains prerequisite-gated until seeds complete.

## Blocker Rule

Stop before editing backend operator contracts, router/head infrastructure,
shopper/account routes, or seeds. Preserve all independent pagination and
failure regions.

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
- Dashboard refinement plan:
  `docs/superpowers/plans/2026-08-13-revenue-cj-operator-dashboard-implementation-plan.md`
- Dashboard refinement design:
  `docs/superpowers/specs/2026-08-13-revenue-cj-operator-dashboard-design.md`
- Last verified: 2026-08-13 against affiliate setup, CJ lifecycle/feed, revenue
  summary/ledger, generated Relay operations, deterministic browser acceptance,
  and the complete frontend/backend gates.

## Target Outcome

Affiliate setup is a guided workflow. CJ is a compact operations dashboard with
aggregate lifecycle context, loaded-page attention/feed health, and independent
program/feed ledgers. Revenue is a compact performance dashboard with a dense
attribution ledger and complete below-row evidence disclosure. Both dashboards
retain independent failure recovery and generated type ownership.

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
- CJ program management composes a compact aggregate lifecycle strip with
  loaded-page attention and feed-health modules. The program and unmatched-feed
  regions remain independently recoverable TanStack tables. Program mutation
  state, row-local editor feedback, lazy feed inspection, unmatched-feed preload,
  and lifecycle policy keep separate owners and failure boundaries.
- Revenue reporting places one shallow command band before separate attribution
  performance, revenue outcome, and recent-loaded-conversion modules. Its
  independently preloaded ledger leads with visit, customer, commerce, order,
  commission, and state. Less important evidence expands in a full-width row
  immediately below the selected visit, grouped as Touchpoint, Request evidence,
  Commerce, and Conversion rather than rendered as a parameter dump.
- The former generic `affiliate-setup-data.ts`, `cj-program-data.ts`,
  `RevenueSummaryView.tsx`, and `revenue-summary-view-data.ts` owners were
  removed or renamed by their actual responsibilities.

## Compact Ledger Hierarchy

- Revenue uses seven dense scan columns with explicit priority. The closed row
  keeps visit time, customer identity, merchant/product, order, commission,
  status, and confidence visible. Its accessible Details action inserts a
  sibling table row below the visit containing source, link type, referrer,
  browser, IP, network, SKU, affiliate program, every matched conversion,
  purchased/reported times, and the network conversion reference.
- No revenue or CJ record fact is discarded, truncated to a row-height limit,
  or aggregated client-side. Multiple conversions remain individually legible
  with quiet dividers, and exact identifiers wrap inside their contained region.
- CJ merchant cells are semantic row headers rather than nested page headings.
  Program name is primary, lifecycle state and required action are the next
  scan targets, and provider, advertiser ID, feed count, warnings, and exact
  change time remain supporting facts. Editing stays a full-width task row with
  unchanged mutation, feedback, and lazy feed behavior.
- Column widths follow information density: customer/commerce and CJ action
  receive more space, while state and compact feed qualifiers receive less.
  Ordinary operator ledgers fit at desktop/tablet widths and use focusable,
  contained scrolling on mobile; the two comparison matrices retain their
  deliberate internal 48rem scrolling contract.

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
- CJ renders aggregate lifecycle counts without a progress metaphor, truthful
  loaded-page attention/feed-health summaries, a four-column program work
  queue, exact reconciliation time, lifecycle mutation controls, separately
  recoverable program-feed disclosure, and an eight-column unmatched-feed
  ledger.
- Revenue renders controls before three compact summary modules and attribution,
  keeps summary and ledger preload failures independent in both directions,
  keeps pagination failure local, and retains complete conversion investigation
  facts in the selected visit's below-row disclosure.
- The combined production browser matrix passed 11/11 scenarios. Its desktop,
  tablet, and mobile runs cover both operator dashboards and both comparison
  matrices with reduced motion, zero axe violations, document/table-container
  bounds, focusable contained mobile scrolling, below-row revenue expansion,
  affiliate mutations, CJ lifecycle/feed recovery, revenue preload/pagination
  recovery, and inspected full-page CJ, revenue, and editor captures.
- `cd assets && pnpm run check` passed Relay validation, TypeScript, lint,
  formatting, 118 files / 1,542 tests, client and SSR builds, StyleX mangling,
  and the 226,340-byte gzip initial bundle within the 300,000-byte budget. The
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

# Homepage Query Scaling And Ownership

## Snapshot

- Status: ready
- Owner: unclaimed
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-11-homepage-query-scaling-and-ownership-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-11-homepage-query-scaling-and-ownership-design.md`
- Last validated: 2026-08-11 against current Pricing, Catalog, SEO, Commerce Attribution, GraphQL, migration, and homepage query-budget coverage.

## Target Outcome

Homepage workspace and deal reads preserve every current result and GraphQL
contract while repeated price-history work, unused first-seen/median reads, the
normal For You double ranking, and heap-dependent exact activity reads are
removed. Existing pricing code has three clear owners—exact history in
`PriceHistory`, current availability in renamed `CurrentOffers`, and homepage
ranking in `HomeOffers`—without a new pricing module or persisted summary.

## Owned Paths

- `lib/product_compare/pricing.ex` and the existing Pricing history/current/home modules named by the plan.
- Homepage eligibility consumers in Catalog and SEO plus their focused tests.
- Homepage resolver and consistency/query-budget tests.
- Trending activity, its focused test, and the exact covering-index migration/test.
- `docs/work/homepage-query-scaling-and-ownership.md`.

## Internal Slices

1. Exact arbitrary-bound price relations and centralized current-offer availability.
2. Fact-selective homepage ranking and page-first signed-in viewer selection.
3. Exact arbitrary-range activity reads with a retryable covering index.
4. Focused, complete, quality, migration, queue, and anti-slop verification.

## Preconditions

- The homepage database remediation is complete and verified at commit `8a173bdd`.
- The user approved no new tables, exact statistics, `CurrentOffers`, zero net-new pricing modules, and complete behavior preservation.
- The four production UI rows remain ready and their owned frontend paths do not overlap this backend batch.
- `config/dev.exs` is a user-owned worktree change and is excluded.

## Verification

- Characterization-first RED/GREEN tests for exact temporal bounds, offer truth, every home rail, fallback/exhaustion, projection, and concurrency.
- Isolated-prefix concurrent-index retry/repair/up/down coverage.
- Fixed query-budget and relation-scope assertions without new timing/planner thresholds.
- The complete focused command and repository gates in Task 4 of the plan.

## Blocker Rule

Stop if exact statistics require persisted range-specific state, centralized
availability changes Catalog/SEO policy, page-first viewer selection changes
pagination/fallback behavior, the covering index cannot remain retryable, or a
change requires a frontend/GraphQL schema contract. Record the exact behavior,
SQL, migration, or ownership evidence; do not widen scope or weaken a rule.

## Completion

Complete all internal slices, preserve the four other ready rows, record fresh
verification here, and remove this row from the live queue only at a committed
coordinator boundary that maintains the ready floor.

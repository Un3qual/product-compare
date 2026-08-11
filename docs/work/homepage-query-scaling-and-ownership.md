# Homepage Query Scaling And Ownership

## Snapshot

- Status: completed
- Owner: `codex/production-ui-home-quality-remediation`
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-11-homepage-query-scaling-and-ownership-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-11-homepage-query-scaling-and-ownership-design.md`
- Last validated: 2026-08-11 at `47ed4dea` against current Pricing, Catalog,
  SEO, Commerce Attribution, GraphQL, migration, and homepage query-budget
  coverage.

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

- The exact 12-file focused command passed 119 tests with 0 failures at seed 0
  in 13.4 seconds (7.9s async, 5.5s sync).
- Fresh `mix test` passed 1,482 tests with 0 failures at seed 417339 in 114.6
  seconds (15.3s async, 99.2s sync).
- `mix quality` passed: Credo found no issues across 533 source files and 4,907
  modules/functions; ExDNA remained at its 3/3 clone budget with no new clone;
  cross-function analysis found no issues with 12 baseline findings suppressed;
  and Dialyzer passed successfully.
- `mix typecheck`, full `mix format --check-formatted`, and `git diff --check`
  exited 0. `mix work_queue.validate` reported 4 ready rows.
- Exact query-scope assertions prove workspace, Trending, and For You omit
  first-observation history; New and fallback New opt in; median aggregation is
  absent from selection when unused and is page- or candidate-scoped when
  required; a non-empty first For You page performs one viewer ranking query;
  and the later-page existence read omits Product hydration, median work,
  output ranking, and page facts.
- The activity migration installs
  `(inserted_at, merchant_product_id) INCLUDE (user_id, anonymous_visitor_id)`
  concurrently, verifies its exact definition, repairs invalid or wrong
  same-named indexes, preserves an access path during up/down, and is retryable
  and prefix-aware.
- Final ownership review found no executable `TruthReads` reference, no net-new
  pricing module, no range-specific persisted state, no duplicated eligibility
  policy, no unused first-seen or median relation, no GraphQL schema or Relay
  artifact change, no task-commit ownership leak, and no unexplained wrapper or
  delegation layer.

## Blocker Rule

Stop if exact statistics require persisted range-specific state, centralized
availability changes Catalog/SEO policy, page-first viewer selection changes
pagination/fallback behavior, the covering index cannot remain retryable, or a
change requires a frontend/GraphQL schema contract. Record the exact behavior,
SQL, migration, or ownership evidence; do not widen scope or weaken a rule.

## Completion

All internal slices and lane-owned verification are complete. The four other
ready rows remain preserved. The coordinator must remove this row from the live
queue only at a committed boundary that maintains the ready floor.

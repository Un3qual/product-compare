# Bounded Authorized Management GraphQL Connections

## Snapshot

- Status: complete on `codex/bounded-comparison-root-reads`
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-authorized-management-graphql-connections-implementation-plan.md`
- Last verified: 2026-07-21 against the live schema, management resolvers,
  request-scoped loader, and 74 passing focused GraphQL tests.

## Batch Outcome

Identical owner-scoped and operator-only management Relay connection aliases
reuse one authorized database read per collection, filter, and page within a
GraphQL request without changing privacy, authorization, filtering, ordering,
pagination, errors, nested values, or schema behavior.

## Completion Evidence

- Owner-scoped specification corrections, price watches, alert events, API
  tokens, saved comparison sets, and comparison snapshots moved from RED
  two-/four-identical-alias SELECT counts of `2/4` to GREEN fixed counts of
  `1/1`. The same owner regressions prove identical Relay results and nested
  values, authenticated owner filtering, filters, cursors, page sizes,
  ordering, and `pageInfo` parity as aliases grow.
- Operator-only specification-correction moderation and merchant-feed candidate
  queues likewise moved from RED `2/4` to GREEN `1/1` SELECT counts for
  identical aliases. Their regression coverage preserves moderation-status and
  review-status filters, ranking/order behavior, cursors, page sizes, Relay
  projection, correction `valueText`, and candidate nested values.
- Protected owner and operator roots retain their authorization behavior:
  anonymous or forbidden callers receive the existing structured errors and
  issue zero target-collection SELECTs. Anonymous snapshot discovery retains
  its existing `viewer: null` result with zero snapshot SELECTs.
- Every private loader key includes collection kind, principal ID, role,
  normalized filter, and Relay arguments, so distinct principals, filters, and
  pagination windows do not share reads. Authorization and Relay argument
  validation occur before a private load is scheduled.
- Growing-alias GraphQL regressions exercise the request-loader path for all
  eight management collections. Separate public-resolver characterizations
  omit `:loader` and prove the direct `Connection.from_query_result/3` fallback
  for owner specification corrections, price watches, alert events, API tokens,
  saved comparison sets, comparison snapshots, operator correction moderation,
  and merchant-feed candidates. Those direct tests assert real Relay edges and
  `page_info` plus owner/operator scoping, relevant filters, sorting, active
  state, and successive pages. The public schema and deferred ingestion
  dashboard/operator UI scope remain unchanged.
- `ProductCompareWeb.GraphQL.AuthorizedConnection` owns private key
  construction, role derivation, owner validation, operator authorization-
  before-validation, Dataloader scheduling, and result projection. The six
  affected resolvers retain only their domain filters and direct fallbacks.
- The exact seven-suite focused command passed 74 tests with zero failures:

  ```text
  mix test test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/comparison_snapshots_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
  ```

## Internal Slices

1. Owner-scoped management connection request reuse.
2. Operator-only queue connection request reuse.
3. Growing-alias query budgets plus authorization and semantic parity.

## Boundaries

- Authorize before scheduling any private load.
- Key every load by role, principal ID, collection kind, normalized filters,
  and Relay connection arguments.
- Do not share cache entries across principals or distinct arguments.
- Preserve direct resolver fallbacks and the public GraphQL schema.
- This batch does not reopen deferred ingestion dashboard or operator UI work;
  it only bounds the existing merchant-feed review query.

## Batch Gate

- The seven focused GraphQL suites above: 74 tests, 0 failures.
- Growing-alias query-budget regressions cover all eight management
  collections, owner/operator authorization, zero-query denials, semantic
  parity, filters, pagination, and nested values through request loaders.
- Direct public-resolver no-loader characterizations cover all eight management
  collections, real Relay connection projection, applicable filters and
  sorting, owner/operator scoping, active-state exclusion, and cursor paging.
- `mix typecheck`: passed (exit 0).
- `mix format --check-formatted`: passed (exit 0).
- `mix ex_dna --max-clones 6`: passed at the unchanged `6/6` clone budget.
- `mix work_queue.validate`: passed with `work queue valid: 3 ready rows`.
- `git diff --check`: passed (exit 0).

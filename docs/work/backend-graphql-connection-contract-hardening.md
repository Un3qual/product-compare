# Backend GraphQL Connection Contract Hardening Work Doc

## Snapshot

- Status: done
- Lane: Backend quality
- Live queue row: GraphQL Connection Contract Hardening
- Last verified: 2026-07-08 after focused GraphQL connection tests,
  representative shipped connection-surface tests, and typecheck passed
- Owned paths:
  - `lib/product_compare_web/graphql/connection.ex`
  - focused GraphQL connection tests under `test/product_compare_web/graphql/**`
  - this work doc

## Scope

- Harden shared Relay connection pagination so invalid `first` values return a
  deterministic GraphQL error instead of silently falling back to the default
  page size.
- Preserve default page size behavior, max page-size clamping, `first: 0`, and
  malformed cursor errors.
- Cover the shared helper and representative shipped surfaces:
  - `products`
  - `merchants`
  - `merchantProducts`
  - nested `priceHistory`
  - root and nested `activeCoupons`
  - `myApiTokens`
  - `mySavedComparisonSets`

## Deferred / Not Touched

- eBay Browse fallback remains deferred.
- Ingestion dashboard and operator surfaces remain deferred.
- `merchantFeedCandidates` and other ingestion surfaces were not changed.

## Implementation Notes

- `ProductCompareWeb.GraphQL.Connection` now treats a present negative or
  otherwise malformed `first` value as `:invalid_first`.
- Resolver-facing connection results map `:invalid_first` to the deterministic
  GraphQL error message `invalid first`.
- Nil or absent `first` still uses the default page size.
- Oversized non-negative `first` still clamps to the max page size.
- `first: 0` still returns an empty page without falling back to the default.
- Malformed cursors still return `invalid cursor`.

## TDD Evidence

- Initial red command could not reach tests because this fresh worktree was
  missing Hex dependencies:
  `mix test test/product_compare_web/graphql/connection_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  reported missing dependencies and instructed `mix deps.get`.
- Dependency setup:
  `mix deps.get` completed successfully.
- Red verification:
  the same focused `mix test` command then failed as expected with 80 tests and
  10 failures, all showing that invalid `first` values still returned normal
  connection data instead of `invalid first`.
- Green verification:
  the same focused `mix test` command passed with 80 tests, 0 failures.
- Post-format verification:
  after `mix format` on changed Elixir files, the same focused `mix test`
  command passed again with 80 tests, 0 failures.
- Type verification:
  `mix typecheck` completed with exit 0 and no output.
- Whitespace verification:
  `git diff --check` completed with exit 0 and no output.

## Remaining Work

- None for this batch.

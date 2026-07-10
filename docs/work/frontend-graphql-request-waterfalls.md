# Frontend GraphQL Request Waterfalls

Status: active

## Goal

Reduce the audited shopper and account routes to one GraphQL request for initial route data, and replace eager cursor exhaustion with explicit user-driven pagination.

## Active Design

- `docs/superpowers/specs/2026-07-10-graphql-request-waterfall-elimination-design.md`

## Owned Paths

- `lib/product_compare/catalog.ex`
- `lib/product_compare/pricing.ex`
- `lib/product_compare_web/schema.ex`
- `lib/product_compare_web/resolvers/catalog_resolver.ex`
- `lib/product_compare_web/resolvers/pricing_resolver.ex`
- `test/product_compare_web/graphql/**`
- `assets/schema.graphql`
- `assets/src/routes/compare/**`
- `assets/src/routes/products/**`
- `assets/src/routes/catalog/**`
- `assets/src/routes/account/api-tokens/**`
- `assets/src/__generated__/**`
- `assets/test/routes/compare/**`
- `assets/test/routes/products/**`
- `assets/test/routes/catalog/**`
- `assets/test/routes/account/api-tokens/**`
- `docs/work/frontend-graphql-request-waterfalls.md`

## Verification

- Focused GraphQL contract tests.
- Focused frontend route and loader tests.
- `cd assets && bun run relay`.
- `cd assets && bun run check`.
- `mix test`.
- `mix typecheck`.
- `git diff --check`.

## Exit Condition

Comparison, product detail, and catalog each issue one initial route-data GraphQL request; saved comparisons and API tokens fetch no more than one cursor page per navigation; focused and broad verification pass; and completion evidence is recorded here and in the live index.


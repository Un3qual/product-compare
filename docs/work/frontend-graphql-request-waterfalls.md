# Frontend GraphQL Request Waterfalls

Status: complete

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

- `mix test test/product_compare_web/graphql` passed 43 tests while the
  comparison-products and nested-offers contracts were introduced.
- Focused compare, catalog, product-detail, saved-comparison, and API-token
  suites passed throughout the implementation; the final focused pagination
  run passed 171 tests.
- `cd assets && bun run relay` generated 30 reader, 29 normalization, and 29
  operation-text artifacts.
- `cd assets && bun run build` completed both client and SSR production builds.
- `cd assets && bun run check` passed TypeScript and all 594 frontend tests.
- `mix test` passed all 624 backend tests.
- `mix typecheck` passed.
- `mix format --check-formatted` passed.
- `git diff --check` passed.

## Completion Evidence

- `/compare` now loads selected products, their initial active-offer context,
  and the initial product-picker page through one `CompareRouteQuery` request.
  Store-only product descriptors preserve the existing card boundaries without
  issuing additional requests.
- `/products/:slug` now loads product details and the requested active-offer
  page through one route query.
- `/products` now loads products and filter metadata through one route query;
  the separate filter-metadata operation was removed.
- `/compare/saved` and `/account/api-tokens` now fetch one cursor page per
  navigation and expose first/next-page links instead of exhausting every page
  in sequential loader loops.
- A final request-site audit found no route loader with more than one GraphQL
  preload and no remaining eager GraphQL pagination loop. Subsequent requests
  are user-triggered pagination or mutations.

## Exit Condition

Comparison, product detail, and catalog each issue one initial route-data GraphQL request; saved comparisons and API tokens fetch no more than one cursor page per navigation; focused and broad verification pass; and completion evidence is recorded here and in the live index.

# GraphQL Request Loader Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- Last verified: 2026-07-21 against the live loader facade, resolver call sites,
  and Dataloader batching suite.

## Target Outcome

The request-scoped GraphQL loader will remain one stable resolver-facing facade,
while association, parent-collection, and root-request source construction and
batch callbacks will live in focused modules with unchanged source keys,
values, errors, timestamps, authorization boundaries, and query budgets.

## Ready Evidence

- `ProductCompareWeb.GraphQL.Loader` currently owns two Ecto sources plus
  thirteen KV source domains: merchant detail, product evidence,
  community connections, viewer submissions, offer connections, categories,
  comparisons, public slugs, public opaque keys, authorized nodes, authorized
  management connections, discovery roots, and operator reporting. It also owns
  their public source-key accessors, query callbacks, batch callbacks, and
  projection helpers.
- The completed operator-reporting batch added the thirteenth KV domain for
  active coupons and revenue summaries, increasing the facade's unrelated
  reasons to change.
- Resolvers already depend only on `Loader.new/1` and stable source-key
  accessors, so implementation can preserve the public facade while moving
  source internals behind responsibility-focused modules.
- The Dataloader batching suite already characterizes every current source's
  semantic values and fixed query budgets. Focused resolver suites cover
  authorization, filtering, pagination, and errors.

## Internal Slices

1. Association and parent-collection source extraction.
2. Root-request source extraction with stable facade keys.
3. Full semantic, authorization, timestamp, and query-budget parity.

## Boundaries

- Preserve `Loader.new/1` and every resolver-facing source-key accessor.
- Preserve source keys so request caching cannot fragment or cross scopes.
- `RootSources` owns the discovery-root constructor and batch callback while
  `Loader` keeps and pairs the stable discovery-root key constant.
- Preserve `async?: false`, Ecto params, batch time-sampling boundaries,
  authorization-before-load behavior, and direct resolver fallbacks.
- Do not combine domain queries, change SQL, alter GraphQL schema behavior, or
  add generic callback indirection that obscures source ownership.
- Include the operator-reporting source in `RootSources`; execute serially with
  all other Loader ownership.
- Preserve coupon and revenue direct fallbacks, normalized keys, time-sampling,
  tagged errors, and fixed alias budgets.

## Verification

The exact focused suite list below includes Dataloader batching plus the
catalog-query and pricing-query suites that characterize discovery-root values,
validation, and fixed query budgets.

- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/seo_surfaces_test.exs test/product_compare_web/graphql/recommendations_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/comparison_snapshots_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

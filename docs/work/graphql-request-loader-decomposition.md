# GraphQL Request Loader Decomposition

## Snapshot

- Status: complete with CI concern
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the completed loader facade and all three
  extracted source modules.

## Batch Outcome

The request-scoped GraphQL loader remains one stable resolver-facing facade.
Association, parent-collection, and root-request source construction and batch
callbacks now live in focused modules while source keys, values, errors,
timestamps, authorization boundaries, and query budgets remain unchanged.

## Completion Evidence

- `ProductCompareWeb.GraphQL.Loader` remains the resolver-facing facade and
  source-key owner. `Loader.new/1` wires the existing two Ecto source keys and
  thirteen KV source keys without changing the public accessors.
- `ProductCompareWeb.GraphQL.Loader.AssociationSources` owns the `Catalog` and
  `Pricing` Ecto sources, including the existing query functions and the
  `PricePoint` latest-price batch callback.
- `ProductCompareWeb.GraphQL.Loader.ParentSources` owns six parent KV sources:
  merchant detail, product evidence, community connections, viewer
  submissions, offer connections, and categories.
- `ProductCompareWeb.GraphQL.Loader.RootSources` owns seven request-reuse KV
  sources: comparison, public slugs, public opaque keys, authorized nodes,
  authorized connections, operator reporting, and discovery roots.
- The 17 focused suites below passed with 222 tests and 0 failures. They cover
  Dataloader batching plus the catalog and pricing query paths, authorization,
  filtering, pagination, errors, source artifacts, snapshots, watches, API
  tokens, saved comparisons, and merchant-feed candidates. This preserves the
  characterized semantic values and fixed query budgets, including the
  `async?: false` source behavior, time-sampling boundaries, authorization
  before loads, and direct resolver fallbacks.

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

The following checks were run on 2026-07-22:

- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/seo_surfaces_test.exs test/product_compare_web/graphql/recommendations_test.exs test/product_compare_web/graphql/source_artifact_query_test.exs test/product_compare_web/graphql/comparison_snapshots_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs` — exit 0; 222 tests, 0 failures.
- `mix typecheck` — exit 0.
- `mix format --check-formatted` — exit 0.
- `mix work_queue.validate` — exit 0 with local Mix PubSub socket access; 3 ready rows.
- `mix ci` — exit 1 at ExDNA. Credo checked 294 source files and 3,471
  mods/funs with no issues; ExDNA found 8 clones against the configured budget
  of 6 (including reports in `ParentSources` and `RootSources`). The command
  stopped at this gate, so it did not establish later full-CI suite counts.
- `git diff --check` — exit 0 before the lane-record edit.

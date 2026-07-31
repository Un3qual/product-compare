# GraphQL Request Loader Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- Last verified: 2026-07-31 against the simplified loader facade, all three
  source modules, runtime source types, and growing-parent/node query budgets.

## Batch Outcome

The request-scoped GraphQL loader remains one stable resolver-facing facade.
Ordinary associations, genuine parent collections, and authorized nodes use
real `Dataloader.Ecto` sources over domain schemas. Singleton root requests now
call context query APIs directly instead of entering a synthetic batch layer.

## Completion Evidence

- `ProductCompareWeb.GraphQL.Loader` remains the resolver-facing source-key
  owner. `Loader.new/1` registers exactly nine sources, all runtime
  `%Dataloader.Ecto{}` values.
- `ProductCompareWeb.GraphQL.Loader.AssociationSources` owns the `Catalog` and
  `Pricing` association sources, including the existing query functions and
  the `PricePoint` latest-price batch callback.
- `ProductCompareWeb.GraphQL.Loader.ParentSources` owns six genuine parent-set
  sources:
  merchant detail, product evidence, community connections, viewer
  submissions, offer connections, and categories.
- `ProductCompareWeb.GraphQL.Loader.RootSources` now owns only the genuine
  authorized-node Ecto source. Its query callback uses each real schema and the
  CJ-program context query needed for enriched node projection.
- Product, comparison, discovery, operator-reporting, public-key, and
  authorized-connection roots resolve directly. Their former singleton source
  keys, generic loader delegates, fallback execution, marker schema, and term
  serialization are removed.
- Growing parent sets and authorized nodes retain fixed query budgets. Direct
  root aliases intentionally execute independently and keep semantic,
  authorization, filter, pagination, and error coverage.

## Boundaries

- Preserve the nine current Ecto sources and their actual schema/input shapes.
- Preserve request cache scopes, parent batch time-sampling boundaries,
  authorization before loads, and direct-root semantics.
- Do not restore singleton root batching, opaque serialized inputs, generic
  loader delegates, or callback indirection that obscures source ownership.
- Use inline Dataloader declarations for ordinary associations and explicit
  operation keys only for genuine parent/node batches.

## Verification

- Schema architecture, connection, affiliate workflow, and Dataloader batching
  focus: 34 tests, 0 failures.
- Genuine Dataloader batching suite: 41 tests, 0 failures.
- Complete GraphQL suite after the authorized CJ-program projection review:
  328 tests, 0 failures.
- Relay generation compiled 52 reader, 51 normalization, and 51 operation
  documents; compile with warnings as errors, typecheck, formatting, and diff
  checks passed.

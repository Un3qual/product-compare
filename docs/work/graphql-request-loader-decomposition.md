# GraphQL Request Loader Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-graphql-request-loader-decomposition-implementation-plan.md`
- Last verified: 2026-07-21 against the live loader facade, resolver call sites,
  and Dataloader batching suite.

## Batch Outcome

The request-scoped GraphQL loader remains one stable resolver-facing facade,
while association, parent-collection, and root-request source construction and
batch callbacks live in focused modules with unchanged source keys, values,
errors, timestamps, authorization boundaries, and query budgets.

## Ready Evidence

- `ProductCompareWeb.GraphQL.Loader` is 416 lines and currently owns two Ecto
  sources plus ten KV source domains, their public source-key accessors, query
  callbacks, batch callbacks, and connection projection helpers.
- The three higher-ranked ready batches add more authorization-aware root
  sources to this same module, increasing unrelated reasons for it to change.
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
- Preserve `async?: false`, Ecto params, batch time-sampling boundaries,
  authorization-before-load behavior, and direct resolver fallbacks.
- Do not combine domain queries, change SQL, alter GraphQL schema behavior, or
  add generic callback indirection that obscures source ownership.
- Inventory and include any compatible sources added before this row is
  claimed; execute serially with all other Loader ownership.

## Verification

- Dataloader batching plus every focused resolver suite for sources moved by
  this batch.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

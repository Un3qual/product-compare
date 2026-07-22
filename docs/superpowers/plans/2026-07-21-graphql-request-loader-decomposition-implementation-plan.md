# GraphQL Request Loader Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the resolver-facing GraphQL loader facade stable while moving
its unrelated source construction and batch callbacks into focused modules.

**Architecture:** `ProductCompareWeb.GraphQL.Loader` remains the only assembly
facade used by the schema and resolvers. Focused association, parent-collection,
and root-request modules own Dataloader source construction and callbacks;
source keys stay in the facade so their request-cache identity cannot drift.

**Tech Stack:** Elixir, Ecto, Absinthe, Dataloader, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `Loader.new/1` and every resolver-facing source-key accessor.
- Preserve every source key, `async?: false` setting, Ecto parameter, returned
  value, error, ordering rule, pagination rule, and query budget.
- Preserve existing request-scoped timestamp boundaries and perform private
  authorization before a resolver schedules any load.
- Preserve direct resolver fallbacks and the public GraphQL schema.
- Move source ownership without changing domain SQL or combining unrelated
  queries behind generic callback dispatch.
- Inventory sources present at claim time and include compatible additions in
  the same responsibility boundary.

---

### Task 1: Association And Parent Source Modules

**Files:**

- Create: `lib/product_compare_web/graphql/loader/association_sources.ex`
- Create: `lib/product_compare_web/graphql/loader/parent_sources.ex`
- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs` only
  when a behavior regression needs an additional oracle.

**Interfaces:** `AssociationSources.catalog/1` and
`AssociationSources.pricing/1` return the existing Ecto sources.
`ParentSources.merchant_detail/0`, `product_evidence/0`,
`community_connections/0`, `viewer_submissions/0`, `offer_connections/0`, and
`categories/0` each return one KV source. `Loader.new/1` pairs those constructors
with its existing facade-owned key constants.

- [ ] Run the Dataloader batching suite as a green characterization baseline.
- [ ] Extract catalog/pricing Ecto query and run-batch callbacks without
  changing their query construction or params.
- [ ] Extract merchant-detail, product-evidence, community, viewer-submission,
  offer-connection, and category parent callbacks without changing time
  sampling, connection projection, or batch keys.
- [ ] Keep source keys and `Loader.new/1` assembly in the facade.
- [ ] Re-run the Dataloader batching suite and focused nested-field suites.
- [ ] Commit with message `refactor: isolate graphql parent loader sources`.

### Task 2: Root Request Source Module

**Files:**

- Create: `lib/product_compare_web/graphql/loader/root_sources.ex`
- Modify: `lib/product_compare_web/graphql/loader.ex`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs` only
  when a behavior regression needs an additional oracle.

**Interfaces:** `RootSources.comparison/0`, `public_slugs/0`,
`public_opaque_keys/0`, `authorized_nodes/0`, and
`authorized_connections/0` each return one top-level request-reuse KV source.
`Loader.new/1` pairs them with its existing facade-owned key constants. Before
claim, the coordinator adds an explicit constructor and focused suites here for
any compatible discovery or reporting source introduced by a higher-ranked row.

- [ ] Extract root-request callbacks without changing normalization,
  authorization scope, missing-value projection, validation, or errors.
- [ ] Preserve one request-local time sample wherever the current callback owns
  that boundary.
- [ ] Keep all resolver-facing source accessors in `Loader` and verify existing
  resolver call sites require no API changes.
- [ ] Re-run the exact sixteen-suite command from the lane verification section.
- [ ] Commit with message `refactor: isolate graphql root loader sources`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/graphql-request-loader-decomposition.md`

- [ ] Record the final module responsibilities, source inventory, and exact
  semantic/query-budget verification.
- [ ] Run every focused suite selected in Tasks 1 and 2.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.

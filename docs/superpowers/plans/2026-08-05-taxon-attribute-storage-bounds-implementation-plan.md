# Taxon Attribute Storage Bounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the established non-negative TaxonAttribute ordering and reputation-threshold domains when writes bypass application changesets.

**Architecture:** One forward migration adds two named checks to `taxon_attributes` after an explicit invalid-row preflight. The owning schema maps those names, and one focused direct-write suite proves database rejection plus valid-boundary acceptance while existing read and GraphQL suites protect behavior.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Keep taxonomy, specification, GraphQL, frontend, ordering, and reputation authorization behavior unchanged.
- Preserve the existing zero defaults, non-null columns, integer types, and zero-or-positive valid domain.
- Stop instead of rewriting data if either stored value is negative.
- Do not add upper bounds, new product policy, a generic constraint helper, or a storage-policy framework.
- Keep this outcome path-disjoint from credential-artifact and ingestion-run storage work.

---

### Task 1: Enforce Taxon Attribute Integer Domains In PostgreSQL

**Files:**
- Create: `priv/repo/migrations/20260805000000_enforce_taxon_attribute_storage_bounds.exs`
- Create: `test/product_compare/repo/taxon_attribute_storage_bounds_test.exs`
- Modify: `lib/product_compare_schemas/specs/taxon_attribute.ex`
- Verify: `test/product_compare/specs/product_attribute_claim_changeset_test.exs`
- Verify: `test/product_compare/specs/read_helpers_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `docs/work/taxon-attribute-storage-bounds.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`

**Interfaces:**
- Consumes: existing `TaxonAttribute.changeset/2` non-negative validations and the `taxon_attributes` columns.
- Produces: named database checks `taxon_attributes_sort_order_non_negative` and `taxon_attributes_min_rep_to_edit_non_negative`, with matching schema mappings.

- [ ] **Step 1: Add failing direct-write boundary tests**

Create taxon and attribute owners, insert a valid `taxon_attributes` row, and
prove direct SQL currently accepts negative `sort_order` and
`min_rep_to_edit`. Express the desired contract as constraint-name assertions
for each negative write, plus acceptance for zero and representative positive
values.

Run:

```bash
mix test test/product_compare/repo/taxon_attribute_storage_bounds_test.exs
```

Expected before implementation: both negative direct writes succeed instead of
returning the named PostgreSQL constraint errors.

- [ ] **Step 2: Add the forward constraints and schema mappings**

Add one reversible migration that raises when any current row has a negative
value, then creates both named checks. Map the same names through
`check_constraint/3` in `TaxonAttribute.changeset/2` without changing its
existing validations.

Run:

```bash
mix test test/product_compare/repo/taxon_attribute_storage_bounds_test.exs
mix test test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/read_helpers_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: the focused constraint suite passes and the existing 53-test
changeset/read/GraphQL baseline remains green.

- [ ] **Step 3: Verify and close the batch**

Run:

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test
mix work_queue.validate
git diff --check
```

Record observed direct-write, boundary, read-order, GraphQL, and complete-gate
evidence in the lane doc. Remove the completed queue row only when at least
three other ready rows remain, append completion to work-index history, and
move the candidate catalog row to completed.

- [ ] **Step 4: Commit**

```bash
git add priv/repo/migrations/20260805000000_enforce_taxon_attribute_storage_bounds.exs lib/product_compare_schemas/specs/taxon_attribute.ex test/product_compare/repo/taxon_attribute_storage_bounds_test.exs docs/work/taxon-attribute-storage-bounds.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md docs/superpowers/plans/2026-08-05-taxon-attribute-storage-bounds-implementation-plan.md
git commit -m "test: enforce taxon attribute storage bounds"
```

# Taxonomy Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Taxonomy` as the stable public context while
moving taxonomy registry, hierarchy, use-case assignment, and category-alias
implementations into focused internal modules.

**Architecture:** The context remains the only caller-facing facade and
preserves every public function and result. `Taxonomies`, `Hierarchy`,
`Assignments`, and `Aliases` receive the existing implementations by
responsibility without changing taxonomy, catalog, ingestion, or GraphQL
policy.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Decimal, ExUnit.

## Global Constraints

- Preserve every existing `ProductCompare.Taxonomy` public function, clause,
  guard, default, typespec, value, query, transaction, and error.
- Preserve taxonomy and taxon validation, closure maintenance, ordering,
  conflicts, assignment policy, normalization, and alias resolution.
- Keep application callers dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, catalog filtering, ingestion
  enrichment, SEO, frontend contracts, or taxonomy policy.

---

### Task 1: Taxonomy Registry Ownership

**Files:**

- Create: `lib/product_compare/taxonomy/taxonomies.ex`
- Modify: `lib/product_compare/taxonomy.ex`
- Test: `test/product_compare/taxonomy/use_case_and_guardrail_test.exs`

**Interfaces:** `ProductCompare.Taxonomy.Taxonomies` owns default seeding,
taxonomy upserts, taxonomy membership checks, taxonomy-scoped taxon reads, and
SEO-slug lookup. The facade retains the existing public functions and
signatures.

- [ ] Run the two named characterization paths as the green baseline.
- [ ] Move registry and read implementations plus their private input helpers
  into `Taxonomies`.
- [ ] Replace facade implementations with explicit wrappers preserving guards,
  typespecs, changesets, conflict behavior, return values, and errors.
- [ ] Re-run both characterization paths and confirm registry, membership, and
  read behavior remains unchanged.
- [ ] Commit with message `refactor: isolate taxonomy registry ownership`.

### Task 2: Hierarchy Ownership

**Files:**

- Create: `lib/product_compare/taxonomy/hierarchy.ex`
- Modify: `lib/product_compare/taxonomy.ex`
- Modify: `.dialyzer_ignore.exs`
- Test: `test/product_compare/taxonomy/taxon_closure_test.exs`

**Interfaces:** `ProductCompare.Taxonomy.Hierarchy` owns taxon creation,
updates, moves, closure maintenance, ancestor and descendant reads, and parent
and cycle validation. The facade retains the existing hierarchy entry points.

- [ ] Run the two named characterization paths before the extraction.
- [ ] Move hierarchy implementations and private helpers into `Hierarchy`
  without changing either `Ecto.Multi`, query, lock-free transaction boundary,
  closure row, ordering, or rollback reason.
- [ ] Add explicit facade wrappers preserving typespecs, arguments, results,
  and errors.
- [ ] Relocate the two existing path-scoped `Ecto.Multi` opaque-term Dialyzer
  baselines from the facade path to the hierarchy owner without changing their
  warning text or adding new suppressions.
- [ ] Re-run both characterization paths and confirm creation, closure depths,
  subtree moves, ordering, and cycle rejection remain unchanged.
- [ ] Commit with message `refactor: isolate taxonomy hierarchy ownership`.

### Task 3: Use-Case Assignment Ownership

**Files:**

- Create: `lib/product_compare/taxonomy/assignments.ex`
- Modify: `lib/product_compare/taxonomy.ex`
- Read: `lib/product_compare/taxonomy/taxonomies.ex`
- Test: `test/product_compare/taxonomy/use_case_and_guardrail_test.exs`

**Interfaces:** `ProductCompare.Taxonomy.Assignments` owns use-case assignment
and removal and consumes `Taxonomies.ensure_taxon_in_taxonomy/2`. The facade
retains `assign_use_case/5` and `unassign_use_case/2`.

- [ ] Run the two named characterization paths before the extraction.
- [ ] Move assignment implementations into `Assignments` without changing the
  default confidence argument, membership guard, changeset, conflict target,
  replacement fields, result values, or removal counts.
- [ ] Add explicit facade wrappers preserving typespecs, default, and errors.
- [ ] Re-run both characterization paths and confirm assignment upserts,
  rejection, and idempotent removal remain unchanged.
- [ ] Commit with message `refactor: isolate taxonomy assignment ownership`.

### Task 4: Category Alias Ownership

**Files:**

- Create: `lib/product_compare/taxonomy/aliases.ex`
- Modify: `lib/product_compare/taxonomy.ex`
- Test: `test/product_compare/ingestion/enrichment_test.exs`

**Interfaces:** `ProductCompare.Taxonomy.Aliases` owns category-path
normalization, alias reads and upserts, and type-alias resolution. The facade
retains the existing alias and normalization functions.

- [ ] Run the two named characterization paths before the extraction.
- [ ] Move normalization and alias implementations into `Aliases` without
  changing binary and list handling, trimming, lowercasing, invalid-path
  results, conflicts, queries, ordering, or type-taxonomy restriction.
- [ ] Add explicit facade wrappers preserving clauses, typespecs, results, and
  errors.
- [ ] Re-run both characterization paths and confirm exact ingestion alias
  mapping and replay behavior remains unchanged.
- [ ] Commit with message `refactor: isolate taxonomy alias ownership`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/taxonomy-context-decomposition.md`

- [ ] Run the exact 13-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references `Taxonomy.Taxonomies`,
  `Taxonomy.Hierarchy`, `Taxonomy.Assignments`, or `Taxonomy.Aliases`
  directly.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.

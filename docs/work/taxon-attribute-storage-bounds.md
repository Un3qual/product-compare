# Taxon Attribute Storage Bounds

## Snapshot

- Status: done
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-taxon-attribute-storage-bounds-implementation-plan.md`
- Last verified: 2026-08-05 against the owning schema, original migration,
  live PostgreSQL catalog, stored rows, and focused read/GraphQL suites.

## Batch Outcome

PostgreSQL rejects negative taxonomy display ordering and reputation thresholds
even when a write bypasses `TaxonAttribute.changeset/2`, while zero and positive
values retain current behavior.

## Ready Evidence

- `TaxonAttribute.changeset/2` validates `sort_order >= 0` and
  `min_rep_to_edit >= 0`.
- The original `taxon_attributes` migration makes both columns non-null with
  zero defaults but defines no matching checks.
- The live PostgreSQL test catalog contains no check constraints on
  `taxon_attributes`, and preflight found zero negative rows for both fields.
- `sort_order` is the primary current-attribute ordering key and is projected
  through catalog GraphQL; `min_rep_to_edit` is stored taxonomy edit policy.
- The serial changeset/read/GraphQL baseline passed 53 tests with 0 failures.

## Boundaries

- Preserve defaults, nullability, integer types, ordering, GraphQL projection,
  and reputation authorization behavior.
- Add only the established non-negative lower bounds; do not invent maxima.
- Stop instead of rewriting invalid existing data.
- Use named table constraints and owning changeset mappings, not a generic
  storage-policy framework.

## Internal Slices

1. Failing direct-SQL negative-value characterization and valid boundaries.
2. Named forward constraints plus owning changeset mappings.
3. Current-attribute ordering and GraphQL parity plus complete backend gates.

## Verification

- focused direct-write storage-bound suite
- TaxonAttribute changeset, current-attribute read, and catalog GraphQL suites
- full backend test, type, quality, and formatting gates
- `mix work_queue.validate`
- `git diff --check`

## Task 1 Execution Evidence

- Preflight returned no invalid stored rows:

  ```sql
  SELECT id, sort_order, min_rep_to_edit
  FROM taxon_attributes
  WHERE sort_order < 0 OR min_rep_to_edit < 0
  ORDER BY id
  ```

  The test-database result was `[]`; no stored taxonomy policy was rewritten.
- RED: before the migration, `mix test
  test/product_compare/repo/taxon_attribute_storage_bounds_test.exs` ran three
  tests with two expected failures. Direct SQL updates to `sort_order = -1`
  and `min_rep_to_edit = -1` both returned `{:ok, %Postgrex.Result{}}` instead
  of the named PostgreSQL check violations.
- GREEN: the focused direct-write suite now passes 3 tests. PostgreSQL rejects
  those negative writes with
  `taxon_attributes_sort_order_non_negative` and
  `taxon_attributes_min_rep_to_edit_non_negative`; direct inserts with `(0, 0)`
  and `(17, 250)` remain valid.
- Read-order and GraphQL regression gate:
  `mix test test/product_compare/specs/product_attribute_claim_changeset_test.exs
  test/product_compare/specs/read_helpers_test.exs
  test/product_compare_web/graphql/catalog_queries_test.exs` passed 53 tests
  with 0 failures.
- Complete gates passed: `mix format --check-formatted`, `mix typecheck`,
  `mix quality`, `mix test`, `mix work_queue.validate` (6 ready rows), and
  `git diff --check`.

Implementation and coordinator queue/history closeout are complete.

## Blocker Rule

Stop if preflight finds a negative stored value. Record the affected row IDs
and request a data decision rather than silently coercing taxonomy policy.

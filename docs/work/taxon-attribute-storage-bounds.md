# Taxon Attribute Storage Bounds

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-taxon-attribute-storage-bounds-implementation-plan.md`
- Last verified: 2026-08-05 against the owning schema, original migration,
  live PostgreSQL catalog, stored rows, and focused read/GraphQL suites.

## Target Outcome

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

## Blocker Rule

Stop if preflight finds a negative stored value. Record the affected row IDs
and request a data decision rather than silently coercing taxonomy policy.

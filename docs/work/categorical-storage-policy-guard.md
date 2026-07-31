# Categorical Storage Policy Guard

## Snapshot

- Status: active
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-categorical-storage-policy-guard-implementation-plan.md`
- Last verified: 2026-07-30 against 73 compiled schema modules, 33
  `Ecto.Enum` declarations, and the current explicit enum/reference storage
  tests.

## Target Outcome

The repository automatically rejects a persisted `Ecto.Enum` backed by a
free-form string column and rejects text-backed database constraints that
encode a closed domain.

## Validated Baseline

- `domain_enum_storage_test.exs` verifies the approved columns through a
  hand-maintained 32-column list.
- The commerce and ingestion reference tests explicitly verify metadata-bearing
  domains and removed duplicate string columns.
- Schema reflection can discover future persisted `Ecto.Enum` fields, so the
  native-enum half of the policy does not need a second registry.
- PostgreSQL catalogs can identify text/varchar columns participating in
  closed-domain check constraints.
- No automatic scanner can determine whether every arbitrary free-form string
  is conceptually categorical; new string semantics still require review.

## Boundaries

- PostgreSQL enum is the minimum, not the preferred answer for domains that
  need metadata or independent identity.
- Preserve raw provider evidence verbatim.
- Do not create a generic schema-policy framework beyond this approved storage
  invariant.

## Next Action

Replace the manual enum-column list with reflected schema coverage and add a
red test for a text-backed closed-domain constraint before implementing the
catalog validator.

## Verification

- focused enum and controlled-reference storage tests
- clean database migration
- full backend tests, typecheck, and quality
- `mix work_queue.validate`
- `git diff --check`

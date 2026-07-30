# Database Domain Types Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: `docs/superpowers/plans/2026-07-30-database-domain-types-implementation-plan.md`
- Last verified: 2026-07-30 against the current migrations, Ecto schemas, and persistence callers.

## Target Outcome

Every first-party categorical database value is stored as a native PostgreSQL
enum, a foreign key to controlled reference data, or is removed because it is
redundant. Application-owned comparison and alert facts are normalized out of
JSON, while provider-owned raw evidence remains verbatim and is never used as
normalized domain state.

## Active Batch

- Native PostgreSQL enum storage for the 28 approved closed-domain columns.
- Physical storage is verified through `information_schema`, not inferred from
  `Ecto.Enum`.
- Existing lifecycle, transaction, GraphQL, and query behavior remains covered
  by the focused context suites.

## Ready Successors

- Commerce reference domains: currencies, affiliate program statuses, and
  affiliate networks.
- Source and provider reference domains: source kinds, providers, surfaces,
  feed types, countries, languages, and candidate currencies.
- Redundant and unsafe discriminator removal: reputation reference strings,
  unused formula/failure fields, single-value kinds, duplicate receipt kinds,
  and transient feed-review strings.

## Dependent Successor

- Application-owned comparison snapshot and alert fact JSON normalization
  follows the native enum and reference-domain milestones.

## Verification

- Baseline repair commit: `506fff4f test: stabilize catalog filter index contract`
- `mix test test/product_compare/catalog/filtering_regression_test.exs`:
  8 tests, 0 failures.
- `MIX_ENV=test mix ecto.reset`: all migrations applied through
  `20260727121000`.
- `mix test test/product_compare/repo/domain_enum_storage_test.exs`: 1 test,
  0 failures.
- Focused enum-owning context suites: 438 tests, 0 failures.
- `mix test`: 978 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`, `mix work_queue.validate`,
  and `git diff --check`: passed.

## Blocker Rule

Stop and record a blocker if a provider-owned raw field is required for
application filtering, if a proposed reference code cannot be mapped without
inventing data, or if a migration would require compatibility dual writes.

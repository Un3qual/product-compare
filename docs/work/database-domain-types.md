# Database Domain Types Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: `docs/superpowers/plans/2026-07-30-database-domain-types-implementation-plan.md`
- Last verified: 2026-07-30 after the discriminator-removal milestone gates.

## Target Outcome

Every first-party categorical database value is stored as a native PostgreSQL
enum, a foreign key to controlled reference data, or is removed because it is
redundant. Application-owned comparison and alert facts are normalized out of
JSON, while provider-owned raw evidence remains verbatim and is never used as
normalized domain state.

## Completed Batches

- Native PostgreSQL enum storage for the 28 approved closed-domain columns.
- Physical storage is verified through `information_schema`, not inferred from
  `Ecto.Enum`.
- Existing lifecycle, transaction, GraphQL, and query behavior remains covered
  by the focused context suites.
- Currency codes, affiliate-program statuses, and affiliate-network identities
  are controlled reference rows.
- Seven operational currency owners, affiliate programs, and conversions store
  numeric foreign keys while Ecto and GraphQL continue to expose stable codes.
- Commerce links derive network identity through their required affiliate
  program instead of storing a second value that can drift.
- Existing affiliate-network upserts avoid a no-op `updated_at` write, removing
  the row lock that reproduced a cross-fixture deadlock at seed `284640`.
- Source kinds, integration providers, provider-scoped surfaces and feed types,
  countries, and languages are controlled reference rows with stable codes.
- Sources own provider identity; ingestion runs and feed candidates no longer
  duplicate provider strings, and all provider-sensitive reads join through
  the locked source row.
- Candidate country, currency, language, and feed type values are numeric
  foreign keys. Unknown provider-owned values remain only in raw evidence and
  never become invented controlled rows.
- CJ source resolution and provider claiming use conflict-safe insert/fetch and
  `FOR UPDATE` locking rather than read-modify-write updates.
- Reputation events reference controlled event-type rows and no longer carry a
  free-form reason or polymorphic table-name/id pair. No subject column was
  invented because the repository has no concrete reputation event producer.
- Derived formulas, alert delivery attempts, and question threads no longer
  store unused or single-value categorical columns.
- Community idempotency receipts use their native PostgreSQL `content_type`
  enum in the unique identity instead of duplicating it in a string
  `mutation_kind`.
- Unreleased feed-review migrations were removed, and CJ lifecycle storage is
  created directly in its final native-enum and foreign-key shape.

## Active Batch

- Application-owned comparison snapshot and alert fact JSON normalization.

## Dependent Successors

- The remaining approved GraphQL, frontend, naming, Effect, toolchain, and RMW
  batches follow the database-domain program.

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
- `mix test test/product_compare/repo/domain_reference_storage_test.exs`:
  3 tests, 0 failures.
- Focused commerce-reference context and GraphQL suites: 277 tests, 0 failures.
- `mix test --seed 284640`: 982 tests, 0 failures.
- `mix typecheck`: passed.
- `MIX_ENV=test mix ecto.reset`: all rewritten source/provider migrations
  applied through `20260727121000`.
- `mix test test/product_compare/repo/ingestion_reference_storage_test.exs
  test/product_compare/ingestion`: 162 tests, 0 failures.
- Focused CJ ingestion Mix-task suites: 68 tests, 0 failures.
- `mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs`:
  7 tests, 0 failures.
- `mix test`: 984 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`: passed.
- `MIX_ENV=test mix ecto.reset`: rewritten migration history applied through
  `20260727121000` without creating the transient feed-review columns.
- Discriminator storage, direct CJ migration, discussions, thread CRUD, and
  alert suites: 42 tests, 0 failures.
- Affected community, alert, and dataloader GraphQL suites: 59 tests,
  0 failures.
- `mix test`: 981 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (3 ready rows), and `git diff --check`: passed.

## Blocker Rule

Stop and record a blocker if a provider-owned raw field is required for
application filtering, if a proposed reference code cannot be mapped without
inventing data, or if a migration would require compatibility dual writes.

# Task 1: Conversion sync storage and context owners

## What changed

- Added `20260827120000_add_cj_conversion_sync_storage.exs` with:
  - nullable `commerce_conversions.network_action_ref` and its partial lookup index;
  - one-per-network conversion sync settings storage, bootstrap defaults, foreign keys, and the four named settings checks;
  - conversion sync run storage, entropy UUID, native PostgreSQL enum types, foreign keys, newest-run index, and the six named run checks.
- Added `ConversionSyncSetting` and `ConversionSyncRun` schemas with application-side required, range, enum, window, count, terminal-state, disabled-next-run, and error-summary validation plus named constraint mappings.
- Added `ConversionSyncSettings` context ownership for idempotent CJ bootstrap, transaction-only row locking, and locked cadence/operator updates.
- Added `ConversionSyncRuns` context ownership for injectable-clock start/completion, locked idempotent terminal completion, and newest-first querying.
- Added facade delegates in `ProductCompare.CommerceAttribution` for the new context APIs.
- Extended `CommerceConversion.changeset/2` to cast nullable `network_action_ref`.
- Added focused changeset/lifecycle tests and direct PostgreSQL constraint tests.

## TDD evidence

### RED

Ran before the production migration and schemas existed:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
```

The command exited with status 1 during compilation because `ConversionSyncSetting.__struct__/1` was undefined. This was the expected missing-production-slice failure.

### GREEN

After implementing the migration, schemas, contexts, facade delegates, and conversion field:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
Running ExUnit with seed: 292181, max_cases: 20
...........
Finished in 0.2 seconds (0.2s async, 0.00s sync)
11 tests, 0 failures
```

## Verification

- `mix ecto.migrate` applied the storage migration during implementation.
- The repository’s categorical-storage policy identified the first implementation’s varchar-backed enum columns during the initial full suite. The migration was corrected to native PostgreSQL enum types, and `MIX_ENV=test mix ecto.reset` rebuilt the test database with the final schema.
- Final focused tests: 11 tests, 0 failures.
- `mix format --check-formatted`: passed with no output.
- `git diff --cached --check`: passed with no output.
- Final full backend suite:

```text
mix test
Finished in 880.8 seconds (15.2s async, 865.5s sync)
1548 tests, 0 failures
```

The full suite emitted only existing reset-password delivery warnings while exercising unrelated tests.

## Self-review findings

- Database-owned same-row invariants have matching changeset pre-validation, explicit named `check_constraint/3` mappings, focused changeset tests, and direct database coverage.
- Locked settings updates and run completion perform their read/lock/write work inside transactions.
- CJ bootstrap uses the unique network constraint with `on_conflict: :nothing` and fetches the persisted winner.
- Run completion locks the current row and leaves already-terminal rows unchanged.
- No queue, catalog, plan, or unrelated files were modified.

## Concerns

The brief describes string-backed Ecto enums and asks direct invalid status/trigger inserts to return PostgreSQL `:check_violation`. The repository’s mandatory `CategoricalStoragePolicy` requires every persisted `Ecto.Enum` to use a native PostgreSQL enum, so the implementation follows that policy. Invalid status/trigger labels therefore return PostgreSQL `:invalid_text_representation` before the redundant named checks can execute; the named checks remain present, and all other named checks return the requested `:check_violation`. If the brief’s enum error-code requirement is authoritative over repository policy, this needs an explicit design decision before a later task relies on those error codes.

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

## Fix round 1

The controller rulings were applied in a separate commit without amending the original storage commit.

### Fix 1: native enum checks

Added a focused regression asserting that native enum columns do not have redundant status/trigger checks.

RED:

```text
mix test test/product_compare/repo/commerce_conversion_sync_constraints_test.exs:163
...
Assertion with == failed
left:  [["commerce_conversion_sync_runs_status_valid"], ["commerce_conversion_sync_runs_trigger_valid"]]
right: []
1 test, 1 failure (3 excluded)
```

The migration and run changeset were then changed to remove those two redundant checks/mappings. After rebuilding the test database with the corrected migration, GREEN:

```text
mix test test/product_compare/repo/commerce_conversion_sync_constraints_test.exs:163
.
Finished in 0.07 seconds (0.07s async, 0.00s sync)
1 test, 0 failures (3 excluded)
```

Native enum rejection tests remain direct and assert PostgreSQL `:invalid_text_representation` for invalid status/trigger labels.

### Fix 2: transactional CJ bootstrap

Added a focused query-capture regression requiring the CJ network lookup to use `FOR UPDATE`.

RED:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:127
...
Expected truthy, got false
Captured queries included an unlocked affiliate_networks SELECT followed by the settings INSERT.
1 test, 1 failure (8 excluded)
```

`ensure_cj/1` now performs the network lookup/row lock, insert-on-conflict, and persisted-winner fetch inside one `Repo.transaction/1`. GREEN:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:127
.
Finished in 0.1 seconds (0.2s async, 0.00s sync)
1 test, 0 failures (8 excluded)
```

### Fix 3: restricted completion casting

Added a regression that submits a replacement window during completion and requires the locked run’s identity/window metadata to remain unchanged.

RED:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:283
...
Assertion with == failed
left: ~U[2026-08-27 00:00:00.000000Z]
right: ~U[2026-08-28 00:00:00.000000Z]
1 test, 1 failure (9 excluded)
```

`completion_changeset/2` now casts only status, cursor, terminal counts, finish time, and error summary, while running the shared invariant validation over unchanged stored fields. GREEN:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:283
.
Finished in 0.1 seconds (0.1s async, 0.00s sync)
1 test, 0 failures (9 excluded)
```

### Fix 4: string-key normalization

Added string-keyed input coverage for both context owners, including forced status/finish/start fields.

RED:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:137
...
** (Ecto.CastError) expected params to be a map with atoms or string keys, got a map with mixed keys
1 test, 1 failure (10 excluded)
```

Both contexts now normalize a strict whitelist of supported string/atom keys before applying defaults or forced fields. GREEN:

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs:137
.
Finished in 0.2 seconds (0.2s async, 0.00s sync)
1 test, 0 failures (10 excluded)
```

## Fix-round verification

```text
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
...............
Finished in 0.3 seconds (0.3s async, 0.00s sync)
15 tests, 0 failures
```

The affected native-enum policy suite also passes:

```text
mix test test/product_compare/repo/domain_enum_storage_test.exs
....
Finished in 0.5 seconds (0.5s async, 0.5s sync)
4 tests, 0 failures
```

Fix-round self-review found no additional concerns. The remaining enum error-code concern above is resolved by the controller ruling: native PostgreSQL enums are authoritative and the redundant status/trigger checks are removed.

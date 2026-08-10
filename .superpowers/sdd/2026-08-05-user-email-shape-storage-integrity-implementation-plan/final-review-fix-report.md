# Final Review Fix Report: User Email Shape Storage Integrity

Status: DONE

## Finding and Scope

The existing Elixir `~r/^[^\s]+@[^\s]+$/` intentionally has no `u` modifier:
it rejects ASCII regex whitespace but accepts internal U+2003, U+2028, and
U+2029 separators. PostgreSQL's default-collation `[[:space:]]` check rejected
those separators, narrowing direct writes. This fix preserves the application
rule and corrects the still-unshipped migration instead of adding a second
storage policy.

## RED

Added paired application and direct-write regressions for the three internal
Unicode separators (accepted) and all ASCII regex whitespace controls
(rejected). Before the migration correction:

```bash
mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs
```

Result: 6 tests, 1 expected failure. The direct SQL U+2003 insert raised
`users_email_shape_check`, proving the default-collation POSIX class was too
broad.

## GREEN

Changed `users_email_shape_check` to:

```sql
email::text COLLATE "C" ~ '^[^[:space:]]+@[^[:space:]]+$'
```

Only the affected migration was rolled back and reapplied in the test database
with `Ecto.Migrator.down/4` and `Ecto.Migrator.up/4`; later migrations stayed
applied and the development database was never reset or touched.

```bash
mix test test/product_compare/repo/user_email_shape_storage_integrity_test.exs test/product_compare/accounts/user_auth_schema_test.exs
```

Result: 21 tests, 0 failures.

```bash
mix test test/product_compare/accounts/user_auth_schema_test.exs test/product_compare/accounts/user_auth_test.exs test/product_compare/accounts/user_email_token_test.exs test/product_compare/accounts/user_session_token_schema_test.exs test/product_compare/accounts/api_token_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs
```

Result: 88 tests, 0 failures.

## Gates

- `mix typecheck`: passed.
- `mix format --check-formatted`: passed.
- `mix work_queue.validate`: passed with 3 ready rows.
- `git diff --check`: passed.
- Final post-fix `mix test`: 1,258 tests, 0 failures in 118.1 seconds.
- Final post-fix `mix quality`: 505 source files, no Credo issues, ExDNA 3/3,
  and Dialyzer passed.

## Files and Commit

- `priv/repo/migrations/20260809125900_enforce_user_email_shape_integrity.exs`
- `test/product_compare/repo/user_email_shape_storage_integrity_test.exs`
- `docs/work/user-email-shape-storage-integrity.md`
- `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`
- `docs/superpowers/specs/2026-08-05-user-email-shape-storage-integrity-design.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`

Commit: `fix: preserve user email regex semantics`.

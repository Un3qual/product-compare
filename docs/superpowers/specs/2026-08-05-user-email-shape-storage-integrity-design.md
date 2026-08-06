# User Email Shape Storage Integrity Design

## Context

`users.email` is the persisted Accounts login identity. Both
`User.changeset/2` and `User.registration_changeset/2` trim and lowercase an
email, then require the existing `~r/^[^\s]+@[^\s]+$/` shape. The original
table migration makes the `citext` column non-null and unique, but PostgreSQL
does not reject whitespace-containing or `@`-free direct writes.

That leaves bulk writes and future paths that bypass changesets able to store
an identity the Accounts boundary itself rejects. This work preserves the
current deliberately narrow rule; it is not RFC email validation.

## Approaches Considered

### 1. Forward named PostgreSQL check with changeset mappings

Add a forward `users_email_shape_check` constraint using the POSIX-equivalent
predicate `email::text ~ '^[^[:space:]]+@[^[:space:]]+$'`. Map that constraint
through both existing email-owning changesets and characterize direct writes.

This is the selected approach. It upgrades existing databases, uses the exact
existing acceptance rule, and gives both SQL callers and Ecto callers a named
failure.

### 2. Replace the application rule with RFC email validation

Rejected. The current changesets intentionally require only a non-whitespace
value containing `@`. RFC interpretation would reject values the application
currently accepts and would create new authentication policy.

### 3. Rewrite the original users migration

Rejected. Editing the historical migration would not protect databases that
already created `users`.

## Design

Create `20260805050000_enforce_user_email_shape_integrity.exs` with a named
check on `users`:

```sql
email::text ~ '^[^[:space:]]+@[^[:space:]]+$'
```

The migration is reversible and first relies on a read-only preflight that
lists any stored violations. Add `check_constraint(:email,
name: :users_email_shape_check)` after the existing `validate_format/4` call
in both `User.changeset/2` and `User.registration_changeset/2`.

One repository suite will prove direct inserts with `not-an-email` and
`has space@example.com` fail under the exact constraint name, while
`valid@example.com` remains accepted. Existing Accounts tests preserve
normalization, case-insensitive uniqueness, password hashing, and login
behavior.

## Boundaries

- Preserve trimming, lowercasing, `citext` uniqueness, password hashing,
  confirmation, session, API-token, and browser-auth behavior.
- Preserve the exact existing permissive email shape; add no RFC rule, length
  limit, domain verification, delivery behavior, or normalization trigger.
- Stop for a data decision if preflight finds an invalid row; do not rewrite or
  delete user identities.
- Use one concrete table check and no generic validation or storage framework.
- Use a forward migration; never reset the development database.

## Verification

- The live test-database preflight returns zero invalid `users.email` rows.
- The direct-write suite proves the named rejection and accepted control.
- The 15-test Accounts user-auth schema suite preserves normalization and
  authentication lifecycle behavior.
- Full backend test, type, quality, format, queue, and diff gates pass during
  execution.

## Failure Handling

If the preflight query returns rows, report each `id` and `email` value and do
not apply the migration. The coordinator must decide how to repair or retain
those records before the constraint can be added.

# Credential Artifact Storage Constraints Design

## Context

Account token code already defines three exact persistence invariants:

- user session, confirmation, and reset tokens store a SHA-256 digest, which is
  always 32 bytes;
- API-token prefixes contain between 1 and 32 Unicode code points; and
- optional API-token labels contain at most 120 Unicode code points.

The live PostgreSQL catalog enforces only the existing 32-byte API-token digest
and non-empty prefix rules. Direct SQL can therefore persist a user-token digest
of any size, an API-token prefix longer than 32 code points, or a label longer
than 120 code points even though the owning changesets reject those values.

The canonical unit for the API-token text bounds is Unicode code points.
PostgreSQL `char_length` already uses that unit. The owning Ecto validations
must therefore pass `count: :codepoints` explicitly instead of relying on
Ecto's grapheme-counting default.

The focused account baseline passes 21 tests. This is a storage-boundary gap,
not a failing application workflow.

## Approaches Considered

### 1. Forward database constraints with changeset mappings

Add one forward migration with named checks for the three established
invariants. Replace the weaker non-empty prefix constraint with a bounded
length constraint and map each mutable constraint through its owning schema.

This is the selected approach. It protects changeset and direct-write paths,
applies to databases that have already run the historical account migrations,
and introduces no new account policy.

### 2. Edit the historical account migrations

This would make a clean rebuild correct but would not upgrade an existing
database. Account and API-token migrations predate the current queue work, so
rewriting them is not sufficient.

### 3. Add a test-only policy guard

A reflection guard could report missing checks but would still allow invalid
rows at runtime. The invariants are exact and cheap for PostgreSQL to enforce,
so enforcement belongs in the database.

## Design

Create a forward migration that:

- replaces `api_tokens_prefix_not_empty` with
  `api_tokens_prefix_length_check`, requiring a prefix length from 1 through
  32 code points;
- adds `api_tokens_label_length_check`, permitting `NULL` and labels up to 120
  code points; and
- adds `users_tokens_hash_length_check`, requiring exactly 32 digest bytes.

The migration uses explicit `up/0` and `down/0` functions. Reversal restores
the historical non-empty API-token prefix constraint after removing the three
new checks.

`ProductCompareSchemas.Accounts.ApiToken.changeset/2` counts prefix and label
lengths as Unicode code points and maps both checks.
`ProductCompareSchemas.Accounts.UserSessionToken.changeset/2` validates the
digest byte length and maps the database check so non-direct application writes
retain useful changeset errors.

## Test Contract

A focused direct-write suite proves PostgreSQL rejects:

- user-token digests shorter or longer than 32 bytes;
- empty and 33-code-point API-token prefixes; and
- 121-code-point API-token labels.

The same suite proves the valid boundaries: exactly 32 digest bytes, prefixes
of 1 and 32 code points, and labels of `NULL` and 120 code points. Focused
changeset and account-context regressions use decomposed combining text and an
emoji ZWJ sequence to prove 32/33-code-point prefixes and 120/121-code-point
labels agree at the application and direct PostgreSQL boundaries.

Existing account-auth, API-token, session-token schema, GraphQL auth, seed, and
node-query suites prove lifecycle parity.

## Boundaries

- Preserve all GraphQL, browser-auth, API-token, and cookie-session contracts.
- Do not add email-format, password-hash, timestamp-ordering, or expiry policy.
- Do not change token generation, hashing algorithms, prefixes, or labels.
- Do not normalize, truncate, or otherwise transform stored Unicode values.
- Do not reset the development database.
- Do not introduce a generic string-length policy framework.

## Failure Handling

If existing rows violate one of these already-established application
invariants, stop and report the exact table, column, and observed length.
Do not silently truncate, rewrite, or delete credential artifacts.

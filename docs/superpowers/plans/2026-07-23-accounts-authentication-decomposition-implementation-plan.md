# Accounts Authentication Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the Accounts and GraphQL authentication contracts while
moving credential, user-token, API-token, and resolver implementations into
focused internal owners.

**Architecture:** `UserAuth` remains the Accounts-internal facade over
credentials, persisted user tokens, and confirmation/reset workflows.
`ApiTokens` remains the Accounts-internal facade over secrets,
authentication, queries, and lifecycle. `AuthResolver` remains schema-facing
over account actions and API-token actions.

**Tech Stack:** Elixir, Argon2, Ecto, PostgreSQL, Phoenix sessions, Absinthe,
ExUnit.

## Global Constraints

- Preserve `ProductCompare.Accounts` as the only application-facing context.
- Preserve every `UserAuth`, `ApiTokens`, and `AuthResolver` public function,
  default, guard, value, error, transaction, lock, and payload.
- Keep Phoenix cookie-backed sessions authoritative.
- Preserve trusted-origin checks, constant-time password fallback, token
  encoding/hashing/entropy, expiry, configured delivery hooks, owner scope,
  rotation/revocation, and last-used behavior.
- Keep test hooks configured under `ProductCompare.Accounts.UserAuth`.
- Do not change schemas, migrations, GraphQL SDL, auth policy, email transport,
  Relay, or frontend behavior.

---

## Task 1: Password Credential Ownership

**Files:**

- Create: `lib/product_compare/accounts/user_auth/credentials.ex`
- Modify: `lib/product_compare/accounts/user_auth.ex`
- Test: `test/product_compare/accounts/user_auth_test.exs`

**Interfaces:**

- Produces:
  `Credentials.authenticate_user_by_email_and_password/2`, returning the
  current `User.t() | nil`.

- [ ] Run `mix test test/product_compare/accounts/user_auth_test.exs` as the
  green baseline.
- [ ] Add explicit `UserAuth` delegation and verify compilation fails because
  `Credentials` does not exist.
- [ ] Move email normalization, user lookup, Argon2 verification, malformed
  hash handling, and `Argon2.no_user_verify/0` fallback into `Credentials`.
- [ ] Preserve both public `UserAuth` clauses and the exact nil result.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate account credentials`.

## Task 2: Persisted User Token And Session Ownership

**Files:**

- Create: `lib/product_compare/accounts/user_auth/sessions.ex`
- Modify: `lib/product_compare/accounts/user_auth.ex`
- Test: `test/product_compare/accounts/user_auth_test.exs`
- Test: `test/product_compare/accounts/user_session_token_schema_test.exs`

**Interfaces:**

- Produces:
  `Sessions.generate_user_session_token/1`,
  `get_user_by_session_token/1`, and
  `delete_user_session_token/1`.
- Provides namespace-internal token-store functions used by `EmailTokens`:
  `issue/4`, `decode/1`, `hash/1`, `clear/2`, and `current_time/0`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move session issue, stale-authentication lock, lookup, deletion, expiry,
  token insertion, decode/hash, and token cleanup into `Sessions`.
- [ ] Keep invalid lookup returning `nil`, invalid deletion returning `:ok`,
  and stale authenticated structs unable to mint sessions.
- [ ] Keep shared token-store functions `@moduledoc false` and callable only
  inside `ProductCompare.Accounts.UserAuth`.
- [ ] Re-run both suites; expect transaction, lock, expiry, encoding, and
  schema behavior to remain green.
- [ ] Commit with message `refactor: isolate account sessions`.

## Task 3: Email Token Workflow Ownership

**Files:**

- Create: `lib/product_compare/accounts/user_auth/email_tokens.ex`
- Modify: `lib/product_compare/accounts/user_auth.ex`
- Read: `lib/product_compare/accounts/user_auth/sessions.ex`
- Test: `test/product_compare/accounts/user_auth_test.exs`
- Test: `test/product_compare/accounts/user_email_token_test.exs`

**Interfaces:**

- Produces:
  `EmailTokens.deliver_confirmation_instructions/2`,
  `confirm_user/1`,
  `deliver_reset_password_instructions/2`,
  `get_user_by_reset_password_token/1`, and
  `reset_user_password/2`.
- Consumes the namespace-internal `Sessions` token-store interface from Task 2.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move confirmation/reset contexts, expiry, sent-to validation,
  single-use locked consumption, password reset, token cleanup, delivery
  transaction, logging classification, and test-hook invocation into
  `EmailTokens`.
- [ ] Preserve delivery rollback to the previously valid token and keep the
  test hook lookup under `ProductCompare.Accounts.UserAuth`.
- [ ] Re-run both suites; expect exact invalid-token, changeset-action,
  delivery, concurrency, and cleanup behavior.
- [ ] Commit with message `refactor: isolate account email tokens`.

## Task 4: API Token Secret Ownership

**Files:**

- Create: `lib/product_compare/accounts/api_tokens/secrets.ex`
- Modify: `lib/product_compare/accounts/api_tokens.ex`
- Test: `test/product_compare/accounts/api_token_test.exs`

**Interfaces:**

- Produces:
  `Secrets.generate/0`,
  `Secrets.hash/1`, and
  `Secrets.prefix/1`.
- `generate/0` uses 32 random bytes; `hash/1` uses SHA3-256; `prefix/1` returns
  the first 12 lowercase hexadecimal hash characters.

- [ ] Run the API-token suite as the green baseline.
- [ ] Delegate the three secret operations and verify the expected
  missing-owner compilation failure.
- [ ] Move only secure generation, hashing, and prefix projection into
  `Secrets`.
- [ ] Re-run the suite; expect token shapes and persisted prefixes/hashes to
  remain unchanged.
- [ ] Commit with message `refactor: isolate api token secrets`.

## Task 5: API Token Authentication Ownership

**Files:**

- Create: `lib/product_compare/accounts/api_tokens/authentication.ex`
- Modify: `lib/product_compare/accounts/api_tokens.ex`
- Read: `lib/product_compare/accounts/api_tokens/secrets.ex`
- Test: `test/product_compare/accounts/api_token_test.exs`
- Test: `test/product_compare_web/graphql/api_token_auth_test.exs`

**Interfaces:**

- Produces:
  `Authentication.authenticate/2`, returning
  `{:ok, User.t(), ApiToken.t()} | :error`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move malformed-secret rejection, active-token query, user join, expiry
  enforcement, and optional last-used update into `Authentication`.
- [ ] Reuse `Secrets.hash/1`; preserve `touch_last_used?: false`.
- [ ] Re-run both suites; expect exact authentication and GraphQL context
  behavior.
- [ ] Commit with message `refactor: isolate api token authentication`.

## Task 6: API Token Query Ownership

**Files:**

- Create: `lib/product_compare/accounts/api_tokens/queries.ex`
- Modify: `lib/product_compare/accounts/api_tokens.ex`
- Test: `test/product_compare/accounts/api_token_test.exs`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Interfaces:**

- Produces:
  `Queries.list_query/2`,
  `Queries.list/2`,
  `Queries.get_for_user/2`, and
  `Queries.get_many_for_user/2`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move status normalization, active/revoked predicates, ordering,
  owner-scoped UUID lookup, and list execution into `Queries`.
- [ ] Preserve list/map input support, unknown status falling back to `:all`,
  invalid UUID result maps, and current time semantics.
- [ ] Re-run both suites; expect owner scope, order, filters, and GraphQL
  connection behavior.
- [ ] Commit with message `refactor: isolate api token queries`.

## Task 7: API Token Lifecycle Ownership

**Files:**

- Create: `lib/product_compare/accounts/api_tokens/lifecycle.ex`
- Modify: `lib/product_compare/accounts/api_tokens.ex`
- Read: `lib/product_compare/accounts/api_tokens/secrets.ex`
- Test: `test/product_compare/accounts/api_token_test.exs`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Interfaces:**

- Produces:
  `Lifecycle.create/2`,
  `Lifecycle.revoke/2`, and
  `Lifecycle.rotate/3`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move issue, expiry defaults, configured TTL lookup, owner-scoped revoke,
  locked rotation, replacement defaults, active checks, and changeset
  persistence into `Lifecycle`.
- [ ] Reuse `Secrets.generate/0`, `hash/1`, and `prefix/1`.
- [ ] Preserve nil explicit expiry, invalid-expiry fallback, idempotent revoke,
  rollback on replacement failure, and exact not-found behavior.
- [ ] Re-run both suites; expect lifecycle and GraphQL behavior to remain
  green.
- [ ] Commit with message `refactor: isolate api token lifecycle`.

## Task 8: Browser Account Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/auth/account_actions.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Interfaces:**

- Produces the current resolver callbacks:
  `viewer/3`, `register/3`, `login/3`, `logout/3`, `forgot_password/3`,
  `reset_password/3`, and `verify_email/3`.

- [ ] Run the session-auth suite as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move trusted-origin handling, session bridge operations, Accounts calls,
  enumeration-safe forgot-password behavior, and account/action payload
  projection into `AccountActions`.
- [ ] Preserve every facade function clause, spec, result, error code, message,
  and field.
- [ ] Re-run the suite; expect cookie session and origin behavior to remain
  green.
- [ ] Commit with message `refactor: isolate graphql account actions`.

## Task 9: API Token Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/auth/api_tokens.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`
- Test: `test/product_compare_web/graphql/api_token_auth_test.exs`

**Interfaces:**

- Produces the current resolver callbacks:
  `my_api_tokens/3`, `create_api_token/3`, `revoke_api_token/3`, and
  `rotate_api_token/3`.

- [ ] Run both GraphQL auth suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move authorized Dataloader/direct-query reads, input normalization,
  Global ID decoding, Accounts lifecycle calls, and token payload errors into
  `Resolvers.Auth.ApiTokens`.
- [ ] Preserve unauthenticated top-level/read behavior, mutation payloads,
  one-time plaintext handling, error codes/messages/fields, and connection
  arguments.
- [ ] Re-run both suites; expect exact API-token GraphQL behavior.
- [ ] Commit with message `refactor: isolate graphql api token actions`.

## Task 10: Full Accounts Authentication Gate

**Files:**

- Modify: `docs/work/accounts-authentication-decomposition.md`

- [ ] Run
  `mix test test/product_compare/accounts
  test/product_compare_web/graphql/session_auth_test.exs
  test/product_compare_web/graphql/api_token_auth_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no caller outside Accounts or the owned namespaces references
  the new UserAuth/API-token owners, and schema files still reference only
  `AuthResolver`.
- [ ] Record final owner sizes, exact test counts, and gate evidence.
- [ ] Include the lane doc in the final accounts-authentication milestone
  commit.

# Accounts Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Accounts` as the stable application-facing
context while moving user provisioning, API-token lifecycle, and reputation
implementations into focused internal modules alongside the existing focused
`UserAuth` owner.

**Architecture:** `ProductCompare.Accounts` retains every public function,
arity, default, typespec, value, and error as explicit facade wrappers.
`Users`, `ApiTokens`, and `Reputation` own the current implementations by
responsibility; `UserAuth` continues to own password, session, confirmation,
and reset-token workflows.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Argon2, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Accounts` public function, arity,
  default, typespec, return value, and error.
- Preserve user email normalization, password-hash rules, trusted operator
  bootstrap fail-closed behavior, transactions, savepoints, row locks, and
  deterministic test hooks.
- Preserve API-token entropy, hashing, prefixes, expiry defaults, status
  filters, owner scoping, invalid-UUID handling, last-used updates, rotation,
  revocation, transactions, and errors.
- Preserve reputation conflict targets, pagination limits, ordering, values,
  and errors.
- Preserve configured delivery hooks and the existing `UserAuth` password,
  session, confirmation, and reset-token behavior.
- Keep all application callers dependent only on `ProductCompare.Accounts`;
  internal modules are implementation details.
- Do not change schemas, migrations, GraphQL SDL, browser auth, cookie/session
  authority, authorization policy, seed policy, or email transport scope.

---

### Task 1: User Provisioning Ownership

**Files:**

- Create: `lib/product_compare/accounts/users.ex`
- Modify: `lib/product_compare/accounts.ex`
- Test: `test/product_compare/accounts/create_user_test.exs`
- Test: `test/product_compare/accounts/user_auth_schema_test.exs`
- Test: `test/product_compare/repo/seeds_test.exs`

**Interfaces:** `ProductCompare.Accounts.Users` owns user creation,
registration, lookup, trusted operator access/bootstrap, password repair,
normalization, transaction-local locking, and the existing deterministic
create-race hooks. The facade retains:

```elixir
create_user/1
register_user/1
get_user!/1
get_user_by_email/1
set_operator_access/2
bootstrap_operator_user/3
ensure_user_with_password/2
```

- [ ] Run the three named suites as a green characterization baseline.
- [ ] Move the user implementation and private helpers into `Users` without
  changing changesets, transactions, savepoints, locks, hooks, normalized
  values, password-hash behavior, or bootstrap rollback reasons.
- [ ] Replace the facade implementations with explicit wrappers that retain
  the existing typespecs, guards, struct matches, and return contracts.
- [ ] Re-run the three suites and confirm create, repair, registration,
  operator bootstrap, idempotency, race, and seed behavior remain unchanged.
- [ ] Commit with message `refactor: isolate account user ownership`.

### Task 2: API-Token Ownership

**Files:**

- Create: `lib/product_compare/accounts/api_tokens.ex`
- Modify: `lib/product_compare/accounts.ex`
- Test: `test/product_compare/accounts/api_token_test.exs`
- Test: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Test: `test/product_compare_web/graphql/node_query_test.exs`

**Interfaces:** `ProductCompare.Accounts.ApiTokens` owns token issue,
authentication, list/query policy, owner lookup, last-used updates, rotation,
revocation, entropy generation, hashing, prefix derivation, expiry defaults,
status normalization, row locking, and transaction behavior. The facade
retains:

```elixir
create_api_token/1,2
authenticate_api_token/1,2
list_api_tokens_query/1,2
list_api_tokens/1,2
get_api_token_for_user/2
get_api_tokens_for_user/2
revoke_api_token/2
rotate_api_token/2,3
```

- [ ] Run the three named suites as a green characterization baseline.
- [ ] Move API-token persistence, queries, cryptography, defaulting, filters,
  locking, rotation, and revocation into `ApiTokens` without changing public
  token shapes, query semantics, timestamps, conflicts, or errors.
- [ ] Add explicit facade wrappers preserving defaults, guards, typespecs,
  invalid-input clauses, and owner-scoped results.
- [ ] Re-run the three suites and confirm create, authenticate, touch/no-touch,
  active/revoked/expired filters, invalid UUIDs, rotation, GraphQL auth, and
  authorized node behavior remain unchanged.
- [ ] Commit with message `refactor: isolate account token ownership`.

### Task 3: Reputation Ownership And Full Gate

**Files:**

- Create: `lib/product_compare/accounts/reputation.ex`
- Modify: `lib/product_compare/accounts.ex`
- Modify: `docs/work/accounts-context-decomposition.md`
- Test: `test/product_compare/accounts/reputation_upsert_test.exs`

**Interfaces:** `ProductCompare.Accounts.Reputation` owns reputation upsert,
event creation, bounded event listing, pagination normalization, and ordering.
`Users` consumes `Reputation.upsert_user_reputation/2` inside the unchanged
operator-bootstrap transaction. The facade retains:

```elixir
upsert_user_reputation/2
add_reputation_event/2
list_reputation_events/1,2
```

- [ ] Run the named reputation suite as a green characterization baseline.
- [ ] Move reputation persistence and bounded reads into `Reputation` without
  changing conflict targets, limits, ordering, values, or errors.
- [ ] Add explicit facade wrappers preserving defaults and typespecs, then
  re-run the reputation suite.
- [ ] Confirm all password, session, confirmation, reset, and configured
  delivery functions still delegate through the facade to `UserAuth` with
  unchanged hooks and behavior.
- [ ] Run the exact 112-test characterization command from the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm `rg 'ProductCompare.Accounts.(Users|ApiTokens|Reputation)' lib test`
  finds no application caller outside the facade and internal modules.
- [ ] Record final module responsibilities, facade size, exact test counts,
  and gate results in the lane doc.
- [ ] Include lane evidence in the final code/test milestone commit.

# Accounts Context Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-accounts-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against direct Accounts, seeds, API-token/session
  GraphQL, and authorized node characterization suites.

## Target Outcome

`ProductCompare.Accounts` will remain the stable application-facing context
while user provisioning, API-token lifecycle, and reputation implementations
move into focused internal modules alongside the existing `UserAuth` owner,
with unchanged public APIs, auth behavior, transactions, locks, errors, and
GraphQL behavior.

## Ready Evidence

- `lib/product_compare/accounts.ex` is 721 lines and still owns user
  provisioning/bootstrap, API-token lifecycle, and reputation persistence and
  reads in addition to facade delegation to the existing focused `UserAuth`.
- Existing plugs, resolvers, fixtures, seeds, tests, and other contexts depend
  only on the facade, so implementation ownership can move without changing
  application call sites.
- The selected characterization gate passed 112 tests on 2026-07-22. It covers
  user creation and repair, operator bootstrap and races, password/session/
  confirmation/reset behavior, API-token lifecycle and GraphQL auth, owner-
  scoped node reads, reputation, schema constraints, and seeds.
- The row is path-disjoint from Specs, Commerce Attribution, and Ingestion.
  It does not change the GraphQL auth contract, cookie-backed session
  authority, authorization policy, seed policy, or email transport scope.

## Internal Slices

1. User creation, lookup, trusted bootstrap, and password-repair ownership.
2. API-token issue, authentication, query, rotation, and revocation ownership.
3. Reputation persistence and bounded read ownership.
4. Existing `UserAuth`, configured-delivery, facade, GraphQL, and seed parity.

## Boundaries

- Preserve every public function, arity, default, typespec, value, and error.
- Preserve normalization, password hashing, transactions, savepoints, locks,
  race hooks, token cryptography/defaults/filters, and reputation pagination.
- Keep callers on `ProductCompare.Accounts`; internal modules must not become
  application contracts.
- Do not change schemas, migrations, GraphQL SDL, browser auth, cookie/session
  authority, authorization, seeds, or email transport behavior.

## Verification

- `mix test test/product_compare/accounts test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare/repo/seeds_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

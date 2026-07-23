# Accounts Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-accounts-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 with the exact 112-test characterization gate,
  typechecking, formatting, Dialyzer, full `mix ci`, and diff hygiene green.
- Completed: 2026-07-22 on the current detached worktree after Alerts Context
  Decomposition restored the three-ready-row floor for the claim.

## Batch Outcome

`ProductCompare.Accounts` remains the stable 198-line application-facing
context. User provisioning, API-token lifecycle, and reputation implementations
now live in focused internal modules alongside the existing `UserAuth` owner,
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

## Completion Evidence

- `ProductCompare.Accounts` is a 198-line facade retaining the full historical
  public function, arity, default, guard, typespec, value, and error contract.
- `ProductCompare.Accounts.Users` is 266 lines and owns user creation,
  registration, lookup, trusted operator bootstrap, password repair,
  normalization, savepoints, locks, and deterministic create-race hooks.
- `ProductCompare.Accounts.ApiTokens` is 324 lines and owns token issue,
  authentication, status-filtered reads, owner lookups, entropy and hashing,
  expiry defaults, last-used updates, rotation, revocation, transactions, and
  locks.
- `ProductCompare.Accounts.Reputation` is 54 lines and owns reputation upsert,
  event creation, and bounded ordered event reads. The existing 389-line
  `UserAuth` owner remains unchanged.
- The exact characterization command passed 112 tests with 0 failures. The
  focused user, token, and reputation milestones passed 18, 52, and 1 tests.
- `mix typecheck`, `mix format --check-formatted`, and `mix dialyzer` passed.
  Two pre-existing facade-path Dialyzer suppressions moved to function-local
  annotations so the defensive fallback clauses remain behaviorally intact.
- Full `mix ci` passed Credo, Reach, ExDNA at the unchanged 6/6 budget,
  Dialyzer, 905 backend tests at 83.70% coverage, all 1,507 frontend tests,
  Relay validation, TypeScript, client and SSR production builds, and the
  client-bundle contract.
- The internal-owner caller scan found no application bypass outside the
  facade and internal modules. `mix work_queue.validate` retains three ready
  rows, and `git diff --check` is clean.

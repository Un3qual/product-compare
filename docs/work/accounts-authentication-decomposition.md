# Accounts Authentication Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-accounts-authentication-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Accounts and GraphQL auth
  characterization paths.

## Target Outcome

The existing Accounts, `UserAuth`, `ApiTokens`, and schema-facing
`AuthResolver` contracts remain stable while credential, persisted-token,
email-token, API-token, account-action, and API-token resolver implementations
live in focused internal owners.

## Ready Evidence

- `UserAuth`, `ApiTokens`, and `AuthResolver` are respectively 389, 324, and
  324 lines and each combines multiple concrete responsibilities.
- Existing Accounts and GraphQL auth suites characterize session authority,
  token lifecycle, authorization, payloads, and errors.

## Internal Slices

1. Password credentials, persisted sessions, and email-token workflows.
2. API-token secrets, authentication, queries, and lifecycle.
3. GraphQL account actions and API-token actions.
4. Stable facades and caller-path parity.

## Boundaries

- Preserve every function, default, guard, value, error, transaction, lock,
  payload, trusted-origin check, expiry, hook, and owner scope.
- Keep Phoenix cookie sessions authoritative and test hooks configured under
  `ProductCompare.Accounts.UserAuth`.
- Do not change schemas, migrations, GraphQL SDL, auth policy, email
  transport, Relay, or frontend behavior.

## Verification

- Focused gate:
  `mix test test/product_compare/accounts
  test/product_compare_web/graphql/session_auth_test.exs
  test/product_compare_web/graphql/api_token_auth_test.exs`
  passed 87 tests with 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` passed.
- `mix ci` passed 913 backend tests at 83.48% coverage, 1,507 frontend
  tests, and every queue, quality, duplication, type, Relay, build, and
  bundle gate.

## Completion Evidence

- `UserAuth`, `ApiTokens`, and `AuthResolver` are now 69-, 66-, and 87-line
  stable facades.
- User-auth owners are 37 lines (`Credentials`), 135 lines (`Sessions`), and
  211 lines (`EmailTokens`).
- API-token owners are 23 lines (`Secrets`), 49 lines (`Authentication`),
  95 lines (`Queries`), and 167 lines (`Lifecycle`).
- GraphQL owners are 159 lines (`AccountActions`) and 153 lines
  (`Resolvers.Auth.ApiTokens`).
- Caller scans found no internal-owner bypasses outside the owned namespaces;
  schema files still reference only `AuthResolver`.
- Phoenix cookie sessions, trusted-origin checks, constant-time credential
  fallbacks, stale-auth locking, email-token rollback and test-hook lookup,
  API-token entropy/hash/expiry/owner scope, and every GraphQL payload remain
  unchanged.

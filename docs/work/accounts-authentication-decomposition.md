# Accounts Authentication Decomposition

## Snapshot

- Status: ready
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

- `mix test test/product_compare/accounts test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

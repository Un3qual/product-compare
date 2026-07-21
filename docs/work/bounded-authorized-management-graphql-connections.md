# Bounded Authorized Management GraphQL Connections

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-authorized-management-graphql-connections-implementation-plan.md`
- Last verified: 2026-07-21 against the live schema, management resolvers,
  connection helper, and 45 passing focused GraphQL tests.

## Batch Outcome

Identical owner-scoped and operator-only management Relay connection aliases
reuse one authorized database read per collection, filter, and page within a
GraphQL request without changing privacy, authorization, filtering, ordering,
pagination, errors, nested values, or schema behavior.

## Ready Evidence

- Owner-scoped specification corrections, price watches, alert events, API
  tokens, saved comparison sets, and comparison snapshots each call
  `Connection.from_query_result/3` directly for every authorized alias.
- The operator-only specification-correction moderation queue and merchant feed
  candidate queue authorize and then call the same direct connection path for
  every alias.
- `Connection.from_query_result/3` executes one bounded page query; repeated
  identical aliases therefore grow linearly even though their principal,
  filters, ordering, and page are identical.
- The six focused GraphQL suites pass 45 tests and already characterize the
  relevant owner scope, operator gates, filters, cursors, page sizes, order,
  and nested values, but do not prove repeated-alias budgets.

## Internal Slices

1. Owner-scoped management connection request reuse.
2. Operator-only queue connection request reuse.
3. Growing-alias query budgets plus authorization and semantic parity.

## Boundaries

- Authorize before scheduling any private load.
- Key every load by role, principal ID, collection kind, normalized filters,
  and Relay connection arguments.
- Do not share cache entries across principals or distinct arguments.
- Preserve direct resolver fallbacks and the public GraphQL schema.
- This batch does not reopen deferred ingestion dashboard or operator UI work;
  it only bounds the existing merchant-feed review query.

## Verification

- Specification-correction, price-watch/alert, API-token, saved-comparison,
  comparison-snapshot, merchant-feed-candidate, and Dataloader GraphQL suites.
- Growing-alias query-budget regressions for all eight management collections.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

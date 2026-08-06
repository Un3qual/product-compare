# Operator Mutation Authorization Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all operator-only GraphQL writes linearizable with operator-role revocation while preserving their existing payloads and domain behavior.

**Architecture:** Add one Accounts-owned, transaction-required operation that locks and reloads an operator user. Affiliate resolver transactions, the existing specification-correction transaction, and the CJ-program resolver transaction acquire that user row before any domain row or write; community moderation remains the already-correct reference.

**Tech Stack:** Elixir 1.19, Ecto/PostgreSQL row locks, Absinthe GraphQL, ExUnit SQL sandbox helpers.

## Global Constraints

- Cover exactly `upsertAffiliateNetwork`, `upsertAffiliateProgram`,
  `upsertAffiliateLink`, `createCoupon`, `moderateSpecificationCorrection`, and
  `updateCJProgram`.
- A committed revocation wins over a waiting mutation; a mutation that owns the
  operator lock may commit before a waiting revocation.
- Acquire the operator user row before any protected domain row.
- Prove both orders through the actual operation in each owning transaction
  family: the shared affiliate path, specification-correction moderation, and
  CJ-program update. Accounts-only lock races do not establish that the
  protected write shares the authorization transaction.
- Preserve current anonymous, forbidden, validation, conflict, and success
  payloads.
- Missing and non-operator current rows both fail as forbidden.
- Keep operator reads, community moderation, API-token authentication, and
  session policy out of scope.
- Do not add a generic transaction framework, source scan, retry, sleep, or
  timing-based concurrency assertion.

---

### Task 1: Serialize Operator Mutations With Role Revocation

**Files:**
- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare/accounts/users.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate/mutations.ex`
- Modify: `lib/product_compare/specs/corrections.ex`
- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `test/product_compare/accounts/concurrency_test.exs`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Modify: `test/product_compare_web/graphql/specification_corrections_test.exs`
- Modify: `test/product_compare_web/graphql/cj_program_queries_test.exs`
- Modify: `docs/work/operator-mutation-authorization-freshness.md`

**Interfaces:**
- Consumes: the request-context operator ID, `Repo.in_transaction?/0`, and the
  current mutation/context functions.
- Produces: `Accounts.lock_operator/1`, returning `{:ok, User.t()}` only for a
  current operator row locked with `FOR UPDATE`, or `{:error, :forbidden}` for
  a missing/non-operator row; calling it outside a transaction raises
  `ArgumentError`.

- [x] **Step 1: Add failing surface and actual-operation concurrency regressions**

In the three GraphQL suites, keep a previously loaded operator struct, revoke
its database row, invoke all six resolver paths, and assert their existing
`FORBIDDEN` payloads plus unchanged affiliate, correction, and CJ-program
state. This proves every surface rechecks the current row, but it is not a
substitute for the transaction-span regressions below.

For each owning transaction family, invoke an actual protected operation and
prove both serialization orders with backend PIDs and `pg_blocking_pids`:

1. Exercise the shared affiliate transaction through a real affiliate mutation
   against an existing target row. The shared path must own network, program,
   link, and coupon writes; the four stale-snapshot assertions cover every
   surface.
2. Exercise `moderateSpecificationCorrection` against its correction row.
3. Exercise `updateCJProgram` against its CJ-program row.

For revocation-first, hold the user update open after revoking operator access,
start the actual operation, prove its database backend waits on revocation,
commit revocation, and assert the existing forbidden payload with unchanged
domain state. For mutation-first, hold the family's target domain row in a
separate transaction, start the actual operation, prove it waits at that row,
then start revocation and prove revocation waits on the operation's backend.
Release the domain barrier and assert the operation commits before revocation,
with the expected domain change and final revoked user. This establishes that
the user lock remains held through the protected write. Use no source-text
inspection, sleep, retry, or elapsed-time assertion.

Run:

```bash
mix test test/product_compare/accounts/concurrency_test.exs test/product_compare/discussions/concurrency_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs
```

Expected before implementation: the new Accounts operation is absent and the
six stale-snapshot mutation assertions perform or reach their domain writes.

- [x] **Step 2: Add the transaction-required Accounts lock**

Delegate `Accounts.lock_operator/1` to `Accounts.Users`. Require an active Repo
transaction, select the user by ID with `FOR UPDATE`, return the current
operator, and map a missing or non-operator row to `{:error, :forbidden}`.
Follow the existing transaction-required guard style used by source-provider
claiming; do not start a transaction inside this operation.

- [x] **Step 3: Adopt one lock order across the six mutations**

For affiliate writes, use one resolver helper as the single path that starts
the transaction, locks the current operator, and runs the selected
network/program/link/coupon action; route the currently separate network write
through it as well. For specification corrections, call
`Accounts.lock_operator/1` first inside the existing moderation transaction.
For CJ-program lifecycle updates, start a resolver transaction, lock the
operator, and then call the existing optimistic lifecycle update. Roll back on
authorization failure while retaining every current mutation error mapping.

- [x] **Step 4: Verify the focused and complete contracts**

```bash
mix test test/product_compare/accounts/concurrency_test.exs test/product_compare/discussions/concurrency_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs
mix test test/product_compare_web/graphql
mix format --check-formatted
mix typecheck
mix quality
mix test
mix work_queue.validate
git diff --check
```

- [x] **Step 5: Record and commit the completed outcome**

Change the lane doc's prospective `Target Outcome` to observed `Batch Outcome`,
record all six stale-snapshot results plus both actual-operation lock orders for
each of the three transaction families, remove the completed active row while
leaving ready rows 17-19 intact, append the concise completion record to the
work-index history, move the plan into the completed catalog, and commit the
code, tests, and closeout evidence together.

```bash
git add lib/product_compare/accounts.ex lib/product_compare/accounts/users.ex lib/product_compare_web/resolvers/affiliate/mutations.ex lib/product_compare/specs/corrections.ex lib/product_compare_web/resolvers/ingestion_resolver.ex test/product_compare/accounts/concurrency_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs docs/work/operator-mutation-authorization-freshness.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md docs/superpowers/plans/2026-07-31-operator-mutation-authorization-freshness-implementation-plan.md
git commit -m "fix: refresh operator mutation authorization"
```

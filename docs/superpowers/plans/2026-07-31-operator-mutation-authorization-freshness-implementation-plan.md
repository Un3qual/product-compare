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

- [ ] **Step 1: Add failing authorization and lock-order regressions**

In `accounts/concurrency_test.exs`, prove both database orders with existing
backend-PID helpers: a held revocation makes the protected action wait and then
return `{:error, :forbidden}`; a protected action holding the user lock makes
revocation wait until the action commits. Assert database state after both
tasks complete.

In the three GraphQL suites, keep a previously loaded operator struct, revoke
its database row, invoke all six resolver paths, and assert their existing
`FORBIDDEN` payloads plus unchanged affiliate, correction, and CJ-program
state. Do not inspect resolver source text.

Run:

```bash
mix test test/product_compare/accounts/concurrency_test.exs test/product_compare/discussions/concurrency_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs
```

Expected before implementation: the new Accounts operation is absent and the
six stale-snapshot mutation assertions perform or reach their domain writes.

- [ ] **Step 2: Add the transaction-required Accounts lock**

Delegate `Accounts.lock_operator/1` to `Accounts.Users`. Require an active Repo
transaction, select the user by ID with `FOR UPDATE`, return the current
operator, and map a missing or non-operator row to `{:error, :forbidden}`.
Follow the existing transaction-required guard style used by source-provider
claiming; do not start a transaction inside this operation.

- [ ] **Step 3: Adopt one lock order across the six mutations**

For affiliate writes, use the existing resolver helper as the single place
that starts the transaction, locks the current operator, and runs the selected
network/program/link/coupon action. For specification corrections, call
`Accounts.lock_operator/1` first inside the existing moderation transaction.
For CJ-program lifecycle updates, start a resolver transaction, lock the
operator, and then call the existing optimistic lifecycle update. Roll back on
authorization failure while retaining every current mutation error mapping.

- [ ] **Step 4: Verify the focused and complete contracts**

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

- [ ] **Step 5: Record and commit the completed outcome**

Change the lane doc's prospective `Target Outcome` to observed `Batch Outcome`,
record focused and full verification without command transcripts, and commit
the code, tests, and lane evidence together.

```bash
git add lib/product_compare/accounts.ex lib/product_compare/accounts/users.ex lib/product_compare_web/resolvers/affiliate/mutations.ex lib/product_compare/specs/corrections.ex lib/product_compare_web/resolvers/ingestion_resolver.ex test/product_compare/accounts/concurrency_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/specification_corrections_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs docs/work/operator-mutation-authorization-freshness.md
git commit -m "fix: refresh operator mutation authorization"
```

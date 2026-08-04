# Operator Mutation Authorization Freshness

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-31-operator-mutation-authorization-freshness-implementation-plan.md`
- Last verified: 2026-08-04 against 48 focused tests, 361 complete GraphQL
  tests, and 1,197 complete backend tests.

## Batch Outcome

Operator-only GraphQL writes make their authorization decision from a locked,
current user row in the same transaction as the protected write. A stale
request-context user cannot retain write authority after role revocation.

## Completion Evidence

- `Accounts.lock_operator/1` requires an active database transaction, reloads
  the user with `FOR UPDATE`, returns only a current operator, and maps missing
  or non-operator rows to `{:error, :forbidden}`.
- Stale request-context operator snapshots now return the existing `FORBIDDEN`
  mutation payload without changing state for `upsertAffiliateNetwork`,
  `upsertAffiliateProgram`, `upsertAffiliateLink`, `createCoupon`,
  `moderateSpecificationCorrection`, and `updateCJProgram`.
- The shared affiliate transaction proves revocation-first blocks the real
  `upsertAffiliateProgram` operation until revocation commits, then rejects it
  without changing the program. Mutation-first proves the operation holds the
  user lock while blocked on the affiliate-program row, commits its program
  update, and only then allows revocation to finish.
- Specification-correction moderation proves the same two orders against the
  correction row: committed revocation preserves pending/proposed state, while
  mutation-first commits the rejection before the waiting revocation.
- CJ-program lifecycle mutation proves the same two orders against the program
  row: committed revocation preserves the original lifecycle state, while
  mutation-first commits the lifecycle update before the waiting revocation.
- The focused gate passes 48 tests, the complete GraphQL gate passes 361 tests,
  and the complete backend gate passes 1,197 tests. Formatting, typecheck,
  quality, queue validation with three ready rows, and diff hygiene also pass.

## Original Ready Evidence

- Session and API-token plugs load `current_user` before Absinthe execution,
  and `Authorization.require_operator/1` accepts
  `%User{is_operator: true}` from that request snapshot without a database
  recheck.
- Before implementation, six operator-only mutations relied on that snapshot
  before writing:
  `upsertAffiliateNetwork`, `upsertAffiliateProgram`, `upsertAffiliateLink`,
  `createCoupon`, `moderateSpecificationCorrection`, and `updateCJProgram`.
- Community `moderateCommunityContent` already demonstrates the required
  database contract: its transaction locks and reloads the operator row before
  locking or changing moderated content.
- Existing database concurrency support exposes backend IDs plus
  `pg_blocking_pids`, so the real affiliate, specification-correction, and
  CJ-program operations can prove both lock orders without sleeps or elapsed-
  time assertions.
- The focused Accounts/Discussions concurrency and affected GraphQL suites pass
  37 tests before implementation. They characterize existing payloads and
  domain behavior but cover revocation only for community moderation.
- A live nested-transaction probe showed that wrapping every resolver in one
  outer transaction would collapse an inner rollback to `:rollback`. The batch
  therefore added a transaction-required Accounts operator lock that each
  affected mutation invokes inside its owning transaction rather than
  introducing a generic transaction wrapper.

## Boundaries

- A revocation holding the user row first must commit before the mutation
  rechecks access; the mutation then returns its existing forbidden payload and
  performs no domain write.
- A mutation holding the user row first may complete before revocation. This is
  the other valid serialization order, not an authorization bypass.
- Acquire the operator row before affiliate, correction, or CJ-program rows so
  every protected path uses one lock order.
- Prove that the authorization lock and protected write share the owning
  transaction. For each of the three transaction families, hold its domain row
  behind a database barrier after the operation has acquired the operator row,
  then observe revocation waiting on that operation's backend.
- Exercise the actual affiliate shared transaction path, specification-
  correction moderation transaction, and CJ-program update transaction. An
  Accounts-only `lock_operator/1` race is useful unit coverage but cannot
  satisfy the batch concurrency acceptance boundary.
- Missing and non-operator database users fail as forbidden; do not expose
  account existence through mutation errors.
- Keep anonymous-versus-forbidden GraphQL payloads, validation errors, stale
  lifecycle errors, and successful mutation shapes unchanged.
- Do not extend this batch to operator-only reads, session invalidation, API
  token lifecycle, community moderation rewrites, or a general transaction
  framework.

## Internal Slices

1. Accounts-owned transaction-required operator locking plus stale-request
   denial across all six mutation surfaces.
2. One shared affiliate transaction covering network, program, link, and
   coupon writes, with revocation-first and mutation-first actual-operation
   regressions.
3. Specification-correction and CJ-program owning transactions rechecking the
   locked operator before domain rows, each with both actual-operation lock
   orders.

## Verification

- deterministic actual-operation concurrency coverage for the affiliate,
  specification-correction, and CJ-program transaction families
- stale-request-snapshot denial across all six affected GraphQL mutations
- Accounts and Discussions concurrency suites
- affiliate workflow, specification correction, and CJ-program GraphQL suites
- complete GraphQL and backend suites
- typecheck, quality, formatting, queue, and diff gates

## Blocker Rule

Stop and record the exact path if a protected write cannot share one database
transaction with the user-row authorization lock, or if preserving a current
GraphQL error contract would require a product decision.

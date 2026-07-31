# Operator Mutation Authorization Freshness

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-31-operator-mutation-authorization-freshness-implementation-plan.md`
- Last verified: 2026-07-31 against request-context construction, all
  operator-only GraphQL mutations, their context writes, and the existing
  community-moderation revocation regression.

## Target Outcome

Operator-only GraphQL writes make their authorization decision from a locked,
current user row in the same transaction as the protected write. A stale
request-context user cannot retain write authority after role revocation.

## Ready Evidence

- Session and API-token plugs load `current_user` before Absinthe execution,
  and `Authorization.require_operator/1` accepts
  `%User{is_operator: true}` from that request snapshot without a database
  recheck.
- Six operator-only mutations currently rely on that snapshot before writing:
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
  therefore adds a transaction-required Accounts operator lock and invokes it
  inside each affected mutation's owning transaction rather than introducing a
  generic transaction wrapper.

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

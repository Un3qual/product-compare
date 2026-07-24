# Community Submissions Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Discussions.Submissions` as the stable
discussion-context boundary while moving creation, owner lifecycle, reports,
and write-limit persistence into focused internal modules.

**Architecture:** The existing module retains explicit wrappers for its six
stable functions. `Creates` owns review, question, and answer creation plus
idempotency receipts; `OwnerActions` owns update and retained removal;
`Reports` owns attributable duplicate-safe reports; and `WriteLimits` owns
shared transactional UTC-hour counters.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit.

## Global Constraints

- Preserve every stable function, argument, result, changeset, atom,
  transaction, lock, rollback, and query behavior.
- Preserve idempotency digests and conflicts, ownership, moderation resets,
  accepted-answer cleanup, report deduplication, and committed-only limits.
- Keep `ProductCompare.Discussions` as the only production caller.
- Do not change schemas, migrations, limits, authorization, moderation,
  GraphQL, Relay, or frontend policy.

---

### Task 1: Shared Write-Limit Ownership

**Files:**

- Create: `lib/product_compare/discussions/submissions/write_limits.ex`
- Modify: `lib/product_compare/discussions/submissions.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:** `WriteLimits.increment!/2` preserves the current transactional
counter lock, action-specific limit, UTC-hour key, and rollback behavior.

- [ ] Run the named suite as the green baseline.
- [ ] Add delegation to the missing owner and observe the expected compilation
  failure.
- [ ] Move write-window lookup, increment, limits, and UTC-hour calculation
  into `WriteLimits`.
- [ ] Re-run the suite and confirm independent action limits and rollback
  accounting remain unchanged.
- [ ] Commit with message `refactor: isolate community write limits`.

### Task 2: Idempotent Creation Ownership

**Files:**

- Create: `lib/product_compare/discussions/submissions/creates.ex`
- Modify: `lib/product_compare/discussions/submissions.ex`
- Read: `lib/product_compare/discussions/submissions/write_limits.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:** `Creates.submit_review/4`, `ask_question/4`, and
`answer_question/4` preserve the existing public results and errors.

- [ ] Run the named suite before extraction.
- [ ] Add explicit facade wrappers and observe the expected missing-owner
  failure.
- [ ] Move changesets, digests, receipt locking, replay, conflicts, and
  published-question validation into `Creates`.
- [ ] Re-run the suite and confirm replay, conflicting payload, rate-limit,
  and answer visibility behavior remain unchanged.
- [ ] Commit with message `refactor: isolate community submissions`.

### Task 3: Owner Lifecycle Ownership

**Files:**

- Create: `lib/product_compare/discussions/submissions/owner_actions.ex`
- Modify: `lib/product_compare/discussions/submissions.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:** `OwnerActions.update/4` and `remove/3` preserve the existing
owner lifecycle contract.

- [ ] Run the named suite before extraction.
- [ ] Add wrappers and observe the expected missing-owner failure.
- [ ] Move locked content lookup, ownership, update changesets, moderation
  reset, retained removal, and accepted-answer cleanup into `OwnerActions`.
- [ ] Re-run the suite and confirm owner, non-owner, rejected, removed, and
  accepted-answer behavior remain unchanged.
- [ ] Commit with message `refactor: isolate community owner actions`.

### Task 4: Report Ownership

**Files:**

- Create: `lib/product_compare/discussions/submissions/reports.ex`
- Modify: `lib/product_compare/discussions/submissions.ex`
- Read: `lib/product_compare/discussions/submissions/write_limits.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`

**Interfaces:** `Reports.create/4` preserves the current report result and
errors.

- [ ] Run the named suite before extraction.
- [ ] Add the facade wrapper and observe the expected missing-owner failure.
- [ ] Move target lookup, attributable report creation, duplicate detection,
  unique-constraint handling, and rate limits into `Reports`.
- [ ] Re-run the suite and confirm missing, duplicate, concurrent, and
  committed-only limit behavior remain unchanged.
- [ ] Commit with message `refactor: isolate community reports`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/community-submissions-decomposition.md`

- [ ] Run the exact 25-test characterization gate.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no production or test caller bypasses the stable facade.
- [ ] Record final ownership, module sizes, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.

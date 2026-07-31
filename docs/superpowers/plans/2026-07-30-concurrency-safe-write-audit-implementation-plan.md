# Concurrency-Safe Write Audit Implementation Plan

**Goal:** Audit every first-party modifying action and eliminate confirmed
read-modify-write races without serializing unrelated work or introducing a
generic persistence framework.

**Architecture:** Classify writes by database invariant, then enforce each
invariant at the narrowest boundary that can make it atomic: a conditional
statement, conflict clause, constraint, optimistic lock, or transaction with
deterministic row locks. Tests coordinate real concurrent processes at the
critical interleaving and assert the persisted result, not implementation
details alone.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, SQL constraints and locks.

## Global Constraints

- Inspect every context action that inserts, updates, deletes, or validates
  mutable persisted state before writing.
- A read followed by a write is safe only when one SQL statement enforces the
  invariant, the read and write share a transaction with the required locks,
  or stale-write detection rejects an intervening change.
- Lock rows in deterministic order and only for the transaction that owns the
  dependent write. Do not add table locks or a repository-wide lock helper.
- Prefer database uniqueness, check constraints, conditional updates, and
  `ON CONFLICT` when they fully express the invariant.
- Preserve existing public context and GraphQL outcomes. Normalize expected
  stale/conflict results explicitly rather than leaking database exceptions.
- Characterization tests are not proof of concurrency safety. Every confirmed
  race needs a deterministic two-process regression test or a database
  constraint test that would fail under the old implementation.
- Do not change read-only query code merely because it calls `Repo.get/2`,
  `Repo.one/2`, or `Repo.all/2`.

## Task 1: Build the Complete Write-Safety Inventory

**Files:**

- Create: `docs/work/concurrency-safe-writes.md`
- Modify: first-party context modules under `lib/product_compare/**` only as
  required by confirmed findings.
- Test: focused context suites under `test/product_compare/**`.

**Interfaces:**

- Consumes: every reachable `Repo.insert`, `Repo.update`, `Repo.delete`,
  `insert_all`, `update_all`, `delete_all`, transaction, conflict clause,
  explicit lock, and optimistic-lock path.
- Produces: a reviewed inventory classifying each modifying action as
  single-statement atomic, constraint-backed, transaction-and-lock backed,
  stale-write protected, append-only, or unsafe.

- [x] Enumerate all modifying actions and trace every pre-write read or
  cross-row validation they depend on.
- [x] Record the protected invariant and the exact database mechanism for every
  safe path; do not infer safety from a surrounding function name.
- [x] Identify every unsafe path, including delete/update actions that accept
  stale structs and validation that reads related rows before a later write.
- [x] Add focused failing tests for every confirmed unsafe interleaving before
  implementing fixes.

## Task 2: Make Single-Row State Transitions Atomic

**Files:**

- Modify: confirmed single-row update/delete owners under
  `lib/product_compare/**`.
- Modify: matching schemas only when optimistic-lock or constraint metadata is
  required.
- Test: matching focused context suites.

**Interfaces:**

- Consumes: updates or deletes whose authorization, lifecycle state, version,
  timestamp, cooldown, or enabled flag can change after an initial read.
- Produces: conditional writes or locked/stale-detected transitions that cannot
  overwrite or delete a concurrent change silently.

- [x] Replace unsafe stale-struct writes with conditional statements,
  optimistic locks, or in-transaction locked reloads.
- [x] Return stable stale/not-found/conflict outcomes for zero-row writes.
- [x] Prove two concurrent transitions cannot both claim the same prior state
  or silently discard one another.

## Task 3: Make Cross-Row Validation and Derived Writes Atomic

**Files:**

- Modify: confirmed multi-row action owners under `lib/product_compare/**`.
- Modify: `priv/repo/migrations/**` only when a database constraint or index is
  the narrowest durable owner.
- Test: matching focused context and migration suites.

**Interfaces:**

- Consumes: actions that validate related ownership, current selections,
  uniqueness, balances/counts, parent-child state, or provider identity before
  writing another row.
- Produces: one transaction with deterministic locks or one constraint-backed
  statement for each dependent invariant.

- [x] Lock all mutable rows used to authorize or validate the dependent write,
  in stable identifier order.
- [x] Replace check-then-insert/update sequences with conflict clauses or
  constraints where possible.
- [x] Keep external calls and non-database computation outside locked
  transactions.
- [x] Prove concurrent valid-looking requests cannot commit an invalid combined
  state.

## Task 4: Verify the Repository-Wide Invariant

**Files:**

- Modify: `docs/work/concurrency-safe-writes.md`
- Modify: `docs/work/index.md`

**Interfaces:**

- Produces: a complete evidence table with no unclassified modifying action and
  no confirmed unsafe read-modify-write path.

- [x] Rerun the write inventory and confirm every modifying action is
  classified with an explicit atomicity mechanism.
- [x] Run every new concurrency regression repeatedly with randomized seeds.
- [x] Run affected context and GraphQL suites, the full backend test suite,
  `mix typecheck`, `mix quality`, `mix work_queue.validate`, and
  `git diff --check`.
- [x] Record exact verification evidence and commit reviewable milestones.

Exit condition: every first-party modifying action has an evidence-backed
atomicity classification, every confirmed race has a database-owned fix and
deterministic regression, and no unsafe read-modify-write path remains.

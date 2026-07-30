# Concurrency-Safe Writes

## Snapshot

- Status: ready
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-concurrency-safe-write-audit-implementation-plan.md`
- Last verified: 2026-07-30 against the current repository write surface.

## Target Outcome

Every first-party modifying action has an explicit atomicity mechanism, and
every confirmed read-modify-write race is fixed at the database boundary with
a deterministic concurrency regression.

## Current Evidence

- The current application has 215 direct repository read call sites across
  first-party schema and context code; only the reads that inform a later write
  are in scope.
- Existing safe patterns include conflict clauses, uniqueness and check
  constraints, transactions with `FOR UPDATE`, stale-write normalization, and
  optimistic locking.
- Existing concurrency regressions cover selected claims, CJ lifecycle
  changes, operator bootstrap, alert evaluation, source provider claiming, and
  community write controls. The audit must verify these mechanisms rather than
  assuming all neighboring actions are equally protected.

## Boundaries

- Audit all first-party modifying actions, not only files containing an
  explicit `Repo.update/2`.
- Do not add blanket locks, table locks, or a generic transaction framework.
- Do not count read-only queries as findings.
- Use deterministic process coordination in concurrency tests; avoid
  sleep-based races.
- Keep external calls and expensive pure computation outside locked
  transactions.

## Next Action

Generate the modifying-action inventory, trace every pre-write read and
cross-row validation, and add a failing interleaving test for each confirmed
unsafe path.

## Verification

- focused concurrency regressions for every confirmed finding
- affected context, schema, migration, and GraphQL suites
- repeated randomized-seed runs
- `mix test`
- `mix typecheck`
- `mix quality`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and record a blocker if an invariant depends on an external system that
cannot participate in the database transaction, or if the correct conflict
semantics would change a public product decision that the user has not made.

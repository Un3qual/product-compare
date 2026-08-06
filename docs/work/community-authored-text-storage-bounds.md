# Community Authored Text Storage Bounds

## Snapshot

- Status: done
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-community-authored-text-storage-bounds-design.md`
- Last verified: 2026-08-06. The approved canonical unit is Unicode code
  points.

## Batch Outcome

PostgreSQL retains the established Unicode code-point bounds of
community-authored thread, post, review, and report text even when writes
bypass changesets. The owning changesets count code points and map every named
database check; existing community lifecycle behavior remains intact.

## Completion Evidence

- Task 2's focused boundary command passed 67 tests with zero failures. Direct
  writes rejected the six named PostgreSQL checks, accepted code-point
  boundaries inserted successfully, and application writes retained their
  existing validation messages.
- The forward migration adds exactly these checks: product-thread title and
  body, thread-post body, product-review title and body, and community-report
  reason. All six owning `validate_length/3` calls now use
  `count: :codepoints`; the existing `community_reports.reason` `varchar(500)`
  maximum remains unchanged.
- Serial lifecycle verification passed 189 tests with zero failures:
  content lifecycle (5), thread-post validation (9), community trust (30),
  GraphQL community content (19), node query (28), node Dataloader batching
  (5), Dataloader batching (42), repository seeds (50), and GraphQL
  development seeds (1).
- Fresh repository gates passed: `mix test` (1,248 tests, zero failures),
  `mix typecheck`, `mix quality`, `mix format --check-formatted`, and
  `mix work_queue.validate` (five ready rows). `git diff --check` passed before
  this evidence update and is rerun after it before commit.

## Boundaries

- Preserve GraphQL payloads, moderation, ownership, write limits,
  idempotency, and seed behavior.
- Keep whitespace handling, Markdown policy, nullability, required fields, and
  the report column type unchanged.
- Keep stored Unicode values unchanged; do not normalize, truncate, or rewrite
  authored text.
- Add no moderation-note, generic text-length, or frontend validation policy.
- Use a forward migration; never reset the development database.

## Internal Slices

1. Failing direct- and application-write code-point boundary characterization.
2. Six explicit code-point changeset validations, named forward checks, and
   owning constraint mappings.
3. Community lifecycle parity and complete backend verification.

## Verification Run

- `mix test test/product_compare/discussions/content_lifecycle_test.exs` — 5
  tests, zero failures.
- `mix test test/product_compare/discussions/thread_post_validation_test.exs`
  — 9 tests, zero failures.
- `mix test test/product_compare/discussions/community_trust_test.exs` — 30
  tests, zero failures.
- `mix test test/product_compare_web/graphql/community_content_test.exs` — 19
  tests, zero failures.
- `mix test test/product_compare_web/graphql/node_query_test.exs` — 28 tests,
  zero failures.
- `mix test test/product_compare_web/graphql/node_dataloader_batching_test.exs`
  — 5 tests, zero failures.
- `mix test test/product_compare_web/graphql/dataloader_batching_test.exs` —
  42 tests, zero failures.
- `mix test test/product_compare/repo/seeds_test.exs` — 50 tests, zero
  failures.
- `mix test test/product_compare_web/graphql/development_seeds_test.exs` — 1
  test, zero failures.
- `mix test` — 1,248 tests, zero failures; `mix typecheck`, `mix quality`,
  `mix format --check-formatted`, and `mix work_queue.validate` passed.
- `git diff --check` passed before the evidence update and is rerun after it
  before commit.

## Blocker Rule

Stop and report the exact table, column, and code-point length if an existing
community row violates an established boundary. Do not truncate, rewrite, or
delete authored content to make the migration pass.

# Community Authored Text Storage Bounds

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-community-authored-text-storage-bounds-design.md`
- Last verified: 2026-08-05 against the live PostgreSQL test catalog, current
  community rows, four owning changesets, and 53 focused lifecycle tests.

## Target Outcome

PostgreSQL retains the established character bounds of community-authored
thread, post, review, and report text even when writes bypass changesets.

## Ready Evidence

- Product-thread titles are limited to 1 through 200 characters, optional
  thread bodies to 5,000, post bodies to 5,000, optional review titles to 120,
  optional review bodies to 5,000, and report reasons to at least 3 by their
  owning changesets.
- The existing `community_reports.reason` `varchar(500)` type already enforces
  the established report-reason maximum.
- The live catalog contains none of the six missing checks across
  `product_threads`, `thread_posts`, `product_reviews`, and
  `community_reports`.
- The live data preflight reports zero rows outside the six boundaries.
- The focused community baseline passes 53 tests with no failures.

## Boundaries

- Preserve GraphQL payloads, moderation, ownership, write limits,
  idempotency, and seed behavior.
- Keep whitespace handling, Markdown policy, nullability, required fields, and
  the report column type unchanged.
- Add no moderation-note, generic text-length, or frontend validation policy.
- Use a forward migration; never reset the development database.

## Internal Slices

1. Failing direct-write authored-text boundary characterization.
2. Six named forward checks and owning changeset mappings.
3. Community lifecycle parity and complete backend verification.

## Verification

- focused community-authored-text direct-write suite
- content lifecycle, thread-post validation, community trust, GraphQL
  community content, node-query, Dataloader batching, and deterministic seed
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and report the exact table, column, and character length if an existing
community row violates an established boundary. Do not truncate, rewrite, or
delete authored content to make the migration pass.

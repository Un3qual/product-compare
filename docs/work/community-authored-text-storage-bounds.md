# Community Authored Text Storage Bounds

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-community-authored-text-storage-bounds-design.md`
- Last verified: 2026-08-05 against the live PostgreSQL test catalog, current
  community rows, all six owning `validate_length/3` calls, and 53 focused
  lifecycle tests; the approved canonical unit is Unicode code points.

## Target Outcome

PostgreSQL retains the established Unicode code-point bounds of community-authored
thread, post, review, and report text even when writes bypass changesets.

## Ready Evidence

- Product-thread titles are limited to 1 through 200 Unicode code points,
  optional thread bodies to 5,000, post bodies to 5,000, optional review titles
  to 120, optional review bodies to 5,000, and report reasons to 3 through 500.
- The current six owning changeset validations rely on Ecto's default grapheme
  count. Batch 24 explicitly changes each to `count: :codepoints` before or
  with the matching database constraints.
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
- Keep stored Unicode values unchanged; do not normalize, truncate, or rewrite
  authored text.
- Add no moderation-note, generic text-length, or frontend validation policy.
- Use a forward migration; never reset the development database.

## Internal Slices

1. Failing direct- and application-write code-point boundary characterization.
2. Six explicit code-point changeset validations, named forward checks, and
   owning constraint mappings.
3. Community lifecycle parity and complete backend verification.

## Verification

- focused community-authored-text direct- and application-write suites with
  decomposed combining text and emoji ZWJ boundaries
- content lifecycle, thread-post validation, community trust, GraphQL
  community content, node-query, Dataloader batching, and deterministic seed
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and report the exact table, column, and code-point length if an existing
community row violates an established boundary. Do not truncate, rewrite, or
delete authored content to make the migration pass.

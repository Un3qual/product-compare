# Community Authored Text Storage Bounds Design

## Context

Community changesets already define six persistence boundaries for authored
text:

- product-thread titles contain 1 through 200 characters;
- optional product-thread bodies contain at most 5,000 characters;
- thread-post bodies contain at most 5,000 characters;
- optional product-review titles contain at most 120 characters;
- optional product-review bodies contain at most 5,000 characters; and
- report reasons contain at least 3 characters.

PostgreSQL currently enforces none of those checks. The existing
`community_reports.reason` column is `varchar(500)`, so its established
500-character maximum is already protected by the column type. A direct write
can still persist all six missing invalid shapes while bypassing the owning
changesets.

The live test catalog contains no authored-text checks on `product_threads`,
`thread_posts`, `product_reviews`, or `community_reports`. A data preflight
found zero existing violations, and the focused community baseline passes 53
tests.

## Approaches Considered

### 1. One forward migration for the shared authored-text invariant

Add named checks for the six missing boundaries and map them through the four
owning schemas. This is the selected approach because the fields share one
community-submission acceptance boundary and should remain consistent across
direct SQL, context calls, and GraphQL mutations.

### 2. Separate one row per table

Each table could receive its own migration and queue row. That would turn one
shared content-integrity invariant into review and queue micro-batches without
creating independent product outcomes.

### 3. Rely on changesets and the existing report column type

This would preserve current GraphQL behavior but leave direct writers able to
store oversized thread, post, and review content or undersized report reasons.
The database is the correct final boundary for these established limits.

## Design

Create one forward migration with these named checks:

- `product_threads_title_length_check`:
  `char_length(title) BETWEEN 1 AND 200`;
- `product_threads_body_length_check`:
  `body_md IS NULL OR char_length(body_md) <= 5000`;
- `thread_posts_body_length_check`:
  `char_length(body_md) <= 5000`;
- `product_reviews_title_length_check`:
  `title IS NULL OR char_length(title) <= 120`;
- `product_reviews_body_length_check`:
  `body_md IS NULL OR char_length(body_md) <= 5000`; and
- `community_reports_reason_length_check`:
  `char_length(reason) >= 3`.

The owning `ProductThread`, `ThreadPost`, `ProductReview`, and
`CommunityReport` changesets map their named checks so application writes keep
field-specific errors if a database race or changeset bypass reaches the
constraint.

## Test Contract

A focused direct-write suite uses valid user and product parents and proves
that PostgreSQL rejects every value one character outside the six missing
boundaries with the exact constraint name. It also proves the valid boundaries:
one- and 200-character thread titles; `NULL` and 5,000-character optional
bodies; a 5,000-character required post body; `NULL` and 120-character review
titles; and a 3-character report reason. The existing `varchar(500)` report
maximum remains covered by current schema and lifecycle behavior rather than a
redundant check.

Community lifecycle, validation, GraphQL mutation, and deterministic seed tests
prove behavior remains unchanged.

## Boundaries

- Preserve GraphQL payloads, moderation, ownership, write limits,
  idempotency, and seed behavior.
- Do not change whitespace handling, Markdown policy, nullability, or required
  fields.
- Do not add moderation-note, generic text-length, or frontend validation
  policy.
- Do not replace the existing `community_reports.reason` column type.
- Use a forward migration and never reset the development database.

## Failure Handling

If existing rows violate an established boundary, stop and report the exact
table, column, and character length. Do not truncate, rewrite, or delete
community content to make the migration pass.

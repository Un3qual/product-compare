# Reviews And Product Q&A Implementation Plan

**Goal:** Turn the existing unused discussion tables into trustworthy product
reviews and answerable product questions without exposing account identity or
allowing unmoderated content to affect shopper-facing summaries.

**Design:**
`docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`

## Safety Contract

- Reuse `product_reviews`, `product_threads`, and `thread_posts`; add explicit
  question/content moderation state, accepted-answer state, report records, and
  audit-safe moderator decisions rather than creating a parallel comment model.
- Review, question, answer, edit, delete, and report writes require an
  authenticated user. Ownership and operator authorization are resolved
  server-side; public reads never expose email or internal user IDs.
- Public lists and rating aggregates include only published content. Pending,
  hidden, rejected, deleted, and reported content fail closed from public
  summaries until an operator publishes or restores it.
- Purchase verification is true only when durable user-to-purchase evidence
  exists. Merely selecting a merchant offer for a review is not verification;
  the current offer-association inference must be removed.
- One user retains at most one review per product. Questions support bounded
  answers, one owner/operator-selected accepted answer, reporting, and
  replay-safe operator moderation.
- User-authored Markdown is rendered as plain text in the first milestone; no
  raw HTML is accepted or injected.

## Owned Paths

- discussion migrations, schemas, context, resolver, and tests
- `lib/product_compare_web/schema.ex`
- product detail GraphQL query, presentation, and tests
- `assets/schema.graphql` and generated Relay artifacts
- `docs/work/product-trust-and-discovery.md`

## Verification

- Context and GraphQL tests for ownership, one-review constraint, published-only
  reads/aggregates, accepted answers, reports, moderation replay, privacy, and
  honest purchase verification.
- Frontend tests for review summary, review form, questions/answers, empty and
  moderation-pending states, and safe plain-text rendering.
- Existing discussion regressions, Relay, TypeScript, production builds,
  backend gates, queue validation, and diff hygiene.

Merchant detail reads and pages are next after community trust is green.

## Completion Evidence

- Community trust, GraphQL, and prior discussion regression slice: 18 tests
  passed.
- Product community panel and product-detail characterization: 51 tests passed.
- Relay: 41 reader, 40 normalization, and 40 operation documents compiled;
  TypeScript passed.
- Purchase verification inference was removed and existing inferred values are
  cleared by migration.
- Completed 2026-07-13; merchant detail reads and pages promoted next.

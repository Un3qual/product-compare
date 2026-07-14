# Community And Merchant Trust Design

## Goal

Expose the existing reviews and threaded discussion foundation as useful,
abuse-resistant product Q&A, and give every merchant a detail page that
explains its current catalog and data quality.

## Reviews

One authenticated user may review a product once and may later edit or delete
their review. Ratings remain 1-5. Verified-purchase status is computed only
from first-party conversion evidence linked to the selected merchant product;
the client cannot set it. Public summaries expose count, average, distribution,
verified count, and paginated visible reviews.

Reviews gain moderation state, report count, and optional moderation reason.
Hidden or pending content is excluded from public aggregates. Markdown is
rendered through the repository's safe formatting boundary; raw HTML is never
trusted.

## Product Questions And Answers

`ProductThread` represents a question and its first-level `ThreadPost` records
answers. One reply level supports clarifications without creating an unbounded
tree. The question author may mark one visible answer accepted; operators can
override abusive or incorrect state. Pages sort unanswered questions first or
by recent activity, with stable cursor pagination.

Authenticated writes enforce ownership, body/title bounds, per-user rate
limits, and duplicate submission idempotency. Any signed-in user can report
content once. Operator-only moderation can hide, restore, or remove content
while retaining an audit record.

## Merchant Detail Pages

Merchants receive stable slugs and a public `/merchants/:slug` route. The page
contains name, canonical domain, current eligible offer count, product count,
freshness summary, price/currency coverage, active coupons, and paginated
offers/products. It does not imply merchant endorsement, fulfillment quality,
or trust scores without sourced evidence.

Merchant offer links continue through the existing tracked commerce path.
Potentially unsafe external URLs are normalized and validated server-side.
Empty, stale, or inactive merchants remain out of the public index until they
again meet quality thresholds.

## GraphQL And UI

The schema adds public connections for review summaries, visible reviews,
questions, answers, and merchant detail reads. Viewer mutations create/update/
delete owned content, accept an answer, and report content. Operator mutations
moderate content. Product detail gets separate Reviews and Q&A sections;
merchant directory cards link to detail pages.

## Verification

Tests cover ownership, one-review uniqueness, verified-purchase derivation,
aggregate exclusion of hidden content, accepted-answer rules, reply depth,
rate limits, report idempotency, moderator authorization, Markdown safety,
merchant slug stability, freshness aggregates, tracked URLs, pagination, and
empty/stale page suppression.


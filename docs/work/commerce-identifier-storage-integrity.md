# Commerce Identifier Storage Integrity

## Snapshot

- Status: needs_decision
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md`
- Last verified: 2026-08-06 during final branch review against the owning
  schemas, proposed PostgreSQL predicates, and live PostgreSQL 18 behavior.

## Decision Required

Choose exact end-of-string semantics before replanning storage checks. The
current Merchant PCRE `$` accepts a slug with one trailing newline, while the
proposed PostgreSQL POSIX predicate rejects it.

## Decision Evidence

- `Merchant.changeset/2` requires
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` for `merchants.slug`.
- `AffiliateNetwork.changeset/2` normalizes `affiliate_networks.code`, then
  requires `^[a-z0-9]+(?:_[a-z0-9]+)*$`.
- Both columns are non-null and unique, but neither table has a matching
  PostgreSQL format check.
- Plain Elixir confirms `Merchant.changeset/2` accepts `"north-main\n"`
  because its PCRE uses `$`; PostgreSQL 18 rejects the same value under the
  proposed `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'` check.
- Live preflight returned zero rows for both POSIX inverse predicates:
  `slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'` and
  `code !~ '^[a-z0-9]+(_[a-z0-9]+)*$'`.
- The focused 4-test merchant-detail and 10-test affiliate-workflow baseline
  passed with no failures, preserving slug lookup/stability and network upsert.

## Boundaries

- Preserve merchant lookup, slug stability, network-code normalization, and
  affiliate upsert behavior.
- Do not describe the proposed merchant predicate as equivalent until the
  application and database end anchors are explicitly aligned.
- Add no length limit, Unicode rule, URL rule, new normalization, generic
  helper, or storage-policy framework.
- Stop if preflight returns a malformed identifier; do not rewrite or delete
  commerce rows as part of this batch.

## Replanning Requirements

1. Decide whether canonical merchant slugs reject a trailing newline.
2. Align application and PostgreSQL end-of-string behavior under that decision.
3. Revalidate whether merchant slugs and affiliate-network codes still form one
   coherent acceptance boundary before creating a replacement plan.
4. Use a fresh migration version later than the current maximum; the draft's
   `20260805060000` version sorts behind migrations already shipped on `main`.

## Prior Validation

- `test/product_compare/repo/commerce_identifier_storage_integrity_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/affiliate/affiliate_workflows_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Do not execute the current plan. A product decision must first align exact
merchant end-of-string semantics; then rerun stored-row preflight and focused
baselines without rewriting commerce data.

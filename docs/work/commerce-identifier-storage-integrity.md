# Commerce Identifier Storage Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md`
- Last verified: 2026-08-05 against the owning Pricing and Affiliate schemas,
  all relevant migrations, and the live PostgreSQL test-database preflight.

## Target Outcome

PostgreSQL rejects malformed merchant slugs and affiliate-network codes even
when a commerce write bypasses their owning changesets.

## Ready Evidence

- `Merchant.changeset/2` requires
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` for `merchants.slug`.
- `AffiliateNetwork.changeset/2` normalizes `affiliate_networks.code`, then
  requires `^[a-z0-9]+(?:_[a-z0-9]+)*$`.
- Both columns are non-null and unique, but neither table has a matching
  PostgreSQL format check.
- Live preflight returned zero rows for both POSIX inverse predicates:
  `slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'` and
  `code !~ '^[a-z0-9]+(_[a-z0-9]+)*$'`.
- The focused 4-test merchant-detail and 10-test affiliate-workflow baseline
  passed with no failures, preserving slug lookup/stability and network upsert.

## Boundaries

- Preserve merchant lookup, slug stability, network-code normalization, and
  affiliate upsert behavior.
- Mirror only the existing formats with the exact POSIX predicates.
- Add no length limit, Unicode rule, URL rule, new normalization, generic
  helper, or storage-policy framework.
- Stop if preflight returns a malformed identifier; do not rewrite or delete
  commerce rows as part of this batch.

## Internal Slices

1. Failing direct-write format characterization and accepted controls.
2. Two named forward checks plus owning changeset mappings.
3. Merchant lookup and affiliate-upsert parity plus repository-gate evidence.

## Verification

- `test/product_compare/repo/commerce_identifier_storage_integrity_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/affiliate/affiliate_workflows_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if either target preflight returns a row. Record its table, `id`, and
stored identifier for a coordinator data decision; do not normalize, delete,
or otherwise mutate stored commerce data to make the migration pass.

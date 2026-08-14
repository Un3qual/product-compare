# Realistic Development Data

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-14-scalable-realistic-development-data-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-14 against the approved scalable seed design, existing
  domain seed modules, immutable ownership/rerun tests, current
  five-product/two-merchant dataset, and shipped shopper/operator GraphQL
  surfaces.

## Target Outcome

The offline deterministic seed system offers bounded and full profiles with
exactly 300 products, 70 merchants, realistic marketplace, account, community,
attribution, and operator depth while preserving unrelated local rows and
prohibiting external effects.

## Owned Paths

- `priv/repo/seeds/**`, seed orchestration only when required, focused seed and
  development-GraphQL tests, optional checked-in development media, and this
  lane document.

## Internal Slices

1. Dataset contract characterization.
2. Catalog/specification expansion.
3. Merchant/offer/coupon/history expansion.
4. Account/community/correction/comparison journeys.
5. Attribution/operator journeys and guide.
6. Two-run and full verification.

## Verification

Focused seed/GraphQL/domain suites, two deterministic development reruns,
unrelated-row and zero-external-effect proofs, representative page inspection,
full frontend/backend gates, queue validation, and diff checks.

## Blocker Rule

Stop before adding a production-callable seed bypass, provider/network/job/mail
call, mutable lookalike ownership, or changes outside seed/test/local-media
paths.

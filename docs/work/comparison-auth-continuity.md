# Comparison And Authentication Continuity

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-comparison-auth-continuity-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 against current comparison, account, auth, viewer,
  GraphQL session mutation, and generated Relay contracts.

## Target Outcome

Comparison uses a wide toolbar, matrix-adjacent modes, and curated product
summaries; guest watch/save actions use a modal and restore a safe minimal draft
after GraphQL authentication without automatic submission.

## Owned Paths

- Compare, auth, account alert/API-token capability files and focused tests
  named by the plan.
- Auth and compare Playwright specs and snapshots.
- This lane document.

## Internal Slices

1. Layout and guest-intent characterization.
2. Versioned pending-intent/modal boundary.
3. Login/register restoration for review.
4. Comparison toolbar, modes, and summaries.
5. Compare/account/auth organization and generated types.
6. Browser and full verification.

## Verification

Focused comparison/auth/account suites, deterministic browser/axe/visual checks
at three widths, `cd assets && pnpm run check`, backend full gates, queue
validation, and diff checks.

## Blocker Rule

Stop before editing root/router/head infrastructure, product/catalog/offer
composition outside the declared watch integration, operator routes, backend
auth schema, or seeds. Never widen pending intents to arbitrary forms.

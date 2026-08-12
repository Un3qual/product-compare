# Product Experience Foundations

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-frontend-seo-foundations-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 against the current root router, SSR entries,
  metadata boundary, sitemap controller, and commerce redirect controller.

## Target Outcome

Unhead and Saxy own head/XML encoding, frontend root files have explicit SSR and
routing responsibilities, and commerce redirect actions describe their
unchanged behavior.

## Owned Paths

- Frontend entrypoints, router, new `frontend/head`, `frontend/ssr`, and
  `routing` modules, root metadata/navigation consumers, date presentation and
  focused tests named by the plan.
- SEO controller/XML encoder, commerce redirect controller/router actions, and
  focused backend tests named by the plan.
- Dependency manifests/locks required for Unhead and Saxy.
- `assets/tests/e2e/product-experience-foundations.spec.ts` and snapshots.
- This lane document.

## Internal Slices

1. Metadata/XML/date/redirect characterization.
2. Unhead SSR and hydration.
3. Saxy sitemap encoding.
4. Router, SSR, and root ownership.
5. Relative dates and redirect naming.
6. Browser and full verification.

## Verification

Focused frontend/backend suites, deterministic browser/axe/visual checks at
three widths, `cd assets && pnpm run check`, backend full gates,
`mix work_queue.validate`, and `git diff --check`.

## Blocker Rule

Stop if a required change enters product, compare, auth-continuity, operator,
or seed capability files owned by another ready row. Shared date consumers may
only adopt the new public component; their route composition remains untouched.

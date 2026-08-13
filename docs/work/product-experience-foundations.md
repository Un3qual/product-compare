# Product Experience Foundations

## Snapshot

- Status: completed
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-frontend-seo-foundations-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 against the current root router, SSR entries,
  metadata boundary, sitemap controller, and commerce redirect controller.
- Completed: 2026-08-12 on the current detached worktree commit stack.

## Target Outcome

Unhead and Saxy own head/XML encoding, frontend root files have explicit SSR and
routing responsibilities, and commerce redirect actions describe their
unchanged behavior.

## Owned Paths

- Frontend entrypoints, router, new `frontend/head`, `frontend/ssr`, and
  `routing` modules, root metadata/navigation consumers, `routes/seo.ts`, date
  presentation, and focused tests named by the plan.
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

## Completion Evidence

- Unhead now owns one request-scoped SSR head and one client head; route metadata
  is typed data, dynamic JSON-LD is safely serialized, and the manual metadata
  data module is gone (`fdb6f07c`).
- Saxy now encodes sitemap indexes and URL sets from XML elements with semantic
  round-trip coverage; the controller no longer concatenates or escapes XML
  (`039a3c9c`).
- Shopper, account, and operator registries plus SSR request, stream, and
  response helpers have explicit ownership. Root loader state uses the nullable
  Relay descriptor directly, and the generic destination data file is gone
  (`b6648a57`).
- Commerce actions now state whether they redirect an existing click or create
  and track a merchant-product click while preserving both public URLs
  (`339f1a1`).
- The closeout adds an accessible hydration fallback, deterministic responsive
  metadata/auth/operator browser coverage, axe checks at all three widths, and
  eager Base UI prebundling so lazy route discovery cannot invalidate Vite's
  optimized chunks.
- `mix ci` passed: queue validation, formatting, compilation with warnings as
  errors, Credo, ExDNA at its 3/3 budget, Reach, Dialyzer, 1,483 backend tests,
  86.81% coverage, Relay validation, TypeScript, lint, formatting, 1,541 frontend
  tests, client/SSR builds, StyleX mangling, and the 222,840-byte gzip bundle
  contract. The focused Playwright suite passed five tests, including axe and
  overflow checks at 1440×1000, 900×1100, and 390×844.

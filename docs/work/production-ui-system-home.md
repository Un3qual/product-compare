# Production UI System Spine And Home

## Snapshot

- Status: ready
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-system-home-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`
- Last verified: 2026-08-10 against the live router, GraphQL schema, context boundaries, frontend package scripts, and complete route behavior inventory.

## Target Outcome

ProductCompare has one stable production visual spine and a useful index route with ranked search, category shortcuts, a bounded six-row product ledger, URL-backed comparison continuity, and isolated new, trending, and owner-private relevant deals. The root viewer contract, SSR hydration, existing route behavior, privacy, query budgets, accessibility, responsive hierarchy, bundle budget, and plain-language boundary remain intact.

## Owned Paths

- Shared frontend package, router, root navigation, layout, feedback, primitive, theme, font, brand, comparison-continuity, and product-ledger paths named by the plan.
- New `assets/src/routes/home/**`, focused home/root/UI tests, generated Home Relay artifacts, and the home Playwright spec/snapshots.
- Focused Catalog, Specs, Pricing, Alerts, Commerce Attribution, GraphQL home schema/resolver, and tests named by the plan.
- `docs/work/production-ui-system-home.md`.

## Internal Slices

1. Exact set-based workspace, price, activity, watch, and saved-comparison read contracts.
2. Typed GraphQL workspace/deal operations with owner privacy and fixed query budgets.
3. Warm visual tokens, local fonts, responsive navigation, layouts, primitives, and restrained motion.
4. Index-owned workbench with essential workspace and optional fault-isolated deals.
5. Desktop/tablet/mobile browser, accessibility, reduced-motion, visual, bundle, and production verification.

## Verified Preconditions

- The written design and complete functionality matrix are approved.
- The current root loader contains viewer/session data only and the index route has no separate data loader.
- Catalog, SEO, Specs, Pricing, Alerts, saved comparisons, and Commerce Attribution already own the source facts required by the approved read contracts.
- The current frontend uses React Router loaders/SSR, Relay, StyleX, local Radix wrappers, Vitest, and Playwright.
- The four successor cohorts have complete plans but depend on this stable shared spine and are not yet dispatchable.

## Verification

- Focused RED/GREEN domain boundary and GraphQL semantic/privacy/query-budget suites named by the plan.
- Focused home, root, router, UI, URL, SSR, degraded-state, and responsive unit tests.
- Deterministic Playwright journeys, axe scans, reduced motion, and inspected snapshots at 1440×1000, 900×1100, and 390×844.
- `cd assets && pnpm run check`.
- Focused backend tests, `mix typecheck`, `mix quality`, and `mix format --check-formatted`.
- `mix work_queue.validate` and `git diff --check`.

## Blocker Rule

Stop if exact deal semantics cannot remain set-based, viewer facts can cross an ownership boundary, a font cannot fit the existing bundle budget, a shared component requires route-kind flags, or owned paths conflict with active work. Record the exact query, privacy, bundle, component, or path evidence; do not weaken product policy or widen later cohort ownership.

## Completion

Complete every feature-parity ledger row, record observed tests and screenshots, then close this row and promote all four path-disjoint successor cohorts together only after the shared owners are stable.

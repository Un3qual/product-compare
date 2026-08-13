# Comparison And Authentication Continuity

## Snapshot

- Status: complete
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-comparison-auth-continuity-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-13 against current comparison, account, auth, viewer,
  GraphQL session mutation, generated Relay contracts, browser behavior, and
  the complete frontend and backend gates.

## Batch Outcome

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

- Focused comparison/auth/account coverage passed: 46 files and 608 tests.
- `cd assets && pnpm run check` passed Relay compilation, TypeScript, lint,
  formatting, 118 files and 1,502 tests, client and SSR builds, StyleX mangle,
  and the 300 kB initial-JavaScript bundle budget.
- Playwright passed 14 auth and comparison-return scenarios, including axe,
  reduced-motion, and viewport-overflow checks at desktop, tablet, and mobile
  widths.
- `mix format --check-formatted && mix typecheck && mix quality && mix test &&
  mix work_queue.validate` passed with 1,489 backend tests, zero failures, and
  three ready queue rows.
- The type-provenance audit left `unknown` only at transport, route, session,
  and custom-scalar boundaries; remaining input and payload aliases come from
  generated Relay types or explicit domain and pagination projections.

## Delivered

- Guest price-watch and comparison-save intents use an exact, versioned,
  15-minute `sessionStorage` schema and accept only safe relative return paths.
- Login and registration restore pending work for review without automatically
  issuing mutations; submission remains an explicit shopper action.
- Comparison now uses a full-width action toolbar, curated product summaries,
  matrix-adjacent modes, and an accessible mobile matrix scroller.
- Compare, alert, and API-token code is organized by capability lifecycle while
  retaining generated GraphQL input and payload types at the network boundary.

## Blocker Rule

Stop before editing root/router/head infrastructure, product/catalog/offer
composition outside the declared watch integration, operator routes, backend
auth schema, or seeds. Never widen pending intents to arbitrary forms.

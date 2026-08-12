# Product Decision Hierarchy Implementation Plan

> Execute directly under the user's standing approval. Use test-first behavior
> changes and commit at verified milestone boundaries.

**Goal:** Replace record-like shopper UI with a clear product and offer decision
hierarchy while preserving all behavior and data.

**Architecture:** Keep the existing route data and shared `ProductLedger` API.
Change only the component composition and StyleX layout. Render the product
offer snapshot as a primary value plus supporting context from the existing
`ProductOfferSnapshot` model.

**Stack:** React 19, Relay, Base UI primitives, StyleX, Vitest/Testing Library,
Playwright.

## Task 1: Lock the desired hierarchy with failing tests

**Files:**

- Modify: `assets/test/ui/production-spine.test.tsx`
- Modify: `assets/test/routes/home/home.route.test.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `assets/tests/e2e/production-ui-home-visual.ts`

1. Assert that product highlights belong to the product summary and the offer,
   price context, and freshness belong to one market snapshot.
2. Assert that the six-field homepage heading strip no longer renders.
3. Assert that the offer snapshot exposes one primary best-offer value and a
   concise coverage summary.
4. Run the focused unit tests and confirm failures are caused by the existing
   parameter-dump composition.

## Task 2: Implement the homepage decision row

**Files:**

- Modify: `assets/src/ui/components/products/ProductLedger.tsx`
- Modify: `assets/src/routes/home/HomeProductLedger.tsx`

1. Compose identity and highlights into one summary region.
2. Compose offer, price context, and freshness into one market region.
3. Remove the desktop schema heading strip.
4. Keep price context and freshness in the mobile disclosure without
   duplicating highlights.
5. Run the focused component and home-route tests until green.

## Task 3: Implement the offer decision snapshot

**Files:**

- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`

1. Promote the lowest visible offer to the primary value.
2. Turn offer count, coupon availability, and missing-price count into concise
   supporting context.
3. Preserve the region heading and all truthful fallback states.
4. Run focused product-detail tests until green.

## Task 4: Refine API-token record hierarchy

**Files:**

- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`

1. Group the token label and status as the record header.
2. Present the token prefix as the primary technical identifier.
3. Group created, expiry, and last-use dates as secondary lifecycle context.
4. Preserve definition-list semantics, status tones, and all token actions.
5. Run the focused API-token route tests until green.

## Task 5: Verify responsive presentation

**Files:**

- Modify: `assets/tests/e2e/production-ui-home-visual.ts`
- Update only after inspection: `assets/tests/e2e/production-ui-home.spec.ts-snapshots/*`

1. Run the production UI Playwright suite without snapshot updates to surface
   intentional visual differences.
2. Inspect desktop, tablet, and mobile screenshots.
3. Fix hierarchy, wrapping, target size, or overflow issues found in inspection.
4. Update snapshots, rerun without update mode, and confirm accessibility and
   interaction assertions remain green.

## Task 6: Complete production verification and commit

1. Run formatter on changed frontend files.
2. Run `pnpm run check` from `assets/`.
3. Review the final diff for accidental feature loss, helper indirection, and
   unrelated styling changes.
4. Commit the verified UI pass.

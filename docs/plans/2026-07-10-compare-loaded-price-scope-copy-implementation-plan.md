# Compare Loaded-Price Scope Copy Implementation Plan

**Status:** complete

**Goal:** Make the relative-price signal explicit that it compares only the
offers already loaded for the selected products.

**Architecture:** Keep the existing comparison and decimal-string logic
unchanged. Add concise explanatory copy beside the decision summary so shoppers
do not mistake a bounded loaded-offer signal for a market-wide price claim.

## Global Constraints

- Do not add queries, pagination, market-wide claims, or new price arithmetic.
- Preserve mixed-currency, missing-price, and malformed-price safety behavior.
- Keep the copy useful when some selected products have unavailable offer data.

## Owned Paths

- `assets/src/routes/compare/DecisionSummary.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

## Batches

- [ ] Add RED coverage for a visible loaded-offer scope disclosure.
- [ ] Add the disclosure without changing decision-summary calculations.
- [ ] Run focused compare tests, TypeScript, and diff checks; record evidence.
- [ ] Commit code, tests, and lane evidence together.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "relative loaded price|loaded offers"`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The compare decision summary clearly scopes its relative-price signal to
already-loaded offers while retaining all existing safety behavior.

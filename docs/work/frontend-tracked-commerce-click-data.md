# Frontend Tracked-Commerce Click Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 58 passing
  tracked-commerce data and offer-discovery characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Tracked-Commerce Click Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Completed action: extracted normal click qualification, encoded first-party
  tracking href construction, and exact API-origin redirect resolution into
  `tracked-commerce-click-data.ts`; `TrackedCommerceClickAction` retains its
  event handling, pending/error state, Relay mutation orchestration, browser
  navigation, and markup, and owns redirect resolution/navigation failures from
  the asynchronous Relay completion callback as default route feedback.
- Evidence: `cd assets && bun x vitest run
  test/routes/offers/tracked-commerce-click-data.test.ts
  test/routes/offers/offer-discovery.route.test.tsx` passed 58 tests; `bun run
  typecheck` passed; the dependency-free framework/transport scan and
  sensitive-field scan found no matches.
- Regression evidence: a cross-origin redirect returned with no payload or
  GraphQL errors does not escape the completion callback and renders the
  existing default route error.
- Blockers: none.

## Tracked-Commerce Click Mutation Outcome Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate structural tracked-click completion as a resolved
  same-origin redirect URL or the shared route error in the existing
  framework-free data owner.
- Candidate evidence: current source inspection found structural redirect
  success, payload and top-level error checks, same-origin resolution, browser
  navigation, and feedback combined in `TrackedCommerceClickAction`; the
  existing pure owner already owns click qualification and redirect URL policy.
  Its focused suites pass 58 tests, and the candidate owns no paths from the
  affiliate setup, comparison sharing, or price-watch mutation rows.
- Blockers: none.

## Mutation Outcome Boundaries

- Preserve the generated tracked-commerce click mutation shape.
- Preserve current success requirements: a non-empty redirect path, no payload
  errors, and no top-level GraphQL errors.
- Preserve same-origin and same-protocol redirect validation in the existing
  pure resolver; rejected redirects use the default route error.
- Preserve `routeMutationErrorMessage` as the shared error-policy owner.
- Leave event handling, Relay mutation orchestration, pending and error state,
  browser navigation, markup, and presentation in
  `TrackedCommerceClickAction`.

## Verification

- `cd assets && bun x vitest run test/routes/offers/tracked-commerce-click-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && rg -n 'from "(react|react-relay|react-router-dom)|@stylexjs|/relay/' src/routes/offers/tracked-commerce-click-data.ts`
- `rg -n "merchantUrl|destinationUrl|CJ_API_TOKEN|CJ_ACCOUNT_ID|rawMetadata|raw_metadata" assets/src/routes/offers/TrackedCommerceClickAction.tsx assets/src/routes/offers/tracked-commerce-click-data.ts`
- `git diff --check`

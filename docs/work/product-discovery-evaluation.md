# Product Discovery And Evaluation

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-product-discovery-evaluation-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 against product/catalog/offer route structure,
  pricing history, GraphQL pricing types, generated Relay inputs, and current
  route tests.

## Target Outcome

Product detail becomes a persistent decision workspace with a multi-spec
filter drawer and a bounded product-wide multi-merchant chart; touched product,
catalog, and offer files use generated Relay types and capability ownership.

## Owned Paths

- Product, catalog, and offer-discovery route capabilities and focused tests
  named by the plan.
- Pricing product-trend context, Product GraphQL projection/Dataloader source,
  and focused backend tests named by the plan.
- Product discovery Playwright spec and snapshots.
- This lane document.

## Internal Slices

1. Product/filter/chart characterization.
2. Bounded Decimal price-trend projection.
3. Multi-spec filter drawer.
4. Persistent header and chart modes.
5. Product/catalog/offer capability and Relay-type simplification.
6. Browser and full verification.

## Verification

Focused pricing/GraphQL/product/catalog/offer tests, query-count coverage,
deterministic browser/axe/visual checks at three widths,
`cd assets && pnpm run check`, backend full gates, queue validation, and diff
checks.

## Blocker Rule

Stop before editing root/router/head/date infrastructure, compare/auth/account,
operator, or seed-owned paths. Consume foundation APIs only after their
milestone is available.

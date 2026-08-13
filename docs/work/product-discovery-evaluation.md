# Product Discovery And Evaluation

## Snapshot

- Status: complete
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-product-discovery-evaluation-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 with complete frontend/backend gates and
  deterministic browser acceptance at 1,440px, 900px, and 390px.
- Completed: 2026-08-12 by the current detached worktree.

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

## Completion Evidence

- Product detail now keeps a decision header above Specifications, Offers, and
  Reviews & Q&A; Overview and rendered slug identity are absent.
- The specification drawer persists a product-scoped versioned draft, supports
  several enum/boolean/numeric selections, maps Same/At least/At most onto the
  existing catalog URL contract, and combines filters with AND semantics.
- `priceHistory90d` uses one request-scoped Dataloader source and one batched
  pricing query. Growing the product-evidence GraphQL request from three to six
  products retained the exact SELECT budget: 1 product-media, 1 current-spec,
  2 review, 3 merchant-product, and 3 price-point queries.
- The product-wide chart renders Lowest, Average, and By merchant modes without
  mixing currencies. Relative freshness exposes the exact timestamp on hover,
  focus, and touch. The accessible data table is clipped through a containing
  boundary so it cannot widen the mobile page.
- Catalog, product offers/community, offer discovery, and tracked-commerce
  click code now live under capability folders. Three one-use `*-data.ts`
  adapters were deleted; generated Relay payload/input/enum/connection types
  replaced hand-written successful-response schemas. The former 594-line
  community panel and 713-line community-items component were separated into
  pagination, owner submissions, answer loading, submission forms, review,
  question, answer, and moderation/action owners; no resulting component is
  longer than 262 lines.
- Intentional validation remains only at browser storage, FormData, URL,
  custom Decimal scalar, transport error, external redirect, and authorization
  boundaries in the touched cohort.
- Frontend: Relay compiled 76 reader / 55 normalization / 76 operation-text
  documents; typecheck, lint, format, StyleX mangle, client/SSR builds, and all
  1,534 unit tests passed. Initial bundle size was 221,163 gzip bytes against a
  300,000-byte budget.
- Browser: five Playwright checks passed. Desktop, tablet, and mobile captures
  were inspected after exercising two-spec selection, numeric mode changes,
  all chart modes, relative timestamp disclosure, axe, and overflow checks.
- Backend: queue validation reported three ready rows; format, warnings-as-
  errors compilation, Credo, ExDNA (3/3 clone budget), Reach, Dialyzer, and all
  1,486 tests passed.

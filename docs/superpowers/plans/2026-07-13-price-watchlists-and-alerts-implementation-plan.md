# Price Watchlists And Alerts Implementation Plan

**Goal:** Deliver authenticated product/offer watch rules, durable edge-triggered
evaluation, transport-neutral in-app events, and usable product-detail/inbox
surfaces without alerting from stale or incomplete offer data.

**Design:**
`docs/superpowers/specs/2026-07-13-watchlists-sharing-and-recommendations-design.md`

**Owned paths:**

- `lib/product_compare/alerts.ex`
- `lib/product_compare/alerts/**`
- `lib/product_compare_schemas/alerts/**`
- `lib/product_compare/pricing.ex`
- `lib/product_compare/pricing/offer_truth.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/graphql/global_id.ex`
- `lib/product_compare_web/resolvers/alerts_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `config/config.exs`
- `priv/repo/migrations/*_add_price_watches_and_alerts.exs`
- `test/product_compare/alerts/**`
- `test/product_compare_web/graphql/price_watches_and_alerts_test.exs`
- `test/product_compare/pricing/pricing_test.exs`
- `assets/schema.graphql`
- `assets/src/router.tsx`
- `assets/src/routes/RootDestinations.tsx`
- `assets/src/routes/products/**`
- `assets/src/routes/account/alerts/**`
- `assets/test/routes/products/detail.route.test.tsx`
- `assets/test/routes/account/alerts/**`
- `docs/work/product-trust-and-discovery.md`

## Safety Contract

- Watches are owner-scoped and target one product or one offer. Currency is
  fixed and offer watches must match the offer currency.
- Target-price and percentage-drop rules use eligible same-currency landed
  prices only. Missing shipping, inactive/out-of-stock offers, unknown stock,
  and stale observations cannot trigger an event.
- Evaluation is an Oban job uniquely keyed by price point. A watch event is
  created only on a false-to-true edge, respects cooldown, and is unique per
  watch/trigger observation.
- Event facts and the exact triggering price point are immutable. Delivery
  attempts are transport-neutral; the first adapter is an in-app delivered
  record with owner-only read state.
- Ingestion enqueues evaluation only for newly persisted observations. Replay
  cannot duplicate jobs or alert events.
- Product detail offers a focused rule form; the inbox keeps unread state and
  active watches legible without a card-grid dashboard.

## Tasks

1. Write failing rule, evaluator, worker, GraphQL ownership, and frontend route
   tests covering eligibility, currency, baselines, edge/reset/cooldown,
   replay, read state, and mutations.
2. Add watch, event, and delivery schemas plus validation and owner-scoped
   context APIs.
3. Add price-point identity to offer truth, durable evaluation jobs, and
   enqueue-on-new-observation integration for direct pricing and ingestion.
4. Add GraphQL watch/inbox queries and mutations with typed IDs and errors.
5. Add product-detail watch creation and an authenticated alerts route with
   unread event and active-watch controls.
6. Regenerate GraphQL/Relay artifacts and run focused backend/frontend,
   typecheck, build, queue, format, and diff gates.

Deterministic source-backed recommendations are the next milestone after alert
truth is green.

## Completion Evidence

- The focused alert context and GraphQL run passed 8 tests; affected pricing,
  ingestion, durable-job, pricing GraphQL, and alert regressions passed 165.
- Product detail and alert route suites passed 52 tests. Relay validation
  compiled 35 reader, 34 normalization, and 34 operation documents.
- Frontend TypeScript, client/SSR production builds, the client bundle budget,
  backend format/type checks, queue validation with four ready rows, and diff
  hygiene passed.

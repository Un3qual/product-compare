# Attribution Observability And Affiliate Click References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make operator revenue reporting show unsuppressed totals and individually traceable clicks/conversions while capturing raw request diagnostics and propagating ProductCompare click references through every supported affiliate network that officially echoes one.

**Architecture:** Keep one click-session write path and one conversion persistence boundary. Extract request diagnostics once at the Phoenix boundary, decorate outbound links through a closed network mapping, normalize provider payloads through focused adapters, and expose a forward-paginated operator ledger beside the existing summary. Preserve public identity, authorization, secret logging, URL safety, and provider raw-evidence boundaries.

**Tech Stack:** Elixir 1.19, Phoenix 1.8, Ecto/PostgreSQL, Absinthe Relay, React 19, Relay, StyleX, Vitest/Testing Library, ExUnit.

## Global Constraints

- Keep `Community Member`, public account presentation, authentication, operator authorization, same-origin checks, secret/log redaction, and destination/SSRF policy unchanged.
- Remove revenue suppression completely; no hidden threshold, nullable substitution, compatibility field, or feature flag remains.
- Replace attribution `user_agent_hash` and `ip_hash` fields with raw `user_agent` and `ip_address`; do not change authentication, integrity, ingestion, or idempotency hashes.
- Capture `referer`, `user-agent`, and `conn.remote_ip` without trusting forwarding headers independently of endpoint configuration and without logging the values.
- Decorate only affiliate links for `cj`, `impact`, `awin`, and `rakuten`; leave Amazon Associates and unverified custom networks unchanged.
- Use `sid`, `subId1`, `clickref`, and `u1` respectively. Never write ProductCompare's UUID into Impact `ClickId`.
- Keep one public click UUID as the join key. Rakuten alone uses the reversible 32-character hyphenless representation required by its documented alphanumeric contract.
- Keep provider polling, transaction scheduling, and Amazon campaign-tag provisioning out of scope.
- Follow strict red-green-refactor cycles and commit complete code/test/doc milestones.

---

### Task 1: Remove Revenue Suppression End To End

**Files:**

- Modify: `lib/product_compare/commerce_attribution/revenue/filters.ex`
- Modify: `lib/product_compare/commerce_attribution/revenue/projection.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/types.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/queries.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`
- Modify: `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Modify: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Regenerate: `assets/src/__generated__/RevenueSummaryRouteQuery.graphql.ts`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Write failing unsuppressed summary tests**

Change domain and GraphQL expectations so a one-conversion result returns its actual clicks, conversions, order amount, commission, average, and currency. Assert the GraphQL schema no longer selects or exposes `suppression`, and remove client-controlled/internal `min_conversions` coverage.

Change frontend tests so `RevenueSummaryMetrics` always renders the calculated items and has no suppression prop or hidden-metrics status message.

```bash
mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs
cd assets && pnpm vitest run test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx
```

Expected before implementation: backend assertions still receive nulled metrics/suppression metadata and frontend types still require suppression.

- [ ] **Step 2: Delete the suppression contract**

Remove `min_conversions` normalization/defaults, `maybe_suppress_metrics/2`, the projection's suppression map, the resolver threshold, the GraphQL suppression object/field, and the frontend suppression branch. Update the query description to identify an operator aggregate rather than a public-safe aggregate. Keep mixed-currency rejection and current zero/null monetary semantics.

- [ ] **Step 3: Regenerate Relay, verify, and commit**

```bash
cd assets && pnpm relay
mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/development_seeds_test.exs
cd assets && pnpm vitest run test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx
git diff --check
git add lib/product_compare/commerce_attribution/revenue lib/product_compare_web/resolvers/commerce_attribution/reads.ex lib/product_compare_web/schema/commerce_attribution assets/src/routes/commerce/revenue assets/src/__generated__/RevenueSummaryRouteQuery.graphql.ts test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/graphql assets/test/routes/commerce/revenue docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: return unsuppressed revenue metrics"
```

### Task 2: Persist Raw Click Diagnostics And Preserve Signed-In Fallback Identity

**Files:**

- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks/sessions.ex`
- Create: `lib/product_compare_web/commerce_attribution/request_diagnostics.ex`
- Modify: `lib/product_compare_web/plugs/put_absinthe_context.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/mutations.ex`
- Modify: `lib/product_compare_web/controllers/commerce_redirect_controller.ex`
- Modify: `lib/product_compare_web/router.ex`
- Modify: `priv/repo/seeds/operations.exs`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare_web/plugs/put_absinthe_context_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_click_test.exs`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Write failing schema and request-capture tests**

Change click-session tests to accept `user_agent` and `ip_address` and reject the deleted hash-named fields. For both GraphQL mutation and direct fallback, send exact `referer`, `user-agent`, and remote IP values, then assert the persisted row contains them. Authenticate the direct fallback and assert its `user_id`; retain an anonymous case. Add focused extractor/context tests for missing headers and IPv4/IPv6 formatting without consulting `x-forwarded-for` directly.

```bash
mix test test/product_compare_web/plugs/put_absinthe_context_test.exs test/product_compare_web/graphql/commerce_click_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
```

Expected before implementation: raw fields and request context are absent and the direct fallback remains anonymous.

- [ ] **Step 2: Replace the unreleased hash-named storage**

Edit the original commerce-attribution migration to create `user_agent` and `ip_address` text columns. Update the schema, session allowlist, development seed values, and tests. Reset only the test database before rerunning migrations; do not erase the user's development database.

```bash
MIX_ENV=test mix ecto.reset
```

- [ ] **Step 3: Add one request-diagnostics boundary**

Implement `ProductCompareWeb.CommerceAttribution.RequestDiagnostics.from_conn/1` returning only `%{referrer:, user_agent:, ip_address:}` with nil values removed. Put it in Absinthe context and merge it into mutation attributes. Route both `/r` endpoints through the existing session/current-user pipeline; the fallback merges the same map and current user ID. Do not log the map or add an anonymous cookie.

- [ ] **Step 4: Verify and commit**

```bash
mix test test/product_compare_web/plugs/put_absinthe_context_test.exs test/product_compare_web/graphql/commerce_click_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare/repo/seeds_test.exs
mix format
git diff --check
git add priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex lib/product_compare/commerce_attribution/clicks/sessions.ex lib/product_compare_web/commerce_attribution/request_diagnostics.ex lib/product_compare_web/plugs/put_absinthe_context.ex lib/product_compare_web/resolvers/commerce_attribution/mutations.ex lib/product_compare_web/controllers/commerce_redirect_controller.ex lib/product_compare_web/router.ex priv/repo/seeds/operations.exs test/product_compare test/product_compare_web docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: persist raw click diagnostics"
```

### Task 3: Decorate Verified Network Click References

**Files:**

- Create: `lib/product_compare/commerce_attribution/click_reference.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks/destinations.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks/redirects.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Write the failing network matrix**

Use table-driven tests for `cj/sid`, `impact/subId1`, `awin/clickref`, and `rakuten/u1`; Rakuten expects the UUID without hyphens. Cover empty/populated queries, fragments, and reserved-parameter replacement. Assert unrelated values survive. Assert Amazon, non-affiliate links, nil networks, and a custom network remain unchanged. Assert Impact no longer receives a ProductCompare `ClickId`.

- [ ] **Step 2: Implement the closed mapping**

`ClickReference` owns `outbound_parameter/1`, `encode/2`, and `decode/2`. `Destinations` owns one reserved-query-parameter put operation. `Redirects` calls it only for active affiliate links. Do not guess from hostnames or add a generic fallback parameter.

- [ ] **Step 3: Verify and commit**

```bash
mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs
mix format
git diff --check
git add lib/product_compare/commerce_attribution/click_reference.ex lib/product_compare/commerce_attribution/clicks/destinations.ex lib/product_compare/commerce_attribution/clicks/redirects.ex test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: propagate affiliate click references"
```

### Task 4: Normalize Returned Publisher References

**Files:**

- Modify: `lib/product_compare/commerce_attribution/impact_adapter.ex`
- Create: `lib/product_compare/commerce_attribution/cj_adapter.ex`
- Create: `lib/product_compare/commerce_attribution/awin_adapter.ex`
- Create: `lib/product_compare/commerce_attribution/rakuten_adapter.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Add failing adapter contracts**

For each adapter, ingest an already-fetched payload whose publisher reference points to a real click. Assert `public_click_id`, `click_session_id`, hydrated dimensions, and high confidence. Cover atom/string keys, blank/malformed references, stale updates, and conflicts. Impact reads ProductCompare's UUID from `SubId1` and retains provider `ClickId` as `network_click_ref`; Rakuten restores the compact `u1`.

- [ ] **Step 2: Implement focused adapters**

Share only UUID token handling through `ClickReference`. Each adapter owns provider field names, statuses, dates, amounts, and conversion reference, then delegates to `CommerceAttribution.ingest_conversion/1`. Add no HTTP client or job.

- [ ] **Step 3: Verify and commit**

```bash
mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs
mix format
git diff --check
git add lib/product_compare/commerce_attribution/*_adapter.ex lib/product_compare/commerce_attribution/click_reference.ex test/product_compare/commerce_attribution/commerce_attribution_test.exs docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: normalize affiliate conversion references"
```

### Task 5: Add The Operator Attribution Ledger GraphQL Contract

**Files:**

- Create: `lib/product_compare/commerce_attribution/click_ledger.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/types.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/queries.ex`
- Create: `test/product_compare_web/graphql/commerce_attribution_ledger_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Write failing authorization, filter, and pagination tests**

Define `commerceAttributionClicks(input:, first:, after:)` as a non-null forward connection. Prove anonymous/member authorization occurs before database work. For operators, assert newest-first ordering with ID tie-breaker, cursor validation, shared filters, and nodes containing click/user/anonymous identity, raw diagnostics, dimensions, and matched conversions. Assert `rawPayload`, destination secrets, and credential fields are absent. Include unmatched and multi-conversion clicks plus stable query counts across page sizes.

- [ ] **Step 2: Implement the read model without N+1 queries**

`ClickLedger` owns normalized filters and the deterministic query. Use the existing Relay connection helper and page-level preloads or bounded batches for user, link/program/network, merchant product/product/merchant, and conversions. Add only required associations; do not create a reporting repository abstraction.

- [ ] **Step 3: Verify and commit**

```bash
mix test test/product_compare_web/graphql/commerce_attribution_ledger_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
mix format
git diff --check
git add lib/product_compare/commerce_attribution/click_ledger.ex lib/product_compare/commerce_attribution.ex lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex lib/product_compare_web/resolvers/commerce_attribution/reads.ex lib/product_compare_web/schema/commerce_attribution test/product_compare_web/graphql/commerce_attribution_ledger_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: expose operator attribution ledger"
```

### Task 6: Add The Ledger To The Revenue Route

**Files:**

- Modify: `assets/src/routes/commerce/revenue/queries/RevenueSummaryRouteQuery.ts`
- Modify: `assets/src/routes/commerce/revenue/loader.ts`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Modify: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Create: `assets/src/routes/commerce/revenue/AttributionLedger.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-loader.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Regenerate: `assets/src/__generated__/RevenueSummaryRouteQuery.graphql.ts`
- Modify: `docs/work/attribution-observability-and-affiliate-click-references.md`

- [ ] **Step 1: Write failing route tests**

Extend the query with the ledger connection and pagination variables. Assert exact click/user/diagnostic/network/conversion evidence, empty and anonymous-user states, and Relay load-more behavior. Assert filters drive both surfaces and reset the cursor.

- [ ] **Step 2: Implement the ledger presentation**

Keep the summary first. Render a semantic responsive list/table, format amounts with existing frontend helpers, and reuse existing Relay pagination patterns. Do not add client aggregation or a second filter model.

- [ ] **Step 3: Regenerate, verify, and commit**

```bash
cd assets && pnpm relay
cd assets && pnpm vitest run test/routes/commerce/revenue
mix frontend_check
git diff --check
git add assets/src/routes/commerce/revenue assets/src/__generated__/RevenueSummaryRouteQuery.graphql.ts assets/test/routes/commerce/revenue docs/work/attribution-observability-and-affiliate-click-references.md
git commit -m "feat: show individual attribution ledger"
```

### Task 7: Batch Verification And Handoff

- [ ] **Step 1: Run affected suites**

```bash
mix test test/product_compare/commerce_attribution test/product_compare_web/graphql/commerce_click_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/commerce_attribution_ledger_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare/repo/seeds_test.exs
cd assets && pnpm vitest run test/routes/commerce/revenue test/routes/offers/tracked-commerce-click-data.test.ts test/routes/offers/tracked-commerce-mutation.test.ts
```

- [ ] **Step 2: Run repository gates**

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
git diff --check
```

- [ ] **Step 3: Record evidence and complete the queue row**

Update the lane doc with exact results, preserve completion history, remove the completed row from the live queue, verify at least three ready rows remain, and commit the final evidence with the last implementation milestone.

# Product Compare Feature-Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Each
> behavior task also requires `superpowers:test-driven-development`.

**Goal:** Complete the approved shopper milestone, position revenue as a
preview, and make recurring CJ operation observable through the existing
readiness gate without reopening deferred production scope.

**Architecture:** Keep shopper changes inside existing React routes and current
Relay contracts. Extend the existing read-only CJ readiness task with schedule
state derived from application configuration; keep both schedulers opt-in and
secret-safe. Close each milestone with focused tests, lane evidence, and a
commit, then run repository-wide verification.

**Tech Stack:** React 19, TypeScript, React Router, Relay, StyleX, Vitest, Bun,
Elixir, Phoenix, Ecto, ExUnit, Mix.

## Global Constraints

- Production email delivery remains deferred.
- Live conversion ingestion is excluded; `/commerce/revenue` is an
  authenticated preview.
- Production deployment, privacy, consent, retention, and attribution
  governance are not completion gates for this milestone.
- Do not add eBay fallback, ingestion dashboards, Tier-3 scraping, automated
  merchant applications, account-manager automation, credential persistence,
  or CSV export.
- Keep CJ schedules disabled by default and never print secret or account
  values.
- Use test-first red-green cycles for every behavior change.
- Commit code, tests, generated files, and lane evidence together at each
  milestone boundary.

---

### Task 1: Dispatch Revenue Preview And CJ Scheduled Readiness

**Files:**

- Create: `docs/plans/2026-07-10-revenue-preview-positioning-implementation-plan.md`
- Create: `docs/plans/2026-07-10-cj-scheduled-readiness-implementation-plan.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**

- Produces two new `ready` rows with disjoint ownership.
- Revenue row owns the revenue route test, route component, and affiliate lane.
- CJ row owns the readiness task/test, operator runbook, and ingestion lane.

- [ ] **Step 1: Write the two short execution contracts**

The revenue plan must name these paths and verification commands:

```markdown
Owned paths:
- assets/src/routes/commerce/revenue/index.tsx
- assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx
- docs/work/affiliate-revenue-attribution.md

Verification:
- cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx
- cd assets && bun run typecheck
- git diff --check
```

The CJ plan must name these paths and verification commands:

```markdown
Owned paths:
- lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex
- test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
- docs/runbooks/cj-weekly-operator-loop.md
- docs/work/product-data-scraping.md

Verification:
- mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
- mix typecheck
- mix format --check-formatted
- git diff --check
```

- [ ] **Step 2: Add both rows to the live queue and catalog**

Use `Status: ready`, exact owned paths, prerequisites, verification, and exit
conditions. Keep all existing ready rows and their ordering intact.

- [ ] **Step 3: Validate the dispatch boundary**

Run:

```bash
mix work_queue.validate
git diff --check
```

Expected: both commands exit 0 and the live queue has at least six complete
ready rows.

- [ ] **Step 4: Commit the dispatch update**

```bash
git add docs/work/index.md docs/plans/INDEX.md \
  docs/plans/2026-07-10-revenue-preview-positioning-implementation-plan.md \
  docs/plans/2026-07-10-cj-scheduled-readiness-implementation-plan.md
git commit -m "docs: dispatch feature-complete follow-ups"
```

---

### Task 2: Shopper-Focused Home Content

**Files:**

- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `docs/work/frontend-shopper-home-navigation.md`

**Interfaces:**

- Consumes `RootOutletContext.viewer` without changing the root query.
- Produces primary links to `/products`, `/compare`, and `/offers` plus a
  secondary action group.

- [ ] **Step 1: Write the failing home-content test**

Add assertions equivalent to:

```tsx
expect(screen.getByText(/find products/i)).toBeInTheDocument();
expect(screen.getByText(/compare specifications/i)).toBeInTheDocument();
expect(screen.getByText(/review offers/i)).toBeInTheDocument();
expect(
  screen.queryByText(/GraphQL-backed browser auth flows/i)
).not.toBeInTheDocument();

const shopperActions = screen.getByRole("group", { name: "Shopper actions" });
expect(within(shopperActions).getByRole("link", { name: "Browse products" }))
  .toHaveAttribute("href", "/products");
expect(within(shopperActions).getByRole("link", { name: "Compare products" }))
  .toHaveAttribute("href", "/compare");
expect(within(shopperActions).getByRole("link", { name: "Review offers" }))
  .toHaveAttribute("href", "/offers");
```

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
cd assets && bun x vitest run test/routes/root.route.test.tsx
```

Expected: failure because shopper copy and the `Shopper actions` group do not
exist.

- [ ] **Step 3: Implement the shopper hierarchy**

Replace the technical paragraph and split the actions:

```tsx
<p>
  Find products, compare specifications, and review current offers before you
  choose what to buy.
</p>
<div aria-label="Shopper actions" role="group" {...stylex.props(styles.actions)}>
  <DestinationLink label="Browse products" to="/products" />
  <DestinationLink label="Compare products" to="/compare" />
  <DestinationLink label="Review offers" to="/offers" />
</div>
<div aria-label="More Product Compare actions" role="group">
  <DestinationLink label="Merchants" to="/merchants" />
  <DestinationLink label="Affiliate setup" to="/affiliate/setup" />
  <DestinationLink label="Saved comparisons" to="/compare/saved" />
  <DestinationLink label="Revenue" to="/commerce/revenue" />
  <DestinationLink label="API tokens" to="/account/api-tokens" />
  <AuthLinks viewer={viewer} />
</div>
```

Keep link definitions module-scoped; do not create components inside
`RootRoute` or `RootLayoutShell`.

- [ ] **Step 4: Run GREEN verification**

```bash
cd assets && bun x vitest run test/routes/root.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

- [ ] **Step 5: Record evidence and commit**

```bash
git add assets/src/routes/root.tsx assets/test/routes/root.route.test.tsx \
  docs/work/frontend-shopper-home-navigation.md
git commit -m "feat: focus home on shopper journey"
```

---

### Task 3: Viewer-Aware Navigation

**Files:**

- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `docs/work/frontend-shopper-home-navigation.md`

**Interfaces:**

- Produces `PUBLIC_DESTINATIONS` and `AUTHENTICATED_DESTINATIONS` module-level
  lists reused by navigation and home actions.
- Uses `viewer !== null` only as a visibility signal.

- [ ] **Step 1: Write failing guest/authenticated visibility tests**

For guests, assert public links remain and these links are absent:

```tsx
for (const name of ["Saved comparisons", "Affiliate setup", "Revenue preview", "API tokens"]) {
  expect(within(primaryNavigation).queryByRole("link", { name })).not.toBeInTheDocument();
}
```

For authenticated viewers, assert all four destinations plus Sign out are
present and Sign in/Create account are absent.

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
cd assets && bun x vitest run test/routes/root.route.test.tsx
```

Expected: guest assertions fail because account destinations are currently
public and the revenue label is currently `Revenue`.

- [ ] **Step 3: Implement shared destination groups**

Use module-level immutable data:

```tsx
const PUBLIC_DESTINATIONS = [
  { label: "Browse products", to: "/products" },
  { label: "Merchants", to: "/merchants" },
  { label: "Offers", to: "/offers" },
  { label: "Compare products", to: "/compare" }
] as const;

const AUTHENTICATED_DESTINATIONS = [
  { label: "Saved comparisons", to: "/compare/saved" },
  { label: "Affiliate setup", to: "/affiliate/setup" },
  { label: "Revenue preview", to: "/commerce/revenue" },
  { label: "API tokens", to: "/account/api-tokens" }
] as const;
```

Render public destinations for all viewers and authenticated destinations only
inside `viewer ? ... : null`. Reuse the same arrays in the home secondary group.

- [ ] **Step 4: Run GREEN verification and commit**

```bash
cd assets && bun x vitest run test/routes/root.route.test.tsx
cd assets && bun run typecheck
git diff --check
git add assets/src/routes/root.tsx assets/test/routes/root.route.test.tsx \
  docs/work/frontend-shopper-home-navigation.md
git commit -m "feat: make navigation viewer aware"
```

---

### Task 4: Safe Relative Loaded Price Signal

**Files:**

- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/src/routes/compare/decision-summary.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interfaces:**

- Consumes only `CompareOfferContextSummary.bestCurrentPrice`.
- Produces `Lowest loaded price`, `Tied for lowest loaded price`, `Above lowest
  loaded price`, or `Not comparable` per product.

- [ ] **Step 1: Write failing decision-summary cases**

Add cases for:

```tsx
// 99.99 USD vs 120.00 USD
expect(within(summary).getByText("Lowest loaded price")).toBeVisible();
expect(within(summary).getByText("Above lowest loaded price")).toBeVisible();

// 99.990 USD vs 99.99 USD
expect(within(summary).getAllByText("Tied for lowest loaded price")).toHaveLength(2);

// USD/EUR, malformed, missing, or unavailable
expect(within(summary).getAllByText("Not comparable")).toHaveLength(2);
```

- [ ] **Step 2: Run named cases and confirm RED**

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx \
  -t "relative loaded price|lowest loaded price|not comparable"
```

- [ ] **Step 3: Implement exact non-floating-point comparison**

Add a compare-local parser returning sign, integer digits, and fractional
digits. Normalize leading integer zeros and trailing fractional zeros, then
compare sign, integer length, integer lexicographically, and padded fraction
lexicographically. Reject exponent notation, empty strings, negative prices,
and non-decimal characters.

Use this shape:

```ts
type ComparablePrice = {
  currency: string;
  productId: string;
  value: { integer: string; fraction: string };
};

function parsePriceMagnitude(value: string) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return {
    integer: match[1].replace(/^0+(?=\d)/, ""),
    fraction: (match[2] ?? "").replace(/0+$/, "")
  };
}

function comparePriceMagnitudes(
  left: ComparablePrice["value"],
  right: ComparablePrice["value"]
) {
  if (left.integer.length !== right.integer.length) {
    return left.integer.length < right.integer.length ? -1 : 1;
  }

  if (left.integer !== right.integer) {
    return left.integer < right.integer ? -1 : 1;
  }

  const fractionLength = Math.max(left.fraction.length, right.fraction.length);
  const leftFraction = left.fraction.padEnd(fractionLength, "0");
  const rightFraction = right.fraction.padEnd(fractionLength, "0");

  return leftFraction === rightFraction ? 0 : leftFraction < rightFraction ? -1 : 1;
}

function relativeLoadedPriceLabels(
  products: CompareProductSummary[],
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"]
): Map<string, string> {
  const unavailable = new Map(products.map(({ id }) => [id, "Not comparable"]));

  if (products.length < 2) {
    return unavailable;
  }

  const comparablePrices = products.flatMap((product): ComparablePrice[] => {
    const context = offerContextForProduct(offerContexts, product.id);

    if (context.status === "unavailable" || !context.bestCurrentPrice) {
      return [];
    }

    const value = parsePriceMagnitude(context.bestCurrentPrice.price);

    return value
      ? [{ currency: context.bestCurrentPrice.currency, productId: product.id, value }]
      : [];
  });

  if (comparablePrices.length < 2) {
    return unavailable;
  }

  if (new Set(comparablePrices.map(({ currency }) => currency)).size !== 1) {
    return unavailable;
  }

  const minimum = comparablePrices.reduce((current, candidate) =>
    comparePriceMagnitudes(candidate.value, current.value) < 0 ? candidate : current
  );
  const minimumCount = comparablePrices.filter(
    ({ value }) => comparePriceMagnitudes(value, minimum.value) === 0
  ).length;

  const comparableByProductId = new Map(
    comparablePrices.map((price) => [price.productId, price])
  );

  return new Map(
    products.map(({ id }) => {
      const price = comparableByProductId.get(id);

      if (!price) {
        return [id, "Not comparable"] as const;
      }

      return [
        id,
        comparePriceMagnitudes(price.value, minimum.value) === 0
          ? minimumCount > 1
            ? "Tied for lowest loaded price"
            : "Lowest loaded price"
          : "Above lowest loaded price"
      ] as const;
    })
  );
}
```

Render the map through a new `DecisionSummaryRow` before the existing best-price
row. Do not mutate `DECISION_SUMMARY_METRICS` with product-dependent state.

- [ ] **Step 4: Run GREEN verification and commit**

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx \
  -t "relative loaded price|lowest loaded price|not comparable"
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx
cd assets && bun run typecheck
git diff --check
git add assets/src/routes/compare/decision-summary.tsx \
  assets/test/routes/compare/compare.route.test.tsx \
  docs/work/frontend-product-comparison-demo-parity.md
git commit -m "feat: add relative comparison price signal"
```

---

### Task 5: Saved Comparison Product Labels

**Files:**

- Modify: `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`
- Modify: `assets/src/routes/compare/saved-data.ts`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `docs/work/frontend-saved-comparisons-ui.md`

**Interfaces:**

- Changes `SavedComparisonSetSummary.slugs` to
  `products: Array<{name: string; slug: string}>`.
- Reopen links continue to derive repeated parameters from ordered slugs.

- [ ] **Step 1: Write failing loader and card tests**

Use an intentionally out-of-order response and expect:

```tsx
expect(summary.products).toEqual([
  { name: "Desk Chair", slug: "chair" },
  { name: "Standing Desk", slug: "desk" }
]);
expect(screen.getByText("Desk Chair, Standing Desk")).toBeInTheDocument();
expect(screen.queryByText("chair, desk")).not.toBeInTheDocument();
expect(openComparisonLink).toHaveAttribute("href", "/compare?slug=chair&slug=desk");
```

- [ ] **Step 2: Run tests and confirm RED**

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx \
  -t "saved comparison.*product|stored position order"
cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx
```

- [ ] **Step 3: Extend query and route data**

Add `name` beside `slug` in the query. Change the summary interface and parser:

```ts
export interface SavedComparisonSetSummary {
  id: string;
  name: string;
  products: Array<{ name: string; slug: string }>;
}

function summarizeSavedComparisonItem(item: unknown) {
  if (
    !isRouteRecord(item) ||
    typeof item.position !== "number" ||
    !isRouteRecord(item.product) ||
    typeof item.product.name !== "string" ||
    typeof item.product.slug !== "string"
  ) {
    throwSavedComparisonsParseError();
  }

  return {
    position: item.position,
    name: item.product.name,
    slug: item.product.slug
  };
}
```

Sort by position before mapping to `{name, slug}`. Update filtering and product
counts to read `products`; retain product-name and slug matching.

- [ ] **Step 4: Render names and regenerate Relay**

```tsx
<p>{savedSet.products.map((product) => product.name).join(", ")}</p>
<Link to={buildSavedComparisonHref(savedSet.products.map(({ slug }) => slug))}>
  Open comparison
</Link>
```

Run `cd assets && bun run relay` and inspect the generated artifact for both
`name` and `slug` selections.

- [ ] **Step 5: Run GREEN verification and commit**

```bash
cd assets && bun run relay
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx \
  -t "saved comparison.*product|stored position order"
cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx
cd assets && bun run typecheck
git diff --check
git add assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts \
  assets/src/routes/compare/saved-data.ts assets/src/routes/compare/saved.tsx \
  assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts \
  assets/test/routes/compare/compare.route.test.tsx \
  assets/test/routes/compare/saved-comparisons-route-state.test.tsx \
  docs/work/frontend-saved-comparisons-ui.md
git commit -m "feat: label saved comparison products"
```

---

### Task 6: Revenue Preview Positioning

**Files:**

- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/src/routes/commerce/revenue/index.tsx`
- Modify: `docs/work/affiliate-revenue-attribution.md`

**Interfaces:**

- Preserves all loader/query/filter behavior.
- Adds static preview copy only.

- [ ] **Step 1: Write the failing preview test**

```tsx
expect(screen.getByRole("heading", { name: "Revenue reporting preview" }))
  .toBeInTheDocument();
expect(screen.getByText(/recorded attribution data/i)).toBeInTheDocument();
expect(screen.getByText(/live conversion provider is not connected/i))
  .toBeInTheDocument();
```

- [ ] **Step 2: Run the focused suite and confirm RED**

```bash
cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx
```

- [ ] **Step 3: Add static preview positioning**

```tsx
<header>
  <h1>Revenue reporting preview</h1>
  <p>
    This preview summarizes recorded attribution data. A live conversion
    provider is not connected for this milestone.
  </p>
</header>
```

Update existing heading assertions to the new accessible name; do not change
query variables, filters, suppression, or error states.

- [ ] **Step 4: Run GREEN verification and commit**

```bash
cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx
cd assets && bun run typecheck
git diff --check
git add assets/src/routes/commerce/revenue/index.tsx \
  assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx \
  docs/work/affiliate-revenue-attribution.md
git commit -m "feat: position revenue reporting as preview"
```

---

### Task 7: CJ Scheduled-Supply Readiness

**Files:**

- Modify: `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`
- Modify: `docs/runbooks/cj-weekly-operator-loop.md`
- Modify: `docs/work/product-data-scraping.md`

**Interfaces:**

- Adds CLI boolean `--require-scheduled`.
- Adds output keys `feed_discovery_schedule_enabled`,
  `product_import_schedule_enabled`, and `schedules_ready`.
- Keeps `--require-ready` as the only raising/enforcement switch.

- [ ] **Step 1: Write failing schedule-readiness tests**

Extend `@cj_env_vars` with both schedule enable variables and restore them in
`on_exit`. Add tests equivalent to:

```elixir
test "preserves manual readiness when schedules are not required" do
  seed_ready_cj_state!()
  output = capture_io(fn -> CjReadinessGate.run([]) end)
  assert output =~ "ready=true"
  assert output =~ "schedules_ready=false"
end

test "requires both schedules when requested" do
  seed_ready_cj_state!()
  System.put_env("CJ_FEED_DISCOVERY_SCHEDULE_ENABLED", "true")
  output = capture_io(fn -> CjReadinessGate.run(["--require-scheduled"]) end)
  assert output =~ "ready=false"
  assert output =~ "feed_discovery_schedule_enabled=true"
  assert output =~ "product_import_schedule_enabled=false"
end

test "enforces scheduled readiness through require-ready" do
  seed_ready_cj_state!()
  assert_raise Mix.Error, "CJ ingestion is not ready", fn ->
    capture_io(fn ->
      CjReadinessGate.run(["--require-scheduled", "--require-ready"])
    end)
  end
end
```

Also cover both flags enabled and truthy normalization matching runtime config
(`1`, `true`, `yes`, `on`).

Extract this test helper so every schedule case starts from the same persisted
ready state:

```elixir
defp seed_ready_cj_state! do
  System.put_env("CJ_API_TOKEN", "secret-token")
  System.put_env("CJ_ACCOUNT_ID", "1234567")
  source = source_fixture()
  insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(1)})
  insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})
  insert_candidate!(source)
  source
end
```

- [ ] **Step 2: Run the focused suite and confirm RED**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
```

Expected: unsupported `--require-scheduled` and missing schedule output.

- [ ] **Step 3: Implement schedule reporting**

Add the CLI option and readiness calculation:

```elixir
@feed_schedule_env "CJ_FEED_DISCOVERY_SCHEDULE_ENABLED"
@import_schedule_env "CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED"
@truthy_values ~w(1 true yes on)

require_scheduled = Keyword.get(opts, :require_scheduled, false)
feed_enabled = truthy_env?(@feed_schedule_env)
import_enabled = truthy_env?(@import_schedule_env)
schedules_ready = feed_enabled and import_enabled

ready =
  base_ready and (not require_scheduled or schedules_ready)
```

Append all three schedule booleans and `require_scheduled` to the line-oriented
report. Do not print raw env values.

- [ ] **Step 4: Update the operator contract**

Document activation using the existing environment variables, bounded interval
and query settings, credential preflight, and this post-activation gate:

```bash
mix product_compare.ingestion.cj_readiness_gate \
  --max-discovery-age-hours 48 \
  --max-import-age-hours 48 \
  --min-candidates 1 \
  --require-scheduled \
  --require-ready
```

State that activation and credentials occur outside source control and that a
failed gate does not authorize eBay, scraping, dashboards, or application
automation.

- [ ] **Step 5: Run GREEN verification and commit**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
mix typecheck
mix format --check-formatted
git diff --check
git add lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex \
  test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs \
  docs/runbooks/cj-weekly-operator-loop.md docs/work/product-data-scraping.md
git commit -m "feat: gate recurring CJ ingestion readiness"
```

---

### Task 8: Close Milestone Docs And Run Full Verification

**Files:**

- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: the five touched lane docs from Tasks 2 through 7

**Interfaces:**

- Removes completed milestone rows only at a coordinator boundary that retains
  at least three validated `ready` implementation rows.
- Records email, Impact, production readiness, and privacy controls as explicit
  non-goals rather than active blockers.

- [ ] **Step 1: Reconcile completion evidence**

For every milestone row, record the exact commit and focused verification. Do
not mark a row done if its focused command has not passed in this session.

- [ ] **Step 2: Preserve the ready-work floor**

Before removing completed rows, validate at least three useful non-deferred
successor rows against current code and tests. If fewer than three legitimate
rows exist, stop before changing `docs/work/index.md` and record the coordinator
blocker in the relevant lane doc; do not invent queue filler or reopen an
explicit non-goal.

- [ ] **Step 3: Run frontend verification**

```bash
cd assets && bun run relay
cd assets && bun run test:unit
cd assets && bun run typecheck
cd assets && bun run build:client
cd assets && bun run build:ssr
```

Expected: every command exits 0 with no failing test.

- [ ] **Step 4: Run backend and repository verification**

```bash
mix test
mix typecheck
mix format --check-formatted
mix work_queue.validate
git diff --check
```

Expected: every command exits 0 with no failures or formatting errors.

- [ ] **Step 5: Review the final diff against the approved design**

Confirm each of the six outcomes in
`docs/superpowers/specs/2026-07-10-product-compare-feature-complete-scope-design.md`
has code/test or operator-contract evidence, and confirm every explicit
non-goal remains absent.

- [ ] **Step 6: Commit the coordinator close-out**

```bash
git add docs/work/index.md docs/plans/INDEX.md ARCHITECTURE.md docs/work
git commit -m "docs: record feature-complete milestone evidence"
```

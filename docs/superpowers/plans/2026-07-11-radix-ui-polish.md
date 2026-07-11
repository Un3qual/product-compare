# Radix UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish every registered Product Compare frontend route with a calm, expressive, information-dense visual system built on Radix Themes and Radix primitives.

**Architecture:** Add Radix Themes as the accessible control and foundational-token layer, alias its variables through Product Compare semantic CSS and StyleX tokens, and build a small set of shared layout and feedback components. Apply those components route family by route family without changing Relay data, URLs, form contracts, authorization, pagination, or backend behavior.

**Tech Stack:** React 19, TypeScript, React Router 7, Relay 20, Radix Themes, Radix primitives, StyleX, Vitest, Testing Library, Bun, Vite SSR.

## Global Constraints

- Cover every route registered in `assets/src/router.tsx`.
- Use Radix Themes or a Radix primitive whenever an appropriate control exists.
- Local interactive components must wrap Radix behavior instead of reimplementing it unless the requirement cannot reasonably be expressed through Radix.
- Keep StyleX for application layout and route-specific composition.
- Consume semantic theme aliases instead of hard-coded brand colors in new route and component styles.
- Preserve Relay queries, loaders, mutations, pagination, URLs, query strings, authorization, Phoenix session behavior, and GraphQL contracts.
- Implement a light theme only; do not add a dark-mode switch.
- Preserve accessible names and current behavior-test contracts unless an intentional usability improvement requires a behavior-test update.
- Prefer layout, typography, dividers, and surface shifts over card mosaics or decorative gradients.
- Respect `prefers-reduced-motion` for every transition.
- Run the repository's real production gate with `cd assets && bun run build`.
- Keep the work queue at three other `ready` rows whenever this plan claims an implementation row.

---

## Planned File Structure

### New shared files

- `assets/src/ui/components/layout/page-shell.tsx`: route-level title, description, actions, and width composition.
- `assets/src/ui/components/layout/section-heading.tsx`: consistent section titles and supporting copy.
- `assets/src/ui/components/feedback/feedback-state.tsx`: Radix Callout-based loading, empty, success, warning, and error treatments.
- `assets/src/ui/components/data/data-list.tsx`: semantic list reset, divided rows, metadata, and action-zone layout.
- `assets/src/ui/components/navigation/pagination.tsx`: shared accessible pagination action group.
- `assets/src/ui/components/status/status-badge.tsx`: semantic Product Compare status mapped to Radix Badge colors.
- `assets/src/ui/primitives/collapsible.tsx`: thin `@radix-ui/react-collapsible` export with Product Compare data slots.
- `assets/test/ui/page-patterns.test.tsx`: behavior and accessibility coverage for the shared page, feedback, data-list, pagination, and status patterns.
- `docs/work/frontend-radix-ui-polish.md`: lane-local ownership, milestone state, and verification evidence.

### Existing shared files

- `assets/package.json`, `assets/bun.lock`: add `@radix-ui/themes` and `@radix-ui/react-collapsible`.
- `assets/src/ui/theme/theme.css`: Radix theme import, semantic CSS aliases, base document styles, focus/motion rules.
- `assets/src/ui/theme/tokens.stylex.ts`: StyleX mappings for the semantic color, spacing, typography, radius, and layout aliases.
- `assets/src/ui/providers/app-providers.tsx`: compose `DirectionProvider` and Radix `Theme`.
- `assets/src/ui/primitives/button.tsx`: make the shared button a thin Radix Themes wrapper while preserving `asChild`, native button defaults, and `data-slot`.
- `assets/src/ui/components/layout/app-shell.tsx`: responsive shell canvas and navigation frame.
- `assets/src/routes/root.tsx`: active navigation and expressive home composition.
- `assets/src/routes/auth/form-shell.tsx`: focused auth layout using Radix fields, button, and callouts.

### Route-family files

- Shopper catalog: `assets/src/routes/catalog/browse.tsx`, `assets/src/routes/catalog/filter-form.tsx`, `assets/src/routes/products/detail.tsx`, `assets/src/routes/products/product-attribute-list.tsx`.
- Merchant and offer discovery: `assets/src/routes/merchants/index.tsx`, `assets/src/routes/offers/index.tsx`, `assets/src/routes/offers/filters.tsx`, `assets/src/routes/offers/tracked-commerce-click.tsx`.
- Comparison: `assets/src/routes/compare/compare-shell.tsx`, `assets/src/routes/compare/index.tsx`, `assets/src/routes/compare/product-list.tsx`, `assets/src/routes/compare/product-picker.tsx`, `assets/src/routes/compare/selection-tray.tsx`, `assets/src/routes/compare/decision-summary.tsx`, `assets/src/routes/compare/saved.tsx`, `assets/src/routes/compare/error-boundary.tsx`.
- Operational: `assets/src/routes/affiliate/setup/index.tsx`, `assets/src/routes/commerce/revenue/index.tsx`, `assets/src/routes/ingestion/feed-candidates/index.tsx`, `assets/src/routes/account/api-tokens/index.tsx`.
- Authentication: `assets/src/routes/auth/login.tsx`, `assets/src/routes/auth/logout.tsx`, `assets/src/routes/auth/register.tsx`, `assets/src/routes/auth/forgot-password.tsx`, `assets/src/routes/auth/reset-password.tsx`, `assets/src/routes/auth/verify-email.tsx`.

---

### Task 1: Curate and Claim the UI Foundation Row

**Files:**
- Create: `docs/work/frontend-radix-ui-polish.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**
- Consumes: approved design at `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md` and this plan.
- Produces: one claimed UI-foundation row under `Active Work` whose owned paths cover Task 2, with the later route milestones recorded as dependent lane batches rather than queue filler.

- [ ] **Step 1: Write the lane contract**

Create `docs/work/frontend-radix-ui-polish.md` with this initial state:

```markdown
# Frontend Radix UI Polish Work Doc

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-11 against `assets/src/router.tsx` and the current UI layer
- Design: `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md`
- Plan: `docs/superpowers/plans/2026-07-11-radix-ui-polish.md`
- Objective: establish a Radix-backed theme and reusable UI patterns, then polish every registered frontend route without changing application behavior.

## Ready Batch 1: Radix Theme And Shared UI Foundation

Status: ready
Owned paths:

- `assets/package.json`
- `assets/bun.lock`
- `assets/src/ui/**`
- `assets/test/ui/**`
- `docs/work/frontend-radix-ui-polish.md`

Verification:

- `cd assets && bun x vitest run test/ui`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: Radix Themes owns the interactive foundation, semantic Product Compare tokens are available through CSS and StyleX, and shared page, feedback, data, status, and pagination patterns have green behavior tests.

## Dependent Batches

1. Shared application shell and home.
2. Catalog browse and product detail.
3. Merchant and offer discovery.
4. Comparison and saved comparisons.
5. Operational routes.
6. Authentication routes.

Promote only the next batch after its dependency has green completion evidence. Keep the three unrelated ready rows in `docs/work/index.md` available throughout execution.
```

- [ ] **Step 2: Add the plan to the catalog**

Add this bullet beneath `Active implementation plans:` in `docs/plans/INDEX.md`:

```markdown
- `docs/superpowers/plans/2026-07-11-radix-ui-polish.md`
```

Add a planned follow-up group stating that the UI pass executes serially from theme foundation through shell, shopper, operational, and auth routes because each milestone consumes the shared UI layer.

- [ ] **Step 3: Add the claimed queue row**

Insert this row under `Active Work` in `docs/work/index.md`:

```markdown
### 1. Radix Theme And Shared UI Foundation

Status: active
Lane: Frontend Radix UI polish
Plan: `docs/superpowers/plans/2026-07-11-radix-ui-polish.md`
Next action: Establish Radix Themes, semantic tokens, and reusable page, feedback, data, status, and pagination patterns.
Owned paths:

- `assets/package.json`
- `assets/bun.lock`
- `assets/src/ui/**`
- `assets/test/ui/**`
- `docs/work/frontend-radix-ui-polish.md`

Prerequisites:

- The approved design spec and implementation plan are committed.

Verification:

- `cd assets && bun x vitest run test/ui`
- `cd assets && bun run typecheck`
- `cd assets && bun run build`
- `git diff --check`

Exit condition: The shared Radix-backed UI foundation is reusable by every route family with green focused verification.
```

Leave the three existing ready rows numbered 1-3 without changing their status or content. Confirm those three rows remain `ready` while this row is `active` under the separate `Active Work` heading.

- [ ] **Step 4: Validate the dispatch boundary**

Run: `mix work_queue.validate`

Expected: exit 0 with the active UI row accepted and three unrelated ready rows preserved.

- [ ] **Step 5: Commit the coordinator boundary**

```bash
git add docs/work/index.md docs/work/frontend-radix-ui-polish.md docs/plans/INDEX.md
git commit -m "docs: dispatch Radix UI polish foundation"
```

---

### Task 2: Establish Radix Theme, Tokens, and Shared Page Patterns

**Files:**
- Modify: `assets/package.json`
- Modify: `assets/bun.lock`
- Modify: `assets/src/ui/theme/theme.css`
- Modify: `assets/src/ui/theme/tokens.stylex.ts`
- Modify: `assets/src/ui/providers/app-providers.tsx`
- Modify: `assets/src/ui/primitives/button.tsx`
- Create: `assets/src/ui/primitives/collapsible.tsx`
- Create: `assets/src/ui/components/layout/page-shell.tsx`
- Create: `assets/src/ui/components/layout/section-heading.tsx`
- Create: `assets/src/ui/components/feedback/feedback-state.tsx`
- Create: `assets/src/ui/components/data/data-list.tsx`
- Create: `assets/src/ui/components/navigation/pagination.tsx`
- Create: `assets/src/ui/components/status/status-badge.tsx`
- Modify: `assets/test/ui/app-providers.test.tsx`
- Modify: `assets/test/ui/primitives.test.tsx`
- Create: `assets/test/ui/page-patterns.test.tsx`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: Radix Themes `Theme`, `Button`, `Badge`, and `Callout`; Radix Collapsible primitives; current StyleX compilation.
- Produces: `PageShell`, `SectionHeading`, `FeedbackState`, `DataList`, `DataListItem`, `Pagination`, `StatusBadge`, and a Radix-backed `Button` with the existing `ButtonProps` export.

- [ ] **Step 1: Install the Radix dependencies**

Run:

```bash
cd assets
bun add @radix-ui/themes @radix-ui/react-collapsible
```

Expected: `package.json` and `bun.lock` include both packages and Bun exits 0.

- [ ] **Step 2: Write failing provider and primitive tests**

Update `assets/test/ui/app-providers.test.tsx` to assert the rendered wrapper contains Radix Theme's `radix-themes` class and `data-accent-color="indigo"`. Update `assets/test/ui/primitives.test.tsx` to retain the existing link-semantic assertion and add:

```tsx
test("Button defaults to a native button while using Radix Themes", () => {
  render(<Button>Apply</Button>);

  const button = screen.getByRole("button", { name: "Apply" });
  expect(button).toHaveAttribute("type", "button");
  expect(button).toHaveAttribute("data-slot", "button");
  expect(button).toHaveClass("rt-BaseButton");
});
```

- [ ] **Step 3: Run the provider and primitive tests to verify RED**

Run: `cd assets && bun x vitest run test/ui/app-providers.test.tsx test/ui/primitives.test.tsx`

Expected: FAIL because `AppProviders` does not render Radix `Theme` and `Button` does not use the Radix Themes implementation.

- [ ] **Step 4: Implement the Radix provider and semantic theme**

Import `@radix-ui/themes/styles.css` before `theme.css`. Compose the provider as:

```tsx
<DirectionProvider dir="ltr">
  <Theme
    accentColor="indigo"
    appearance="light"
    grayColor="slate"
    panelBackground="solid"
    radius="medium"
    scaling="100%"
  >
    <div {...stylex.props(styles.root)} data-theme="default">
      {children}
    </div>
  </Theme>
</DirectionProvider>
```

In `theme.css`, alias Radix variables under `:root`:

```css
:root {
  --pc-surface-canvas: var(--gray-1);
  --pc-surface-raised: var(--color-panel-solid);
  --pc-surface-muted: var(--gray-2);
  --pc-surface-interactive: var(--accent-2);
  --pc-text-primary: var(--gray-12);
  --pc-text-secondary: var(--gray-11);
  --pc-text-subtle: var(--gray-9);
  --pc-text-inverted: white;
  --pc-border-quiet: var(--gray-5);
  --pc-border-standard: var(--gray-6);
  --pc-border-emphasized: var(--gray-8);
  --pc-action-accent: var(--accent-9);
  --pc-action-accent-hover: var(--accent-10);
  --pc-price-positive: var(--green-11);
  --pc-coupon: var(--amber-11);
  --pc-warning: var(--orange-11);
  --pc-unavailable: var(--gray-10);
  --pc-page-max: 80rem;
  --pc-reading-max: 44rem;
  --pc-nav-height: 4.25rem;
  --pc-route-space: clamp(1.25rem, 3vw, 2.5rem);
  --pc-control-height: 2.5rem;
}
```

Also add box sizing, body background, heading balance, focus-visible, link underline-offset, and reduced-motion rules. Keep `--pc-surface`, `--pc-text`, and `--pc-border` as compatibility aliases until every route is migrated.

- [ ] **Step 5: Implement the Radix-backed Button**

Wrap `Button` from `@radix-ui/themes`, preserve `asChild`, set `type="button"` only for native-button rendering, and always set `data-slot="button"`. Export `ButtonProps` from the Radix component prop type plus the current `asChild` contract.

- [ ] **Step 6: Run provider and primitive tests to verify GREEN**

Run: `cd assets && bun x vitest run test/ui/app-providers.test.tsx test/ui/primitives.test.tsx`

Expected: all tests pass.

- [ ] **Step 7: Write failing shared-pattern tests**

Create `assets/test/ui/page-patterns.test.tsx` with tests that assert:

```tsx
test("PageShell connects its title and keeps actions in the header", () => {
  render(
    <PageShell title="Offers" description="Review current merchant offers" actions={<button>Filter</button>}>
      <p>Rows</p>
    </PageShell>
  );

  const region = screen.getByRole("region", { name: "Offers" });
  expect(within(region).getByText("Review current merchant offers")).toBeInTheDocument();
  expect(within(region).getByRole("button", { name: "Filter" })).toBeInTheDocument();
});

test("FeedbackState preserves status and alert semantics", () => {
  const { rerender } = render(<FeedbackState kind="loading" title="Loading offers" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading offers");

  rerender(<FeedbackState kind="error" title="Offers unavailable" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Offers unavailable");
});

test("Pagination exposes one navigation landmark", () => {
  render(<Pagination label="Offer pages" firstHref="/offers" nextHref="/offers?after=next" />);
  expect(screen.getByRole("navigation", { name: "Offer pages" })).toBeInTheDocument();
});
```

Add equivalent assertions for `StatusBadge` text and `DataList` list semantics.

- [ ] **Step 8: Run the shared-pattern tests to verify RED**

Run: `cd assets && bun x vitest run test/ui/page-patterns.test.tsx`

Expected: FAIL because the shared modules do not exist.

- [ ] **Step 9: Implement the shared components**

Implement the interfaces exactly:

```ts
type PageShellProps = PropsWithChildren<{
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  width?: "app" | "reading";
}>;

type FeedbackStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  kind: "empty" | "error" | "loading" | "success" | "warning";
  title: string;
};

type PaginationProps = {
  firstHref?: string | null;
  firstLabel?: string;
  label: string;
  nextHref?: string | null;
  nextLabel?: string;
};

type StatusTone = "accent" | "danger" | "neutral" | "positive" | "warning";
```

`FeedbackState` must use Radix `Callout.Root` and select `role="alert"` only for `error`; the other kinds use `role="status"` only when their current route contract requires live status. `StatusBadge` must use Radix `Badge`. `Pagination` must render a `<nav>` and Radix-backed link buttons. `DataList` and `DataListItem` remain semantic `ul`/`li` layout components because Radix has no list behavior to replace.

- [ ] **Step 10: Run the complete UI suite and static gates**

Run:

```bash
cd assets
bun x vitest run test/ui
bun run typecheck
bun run build
```

Expected: all UI tests pass, TypeScript exits 0, and client plus SSR builds exit 0.

- [ ] **Step 11: Record evidence and commit**

Record RED/GREEN commands and results under Batch 1 in `docs/work/frontend-radix-ui-polish.md`, mark Batch 1 done, and promote Batch 2 in the lane doc.

```bash
git add assets/package.json assets/bun.lock assets/src/ui assets/test/ui docs/work/frontend-radix-ui-polish.md
git commit -m "feat: establish Radix UI foundation"
```

---

### Task 3: Polish the Application Shell and Home

**Files:**
- Modify: `assets/src/ui/components/layout/app-shell.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/test/ui/app-shell.test.tsx`
- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: `PageShell`, semantic tokens, Radix-backed `Button`, and existing viewer-aware destination arrays.
- Produces: responsive primary shell, active destination styling through `NavLink`, and expressive home shopper paths without changing route availability.

- [ ] **Step 1: Promote and claim the shell row**

Replace the completed foundation row in `docs/work/index.md` with an `active` shell-and-home row covering only the files in this task, leaving the three unrelated ready rows unchanged. Run `mix work_queue.validate`; expect exit 0.

- [ ] **Step 2: Write failing shell and home tests**

Add assertions that the shell has a `data-slot="app-shell"` wrapper, the current navigation link receives `aria-current="page"`, the home route has one labeled `Shopper paths` list, and the authenticated destinations remain available but outside that primary list.

- [ ] **Step 3: Run focused tests to verify RED**

Run: `cd assets && bun x vitest run test/ui/app-shell.test.tsx test/routes/root.route.test.tsx`

Expected: FAIL because active navigation and the new home structure are absent.

- [ ] **Step 4: Implement the shell and home composition**

Use `NavLink` for destination links and derive `aria-current` from its active state. Keep the brand link as a Radix-backed button/link. In `AppShell`, use a sticky raised surface, quiet bottom border, responsive wrapping, and a constrained inner width. In `RootRoute`, use `PageShell` plus three shopper-path items for browse, compare, and offers; render secondary/auth actions in a quieter action band.

- [ ] **Step 5: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/ui/app-shell.test.tsx test/routes/root.route.test.tsx
bun run typecheck
bun run build
```

Expected: focused tests, TypeScript, and both builds pass.

- [ ] **Step 6: Record evidence and commit**

```bash
git add assets/src/ui/components/layout/app-shell.tsx assets/src/routes/root.tsx assets/test/ui/app-shell.test.tsx assets/test/routes/root.route.test.tsx docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish application shell and home"
```

---

### Task 4: Polish Catalog Browse and Product Detail

**Files:**
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify: `assets/src/routes/catalog/filter-form.tsx`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/product-attribute-list.tsx`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: `PageShell`, `SectionHeading`, `FeedbackState`, `DataList`, `Pagination`, `StatusBadge`, Radix form controls, and Radix Collapsible.
- Produces: grouped catalog controls, readable product rows, aligned specification groups, and stable product decision actions.

- [ ] **Step 1: Promote and claim the catalog row**

Replace the completed shell row with an active catalog row covering the paths above. Preserve three unrelated ready rows and run `mix work_queue.validate` successfully.

- [ ] **Step 2: Write failing catalog presentation tests**

Add behavior assertions that the browse route exposes one `Filter products` form, an `Advanced filters` disclosure with `aria-expanded`, a `Products` labeled list, and a labeled action group inside each product article. Add product-detail assertions for `Product overview`, `Specifications`, and `Active offers` regions while retaining all existing links and offer semantics.

- [ ] **Step 3: Run focused tests to verify RED**

Run: `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`

Expected: FAIL on the new region and disclosure expectations.

- [ ] **Step 4: Implement grouped Radix filters**

Keep search, sort, page size, and type controls always visible. Put use-case, numeric, boolean, and enum fields inside `Collapsible.Root` with a `Collapsible.Trigger asChild` Radix button labeled `Advanced filters`. Keep `CatalogActiveFilterSummary` outside the collapsible so active state is always visible. Use Radix `TextField`, `Select`, and `Checkbox` controls with the existing field names and values.

- [ ] **Step 5: Implement product browse hierarchy**

Wrap the route in `PageShell`. Render product results with `DataList`; each article uses product name as the dominant heading, brand and slug as compact metadata, specification highlights as an aligned definition list, and decision links in one named action zone. Preserve selected-compare behavior and URLs exactly.

- [ ] **Step 6: Implement product-detail hierarchy**

Use `PageShell` for product identity and decision actions. Render `ProductAttributeList` as grouped semantic definition lists with stable label/value columns. Use `FeedbackState` for not-found, product-unavailable, and offers-unavailable states. Use `Pagination` for product-offer pages without changing cursor paths.

- [ ] **Step 7: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx
bun run typecheck
bun run build
```

Expected: all focused tests, TypeScript, and both builds pass.

- [ ] **Step 8: Record evidence and commit**

```bash
git add assets/src/routes/catalog assets/src/routes/products assets/test/routes/catalog/browse.route.test.tsx assets/test/routes/products/detail.route.test.tsx docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish catalog and product detail UI"
```

---

### Task 5: Polish Merchant and Offer Discovery

**Files:**
- Modify: `assets/src/routes/merchants/index.tsx`
- Modify: `assets/src/routes/offers/index.tsx`
- Modify: `assets/src/routes/offers/filters.tsx`
- Modify: `assets/src/routes/offers/tracked-commerce-click.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: page, data-list, feedback, status, pagination, and Radix form patterns.
- Produces: compact merchant rows, readable offer rows, semantic price/coupon/activity emphasis, and coherent visible-page snapshot metrics.

- [ ] **Step 1: Promote and claim the discovery row**

Replace the completed catalog row with an active merchant-and-offers row, preserve the ready floor, and run `mix work_queue.validate` successfully.

- [ ] **Step 2: Write failing discovery presentation tests**

Add merchant assertions for a labeled directory list, compact website action zone, and shared pagination landmark. Add offer assertions for a labeled `Visible offer snapshot` definition list, `StatusBadge` text for activity, one named action zone per offer, and preserved price/coupon/history labels.

- [ ] **Step 3: Run focused tests to verify RED**

Run: `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx`

Expected: FAIL because shared list/status/pagination patterns are not present.

- [ ] **Step 4: Implement merchant discovery polish**

Use `PageShell`, Radix `Select`, and Radix `Button` for page-size controls. Render merchants with `DataList`, keep unsafe domains text-only, and use `Pagination` for first/next links. Preserve all current domain normalization behavior.

- [ ] **Step 5: Implement offer controls and rows**

Use Radix form controls in `OfferDiscoveryFilterForm` while preserving names, default values, and GET behavior. Render snapshot metrics in one divided definition list. Use `StatusBadge` for active/inactive text, emphasize valid current prices through semantic tokens, group observation and coupon context, and keep tracked merchant actions behaviorally unchanged.

- [ ] **Step 6: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx
bun run typecheck
bun run build
```

Expected: focused tests, TypeScript, and both builds pass.

- [ ] **Step 7: Record evidence and commit**

```bash
git add assets/src/routes/merchants assets/src/routes/offers assets/test/routes/merchants/merchant-directory.route.test.tsx assets/test/routes/offers/offer-discovery.route.test.tsx docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish merchant and offer discovery UI"
```

---

### Task 6: Polish Comparison and Saved Comparisons

**Files:**
- Modify: `assets/src/routes/compare/compare-shell.tsx`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/product-list.tsx`
- Modify: `assets/src/routes/compare/product-picker.tsx`
- Modify: `assets/src/routes/compare/selection-tray.tsx`
- Modify: `assets/src/routes/compare/decision-summary.tsx`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/compare/error-boundary.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: shared page, feedback, status, data-list, pagination, Radix Tabs, form controls, and buttons.
- Produces: accessible specification-mode tabs, horizontally scrollable comparison table, readable selection tray, and structured saved-set rows.

- [ ] **Step 1: Promote and claim the comparison row**

Replace the completed discovery row with an active comparison row, preserve the ready floor, and run `mix work_queue.validate` successfully.

- [ ] **Step 2: Write failing comparison presentation tests**

Assert `Specification views` exposes Radix tab semantics with the selected mode, the matrix remains a table inside a horizontal scroll region, each compared product has one action group, the selection tray remains a named region, and saved sets render in a labeled data list with scoped reopen/delete actions.

- [ ] **Step 3: Run focused tests to verify RED**

Run: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`

Expected: FAIL on tab and shared-layout assertions while existing behavior assertions continue to pass.

- [ ] **Step 4: Implement comparison navigation and matrix layout**

Replace the specification-mode list with Radix Themes `Tabs.Root`/`Tabs.List` and `Tabs.Trigger` composed with React Router links so navigation remains URL-driven. Keep the comparison `<table>` and wrap it in a focusable region labeled `Specification comparison`; do not convert cells to cards at narrow widths.

- [ ] **Step 5: Implement comparison supporting patterns**

Make `CompareShell` delegate to `PageShell`. Restyle the selection tray as a compact raised action band, decision summary as an aligned definition list, product picker with Radix fields/buttons, and product summaries with divided rows. Use `FeedbackState` for route errors and mutation errors without changing live-region behavior.

- [ ] **Step 6: Implement saved-comparison hierarchy**

Use Radix text field and select controls for visible-page filter and sort. Render saved sets through `DataList`, preserve stored product-name/slug order, and keep delete buttons scoped and disabled while pending. Use shared pagination and feedback patterns.

- [ ] **Step 7: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx
bun run typecheck
bun run build
```

Expected: focused tests, TypeScript, and both builds pass.

- [ ] **Step 8: Record evidence and commit**

```bash
git add assets/src/routes/compare assets/test/routes/compare/compare.route.test.tsx assets/test/routes/compare/saved-comparisons-route-state.test.tsx docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish comparison workspace UI"
```

---

### Task 7: Polish Operational Routes

**Files:**
- Modify: `assets/src/routes/affiliate/setup/index.tsx`
- Modify: `assets/src/routes/commerce/revenue/index.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/index.tsx`
- Modify: `assets/src/routes/account/api-tokens/index.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: shared page, section, feedback, data-list, status, pagination, and Radix form controls.
- Produces: compact operational forms and data rows with explicit status and action zones.

- [ ] **Step 1: Promote and claim the operational row**

Replace the completed comparison row with an active operational row, preserve the ready floor, and run `mix work_queue.validate` successfully.

- [ ] **Step 2: Write failing operational presentation tests**

For each route, assert a `PageShell`-backed labeled region, named form sections, semantic status text through `StatusBadge` where applicable, and one action zone per operational record. Preserve every existing mutation, filter, date, paging, and one-time-secret assertion.

- [ ] **Step 3: Run focused tests to verify RED**

Run:

```bash
cd assets
bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx
```

Expected: FAIL only on the new composition assertions.

- [ ] **Step 4: Implement affiliate and revenue layouts**

Group affiliate network, program, link, and coupon forms into named sections with concise selected-merchant context and Radix controls. Keep all mutations and payload feedback intact. Render revenue filters as one compact control band, date presets as grouped link buttons, and metrics as an aligned definition list with suppression states clearly labeled.

- [ ] **Step 5: Implement feed-candidate workspace**

Use a compact filter band, page review summary, and divided candidate rows. Keep fit score, status, review metadata, notes, and actions in predictable columns or labeled groups. Use `StatusBadge` and Radix text areas/buttons while retaining trimmed-note and revalidation behavior.

- [ ] **Step 6: Implement API-token workspace**

Use a focused create-token section, preserve one-time-token Callout visibility, and render token records as structured rows with status, dates, prefix, and scoped rotate/revoke actions. Keep expired-token restrictions, pagination, filters, expiry presets, and duplicate-submit protection unchanged.

- [ ] **Step 7: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx
bun run typecheck
bun run build
```

Expected: all focused tests, TypeScript, and both builds pass.

- [ ] **Step 8: Record evidence and commit**

```bash
git add assets/src/routes/affiliate/setup assets/src/routes/commerce/revenue assets/src/routes/ingestion/feed-candidates assets/src/routes/account/api-tokens assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx assets/test/routes/account/api-tokens/api-tokens.route.test.tsx docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish operational frontend UI"
```

---

### Task 8: Polish All Authentication Routes

**Files:**
- Modify: `assets/src/routes/auth/form-shell.tsx`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/logout.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Modify: `assets/test/routes/auth/form-shell.test.tsx`
- Modify: `assets/test/routes/auth/session.route.test.tsx`
- Modify: `assets/test/routes/auth/recovery.route.test.tsx`
- Modify: `docs/work/index.md`
- Modify: `docs/work/frontend-radix-ui-polish.md`

**Interfaces:**
- Consumes: Radix Theme, TextField, Button, Link, Callout, and shared semantic tokens.
- Produces: one narrow accessible auth composition used by login, logout, registration, password recovery/reset, and email verification.

- [ ] **Step 1: Promote and claim the auth row**

Replace the completed operational row with an active auth row, preserve the ready floor, and run `mix work_queue.validate` successfully.

- [ ] **Step 2: Write failing auth-shell tests**

Extend `form-shell.test.tsx` to assert that auth fields use Radix TextField markup, global errors render through an alert Callout, success uses a status Callout, footer links retain link semantics, and the form shell remains labeled by its heading.

- [ ] **Step 3: Run auth tests to verify RED**

Run: `cd assets && bun x vitest run test/routes/auth/form-shell.test.tsx test/routes/auth/session.route.test.tsx test/routes/auth/recovery.route.test.tsx`

Expected: FAIL on Radix field and Callout assertions.

- [ ] **Step 4: Implement the shared auth composition**

Replace custom input/button/error/success styling with Radix `TextField.Root`, the shared Radix-backed `Button`, and `Callout.Root`. Preserve `name`, `id`, `required`, `autoComplete`, `aria-invalid`, `aria-describedby`, field-specific error filtering, pending labels, and live-region roles. Keep the panel narrow and visually raised with semantic tokens.

- [ ] **Step 5: Align all auth route content**

Keep each route's existing mutation and viewer-store behavior. Ensure every route supplies concise title/description copy, uses the shared field and submit components, and exposes recovery or return links through the shared footer.

- [ ] **Step 6: Run focused and static verification**

Run:

```bash
cd assets
bun x vitest run test/routes/auth/form-shell.test.tsx test/routes/auth/session.route.test.tsx test/routes/auth/recovery.route.test.tsx
bun run typecheck
bun run build
```

Expected: all auth tests, TypeScript, and both builds pass.

- [ ] **Step 7: Record evidence and commit**

```bash
git add assets/src/routes/auth assets/test/routes/auth docs/work/index.md docs/work/frontend-radix-ui-polish.md
git commit -m "feat: polish authentication UI"
```

---

### Task 9: Run Full Verification and Close the UI Milestone

**Files:**
- Modify: `docs/work/frontend-radix-ui-polish.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**
- Consumes: all completed UI milestones.
- Produces: complete verification evidence, a closed lane, and a dispatch index that still contains at least three ready implementation rows.

- [ ] **Step 1: Run the complete frontend behavior suite**

Run: `cd assets && bun run test:unit`

Expected: exit 0 with zero failed tests.

- [ ] **Step 2: Run generated-contract and static checks**

Run:

```bash
cd assets
bun run relay
bun run typecheck
```

Expected: Relay reports no invalid artifacts and TypeScript exits 0.

- [ ] **Step 3: Run the production build gate**

Run: `cd assets && bun run build`

Expected: client and SSR Vite builds both exit 0.

- [ ] **Step 4: Run repository hygiene checks**

Run:

```bash
git diff --check
mix work_queue.validate
```

Expected: both commands exit 0.

- [ ] **Step 5: Review representative responsive compositions**

Without changing product behavior, inspect rendered wide and narrow layouts for home, product browse, product detail, offers, compare, affiliate setup, API tokens, login, and one error/empty state. Confirm navigation remains usable, tables preserve column relationships, actions remain reachable, active filters remain visible, and no route falls back to unstyled prototype markup.

- [ ] **Step 6: Close the lane and preserve queue depth**

In `docs/work/frontend-radix-ui-polish.md`, set status to done and record exact test counts and command results. Remove the completed active UI row from `docs/work/index.md` only after confirming at least three other complete ready rows remain. Move the plan bullet from active plans to the completed archive in `docs/plans/INDEX.md`.

- [ ] **Step 7: Commit milestone completion**

```bash
git add docs/work/frontend-radix-ui-polish.md docs/work/index.md docs/plans/INDEX.md
git commit -m "docs: record Radix UI polish completion"
```

---

## Blocker and Fallback Rules

- If Bun cannot install Radix Themes because of restricted network access, request network approval for `bun add`; do not replace Radix with a custom component library.
- If a Radix Themes form control cannot preserve a current native GET-form contract, use the corresponding Radix primitive with its `name`/value contract. If neither preserves behavior, retain the native element, style it through semantic tokens, and record the exact exception in the lane doc.
- If a visual refactor requires a GraphQL field or backend change, stop that route milestone and record the need; do not widen this presentation-layer plan.
- If an existing behavior test fails before a route milestone changes its files, determine whether it is baseline drift before modifying production code.
- If the work queue cannot keep three other valid ready rows, stop at the coordinator boundary and replenish from verified code and lane evidence before claiming the next UI milestone.

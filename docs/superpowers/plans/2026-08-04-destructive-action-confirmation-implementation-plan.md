# Destructive Action Confirmation Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an explicit, accessible confirmation before four currently one-click irreversible account and comparison actions invoke their existing GraphQL mutations.

**Architecture:** Add one project-local `DestructiveActionDialog` backed by Radix AlertDialog. Route components supply entity-specific copy and keep mutation, pending, error, and success ownership; the dialog owns only modal confirmation semantics and StyleX presentation.

**Tech Stack:** React 19, TypeScript, Radix AlertDialog, Radix Themes buttons, StyleX, Vitest, Testing Library, Vite.

## Global Constraints

- Cover exactly public comparison-link revocation, saved-comparison deletion,
  API-token revocation, and price-watch deletion.
- Opening or canceling a dialog must not invoke a mutation; explicit confirm
  invokes the unchanged callback exactly once with the selected entity.
- Preserve all current row-scoped pending, error, success, and concurrent-row
  behavior after confirmation.
- Use Radix AlertDialog and StyleX; do not extend the creation-oriented
  `ActionDialog` or add route-local modal implementations.
- Keep community removal, API-token rotation, non-destructive toggles, backend
  mutation behavior, and confirmation-by-typed-text out of scope.
- Preserve accessible names, keyboard behavior, focus containment, cancel focus
  restoration, and client/SSR rendering.

---

### Task 1: Add The Shared Destructive Confirmation Boundary

**Files:**

- Modify: `assets/package.json`
- Modify: `assets/pnpm-lock.yaml`
- Create: `assets/src/ui/components/overlays/DestructiveActionDialog.tsx`
- Create: `assets/test/ui/destructive-action-dialog.test.tsx`

**Interfaces:**

- Consumes: a React trigger element, title and description nodes, a confirm
  label, an optional disabled state, and an `onConfirm: () => void` callback.
- Produces: `DestructiveActionDialog`, an uncontrolled Radix AlertDialog that
  closes on cancel or confirm and calls `onConfirm` only from the explicit
  danger action.

- [x] **Step 1: Add the failing dialog behavior tests**

Render a trigger named `Revoke access`, title `Revoke API token?`, description
`Existing integrations will stop working.`, cancel action `Cancel`, and confirm
action `Revoke token`. Assert opening exposes one `alertdialog` without calling
`onConfirm`, cancel closes it and restores focus to the trigger, and reopening
then confirming calls `onConfirm` exactly once.

- [x] **Step 2: Run the dialog test and verify RED**

```bash
cd assets && bun x vitest run test/ui/destructive-action-dialog.test.tsx
```

Expected: FAIL because `DestructiveActionDialog` does not exist.

- [x] **Step 3: Add the direct dependency and minimal component**

Add `@radix-ui/react-alert-dialog` at the lockfile's existing `1.1.23` version.
Implement this public shape:

```tsx
type DestructiveActionDialogProps = {
  confirmLabel: string;
  description: ReactNode;
  disabled?: boolean;
  onConfirm: () => void;
  title: string;
  trigger: ReactElement;
};
```

Compose Radix `Root`, `Trigger`, `Portal`, `Overlay`, `Content`, `Title`,
`Description`, `Cancel`, and `Action`. Use the project `Button` with soft cancel
and danger confirmation variants. Keep all overlay/content/action styling in
this file with StyleX.

- [x] **Step 4: Run the dialog test and verify GREEN**

```bash
cd assets && bun x vitest run test/ui/destructive-action-dialog.test.tsx
```

Expected: PASS with open, cancel, focus-restoration, and single-confirm
behavior observed through the real component.

- [x] **Step 5: Commit the shared boundary**

```bash
git add assets/package.json assets/pnpm-lock.yaml assets/src/ui/components/overlays/DestructiveActionDialog.tsx assets/test/ui/destructive-action-dialog.test.tsx
git commit -m "feat: add destructive action dialog"
```

### Task 2: Confirm The Four Irreversible Route Actions

**Files:**

- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Modify: `assets/src/routes/compare/SavedComparisonSetList.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Modify: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `assets/test/routes/compare/compare-relay-migration.test.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Modify: `docs/work/frontend-destructive-action-confirmation.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`
- Modify: `docs/superpowers/plans/2026-08-04-destructive-action-confirmation-implementation-plan.md`

**Interfaces:**

- Consumes: `DestructiveActionDialog` from Task 1 and each route's existing
  row-scoped callback and pending state.
- Produces: four labeled cancel/confirm boundaries that call the same existing
  callbacks with the same snapshot, saved-set ID, token ID, or watch value.

- [x] **Step 1: Add failing route-level confirmation tests**

For each surface, click the existing danger trigger and assert the relevant
callback or mutation has not run. Assert an entity-specific dialog title and
consequence description, cancel without a call, reopen, confirm once, and then
retain the suite's existing pending/error/success assertions.

Use these titles and confirmation labels:

| Surface | Title | Confirm label |
| --- | --- | --- |
| Public snapshot | `Revoke this public link?` | `Revoke public link` |
| Saved comparison | `Delete this saved comparison?` | `Delete comparison` |
| API token | `Revoke this API token?` | `Revoke token` |
| Price watch | `Delete this price watch?` | `Delete price watch` |

- [x] **Step 2: Run the four route suites and verify RED**

```bash
cd assets && bun x vitest run test/routes/compare/comparison-snapshots.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/account/alerts/alerts.route.test.tsx
```

Expected: FAIL because every current danger trigger invokes its callback on the
first click and renders no confirmation dialog.

- [x] **Step 3: Wrap the existing danger actions**

Import `DestructiveActionDialog` directly in each route owner. Pass the current
danger button as `trigger`, derive consequence copy from the visible entity
label where useful, bind `disabled` to the existing row pending state, and move
only the existing callback invocation into `onConfirm`. Do not move mutation
state or GraphQL response handling into the dialog.

- [x] **Step 4: Run the focused confirmation suites and verify GREEN**

```bash
cd assets && bun x vitest run test/ui/destructive-action-dialog.test.tsx test/routes/compare/comparison-snapshots.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/account/alerts/alerts.route.test.tsx
```

Expected: all focused tests pass with explicit confirmation and unchanged
post-confirm behavior.

- [x] **Step 5: Run full verification and close the lane**

```bash
cd assets && bun run check
mix work_queue.validate
git diff --check
```

Record focused RED/GREEN evidence, frontend test count, client and SSR builds,
bundle result, queue depth, and diff hygiene in the lane doc. Remove the
completed row only while at least three other ready rows remain, update the
candidate catalog and dated queue history, and mark this plan complete.

- [x] **Step 6: Commit the route adoption and evidence**

```bash
git add assets/src/routes/compare/ShareComparisonControl.tsx assets/src/routes/compare/SavedComparisonSetList.tsx assets/src/routes/account/api-tokens/ApiTokenItem.tsx assets/src/routes/account/alerts/AlertsRoute.tsx assets/test/routes/compare/comparison-snapshots.test.tsx assets/test/routes/compare/saved-comparisons-route-state.test.tsx assets/test/routes/compare/compare-relay-migration.test.tsx assets/test/routes/compare/compare.route.test.tsx assets/test/routes/account/api-tokens/api-tokens.route.test.tsx assets/test/routes/account/alerts/alerts.route.test.tsx docs/work/frontend-destructive-action-confirmation.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md docs/superpowers/plans/2026-08-04-destructive-action-confirmation-implementation-plan.md
git commit -m "feat: confirm irreversible frontend actions"
```

Exit condition: each in-scope danger trigger opens a labeled Radix AlertDialog,
cancel performs no mutation and restores focus, explicit confirmation invokes
the unchanged row action once, existing mutation state remains row-scoped, and
every frontend gate passes.

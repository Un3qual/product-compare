# Frontend Radix Primitives Adoption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adopt Radix primitives in the Bun frontend where they reduce accessibility risk and repetitive markup, while keeping the existing StyleX theme, layout language, and route structure intact.

**Architecture:** Add a small shared wrapper layer around the Radix primitives we actually need, then migrate the shell and auth forms to those wrappers first. Keep styling in StyleX and keep the current route/component structure; Radix should supply semantics, keyboard behavior, and focus management, not a new visual system. Defer anything that would turn this into a redesign, especially product/content routes that do not currently need new interactive primitives.

**Tech Stack:** Bun, React 19, React Router v7 SSR, StyleX, Radix UI, TypeScript, Vitest, Playwright.

---

### Task 1: Add the shared Radix primitive baseline

**Files:**
- Modify: `assets/package.json`
- Modify: `assets/bun.lock`
- Create: `assets/src/ui/primitives/button.tsx`
- Create: `assets/src/ui/primitives/label.tsx`
- Create: `assets/src/ui/primitives/separator.tsx`
- Create: `assets/src/ui/primitives/slot.tsx`
- Create: `assets/src/ui/primitives/index.ts`
- Create: `assets/src/ui/__tests__/primitives.test.tsx`

**Step 1: Write the failing tests**

Write a focused test file that renders the new wrappers and verifies the behavior we want from Radix, not just raw markup. Cover at least:
- `Label` still associates with inputs in auth forms.
- `Slot` preserves semantics for link-style buttons.
- `Separator` renders the correct accessibility role/orientation.

**Step 2: Run the tests to confirm they fail**

Run:
`cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx`

Expected: FAIL because the new wrappers and their exports do not exist yet.

**Step 3: Add the minimal implementation**

Install the missing Radix primitives and create thin StyleX-friendly wrappers that:
- keep the existing theme tokens and class-based styling approach,
- expose a stable local import path,
- avoid leaking Radix implementation details into route components.

**Step 4: Re-run the focused and global frontend checks**

Run:
`cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx`

Expected: PASS.

Run:
`cd assets && bun run typecheck`

Expected: PASS.

**Step 5: Commit the baseline as a single milestone**

Use a commit that includes the new wrappers, the dependency update, and the primitive tests together.

---

### Task 2: Migrate the app shell and root navigation to the shared primitives

**Files:**
- Modify: `assets/src/ui/components/layout/app-shell.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/ui/__tests__/app-shell.test.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`

**Step 1: Write the failing shell/navigation tests**

Extend the existing shell and root tests so they assert the accessible structure we want after the migration:
- the primary nav still renders as a landmark,
- the navigation uses the new Radix-backed wrappers where they reduce duplication,
- link-like actions still render as links, not buttons.

**Step 2: Run the tests to confirm the current code fails the new assertions**

Run:
`cd assets && bun x vitest run src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx`

Expected: FAIL because the shell still uses hand-rolled markup and no shared Radix wrappers.

**Step 3: Refactor the shell and root route**

Replace repeated ad hoc markup with the new wrapper layer. Keep the existing StyleX tokens and layout, but use Radix-backed primitives for the accessible pieces that benefit from them most:
- semantic labels or separators where they clarify structure,
- polymorphic link/button handling where one component is currently duplicating another,
- keyboard/focus behavior only where Radix buys real value.

**Step 4: Re-run the shell/navigation tests and the frontend suite**

Run:
`cd assets && bun x vitest run src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx`

Expected: PASS.

Run:
`cd assets && bun run test:unit`

Expected: PASS.

Run:
`cd assets && bun run typecheck`

Expected: PASS.

**Step 5: Commit the shell migration**

Use a commit that captures the shell/root refactor and the associated test updates.

---

### Task 3: Migrate the auth form shell to Radix-backed field primitives

**Files:**
- Modify: `assets/src/routes/auth/form-shell.tsx`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `assets/src/routes/auth/__tests__/form-shell.test.tsx`
- Modify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Modify: `assets/src/routes/auth/__tests__/recovery.route.test.tsx`

**Step 1: Write the failing auth-form tests**

Add a small focused test file for the form shell and extend the existing route tests so they assert:
- form labels still bind correctly to inputs,
- helper/error text keeps its accessible relationships,
- submit controls still work with the current GraphQL auth flows,
- no route-specific behavior regresses while the primitives change underneath.

**Step 2: Run the tests to confirm the current implementation fails the new assertions**

Run:
`cd assets && bun x vitest run src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

Expected: FAIL because the current auth shell is still hand-rolled.

**Step 3: Refactor the auth shell**

Switch the shared auth shell to the new Radix-backed primitives. Preserve the current StyleX panel layout and typed GraphQL error handling, but let Radix own the accessibility mechanics for labels, form control associations, and any polymorphic buttons or separators.

**Step 4: Re-run auth and frontend verification**

Run:
`cd assets && bun x vitest run src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

Expected: PASS.

Run:
`cd assets && bun run test:unit`

Expected: PASS.

Run:
`cd assets && bun run typecheck`

Expected: PASS.

**Step 5: Commit the auth-shell migration**

Use a commit that captures the auth shell refactor and its route-level test updates.

---

### Task 4: Verify the slice and document the remaining follow-ups

**Files:**
- Modify: `docs/work/frontend-radix-primitives.md` if the scope or status changes during implementation
- Modify: `docs/work/index.md` only if this slice becomes the active queue item in the repo-level index

**Step 1: Run the full frontend verification set**

Run:
`cd assets && bun run check`

Expected: PASS.

**Step 2: Spot-check the Radix surface area**

Confirm that the imported primitives are only the ones the frontend actually uses today. If a component is still plain HTML and does not gain accessibility or boilerplate value from Radix, leave it alone.

**Step 3: Record any deferred follow-up slice**

If a later screen clearly needs `Dialog`, `DropdownMenu`, `Popover`, `Tabs`, or other interactive primitives, add a new work item instead of widening this slice.

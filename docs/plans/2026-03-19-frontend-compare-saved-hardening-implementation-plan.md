# Frontend Compare And Saved Routes Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden the `/compare` and `/compare/saved` frontend routes with a shared responsive shell, accessible feedback semantics, and route-level error boundaries.

**Architecture:** Keep the work contained to `assets/src/routes/compare/` by introducing a small shared compare-shell component and a compare-scoped error boundary instead of widening the route architecture. Reuse the existing route-local loader/action helpers, preserve the repeated `slug` reopen contract, and register route-level `errorElement` fallbacks in `assets/src/router.tsx` so unexpected loader/render failures stop at the compare route boundary.

**Tech Stack:** Bun-installed frontend dependencies, TypeScript, React 19, React Router v7, StyleX, Vitest, GraphQL over `fetchGraphQL`.

---

## Task 1: Add A Shared Compare Route Shell

**Files:**
- Create: `assets/src/routes/compare/compare-shell.tsx`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing test**

```tsx
test("saved comparisons route exposes a named saved-set list and polite feedback region", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    savedSets: [{ id: "saved-set-1", name: "Desk setup", slugs: ["desk", "chair"] }]
  });

  render(
    <MemoryRouter>
      <SavedComparisonsRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("list", { name: "Saved comparison sets" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because the compare routes do not yet share a shell, name the saved-set list, or expose a live feedback region.

**Step 3: Write minimal implementation**

```tsx
export function CompareShell({ title, actions, children }: CompareShellProps) {
  return (
    <section {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h1>{title}</h1>
        {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare/compare-shell.tsx assets/src/routes/compare/index.tsx assets/src/routes/compare/saved.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): harden compare route shell"
```

## Task 2: Add Route-Level Compare Error Boundaries

**Files:**
- Create: `assets/src/routes/compare/error-boundary.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing test**

Note: The compare route loaders have mixed failure modes. `compareLoader` throws
when a product fetch is rejected (via `Promise.allSettled` + re-throw), and
`savedComparisonsLoader` throws when the GraphQL response cannot be parsed or
when the pagination cursor does not advance. Unauthorized responses are
converted to a `{ status: "unauthorized" }` status object instead of throwing.
The error boundary test below uses a synthetic throwing loader to verify that
the `errorElement` wiring renders the boundary component. Separate loader-level
tests cover the real throw paths (parse failure, stale cursor) and the
status-object paths (unauthorized, empty).

```tsx
test.each([
  ["/compare", "Compare"],
  ["/compare/saved", "Saved comparisons"]
])("route-level fallback renders for %s when the loader throws", async (path, title) => {
  const router = createMemoryRouter(
    [
      {
        path,
        loader: () => {
          throw new Error("boom");
        },
        element: path === "/compare" ? <CompareRoute /> : <SavedComparisonsRoute />,
        errorElement: <CompareErrorBoundary />
      }
    ],
    { initialEntries: [path] }
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByText("An unexpected error occurred while loading the comparison.")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because the compare routes do not yet register a compare-scoped error boundary.

**Step 3: Write minimal implementation**

```tsx
{
  path: "compare",
  loader: compareLoader,
  element: <CompareRoute />,
  errorElement: <CompareErrorBoundary />
},
{
  path: "compare/saved",
  loader: savedComparisonsLoader,
  element: <SavedComparisonsRoute />,
  errorElement: <CompareErrorBoundary />
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare/error-boundary.tsx assets/src/router.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): add compare route error boundaries"
```

## Task 3: Verify Compare Route Hardening

**Files:**
- Modify: `docs/work/frontend-compare-saved-hardening.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Step 1: Run focused verification**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
Expected: PASS with the compare-route hardening coverage green.

**Step 2: Run typecheck**

Run: `cd assets && bun run typecheck`
Expected: PASS.

**Step 3: Update the work docs**

```md
- Mark Task 1 and Task 2 complete in `docs/work/frontend-compare-saved-hardening.md`.
- Update the state of `docs/work/index.md` or advance it if new frontend queue follows immediately.
- Update `docs/plans/INDEX.md` so the active queue reflects the close-out and any next queued plan.
```

**Step 4: Commit**

```bash
git add docs/work/frontend-compare-saved-hardening.md docs/work/index.md docs/plans/INDEX.md
git commit -m "docs: close compare route hardening batch"
```

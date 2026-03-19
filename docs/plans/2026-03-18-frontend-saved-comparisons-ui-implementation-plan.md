# Frontend Saved Comparisons UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let authenticated users save current compare selections from the frontend, browse their saved sets, reopen them into `/compare`, and delete them.

**Architecture:** Keep the existing route-local frontend data pattern by adding compare-specific GraphQL helpers in `assets/src/routes/compare/` rather than introducing a broader data-layer rewrite. Reuse the backend `mySavedComparisonSets`, `createSavedComparisonSet`, and `deleteSavedComparisonSet` contract, and keep reopened comparisons encoded as repeated `slug` query params so the saved-set route stays aligned with the existing compare loader.

**Tech Stack:** Bun, TypeScript, React 19, React Router v7, Vitest, GraphQL over `fetchGraphQL`.

---

### Task 1: Add Compare Save Action

**Files:**
- Modify: `assets/src/routes/compare/api.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing test**

```tsx
test("compare route saves the current ready-state selection", async () => {
  render(<CompareRoute />);
  await userEvent.click(screen.getByRole("button", { name: /save comparison/i }));
  expect(fetchGraphQLMock).toHaveBeenCalledWith(
    expect.stringContaining("mutation CreateSavedComparisonSet"),
    expect.objectContaining({ input: expect.objectContaining({ productIds: expect.any(Array) }) }),
    undefined
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because the compare route has no save action or mutation helper yet.

**Step 3: Write minimal implementation**

```tsx
<button type="button" onClick={handleSave}>
  Save comparison
</button>
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare/api.ts assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): add compare save action"
```

### Task 2: Add Saved Comparison Route

**Files:**
- Create: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/compare/api.ts`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing test**

```tsx
test("saved comparisons route renders persisted sets with reopen links", async () => {
  render(<SavedComparisonsRoute />);
  expect(screen.getByRole("link", { name: /open comparison/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because no saved route or loader exists yet.

**Step 3: Write minimal implementation**

```tsx
<Link to={`/compare?${params.toString()}`}>Open comparison</Link>
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare/saved.tsx assets/src/router.tsx assets/src/routes/root.tsx assets/src/routes/compare/api.ts assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): add saved comparisons route"
```

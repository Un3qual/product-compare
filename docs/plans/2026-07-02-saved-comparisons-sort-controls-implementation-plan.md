# Saved Comparisons Sort Controls Implementation Plan

Goal: make `/compare/saved` easier to scan by adding client-side sorting for
loaded saved comparison sets.

Constraints and non-goals:

- Sort only loaded saved sets; do not change saved-comparison backend queries,
  pagination, mutations, or Relay schema.
- Preserve existing filtering, reopen links, delete behavior, unauthorized
  state, and empty/no-match return paths.
- Do not add public share links in this row.

Owned paths:

- `assets/src/routes/compare/saved.tsx`
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- `assets/test/routes/compare/saved-comparisons-test-helpers.ts`
- `docs/work/frontend-saved-comparisons-ui.md`

Batches:

1. Add tests for sorting visible saved sets by current order, name A-Z, product
   count high-to-low, and product count low-to-high.
2. Render a `Sort saved comparisons` control for authenticated saved-set views.
3. Apply sorting after local deletion and filter matching so status messages and
   no-match behavior remain correct.
4. Keep `Open comparison` URLs and delete pending state scoped to each saved
   set after sort changes.
5. Record completion evidence under
   `### Saved Comparisons Sort Controls Evidence`.

Verification:

- `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If helper fixtures already provide enough saved-set variation, update only the
  route-state test file and leave the helper unchanged.

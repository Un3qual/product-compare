# Task 6 Report: Merchant Directory View Extraction

## Scope

- Extracted merchant-directory presentation into `MerchantDirectoryView`.
- Kept the route responsible for Relay reads, error and suspense boundaries,
  connection normalization, safe external URL resolution, and pagination-path
  construction.

## Test-first evidence

- RED: `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  failed because the direct `MerchantDirectoryView` import was unresolved.
- RED: the strengthened empty-page contract failed until the new view retained
  the merchant workspace and controls around `FeedbackState`.
- GREEN: `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
  passed with 26 tests.
- TypeScript: `cd assets && bun run typecheck` passed.
- Diff hygiene: `git diff --check` passed.

## Files

- `assets/src/routes/merchants/MerchantDirectoryView.tsx`
- `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-discovery-demo-parity.md`

## Commit

- `HEAD` after the `extract merchant directory view` milestone commit.

## Concerns

- None. The empty page retains its existing workspace layout and page-size
  controls; URL safety remains route-owned and is passed to the view as a
  nullable prebuilt href.

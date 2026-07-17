# Task 61 Report: Catalog Sort Select Input Contract

## Outcome

Implemented `catalogProductSortFromValue` in the framework-free catalog filters
owner. It preserves `ID_ASC`, `NAME_ASC`, `BRAND_NAME_ASC`, and `NEWEST`; blank,
unknown, and future select values fall back to catalog order (`ID_ASC`).
`CatalogFilterForm` now routes only its raw select value through that normalizer.
Form state, sort-field omission, events, options, markup, and presentation were
not otherwise changed.

## TDD Evidence

Added `assets/test/routes/catalog/catalog-sort-input.test.ts` before production
code. The RED command was:

```text
cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts

Test Files  1 failed (1)
Tests  7 failed (7)
TypeError: catalogProductSortFromValue is not a function
```

The seven RED cases cover the four supported values and blank, unknown, and
future values. After the minimal switch and select wiring, the focused command
passed:

```text
cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/browse.route.test.tsx

Test Files  2 passed (2)
Tests  69 passed (69)
```

## Verification

- `cd assets && bun run typecheck` — passed (`tsc --noEmit`).
- Framework/transport scan of `assets/src/routes/catalog/filters.ts` for React,
  router, Relay, StyleX, Radix, and generated-query dependencies — no matches.
- `git diff --check` — passed.
- `cd assets && bun run check` — passed Relay validation, TypeScript, 101 test
  files / 1,383 tests, client and SSR builds, and the client bundle contract
  (596,339 raw / 182,139 gzip bytes; 200,000 gzip-byte budget).
- `mix work_queue.validate` — passed with `work queue valid: 3 ready rows`.
  The first sandboxed attempt could not open Mix PubSub's local TCP socket;
  rerunning with the required sandbox approval passed.

## Documentation and Queue

- Marked all Task 61 plan checkboxes complete and recorded validation evidence.
- Added completion evidence to `docs/work/frontend-catalog-sort-input.md`.
- Removed completed Task 61 from the live queue. The remaining ready rows are
  Root Viewer Projection, Affiliate Coupon Result Display Data, and Comparison
  Snapshot Pagination Cursor Data.
- Preserved the coordinator's pre-existing Task 64 promotion and its lane doc.

## Scoped Self-Review

- The normalizer is a total, explicit switch with a safe default.
- The existing URL normalization still omits `ID_ASC`, preserving its prior
  URL/default behavior.
- The form now has no unsafe sort-value assertion; no unrelated form behavior
  changed.
- No concerns identified.

## Commit

Initial milestone commit: `9051ae5d75af0b35b04bf46603d6c6e7780dca61`.
The final amended commit hash is recorded by the completion handoff after this
report update; including it here would itself create another amended hash.

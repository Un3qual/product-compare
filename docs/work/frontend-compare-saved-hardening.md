# Frontend Compare And Saved Routes Hardening Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-19 at `a194ef0` + working tree
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Definition of done:
  - `/compare` and `/compare/saved` share a responsive route shell rather than ad-hoc markup.
  - Save/delete feedback is exposed through accessible route-local status messaging.
  - Compare and saved-comparisons routes register route-level error boundaries for unexpected loader/render failures.
  - Focused frontend tests cover the hardened shell and error-boundary fallbacks without reopening unrelated route work.

## Verified Current State

- `assets/src/routes/compare/index.tsx` still renders the compare route directly from route-local loader data and save mutation state, but it does not yet use a shared compare-shell component.
- `assets/src/routes/compare/saved.tsx` now lists saved sets, reopens them into `/compare`, deletes them from local state, and prompts unauthenticated users to sign in, but it still uses bare markup and route-local copy only.
- `assets/src/router.tsx` now mounts both `/compare` and `/compare/saved`, but neither route registers a compare-scoped `errorElement`.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers loader, save, list, reopen, delete, and unauthorized states, but it does not yet lock route-shell accessibility semantics or route-level error boundaries.

## Next Batch

- Status: ready
- Batch: Task 1 from `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
- Why this batch:
  - The saved-comparisons UI is now shipped, so the next unblocked gap is quality hardening rather than new data plumbing.
  - A shared compare-shell component keeps the responsive/accessibility work contained to the compare route surface before adding boundary wiring.
  - Task 1 stays scoped to `assets/src/routes/compare/` and the existing compare route tests.

## Planned Follow-Up

- Task 2 adds compare-scoped route error boundaries after the shared shell and semantics land.
- Close this work doc after Task 2 verification unless new compare/saved UI scope is opened.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/router.tsx`
- `sed -n '1,360p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`

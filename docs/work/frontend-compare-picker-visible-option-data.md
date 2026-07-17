# Frontend Compare-Picker Visible-Option Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 119 passing focused tests and the full
  repository gate passing 771 backend and 1,300 frontend tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Picker Visible-Option Data Contract

- Status: done on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Outcome: the existing framework-free compare-picker data owner now returns
  normalized filter state, source-ordered visible options, and exact empty-
  state copy. Blank filters preserve the caller's option-array identity.
  `CompareProductPickerView` retains local state, generated IDs, input events,
  actions, markup, and presentation.
- Candidate evidence: current source inspection found these deterministic
  policies in the React view owner; its existing pure picker and compare-route
  suites pass 116 tests.
- Blockers: none.

## Boundaries

- Preserve existing picker option identity, href, and pagination policy.
- Keep filtering bounded to already-loaded option names.
- Preserve source order and input identity when no effective filter exists.
- Leave local state, generated IDs, input events, actions, markup, and
  presentation in `CompareProductPickerView`.

## Verification

- RED: the new pure cases failed because
  `buildComparePickerVisibleOptionsData` did not exist.
- `cd assets && bun x vitest run test/routes/compare/compare-picker-data.test.ts test/routes/compare/compare.route.test.tsx`
  passed 119 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, router, Relay,
  StyleX, or browser-global dependency in the pure compare-picker data module.
- `mix ci` passed 771 backend and 1,300 frontend tests, Relay validation,
  TypeScript, client and SSR builds, the 6/6 clone budget, and the 182,133-byte
  initial gzip bundle against the 200,000-byte budget.
- `git diff --check` passed.

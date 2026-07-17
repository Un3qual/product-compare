# Frontend Compare-Picker Visible-Option Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 116 passing
  compare-picker data and compare-route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Picker Visible-Option Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate filter normalization, case-insensitive visible-option
  selection, source-order preservation, and exact empty-state copy in the
  existing framework-free compare-picker data owner while retaining local
  state, generated IDs, input events, actions, markup, and presentation in
  `CompareProductPickerView`.
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

- `cd assets && bun x vitest run test/routes/compare/compare-picker-data.test.ts test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure compare-picker data module
- `git diff --check`

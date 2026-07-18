# Frontend Auth Global Error Visibility Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 10 passing focused auth errors and form-shell
  tests, TypeScript, dependency-boundary scans, and `git diff --check`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Auth Global Error Visibility Data Contract

- Status: completed on 2026-07-17.
- Delivered: `selectGlobalMutationErrors` now owns global-versus-rendered-field
  selection in the framework-free auth errors module; `AuthFormShell` delegates
  to it while retaining field rendering and feedback markup. The errors owner
  imports its viewer contract from the canonical pure viewer-data module rather
  than the route loader.
- Evidence: pure tests cover missing, null, blank, known, and unknown fields,
  source ordering, and input immutability; focused suites pass 10 tests. Its
  recursive relative-import closure contains only the errors, route-errors, and
  root viewer-data modules.
- Blockers: none.

## Boundaries

- Keep missing, null, blank, and unknown field errors globally visible.
- Exclude errors for fields rendered by the form.
- Preserve source error order and input values.
- Keep field rendering, error markup, accessibility behavior, and presentation
  in React.
- Keep the errors owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/auth/errors.test.ts test/routes/auth/form-shell.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the auth errors module
- `git diff --check`

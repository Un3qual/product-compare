# Frontend Auth Global Error Visibility Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 8 passing auth
  errors and form-shell tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Auth Global Error Visibility Data Contract

- Status: ready on 2026-07-17.
- Next action: move global-versus-rendered-field error selection into the
  existing framework-free auth errors owner.
- Candidate evidence: `AuthFormShell` currently creates the rendered-field set
  and filters global errors while `errors.ts` already owns mutation-error
  lookup and normalization; the focused suites pass 8 tests.
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

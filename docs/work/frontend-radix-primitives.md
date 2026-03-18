# Frontend Radix Primitives Work Doc

## Snapshot

- Status: completed on 2026-03-18
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 after frontend verification
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-radix-primitives-adoption-implementation-plan.md`
- Definition of done:
  - The frontend uses a small shared Radix wrapper layer for the interactive pieces that currently benefit from better semantics or focus behavior.
  - The current StyleX theme and layout language remain intact; Radix supplies accessibility and boilerplate reduction, not a redesign.
  - The app shell, root navigation, and auth form shell have focused tests that cover the new primitives without regressing existing route behavior.
  - The frontend verification commands pass after the migration.

## Final State

- `assets/package.json` and `assets/bun.lock` now include `@radix-ui/react-label`, `@radix-ui/react-separator`, and `@radix-ui/react-slot` alongside the existing Radix direction provider.
- `assets/src/ui/primitives/` now provides thin local `Button`, `Label`, `Separator`, and `Slot` wrappers that keep StyleX className usage intact and expose stable local imports for route components and tests.
- `assets/src/ui/components/layout/app-shell.tsx` now renders a shared `Separator`, and `assets/src/routes/root.tsx` now routes primary-nav and home action links through the shared `Button` wrapper without changing link semantics.
- `assets/src/routes/auth/form-shell.tsx` now uses the shared `Label`, `Button`, and `Slot` primitives so the auth shell keeps its current GraphQL flow while centralizing field/action accessibility behavior.
- Frontend coverage now includes `assets/src/ui/__tests__/primitives.test.tsx` and `assets/src/routes/auth/__tests__/form-shell.test.tsx`, plus updated shell/root/session/recovery tests that prove the shared primitive layer is actually in use.

## Completed Batch

1. Added the shared Radix primitive baseline and kept it StyleX-friendly.
2. Migrated the app shell and root navigation to the wrapper layer without changing the link semantics or layout language.
3. Migrated the auth form shell to Radix-backed field primitives while preserving the current GraphQL auth behavior.
4. Ran the focused frontend verification commands and the full frontend `check` gate.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-radix-primitives.md`
- `sed -n '1,260p' docs/plans/2026-03-18-frontend-radix-primitives-adoption-implementation-plan.md`
- `sed -n '1,220p' assets/package.json`
- `sed -n '1,220p' assets/src/ui/providers/app-providers.tsx`
- `sed -n '1,220p' assets/src/ui/components/layout/app-shell.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `sed -n '1,240p' assets/src/routes/auth/form-shell.tsx`
- `sed -n '1,220p' assets/src/ui/__tests__/app-providers.test.tsx`
- `sed -n '1,220p' assets/src/ui/__tests__/app-shell.test.tsx`
- `sed -n '1,260p' assets/src/routes/__tests__/root.route.test.tsx`
- `sed -n '1,240p' assets/src/routes/auth/__tests__/session.route.test.tsx`
- `sed -n '1,260p' assets/src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`

# Frontend Radix Primitives Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-radix-primitives-adoption-implementation-plan.md`
- Definition of done:
  - The frontend uses a small shared Radix wrapper layer for the interactive pieces that currently benefit from better semantics or focus behavior.
  - The current StyleX theme and layout language remain intact; Radix supplies accessibility and boilerplate reduction, not a redesign.
  - The app shell, root navigation, and auth form shell have focused tests that cover the new primitives without regressing existing route behavior.
  - The frontend verification commands pass after the migration.

## Verified Current State

- `assets/package.json` currently only includes `@radix-ui/react-direction` from Radix, and `assets/src/ui/providers/app-providers.tsx` only wraps `DirectionProvider`.
- `assets/src/ui/components/layout/app-shell.tsx` still uses hand-rolled StyleX markup for the primary nav.
- `assets/src/routes/root.tsx` still renders the home shell and primary links with plain `Link` elements and StyleX classes.
- `assets/src/routes/auth/form-shell.tsx` still implements labels, fields, and submit controls manually instead of using shared Radix-backed primitives.
- Existing frontend tests already cover the shell and auth routes in `assets/src/ui/__tests__/app-shell.test.tsx`, `assets/src/routes/__tests__/root.route.test.tsx`, `assets/src/routes/auth/__tests__/session.route.test.tsx`, and `assets/src/routes/auth/__tests__/recovery.route.test.tsx`.
- Historical planning already established StyleX + Radix as the intended frontend direction, so this slice should tighten the implementation around that direction rather than reopen the visual system.

## Next Batch

1. Add the shared Radix primitive baseline and keep it StyleX-friendly.
2. Migrate the app shell and root navigation to the new wrapper layer without changing the look and feel.
3. Migrate the auth form shell to Radix-backed field primitives and preserve the current GraphQL auth behavior.
4. Run the focused frontend verification commands and record any deferred follow-up primitives separately.

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
- `cd assets && bun run typecheck`
- `cd assets && bun run test:unit`
- `cd assets && bun run check`

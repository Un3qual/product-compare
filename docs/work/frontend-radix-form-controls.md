# Frontend Radix Form Controls

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-radix-form-controls-implementation-plan.md`
- Last verified: 2026-07-30 against the current route and UI primitive tree.

## Target Outcome

Visible frontend buttons and form controls use Radix Themes through thin
project-semantic wrappers wherever Radix provides a faithful equivalent.

## Validated Scope

- The existing project `Button` and `TextField` wrappers ultimately render raw
  HTML controls; `Button` uses Radix Slot only for `asChild`.
- Fifteen route modules contained 40 visible raw buttons, inputs, selects,
  text areas, checkboxes, or radio controls with direct Radix equivalents.
- Six other raw input declarations are hidden form transport fields and should remain
  native.
- The current architecture deliberately avoided the complete Radix Themes
  package before the later product decision to prefer its available Button and
  form controls. This batch implements that newer decision while retaining
  StyleX and the bundle contract.

## Boundaries

- Keep StyleX as the application styling layer.
- Preserve native form submission and SSR behavior.
- Do not migrate hidden transport inputs.
- Add no wrapper without at least one live semantic consumer.
- Do not test Radix private DOM details.

## Delivered

- Installed exact `@radix-ui/themes` and `@radix-ui/react-select` versions and
  replaced the obsolete standalone direction provider with one Radix Themes
  application boundary.
- Rebased the project `Button` and `TextField` wrappers on Radix Themes and
  added live-consumer-backed Checkbox, Radio, TextArea, and Select wrappers.
- Used the Radix Select primitive for the project Select wrapper because the
  route filters require an external empty-string option and exact hidden-field
  form submission. The wrapper translates that value internally without
  leaking the sentinel into URLs or form data.
- Migrated all 40 visible native controls while leaving the six hidden
  pagination, comparison, and preset transport inputs native.
- Expanded the architecture scan across all frontend source modules so a new
  visible raw `button`, `input`, `select`, or `textarea` fails the suite.
- Preserved StyleX as the application styling owner and kept all existing
  GET-form, controlled-state, reset, Relay, and SSR behavior.

## Verification

- Focused primitive and affected route suite: 249 tests passed.
- Visible raw-control architecture scan: passed across `assets/src`.
- `CI=true mise exec -- pnpm --dir assets run check`: passed.
  - Relay validation, TypeScript, Oxc lint, and formatting passed.
  - 106 test files and 1,516 tests passed.
  - Vite client and SSR production builds passed.
  - Initial JavaScript bundle contract passed at 191,525 gzip bytes against the
    200,000-byte budget.
- `git diff --check`: passed.

## Handoff

The Radix form-control migration is complete. Native controls remain only as
hidden form transport fields or inside the project Select implementation.

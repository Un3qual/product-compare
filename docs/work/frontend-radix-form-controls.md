# Frontend Radix Form Controls

## Snapshot

- Status: ready
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
- Nine route modules contain 22 visible raw inputs, selects, text areas, or
  checkboxes with direct Radix Themes equivalents.
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

## Verification

- focused UI and affected route tests
- visible raw-control architecture scan
- TypeScript and Oxc
- full frontend unit suite
- Vite client and SSR builds
- bundle contract
- `mix work_queue.validate`
- `git diff --check`

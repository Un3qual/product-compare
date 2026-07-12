# Frontend Radix UI Polish

## Snapshot

- Status: done
- Priority: P1
- Last verified: 2026-07-11
- Architecture: `docs/superpowers/specs/2026-07-11-radix-ui-polish-design.md`
- Objective: improve every registered frontend route with a readable,
  information-dense layout and a reusable Radix-backed UI foundation.

## Delivered

- Added a semantic design-token layer with separately tunable brand primitives,
  surfaces, text, borders, actions, commerce states, radii, shadows, and layout
  values.
- Retained Radix primitives for Dialog, Scroll Area, Tabs, Accordion,
  Collapsible, Direction, Label, Separator, and Slot behavior.
- Added shared page, workspace, context-rail, summary, list, feedback, status,
  pagination, disclosure, and action-dialog patterns.
- Applied the page hierarchy across shopper discovery, product detail,
  comparison, saved records, operational routes, account tools, and auth.
- Kept primary content before supporting controls in responsive visual and DOM
  order.
- Made product-detail tabs URL-addressable through the location hash while
  preserving offer and comparison query parameters.
- Removed test-only UI abstractions and reused `SummaryStrip` for revenue and
  feed-review metrics.
- Replaced the full Radix Themes import with the small behavioral primitives the
  app actually uses, avoiding a large global CSS and JavaScript cost.
- Kept React component filenames PascalCased to match their primary component.

## Skip Navigation Follow-Up Evidence

- Status: done on 2026-07-11.
- `AppShell` now renders a keyboard-visible `Skip to main content` link before
  primary navigation and a stable, programmatically focusable `main-content`
  target.
- The focused shell suite covers the accessible link name, target destination,
  main landmark ID, and focus target.
- Verification:
  - `cd assets && bun x vitest run test/ui/app-shell.test.tsx` - 2 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with no output.

## Boundaries

- Application behavior and GraphQL contracts were not redesigned.
- Native GET-form controls remain native where their browser behavior is useful.
- Large route modules were not split solely by line count; extractions require a
  cohesive reusable or independently testable boundary.
- Dark mode and final brand colors remain follow-up design work.

## Verification

Run from the repository root unless noted:

- `cd assets && bun run relay`
- `cd assets && bun run typecheck`
- `cd assets && bun run test:unit`
- `cd assets && bun run build`
- `mix work_queue.validate`
- `git diff --check`

Record final counts and build artifact sizes in the pull request rather than
maintaining per-commit test counts in this lane document.

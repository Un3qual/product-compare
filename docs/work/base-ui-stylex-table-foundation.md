# Base UI, StyleX, And Table Foundation

## Snapshot

- Status: complete
- Owner: current Codex managed worktree `d6fa`
- Priority: P0 user-directed foundation replacement
- Plan: `docs/superpowers/plans/2026-08-11-base-ui-stylex-table-foundation-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-11-base-ui-stylex-table-foundation-design.md`
- Source snapshot: `shadcn-labs/shadcn-cssinjs@5f0337ee4606f5d6c8f3cb2cb95924c8a70e9a5f`

## Target Outcome

ProductCompare uses one locally owned StyleX component foundation built from
the approved shadcn-cssinjs registry source and Base UI. Radix is absent,
ProductCompare's visual identity and behavior remain intact, all current tables
use TanStack Table v9, and production StyleX class names are shortened by one
deterministic client/SSR-safe build plugin.

## Owned Paths

- Frontend dependencies, Vite/StyleX configuration, build plugins, bundle
  scripts, and their tests.
- `assets/src/ui/**` and every existing route consumer that requires the Base UI
  API cutover.
- Attribution Ledger, Decision Summary, Specification Matrix, and their focused
  tests.
- Production UI browser coverage and snapshots only when rendering changes are
  intentional and verified.
- This lane document plus coordinator-owned queue and plan catalog updates.

## Internal Slices

1. Deterministic production StyleX class-name mangling.
2. ProductCompare-themed shadcn-cssinjs and Base UI primitive cutover.
3. TanStack Table v9 adoption for all current semantic tables.
4. Full frontend, browser, bundle, queue, and anti-slop verification.

## Preconditions

- The user approved a complete replacement rather than a compatibility or
  route-by-route dual-stack migration.
- The user approved preserving the current visual direction with focused
  improvements where evidence supports them.
- The user asked execution to continue without additional approval checkpoints
  until the first complete implementation is done.
- The active homepage query-scaling row is backend-owned and path-disjoint.
- Four ready route cohorts remain in the queue; they cannot be claimed in
  parallel while this shared-foundation row owns their frontend paths.

## Verification

- Focused mangler, primitive, provider, overlay, layout, compare, and revenue
  tests.
- Complete frontend Relay/type/lint/format/unit/client-build/SSR-build/bundle
  gate.
- Deterministic production UI browser, accessibility, focus, reduced-motion,
  responsive, and visual checks.
- No `@radix-ui/*` dependency or import.
- `mix work_queue.validate`, backend formatting check, and `git diff --check`.

## Blocker Rule

Stop only if Base UI cannot preserve a current browser/form/accessibility
contract, TanStack v9 cannot preserve a current table contract without taking
ownership from Relay or URL state, or deterministic mangling cannot produce
the same class for independent client and SSR builds. Record exact failing
behavior and do not retain a permanent Radix fallback or bundle-order mapping.

## Progress

- 2026-08-11: User supplied an untested 541-line mangler prototype at
  `assets/src/stylex-mangle.ts` and requested a full Base UI,
  shadcn-cssinjs, and TanStack Table adoption.
- 2026-08-11: Live audit found 15 direct Radix-importing source files, three
  semantic table surfaces, and a default StyleX `x` prefix that did not match
  the prototype. The approved design replaces bundle-local ordinal mapping
  with direct deterministic encoding and performs one complete component
  cutover.
- 2026-08-11: Replaced the prototype with a production-only Vite plugin under
  `assets/plugins/`, direct base-36 to base-62 encoding, collision checks, and
  client/SSR verification. The project prefix is alphanumeric so StyleX
  runtime constants resolve correctly; constant registrations remain intact
  while atomic classes are shortened.
- 2026-08-11: Replaced Radix with Base UI 1.7.0 and locally adapted
  shadcn-cssinjs primitives, removed the compatibility wrappers and Radix
  dependencies, preserved the ProductCompare palette and responsive
  information architecture, and accepted reviewed desktop, tablet, and mobile
  visual baselines.
- 2026-08-11: Converted Attribution Ledger, Decision Summary, and Specification
  Matrix to TanStack Table 9.1.2 without introducing a generic table wrapper.
- 2026-08-11: Final frontend verification passed 115 Vitest files and 1,537
  tests, Relay validation, typecheck, lint, formatting, client/SSR builds,
  StyleX constant/mangling checks, and the 215,110-byte gzip initial bundle
  contract. All 19 Playwright tests passed, including accessibility, focus,
  reduced-motion, responsive geometry, and reviewed visual coverage.
- 2026-08-11: Final code review hardened Linux filename casing, native form
  reset and button-submit contracts, modified-click navigation, 44px checkbox
  and radio targets, and positive mangled-selector evidence in both build
  outputs. Focused regressions and the full frontend/browser gates passed.
- 2026-08-11: Repository closeout passed `mix work_queue.validate` with four
  ready rows, backend formatting, 1,482 backend tests, and `git diff --check`.
- 2026-08-12: The user explicitly removed stored Playwright screenshot
  baselines. Behavioral, accessibility, focus, responsive-geometry, and
  overflow assertions remain; generated screenshot directories are ignored.
- 2026-08-12: Review reconciliation archived the completed foundation row and
  added it as an explicit prerequisite of all four live route cohorts. The live
  index remains limited to executable work and does not retain completed rows.

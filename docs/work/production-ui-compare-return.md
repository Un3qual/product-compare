# Production UI Compare And Return

## Snapshot

- Status: superseded on 2026-08-12 by `docs/work/comparison-auth-continuity.md`
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-compare-return-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`
- Last verified: 2026-08-10 after completion of the shared production UI spine;
  the owned route, test, browser, and lane paths are disjoint from the other
  ready cohorts.

## Target Outcome

Live, saved, and shared comparisons plus price alerts form one coherent return lifecycle with stable product numbers, readable differences, truthful price scope, plain buying-priority reasons, immutable captured facts, owner privacy, and row-scoped mutations.

## Owned Paths

- The compare, saved/shared, and alert route components and focused tests named by the plan.
- `assets/tests/e2e/production-ui-compare-return.spec.ts` and snapshots.
- `docs/work/production-ui-compare-return.md`.

## Internal Slices

1. Decision-lifecycle characterization.
2. Live compare, recommendation, saving, and sharing composition.
3. Saved/shared return paths.
4. Alert inbox and watch controls.
5. Browser, accessibility, responsive, visual, and full frontend verification.

## Verified Prerequisites

- The System Spine And Home row is complete and its shared files are stable.
- A fresh ownership audit found no overlap with another ready cohort.

## Verification

The complete compare/snapshot/saved/alert suites named by the plan, deterministic Playwright/axe/visual checks at three widths, `cd assets && pnpm run check`, `mix work_queue.validate`, and `git diff --check`.

## Blocker Rule

Record and stop on any required backend, GraphQL, router, or shared-spine edit. Never weaken exact Decimal, mixed-currency, owner, captured-versus-live, or row-state behavior.

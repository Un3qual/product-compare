# Production UI Operations

## Snapshot

- Status: planned
- Priority: P1 after the system spine
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-operations-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`

## Target Outcome

CJ-program lifecycle and revenue reporting become dense, legible operator workspaces while every filter, lifecycle save, concurrency response, independent pagination region, metric, click/conversion detail, and partial-failure boundary remains executable.

## Owned Paths

- The CJ-program and revenue route components and focused tests named by the plan.
- `assets/tests/e2e/production-ui-operations.spec.ts` and snapshots.
- `docs/work/production-ui-operations.md`.

## Internal Slices

1. Operator-language, density, and feature characterization.
2. CJ lifecycle, row mutation, feed, and unmatched-feed composition.
3. Revenue controls, metrics, and independently recoverable attribution details.
4. Browser, accessibility, responsive, visual, and full frontend verification.

## Prerequisite

The System Spine And Home row is complete, its shared files are stable, and a fresh ownership audit finds no overlap with another active cohort.

## Verification

The complete CJ/revenue suites named by the plan, deterministic Playwright/axe/visual checks at three widths, `cd assets && pnpm run check`, `mix work_queue.validate`, and `git diff --check`.

## Blocker Rule

Record and stop on any required backend, GraphQL, router, or shared-spine edit. Never merge independent pagination/error regions or hide operator facts for visual simplicity.

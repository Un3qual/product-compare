# Production UI Discover And Evaluate

## Snapshot

- Status: planned
- Priority: P1 after the system spine
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-discover-evaluate-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`

## Target Outcome

Catalog, category, product, offer, and merchant routes use the stable production system while every filter, sort, page, comparison action, tracked link, offer fact, price watch, review/Q&A lifecycle, canonical route, metadata result, and localized failure state remains executable.

## Owned Paths

- The catalog, category, product, offer, and merchant route components and focused tests named by the plan.
- `assets/tests/e2e/production-ui-discovery.spec.ts` and snapshots.
- `docs/work/production-ui-discover-evaluate.md`.

## Internal Slices

1. Plain-language and responsive feature characterization.
2. Catalog and category discovery composition.
3. Product detail, offers, price watch, and existing community evaluation.
4. Offer and merchant workspaces.
5. Browser, accessibility, responsive, visual, and full frontend verification.

## Prerequisite

The System Spine And Home row is complete, its shared files are stable, and a fresh ownership audit finds no overlap with another active cohort.

## Verification

The complete route suites named by the plan, deterministic Playwright/axe/visual checks at three widths, `cd assets && pnpm run check`, `mix work_queue.validate`, and `git diff --check`.

## Blocker Rule

Record and stop on any required backend, GraphQL, router, or shared-spine edit. Do not silently widen this frontend-owned cohort or remove a shipped state.

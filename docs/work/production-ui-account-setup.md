# Production UI Account And Setup

## Snapshot

- Status: planned
- Priority: P1 after the system spine
- Plan: `docs/superpowers/plans/2026-08-10-production-ui-account-setup-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`

## Target Outcome

Authentication, recovery, API-token, and affiliate-setup routes make consequences, ownership, one-time values, validation, recovery, and destructive actions clear without changing the GraphQL/Phoenix session contract or any lifecycle operation.

## Owned Paths

- The auth, API-token, and affiliate-setup route components and focused tests named by the plan.
- Existing auth browser coverage plus `assets/tests/e2e/production-ui-account-setup.spec.ts` and snapshots.
- `docs/work/production-ui-account-setup.md`.

## Internal Slices

1. Sensitive-flow characterization and secret-redaction guard.
2. Authentication and recovery composition.
3. API-token lifecycle management.
4. Affiliate setup forms and results.
5. Browser, accessibility, responsive, visual, and full frontend verification.

## Prerequisite

The System Spine And Home row is complete, its shared files are stable, and a fresh ownership audit finds no overlap with another active cohort.

## Verification

The complete auth/API-token/affiliate suites and auth browser test named by the plan, deterministic Playwright/axe/visual checks at three widths, `cd assets && pnpm run check`, `mix work_queue.validate`, and `git diff --check`.

## Blocker Rule

Record and stop on any required backend, GraphQL, router, or shared-spine edit. Never introduce REST browser auth, leak a one-time secret, or weaken viewer/session/lifecycle behavior.

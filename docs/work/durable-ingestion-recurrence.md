# Durable Ingestion Recurrence

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Design: `docs/superpowers/specs/2026-07-20-cross-stack-ready-work-design.md`
- Plan: `docs/superpowers/plans/2026-07-20-durable-ingestion-recurrence-implementation-plan.md`
- Last verified: 2026-07-20 against current worker uniqueness keys, normalized
  arguments, scheduler options, and focused tests.

## Batch Outcome

Scheduled CJ product imports and feed discovery deduplicate within one explicit
schedule window while the same normalized scope remains runnable in later
windows.

## Ready Evidence

- The accepted durable-ingestion design keys jobs by provider, operation, scope
  fingerprint, and schedule window.
- Both worker argument maps already contain `schedule_window`.
- Both workers omit `schedule_window` from `@unique_args`, and current tests
  assert that a later window incorrectly conflicts with the earlier job.
- Both timer schedulers enqueue bounded work but do not pass an explicit window.

## Internal Slices

1. Worker same-window and later-window identity.
2. Stable explicit scheduler windows with an injectable clock.
3. Focused recurrence, retry, cursor, and redaction regression evidence.

## Boundaries

- Preserve non-secret normalized arguments and bounded runner options.
- Preserve cursor behavior, retry categories, logging redaction, and timer
  recurrence.
- Do not reopen deferred ingestion dashboard/operator work or eBay fallback.

## Verification

- Durable worker and both scheduler test files.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

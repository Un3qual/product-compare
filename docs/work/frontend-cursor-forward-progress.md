# Frontend Cursor Forward-Progress Hardening

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-18-coherent-frontend-correctness-batches.md`
- Last verified: 2026-07-18 from current pagination owners and existing focused
  tests. Saved comparisons and snapshot history already demonstrate the target
  repeated-cursor rejection behavior.

## Batch Outcome

Every in-scope frontend Relay pagination surface offers another page only when
the server supplies a nonblank cursor different from the cursor that produced
the current page. Repeated cursors cannot create self-links or repeated
stateful fetch actions.

## Internal Slices

1. Shared framework-free cursor invariant plus community answers, reviews, and
   questions.
2. Stateful compare-picker and product-offer pagination.
3. Public URL pagination for catalog, offers, categories, and merchants.
4. Account/setup URL pagination for API tokens and affiliate merchants.

The slices may be executed in focused milestones, but they share one
correctness invariant and one queue status.

## Boundaries

- Preserve cursor values exactly; trimming is only a validity check.
- Preserve first-page links, URL state, ordering, accumulation, deduplication,
  Relay timing, markup, and presentation.
- Do not touch deferred ingestion feed-candidate surfaces.
- Use behavioral repeated-cursor tests, not source-string assertions.

## Verification

- Direct shared cursor-helper tests.
- Focused pure and route suites for every migrated surface.
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- dependency scan for the shared pure helper
- `git diff --check`

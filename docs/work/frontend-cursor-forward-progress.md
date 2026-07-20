# Frontend Cursor Forward-Progress Hardening

## Snapshot

- Status: implemented; awaiting coordinator closeout
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-relay-cursor-forward-progress-implementation-plan.md`
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

## Implementation Evidence

- Shared/community RED: the focused run failed because the shared helper did
  not exist and community accepted a whitespace cursor. The three suites now
  pass 46 tests, including repeated review/question state and blank initial
  answer behavior.
- Stateful RED: compare-picker and product-offer coverage exposed 2 accepted
  self-transitions across 176 tests. The four focused suites now pass 178
  tests, including UI suppression after a repeated stateful fetch.
- Public URL RED: catalog, offers, category, merchant directory, and merchant
  detail each produced a self-link, for 5 failures across 189 tests. The same
  route and pure-data surfaces now reject blank/repeated cursors while retaining
  encoded filters, page sizes, slugs, and first-page links.
- Account/setup RED: API-token and affiliate pagination produced 4 failures
  across 114 tests for whitespace or repeated cursors. All 114 tests now pass
  with token status and merchant page-size state preserved.
- The combined focused batch gate passes 530 tests across 19 files. The shared
  helper has no imports from React, Relay, router, StyleX, or generated
  operations.
- The full frontend gate passes Relay validation, TypeScript, 1,493 tests,
  client/SSR builds, and the 182,153-byte gzip bundle contract. Queue
  validation continues to report 7 ready rows.

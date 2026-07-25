# CJ Program Lifecycle Final Fix Report

## Outcome

- Implementation commit: `720815ed` (`fix: close CJ lifecycle review findings`)
- The six final-review findings are addressed without changing the queue
  validator or adding a corrective migration.
- The existing unshipped migration now couples the selected reviewed nonblank
  note to that row's review time, while retaining stage precedence and
  deterministic feed-ID tie-breaking.
- Linked and unmatched feed rows show a separate feed name, labeled provider
  feed ID, and formatted last-seen time.
- Warning copy now states the backend's intentional any-feed semantics.
- A pending lifecycle mutation shows row-local `Saving...` copy and
  `aria-busy`; another row remains interactive.
- The live queue records a ready-row count of zero and requires a new product
  or quality decision. The exact approved validator waiver is preserved.
- Closeout evidence records the fresh 1,486-test frontend result and
  182,240-byte gzip bundle result.

## RED/GREEN Evidence

- Migration RED:
  `mix test test/product_compare/repo/migrations/add_cj_program_lifecycle_test.exs`
  ran 4 tests with 1 expected failure. The selected note was
  `Keep this note`, but `changed_at` was the later blank-note review time
  (`13:00`) instead of the selected note row's time (`12:00`).
- Frontend RED:
  `cd assets && bun x vitest run
  test/routes/ingestion/cj-programs/cj-program-data.test.ts
  test/routes/ingestion/cj-programs/cj-programs.route.test.tsx` ran 31 tests
  with 5 expected failures covering any-feed warning copy, row-local pending
  feedback, linked feed ID/last-seen facts, and unmatched feed ID/last-seen
  facts.
- Migration/schema GREEN: the focused migration and schema command passed
  10 tests with 0 failures.
- Frontend GREEN: the two focused data/route files passed 31 tests with
  0 failures. The widened CJ/root/router run passed 72 tests with 0 failures.
- Backend behavior GREEN: the final lifecycle-focused 15-file matrix passed
  182 tests with 0 failures.

## Verification

- `cd assets && bun run typecheck` — exit 0.
- `cd assets && bun run relay:check` — exit 0 after granting Watchman access;
  52 reader, 51 normalization, and 51 operation-text documents compiled.
- `cd assets && bun run check` — exit 0: Relay validation, TypeScript,
  104 test files / 1,486 tests, client build, SSR build, and bundle check.
  Final bundle result: 596,678 raw / 182,240 gzip bytes against the
  200,000-byte gzip budget.
- `mix format --check-formatted` — exit 0.
- `mix typecheck` — exit 0.
- `mix quality` — exit 0: Credo found no issues, ExDNA stayed at its 3/3
  clone budget, the smell scan found no issues with 11 baseline findings
  suppressed, and Dialyzer reported 0 errors.
- `git diff --check` — exit 0.
- `mix work_queue.validate` — expected exit 1 with only:
  `Ready Work requires at least 3 complete rows; found 0`.
- Aggregate `mix ci` and coverage finality were intentionally not claimed;
  the root worker owns final aggregate gates after re-review.

## Quality-Gate Follow-up

The required quality run exposed three feature-range findings that were not
caused by the six review edits:

- Credo identity `case` at
  `lib/product_compare/ingestion/feed_candidates.ex:38`.
- Unsafe dynamic `String.to_atom/1` at
  `lib/product_compare/ingestion/cj_candidate_freshness.ex:20`.
- Unsafe dynamic `String.to_atom/1` at
  `lib/product_compare/ingestion/cj_candidate_market_coverage.ex:19`.

The identity `case` was removed without changing the transaction result.
Freshness and market coverage now build finite string-to-atom maps from their
closed atom stage lists using `Atom.to_string/1`; no
`String.to_existing_atom/1`, catch-all compatibility layer, or new shared
abstraction was added. Their focused behavior passed 59 ingestion/discovery/
freshness/coverage tests and a separate 4-test freshness/coverage run before
the final 182-test matrix and clean quality gate.

## Anti-Slop Review

- No queue validator code or validator tests changed.
- No generated Relay/schema artifact changed.
- No dynamic string-to-atom conversion remains in the two reported modules.
- Active production code contains no restored feed-level lifecycle state;
  remaining legacy names are migration behavior or negative absence
  assertions.
- The new tests exercise migration/database and rendered interaction behavior;
  no source-string test was added.
- Feed discovery still preserves program lifecycle state, program/feed counts
  retain distinct meanings, and no raw metadata, credential, account,
  tracking, or provider-payload field entered the route.

## Concern

No open implementation concern. The approved zero-ready-row validator failure
remains the sole known waived gate pending a new product or quality decision.

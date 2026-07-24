# Actionable ExDNA Clone Retirement

## Snapshot

- Status: complete
- Owner: current detached worktree
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-actionable-exdna-clone-retirement-implementation-plan.md`
- Last verified: 2026-07-24 against the current three-clone ExDNA report and
  direct import-run, CJ Runs, and discussion characterization suites.

## Target Outcome

Three genuinely shared behaviors have focused owners and the enforced ExDNA
budget falls from six to three without abstracting coincidental near matches.

## Implementation Evidence

- `CJRunCompletion` owns the shared terminal import-run counts, cursor, status,
  and failure summary used by feed discovery and the direct import task.
- `ValueFormatter` owns CJ Runs report/resume value serialization.
- `ModerationChangeset` owns the shared review, question, and answer moderation
  field update and allowed-status validation.
- The attempted generic worker support was rejected: ExDNA continued to report
  the complete Oban facades, and hiding that shape would require macro or
  callback ceremony without a shared behavioral owner.

## Boundaries

- Preserve import-run, output, and moderation behavior.
- Do not create generic repositories, schemas, callbacks, or formatting
  frameworks.

## Verification

- `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`
- `mix test test/product_compare/discussions/community_trust_test.exs test/product_compare/discussions/thread_crud_test.exs`
- `mix ex_dna --max-clones 3`
- `mix ci`

## Completion Evidence

- Import-run and CJ Runs focused gate: 41 tests, zero failures.
- Discussion focused gate: 30 tests, zero failures.
- ExDNA: 3/3. Retained near matches are the two explicit Oban worker facades,
  Brand versus EnumSet schemas, and import-report accumulation.
- Full `mix ci`: 916 backend tests at 83.76% coverage and 1,507 frontend tests,
  with formatting, Credo, Reach, ExDNA, Dialyzer, Relay, typechecking, and both
  production builds green.
- Queue validation: three complete `ready` reserve rows remain.

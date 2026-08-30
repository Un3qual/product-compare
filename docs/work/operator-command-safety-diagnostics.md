# Operator Command Safety And Diagnostics

## Snapshot

- Status: complete
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-30-operator-command-safety-diagnostics-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`
- Last verified: 2026-08-30 against the complete backfill and CJ operator
  command suites.

## Target Outcome

Dry-run and CJ operator commands reject every malformed argument before
startup, use repo-only services where appropriate, and expose stable diagnostic
categories and safe stacktrace locations without provider or credential data.

## Owned Paths

- `lib/product_compare/mix_tasks/cli_options.ex`
- `lib/product_compare/mix_tasks/repo_only_startup.ex` only if required
- `lib/product_compare/ingestion/cj_failure_diagnostics.ex`
- `lib/mix/tasks/product_attribute_claims.validate_backfill.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_runs.ex`
- `lib/mix/tasks/product_compare/ingestion/cj_import/runner.ex`
- `lib/mix/tasks/product_compare/ingestion/cj_runs/resume.ex`
- Focused Mix task tests named by the plan
- This lane document

## Internal Slices

1. Duplicate/range-aware strict CJ CLI parsing.
2. Validation-first repo-only backfill dry run.
3. Shared category-only, sanitized CJ failure diagnostics.

## Blocker Rule

Stop if a command's accepted legacy argument is not discoverable from its tests
and documentation, if repo-only startup cannot support the workflow without a
new runtime dependency, or if useful diagnostics would require retaining raw
provider values.

## Completion Evidence

- `CliOptions` now preserves parsed occurrences long enough to reject duplicate
  canonical switches, including aliases, while retaining its concise invalid
  option and positional argument errors.
- CJ feed and credential commands reject unknown, positional, duplicate,
  malformed, blank-country, and out-of-range input before provider work.
- The product-attribute validation task validates every argument before
  `RepoOnlyStartup`; no-start subprocess tests prove invalid input starts
  neither the repo nor application, while a valid dry run starts the repo
  without `ProductCompare.Supervisor` or Oban.
- A final entry-point audit moved CJ candidate, readiness, and run option
  normalization ahead of repo startup. No-start tests prove invalid range and
  switch errors leave the repo stopped.
- Import, resume, and feed failures share one bounded category and stacktrace
  sanitizer. Adversarial exception and throw tests retain operation, category,
  and source location while excluding bodies, authorization headers, tokens,
  exception messages, arguments, and nested reasons.
- The complete focused outcome command passed 89 tests with zero failures on
  `MIX_TEST_PARTITION=quality_operator`.
- `mix format --check-formatted` and `mix typecheck` passed. `git diff --check`
  and `mix work_queue.validate` passed after this completion record and queue
  transition.

## Remaining Work

None in this lane. Frontend correctness and simplification is the next ready
outcome.

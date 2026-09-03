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

## Completion Evidence

- `CliOptions` delegates switch semantics to `OptionParser` while retaining
  concise invalid-option and positional-argument errors plus shared numeric
  validation.
- CJ feed and credential commands reject unknown, positional, malformed,
  blank-country, and out-of-range input before provider work.
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

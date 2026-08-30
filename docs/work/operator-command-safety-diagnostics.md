# Operator Command Safety And Diagnostics

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-30-operator-command-safety-diagnostics-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

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

Pending implementation. Record no-startup RED evidence, adversarial secret
redaction coverage, focused command suites, and the milestone commit here.

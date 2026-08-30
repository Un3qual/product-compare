# Operator Command Safety And Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dry-run and CJ operator commands reject bad arguments before startup and report failures with useful categories and sanitized stacktraces instead of silent defaults or provider-data leaks.

**Architecture:** One existing strict CLI boundary owns option/argument/range validation, and the existing repo-only startup boundary owns database-only tasks. A focused CJ diagnostics module shares the runner's category and stacktrace sanitization across import, feed, and resume commands.

**Tech Stack:** Elixir Mix tasks, OptionParser, Ecto startup, Logger, ExUnit CaptureIO/CaptureLog

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Parse and validate arguments before starting the application or repository.
- Dry-run validation must not start Oban or the full supervision tree.
- Reject unknown, duplicate, positional, malformed, and out-of-range options; do not silently discard them.
- Logs and `Mix.Error` messages must not inspect raw provider reasons, bodies, headers, exception arguments, or credentials.
- Keep command output fields and successful runner behavior unchanged unless the plan names them.
- Do not create a generic command framework or exception hierarchy.

---

### Task 1: Strengthen the shared CLI parser and migrate CJ feed/credential commands

**Files:**

- Modify: `lib/product_compare/mix_tasks/cli_options.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`
- Modify if shared parser coverage is clearer there: `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`

**Interfaces:**

- `CliOptions.parse!/2` rejects repeated switches in addition to its existing invalid-option and positional-argument checks.
- CJ feeds accepts only positive `--limit`/`--pages`, non-negative `--offset`, supported booleans, and a nonblank country.
- CJ credentials accepts only `--require-ready` and rejects every positional/unknown/duplicate option before reading or printing readiness.

- [ ] **Step 1: Add RED cases for every discarded argument class**

  Add unknown option, positional argument, duplicate option, zero/negative limit/pages, negative offset, and malformed integer cases. Inject runners that flunk if validation reaches external work.

- [ ] **Step 2: Run RED**

  ```bash
  mix test \
    test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
  ```

- [ ] **Step 3: Add duplicate detection and migrate both parsers**

  Retain `CliOptions`'s current concise error vocabulary. Validate bounds with its positive/non-negative helpers and keep credential preflight app-free.

- [ ] **Step 4: Run GREEN**

  ```bash
  mix test \
    test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
  ```

---

### Task 2: Make product-attribute validation repo-only and validation-first

**Files:**

- Modify: `lib/mix/tasks/product_attribute_claims.validate_backfill.ex`
- Modify: `test/mix/tasks/product_attribute_claims_validate_backfill_task_test.exs`
- Modify if startup needs direct characterization: `test/mix/tasks/product_attribute_claims_validation_backfill_workflow_test.exs`
- Reuse unchanged unless a focused extension is necessary: `lib/product_compare/mix_tasks/repo_only_startup.ex`

**Interfaces:**

- The Mix task parses all arguments with `CliOptions`, validates `sample_size`, and only then calls `RepoOnlyStartup.start!/0`.
- Invalid arguments start neither the repo nor application children.
- Valid dry runs start only the repository dependencies required by the workflow.

- [ ] **Step 1: Write startup-boundary RED tests**

  Trace or inject the startup boundary so an invalid switch/sample size proves startup was not called. For a valid invocation, assert the full `ProductCompare.Application`/Oban tree is not started by the task itself.

- [ ] **Step 2: Run RED**

  ```bash
  MIX_TEST_PARTITION=quality_operator mix test \
    test/mix/tasks/product_attribute_claims_validate_backfill_task_test.exs \
    test/mix/tasks/product_attribute_claims_validation_backfill_workflow_test.exs
  ```

- [ ] **Step 3: Reorder parse/validation and use repo-only startup**

  Keep `ValidationBackfillWorkflow`'s table and sample validation as a final internal guard. Do not make the dry-run task accept writes or auto-remediation.

- [ ] **Step 4: Run GREEN**

  ```bash
  MIX_TEST_PARTITION=quality_operator mix test \
    test/mix/tasks/product_attribute_claims_validate_backfill_task_test.exs \
    test/mix/tasks/product_attribute_claims_validation_backfill_workflow_test.exs
  ```

---

### Task 3: Share bounded CJ failure diagnostics

**Files:**

- Create: `lib/product_compare/ingestion/cj_failure_diagnostics.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_import/runner.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/resume.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`
- Modify: `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`

**Interfaces:**

- `CJFailureDiagnostics.category/1` returns a bounded category string based on an exception module, tuple tag, atom, or broad term kind without inspecting nested data.
- `CJFailureDiagnostics.sanitize_stacktrace/1` retains module/function/arity and safe file/line metadata while discarding argument values and arbitrary location entries.
- Import runner and resume logs share this owner. Feed command raises with a category and its already-safe report summary, never `inspect(reason)`.

- [ ] **Step 1: Add adversarial RED coverage**

  Use reasons, throws, and exceptions containing provider bodies, authorization headers, tokens, and secret arguments. Assert the operation/category and sanitized module/function location remain visible while every secret marker is absent from logs and terminal errors.

- [ ] **Step 2: Run RED**

  ```bash
  mix test \
    test/mix/tasks/product_compare_ingestion_cj_import_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_runs_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
  ```

- [ ] **Step 3: Extract the existing runner policy and adopt it**

  Move, do not broaden, the runner's category and stacktrace functions. Resume replaces `Exception.format/3`; feeds replaces raw reason inspection. Preserve existing report rendering and runner return values.

- [ ] **Step 4: Run GREEN and complete outcome verification**

  ```bash
  MIX_TEST_PARTITION=quality_operator mix test \
    test/mix/tasks/product_attribute_claims_validate_backfill_task_test.exs \
    test/mix/tasks/product_attribute_claims_validation_backfill_workflow_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_import_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_runs_test.exs \
    test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs
  mix format --check-formatted
  mix typecheck
  git diff --check
  ```

- [ ] **Step 5: Commit the reviewed outcome**

  ```bash
  git add lib/mix/tasks lib/product_compare/mix_tasks \
    lib/product_compare/ingestion/cj_failure_diagnostics.ex test/mix/tasks \
    docs/work/operator-command-safety-diagnostics.md docs/work/index.md
  git commit -m "fix: harden operator command boundaries"
  ```


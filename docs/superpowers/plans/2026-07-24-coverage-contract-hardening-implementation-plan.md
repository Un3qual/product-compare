# Coverage Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale 69% coverage floor with an 82% repository contract
and directly exercise the two uncovered first-party Mix entry points.

**Architecture:** Entry-point tests use the real Mix shell and existing
workflow/validator boundaries. The project threshold is raised only after the
full coverage run proves stable headroom above 82%.

**Tech Stack:** Elixir, ExUnit, Mix coverage.

## Global Constraints

- Do not test implementation source strings or private functions.
- Preserve task output, argument errors, dry-run behavior, and database safety.
- Do not exclude first-party modules from coverage.

---

## Task 1: Mix Entry-Point Behavior

**Files:**

- Create: `test/mix/tasks/work_queue_validate_test.exs`
- Create: `test/mix/tasks/product_attribute_claims_validate_backfill_task_test.exs`

**Interfaces:**

- Consumes: `Mix.Tasks.WorkQueue.Validate.run/1` and
  `Mix.Tasks.ProductAttributeClaims.ValidateBackfill.run/1`.
- Produces: behavior coverage for valid output, usage errors, default dry-run
  output, and invalid CLI switches.

- [ ] Add a temporary queue fixture and assert the real Mix shell receives
  `work queue valid: 3 ready rows`; add a second assertion for the existing
  usage error.
- [ ] Run the WorkQueue task test and verify it fails before the task is
  re-enabled and shell messages are handled correctly.
- [ ] Add a DataCase task test that runs the validation backfill task against
  the migrated test database, asserts its dry-run report, and proves an invalid
  switch raises without writes.
- [ ] Run both new test files; expect zero failures.
- [ ] Commit with message `test: cover first-party mix entry points`.

## Task 2: Coverage Floor

**Files:**

- Modify: `mix.exs`
- Modify: `docs/work/coverage-contract-hardening.md`

**Interfaces:**

- Produces: `test_coverage: [summary: [threshold: 82]]`.

- [ ] Run `mix test --cover`; verify total coverage remains above 82%.
- [ ] Change the configured threshold from 69 to 82.
- [ ] Re-run `mix test --cover`, `mix ci`, and `git diff --check`.
- [ ] Record total coverage and entry-point module coverage in the lane doc.
- [ ] Commit with message `chore: ratchet backend coverage floor`.

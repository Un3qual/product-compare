# Work-Queue Plan Reference Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make file-backed queue validation reject ready rows whose referenced
implementation plans are missing, escape the repository, or lack an executable
plan contract.

**Architecture:** Keep `Validator.validate/1` as the pure Markdown shape check.
`Validator.validate_file/1` additionally resolves each ready row's backticked
repository-relative plan path against the repository root and validates the
plan header, goal, constraints, and task markers.

**Tech Stack:** Elixir, Mix, Markdown, ExUnit.

## Global Constraints

- Preserve the current queue-depth, required-field, list-content, and
  empty-state errors.
- Do not validate arbitrary owned paths because ready plans may legitimately
  name files that will be created.
- Reject absolute paths and `..` traversal before touching the filesystem.
- Keep error ordering deterministic and include the ready-row index.

---

## Task 1: Parse Ready Plan References

**Files:**

- Modify: `lib/product_compare/work_queue/validator.ex`
- Test: `test/product_compare/work_queue/validator_test.exs`

**Interfaces:**

- Produces:
  a private ready-row projection containing row index and the exact `Plan:`
  code-span path while retaining the existing `validate/1` result.

- [ ] Add pure-validator cases for missing code spans, absolute paths, and
  traversal paths; expect deterministic row-indexed failures.
- [ ] Parse only one backticked `docs/**/*.md` path from each ready row and
  reject ambiguous values.
- [ ] Run
  `mix test test/product_compare/work_queue/validator_test.exs`; expect all
  cases to pass.
- [ ] Commit with message `refactor: parse ready queue plan references`.

## Task 2: Validate Referenced Plan Contracts

**Files:**

- Modify: `lib/product_compare/work_queue/validator.ex`
- Test: `test/product_compare/work_queue/validator_test.exs`

**Interfaces:**

- `validate_file/1` produces missing-plan and incomplete-plan errors in
  addition to the existing queue errors.
- A valid plan contains an implementation-plan H1, `**Goal:**`,
  `## Global Constraints`, and at least one `## Task` or `### Task` heading.

- [ ] Use a temporary repository-shaped directory in tests with a queue file
  and plan fixtures for valid, missing, escaping, and incomplete references.
- [ ] Resolve paths relative to the repository containing `docs/work/index.md`;
  verify the expanded path stays under that root before reading it.
- [ ] Preserve `validate/1` as filesystem-free and aggregate all reference
  errors in ready-row order.
- [ ] Run the validator suite; expect all cases to pass.
- [ ] Commit with message `feat: validate ready queue plan contracts`.

## Task 3: Repository Gate And Evidence

**Files:**

- Modify: `docs/work/work-queue-plan-reference-integrity.md`
- Modify: `docs/work/operating-model.md`

**Interfaces:**

- Produces: documented file-backed queue reference validation.

- [ ] Add the new invariant and remediation message to the operating model.
- [ ] Run `mix test test/product_compare/work_queue/validator_test.exs`.
- [ ] Run `mix work_queue.validate`, `mix format --check-formatted`,
  `mix typecheck`, `mix ci`, and `git diff --check`.
- [ ] Record exact test and gate evidence in the lane doc.
- [ ] Commit with message `docs: record queue plan reference integrity`.

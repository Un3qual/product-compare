# Actionable ExDNA Clone Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give three genuinely shared behaviors one owner and lower the
enforced ExDNA clone budget from six to three without abstracting coincidental
domain similarities.

**Architecture:** Shared CJ job execution remains behind the two existing Oban
workers, CJ run value serialization becomes one Mix-task helper, and discussion
moderation changesets become one schema helper. The three remaining near-match
findings stay explicit because they do not share one behavioral contract.

**Tech Stack:** Elixir, Oban, Ecto, ExDNA, ExUnit.

## Global Constraints

- Preserve worker modules, queues, uniqueness keys, retry behavior, arguments,
  configured runners, result classification, and public functions.
- Preserve CJ report/resume output byte-for-byte.
- Preserve all discussion status, moderator, note, and timestamp changes.
- Do not create a generic schema, repository, callback, or formatting
  framework.

---

## Task 1: Durable CJ Worker Execution

**Files:**

- Create: `lib/product_compare/ingestion/jobs/cj_worker_support.ex`
- Modify: `lib/product_compare/ingestion/jobs/cj_feed_discovery_worker.ex`
- Modify: `lib/product_compare/ingestion/jobs/cj_product_import_worker.ex`
- Test: `test/product_compare/ingestion/jobs/durable_jobs_test.exs`

**Interfaces:**

- Produces:
  `CJWorkerSupport.enqueue/2`, accepting an Oban worker module and normalized
  argument map, and
  `CJWorkerSupport.perform/3`, accepting job arguments, an option projector,
  and the configured runner.

- [ ] Add behavior tests that enqueue and perform both worker kinds through
  their unchanged public APIs; verify the existing suite fails only when the
  shared support calls are introduced before the owner exists.
- [ ] Move only the identical insert and result-run mechanics into
  `CJWorkerSupport`; retain worker-specific `use Oban.Worker`, unique keys,
  argument functions, and runner lookup in each worker.
- [ ] Run
  `mix test test/product_compare/ingestion/jobs/durable_jobs_test.exs
  test/product_compare/ingestion/jobs/health_test.exs`; expect all tests to
  pass.
- [ ] Commit with message `refactor: share durable cj worker execution`.

## Task 2: CJ Run Value Serialization

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_runs/value_formatter.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/reports.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/resume.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`

**Interfaces:**

- Produces:
  `ValueFormatter.format/1` for nil, `DateTime`, lists, maps, and scalar values.

- [ ] Extend the CJ Runs task test with nil, timestamp, list, map, and scalar
  output examples matching the current serialized text.
- [ ] Move the identical clauses into `ValueFormatter.format/1` and call it
  from both task owners.
- [ ] Run
  `mix test test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`;
  expect all tests to pass.
- [ ] Commit with message `refactor: share cj run value formatting`.

## Task 3: Discussion Moderation Changesets

**Files:**

- Create: `lib/product_compare_schemas/discussions/moderation_changeset.ex`
- Modify: `lib/product_compare_schemas/discussions/product_review.ex`
- Modify: `lib/product_compare_schemas/discussions/product_thread.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare/discussions/thread_crud_test.exs`

**Interfaces:**

- Produces:
  `ModerationChangeset.change/5`, returning an `Ecto.Changeset.t()` with the
  existing moderation fields.

- [ ] Add direct review, question, and answer moderation assertions covering
  status, moderator, note, and timestamp.
- [ ] Delegate each schema's existing `moderation_changeset/5` wrapper to the
  shared helper without changing public schema APIs.
- [ ] Run both named suites; expect all tests to pass.
- [ ] Commit with message `refactor: share discussion moderation changesets`.

## Task 4: Enforce The Reduced Clone Budget

**Files:**

- Modify: `mix.exs`
- Modify: `docs/work/actionable-exdna-clone-retirement.md`

**Interfaces:**

- Produces: repository quality enforcement at `mix ex_dna --max-clones 3`.

- [ ] Run `mix ex_dna --max-clones 3`; expect exactly the three intentionally
  retained near-match findings and exit status 0.
- [ ] Change both `quality` and any duplicate direct alias configuration from
  six to three.
- [ ] Run the focused suites, `mix format --check-formatted`,
  `mix typecheck`, `mix work_queue.validate`, `mix ci`, and
  `git diff --check`.
- [ ] Record the retained findings and verification evidence in the lane doc.
- [ ] Commit with message `chore: enforce reduced clone budget`.

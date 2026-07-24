# Actionable ExDNA Clone Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give three genuinely shared behaviors one owner and lower the
enforced ExDNA clone budget from six to three without abstracting coincidental
domain similarities.

**Architecture:** Shared CJ import-run completion becomes one ingestion helper,
CJ run value serialization becomes one Mix-task helper, and discussion
moderation changesets become one schema helper. The three remaining near-match
findings stay explicit because they do not share one behavioral contract.

**Tech Stack:** Elixir, Oban, Ecto, ExDNA, ExUnit.

## Global Constraints

- Preserve import-run counts, status, cursor, and error-summary behavior.
- Preserve CJ report/resume output byte-for-byte.
- Preserve all discussion status, moderator, note, and timestamp changes.
- Do not create a generic schema, repository, callback, or formatting
  framework.

---

## Task 1: CJ Import-Run Completion

**Files:**

- Create: `lib/product_compare/ingestion/cj_run_completion.ex`
- Modify: `lib/product_compare/ingestion/cj_feed_discovery.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_import/runner.ex`
- Test: `test/product_compare/ingestion/cj_feed_discovery_test.exs`
- Test: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

**Interfaces:**

- Produces:
  `CJRunCompletion.complete/3` and `CJRunCompletion.fail/4`, accepting the run,
  final counters, cursor, and failure summary.

- [x] Preserve the existing feed-discovery and import-task behavior suites.
- [x] Move the identical count, cursor, and terminal-status completion contract
  into `CJRunCompletion`.
- [x] Run both named suites; 31 tests pass.
- [x] Commit with message `refactor: share cj import run completion`.

Implementation note: the original worker-support proposal was tested and
rejected because ExDNA continued to report the complete worker facades as a
near match. Removing that finding would require an Oban macro or callback
framework with no concrete responsibility, so the worker finding is retained.

## Task 2: CJ Run Value Serialization

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_runs/value_formatter.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/reports.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/resume.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`

**Interfaces:**

- Produces:
  `ValueFormatter.format/1` for nil, `DateTime`, lists, maps, and scalar values.

- [x] Confirm the existing CJ Runs task examples cover the serialized values.
- [x] Move the identical clauses into `ValueFormatter.format/1` and call it
  from both task owners.
- [x] Run
  `mix test test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`;
  10 tests pass.
- [x] Commit with message `refactor: share cj run value formatting`.

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

- [x] Confirm the existing review, question, and answer moderation assertions
  cover status, moderator, note, and timestamp.
- [x] Delegate each schema's existing `moderation_changeset/5` wrapper to the
  shared helper without changing public schema APIs.
- [x] Run both named suites; 30 tests pass.
- [x] Commit with message `refactor: share discussion moderation changesets`.

## Task 4: Enforce The Reduced Clone Budget

**Files:**

- Modify: `mix.exs`
- Modify: `docs/work/actionable-exdna-clone-retirement.md`

**Interfaces:**

- Produces: repository quality enforcement at `mix ex_dna --max-clones 3`.

- [x] Run `mix ex_dna --max-clones 3`; exactly the three intentionally
  retained near-match findings and exit status 0.
- [x] Change the `quality` alias configuration from
  six to three.
- [x] Run the focused suites, `mix format --check-formatted`,
  `mix typecheck`, `mix work_queue.validate`, `mix ci`, and
  `git diff --check`.
- [x] Record the retained findings and verification evidence in the lane doc.
- [ ] Commit with message `chore: enforce reduced clone budget`.

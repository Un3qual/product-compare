# Reach Baseline Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove actionable Reach findings and replace the pre-decomposition
baseline with current, explicitly justified retained findings.

**Architecture:** Mechanical eager-enumeration, redundant-form, string-building,
and private-forwarder findings are corrected at their existing owners. Stable
boundary maps and deliberate catch-all failure containment remain unchanged
and are captured in a freshly generated baseline.

**Tech Stack:** Elixir, Reach, ExUnit, Mix.

## Global Constraints

- Preserve CLI output byte-for-byte, including separators and terminal newlines.
- Preserve public functions, queries, maps, errors, and failure containment.
- Do not introduce structs, callbacks, repositories, or generic formatting
  frameworks to satisfy advisory findings.
- Do not retain a baseline entry for a mechanically actionable finding.

---

## Task 1: Mechanical Expression Findings

**Files:**

- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `lib/product_compare/catalog/filtering.ex`
- Modify: `lib/product_compare/accounts/users.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_import/candidates.ex`
- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare/accounts/api_tokens.ex`
- Modify: `lib/product_compare/accounts/api_tokens/authentication.ex`
- Modify: `lib/product_compare_web/graphql/loader/root_sources.ex`
- Modify: `lib/product_compare_web/graphql/connection.ex`
- Test: `test/product_compare/accounts/`
- Test: `test/product_compare/catalog/`
- Test: `test/product_compare_web/graphql/`

**Interfaces:**

- Consumes: the existing public context, loader, and connection APIs.
- Produces: identical results using direct pattern heads, `match?/2`,
  `Enum.slice/3`, and non-redundant standard-library calls.

- [ ] Run `mix reach.check --smells --strict`; verify the named suboptimal and
  eager findings fail the red gate.
- [ ] Replace boolean `case` expressions with exact `match?/2` expressions,
  split empty-string and `:operator` literals into function-head patterns,
  replace `Keyword.get(opts, :keywords, nil)` with
  `Keyword.get(opts, :keywords)`, remove the empty separator from
  `Enum.map_join/2`, and replace `Enum.drop/2 |> Enum.take/2` with
  `Enum.slice/3`.
- [ ] Run the Accounts, Catalog, GraphQL connection, and loader suites named
  above; expect zero failures.
- [ ] Re-run strict unsuppressed Reach; verify those findings are absent.
- [ ] Commit with message `refactor: clear mechanical reach findings`.

## Task 2: CLI Rendering Findings

**Files:**

- Modify: `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_candidates/application_cohort_report.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_candidates/fit_gap_report.ex`
- Modify: `lib/mix/tasks/product_attribute_claims.validate_backfill.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_runs/reports.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`
- Test: `test/product_compare/product_attribute_claims/validation_backfill_workflow_test.exs`

**Interfaces:**

- Consumes: the existing report values and row renderers.
- Produces: the exact existing text through `Enum.map_join/3` or bounded
  iodata composition rather than eager intermediate lists.

- [ ] Extend existing output assertions only where a separator or terminal
  newline is not already covered.
- [ ] Run the focused Mix-task suites and confirm the new assertions fail if
  separators or the terminal newline are intentionally changed.
- [ ] Replace each `Enum.map/2 |> Enum.join/1` chain and embedded mapped row list
  with one-pass rendering while retaining the exact text contract.
- [ ] Run the focused Mix-task suites; expect zero failures and byte-identical
  output assertions.
- [ ] Run strict unsuppressed Reach and verify the eager and string-building
  findings are absent.
- [ ] Commit with message `refactor: stream reach-clean cli rendering`.

## Task 3: Private Forwarders

**Files:**

- Modify: `lib/product_compare/ingestion/cj_feed_discovery.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_import/options.ex`
- Test: `test/product_compare/ingestion/cj_feed_discovery_test.exs`
- Test: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

**Interfaces:**

- Consumes: `SourceResolver.fetch_source/0` and
  `IdNormalizer.blank_to_nil/1`.
- Produces: unchanged results with direct private-owner calls.

- [ ] Run the two focused suites; record the green behavior baseline.
- [ ] Replace the two private same-argument forwarding helpers with direct
  calls at their existing call sites and remove only the unused helpers.
- [ ] Run the focused suites; expect zero failures.
- [ ] Run strict unsuppressed Reach and verify both trivial-forwarder findings
  are absent.
- [ ] Commit with message `refactor: remove private reach forwarders`.

## Task 4: Current Baseline And Repository Gate

**Files:**

- Modify: `.reach-baseline.json`
- Modify: `docs/work/reach-baseline-reconciliation.md`

**Interfaces:**

- Produces: a current Reach baseline containing only intentional repeated-map
  and catch-all failure-containment findings.

- [ ] Run `mix reach.check --smells --write-baseline .reach-baseline.json` after
  all actionable findings are absent.
- [ ] Inspect every generated entry and remove or fix any eager, redundant,
  string-building, or trivial-forwarder finding rather than retaining it.
- [ ] Run `mix reach.check --smells --strict --baseline
  .reach-baseline.json`; expect exit status zero and an exact retained count
  recorded in the lane doc.
- [ ] Run the focused suites, `mix format --check-formatted`, `mix typecheck`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Commit with message `chore: reconcile reach baseline`.

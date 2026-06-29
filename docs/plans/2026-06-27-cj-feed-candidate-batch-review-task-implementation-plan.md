# CJ Feed Candidate Batch Review Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator command for safely applying the same review status to an explicit batch of CJ feed candidates.

**Architecture:** Add a bounded Mix task that updates candidates only when they are explicitly identified by relay id or provider feed id. The task defaults to dry-run mode, limits batch size, and reuses the existing `ProductCompare.Ingestion.review_merchant_feed_candidate/2` path for validation.

**Tech Stack:** Elixir, Ecto, Absinthe global IDs, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new batch-review task/test pair and does not change the GraphQL or frontend review workflow.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`
- `docs/work/product-data-scraping.md` under the candidate-review-batch evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/schema.ex`
- `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- `assets/src/routes/ingestion/feed-candidates/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_candidate_review_batch`.
- Require `--status pending|shortlisted|dismissed`.
- Accept repeated `--id <relay-id>` and repeated `--provider-feed-id <feed-id>`.
- Default to dry-run mode; require `--apply` before mutating rows.
- Support optional `--note`, trimming blank notes to nil.
- Limit each invocation to at most `50` candidates.
- Print candidate ids and aggregate counts only.
- Do not create merchants, submit applications, contact CJ, schedule work, print raw metadata, print credentials, or export CSV.

## Task 1: Batch Review Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source and candidates with provider feed ids `feed-1`, `feed-2`, and `feed-3`.

Cover:

- dry-run output reports `dry_run=true matched=2 updated=0` and leaves statuses unchanged;
- `--apply --status shortlisted --provider-feed-id feed-1 --provider-feed-id feed-2 --note "Launch cohort"` updates both rows through the review changeset and records the note;
- repeated relay `--id` values are deduplicated;
- non-CJ candidates with the same provider feed id are ignored;
- missing status raises `review status is required`;
- no ids raises `at least one candidate id or provider feed id is required`;
- more than 50 identifiers raises `candidate review batch limit is 50`;
- output does not include raw metadata, token markers, account id markers, or tracking markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Batch Review Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjCandidateReviewBatch` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.Ingestion`, `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, `ProductCompareWeb.GraphQL.GlobalId`, and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Reviews an explicit batch of CJ feed candidates"`.

- [ ] **Step 2: Parse and validate options**

Use `OptionParser.parse/2` with `strict: [status: :string, id: :keep, provider_feed_id: :keep, note: :string, apply: :boolean]`. Normalize status to lowercase and require one of the three persisted statuses.

Decode relay ids with `GlobalId.decode_integer(value, :merchant_feed_candidate)`. Ignore ids that do not decode, but include them in an `invalid_ids` count.

- [ ] **Step 3: Resolve explicit CJ candidates**

Query candidates where `provider == "cj"` and either id or provider feed id matches. Deduplicate by id and preserve deterministic order by advertiser name, feed name, provider feed id, and id.

- [ ] **Step 4: Apply or dry-run**

When `--apply` is absent, print aggregate counts and candidate ids without writing. When present, call `Ingestion.review_merchant_feed_candidate(candidate.id, %{review_status: status, review_note: note})` for each candidate.

- [ ] **Step 5: Render safe output**

Print:

```text
provider=cj dry_run=false requested=2 matched=2 updated=2 invalid_ids=0 status=shortlisted
candidate_id=<relay-id> provider_feed_id=feed-1 review_status=shortlisted
```

Do not print note contents; print `note_present=true` when a note was supplied.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs
```

Expected: pass.

- [ ] **Step 2: Run typecheck and diff check**

```bash
mix typecheck
git diff --check
```

Expected: both pass.

- [ ] **Step 3: Commit the slice**

```bash
git add lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs docs/work/product-data-scraping.md
git commit -m "feat: batch review CJ feed candidates"
```

## Exit Condition

This row is complete when the batch-review tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records the dry-run default, explicit-id requirement, and no-application guardrail.

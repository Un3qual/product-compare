# CJ Feed Candidate Staleness Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only operator command that reports stale CJ feed candidates based on `last_seen_at`.

**Architecture:** Add an isolated Mix task that queries `merchant_feed_candidates`, applies local age and review-status filters, and prints non-secret candidate identity fields. This gives operators a maintenance view without modifying candidates or calling CJ.

**Tech Stack:** Elixir, Ecto, Mix tasks, ExUnit.

**Status:** ready. This plan is part of the 2026-06-27 ten-plan CJ operator loop parallel batch.

---

## Parallel Ownership

This row owns a new read-only candidate staleness task and can run in parallel with history and readiness tasks because it does not edit shared context code.

Owned paths:

- `lib/mix/tasks/product_compare.ingestion.cj_candidate_staleness.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs`
- `docs/work/product-data-scraping.md` under the candidate-staleness evidence heading only

Do not edit:

- `lib/product_compare/ingestion.ex`
- `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- `lib/product_compare_web/**`
- `assets/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add `mix product_compare.ingestion.cj_candidate_staleness`.
- Default `--max-age-hours` to `168`.
- Support `--status pending|shortlisted|dismissed|all`, default `all`.
- Support `--limit`, default `25`, maximum `100`.
- Support `--require-fresh`; when any stale candidates are found, raise `Mix.Error` with `stale CJ feed candidates found`.
- Print only non-secret candidate fields: relay id, provider feed id, advertiser id, advertiser name, review status, product count, last seen timestamp, and age hours.
- Do not mutate candidates, call CJ, print raw metadata, print credentials, create files, or export CSV.

## Task 1: Staleness Tests

**Files:**

- Create: `test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs`

- [ ] **Step 1: Add failing tests**

Use `ProductCompare.DataCase, async: false` and `ExUnit.CaptureIO`.

Seed a CJ source and candidates:

- stale pending candidate last seen 10 days ago;
- fresh pending candidate last seen 1 hour ago;
- stale shortlisted candidate last seen 9 days ago;
- non-CJ candidate last seen 20 days ago.

Cover:

- default output includes the stale CJ candidates and excludes the fresh and non-CJ candidates;
- `--status pending` includes only stale pending candidates;
- `--max-age-hours 24 --limit 1` prints one candidate line;
- `--require-fresh` raises `stale CJ feed candidates found` when stale rows exist;
- no stale rows prints `stale_count=0`;
- output never includes raw metadata, token markers, account id markers, or tracking markers.

Run:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs
```

Expected: fail because the task does not exist yet.

## Task 2: Staleness Task

**Files:**

- Create: `lib/mix/tasks/product_compare.ingestion.cj_candidate_staleness.ex`

- [ ] **Step 1: Add task module**

Create `Mix.Tasks.ProductCompare.Ingestion.CjCandidateStaleness` with:

- `use Mix.Task`;
- `import Ecto.Query`;
- aliases for `ProductCompare.MixTasks.RepoOnlyStartup`, `ProductCompare.Repo`, `ProductCompareWeb.GraphQL.GlobalId`, and `ProductCompareSchemas.Ingestion.MerchantFeedCandidate`;
- `@shortdoc "Reports stale CJ feed candidates"`.

- [ ] **Step 2: Parse filters**

Normalize:

- `max_age_hours`: positive integer, default `168`;
- `status`: one of `pending`, `shortlisted`, `dismissed`, `all`, default `all`;
- `limit`: positive integer, default `25`, clamp to `100`;
- `require_fresh`: boolean.

- [ ] **Step 3: Query stale candidates**

Compute the cutoff with `DateTime.add(DateTime.utc_now(), -max_age_hours, :hour)` and query CJ candidates where `last_seen_at < cutoff`, ordered by oldest `last_seen_at` then `advertiser_name`, `feed_name`, and `id`.

- [ ] **Step 4: Render safe output**

Print a header:

```text
provider=cj max_age_hours=168 stale_count=2
```

Then print each candidate:

```text
candidate_id=MerchantFeedCandidate:abc provider_feed_id=feed-1 advertiser_id=adv-1 advertiser_name="Trail Merchant" review_status=pending product_count=12000 last_seen_at=2026-06-17T12:00:00Z age_hours=240
```

Use `GlobalId.encode_required(:merchant_feed_candidate, candidate.id)` for ids.

## Task 3: Verify

- [ ] **Step 1: Run focused tests**

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs
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
git add lib/mix/tasks/product_compare.ingestion.cj_candidate_staleness.ex test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs docs/work/product-data-scraping.md
git commit -m "feat: report stale CJ feed candidates"
```

## Exit Condition

This row is complete when the staleness tests, `mix typecheck`, and `git diff --check` pass, and the lane doc records that the task is read-only and secret-safe.

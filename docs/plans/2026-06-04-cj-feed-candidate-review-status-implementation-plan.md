# CJ Feed Candidate Review Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the browser review captured CJ feed candidates by marking each candidate as pending, shortlisted, or dismissed without starting merchant application automation.

**Architecture:** Add durable review fields to `merchant_feed_candidates` and preserve those fields during feed discovery upserts. Expose the review fields plus one GraphQL mutation for status changes, then add minimal Relay mutation controls to `/ingestion/feed-candidates`. Keep scoring algorithms, merchant applications, account-manager automation, scheduled polling, and credential config out of scope.

**Tech Stack:** Elixir, Ecto migrations, Absinthe GraphQL, Bun, React Router SSR, Relay, Vitest, ExUnit.

**Status:** done. Completion evidence lives in `docs/work/product-data-scraping.md`.

---

## Scope

- Add review state to existing feed candidates:
  - `review_status`: `pending`, `shortlisted`, or `dismissed`, default `pending`.
  - `review_note`: optional text.
  - `reviewed_at`: timestamp set when status or note is changed.
- Preserve review fields when `shoppingProductFeeds` discovery replays the same provider feed id.
- Expose review fields in the existing `merchantFeedCandidates` query.
- Add one GraphQL mutation to update review status and optional note.
- Add route controls for shortlist, dismiss, and reset-to-pending.
- Keep candidate scoring, merchant application submission, scheduled discovery, account automation, and Tier-3 scraping out of scope.

## Task 1: Backend Review State

**Files:**
- Create: `priv/repo/migrations/20260604230000_add_review_status_to_merchant_feed_candidates.exs`
- Modify: `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`
- Modify: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

- [x] **Step 1: Add failing context and GraphQL tests**

Add context coverage proving:

- a new candidate defaults to `review_status == "pending"`;
- `Ingestion.review_merchant_feed_candidate/2` changes status, note, and `reviewed_at`;
- replaying `upsert_merchant_feed_candidate/2` does not reset status, note, or `reviewed_at`;
- invalid statuses are rejected.

Add GraphQL coverage proving:

- `merchantFeedCandidates` returns `reviewStatus`, `reviewNote`, and `reviewedAt`;
- `reviewMerchantFeedCandidate(input:)` accepts a global candidate id plus `status` and `note`;
- raw local ids and invalid statuses return typed payload errors instead of changing the row.

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
```

Expected: fail because review fields and mutation do not exist.

- [x] **Step 2: Add migration, schema fields, and context update**

Add fields and constraints:

- `review_status :text, null: false, default: "pending"`
- `review_note :text`
- `reviewed_at :utc_datetime_usec`
- check constraint `review_status IN ('pending', 'shortlisted', 'dismissed')`

Update `MerchantFeedCandidate.changeset/2` and add a focused review changeset.

Add `ProductCompare.Ingestion.review_merchant_feed_candidate/2`, accepting `%{review_status:, review_note:}` and setting `reviewed_at` to `DateTime.utc_now()` when the changeset is valid.

Do not add review fields to the upsert replacement list, so discovery replay preserves human review state.

- [x] **Step 3: Add GraphQL mutation contract**

Add:

- `enum :merchant_feed_candidate_review_status` with `:pending`, `:shortlisted`, and `:dismissed`.
- `input_object :review_merchant_feed_candidate_input` with `id`, `status`, and optional `note`.
- `object :review_merchant_feed_candidate_payload` with `candidate` and `errors`.
- mutation `review_merchant_feed_candidate(input:)`.

Decode `id` as `:merchant_feed_candidate`, return payload errors for invalid ids/statuses, and expose `review_status`, `review_note`, and `reviewed_at` on `MerchantFeedCandidate`.

- [x] **Step 4: Verify backend slice**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
mix typecheck
```

Expected: all pass.

## Task 2: Frontend Review Controls

**Files:**
- Modify: `assets/schema.graphql`
- Modify: `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- Create: `assets/src/routes/ingestion/feed-candidates/mutations/ReviewMerchantFeedCandidateMutation.ts`
- Modify: `assets/src/routes/ingestion/feed-candidates/index.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx`
- Generate: `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`
- Generate: `assets/src/__generated__/ReviewMerchantFeedCandidateMutation.graphql.ts`

- [x] **Step 1: Add failing route tests**

Add route coverage proving:

- each candidate row renders the current review status;
- `Shortlist`, `Dismiss`, and `Reset` buttons commit `reviewMerchantFeedCandidate` with the candidate id and expected status;
- mutation payload errors render in the route feedback region.

Run:

```bash
cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx
```

Expected: fail because the route has no review controls.

- [x] **Step 2: Add Relay mutation and route controls**

Update the query to fetch `reviewStatus`, `reviewNote`, and `reviewedAt`.

Add a Relay mutation for `reviewMerchantFeedCandidate(input:)`.

In each candidate row, render current status and buttons for `shortlisted`, `dismissed`, and `pending`. Use a route-local feedback region for success and payload errors. Do not render raw metadata, credentials, account IDs, tokens, or tracking parameters.

- [x] **Step 3: Verify frontend slice**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx
cd assets && bun run typecheck
```

Expected: all pass.

## Task 3: Close Queue State

**Files:**
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/plans/2026-06-04-cj-feed-candidate-review-status-implementation-plan.md`

- [x] **Step 1: Record completion evidence**

Update `docs/work/product-data-scraping.md` with changed paths, verification output, and remaining deferred work.

- [x] **Step 2: Close or promote the next row**

If verification passes, remove the ready row from `docs/work/index.md`.

If no next batch is chosen, leave the queue with no ready rows and note that the next coordinator decision is either candidate scoring, merchant application planning, or scheduled CJ discovery.

- [x] **Step 3: Final verification**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
cd assets && bun run relay
cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx
cd assets && bun run typecheck
mix typecheck
git diff --check
```

Expected: all pass.

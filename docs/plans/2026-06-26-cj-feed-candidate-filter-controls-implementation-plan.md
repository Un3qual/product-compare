# CJ Feed Candidate Filter Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the operator filter and sort `/ingestion/feed-candidates` using the backend review-status and candidate-sort args that already exist.

**Architecture:** Keep this row frontend-only. Parse review-status and sort URL params in the route loader, pass them to the existing Relay query, render compact controls, and preserve the selected filters across pagination links.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-26 scheduled CJ discovery parallel batch.

---

## Parallel Ownership

This row may run in parallel with the scheduled-discovery-runtime and discovery-status rows.

Owned paths:

- `assets/src/routes/ingestion/feed-candidates/pagination.ts`
- `assets/src/routes/ingestion/feed-candidates/loader.ts`
- `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- `assets/src/routes/ingestion/feed-candidates/index.tsx`
- `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/product-data-scraping.md` under the feed-candidate-controls evidence heading only

Do not edit:

- `lib/product_compare/**`
- `lib/product_compare_web/**`
- `assets/schema.graphql`
- `assets/src/routes/ingestion/feed-candidates/mutations/ReviewMerchantFeedCandidateMutation.ts`
- `assets/src/__generated__/ReviewMerchantFeedCandidateMutation.graphql.ts`
- `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`
- `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Add URL params:
  - `reviewStatus=pending|shortlisted|dismissed`;
  - omitted or unsupported `reviewStatus` means all statuses;
  - `sort=name_asc|product_count_desc|last_seen_desc`;
  - omitted or unsupported `sort` means `name_asc`.
- Pass GraphQL variables:
  - `reviewStatus: PENDING | SHORTLISTED | DISMISSED | null`;
  - `sort: NAME_ASC | PRODUCT_COUNT_DESC | LAST_SEEN_DESC`.
- Render controls for review status and sort.
- Preserve selected `reviewStatus`, `sort`, and `first` on the next-page link, and clear only `after` on the first-page link.
- Do not add backend schema work, new review statuses, application automation, scheduled-run controls, or live CJ network calls.

## Task 1: Loader Variables

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/pagination.ts`
- Modify: `assets/src/routes/ingestion/feed-candidates/loader.ts`
- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts`

- [ ] **Step 1: Add failing loader tests**

Extend the loader tests to prove:

- `?reviewStatus=shortlisted&sort=product_count_desc` preloads with `reviewStatus: "SHORTLISTED"` and `sort: "PRODUCT_COUNT_DESC"`;
- unsupported values preload with `reviewStatus: null` and `sort: "NAME_ASC"`;
- existing pagination behavior still preserves valid `first` and `after`.

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts
```

Expected: fail because the loader only passes pagination variables.

- [ ] **Step 2: Parse filter params**

Extend the pagination/filter helper so the loader returns one object containing:

- `first`;
- `after`;
- `reviewStatus`;
- `sort`.

Use uppercase Relay enum strings for variables and lowercase URL values for the route.

- [ ] **Step 3: Pass variables to Relay**

Update `feedCandidatesLoader` so `preloadRouteQuery` receives the combined pagination/filter variables. The error-state payload should retain the same combined object so controls can render after preload failures.

## Task 2: Relay Query Contract

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- Generate: `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`

- [ ] **Step 1: Add query variables**

Change the Relay query to accept:

```graphql
$reviewStatus: MerchantFeedCandidateReviewStatus
$sort: MerchantFeedCandidateSort
```

Pass both variables into `merchantFeedCandidates(first:, after:, reviewStatus:, sort:)`.

- [ ] **Step 2: Regenerate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: generated query types include the new variables and enum values.

## Task 3: Route Controls And Pagination Preservation

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/index.tsx`
- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`

- [ ] **Step 1: Add failing route tests**

Add route tests proving:

- the route renders controls named `Review status` and `Sort candidates`;
- the controls reflect loader data for `SHORTLISTED` and `PRODUCT_COUNT_DESC`;
- the first-page link preserves `reviewStatus` and `sort` while dropping `after`;
- the next-page link preserves `reviewStatus`, `sort`, and `first`.

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
```

Expected: fail because controls and filter-preserving links do not exist yet.

- [ ] **Step 2: Render controls**

Render a small GET form or link group above the review summary:

- status options: all, pending, shortlisted, dismissed;
- sort options: name, product count, last seen.

Keep the existing candidate list, review actions, note capture, and current-page counts.

- [ ] **Step 3: Preserve filters in links**

Update the first and next pagination path helpers so they include selected filters and `first`, but do not include `after` on the first-page link.

- [ ] **Step 4: Verify the frontend slice**

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
cd assets && bun run relay
cd assets && bun run typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 5: Commit the frontend controls slice**

```bash
git add assets/src/routes/ingestion/feed-candidates/pagination.ts assets/src/routes/ingestion/feed-candidates/loader.ts assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts assets/src/routes/ingestion/feed-candidates/index.tsx assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts assets/test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx docs/work/product-data-scraping.md
git commit -m "feat: filter CJ feed candidates"
```

## Exit Condition

This row is complete when loader tests, route tests, Relay generation, frontend typecheck, and `git diff --check` pass, and the feed-candidate-controls evidence heading in `docs/work/product-data-scraping.md` records the exact commands.

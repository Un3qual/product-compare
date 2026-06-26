# CJ Feed Candidate Score Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show non-secret fit-score cues on the CJ feed candidate review route using fields the route already loads.

**Architecture:** Keep this row frontend-only. Derive a display-only score and reason list from existing Relay data in `/ingestion/feed-candidates`, render compact badges in each candidate row, and leave backend schema, Relay query text, and generated artifacts untouched.

**Tech Stack:** React, React Router, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-26 broader CJ candidate scoring parallel batch.

---

## Parallel Ownership

This row may run in parallel with the fit-score-sort and score-export rows.

Owned paths:

- `assets/src/routes/ingestion/feed-candidates/index.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/product-data-scraping.md` under the frontend-score-badges evidence heading only

Do not edit:

- `assets/src/routes/ingestion/feed-candidates/loader.ts`
- `assets/src/routes/ingestion/feed-candidates/pagination.ts`
- `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- `assets/src/__generated__/**`
- `assets/schema.graphql`
- `lib/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Compute a display-only fit score from already loaded candidate fields:
  - product count: `>= 10000` gives 50 points, `>= 1000` gives 35 points, `>= 100` gives 20 points, `> 0` gives 10 points, otherwise 0;
  - `advertiserCountry == "US"` gives 20 points after uppercase normalization;
  - `currency == "USD"` gives 15 points after uppercase normalization;
  - `language == "EN"` gives 10 points after uppercase normalization;
  - any non-empty `sourceFeedType` gives 5 points.
- Render `Fit score N` for every candidate.
- Render reason text in this order: product-count reason, US market, USD, English, feed type present.
- Add no new route params, filters, backend schema, generated Relay artifacts, live CJ calls, credential handling, or application automation.
- Preserve existing review actions, note handling, pagination links, and current-page review counts.

## Task 1: Frontend Score Display Tests

**Files:**

- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`

- [ ] **Step 1: Add failing route coverage**

Extend the route fixture data so at least two candidates have clearly different fit scores:

- Trail Merchant: `productCount: 5000`, `advertiserCountry: "US"`, `currency: "USD"`, `language: "EN"`, `sourceFeedType: "PRODUCT"` -> 85 points.
- City Gear: `productCount: 50`, `advertiserCountry: "CA"`, `currency: "CAD"`, `language: "EN"`, `sourceFeedType: null` -> 20 points.

Add assertions that the rendered list includes:

- `Fit score 85`;
- `1000+ products`;
- `US market`;
- `USD`;
- `English`;
- `feed type present`;
- `Fit score 20`.

Also assert the route still does not render account, token, tracking, or raw metadata markers.

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
```

Expected: fail because the route does not render fit scores.

## Task 2: Score Badge Rendering

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/index.tsx`

- [ ] **Step 1: Add local score helpers**

Add local helpers near the existing formatting helpers:

```ts
function candidateFitScore(candidate: FeedCandidate) {
  return productCountFitPoints(candidate.productCount) +
    exactCandidateFieldPoints(candidate.advertiserCountry, "US", 20) +
    exactCandidateFieldPoints(candidate.currency, "USD", 15) +
    exactCandidateFieldPoints(candidate.language, "EN", 10) +
    sourceFeedTypeFitPoints(candidate.sourceFeedType);
}
```

Use separate reason helpers so displayed reasons are deterministic and match the scope section.

- [ ] **Step 2: Render score and reasons per candidate**

Inside `FeedCandidateListItem`, compute:

```ts
const fitScore = candidateFitScore(candidate);
const fitReasons = candidateFitReasons(candidate);
```

Render a small block after product count and before review status:

```tsx
<p>{`Fit score ${fitScore}`}</p>
{fitReasons.length > 0 ? (
  <ul aria-label={`Fit reasons for ${candidateName}`}>
    {fitReasons.map((reason) => (
      <li key={reason}>{reason}</li>
    ))}
  </ul>
) : null}
```

Use stable reason strings:

- `10000+ products`
- `1000+ products`
- `100+ products`
- `1+ products`
- `US market`
- `USD`
- `English`
- `feed type present`

- [ ] **Step 3: Verify the frontend slice**

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 4: Commit the frontend score badges slice**

```bash
git add assets/src/routes/ingestion/feed-candidates/index.tsx assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx docs/work/product-data-scraping.md
git commit -m "feat: show CJ candidate fit scores"
```

## Exit Condition

This row is complete when the route tests, frontend typecheck, and `git diff --check` pass, and the frontend-score-badges evidence heading in `docs/work/product-data-scraping.md` records the exact commands.

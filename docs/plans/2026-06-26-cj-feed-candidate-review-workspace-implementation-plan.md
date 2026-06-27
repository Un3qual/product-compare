# CJ Feed Candidate Review Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/ingestion/feed-candidates` a more useful manual review workspace using fields and mutations that already exist.

**Architecture:** Keep this row frontend-only. The route already fetches `reviewStatus`, `reviewNote`, and `reviewedAt`, and `reviewMerchantFeedCandidate(input:)` already accepts an optional note, so the worker can add grouping, note capture, and tests without backend schema work.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-26 parallel CJ candidate planning batch.

---

## Parallel Ownership

This row may run in parallel with the ranking-contract and shortlist-export rows.

Owned paths:

- `assets/src/routes/ingestion/feed-candidates/index.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/product-data-scraping.md` under the review-workspace evidence heading only

Do not edit:

- `lib/product_compare/**`
- `lib/product_compare_web/**`
- `assets/schema.graphql`
- `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- `assets/src/routes/ingestion/feed-candidates/mutations/ReviewMerchantFeedCandidateMutation.ts`
- `assets/src/__generated__/**`
- `docs/work/index.md`
- `docs/plans/INDEX.md`

## Scope

- Render counts for pending, shortlisted, and dismissed candidates on the current page.
- Render any existing review note and reviewed timestamp for each candidate.
- Add a note input per candidate and send a trimmed note with `reviewMerchantFeedCandidate` when the note is non-empty.
- Preserve the existing shortlist, dismiss, and reset actions.
- Keep filtering, backend sorting, generated Relay changes, application submission, and scheduling out of scope.

## Task 1: Route Test Coverage

**Files:**

- Create: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`

- [ ] **Step 1: Add route test setup**

Follow the pattern in `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`:

- mock `useLoaderData`;
- mock `useRoutePreloadedQuery`;
- mock `usePreloadedQuery`;
- mock `useMutation`;
- render `FeedCandidatesRoute` inside `MemoryRouter`.

Use a ready loader value shaped like:

```ts
const FEED_CANDIDATES_QUERY_DESCRIPTOR = {
  __relayQuery: {
    operationName: "MerchantFeedCandidatesRouteQuery",
    text: "query MerchantFeedCandidatesRouteQuery($first: Int, $after: String) { merchantFeedCandidates(first: $first, after: $after) { edges { node { id } } } }",
    variables: { first: 20, after: null }
  }
};
```

Use candidate fixtures with one `PENDING`, one `SHORTLISTED`, and one `DISMISSED` node. Include one existing `reviewNote` and `reviewedAt` value.

- [ ] **Step 2: Add failing assertions**

Cover these behaviors:

- the route renders the page counts as `Pending 1`, `Shortlisted 1`, and `Dismissed 1`;
- an existing review note is visible for the shortlisted candidate;
- a reviewed timestamp is rendered as a human-readable date string;
- typing `High fit for launch cohort` into the shortlisted candidate note input and clicking `Shortlist` commits:

```ts
{
  input: {
    id: "candidate-1",
    status: "SHORTLISTED",
    note: "High fit for launch cohort"
  }
}
```

- blank note inputs omit `note` from the mutation variables.

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
```

Expected: fail because the route does not render counts or note inputs yet.

## Task 2: Review Workspace UI

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/index.tsx`

- [ ] **Step 1: Add count helpers**

Add a small helper near the existing formatters:

```ts
function countByReviewStatus(candidates: ReadonlyArray<FeedCandidate>) {
  return candidates.reduce(
    (counts, candidate) => {
      switch (candidate.reviewStatus) {
        case "SHORTLISTED":
          counts.shortlisted += 1;
          break;
        case "DISMISSED":
          counts.dismissed += 1;
          break;
        default:
          counts.pending += 1;
          break;
      }

      return counts;
    },
    { dismissed: 0, pending: 0, shortlisted: 0 }
  );
}
```

Render the counts above the list in a `<dl aria-label="CJ feed candidate review summary">`.

- [ ] **Step 2: Add route-local note state**

Track notes by candidate id:

```ts
const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
```

Use `reviewNotes[candidate.id] ?? candidate.reviewNote ?? ""` as the textarea value. Add a setter that updates only the edited candidate id.

- [ ] **Step 3: Send non-empty notes with review mutations**

Change `handleReview` to read the current note for the candidate, trim it, and include it only when non-empty:

```ts
const note = (reviewNotes[candidate.id] ?? candidate.reviewNote ?? "").trim();
const input =
  note.length > 0
    ? { id: candidate.id, status, note }
    : { id: candidate.id, status };
```

Pass `input` to the mutation variables.

- [ ] **Step 4: Render note and reviewed metadata**

Inside `FeedCandidateListItem`, render:

- a `<textarea>` with label `Review note for ${candidateName}`;
- existing note copy when present;
- `Reviewed ${formatReviewedAt(candidate.reviewedAt)}` when `reviewedAt` exists.

Use a formatter that returns `new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))` for valid strings and `""` for missing or invalid values.

- [ ] **Step 5: Verify frontend slice**

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit frontend slice**

```bash
git add assets/src/routes/ingestion/feed-candidates/index.tsx assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx docs/work/product-data-scraping.md
git commit -m "feat: improve CJ feed candidate review workspace"
```

## Exit Condition

This row is complete when the route test, frontend typecheck, and diff check pass, and the review-workspace evidence heading in `docs/work/product-data-scraping.md` records the exact commands.

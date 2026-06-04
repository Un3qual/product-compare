# CJ Feed Candidate Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the captured CJ `shoppingProductFeeds` candidates visible through a non-secret GraphQL read model and a read-only browser route.

**Architecture:** Reuse `merchant_feed_candidates` as the persistence source and expose a paginated GraphQL connection that returns only review-safe fields. Add a Relay-backed frontend route that lists candidates with pagination and empty/error states. Keep scoring, approval workflows, scheduled polling, credential config, and CJ account automation out of scope.

**Tech Stack:** Elixir, Absinthe GraphQL, Ecto, Bun, React Router SSR, Relay, Vitest, ExUnit.

---

## Scope

- Expose non-secret CJ feed candidate fields already stored in `merchant_feed_candidates`.
- Add one read-only GraphQL query and one Relay-backed browser route.
- Preserve the manual CJ credential boundary: credentials stay in ignored env files or shell environment and are not stored or rendered.
- Keep this batch demoable without adding background jobs, provider polling, scoring, merchant applications, candidate acceptance mutations, or Tier-3 scraping.

## Task 1: Backend GraphQL Read Model

**Files:**
- Modify: `lib/product_compare/ingestion.ex`
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Create: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Create: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

- [ ] **Step 1: Add failing GraphQL coverage**

Add a GraphQL test that inserts a CJ `Source`, two `MerchantFeedCandidate` rows through `ProductCompare.Ingestion.upsert_merchant_feed_candidate/2`, then queries:

```graphql
query MerchantFeedCandidates($first: Int, $after: String) {
  merchantFeedCandidates(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        provider
        providerFeedId
        advertiserName
        advertiserCountry
        sourceFeedType
        currency
        language
        feedName
        productCount
        providerLastUpdatedAt
        lastSeenAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
    }
  }
}
```

Assert that the response includes the non-secret display fields and does not expose `rawMetadata`.

Run:

```bash
mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
```

Expected: fail because the GraphQL field and object types do not exist.

- [ ] **Step 2: Add query helper and resolver**

Add `ProductCompare.Ingestion.list_merchant_feed_candidates_query/0`, ordered by `advertiser_name`, `feed_name`, and `provider_feed_id`.

Create `ProductCompareWeb.Resolvers.IngestionResolver.merchant_feed_candidates/3` that calls `ProductCompareWeb.GraphQL.Connection.from_query_result/3` with `Input.connection_args(args)`.

- [ ] **Step 3: Add schema types and query field**

In `lib/product_compare_web/schema.ex`, add:

- `field :merchant_feed_candidates, :merchant_feed_candidate_connection` under the query object.
- `object :merchant_feed_candidate` with the fields from the test query.
- connection, edge, and pageInfo usage matching existing connection types.
- `ProductCompareWeb.GraphQL.GlobalId` support for `:merchant_feed_candidate` with type name `MerchantFeedCandidate`.
- `id` encoded with `GlobalId.encode_required(:merchant_feed_candidate, candidate.id)`.

Do not expose `raw_metadata`, and do not add root `node(id:)` lookup for feed candidates in this batch.

- [ ] **Step 4: Verify backend slice**

Run:

```bash
mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
mix test test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
mix typecheck
```

Expected: all pass.

## Task 2: Relay Route And Browser Surface

**Files:**
- Modify: `assets/schema.graphql`
- Create: `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`
- Create: `assets/src/routes/ingestion/feed-candidates/pagination.ts`
- Create: `assets/src/routes/ingestion/feed-candidates/loader.ts`
- Create: `assets/src/routes/ingestion/feed-candidates/index.tsx`
- Create: `assets/src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts`
- Create: `assets/src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify if navigation entry is added: `assets/src/routes/root.tsx`
- Generate: `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`

- [ ] **Step 1: Add failing loader and route tests**

Add loader coverage proving `/ingestion/feed-candidates` preloads `{ first: 20 }`, forwards supported `first` and `after` query params, and returns a route-local error state when preloading fails.

Add route coverage proving the ready state renders:

- a list named `CJ feed candidates`;
- advertiser name;
- feed name;
- product count;
- country, currency, and language when present;
- `Next candidates` and `First candidates` pagination links from `pageInfo`;
- a stable empty state when no edges exist.

Run:

```bash
cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx
```

Expected: fail because the route does not exist.

- [ ] **Step 2: Add Relay query, loader, and pagination helpers**

Create `MerchantFeedCandidatesRouteQuery` for `merchantFeedCandidates(first:, after:)`.

Follow the existing merchant-directory route pattern:

- use `preloadRouteQuery`;
- parse `first` and `after` from URL params;
- default `first` to `20`;
- cap `first` at `50`;
- recover loader failures through `recoverRouteLoaderError`.

- [ ] **Step 3: Add route UI and router entry**

Create a read-only route at `/ingestion/feed-candidates`.

Render only fields returned by the new GraphQL query. Do not display raw provider metadata, credentials, account IDs, tokens, or tracking parameters.

Wire the route in `assets/src/router.tsx` with `RouteErrorBoundary`.

Add root navigation only if it fits the existing root navigation density; otherwise keep the route directly addressable for this batch.

- [ ] **Step 4: Generate Relay artifacts and verify frontend slice**

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

- [ ] **Step 1: Record completion evidence**

Update `docs/work/product-data-scraping.md` with the changed paths, verification output, and remaining deferred work.

- [ ] **Step 2: Close or promote the next row**

If verification passes, remove the ready row from `docs/work/index.md`.

If no next batch is chosen, leave the queue with no ready rows and note that the next coordinator decision is either candidate scoring/approval UX or scheduled CJ discovery.

- [ ] **Step 3: Final verification**

Run:

```bash
mix test test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
cd assets && bun run relay
cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx
cd assets && bun run typecheck
mix typecheck
git diff --check
```

Expected: all pass with no credential or raw payload output.

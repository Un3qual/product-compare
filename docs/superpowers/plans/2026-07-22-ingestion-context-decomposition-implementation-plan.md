# Ingestion Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Ingestion` as the stable public context while
moving import-run, feed-candidate, merchant-identity, and canonical-listing
persistence implementations into focused internal modules.

**Architecture:** `ProductCompare.Ingestion` remains the only caller-facing
facade and preserves every public function, arity, typespec, result, and error.
Four `ProductCompare.Ingestion.*` modules own the existing implementations by
responsibility; Mix tasks, jobs, resolvers, loaders, fixtures, and tests
continue to depend only on the facade.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Oban, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Ingestion` public function, arity,
  typespec, value, and error.
- Preserve transaction boundaries, locks, conflict targets, freshness rules,
  replay behavior, reconciliation, canonical identity, enrichment, source
  provenance, price-point creation, and alert enqueue behavior.
- Keep `ProductCompare.Ingestion` as the only application-facing facade;
  callers must not move to internal modules.
- Do not change schemas, migrations, GraphQL SDL, provider policy, scheduling,
  product behavior, or deferred ingestion dashboard/operator scope.
- Move code by responsibility without introducing a generic callback, adapter,
  or shared helper module that obscures ownership.

---

### Task 1: Import-Run Ownership

**Files:**

- Create: `lib/product_compare/ingestion/runs.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`
- Test: `test/product_compare/ingestion/reconciliation_test.exs`

**Interfaces:** `ProductCompare.Ingestion.Runs` owns import-run start and
completion plus reconciliation preparation. `ProductCompare.Ingestion` retains
the exact public wrappers:

```elixir
start_import_run/1
complete_import_run/2
```

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move run defaulting, scope-fingerprint preparation, completion
  transaction, and reconciliation finalization into `Runs` without changing
  persisted values, timestamps, cursor normalization, or rollback behavior.
- [ ] Replace the facade implementations with explicit wrappers that retain
  the existing typespecs and struct pattern match:

```elixir
def start_import_run(attrs), do: Runs.start_import_run(attrs)

def complete_import_run(%ImportRun{} = import_run, attrs),
  do: Runs.complete_import_run(import_run, attrs)
```

- [ ] Re-run the two suites and confirm complete, partial, failed, superseded,
  and differently scoped runs retain their existing reconciliation results.
- [ ] Commit with message `refactor: isolate ingestion run ownership`.

### Task 2: Feed-Candidate Ownership

**Files:**

- Create: `lib/product_compare/ingestion/feed_candidates.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`
- Test: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`

**Interfaces:** `ProductCompare.Ingestion.FeedCandidates` owns candidate
upsert, source-scoped listing, query construction, ranking, review updates,
attribute normalization, and fit-score ordering. The facade retains:

```elixir
upsert_merchant_feed_candidate/2
list_merchant_feed_candidates/1
list_merchant_feed_candidates_query/0,1
review_merchant_feed_candidate/2
```

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move candidate persistence, filtering, deterministic ordering, fit-score
  ordering, review normalization, and not-found behavior into
  `FeedCandidates` with the current conflict target and replacement fields.
- [ ] Add explicit facade wrappers that preserve source struct matches,
  zero-arity query delegation, accepted option shapes, and review guards.
- [ ] Re-run the two suites and confirm source isolation, filters, ordering,
  pagination inputs, authorization behavior, mutation errors, and public
  GraphQL values remain unchanged.
- [ ] Commit with message `refactor: isolate ingestion candidate ownership`.

### Task 3: Merchant-Identity Ownership

**Files:**

- Create: `lib/product_compare/ingestion/merchant_identities.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`

**Interfaces:** `ProductCompare.Ingestion.MerchantIdentities` owns public and
transaction-local merchant identity resolution, merchant upsert/retargeting,
freshness-safe conflict recovery, domain fallback, and merchant preloading.
The facade retains:

```elixir
resolve_merchant_identity/2
```

`ProductCompare.Ingestion.ListingPersistence` consumes the internal
`MerchantIdentities.resolve_in_transaction/2` result while callers continue to
use only the facade.

- [ ] Run the direct ingestion suite as the green characterization baseline.
- [ ] Move merchant identity creation, update, stale-conflict recovery,
  merchant retargeting, merchant attribute projection, and preloading into
  `MerchantIdentities` without changing transaction ownership or comparison
  against `last_seen_at`.
- [ ] Replace `resolve_merchant_identity/2` with an explicit facade wrapper
  retaining the existing source and normalized-listing struct matches.
- [ ] Re-run the direct suite and confirm source scoping, stale observations,
  concurrent conflicts, name/domain refresh, and merchant reassociation remain
  unchanged.
- [ ] Commit with message `refactor: isolate ingestion merchant ownership`.

### Task 4: Canonical Listing-Persistence Ownership

**Files:**

- Create: `lib/product_compare/ingestion/listing_persistence.ex`
- Modify: `lib/product_compare/ingestion.ex`
- Test: `test/product_compare/ingestion/ingestion_test.exs`
- Test: `test/product_compare/ingestion/enrichment_test.exs`
- Test: `test/product_compare/ingestion/reconciliation_test.exs`

**Interfaces:** `ProductCompare.Ingestion.ListingPersistence` owns the one
canonical normalized-listing transaction: source artifacts, external products,
GTIN identity, missing-copy enrichment, category mapping, specification claims,
merchant offers, price points, import observations, and alert enqueueing. The
facade retains the `persisted_listing` type and exact wrappers:

```elixir
persist_normalized_listing/2,3
```

- [ ] Run the three named suites as the green characterization baseline.
- [ ] Move the canonical persistence transaction and its private artifact,
  product, enrichment, offer, price, hash, freshness, and normalization helpers
  into `ListingPersistence`; call
  `MerchantIdentities.resolve_in_transaction/2` inside the unchanged outer
  transaction.
- [ ] Add explicit facade wrappers preserving the two-argument default,
  keyword options, source/listing struct matches, `persisted_listing` return
  shape, rollback reasons, and import-run observation behavior.
- [ ] Re-run the three suites and confirm replay, stale observations, GTIN
  conflicts, source provenance, enrichment, category/spec handling, offer
  activation, price idempotency, reconciliation membership, and alert job
  behavior remain unchanged.
- [ ] Commit with message `refactor: isolate normalized listing persistence`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/ingestion-context-decomposition.md`

- [ ] Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs \
  test/product_compare/ingestion/enrichment_test.exs \
  test/product_compare/ingestion/reconciliation_test.exs \
  test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs
```

- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm `rg 'ProductCompare.Ingestion.(Runs|FeedCandidates|MerchantIdentities|ListingPersistence)' lib test`
  finds no caller outside the facade and the four internal modules.
- [ ] Record final module responsibilities, facade size, exact test counts, and
  gate results in the lane doc.
- [ ] Include the lane evidence in the final code/test milestone commit.

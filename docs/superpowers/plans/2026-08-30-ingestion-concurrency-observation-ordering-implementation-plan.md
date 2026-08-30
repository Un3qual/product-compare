# Ingestion Concurrency And Observation Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make first-sighting merchant resolution, observation-derived evidence, and CJ success-payload decoding deterministic under concurrency, stale input, and malformed provider responses.

**Architecture:** PostgreSQL serializes only the logical merchant-identity key whose decision depends on an earlier read. Evidence upserts compare persisted and incoming observation timestamps atomically, while the CJ adapter validates response shape before iteration or cursor arithmetic.

**Tech Stack:** Elixir, Ecto, PostgreSQL advisory locks and upserts, Req, Jason, ExUnit

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Preserve source-scoped merchant identity uniqueness and existing stale-observation semantics.
- The advisory lock must be transaction-scoped and keyed by `{source_id, merchant_identifier}`; do not serialize unrelated identities.
- Do not replace unique constraints with preflight checks.
- Older observations may not replace newer display/media facts or timestamps.
- Provider payload errors must not include raw response bodies, headers, or credentials in the tagged category.
- Use deterministic database barriers for concurrency tests; do not synchronize with sleeps.

---

### Task 1: Serialize concurrent first-sighting merchant identity resolution

**Files:**

- Modify: `lib/product_compare/ingestion/merchant_identities.ex`
- Create: `test/product_compare/ingestion/merchant_identities_concurrency_test.exs`
- Modify only for reusable deterministic barriers: `test/support/database_test_helpers.ex`

**Interfaces:**

- `MerchantIdentities.resolve/2` and `resolve_in_transaction/2` retain their current tagged return contract.
- A private transaction-scoped advisory-lock operation owns the stable logical-key serialization; no generic locking framework is introduced.
- After acquiring the lock, the implementation re-reads the identity before any merchant creation or retargeting decision.

- [ ] **Step 1: Write a deterministic same-key concurrency regression**

  Hold the first resolution after it acquires the logical-key lock, start a second resolution through an unboxed sandbox connection, assert the second backend is blocked, release the first, and assert both results reference one identity and one merchant with no unreferenced merchant row.

- [ ] **Step 2: Write a different-key non-blocking regression**

  Hold one key and prove a second key can complete without waiting for it.

- [ ] **Step 3: Run RED**

  ```bash
  MIX_TEST_PARTITION=quality_ingestion mix test \
    test/product_compare/ingestion/merchant_identities_concurrency_test.exs
  ```

- [ ] **Step 4: Implement lock, re-read, and one-decision transaction flow**

  Derive PostgreSQL advisory-lock integers deterministically from the exact source id and identifier without atom creation or process-local hashing. Keep merchant upsert, identity insert/update, and preload behavior inside the transaction.

- [ ] **Step 5: Run GREEN plus existing identity behavior**

  ```bash
  MIX_TEST_PARTITION=quality_ingestion mix test \
    test/product_compare/ingestion/merchant_identities_concurrency_test.exs \
    test/product_compare/ingestion/ingestion_test.exs
  ```

---

### Task 2: Make product media and category candidates monotonic

**Files:**

- Modify: `lib/product_compare/catalog/evidence.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence/enrichment.ex`
- Modify: `test/product_compare/ingestion/enrichment_test.exs`
- Modify if concurrency coverage belongs there: `test/product_compare/ingestion/enrichment_concurrency_test.exs`

**Interfaces:**

- `Catalog.upsert_product_media/4` retains its `%{persisted:, rejected:}` report.
- Product-media conflict updates apply source, role, position, alt text, and timestamp only when incoming `observed_at` is not older than the stored observation.
- Category-candidate arrival counts retain their current meaning, while display path and `last_seen_at` move only forward according to the incoming observation timestamp.

- [ ] **Step 1: Add newer-then-older RED examples**

  Persist a current media/category observation, replay an older conflicting observation from another source artifact/display spelling, and assert the current facts and timestamps do not regress. Assert the documented observation-count behavior separately.

- [ ] **Step 2: Run RED**

  ```bash
  MIX_TEST_PARTITION=quality_ingestion mix test \
    test/product_compare/ingestion/enrichment_test.exs \
    test/product_compare/ingestion/enrichment_concurrency_test.exs
  ```

- [ ] **Step 3: Add atomic timestamp-aware conflict expressions**

  Compare stored and excluded/incoming timestamps in the PostgreSQL conflict update. Do not perform a read followed by an unlocked update and do not add a generic observation-upsert abstraction.

- [ ] **Step 4: Run GREEN**

  ```bash
  MIX_TEST_PARTITION=quality_ingestion mix test \
    test/product_compare/ingestion/enrichment_test.exs \
    test/product_compare/ingestion/enrichment_concurrency_test.exs
  ```

---

### Task 3: Validate CJ result and pagination shapes before use

**Files:**

- Modify: `lib/product_compare/ingestion/sources/cj/client.ex`
- Modify: `test/product_compare/ingestion/sources/cj/client_test.exs`

**Interfaces:**

- `Client.fetch_batch/2` and `fetch_feeds/2` retain `{:ok, records, next_cursor} | {:error, reason}`.
- Malformed successful result sets return `{:error, {:invalid_result_set, field, category}}`, where `category` is a bounded atom and never embeds provider data.
- `resultList` must be a list; `count`, `totalCount`, and `limit` must be non-negative integers, with a positive effective limit when cursor calculation uses it.

- [ ] **Step 1: Add table-driven malformed-success RED cases**

  Cover null/object `resultList`, string/fractional/negative counts, invalid total count, zero/string limit, and both CJ fields. Preserve valid empty result lists and API-capped page sizes.

- [ ] **Step 2: Run RED**

  ```bash
  mix test test/product_compare/ingestion/sources/cj/client_test.exs
  ```

- [ ] **Step 3: Validate one result-set contract before cursor arithmetic**

  Keep JSON decode, GraphQL error, missing-result-set, HTTP, and transport contracts intact. Do not log or return the body as part of the new malformed-success category.

- [ ] **Step 4: Run GREEN and outcome verification**

  ```bash
  MIX_TEST_PARTITION=quality_ingestion mix test \
    test/product_compare/ingestion/merchant_identities_concurrency_test.exs \
    test/product_compare/ingestion/ingestion_test.exs \
    test/product_compare/ingestion/enrichment_test.exs \
    test/product_compare/ingestion/enrichment_concurrency_test.exs \
    test/product_compare/ingestion/sources/cj/client_test.exs
  mix format --check-formatted
  mix typecheck
  git diff --check
  ```

- [ ] **Step 5: Commit the reviewed outcome**

  ```bash
  git add lib/product_compare/catalog/evidence.ex \
    lib/product_compare/ingestion/merchant_identities.ex \
    lib/product_compare/ingestion/listing_persistence/enrichment.ex \
    lib/product_compare/ingestion/sources/cj/client.ex \
    test/product_compare/ingestion test/support/database_test_helpers.ex \
    docs/work/ingestion-concurrency-observation-ordering.md docs/work/index.md
  git commit -m "fix: make ingestion ordering concurrency-safe"
  ```


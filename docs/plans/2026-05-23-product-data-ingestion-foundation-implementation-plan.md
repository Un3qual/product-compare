# Product Data Ingestion Foundation Implementation Plan (2026-05-23)

Execution status lives in `docs/work/product-data-scraping.md` and `docs/work/index.md`.

Status: Task 1 completed on 2026-05-23.

## Goal

Reactivate the product data ingestion lane with a small CJ-first foundation batch that chooses the first source, records the sync-vs-Oban execution boundary, and scaffolds the ingestion context before any live provider polling or broad scraping work.

## Architecture

- Select CJ as the first source for the foundation batch because the active sourcing plan already makes CJ the default approved-account path. Fall back to eBay Browse only if the ADR or connector spike records that CJ product-search/feed scope is insufficient.
- Keep Task 1 source-agnostic below the provider API boundary: no live CJ credentials, network calls, account scraping, or scheduled jobs in this batch.
- Use a synchronous pilot boundary first. The ADR must document the Oban revisit trigger before any recurring ingestion schedule is added.
- Add `ProductCompare.Ingestion` as the narrow context for source adapter behavior, normalized listing structs, parser validation, and merchant source identity resolution.
- Keep source records anchored to the existing `ProductCompareSchemas.Specs.Source`, `SourceArtifact`, and `ExternalProduct` model rather than introducing a parallel source registry.
- Add `merchant_source_identities` as the deterministic bridge between source-scoped merchant identifiers and canonical `Merchant` rows.
- Start with fixture-based parser and identity tests. Persistence into full catalog/pricing rows can be a follow-up after the identity boundary is proven.

## Task 1: Choose CJ And Scaffold The Ingestion Foundation

Status: completed on 2026-05-23.

### Files

- Create: `docs/decisions/2026-05-23-ingestion-execution-boundary.md`
- Create: `priv/repo/migrations/*_create_merchant_source_identities.exs`
- Create: `lib/product_compare_schemas/ingestion/merchant_source_identity.ex`
- Create: `lib/product_compare/ingestion.ex`
- Create: `lib/product_compare/ingestion/normalized_listing.ex`
- Create: `lib/product_compare/ingestion/sources/adapter.ex`
- Create: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Create: `test/product_compare/ingestion/ingestion_test.exs`
- Create: `test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- Create: `test/support/fixtures/cj/product_search_sample.json`
- Update: `docs/work/product-data-scraping.md`
- Update: `docs/plans/NOW.md`

### Step 1: Write Failing Tests

Add focused tests for:

- CJ fixture parser normalizes one representative product record into the local normalized listing contract.
- Unsupported or malformed fixture records return deterministic mapping errors with reason atoms.
- Merchant source identity upsert is idempotent for repeated `(source_id, merchant_identifier)` imports and updates `last_seen_at` without creating duplicate merchants.
- The adapter behavior documents `fetch_batch/2` and `normalize/1` contracts without requiring a live provider client.

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs
```

Expected: fail because the ingestion context, parser, schema, and migration do not exist.

### Step 2: Draft The ADR

Create `docs/decisions/2026-05-23-ingestion-execution-boundary.md` recording:

- First source: CJ product catalog surfaces for fixture-backed connector validation.
- Fallback source: eBay Browse only if CJ product-search/feed scope is insufficient.
- Execution mode for Task 1: synchronous pilot with no scheduler.
- Oban revisit trigger: first recurring source schedule, retry/dead-letter requirement, or multi-source import cadence.
- Explicit out-of-scope items: live credential validation, live provider polling, account-manager automation, and Tier-3 direct scraping.

### Step 3: Add Merchant Identity Persistence

Add `merchant_source_identities` with:

- `source_id` foreign key to `sources`
- `merchant_id` foreign key to `merchants`
- `merchant_identifier`
- `merchant_name`
- `merchant_domain`
- `last_seen_at`
- unique `(source_id, merchant_identifier)`
- indexes on `source_id` and `merchant_id`

Add a schema module and changeset that require source, merchant, identifier, and `last_seen_at`.

### Step 4: Add The Ingestion Context

Add `ProductCompare.Ingestion` functions for:

- resolving or creating a merchant identity from a normalized listing,
- idempotently returning the same identity for repeated source merchant identifiers,
- updating merchant name/domain and `last_seen_at` when a newer observation arrives.

Keep the public API small and test-backed. Do not persist product, merchant product, external product, or price point rows in Task 1.

### Step 5: Add The Parser Boundary

Add:

- `ProductCompare.Ingestion.NormalizedListing`
- `ProductCompare.Ingestion.Sources.Adapter`
- `ProductCompare.Ingestion.Sources.CJ.ProductParser`

The CJ parser should consume local fixture maps only and return either `{:ok, %NormalizedListing{}}` or `{:error, %{reason: atom(), field: atom() | nil}}`. Keep exact CJ field names isolated in the parser module.

### Step 6: Verify

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs
mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

### Step 7: Update Tracking

When Task 1 is verified, update `docs/work/product-data-scraping.md` and `docs/plans/NOW.md` to mark Task 1 complete and advance to the next unblocked ingestion batch:

- Task 2 candidate: persist normalized listings into `SourceArtifact`, `ExternalProduct`, `MerchantProduct`, and `PricePoint` with replay idempotency.
- Keep live CJ API validation blocked until credentials, quota behavior, and sample payload scope are recorded.

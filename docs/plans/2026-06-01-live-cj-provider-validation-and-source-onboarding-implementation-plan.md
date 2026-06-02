# Live CJ Provider Validation And Source Onboarding Implementation Plan (2026-06-01)

Execution status lives in `docs/work/product-data-scraping.md`, `docs/work/index.md`, and `docs/plans/NOW.md`.

Status: created on 2026-06-01 as the next product-ingestion blocker-resolution plan. Task execution remains blocked until the live CJ credential path, quota behavior, representative account-scoped sample payloads, and source onboarding compliance signoff can be recorded without committing secrets.

## Goal

Resolve the remaining product-ingestion blocker by validating whether the approved CJ account has usable product catalog scope, preserving representative redacted sample payloads, and recording the minimum source onboarding compliance evidence required before live provider polling or any Tier-3 scraping activation.

## Architecture

- Keep this as a validation and onboarding slice, not a scheduled ingestion or scraping slice.
- Do not add recurring jobs, Oban scheduling, account-manager automation, or Tier-3 direct scraping in this plan.
- Use the existing source-agnostic ingestion boundary:
  - `ProductCompare.Ingestion.Sources.CJ.ProductParser.normalize/1`
  - `ProductCompare.Ingestion.persist_normalized_listing/2`
  - `ProductCompare.Ingestion.NormalizedListing`
- Treat live provider payloads as sensitive operational evidence. Commit only redacted samples that remove secrets, account IDs not needed for mapping, tracking parameters that identify the account, and any personally identifying data.
- If CJ scope is insufficient, record the failure evidence and create an eBay Browse fallback implementation plan instead of forcing the CJ connector forward.

## Unblock Prerequisites

Do not start Task 1 until all of the following are available:

- A non-secret description of where CJ credentials are stored and who can access them.
- CJ product catalog access to either Product Search or Product Feeds for the approved account.
- Permission to capture one small representative account-scoped product sample and commit a redacted fixture.
- A named compliance/legal approver for Tier-1 provider onboarding.

## Task 1: Record CJ Access, Quota, Sample, And Compliance Evidence

Status: blocked.

### Files

- Create: `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md`
- Create: `test/support/fixtures/cj/product_validation_sample.redacted.json`
- Update: `test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- Update: `test/product_compare/ingestion/ingestion_test.exs`
- Update, only if the redacted live sample proves a real mapping gap: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Update: `docs/work/product-data-scraping.md`
- Update: `docs/plans/NOW.md`

### Step 1: Capture The Non-Secret Validation Record

Create `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md` with this structure:

```markdown
# Live CJ Provider Validation And Source Onboarding

Date: 2026-06-01
Status: draft until compliance approver is recorded

## CJ Access Path

- Credential storage path:
- Credential owner:
- Validated data surface: Product Search or Product Feeds
- Validation timestamp:

## Product Scope And Quota Evidence

- Product catalog surface validated: Product Search or Product Feeds
- Representative query shape: category plus one known approved merchant
- Result count observed:
- Quota or rate-limit behavior observed:
- Relevant response headers or account-manager quota notes:

## Redacted Sample Fixture

- Fixture path: `test/support/fixtures/cj/product_validation_sample.redacted.json`
- Redaction rules applied:
  - Removed access tokens and credential material.
  - Removed account-specific tracking parameters unless required for mapping.
  - Replaced account-specific advertiser names only when necessary.
  - Kept field names, value types, price/currency shape, product identifiers, merchant identifiers, URLs, availability, and timestamps needed to validate mapping.

## Source Onboarding Checklist

- Provider terms reviewed by:
- Legal/compliance approver:
- Approved for Tier-1 fixture-backed validation:
- Approved for live provider polling:
- Approved for Tier-3 scraping fallback:

## Decision

- CJ is sufficient for the next connector implementation: yes/no
- If no, fallback source: eBay Browse
- Follow-up implementation plan:
```

Expected: the file contains no secrets and names the approver before any live provider polling is unblocked.

### Step 2: Add The Redacted Sample Fixture

Create `test/support/fixtures/cj/product_validation_sample.redacted.json` in this stable local envelope, even if the original CJ response uses a different outer wrapper:

```json
{
  "source": "cj",
  "validatedAt": "2026-06-01T00:00:00Z",
  "surface": "product_search",
  "products": [
    {
      "adId": "REDACTED-CJ-PRODUCT-1",
      "advertiserId": "REDACTED-MERCHANT-1",
      "advertiserName": "Redacted Merchant",
      "advertiserDomain": "merchant.example",
      "name": "Redacted Product",
      "brand": "Redacted Brand",
      "gtin": "00000000000000",
      "buyUrl": "https://merchant.example/products/redacted-product",
      "currency": "USD",
      "price": "129.99",
      "inStock": true,
      "lastUpdated": "2026-06-01T00:00:00Z"
    }
  ]
}
```

Expected: the committed fixture keeps the real field names and value types from CJ while removing credentials and account-sensitive values.

### Step 3: Write The Failing Parser Validation Test

Add this test helper and test to `test/product_compare/ingestion/sources/cj/product_parser_test.exs`:

```elixir
test "normalizes a redacted live validation sample into the listing contract" do
  [record | _] = product_validation_fixture()

  assert {:ok,
          %NormalizedListing{
            source: :cj,
            external_product_id: external_product_id,
            merchant_identifier: merchant_identifier,
            product_title: product_title,
            listing_url: listing_url,
            currency: "USD",
            amount: amount,
            availability: availability,
            observed_at: observed_at,
            raw_payload: ^record
          }} = ProductParser.normalize(record)

  assert is_binary(external_product_id)
  assert external_product_id != ""
  assert is_binary(merchant_identifier)
  assert merchant_identifier != ""
  assert is_binary(product_title)
  assert product_title != ""
  assert String.starts_with?(listing_url, "http")
  assert Decimal.compare(amount, Decimal.new("0")) == :gt
  assert availability in [:in_stock, :out_of_stock, :unknown]
  assert %DateTime{} = observed_at
end

defp product_validation_fixture do
  __DIR__
  |> Path.join("../../../../support/fixtures/cj/product_validation_sample.redacted.json")
  |> Path.expand()
  |> File.read!()
  |> Jason.decode!()
  |> Map.fetch!("products")
end
```

Run:

```bash
mix test test/product_compare/ingestion/sources/cj/product_parser_test.exs
```

Expected: fail only if the redacted live sample uses CJ field names or value shapes not yet handled by `ProductParser.normalize/1`. If it passes immediately, record that the existing parser already handles the validated CJ sample.

### Step 4: Update The CJ Parser Only For Observed Mapping Gaps

If Step 3 fails, update `lib/product_compare/ingestion/sources/cj/product_parser.ex` with the minimum field aliases or value normalization needed for the redacted validation sample.

Keep these constraints:

- Do not add live network calls.
- Do not add provider credentials to config.
- Keep exact CJ field names isolated in `ProductParser`.
- Return deterministic mapping errors in the existing shape: `{:error, %{reason: atom(), field: atom() | nil}}`.

Run:

```bash
mix test test/product_compare/ingestion/sources/cj/product_parser_test.exs
```

Expected: pass.

### Step 5: Write The Persistence Validation Test

Add this test to `test/product_compare/ingestion/ingestion_test.exs`:

```elixir
test "persists a redacted CJ validation sample through the ingestion boundary" do
  source = source_fixture(%{kind: "affiliate_feed", name: "CJ validation", domain: "cj.com"})
  [record | _] = product_validation_fixture()

  assert {:ok, listing} = ProductCompare.Ingestion.Sources.CJ.ProductParser.normalize(record)
  assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)

  assert persisted.source_artifact.source_id == source.id
  assert persisted.source_artifact.raw_json == record
  assert persisted.external_product.source_id == source.id
  assert persisted.external_product.external_id == listing.external_product_id
  assert persisted.merchant_identity.source_id == source.id
  assert persisted.merchant_identity.merchant_identifier == listing.merchant_identifier
  assert persisted.merchant_product.url == listing.listing_url
  assert persisted.merchant_product.currency == listing.currency
  assert Decimal.eq?(persisted.price_point.price, listing.amount)
end

defp product_validation_fixture do
  "test/support/fixtures/cj/product_validation_sample.redacted.json"
  |> File.read!()
  |> Jason.decode!()
  |> Map.fetch!("products")
end
```

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs
```

Expected: pass after the parser handles the redacted validation fixture.

### Step 6: Run Focused Verification

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs
mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs
mix typecheck
git diff --check
```

Expected: all pass.

### Step 7: Update Tracking And Select The Next Plan

If CJ is sufficient:

- Mark this task complete in `docs/work/product-data-scraping.md`.
- Update `docs/plans/NOW.md` to the next unblocked CJ connector implementation batch.
- Add or promote a follow-up plan for the first live CJ connector implementation.
- Keep Tier-3 scraping blocked unless the onboarding decision explicitly approves it.

If CJ is insufficient:

- Record the exact insufficiency in the decision doc.
- Keep `docs/plans/NOW.md` blocked for CJ.
- Create the eBay Browse fallback implementation plan named from the current date.

## Task 2: Prepare The First Live Connector Batch

Status: blocked until Task 1 records that CJ is sufficient.

### Files

- Create: a dated CJ connector implementation plan under `docs/plans/`
- Update: `docs/work/product-data-scraping.md`
- Update: `docs/work/index.md`
- Update: `docs/plans/INDEX.md`
- Update: `docs/plans/NOW.md`

### Steps

1. Choose the next batch from the Task 1 decision:
   - CJ sufficient: plan a non-scheduled CJ fetch client behind explicit runtime credentials and a manual Mix task.
   - CJ insufficient: plan the eBay Browse fallback connector spike.
2. Keep the first live connector batch bounded to manual execution and fixture-backed tests.
3. Defer recurring provider polling, Oban scheduling, and alerting until after one manual live connector import succeeds.
4. Keep direct scraping out of scope unless the source onboarding decision explicitly approves the Tier-3 gate.

## Verification Before Closing This Plan

This blocker-resolution plan is complete only when:

- The decision doc records non-secret CJ access, quota behavior, product scope, and a named compliance approver.
- A redacted representative sample fixture exists and is covered by parser and persistence tests.
- Focused ingestion tests, adjacent source-artifact/pricing GraphQL tests, `mix typecheck`, and `git diff --check` pass.
- `docs/work/product-data-scraping.md`, `docs/work/index.md`, `docs/plans/INDEX.md`, and `docs/plans/NOW.md` agree on the next unblocked implementation batch or the continuing blocker.

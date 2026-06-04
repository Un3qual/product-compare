# Live CJ Provider Validation And Source Onboarding Implementation Plan (2026-06-01)

Execution status lives in `docs/work/index.md`. Lane-specific blocker details
live in `docs/work/product-data-scraping.md`. `docs/plans/NOW.md` is only a
compatibility pointer back to the live queue.

Status: ready as of 2026-06-04. Execute Task 1 as a manual CJ Product Search
validation batch. Keep credentials in local runtime environment variables only,
commit only redacted sample data, and keep scheduled polling and Tier-3 direct
scraping out of scope.

## Goal

Resolve the remaining product-ingestion blocker by validating whether the approved CJ account has usable Product Search catalog scope, preserving one representative redacted sample payload, and recording owner-approved source onboarding evidence for this personal project before the first manual connector batch.

## Architecture

- Keep this as a validation and onboarding slice, not a scheduled ingestion or scraping slice.
- Do not add recurring jobs, Oban scheduling, account-manager automation, or Tier-3 direct scraping in this plan.
- Validate CJ Product Search first. Treat Product Feeds as a fallback or follow-up only if Product Search is unavailable or too limited for the first connector.
- Use the existing source-agnostic ingestion boundary:
  - `ProductCompare.Ingestion.Sources.CJ.ProductParser.normalize/1`
  - `ProductCompare.Ingestion.persist_normalized_listing/2`
  - `ProductCompare.Ingestion.NormalizedListing`
- Treat live provider payloads as sensitive operational evidence. Commit only redacted samples that remove secrets, account IDs not needed for mapping, tracking parameters that identify the account, and any personally identifying data.
- Store development secrets outside git in ignored `.env.local` or `.env` files, or export them in the shell before running manual validation. Planned variable names are `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and `CJ_WEBSITE_ID`; adjust only if CJ's Product Search auth contract requires different names.
- Read CJ secrets with `System.get_env/1` only at the manual task/client boundary. Do not add CJ credentials to `config/dev.exs`, committed docs, fixtures, tests, app config, or persisted records.
- If CJ scope is insufficient, record the failure evidence and create an eBay Browse fallback implementation plan instead of forcing the CJ connector forward.

## Ready Preconditions

Task 1 is ready because the project owner confirmed expected CJ access and approved the validation approach. Before committing the batch, the executor must record:

- A non-secret description of where local CJ credentials are stored and who can access them.
- CJ Product Search catalog access for the approved account, or a Product Search insufficiency note that triggers the Product Feeds/eBay fallback path.
- Permission confirmation for one small redacted account-scoped product sample fixture.
- Ryan's owner approval for CJ account use in this personal project.
- Confirmation that Tier-3 direct scraping remains out of scope for this batch.

## Task 1: Record CJ Access, Quota, Sample, And Owner Approval Evidence

Status: ready.

### Files

- Create: `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md`
- Create: `test/support/fixtures/cj/product_validation_sample.redacted.json`
- Update: `test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- Update: `test/product_compare/ingestion/ingestion_test.exs`
- Update, only if the redacted live sample proves a real mapping gap: `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- Update: `docs/work/product-data-scraping.md`
- Update: `docs/work/index.md`

### Step 1: Capture The Non-Secret Validation Record

Create `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md` with this structure:

```markdown
# Live CJ Provider Validation And Source Onboarding

Date: 2026-06-04
Status: draft until CJ Product Search evidence and redacted fixture are recorded

## CJ Access Path

- Credential storage path: local ignored `.env.local` or shell-exported runtime environment variables
- Credential owner: Ryan
- Runtime variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, `CJ_WEBSITE_ID`
- Validated data surface: Product Search
- Fallback data surface if Product Search is unavailable: Product Feeds
- Validation timestamp:

## Product Scope And Quota Evidence

- Product catalog surface validated: Product Search
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

## Owner Approval And Scope

- Project posture: personal project
- Owner approval: Ryan approves CJ account use for Tier-1 validation
- Approved for one redacted account-scoped fixture: yes/no
- Approved for first manual CJ connector batch after this validation: yes/no
- Approved for scheduled live provider polling: no, deferred until a later manual connector import succeeds
- Approved for Tier-3 direct scraping fallback: no, out of scope for this batch

## Decision

- CJ is sufficient for the next connector implementation: yes/no
- If no, fallback source: eBay Browse
- Follow-up implementation plan:
```

Expected: the file contains no secrets, records Product Search first, records owner approval for this personal project, and keeps scheduled polling plus Tier-3 scraping deferred.

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

Expected: the committed fixture keeps the real field names and value types from CJ while removing credentials, account-sensitive IDs not needed for mapping, account-specific tracking parameters, and any personally identifying data.

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
- Do not add dotenv loading or secret persistence in parser code.
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
- Promote the next unblocked CJ connector implementation batch in `docs/work/index.md`.
- Add or promote a follow-up plan for the first live CJ connector implementation.
- Keep Tier-3 direct scraping out of scope until a later explicit decision.

If CJ is insufficient:

- Record the exact insufficiency in the decision doc.
- Keep the CJ row blocked or closed in `docs/work/index.md` with the insufficiency named.
- Create the eBay Browse fallback implementation plan named from the current date.

## Task 2: Prepare The First Live Connector Batch

Status: blocked until Task 1 records that CJ is sufficient.

### Files

- Create: a dated CJ connector implementation plan under `docs/plans/`
- Update: `docs/work/product-data-scraping.md`
- Update: `docs/work/index.md`
- Update: `docs/plans/INDEX.md`

### Steps

1. Choose the next batch from the Task 1 decision:
   - CJ sufficient: plan a non-scheduled CJ fetch client behind explicit runtime credentials and a manual Mix task.
   - CJ insufficient: plan the eBay Browse fallback connector spike.
2. Keep the first live connector batch bounded to manual execution and fixture-backed tests.
3. Defer recurring provider polling, Oban scheduling, and alerting until after one manual live connector import succeeds.
4. Keep direct scraping out of scope until a later explicit decision.

## Verification Before Closing This Plan

This blocker-resolution plan is complete only when:

- The decision doc records non-secret CJ access, Product Search quota behavior, product scope, env-var-only secret handling, owner approval, and Tier-3 scraping deferral.
- A redacted representative sample fixture exists and is covered by parser and persistence tests.
- Focused ingestion tests, adjacent source-artifact/pricing GraphQL tests, `mix typecheck`, and `git diff --check` pass.
- `docs/work/product-data-scraping.md`, `docs/work/index.md`, and `docs/plans/INDEX.md` agree on the next unblocked implementation batch or the continuing blocker.

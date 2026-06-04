# Live CJ Provider Validation And Source Onboarding

Date: 2026-06-04
Status: validated for first manual CJ connector batch

## CJ Access Path

- Credential storage path: local ignored `.env.local`
- Credential owner: Ryan
- Runtime variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, `CJ_PROPERTY_ID`
- Validated data surface: CJ Product Feed GraphQL `shoppingProducts`
- Deprecated data surface checked: legacy REST Product Search returned `404` with the message `This API has been deprecated, please use ads.api.cj.com.`
- Validation timestamp: 2026-06-04T18:31:53Z through 2026-06-04T18:34:49Z

## Product Scope And Quota Evidence

- Product catalog surface validated: `https://ads.api.cj.com/query`
- Representative query shape: `shoppingProducts(companyId, keywords: ["shoe"], partnerStatus: JOINED, limit: 1, offset: 0, currency: "USD", serviceableAreas: "US")`
- Result count observed: 1 record returned, `totalCount: 1`
- Quota or rate-limit behavior observed: no rate-limit rejection observed during schema introspection or the one-record validation query
- Relevant response headers or account-manager quota notes: GraphQL responses returned HTTP 200; no explicit quota headers were observed in the captured response headers

## Redacted Sample Fixture

- Fixture path: `test/support/fixtures/cj/product_validation_sample.redacted.json`
- Redaction rules applied:
  - Removed access tokens and credential material.
  - Removed account-specific company/property identifiers.
  - Replaced advertiser, catalog, product, GTIN, and link values with stable redacted placeholders.
  - Kept field names, value types, nested price/currency shape, product identifiers, merchant identifiers, URLs, availability, and timestamps needed to validate mapping.

## Owner Approval And Scope

- Project posture: personal project
- Owner approval: Ryan approves CJ account use for Tier-1 validation
- Approved for one redacted account-scoped fixture: yes
- Approved for first manual CJ connector batch after this validation: yes
- Approved for scheduled live provider polling: no, deferred until a later manual connector import succeeds
- Approved for Tier-3 direct scraping fallback: no, out of scope for this batch

## Decision

- CJ is sufficient for the next connector implementation: yes
- Fallback source if CJ later loses usable product scope: eBay Browse
- Follow-up implementation plan: promote the first manual CJ connector batch from `docs/work/product-data-scraping.md`

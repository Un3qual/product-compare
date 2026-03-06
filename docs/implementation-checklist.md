# ProductCompare Backend Implementation Checklist

## Migration Order

1. `20260303222607_init_extensions`
2. `20260303222608_create_accounts_taxonomy_catalog`
3. `20260303222610_create_specs_and_sources`
4. `20260303222611_create_pricing_affiliate_discussions`
5. `20260304143500_replace_partial_merchant_domain_index`
6. `20260305001000_create_api_tokens`
7. `20260305013000_backfill_api_token_prefixes`
8. `20260305020000_reconcile_affiliate_links_unique_index`
9. `20260305103000_tighten_source_artifacts_source_fk`

## Context Boundaries

- `ProductCompare.Accounts`: users + reputation
- `ProductCompare.Taxonomy`: taxonomy trees, closure maintenance, use-case tagging
- `ProductCompare.Catalog`: products/brands + primary-type guardrail + filtering entrypoint
- `ProductCompare.Specs`: dimensions/units, typed claims, claim moderation, current claim selection
- `ProductCompare.Pricing`: merchants/listings/history queries
- `ProductCompare.Affiliate`: networks/programs/links/coupons
- `ProductCompare.Discussions`: threads/posts/reviews CRUD

## MVP Done

- Hard type + soft use-case taxonomy with closure table and reparenting.
- Richly typed claims with unit normalization to base values.
- Canonical current claim pointer with unique `(product_id, attribute_id)` and transactional swap.
- Filtering helper for type descendants, numeric ranges, bool, enum, and use-case tags.
- Pricing upsert/history APIs.
- Discussion/review CRUD context APIs.
- Deterministic seeds with sample monitors and price timeline.
- Required tests for conversion, closure traversal, and current-claim atomic swap.

## Verification Checkpoint (2026-03-04)

- [x] `mix compile --warnings-as-errors` passes.
- [x] `mix test` passes (`59 tests, 0 failures`).
- [x] `mix typecheck` passes.
- [x] `mix precommit` passes.
- [x] `user_reputation` upsert regression test assertion aligns with schema timestamp model (`inserted_at` only).
- [x] All current relational tables use bigint `id` plus `entropy_id` defaulting to `uuidv7()`.
- [x] No UUID-primary-key exceptions are present in current migrations/schema macros.

## GraphQL/Auth Hardening Checkpoint (2026-03-05)

- [x] API token secrets are persisted as SHA3-derived material only (`token_hash` plus hash-derived `token_prefix`; raw token prefix no longer persisted).
- [x] API-token GraphQL mutations require Relay global IDs for `tokenId`; raw UUID input is rejected.
- [x] API-token GraphQL mutations return typed payloads with structured `errors` objects.
- [x] Affiliate GraphQL IDs now use Relay global IDs for affiliate entities and related ID inputs.
- [x] `activeCoupons` now returns a connection payload (`edges` + `pageInfo`) with cursor pagination.

## MVP Contract Consistency Checkpoint (2026-03-05)

- [x] `source_artifacts.source_id` ownership is now enforced at DB level (`NOT NULL`) with reversible migration semantics and `ON DELETE CASCADE`.
- [x] Source artifact schema tests cover required `source_id`/`fetched_at` and DB-level NULL rejection/cascade behavior.
- [x] Affiliate network upsert conflict updates no longer reference unsupported dead fields.

## Coupon Constraint Hardening Checkpoint (2026-03-05)

- [x] `Coupon.changeset/2` now rejects non-NULL `discount_value` for `free_shipping`/`other` discounts.
- [x] Coupon check constraints are mapped into changeset errors (`coupons_discount_shape_check`, `coupons_validity_window_check`) to avoid `Ecto.ConstraintError` in API paths.
- [x] Affiliate context and GraphQL tests cover invalid coupon discount-shape inputs.
- [x] `mix test test/product_compare/affiliate/affiliate_workflows_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs` passes (`12 tests, 0 failures`).

## GraphQL Expansion + Strict Contract Checkpoint (2026-03-05)

- [x] Affiliate mutations now return typed payload errors (`errors[]`) for unauthorized/invalid-ID/invalid-argument paths.
- [x] Invalid cursors are rejected strictly for GraphQL connection-backed queries (`myApiTokens`, `activeCoupons`).
- [x] Catalog read surface expanded with `products` connection query (stable ordering + Relay global IDs).
- [x] Targeted GraphQL verification passes:
  - `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/catalog_queries_test.exs` (`15 tests, 0 failures`).
- [x] `mix compile --warnings-as-errors` passes.
- [x] `mix typecheck` passes.
- [x] `mix test` passes (`96 tests, 0 failures`).

## API Token Contract Hardening Checkpoint (2026-03-05)

- [x] `api_tokens` now enforces SHA3 digest shape at DB layer (`api_tokens_hash_length_check`, `octet_length(token_hash) = 32`).
- [x] API token DB regression test now asserts invalid hash length is rejected at insert time.
- [x] API token schema maps `api_tokens_hash_length_check` and validates digest length before insert.
- [x] Public plug entrypoints touched in this batch define explicit `@spec` contracts.
- [x] Verification passes:
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `mix test` (`98 tests, 0 failures`)
  - `mix precommit` (`98 tests, 0 failures`)

## GraphQL Token Response Cache-Control Hardening Checkpoint (2026-03-05)

- [x] GraphQL pipeline now enforces `Cache-Control: no-store, private, max-age=0`.
- [x] GraphQL pipeline now emits `Pragma: no-cache` and `Expires: 0`.
- [x] GraphQL endpoint test covers non-cacheable response headers.
- [x] Verification passes:
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `mix test` (`99 tests, 0 failures`)
  - `mix precommit` (`99 tests, 0 failures`)

## GraphQL Catalog Discovery + Quality Gates Checkpoint (2026-03-05)

- [x] `products` query now accepts typed `filters` input (`numeric`, `booleans`, `enums`, `useCaseTaxonIds`) with stable connection ordering.
- [x] Catalog `primaryTypeTaxonId` filtering supports descendant matching (`includeTypeDescendants`) with GraphQL regression coverage.
- [x] Catalog filter IDs are Relay global IDs only (`attribute`, `enum option`, `taxon`) and invalid IDs are rejected deterministically.
- [x] GraphQL coverage exists for numeric, boolean, enum, use-case, invalid-ID, and invalid-cursor catalog query paths.
- [x] `mix typecheck` now enforces `mix compile --warnings-as-errors --all-warnings`.
- [x] `mix precommit` and `mix ci` now enforce coverage execution (`mix test --cover`) with project threshold set to `69`.
- [x] Verification passes:
  - `mix typecheck`
  - `mix test --cover` (`104 tests, 0 failures`, `70.11%`)
  - `mix precommit` (`104 tests, 0 failures`)
  - `mix ci` (`104 tests, 0 failures`)

## Deferred Scope

- Scope freeze rationale and revisit triggers are documented in:
  - [MVP Scope Freeze (2026-03-05)](decisions/2026-03-05-mvp-scope-freeze.md)
  - [GraphQL Contract Posture + Async Boundaries (2026-03-05)](decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md)
- Scraping ingestion jobs and scheduling pipelines (Oban, retries, dead letters).
- Derived formula execution engine and dependency-driven recomputation workers.
- Affiliate API ingestion/normalization jobs.
- Advanced moderation and anti-spam/reputation governance.
- Embeddings/semantic search and frontend search UI.
- Additional GraphQL hardening beyond currently shipped auth/affiliate surfaces.

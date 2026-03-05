# ProductCompare Backend Implementation Checklist

## Migration Order

1. `20260303222607_init_extensions`
2. `20260303222608_create_accounts_taxonomy_catalog`
3. `20260303222610_create_specs_and_sources`
4. `20260303222611_create_pricing_affiliate_discussions`
5. `20260305001000_create_api_tokens`
6. `20260305013000_backfill_api_token_prefixes`

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
- [ ] Affiliate GraphQL IDs are still raw/non-Relay and need global-ID migration.
- [ ] `activeCoupons` still returns a list payload and has not been migrated to a connection shape.

## Deferred Scope

- Scraping ingestion jobs and scheduling pipelines (Oban, retries, dead letters).
- Derived formula execution engine and dependency-driven recomputation workers.
- Affiliate API ingestion/normalization jobs.
- Advanced moderation and anti-spam/reputation governance.
- Embeddings/semantic search and frontend search UI.
- Remaining GraphQL Relay hardening beyond API tokens (affiliate IDs and connection coverage).

# Ingestion Execution Boundary (2026-05-23)

## Status

Accepted for the product data ingestion foundation batch.

## Decision

Use CJ product catalog surfaces as the first source for fixture-backed connector validation, with eBay Browse as the fallback only if CJ product-search or product-feed scope proves insufficient for representative catalog ingestion.

The first implementation batch uses a synchronous pilot boundary. It may parse local fixtures, normalize source records, and persist source-scoped merchant identities, but it must not start a scheduler, call live provider APIs, depend on CJ credentials, automate account-manager workflows, or activate Tier-3 direct scraping.

## Rationale

- The active sourcing plan already selects CJ as the default first source because approved account access removes a major onboarding delay.
- A synchronous pilot keeps the first batch focused on data contracts, deterministic mapping errors, and replay idempotency before adding operational complexity.
- The current app has source, artifact, external product, catalog, and pricing persistence targets. The first missing persistence boundary is a deterministic source-merchant identity bridge.

## Oban Revisit Trigger

Move ingestion behind Oban jobs when any of these become true:

- a recurring source schedule is added,
- source fetches require retry or dead-letter handling,
- more than one source runs on a cadence,
- live provider rate-limit handling becomes part of the normal import path.

## Out Of Scope

- Live CJ credential validation.
- Live provider polling.
- CJ account-manager automation.
- Tier-3 direct merchant scraping.
- Full normalized listing persistence into product, merchant product, external product, source artifact, or price point rows.

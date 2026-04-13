# Product Data Scraping Work Doc

## Snapshot

- Status: drafting
- Priority: P2
- Source of truth: this file
- Last verified: 2026-04-13 after salvage review
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Objective:
  - Re-activate deferred ingestion work with a source-first plan that specifies where product data comes from, how it is fetched legally, and how it lands in existing Catalog/Pricing models.

## Research Summary

A parallel doc research pass covered provider APIs/feeds plus crawl standards. The resulting plan favors an acquisition ladder:

1. Tier 1: official APIs and affiliate feeds (CJ, eBay, Best Buy, Awin, Amazon PA-API).
2. Tier 2: merchant-provided feeds and exports.
3. Tier 3: selective direct scraping only behind an explicit legal and robots gate.

## Verified Current State

- Scraping ingestion and job orchestration were explicitly deferred during MVP freeze and are still unimplemented.
- Existing `Catalog`, `Specs`, and `Pricing` context boundaries already provide persistence targets for normalized ingestion records.
- There is now a detailed sourcing and ingestion plan doc with phased milestones and a connector-first execution path.

## Current Recommendation

- Start with a single Tier-1 connector MVP, defaulting to CJ because an approved account already exists and switching to eBay only if CJ scope is insufficient for the first spike.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- Keep legal and compliance review as a hard gate for any Tier-3 scraping activation.

## Next Batch

- Status: ready once first source is selected
- Batch:
  1. Choose the first connector, defaulting to CJ unless blocked by missing API or feed scope.
  2. Draft an ADR for ingestion execution mode (sync pilot vs Oban-first).
  3. Scaffold `ProductCompare.Ingestion` adapter boundary and fixture-based parser tests.
  4. Promote this work doc from `drafting` to `active` once source choice and ADR exist.
- Blockers:
  - First-source selection and ownership are not yet assigned.
  - The compliance signoff checklist process is not yet documented.

## Verification Commands

- `sed -n '1,220p' docs/work/product-data-scraping.md`
- `sed -n '1,340p' docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- `sed -n '1,220p' docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `sed -n '1,220p' docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
- `rg -n "scraping|ingestion|Oban|Browse API|PA-API|Awin|Best Buy" docs`

## Deferred Note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.

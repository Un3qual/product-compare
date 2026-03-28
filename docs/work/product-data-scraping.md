# Product Data Scraping Work Doc

## Snapshot

- Status: drafting
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-23 after source-research pass
- Historical context:
  - `docs/decisions/2026-03-05-mvp-scope-freeze.md`
  - `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
  - `docs/implementation-checklist.md`
- Detailed plan:
  - `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- Objective:
  - Re-activate deferred ingestion work with a source-first plan that specifies where product data comes from, how it is fetched legally, and how it lands in existing Catalog/Pricing models.

## Research Summary (Subagent-style Parallel Pass)

A parallel doc research pass covered provider APIs/feeds plus crawl standards. The resulting plan now favors an acquisition ladder:

1. Tier 1: official APIs/affiliate feeds (CJ, eBay, Best Buy, Awin, Amazon PA-API).
2. Tier 2: merchant-provided feeds/exports.
3. Tier 3: selective direct scraping only behind explicit legal/robots gate.

## Verified Current State

- Scraping ingestion and job orchestration were explicitly deferred during MVP freeze and are still unimplemented.
- Existing `Catalog`, `Specs`, and `Pricing` context boundaries already provide persistence targets for normalized ingestion records.
- There is now a detailed sourcing/ingestion plan doc with phased milestones and a connector-first execution path.

## Current Recommendation

- Start with a single Tier-1 connector MVP (**recommended default: eBay Browse API**; use CJ only if eBay quota/coverage unavailable) to validate normalization and idempotent upserts.
- Run a weekly CJ-driven merchant discovery loop (candidate export -> scoring -> application cohort -> data viability check) so merchant growth and ingestion quality evolve together.
- Defer broad direct-site scraping until at least two official source connectors are operational.
- Keep legal/compliance review as a hard gate for any Tier-3 scraping activation.

## Next Batch

- Status: ready once first source is selected
- Batch:
  1. Choose the first connector (CJ/eBay/BestBuy/Awin/Amazon), defaulting to eBay Browse API unless blocked by quota/coverage constraints (use CJ only if eBay unavailable).
  2. Draft ADR for ingestion execution mode (sync pilot vs Oban-first).
  3. Scaffold `ProductCompare.Ingestion` adapter boundary and fixture-based parser tests.
  4. Promote this work doc from `drafting` to `active` when source choice + ADR exist.
- Blockers (Note: blockers in "drafting" state require named owner, target date, and unblock criteria to be considered active and tracked):
  - **First-source selection and ownership**
    - Owner: Ryan (backend/ingestion lead)
    - Target date: 2026-04-03
    - Unblock criteria: First connector choice documented in ADR with rationale; owner assigned to connector spike
  - **Compliance signoff checklist process**
    - Owner: Ryan (interim compliance coordinator)
    - Target date: 2026-04-03
    - Unblock criteria: Minimal provider onboarding checklist drafted and approved for Tier-1 sources; named legal approver recorded before any Tier-3 scraping gate can open

## Verification Commands

- `sed -n '1,220p' docs/work/product-data-scraping.md`
- `sed -n '1,340p' docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
- `sed -n '1,220p' docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `sed -n '1,220p' docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`
- `rg -n "scraping|ingestion|Oban|Browse API|PA-API|Awin|Best Buy" docs`

## Deferred note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.

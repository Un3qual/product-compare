# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. Product data ingestion lane: `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
   - Status: blocked
   - Source context: `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
   - Completed: CJ fixture-backed source selection, ingestion execution ADR, source-agnostic ingestion boundary, merchant source identity persistence, and fixture-backed normalized listing persistence into catalog/pricing/spec targets.
   - Next scope: no unblocked local ingestion batch remains before live provider validation.
   - Deferred: live CJ credential validation, quota behavior, account-scoped sample payloads, source onboarding compliance signoff, and any Tier-3 scraping activation.

## Next Candidate After Active Queue

1. Backend lane follow-up
   - Depends on a new product/backend priority decision.
   - Intended scope: decide whether to extend generic node lookup to `SourceArtifact` after a public GraphQL object contract exists, or move the backend lane to the next GraphQL contract slice.

## Recently Completed

- Review readability cleanups: `docs/work/review-readability-cleanups.md`
  - Status: completed on 2026-05-31
  - Source context: `ARCHITECTURE.md`, frontend Relay route data, GraphQL resolver helpers, and core backend contexts.
  - Scope: consolidated frontend route helpers, backend GraphQL helpers, context-local attr cleanup, and saved-comparisons Relay delete migration cleanup.
  - Result: repeated route/resolver plumbing now delegates to shared helpers where it pays off, core context attr handling stays local, and `/compare/saved` is on Relay query/mutation APIs.

- Commerce attribution lane: `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
  - Status: completed on 2026-05-23
  - Final implementation plan: `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`
  - Scope: first-party redirect/click plumbing, conversion and purchase-price facts, the revenue summary read model, and read-only GraphQL `revenueSummary` exposure are complete. CJ/Awin source-field mapping remains deferred pending account docs or sample payloads.

## Historical Reference

- `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
  - Completed on 2026-04-30.
- `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - Completed on 2026-03-19.
- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.

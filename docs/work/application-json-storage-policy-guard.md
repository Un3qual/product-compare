# Application JSON Storage Policy Guard

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-application-json-storage-policy-guard-implementation-plan.md`
- Last verified: 2026-07-30 against compiled Ecto schema declarations,
  migration history, and the current application JSON storage test.

## Target Outcome

Stable application-owned relational facts cannot regress into opaque JSON
columns. Persisted JSON remains possible only for an explicitly classified
raw, open-key, request-metadata, or JSON-typed value contract.

## Ready Evidence

- The repository currently has six persisted Ecto `:map` fields and matching
  migration columns:
  - `commerce_links.campaign_params`
  - `commerce_conversions.raw_payload`
  - `ingestion_runs.query`
  - `merchant_feed_candidates.raw_metadata`
  - `product_attribute_claims.value_json`
  - `source_artifacts.raw_json`
- `comparison_snapshots.payload` is now virtual and relationally hydrated.
- `alert_events.fact_snapshot` is absent after typed alert-fact normalization.
- The current policy test checks only those two removed columns. A new
  application-owned JSON dump under any other name would escape the contract.
- No persisted array-of-map field exists.

## Boundaries

- Preserve provider-owned raw evidence and request metadata.
- Preserve open campaign parameters and explicitly JSON-typed specification
  values.
- Do not infer that every map is bad; require a named semantic reason.
- Do not alter domain storage in this guard batch unless characterization
  exposes a current unclassified violation.
- Keep public GraphQL behavior unchanged.

## Internal Slices

1. Compiled persisted-map and PostgreSQL JSON catalog inventory.
2. Explicit semantic classification with default-deny drift detection.
3. Former snapshot/alert dump regressions and full storage-owner verification.

## Verification

- clean migrated test database
- focused application JSON storage policy suite
- comparison snapshot, alert, specification, ingestion, and
  commerce-attribution suites
- full backend test, type, quality, formatting, queue, and diff gates

## Blocker Rule

Stop and record the exact field if a current JSON column has a stable closed
shape but converting it would require a new product or compatibility decision.
Do not classify it as raw or open merely to make the guard pass.

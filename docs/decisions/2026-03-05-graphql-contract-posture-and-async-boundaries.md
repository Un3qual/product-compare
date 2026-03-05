# GraphQL Contract Posture + Async Boundaries (2026-03-05)

## Decision Summary

- Pre-GA GraphQL contracts are allowed to change when needed to improve consistency and correctness.
- Prefer typed payload errors for mutation business failures instead of ad-hoc top-level string errors.
- Prefer strict input parsing for IDs/cursors; invalid transport input should fail deterministically.
- Current implementation remains synchronous by design; async execution is deferred intentionally.

## Why This Decision Exists

- We are still in MVP iteration and need freedom to standardize API behavior quickly.
- Strict parsing and typed errors reduce hidden client bugs and ambiguous server behavior.
- Synchronous workflows keep iteration speed high while deferred async surfaces are still being scoped.

## Sync-Now, Oban-Later Boundaries

The following boundaries are intentionally synchronous today and should be moved behind Oban jobs when deferred scope is activated:

1. Source ingestion + normalization
   - Current relevant schemas/contexts: `Specs` sources/artifacts/external products.
   - Future async boundary: artifact fetch/parse/import pipelines with retries + dead-letter handling.
2. Affiliate provider ingestion + coupon/link refresh
   - Current relevant context: `Affiliate`.
   - Future async boundary: provider adapters, scheduled sync runs, backoff/retry windows.
3. Derived formula recomputation
   - Current relevant schemas: derived formulas + dependencies.
   - Future async boundary: dependency-triggered recompute jobs with idempotent writes.

## Agent Guidance

- Do not block needed GraphQL contract cleanup on backward compatibility concerns before GA.
- When adding new workflows that match boundaries above, keep synchronous behavior explicit and add TODO/docs notes for eventual Oban migration points.

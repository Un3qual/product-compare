# MVP Scope Freeze (2026-03-05)

## Decision

To keep delivery focused on a basic working MVP, the team is explicitly deferring non-essential capabilities until the core domain workflows and current GraphQL surfaces remain stable.

## In Scope For Basic MVP

- Core bounded-context workflows already implemented in `Accounts`, `Taxonomy`, `Catalog`, `Specs`, `Pricing`, `Affiliate`, and `Discussions`.
- Current GraphQL/Auth surface already implemented and verified:
  - viewer
  - API-token lifecycle
  - affiliate workflows
  - `activeCoupons` connection payload
- Deterministic seeds and existing test suite as the primary acceptance gate.

## Deferred Scope And Rationale

- [x] Scraping ingestion jobs and scheduling pipelines (`Oban`, retries, dead letters)
  - Why deferred: adds infra and operational complexity; not required for MVP correctness of existing synchronous workflows.
  - Revisit trigger: first external data source onboarding requiring background execution.
- [x] Affiliate API ingestion/normalization jobs
  - Why deferred: provider-specific mapping and credential management are integration work, not core MVP behavior.
  - Revisit trigger: first affiliate-provider integration commitment.
- [x] Derived formula execution engine and dependency-driven recomputation workers
  - Why deferred: requires evaluator semantics, dependency invalidation strategy, and async orchestration.
  - Revisit trigger: first product feature requiring computed attributes in live flows.
- [x] Advanced moderation and anti-spam/reputation governance
  - Why deferred: policy-heavy feature area with role design and abuse controls beyond baseline CRUD/moderation status transitions.
  - Revisit trigger: public/community traffic or governance requirements beyond current trusted usage.
- [x] Embeddings/semantic search and frontend search UI
  - Why deferred: retrieval infrastructure and indexing pipelines are additive and not required for baseline MVP workflows.
  - Revisit trigger: explicit semantic search requirement in product roadmap.
- [x] Additional GraphQL hardening beyond current shipped surfaces
  - Why deferred: incremental quality work after current auth/Relay improvements; not blocking basic MVP operation.
  - Revisit trigger: external client contract expansion or reliability incidents that require stricter API semantics.

## Next Non-Deferred Item

Next item to implement (non-deferred): **MVP contract-consistency cleanup**.

Reason:
- This is core correctness work inside existing MVP scope.
- It removes schema/migration/API mismatches that can cause avoidable validation failures or maintenance drift.

Implementation plan: [2026-03-05-mvp-contract-consistency-cleanup-plan.md](/Users/admin/.codex/worktrees/a684/backend/docs/plans/2026-03-05-mvp-contract-consistency-cleanup-plan.md)

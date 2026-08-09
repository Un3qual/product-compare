# Persisted Relationship And Lifecycle Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-09-persisted-relationship-and-lifecycle-integrity-implementation-plan.md`
- Last verified: 2026-08-06 preflights and focused baselines from the three
  former candidate slices.

## Target Outcome

PostgreSQL preserves existing cross-record and lifecycle invariants even when a
write bypasses application changesets: post parents remain within their thread,
terminal ingestion runs carry completion timestamps, and claim dependents use
the referenced claim's product-and-attribute scope.

## Why This Is One Batch

The three former ready rows were storage-level enforcement slices with the same
acceptance boundary: direct writes must not create persisted states that the
owning domain already rejects. Each slice alone was migration-and-test sized.
Together they form one reviewable storage-integrity outcome with a meaningful
characterization milestone, implementation milestone, and combined parity
gate. They remain path-disjoint internal slices, not separate queue rows.

## Validated Evidence

- Thread-post preflight found no cross-thread parents, and the five-test parent
  baseline passed. The planned composite key preserves nullable roots and
  column-specific parent nulling on deletion.
- Ingestion preflight found no terminal row with a null `finished_at`, and the
  41-test focused baseline passed. Only `succeeded` and `failed` require a
  timestamp; `running` remains unfinished.
- Both claim-dependent mismatch counts were zero, the original claim foreign
  keys retain `ON DELETE CASCADE`, and the 15-test current-selection/correction
  baseline passed.

## Boundaries

- No data repair, generic integrity abstraction, hierarchy trigger, timestamp
  ordering policy, claim-status policy, or changeset repository query.
- Preserve thread cycle locks, ingestion lifecycle readers, independent claim
  foreign keys, and claim-deletion cascades.
- Stop and report exact identifiers if any preflight is no longer clean.

## Internal Slices

1. Same-thread parent composite referential integrity.
2. Terminal ingestion timestamp check and truthful readiness fixture.
3. Product-attribute claim-scope composite referential integrity.

## Verification

- three direct-write storage suites and their accepted controls
- owning community, ingestion, and specification lifecycle suites
- affected seed, catalog, recommendation, snapshot, SEO, and GraphQL consumers
- full backend tests, type checks, quality, formatting, queue validation, and
  diff hygiene

## Exit Condition

All three persisted-state gaps reject invalid direct writes under their exact
named constraints, every accepted and deletion control remains intact, and the
combined affected and repository gates pass.

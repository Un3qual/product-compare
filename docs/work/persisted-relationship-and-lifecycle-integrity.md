# Core Persisted Lifecycle And Claim Integrity

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-09-persisted-relationship-and-lifecycle-integrity-implementation-plan.md`
- Last verified: 2026-08-09 implementation and complete repository gates.

## Target Outcome

PostgreSQL preserves existing core lifecycle and referential invariants even
when a write bypasses application changesets: terminal ingestion runs carry
completion timestamps, and claim dependents use the referenced claim's
product-and-attribute scope.

## Why This Is One Batch

The two retained core-data slices share one acceptance boundary: direct writes
must not create persisted states that the owning domain already rejects. Each
slice alone is migration-and-test sized. Together they form one reviewable
storage-integrity outcome with a meaningful characterization milestone,
implementation milestone, and combined parity gate. The former discussion
slice is deferred by product direction and is not part of this batch.

## Completed Outcome

- PostgreSQL now rejects a `succeeded` or `failed` ingestion run without
  `finished_at` under `ingestion_runs_terminal_finished_at_required`; `running`
  rows remain allowed to be unfinished.
- Both claim-dependent tables now use composite foreign keys that require the
  referenced claim to carry the same product and attribute. Claim deletion
  still cascades, and the owning changesets map the named constraints.
- Direct-write and owner suites passed 38 tests; the affected domain suite
  passed 204 tests; and the corrected CJ cleanup fixture passed its focused
  regression.
- The complete backend passed 1,279 tests with no failures. Typecheck, quality,
  formatting, queue validation, and diff hygiene also passed.

## Boundaries

- No data repair, generic integrity abstraction, timestamp ordering policy,
  claim-status policy, or changeset repository query.
- Preserve ingestion lifecycle readers, independent claim foreign keys, and
  claim-deletion cascades.
- Stop and report exact identifiers if any preflight is no longer clean.

## Internal Slices

1. Terminal ingestion timestamp check and truthful readiness fixture.
2. Product-attribute claim-scope composite referential integrity.

## Verification

- two direct-write storage suites and their accepted controls
- owning ingestion and specification lifecycle suites
- affected seed, catalog, recommendation, snapshot, SEO, and GraphQL consumers
- full backend tests, type checks, quality, formatting, queue validation, and
  diff hygiene

## Remaining Work

Commerce and shared product slug end-anchor semantics and numeric-claim unit
deletion policy still need product decisions. Discussions and Community work
remains explicitly deferred.

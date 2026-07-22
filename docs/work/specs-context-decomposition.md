# Specs Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-specs-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 at implementation head `9bc9f650` against the live
  Specs facade, five direct consumer characterization suites, and the full CI
  gate.

## Batch Outcome

`ProductCompare.Specs` remains the stable caller-facing context while
definition upserts, typed-value normalization, claim/import workflows,
correction/moderation workflows, and read projections live in focused internal
modules with unchanged public APIs and behavior.

## Final Structure Evidence

- `ProductCompare.Specs` is a 248-line stable public facade. It retains every
  caller-facing guard, default, typespec, and delegation boundary.
- `ProductCompare.Specs.Definitions` (89 lines) owns dimension, unit,
  enum-set, enum-option, and attribute upserts plus canonical base-unit
  conversion.
- `ProductCompare.Specs.TypedValues` (158 lines) normalizes typed claim values
  and validates decimal input, numeric ranges, units, and enum ownership.
- `ProductCompare.Specs.Claims` (355 lines) owns claim proposal, imported
  observation fingerprints/evidence/replay/auto-acceptance, status
  transitions, and locked current-claim selection.
- `ProductCompare.Specs.Corrections` (274 lines) owns correction proposal,
  correction queries/counts, and transactional moderation/current-claim
  replacement with stale-current protection.
- `ProductCompare.Specs.Reads` (377 lines) owns source-artifact reads,
  current-attribute projections and metadata, plus filter, enum-option, and
  unit-symbol read helpers.
- Existing focused helpers remain `ProductCompare.Specs.ClaimValue` (23 lines,
  display formatting) and `ProductCompare.Specs.UnitConversion` (21 lines,
  canonical decimal conversion). The facade and seven focused/supporting
  modules total 1,545 lines.
- A source-parsed public-export comparison against pre-decomposition
  `cee69bee` found 34 facade exports before and after, with no additions or
  removals. An external-caller scan for `Definitions`, `TypedValues`, `Claims`,
  `Corrections`, and `Reads` returned no matches outside the facade and owned
  implementation files: callers continue to use `ProductCompare.Specs` only.
- The exact direct Specs, ingestion enrichment, catalog filter
  metadata/filtering, and recommendation characterization gate passed 79 tests
  before final review and 81 tests after the two public-facade error-contract
  regressions were added, with 0 failures on 2026-07-22.

## Analyzer Resolution Evidence

- Initial CI exposed four Specs Dialyzer warnings after extraction: opaque
  `Ecto.Multi` construction in claim/correction workflows and the
  `MapSet` contract for filterable enum-option pairs. The source-only
  `c987dab1` repair made the transaction sequencing explicit with
  `Repo.transaction`/`with` while preserving the lock, rollback, idempotency,
  and public-result contracts.
- That repair briefly used `Enum.into(..., MapSet.new())` for the set contract;
  Reach rejected the three occurrences as a smell. The source-only `1d45e009`
  repair introduced the local `map_set/1` reducer instead, satisfying both
  Dialyzer and Reach with no configuration, baseline, ignore-list, budget,
  test, or public-spec change.
- Whole-batch review found that manual invalid-changeset preflight had lost the
  original `Ecto.Multi.insert` error action. The `9bc9f650` fix applies the
  changeset with `:insert` before returning it, and public-facade regression
  tests prove invalid claim and correction proposals return
  `action: :insert` without persisting data.

## Boundaries

- Preserve every public function, arity, default, typespec, value, error,
  ordering rule, preload, query budget, transaction, and lock boundary.
- Preserve claim fingerprints, evidence excerpts, replay and auto-acceptance,
  correction idempotency and stale-current behavior, and moderation policy.
- Preserve typed values, numeric ranges/conversion, enum and unit validation,
  invalid-ID handling, source-artifact projection, and filter metadata.
- Keep every caller on `ProductCompare.Specs`; do not expose internal modules as
  a new application contract.
- Do not change schemas, migrations, GraphQL SDL, domain policy, or SQL
  semantics.

## Verification

- `mix test test/product_compare/specs test/product_compare/ingestion/enrichment_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare/catalog/filtering_regression_test.exs test/product_compare/recommendations_test.exs` — 81 tests, 0 failures.
- `mix typecheck` — passed.
- `mix format --check-formatted` — passed.
- `mix work_queue.validate` — passed; 3 ready rows.
- `mix ci` — passed (Credo: 3,574 mods/funs with no issues; ExDNA clone budget
  6/6; Reach: no new smells; Dialyzer: 15 baseline findings skipped; backend
  coverage: 904 tests, 0 failures, 83.64% against the configured 69% threshold,
  and generated HTML results; frontend Relay validation, `tsc --noEmit`, and
  1,507 Vitest checks across 105 files passed; client and SSR builds completed
  in 2.71s and 1.38s; the
  bundle contract passed at 596,440 raw / 182,164 gzip bytes across 1 initial
  JavaScript file against the 200,000-gzip-byte budget).
- `git diff --check` — passed.

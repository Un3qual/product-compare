# Taxonomy Context Decomposition

## Batch Outcome

- Status: complete. The four implementation owners are in place, and the
  final hierarchy milestone preserves the two existing path-scoped Dialyzer
  baselines after their unchanged calls moved out of the facade.
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-taxonomy-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the complete focused taxonomy
  characterization and final integration gates.

## Target Outcome

`ProductCompare.Taxonomy` remains the stable application-facing context while
taxonomy registry, taxon hierarchy, use-case assignment, and category-alias
implementations move into focused internal modules with unchanged public APIs,
transactions, closure behavior, queries, errors, catalog guards, and ingestion
mapping.

## Final Evidence

- `ProductCompare.Taxonomy` is the 88-line application-facing facade. The
  ownership slices are `Taxonomy.Taxonomies` (83 lines),
  `Taxonomy.Hierarchy` (205 lines), `Taxonomy.Assignments` (37 lines), and
  `Taxonomy.Aliases` (72 lines): 397 internal lines and 485 lines across the
  facade plus all four internal modules.
- The direct-reference scan found nine matching source lines: four facade
  aliases, one permitted internal `Assignments -> Taxonomies` alias, and four
  internal module definitions. It found zero application or test callers
  outside the facade/internal taxonomy boundary.
- `mix test test/product_compare/taxonomy
  test/product_compare/ingestion/enrichment_test.exs` passed: 13 tests, 0
  failures.
- `mix typecheck` and `mix format --check-formatted` passed.
- `mix work_queue.validate` initially hit the sandbox-local Mix.PubSub socket
  restriction (`:eperm`); the identical command with local-socket access
  passed and reported `work queue valid: 3 ready rows`.
- `mix ci` passed with exit status 0. Credo checked 342 source files / 3,763
  mods-funs with no issues; ExDNA passed at the existing 6/6 clone budget,
  Reach suppressed 34 baseline findings, and Dialyzer passed with 11 existing
  warnings skipped and 8 unnecessary skips reported. The backend coverage
  stage passed 909 tests with 0 failures at 83.45% total coverage.
- The frontend stage passed Relay validation, TypeScript, 105 Vitest files /
  1,507 tests, client and SSR production builds, and the bundle contract at
  596,440 raw / 182,164 gzip bytes against the 200,000-byte gzip budget. Vite
  emitted its existing advisory for a raw chunk larger than 500 kB.
- The two unchanged hierarchy `Ecto.Multi` opaque-type baselines moved from
  `taxonomy.ex` to `taxonomy/hierarchy.ex`; no warning text or suppression was
  added or broadened.
- `git diff --check` passed.

## Internal Slices

1. Taxonomy seeding, upserts, membership checks, and reads.
2. Taxon creation, updates, moves, closure maintenance, and hierarchy reads.
3. Product use-case assignment and removal.
4. Category-path normalization, alias persistence, and type-alias resolution.

## Boundaries

- Preserve every public function, clause, guard, default, typespec, value,
  query, transaction, and error.
- Preserve validation, closure rows, ordering, conflict targets, assignment
  policy, normalization, alias resolution, and catalog and ingestion behavior.
- Relocate only the two existing path-scoped hierarchy `Ecto.Multi` Dialyzer
  baselines when their unchanged calls move out of the facade; do not change
  their warning text or add new suppressions.
- Keep callers dependent only on `ProductCompare.Taxonomy`.
- Do not change schemas, migrations, GraphQL SDL, catalog filtering, ingestion
  enrichment, SEO, frontend contracts, or taxonomy policy.

## Verification

- `mix test test/product_compare/taxonomy test/product_compare/ingestion/enrichment_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

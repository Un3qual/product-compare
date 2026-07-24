# Actionable ExDNA Clone Retirement

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-actionable-exdna-clone-retirement-implementation-plan.md`
- Last verified: 2026-07-23 against the current six-clone ExDNA report and
  direct worker, CJ Runs, and discussion characterization suites.

## Target Outcome

Three genuinely shared behaviors have focused owners and the enforced ExDNA
budget falls from six to three without abstracting coincidental near matches.

## Ready Evidence

- The current quality gate reports exactly six clones.
- Durable CJ workers repeat execution mechanics, CJ Runs report/resume owners
  repeat value serialization, and all three community schemas repeat the same
  moderation changeset.
- Existing suites exercise every affected public boundary.

## Boundaries

- Preserve job, output, and moderation behavior.
- Do not create generic repositories, schemas, callbacks, or formatting
  frameworks.

## Verification

- `mix test test/product_compare/ingestion/jobs test/mix/tasks/product_compare_ingestion_cj_runs_test.exs test/product_compare/discussions`
- `mix ex_dna --max-clones 3`
- `mix ci`

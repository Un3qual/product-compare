# Post-Decomposition Quality Execution Design

## Goal

Execute the four user-selected post-decomposition quality outcomes while
preserving the live dispatcher's three-ready-row floor:

1. retire the three actionable ExDNA clone groups;
2. remove all Dialyzer suppressions;
3. validate ready-row implementation-plan references;
4. reconcile the Reach baseline against current source.

## Dispatch Shape

The user claimed all four outcomes for serial execution in this worktree.
Before implementation, the coordinator moves those rows to active work and
promotes three non-overlapping, source-verified reserve outcomes. The reserve
exists to preserve truthful dispatch continuity; it is not part of this
implementation program.

The reserve outcomes are:

- strict Credo enforcement, backed by the two narrator-documentation findings
  currently hidden by the non-strict gate;
- coverage-contract hardening, backed by 83.74% observed coverage against a
  69% enforced floor and uncovered first-party Mix entry points;
- Logger-level test isolation, backed by two ingestion suites that mutate the
  process-global Logger level and leak concurrent SQL/debug output into CI.

Deferred eBay, ingestion-dashboard, provider, email, production-readiness, and
CSV-export scope remains closed.

## Batch Boundaries

### Actionable ExDNA Clone Retirement

One support owner holds the identical CJ import-run completion contract, one
formatter holds identical CJ-run rendering, and one schema helper holds
identical moderation changesets. The durable worker near match remains
explicit: its shared facade shape does not justify an Oban macro or callback
framework. The remaining three near matches stay explicit.

### Dialyzer Suppression Retirement

Remove stale ignore entries first, then correct the 11 reachable findings at
the context, schema, plug, resolver, runtime-config, and test-support owners.
Opaque values use their public APIs, ingress values normalize once, and public
functions, errors, and accepted inputs stay unchanged. Delete the ignore file
only after an unsuppressed run reports zero findings.

### Work-Queue Plan Reference Integrity

Keep `Validator.validate/1` pure and filesystem-free. File-backed validation
parses the single backticked plan path from each ready row, rejects absolute or
traversing paths, resolves the path beneath the repository root, and checks
that the target is an executable implementation plan. Errors remain
deterministic and row-indexed.

### Reach Baseline Reconciliation

Use an unsuppressed strict Reach scan as the red gate. Apply only
behavior-preserving mechanical improvements for eager enumeration, redundant
forms, string construction, and private forwarders. Do not introduce structs
for stable boundary maps or narrow deliberate catch-all failure containment
just to silence advisory findings.

After the actionable findings are removed, regenerate the baseline from the
current tree so it contains only intentionally retained map-shape and
failure-containment findings at their current owners. The quality alias keeps
strict Reach enforcement with that reconciled baseline, so new findings still
fail CI.

## Data And Error Contracts

- Runtime values, database queries, GraphQL shapes, CLI text, Oban results,
  changeset fields, and authorization behavior remain unchanged.
- Analyzer fixes do not add generic callback, repository, schema, formatting,
  or result-wrapper frameworks.
- Work-queue filesystem errors name the ready-row index and fail without
  reading an escaping path.
- Reach and Dialyzer remediation preserve broad failure capture where it is an
  intentional scheduler, job, delivery-hook, or CLI safety boundary.

## Verification

Each batch uses its checked-in focused plan and milestone commits. The program
finishes only after:

- every focused suite passes;
- ExDNA passes with a three-clone budget;
- Dialyzer passes without an ignore file;
- file-backed work-queue validation rejects unsafe or incomplete plans;
- strict Reach passes with the reconciled current baseline;
- `mix ci`, `git diff --check`, and the queue validator pass on the aggregate
  head.

The final anti-slop review checks every new helper, module, guard, fallback,
delegation, and baseline entry for a concrete responsibility or reachable
input.

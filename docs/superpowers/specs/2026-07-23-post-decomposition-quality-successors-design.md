# Post-Decomposition Quality Successors Design

## Goal

Preserve the live queue after the fixed backend-decomposition manifest
completes by promoting three independently shippable quality outcomes backed
by current repository evidence.

## Selected Outcomes

### Actionable ExDNA Clone Retirement

The repository currently consumes its entire six-clone budget. Three findings
represent shared behavior rather than coincidental domain shape: durable CJ
worker execution, CJ run value serialization, and discussion moderation
changesets. Consolidate those responsibilities and lower the enforced clone
budget from six to three. Do not introduce a generic repository, schema, or
callback framework to erase the remaining near matches.

### Dialyzer Suppression Retirement

The current Dialyzer run reports 11 suppressed findings and eight unnecessary
suppressions across an 18-entry ignore file. Remove stale entries, correct
reachable specs and opaque-type handling at their owning boundaries, and
finish with no ignored findings. Runtime behavior and public APIs remain
unchanged; weakening types to `term()` is not an acceptable fix.

### Work-Queue Plan Reference Integrity

The queue validator proves row shape and depth but does not prove that a
ready row's plan path exists or contains an executable plan contract. Extend
file-backed validation to resolve repository-relative plan references, reject
missing or escaping paths, and require the plan header and task structure used
by current implementation plans. Keep the pure Markdown validator free of
filesystem behavior.

## Alternatives Rejected

- Recursively splitting the remaining large modules conflicts with the
  approved decomposition stop boundary; those files are focused pipelines,
  registries, algorithms, or declarative schema owners.
- Deferred eBay and ingestion-dashboard work still requires an explicit
  product decision.
- One row per clone, warning, helper, or validator clause would be queue
  filler rather than independently reviewable outcomes.

## Verification And Stop Boundary

Each successor has a dedicated plan and lane doc. These are queued successors,
not additions to the active backend-decomposition program. They must preserve
runtime behavior, avoid dependencies and migrations, and pass their focused
tests plus `mix ci`. No further candidate is promoted without new source or
product evidence.

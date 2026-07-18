# Coherent Work Batch Granularity Design

## Problem

The rolling queue correctly required concrete owned paths and a minimum ready
reserve, but it did not distinguish an independently shippable batch from an
implementation slice. Recent curation therefore promoted route-, helper-, and
copy-sized rows that were safe for parallel agents but too small to represent
meaningful roadmap batches.

Parallel safety and queue depth are execution properties. They are not evidence
that two changes deserve separate reviewer or product decisions.

## Decision

A live queue row represents one independently shippable and reviewable outcome.
Work that enforces the same invariant across adjacent surfaces belongs in one
row, with internal slices for ownership, test cycles, and milestone commits.

The coordinator uses two promotion questions:

1. What outcome ships when this row closes?
2. Could a reviewer reasonably approve this row while rejecting its nearest
   candidate?

If the second answer is no, the candidates are grouped. Requested batch counts
and the ready-row floor never justify artificial subdivision.

## Queue Shape

The three former micro-rows and the validated follow-up evidence become four
coherent frontend batches:

1. **Account and setup presentation contracts** — affiliate merchant-context
   copy and API-token lifecycle action policy.
2. **Frontend cursor forward-progress hardening** — one nonblank, advancing
   Relay cursor invariant across stateful and URL-driven pagination surfaces.
3. **Strict temporal presentation** — strict GraphQL DateTime validation for
   alert and comparison observation labels and recency selection.
4. **Row-scoped asynchronous action state** — row-specific pending and error
   feedback for comparison-snapshot revocation and price-watch actions.

Each batch keeps per-surface changes as internal slices. Slices may use
path-disjoint parallel workers when safe, but they share one queue status, one
acceptance boundary, and one final verification gate.

## Constraints

- Preserve existing GraphQL operations, Relay request timing, URL shapes,
  presentation, and accessibility unless the batch explicitly changes the
  affected correctness behavior.
- Use behavior tests, not source-string assertions.
- Keep framework-free data owners free of React, Relay, router, StyleX, Radix,
  and generated-query dependencies.
- Commit internal slices only at code/test/doc milestone boundaries.
- Do not reopen deferred email transport, live conversion ingestion,
  production privacy/attribution controls, eBay, or ingestion operator UI.

## Durable Prevention

`AGENTS.md`, `docs/work/operating-model.md`, plan guidance, the plan catalog,
and the coordinator prompt all carry the batch-versus-slice rule. The queue
validator requires every ready row to state its shippable `Batch outcome` and
at least one `Internal slices` item. Future numeric planning requests must
return the smaller truthful batch set when the repository does not support the
requested count.

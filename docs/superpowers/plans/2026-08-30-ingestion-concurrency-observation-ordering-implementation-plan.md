# Ingestion Concurrency And Observation Ordering Implementation Plan

## Goal

Make first-sighting merchant resolution, observation-derived evidence, and CJ
success-payload decoding deterministic under concurrency, stale input, and
malformed provider responses.

## Constraints

- Lock only the logical key whose write decision depends on an earlier read.
- Keep lookup, lock, and write in one transaction.
- Keep uniqueness constraints authoritative.
- Prevent stale observations from replacing newer facts while preserving
  explicitly arrival-based counters.
- Never include raw provider payloads in malformed-result errors.

## Implementation

1. Acquire a transaction advisory lock for the source and merchant identifier,
   re-read, and resolve the identity through the public transaction contract.
2. Add timestamp-aware conflict predicates for product media and category
   candidates.
3. Validate CJ resultList, counts, and limit in one response-shape contract
   before iterating or computing cursors.

## Owned Areas

- Merchant identity, catalog evidence, listing enrichment, and CJ client code
- Deterministic lock, stale-observation, and provider-shape tests
- test/support/database_test_helpers.ex only for reusable database barriers

## Verification

Run focused concurrency, ingestion, enrichment, and CJ client tests, then
formatting, type checks, and the complete repository gate. Completion evidence
and milestone commits live in
docs/work/ingestion-concurrency-observation-ordering.md.

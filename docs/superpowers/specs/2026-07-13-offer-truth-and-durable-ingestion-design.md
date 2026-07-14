# Offer Truth And Durable Ingestion Design

## Goal

Make every offer claim complete about what is known, honest about what is
unknown, fresh within a declared policy, and reproducible from durable imports.

## Offer Read Contract

The GraphQL price observation exposes item price, nullable shipping, stock,
observed time, and safe source provenance. A derived offer summary exposes:

- currency;
- item price;
- known shipping;
- nullable landed price (`item + shipping` only when shipping is known);
- stock state (`in_stock`, `out_of_stock`, or `unknown`);
- freshness (`fresh`, `aging`, or `stale`);
- observation timestamp and freshness threshold; and
- whether the offer is eligible for best-offer and recommendation calculations.

Tax remains explicitly unknown until a destination-specific quote exists.
Cross-currency values are grouped, never directly ranked. Product and compare
pages request a database-wide active-offer summary so the best-offer result is
not limited to one Relay page.

## Reconciliation

Each complete source import receives a run-scoped observation token. After all
pages finish, reconciliation marks source listings not seen in that complete
run inactive. Partial, failed, or intentionally bounded exploratory imports do
not deactivate unseen listings. A later fresh observation can reactivate an
offer. Freshness policies can hide stale offers without destroying history.

The run record stores provider, operation, scope fingerprint, status, attempt,
page/record counts, timestamps, cursor bounds, reconciliation status, and a
redacted error category. Raw provider payloads stay in source artifacts under
existing redaction rules.

## Durable Jobs

Replace timer-only scheduled imports with database-backed jobs. Oban is the
preferred implementation because the application already uses PostgreSQL and
needs unique jobs, retry/backoff, queue limits, pruning, and operational state.
Schedulers enqueue bounded feed-discovery and product-import jobs rather than
performing network work in a `GenServer` callback.

Jobs are idempotent by provider, operation, scope fingerprint, and schedule
window. Transient provider/network failures retry with bounded exponential
backoff and jitter. Authentication and invalid-query failures stop retrying and
surface an operator action. Exhausted jobs remain queryable as discarded jobs;
there is no silent infinite loop.

## Operations

Operator-safe health reads report queue depth, running/available/retryable/
discarded counts, oldest pending age, last success, last failure category, and
last reconciliation outcome. They never expose job arguments containing
credentials, raw provider errors, queries, account IDs, or tracking data.
Manual Mix tasks enqueue the same workers and can wait for a bounded result in
development; they do not maintain a second import implementation.

## Alert Hook

A successfully committed fresh price observation emits an idempotent domain
event after the transaction. Alert evaluation consumes persisted observations,
not transient provider responses, and never blocks import completion.

## Verification

Tests cover landed-price completeness, stock/freshness states, global best
offer versus paginated offers, full-run deactivation, partial-run safety,
reactivation, job uniqueness, retry classification, discarded job health,
scheduler enqueue behavior, and import/alert idempotency. A runtime drill proves
a job survives process restart against the test database.

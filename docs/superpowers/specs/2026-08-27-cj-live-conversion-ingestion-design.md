# CJ Live Conversion Ingestion Design

**Date:** 2026-08-27

**Status:** Proposed; provider and architecture direction approved

## Objective

Fetch publisher commissions from CJ's current Commission Detail GraphQL API,
normalize them through ProductCompare's existing CJ attribution boundary, and
persist them so the existing operator revenue dashboard reflects real
conversion data.

The importer must be durable, replay-safe, bounded, observable, and disabled by
default until its credential and live-contract gates pass. It adds no new
frontend route or operator control surface.

## Approved Product Boundary

This is one backend Commerce Attribution outcome:

- CJ is the first live conversion provider.
- Manual execution and scheduled polling are both supported.
- Scheduled polling is explicitly approved but remains runtime opt-in.
- The existing revenue summary and attribution ledger are the acceptance
  surfaces; no new UI is added.
- Production reset-password and verification email delivery remains deferred.
- Awin, Impact, Rakuten, eBay, generic multi-provider orchestration, privacy
  policy expansion, deployment proof, and unrelated operator pages remain out
  of scope.

## Current State

ProductCompare already owns:

- server-side CJ personal-access-token configuration for product ingestion;
- Req-based CJ GraphQL transport patterns with injectable test seams;
- outbound CJ `shopperId`/legacy SID click-reference decoration;
- `ProductCompare.CommerceAttribution.CJAdapter` for normalizing already-fetched
  commissions;
- attribution restoration from the public click UUID;
- idempotent conversion persistence on affiliate network plus provider
  conversion reference;
- status-aware revenue aggregation and an operator-only revenue dashboard;
- Oban-backed workers, schedule-window deduplication, and secret-safe job
  health patterns for CJ product ingestion.

The missing ownership is the provider fetch, page traversal, durable sync-run
evidence, and scheduling path for commissions. The existing
`ingestion_runs` table is not that owner: it is a product-ingestion ledger whose
closed surfaces are `shoppingProducts` and `shoppingProductFeeds`.

## Verified CJ Contract

The design was checked on 2026-08-27 against CJ's public Commission Detail
GraphQL schema and authentication documentation:

- endpoint: `https://commissions.api.cj.com/query`;
- authentication: `Authorization: Bearer <personal-access-token>`;
- publisher root: `publisherCommissions(forPublishers: ...)`;
- time bounds: inclusive `sincePostingDate` and exclusive
  `beforePostingDate`, expressed as UTC ISO 8601 strings;
- page continuation: when `payloadComplete` is false, pass
  `maxCommissionId` as the next `sinceCommissionId`;
- selected evidence: `commissionId`, `original`, `originalActionId`,
  `correctionReason`, `actionStatus`, `shopperId`, `eventDate`, `postingDate`,
  `saleAmountUsd`, and `pubCommissionAmountUsd`;
- current statuses: `new`, `extended`, `locked`, and `closed`;
- money scalars are JSON strings and timestamps are UTC ISO 8601 strings.

Implementation must use `shopperId`, not the deprecated `sid` field, while the
adapter may retain inbound legacy-SID compatibility for fixtures and already
captured payloads.

References:

- [CJ Commission Detail API](https://developers.cj.com/graphql/reference/Commission%20Detail)
- [CJ authentication overview](https://developers.cj.com/authentication/overview)

## Approaches Considered

### Selected: CJ-specific Commerce Attribution importer

Add a CJ client, importer, sync-run owner, Oban worker, scheduler, and Mix task
under Commerce Attribution. Reuse the existing CJ adapter and conversion
persistence.

This preserves the real domain boundary, ships the approved provider without a
speculative abstraction, and leaves a clear seam for a later provider to prove
which mechanics are genuinely shared.

### Rejected: generic multi-provider ingestion framework

A provider registry, generic cursor protocol, shared payload model, and common
scheduler would be based on one live API and three normalization-only adapters.
That would encode guesses about incompatible provider pagination, correction,
credential, and rate-limit contracts. A second live provider may extract a
small shared job result or scheduling leaf only after concrete duplication
exists.

### Rejected: reuse ProductCompare.Ingestion and `ingestion_runs`

Product ingestion owns catalog/feed discovery, offer reconciliation, source
artifacts, and provider product surfaces. Commission synchronization owns
financial attribution evidence and status changes. Adding commission surface
codes to the product-ingestion ledger would couple unrelated lifecycle,
reconciliation, and authorization meanings merely to reuse a table.

### Rejected: new operator UI in the first batch

The current revenue dashboard already exposes summary and ledger evidence.
Building run controls or a second dashboard before observing real operational
failures would mix presentation decisions into the ingestion correctness
boundary. Sync health remains backend-owned in this batch.

## Responsibility Boundaries

### `ProductCompare.CommerceAttribution.CJ.Client`

The client owns only the external GraphQL contract:

- endpoint, bearer authentication, timeouts, and Req transport;
- the exact `publisherCommissions` query and variables;
- response status, JSON, GraphQL-envelope, and selected-field validation;
- one-page projection containing records, `payloadComplete`, and
  `maxCommissionId`;
- injectable transport for focused tests.

It does not persist records, calculate scheduling windows, read the database,
or log credentials and raw headers. It returns typed success/error tuples and
never treats a malformed or partial GraphQL response as an empty page.

### `ProductCompare.CommerceAttribution.CJ.Importer`

The importer owns one bounded window:

- validates publisher IDs and an exact `from`/`before` UTC interval;
- creates a running conversion sync record;
- walks CJ pages until `payloadComplete` is true;
- rejects a non-advancing, blank, or repeated continuation cursor;
- enforces a configured positive page ceiling;
- normalizes the selected USD fields into the existing CJ adapter;
- records page and record counts;
- marks the run succeeded only after the complete payload is processed;
- marks the run failed with a redacted summary on any transport, envelope,
  cursor, adapter, or persistence failure.

The importer does not hold a database transaction across network calls. Each
conversion write remains an atomic, idempotent persistence operation. A failed
run may therefore leave valid earlier records persisted; retrying the same
window converges on the same rows.

### `ProductCompare.CommerceAttribution.CJAdapter`

The existing adapter remains the provider-to-domain normalization boundary and
is updated to the current publisher schema:

| CJ field | ProductCompare meaning |
| --- | --- |
| `commissionId` | provider conversion reference for an original record |
| `originalActionId` | provider action correlation reference |
| `shopperId` | public ProductCompare click UUID, with legacy `sid` fallback |
| `new`, `extended` | `pending` |
| `locked`, `closed` | `approved` |
| `saleAmountUsd` | USD order amount |
| `pubCommissionAmountUsd` | USD publisher commission amount |
| `eventDate` | purchased time |
| `postingDate` | reported and freshness time |

The first implementation does not claim CJ payout confirmation, so `closed`
does not become ProductCompare `paid`.

CJ documents `originalActionId` as the correlation identifier between original
and corrected transactions. Original conversions persist it in a new nullable
`network_action_ref` column with a non-unique network-scoped index. The field is
provider evidence, not a replacement for the unique `network_conversion_ref`.

The importer processes all fetched original records before correction records.
A non-original record locks every CJ conversion with the same
`network_action_ref` in one database transaction, then marks rows whose stored
evidence is not newer as `reversed`. It preserves the original non-negative
amounts for audit while revenue aggregation excludes the reversed rows. The
correction payload and freshness timestamp replace the affected rows' raw
evidence so the reason remains inspectable by operators. Replaying an older or
equal correction against already-newer correlated evidence is a successful
no-op, not a failed run.

This is deliberately conservative: if a CJ correction is a partial adjustment,
the entire correlated action is excluded from revenue rather than interpreting
an undocumented delta. A correction with a blank action reference, no matching
original after the complete bounded window has been processed, or malformed
required evidence fails closed. The implementation must not silently skip a
correction, take absolute values, insert it as a second positive conversion, or
mark an uncorrelated conversion reversed.

### `ProductCompare.CommerceAttribution.ConversionSyncRuns`

A focused context owner records sync evidence in
`commerce_conversion_sync_runs` through
`ProductCompareSchemas.CommerceAttribution.ConversionSyncRun`.

The table stores:

- entropy UUID and affiliate network foreign key;
- `running`, `succeeded`, or `failed` status;
- inclusive window start and exclusive window end;
- last provider cursor;
- non-negative page, fetched-record, persisted-record, and failed-record
  counts;
- start and finish timestamps;
- a bounded, secret-safe error summary;
- ordinary inserted/updated timestamps.

It stores no personal access token, authorization header, request headers, or
unredacted exception dump. Terminal rows require `finished_at`; the window must
be increasing; counts must be non-negative; and the error summary must satisfy
the same code-point bound in Ecto and PostgreSQL. Every same-row database check
receives the required pre-write validation, named `check_constraint/3`
mapping, changeset behavior test, and direct database test in this batch.

The run ledger is evidence, not a cursor authority. Scheduled windows are
derived explicitly from the clock and configured lookback, so a deleted or
failed run cannot cause a permanent data gap.

### Oban worker, scheduler, and Mix task

`ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker` runs the
importer in the existing `:ingestion` Oban queue with bounded retries. Unique
job arguments include publisher IDs, window bounds, page ceiling, and schedule
window so duplicate scheduler ticks converge while intentionally different
backfills remain distinct.

`ProductCompare.CommerceAttribution.CJCommissionSyncScheduler` follows the
existing CJ scheduler support pattern. It is disabled by default. On each tick
it enqueues exactly one UTC window ending at the tick time and beginning the
configured number of lookback days earlier. Defaults are:

- interval: 1,440 minutes;
- lookback: 90 days;
- initial delay: 60 seconds;
- maximum pages: 100.

The long rolling window deliberately re-reads mutable CJ lifecycle states.
Idempotent upserts make the overlap safe; no inferred high-water mark can hide
a late lock, close, or correction.

`mix product_compare.commerce_attribution.cj_commissions` runs the same
importer manually with explicit `--from` and `--before` bounds or the same
bounded lookback default. It supports `--check-credentials` without contacting
CJ and prints only counts, bounds, run identity, and redacted failure kinds.
The task is not a second implementation path.

## Configuration And Credential Contract

The client reuses:

- `CJ_API_TOKEN` for the server-side personal access token;
- `CJ_ACCOUNT_ID` as the publisher company ID unless an explicit
  `CJ_COMMISSION_PUBLISHER_IDS` list is configured.

New runtime settings are:

- `CJ_COMMISSION_SYNC_SCHEDULE_ENABLED`, default false;
- `CJ_COMMISSION_SYNC_INTERVAL_MINUTES`, default 1,440;
- `CJ_COMMISSION_SYNC_LOOKBACK_DAYS`, default 90;
- `CJ_COMMISSION_SYNC_INITIAL_DELAY_MS`, default 60,000;
- `CJ_COMMISSION_SYNC_MAX_PAGES`, default 100;
- optional `CJ_COMMISSION_PUBLISHER_IDS`, a non-empty comma-separated list.

The endpoint remains the verified CJ production endpoint in the client; tests
inject transport rather than changing production configuration. Credentials
are read at execution time and never copied into Oban arguments or the sync-run
ledger.

Scheduled activation requires all of the following evidence:

1. credential preflight passes without printing secret material;
2. a bounded live manual window returns a structurally valid response;
3. a redacted fixture derived from that response is committed;
4. rerunning the same window proves row-count and value convergence;
5. a synthetic correction fixture proves the conservative action-level
   reversal path; a live correction, when available, must agree before its
   evidence is used to refine that policy;
6. the schedule enablement variable is changed outside source control by the
   environment owner.

## Pagination And Window Semantics

Each request fixes `forPublishers`, `sincePostingDate`, and
`beforePostingDate` for the entire run. Only `sinceCommissionId` changes during
page traversal.

The first request omits `sinceCommissionId`. If `payloadComplete` is false,
`maxCommissionId` must be a non-empty value not previously seen in the run.
That value becomes the next request cursor. A complete page terminates the
loop even when `maxCommissionId` is present. An incomplete page without a new
cursor fails the run.

The manual task rejects `from >= before`, non-UTC or malformed timestamps,
blank publisher IDs, non-positive page ceilings, and unbounded execution. The
scheduler computes one exact UTC interval per tick. It never uses local time
or a date-only boundary.

## Idempotency, Ordering, And Concurrency

Original CJ records use the existing unique key of CJ affiliate-network ID plus
`commissionId`. Equal or later `postingDate` evidence may update the row;
earlier evidence cannot overwrite a fresher row. Replaying an identical window,
overlapping manual and scheduled runs, or retrying after a partial failure must
not create duplicate conversions.

Correction updates select and lock their CJ affiliate-network and
`network_action_ref` matches, classify missing versus stale evidence, and write
inside one `Repo.transaction/2`. Fetching all bounded pages before the
original-then-correction persistence phases prevents provider page order from
deciding whether a correction can find its original. The locked transaction,
not an unlocked preflight query, owns correction freshness and application.

The provider page cursor orders retrieval only. It is not a database identity,
time watermark, or proof of freshness outside its fixed query window.

No global lock is added. Overlapping runs are allowed because the conversion
upsert is the atomic concurrency owner. Oban uniqueness reduces redundant
scheduled calls but is not treated as the correctness mechanism.

## Failure And Observability Contract

- Missing or blank credentials fail before network access.
- Non-2xx responses, invalid JSON, top-level GraphQL errors, missing selected
  fields, invalid cursors, page-ceiling exhaustion, malformed required record
  values, unmatched corrections, and database failures fail the run.
- One malformed record is not skipped while later records are counted as a
  successful sync.
- Oban retries retry the same explicit window.
- Error summaries name a bounded failure category and may include response
  status or GraphQL error code, but never the token, request headers, complete
  provider body, or raw exception inspection.
- Success logging includes run UUID, window, pages, fetched records, and
  persisted records.
- Failure logging includes run UUID, window, and redacted failure category.
- Raw selected CJ records continue to live only on their corresponding
  conversion rows under the existing operator/security boundary.

The existing revenue dashboard does not receive synthetic sync status. A
successful imported conversion appears through its current summary and ledger
queries; a window with zero commissions remains a successful zero-record run.

## Data Flow

1. A manual task or enabled scheduler constructs an exact UTC window.
2. The Oban worker invokes the importer with bounds and publisher IDs.
3. The importer creates a running Commerce Attribution sync record.
4. The CJ client fetches GraphQL pages using server-side credentials; the
   importer validates each continuation and repeats until CJ reports
   `payloadComplete: true`.
5. The importer retains the complete bounded record set in provider
   order-independent original and correction groups.
6. It passes original records through `CJAdapter`; existing attribution
   restoration resolves `shopperId` to a click session
   when possible, and existing conversion persistence performs the atomic
   upsert.
7. After originals exist, correction records conservatively reverse their
   action-correlated originals in locked transactions.
8. The run is completed with truthful counts, or failed with a redacted reason.
9. Existing revenue queries display approved CJ conversions without a new
   frontend contract.

## Non-Goals

- No new GraphQL fields, route, dashboard, run button, or browser polling.
- No generic provider registry or shared provider payload type.
- No webhook receiver.
- No Awin, Impact, Rakuten, Amazon, or eBay live fetcher.
- No item-level purchase table or product matching from untrusted CJ SKU
  fields.
- No inferred merchant/product match based on provider names or amounts.
- No partial-correction or delta accounting; known corrected actions are
  conservatively excluded from revenue.
- No production email transport; the 2026-03-17 auth-token-delivery deferral is
  reaffirmed by the user on 2026-08-27.
- No privacy/retention policy expansion or production deployment proof.

## Testing And Verification

Implementation uses TDD and adds focused coverage for:

- exact GraphQL query variables and bearer-header redaction;
- success, HTTP failure, invalid JSON, GraphQL errors, and missing response
  fields;
- complete single-page and multi-page traversal;
- repeated, blank, missing, and non-advancing cursors;
- page-ceiling exhaustion;
- `shopperId` attribution plus legacy-SID compatibility;
- current USD amount fields and all four documented CJ statuses;
- original action-reference persistence, correction ordering independence,
  conservative reversal, unmatched correction failure, and stale correction
  replay;
- identical replay, overlapping windows, stale evidence, and later status
  updates;
- sync-run changeset and direct PostgreSQL constraints;
- worker argument uniqueness, retry results, and secret-free job arguments;
- scheduler disabled/enabled behavior and exact clock-derived windows;
- Mix task options, credential preflight, and redacted output;
- existing revenue summary and ledger visibility after import.

Focused verification covers the client, importer, adapter, sync-run schema,
worker, scheduler, task, revenue aggregation, and affected GraphQL revenue
tests. Final verification runs formatting, types, quality/static analysis, the
complete backend suite, the complete repository gate, queue validation, and
`git diff --check`.

The optional live evidence gate uses the ignored local credential source
without echoing or persisting credential values. It runs one bounded manual
window, records only redacted structural evidence, and repeats the same window
to prove convergence. No live schedule is enabled from source control.

## Acceptance Criteria

The batch is complete when:

1. a bounded CJ publisher-commission window can be fetched manually and by an
   opt-in scheduled Oban job;
2. complete pagination is proven and malformed continuation fails closed;
3. identical and overlapping runs do not duplicate conversions or let older
   evidence replace newer evidence;
4. imported approved conversions appear in the existing revenue summary and
   ledger;
5. every run leaves durable, secret-safe success or failure evidence;
6. known corrections conservatively remove the correlated action from revenue
   without creating a second positive row;
7. scheduled activation remains off until the recorded live-contract gates
   pass;
8. auth email delivery remains deferred; and
9. all focused and repository verification gates pass.

## Dispatch Shape

This design becomes one queue row, not separate client, schema, worker,
scheduler, task, and test batches. Those are internal slices of one reviewer
decision: whether ProductCompare can ingest CJ commissions durably and
truthfully into its existing revenue product.

The implementation row will own only Commerce Attribution source/schema/tests,
the focused migration, runtime configuration and environment example, the Mix
task, the new plan and lane doc, and the coordinator queue/catalog updates
explicitly named by that row. Production auth-email files remain outside its
owned implementation paths.

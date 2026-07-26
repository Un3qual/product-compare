# CJ Program Lifecycle Design

## Purpose

Replace the feed-by-feed review workflow with one operator-only page for
managing CJ advertiser programs from initial discovery through a recorded
application outcome.

The page is called **CJ programs**. It groups feeds by CJ advertiser, keeps one
human-managed stage per program, and shows feed facts and missing information
beside that stage. It does not create a second application-preparation page.

## Product Language

Use plain workflow language throughout the page, GraphQL API, tests, and
documentation:

- Page and navigation label: **CJ programs**
- Path: `/ingestion/cj-programs`
- Stages: **New**, **Considering**, **Selected**, **Applied**, **Accepted**,
  **Not pursuing**, and **Declined**
- Missing identity section: **Unmatched feeds**
- Row details: **Program details**, **Feeds**, **Notes**, and **Last changed**

Do not use `readiness view`, `surface`, `contract`, `projection`, or
`operator tooling` as product copy. Do not describe locally complete data as
CJ approval or provider eligibility.

## Selected Approach

Persist program workflow separately from feed observations and present it as a
paginated table/list with an explicit stage selector.

This is preferred over:

1. copying the same stage onto every feed, which creates duplicate state that
   can drift when feeds are added or refreshed;
2. deriving a program stage from a mixture of feed statuses, which makes
   conflicts ambiguous and prevents one durable human decision; and
3. a seven-column drag-and-drop board, which is awkward for pagination,
   detailed feed facts, keyboard use, and smaller screens.

## Program Identity And Storage

Add one CJ program record for each trimmed, nonblank CJ advertiser ID within
its source. Enforce that identity with a unique database constraint. The
program owns:

- a stable UUID;
- the source and CJ advertiser ID;
- the current stage;
- an optional operator note;
- the time the stage or note last changed; and
- ordinary insertion and update timestamps.

The allowed stored stages are:

- `new`
- `considering`
- `selected`
- `applied`
- `accepted`
- `not_pursuing`
- `declined`

Each merchant feed candidate may reference one CJ program. Feed discovery
creates or finds the program when a nonblank advertiser ID is present, then
links the feed to it. A later discovery pass may update feed facts or attach a
new feed, but it must never replace the program stage or note.

Feeds without a usable advertiser ID remain unlinked. They appear under
**Unmatched feeds** on the same page because the system does not have a stable
program identity to manage yet.

## Existing Data Migration

Create program records for existing CJ advertiser IDs, link their feeds, and
derive one initial stage:

- if any feed is shortlisted, use `considering`;
- otherwise, if every feed is dismissed, use `not_pursuing`;
- otherwise, use `new`.

Use the most recently reviewed nonblank feed note as the initial program note,
breaking equal review-time ties by feed ID. Use that review time as the initial
change time when present.

After the backfill, the program record is the only workflow source of truth.
The old per-feed review fields and their database constraint are removed; the
application does not dual-write legacy and program state.

## Replacing The Old Feed Review Workflow

Every active consumer of the old feed review fields moves to program stages in
the same change. The old GraphQL review fields and mutation, feed review page,
and `cj_candidate_review_batch` task are removed rather than left as a second
way to manage the lifecycle.

The existing `cj_candidates` reports and `cj_import` command continue to
report or import feeds, but they obtain workflow state by joining each feed to
its program:

- `cj_candidates --stage` replaces `--status`, accepts the seven program
  stages plus `all`, and uses `--include-unmatched` when feeds without a
  program should be included;
- the stale report defaults to `--stage all`, while the fit-gap report defaults
  to `--stage new`;
- the application-cohort report includes feeds for programs in **Selected**,
  because those are the programs chosen for an application that has not yet
  been recorded as submitted;
- the application-warning checks use **Selected** programs for the same
  reason;
- `cj_import --from-programs` replaces `--from-candidates`; without explicit
  feed IDs it imports feeds linked to **Selected**, **Applied**, and
  **Accepted** programs, so a stage advance does not accidentally stop an
  existing product import;
- explicit `cj_import --provider-feed-id` values continue to select those exact
  feeds regardless of program stage or whether the feed is unmatched;
- the readiness gate replaces its shortlist threshold with
  `--min-pursued-programs` and counts programs in **Selected**, **Applied**, or
  **Accepted**; and
- feed freshness and market-coverage summaries remain feed counts, but label
  any workflow breakdown by the linked program stage and keep unmatched feeds
  separate.

Program counts always count programs, while feed reports always count feeds.
The API, commands, output labels, tests, and active CJ operator runbook use
`stage` rather than `review status`, `shortlisted`, or `dismissed`. Historical
dated plans and migrations remain unchanged as history.

## Stage Changes

An operator may move a program directly to any stage. The application does not
force sequential movement because it records real work that may already have
happened outside ProductCompare.

The stage meanings are:

- **New**: discovered but not assessed.
- **Considering**: worth investigating.
- **Selected**: chosen to pursue.
- **Applied**: an application was submitted outside ProductCompare.
- **Accepted**: CJ or the advertiser accepted the application.
- **Not pursuing**: the operator chose not to continue.
- **Declined**: CJ or the advertiser declined the application.

A stage change stores the selected stage, the trimmed note or `nil`, and the
current UTC time in one database update. Feed facts and data warnings do not
automatically change a human-selected stage.

## GraphQL API

Add an operator-only CJ program connection with:

- cursor pagination;
- optional stage filtering;
- deterministic name, latest-change, and feed-count ordering;
- full-dataset stage counts;
- safe advertiser identity and program workflow fields; and
- a bounded nested feed connection for each program.

Add a separate operator-only connection for unmatched CJ feeds so they can
appear on the same route without inventing a program identity.

Add one mutation that changes a program stage and note. It returns the updated
program or the existing typed authorization, invalid-ID, missing-record, and
validation errors used by adjacent ingestion mutations.

The API never returns raw provider metadata, credentials, account identifiers
other than the safe CJ advertiser ID, tracking parameters, or provider
payloads.

## Page Behavior

Replace the existing feed-candidate review route with the **CJ programs** page
at `/ingestion/cj-programs`. Keep `/ingestion/feed-candidates` as a redirect so
saved links do not break. Change operator navigation to **CJ programs**.

The page contains:

- counts for all seven program stages;
- a stage filter and deterministic sort control;
- one program row per CJ advertiser;
- a stage selector that offers all seven stages;
- one notes field and save action per row;
- row-local pending, success, and error feedback;
- safe advertiser and last-change details;
- plain-language missing-information warnings;
- expandable, paginated feeds for that program; and
- an **Unmatched feeds** section for feeds without an advertiser ID.

Feed rows show factual values: feed name and ID, product count, market,
currency, language, feed type, and last-seen time. The existing opaque fit
score is removed; the page shows the underlying facts and warnings instead.
Product counts remain per feed and are not summed because feeds can overlap.

The page does not submit applications, contact advertisers, change CJ
accounts, make live CJ requests, store credentials, or edit feed observations.

## Data Flow

1. CJ feed discovery upserts a feed candidate.
2. When the feed has an advertiser ID, the ingestion owner finds or creates
   the corresponding program and links the feed without changing its stage.
   Program creation, feed upsert, and linking succeed or fail in one database
   transaction.
3. The route loader fetches program counts, the requested program page, and
   the first unmatched-feed page through Relay.
4. Expanding a program loads its bounded feed connection.
5. Saving a row sends the program ID, selected stage, and note through the
   operator-only mutation.
6. A successful mutation refreshes that row and the stage counts. A failed
   mutation leaves the other rows unchanged.

## Errors And Edge Cases

- Anonymous and authenticated non-operator requests fail before database
  reads or writes.
- Invalid and missing program IDs return typed errors and make no change.
- Blank notes store as `nil`.
- A newly discovered feed with an existing advertiser ID joins the existing
  program without changing its workflow fields.
- A feed whose advertiser ID is missing or blank remains unmatched.
- Multiple feeds may disagree on descriptive fields. The program name uses
  the most recently seen nonblank advertiser name, while every feed retains
  its own factual values in the expanded list.
- Missing information is visible but never silently changes or blocks a
  manually recorded stage.
- Pagination links preserve the current stage filter and sort.
- Row-local pending and errors do not disable or relabel another program.

## Testing

Backend behavior tests cover:

- one program created for multiple feeds sharing an advertiser ID;
- distinct programs for distinct advertiser IDs or sources;
- unmatched feeds for blank advertiser IDs;
- discovery refreshes preserving stage and note;
- migration mapping for pending, mixed, shortlisted, and all-dismissed feeds;
- removal of the legacy feed review fields and mutation;
- stage-based application-cohort, warning-check, import, freshness, and
  market-coverage behavior;
- direct movement to every allowed stage;
- blank-note normalization and missing-record behavior;
- operator authorization before reads and writes;
- stable pagination, filtering, ordering, stage counts, and nested feed pages;
- safe GraphQL fields and explicit exclusion of raw or secret data; and
- the checked-in schema snapshot.

Frontend behavior tests cover:

- the new route and old-path redirect;
- operator navigation;
- all stage labels, counts, filters, and direct stage choices;
- program grouping and expanded feed facts;
- unmatched feeds;
- plain-language warnings without the old fit score;
- mutation variables and note trimming;
- row-local pending, success, and failure behavior;
- pagination state preservation; and
- loading, empty, authorization, and unavailable states.

Relay artifacts are regenerated from the checked-in GraphQL schema. Focused
backend and frontend suites run during each test-first step, followed by the
repository's complete backend, frontend, type, formatting, quality, build,
bundle, and diff checks.

## Scope And Queue Decision

This design reverses the prior ingestion-dashboard deferral only for this one
CJ program lifecycle page. eBay fallback, general ingestion dashboards,
automated application submission, account-manager contact, credential
persistence, Tier-3 scraping, and CSV export remain deferred or rejected.

The work is one independently shippable cross-stack outcome. Database,
ingestion, GraphQL, Relay, route, and documentation changes are implementation
steps inside that outcome rather than separate queue rows.

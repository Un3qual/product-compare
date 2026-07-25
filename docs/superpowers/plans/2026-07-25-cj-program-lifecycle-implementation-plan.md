# CJ Program Lifecycle Implementation Record

**Status:** Completed on 2026-07-25.

**Goal:** Replace feed-by-feed CJ review with one operator-only **CJ programs**
page where an advertiser program can be placed directly in any lifecycle
stage.

**Architecture:** A `cj_programs` row owns the durable stage, note, and change
time for one trimmed CJ advertiser ID within one source. Feed candidates remain
observed facts and link to a program when they have stable advertiser identity.
Discovery, reporting, imports, GraphQL, and the React route use that program
record rather than copying workflow state onto feeds.

This document preserves the decisions, delivered slices, and verification
expectations from the implementation. Detailed task-by-task prompts and copied
code examples were removed after completion because the code, tests, commit
history, and durable work log are the authoritative implementation evidence.

## Product Decisions

- Page and navigation label: **CJ programs**.
- Canonical path: `/ingestion/cj-programs`.
- `/ingestion/feed-candidates` redirects to the canonical page.
- Stages are **New**, **Considering**, **Selected**, **Applied**, **Accepted**,
  **Not pursuing**, and **Declined**.
- Operators choose any stage directly; there is no required transition
  sequence.
- One program owns one stage, note, and change time for one trimmed, nonblank
  CJ advertiser ID within one source.
- Discovery may update feed facts or attach new feeds, but it cannot replace a
  program's stage or note.
- Feeds without a usable advertiser ID remain unlinked and appear as
  **Unmatched feeds** on the same page.
- The program record is the only active workflow source of truth. Legacy
  feed-level review state is not dual-written.
- The page shows factual feed values and plain-language warnings. It does not
  present the old fit score or imply CJ approval or provider eligibility.
- Browser access is operator-only and authorization occurs before lifecycle
  reads or writes.
- GraphQL does not expose raw provider metadata, credentials, account
  identifiers, tracking parameters, or provider payloads.

## Scope Boundaries

Included:

- durable program storage and deterministic migration of legacy review state;
- automatic feed-to-program linking;
- lifecycle queries, counts, warnings, and bounded feed pages;
- stage-aware candidate reports, program imports, and readiness checks;
- operator-only GraphQL and Relay operations;
- one React workspace with URL filters, row-local edits, lazy feed details, and
  unmatched feeds;
- removal of the retired feed-review route, task, fields, helpers, and active
  tests.

Excluded:

- live CJ application submission or advertiser contact;
- new credential storage;
- eBay fallback or Tier-3 scraping;
- CSV export;
- a general ingestion dashboard;
- speculative program scoring.

## Queue Waiver

The live queue had no `ready` rows when this work was selected. On 2026-07-25,
the user approved one coherent cross-stack batch and a one-time waiver of the
three-ready reserve rule. The work was not split into database, GraphQL, and
frontend filler rows.

The waiver does not weaken `ProductCompare.WorkQueue.Validator`. At the
completed boundary, `mix work_queue.validate` and aggregate `mix ci` are
expected to fail only with:

```text
Ready Work requires at least 3 complete rows; found 0
```

Formatting, compilation, types, quality, tests, frontend checks, and diff
hygiene remain required. Any other queue error is a blocker.

## Delivered Slices

### 1. Durable lifecycle storage

- Added `cj_programs` with source-scoped advertiser identity, entropy ID,
  stage, note, and change time.
- Linked merchant feed candidates through `cj_program_id`.
- Migrated grouped legacy state deterministically, including note tie-breaking.
- Removed active feed-level review columns.
- Added database constraints and changeset validation for identity and stage
  integrity.

### 2. Discovery linking and lifecycle updates

- CJ feeds with a trimmed advertiser ID create or reuse one source-scoped
  program.
- Concurrent inserts use the database uniqueness constraint safely.
- Blank advertiser IDs and non-CJ feeds remain unmatched.
- Feed refreshes preserve lifecycle stage and note.
- Blank notes normalize to `nil`; unchanged saves preserve `changed_at`.
- Lifecycle updates accept direct stage choices without transition guards.

### 3. Program reads and warnings

- Added deterministic program sorting, filtering, global stage counts, and
  bounded linked/unmatched feed queries.
- Added factual warnings derived from observed feed values.
- Program list warning aggregation is batched.
- Singular and mutation warnings are resolved only when `warningCodes` is
  selected.
- Invalid context-level stage filters fail closed.

### 4. Stage-aware reports

- Freshness, market coverage, stale-feed, fit-gap, and application-cohort
  reports use linked program stages.
- Unlinked feeds remain an explicit unmatched category.
- Application cohorts use the selected stage without reintroducing retired
  review terminology.

### 5. Program-driven imports and readiness

- `--from-programs` imports selected, applied, and accepted programs by
  default.
- Repeated `--stage` values narrow that managed set.
- Explicit feed IDs bypass lifecycle and unmatched restrictions while still
  failing before fetch when any requested ID is missing.
- Import options are normalized once at the task boundary.
- Operational output reports feed/import counts without secret values.

### 6. Operator GraphQL API

- Added program connection, singular program, stage counts, safe feed pages,
  and lifecycle mutation fields.
- Used opaque program IDs and typed mutation errors.
- Authorization runs before lifecycle table reads or writes.
- Schema and behavior tests cover safe fields, pagination, warnings, direct
  lifecycle changes, malformed IDs, and authorization.

### 7. Relay route data

- Added one preload operation for stage counts, program pages, and unmatched
  feed pages.
- Added a separate lazy query for one program's bounded feed details.
- Kept program and unmatched cursors independent in URL state.
- Generated Relay artifacts are checked in and validated.

### 8. Unified CJ programs page

- Added the canonical operator route and retired-route redirect.
- Rendered global stage counts, filters, sorted program pages, expandable feed
  details, and unmatched feed pages.
- Kept mutation drafts, pending state, and feedback local to each program row.
- Reused one feed-row component for linked and unmatched feed facts.
- Used one frontend lifecycle registry for labels, URL values, stage controls,
  and summary counts.
- Preserved route-local loading, empty, unavailable, and row feed-error states.

## Durable Invariants

- Program stage and feed facts have distinct owners.
- Discovery cannot overwrite lifecycle decisions.
- Program counts and feed counts retain different meanings.
- Every supported stage remains available in the schema and row control.
- Unknown future Relay enum values are displayed without coercion and cannot be
  submitted accidentally.
- Feed detail failures remain isolated from the rest of the workspace.
- GraphQL selections request only fields used by their consumer.
- Tests target behavior rather than source strings or file layout.

## Verification

The implementation was developed through focused red/green slices. The
completed work log in `docs/work/product-data-scraping.md` records the original
full verification evidence and the exact reserve-floor waiver.

Before publication, rerun:

```bash
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
mix ci
git diff --check
```

All checks must pass except the two commands governed by the exact zero-ready
waiver above. Relay artifacts and schema snapshots must be current.

## Historical Milestones

The implementation history is intentionally preserved as milestone commits:

- lifecycle design and activation;
- storage migration;
- discovery linking and arbitrary transitions;
- queries and warnings;
- stage-based reports;
- program-based imports;
- GraphQL API;
- Relay data loading;
- unified React workspace;
- review fixes and final verification evidence.

The final code and tests supersede implementation snippets that appeared in the
original working plan.

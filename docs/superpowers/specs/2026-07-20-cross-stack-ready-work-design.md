# Cross-Stack Ready Work Design

## Purpose

Replace the frontend-only dispatch shape with a truthful cross-stack queue that
contains every currently validated frontend and backend outcome. Group work by
reviewable product or engineering outcome instead of by file, framework, or
implementation layer.

This design covers the four frontend outcomes already marked `ready` on
2026-07-18 and the four backend candidates validated against current source,
tests, and accepted contracts. It produces seven queue batches because alert
correctness is one cross-stack lifecycle outcome, while comparison-only
temporal and mutation-state work belongs together.

## Dispatch Principles

- A batch must be independently shippable and deserve one reviewer decision.
- Frontend and backend slices belong together when they close the same user- or
  operator-visible invariant.
- Shared implementation language, path overlap, or parallel safety alone does
  not justify grouping unrelated outcomes.
- Per-route and per-file changes remain internal slices and milestone commits.
- Every batch below is source-backed and executable without reversing an
  existing product deferral.
- The eBay fallback, ingestion dashboard/operator surfaces, production email
  delivery, production privacy/attribution proof, and rejected CSV export stay
  outside this program.
- All seven rows may be marked `ready`. Their priority order is also the safe
  serial order when owned paths overlap.

## Queue Shape

### 1. Durable Ingestion Recurrence

**Outcome:** Scheduled CJ product imports and feed discovery deduplicate only
within the same explicit schedule window. A later schedule window can enqueue
the same normalized scope again.

**Internal slices:**

1. Add `schedule_window` to both workers' Oban uniqueness keys and characterize
   same-window versus later-window behavior.
2. Make both schedulers derive and pass a stable explicit window for each tick.
3. Preserve normalized non-secret arguments, terminal/transient retry
   classification, and existing bounded runner options.

**Acceptance boundary:** Duplicate jobs for the same operation, scope, and
window resolve to one job; changing only the window produces a distinct job.
Focused worker and scheduler tests, type checking, formatting, and the combined
repository gate pass.

### 2. Alert Lifecycle Reliability

**Outcome:** Every committed price observation is evaluated asynchronously
against every applicable watch, one broken rule cannot starve later rules, and
the alert interface presents truthful timestamps and row-local mutation state.

**Internal slices:**

1. Evaluate all matching watches even when one evaluation fails. Aggregate the
   failed watch identifiers after processing so the Oban job remains retryable;
   successful evaluations stay replay-safe through existing locking and event
   uniqueness.
2. Keep price-point persistence and Oban enqueue atomic. The asynchronous job,
   not the import transaction, performs watch evaluation.
3. Use the strict GraphQL DateTime contract for alert observation labels so
   impossible, offset-free, and malformed timestamps cannot become different
   factual dates.
4. Key alert/watch pending and failure feedback by row while preserving
   successful revalidation and same-row duplicate guards.

**Acceptance boundary:** A forced failure in an earlier watch does not prevent
a later watch from producing its event, retries do not duplicate successful
events, valid timestamp presentation remains stable, and one failed or pending
frontend action does not affect unrelated rows.

### 3. Community Content Lifecycle

**Outcome:** Authenticated community content has a complete owner-controlled,
abuse-resistant lifecycle from GraphQL mutation through the product-community
interface.

**Internal slices:**

1. Add owner-scoped update and remove operations for reviews, questions, and
   answers. Removal retains moderation/audit history rather than hard-deleting
   the record.
2. Return edited published content to pending moderation. Editing hidden or
   rejected content also resubmits it as pending; removed content cannot be
   edited. Removing or resubmitting an accepted answer clears the question's
   accepted-answer reference in the same transaction.
3. Require a 16-to-128-character printable ASCII client idempotency key for
   community create mutations. Scope it by user and mutation kind. The payload
   digest covers decoded target identifiers plus the changeset-cast rating,
   title, and body values. Replaying the same key with the same digest returns
   the original result; reusing it with a different digest returns a typed
   `IDEMPOTENCY_CONFLICT` error. The frontend creates one UUID per submit
   attempt, retains it across transport retries, and replaces it only after a
   terminal payload result.
4. Enforce database-backed UTC-hour write limits per user. Defaults are five
   review creates/updates, ten question creates/updates, thirty answer
   creates/updates, and thirty reports per hour. Removal is not rate-limited.
   A permitted non-idempotent write increments its counter in the same
   transaction as the content change; idempotent replay and rejected writes do
   not consume another unit. Thresholds remain application-configurable without
   changing the GraphQL contract.
5. Return typed `RATE_LIMITED`, `FORBIDDEN`, `NOT_FOUND`, and lifecycle conflict
   payload errors without partially changing content.
6. Add the corresponding Relay mutations and owner controls to the existing
   product-community interface. Generated artifacts remain generated from the
   checked-in schema snapshot.

**Acceptance boundary:** Ownership, lifecycle transitions, accepted-answer
cleanup, idempotent retries, key conflicts, exact rate boundaries, audit
retention, typed GraphQL errors, and frontend owner actions have behavioral
coverage. Public reads continue to exclude non-published content.

### 4. Relay Cursor Forward Progress

**Outcome:** Every in-scope frontend Relay pagination surface offers another
page only when the server supplies a nonblank cursor different from the cursor
that produced the current page.

**Internal slices:**

1. Shared framework-free advancing-cursor invariant and community pagination.
2. Stateful compare-picker and product-offer pagination.
3. Public URL pagination for catalog, offers, categories, and merchants.
4. Account/setup URL pagination for API tokens and affiliate merchants.

**Acceptance boundary:** Blank and repeated cursors cannot create self-links or
repeated stateful fetches. Normal cursor values, accumulation, URL state,
Relay timing, accessibility, and presentation remain unchanged. The existing
2026-07-18 cursor plan remains the detailed implementation reference.

### 5. Bounded Merchant GraphQL Reads

**Outcome:** Merchant detail summaries for a GraphQL merchant connection use
set-based database reads whose query count does not grow with the number of
merchant parents.

**Internal slices:**

1. Replace the current per-merchant `Pricing.merchant_detail/2` loop in the
   Dataloader batch with a read model that loads active offers for all requested
   merchants together.
2. Load the latest price facts for those offers in one bounded query and build
   the existing summary shape per merchant without changing freshness or
   eligibility semantics.
3. Extend query-budget tests to request multiple merchant detail summaries and
   prove a fixed table-query budget.

**Acceptance boundary:** Summary values match the existing single-merchant
behavior, empty merchants remain correct, and relevant SELECT counts remain
constant as the number of merchant parents increases.

### 6. Account And Setup Interaction Contracts

**Outcome:** Authenticated setup and account surfaces derive deterministic
merchant-context copy and API-token lifecycle actions from framework-free
policy owners.

**Internal slices:**

1. Affiliate selected/current merchant-context copy.
2. API-token lifecycle action visibility, disabled state, and pending copy.

**Acceptance boundary:** Copy and action policy are behaviorally covered across
selected, missing, active, expired, revoked, rotate-pending, and revoke-pending
states. Forms, mutations, markup, accessibility, and presentation remain
unchanged. The existing 2026-07-18 account/setup plan remains the detailed
implementation reference.

### 7. Comparison Interaction Correctness

**Outcome:** Comparison observations use strict temporal truth and snapshot
revocation exposes pending state only on the affected snapshot row.

**Internal slices:**

1. Use strict GraphQL DateTime parsing for comparison recency labels and
   most-recent observation selection.
2. Track snapshot revocation by snapshot identifier, suppress duplicate
   same-row requests, and leave independent rows actionable.

**Acceptance boundary:** Invalid timestamps cannot win recency selection or
produce false factual labels, and revoking one snapshot neither disables nor
relabels another. Successful mutation handling, accessibility, and valid-date
behavior remain stable.

## Ownership And Execution

Each batch receives one lane work document and one detailed implementation
plan. Existing frontend lane documents may be replaced by the new domain lane
only when all of their slices are represented; historical completion evidence
must remain truthful.

The cursor batch intentionally touches several product surfaces because one
shared invariant explains every edit. It may conflict with account, community,
merchant, or comparison paths, so the queue priority is the safe serial order.
Workers still claim only rows compatible with active ownership. The ingestion,
alert, community, merchant-read, account/setup, and comparison batches retain
separate reviewer decisions because their outcomes, rollback boundaries, and
failure modes differ.

## Verification Strategy

- Use behavior-first RED/GREEN tests for every internal slice.
- Preserve existing GraphQL schema snapshots and regenerate Relay artifacts
  whenever the community GraphQL contract changes.
- Run focused backend tests for ingestion, alerts, discussions, pricing, and
  GraphQL query budgets as applicable.
- Run focused frontend tests for alerts, community, cursor consumers,
  account/setup, and comparison as applicable.
- Run `mix typecheck`, `mix format --check-formatted`, and
  `mix work_queue.validate` for coordinator boundaries.
- Run `cd assets && bun run check` for any batch that changes frontend files.
- Run `mix ci` as the final cross-stack program gate.
- Run `git diff --check` at every milestone and final boundary.

## Documentation Steady State

- `docs/work/index.md` remains the only live dispatch queue and contains seven
  complete `ready` rows.
- `docs/plans/INDEX.md` catalogs the new design and implementation plans; it
  does not duplicate live statuses.
- `docs/plans/NOW.md` remains a compatibility pointer to the live queue.
- The operating model retains the invariant-based grouping test and adds one
  explicit cross-stack example so future curation does not infer lane-specific
  queues.
- Deferred and rejected candidates remain unchanged.

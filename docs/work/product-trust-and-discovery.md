# Product Trust And Discovery Work Doc

## Snapshot

- Status: active (specification-rich enrichment and media)
- Priority: P0
- Source of truth: `docs/work/index.md`
- Program design:
  `docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`
- Program plan:
  `docs/superpowers/plans/2026-07-13-product-trust-and-discovery-program.md`
- Latest completed implementation plan:
  `docs/superpowers/plans/2026-07-13-complete-run-offer-reconciliation-implementation-plan.md`
- Active implementation plan:
  `docs/superpowers/plans/2026-07-13-specification-rich-enrichment-and-media-implementation-plan.md`
- Owner: `codex/product-trust-and-discovery`
- Last verified: 2026-07-13 against current ingestion, Specs, Pricing,
  Discussions, GraphQL, Relay route, and migration contracts.

## Selected Program

The user selected canonical specification-rich ingestion, complete and fresh
offer truth, durable ingestion, watchlists and alerts, public comparison
snapshots, source-backed recommendations, provenance and corrections, reviews
and Q&A, SEO/acquisition, and merchant pages.

The implementation order and safety boundaries are recorded in the program
design. In-app alerts are the first delivery transport; email stays deferred.
Recommendations are deterministic and evidence-backed.

## Canonical Product Identity Evidence

- Added a validated `product_identifiers` relation with safe GTIN uniqueness,
  source-artifact evidence, verification state, and product association.
- Added pure GTIN normalization for GTIN-8, UPC-A, EAN-13, and GTIN-14 without
  losing leading zeroes.
- Fresh listings now resolve an existing validated GTIN before creating a
  product shell. Different source listings and merchants retain separate
  external products and offers while sharing the canonical product.
- Existing source/external product attachments remain authoritative. A later
  conflicting GTIN cannot silently rebind the product or add a conflicting
  identifier.
- Blank, malformed, unsupported, and invalid-checksum values create no
  identifier and cause no merge.
- RED: the GTIN unit suite failed 3 tests because the module was absent. The
  ingestion suite then failed to compile because the identifier schema was
  absent.
- GREEN: the combined GTIN and ingestion run passed 34 tests with 0 failures.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`6 ready rows`), and `git diff --check` passed.

## Foundation Successors

- Specification provenance read contract: complete.
- Complete offer truth read contract: complete.
- Durable ingestion job foundation: complete.
- Enrichment, corrections, alerts, recommendations, sharing, community,
  merchant pages, and SEO are promoted only as their dependencies become
  green.
- Complete-run offer reconciliation: complete.
- Specification-rich enrichment and media: active.

## Specification Provenance Evidence

- Current attribute reads preload claim evidence, source artifacts, and source
  identity through both direct context reads and the request-scoped Dataloader.
- GraphQL exposes stable claim IDs, accepted status, source type, confidence,
  bounded 500-character evidence excerpts, and the existing safe
  `SourceArtifact` metadata object.
- Raw JSON, raw text, content hashes, and other stored artifact payload fields
  remain absent from the public schema.
- RED: the focused run reported 52 tests and 3 failures because evidence was
  not preloaded, claim IDs had no stable type, and the provenance fields were
  absent from GraphQL.
- GREEN: the focused provenance/global-ID/catalog run passed 52 tests; the same
  run with the regenerated live schema snapshot passed 53 tests.
- Relay schema validation compiled 30 reader, 29 normalization, and 29 operation
  documents with no changes required to existing operations.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`5 ready rows`), and `git diff --check` passed.

## Complete Offer Truth Evidence

- Added a pure offer-truth policy with `fresh`, `aging`, `stale`, and
  `unobserved` states plus explicit in-stock, out-of-stock, and unknown stock.
- Landed price is present only when shipping is known. Eligibility requires an
  active offer, an in-stock fresh/aging observation, and complete landed price.
- Product truth reads all active database offers, not one Relay page, and
  selects a deterministic best complete landed price independently per currency.
- GraphQL price points now expose shipping, stock, and batched safe source
  artifacts. Product GraphQL exposes counts, policy thresholds, currency
  summaries, and the source-backed best offer.
- RED: the focused run reported 20 tests and 3 failures because the offer policy,
  global aggregate, and GraphQL fields did not exist.
- GREEN: pricing and GraphQL passed 20 tests; the same run with the regenerated
  live schema snapshot passed 21 tests.
- Relay schema validation compiled 30 reader, 29 normalization, and 29 operation
  documents successfully.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

## Complete-Run Offer Reconciliation Evidence

- Added deterministic hashed run scopes plus run/listing observations that
  contain database identities only. Bounded runs record membership for future
  complete comparisons but cannot deactivate offers.
- Reconciliation is opt-in. It requires a succeeded run, zero failed records,
  and an end cursor of `nil`; partial and failed runs persist safe skipped
  outcomes.
- A complete run deactivates only active merchant products observed by an
  earlier finished run with the same source, provider, surface, and scope
  fingerprint and absent from the current run.
- A later fresh listing uses the existing ingestion upsert to reactivate an
  offer. Older concurrent runs finishing after a newer complete run are marked
  `skipped_superseded` and cannot hide newer truth.
- The CJ task, durable worker, timer scheduler, and runtime config support an
  explicit complete-scope flag that defaults false. The operator runbook warns
  that it is appropriate only for a stable intended membership scope whose
  pagination can reach the provider end cursor.
- Safe run and durable-job health expose reconciliation status, timestamp, and
  deactivation count without exposing query values or provider errors.
- RED: the initial context run reported 4 tests and 4 failures because run
  observations, scope fingerprints, and reconciliation finalization did not
  exist. The expanded integration run then exposed 6 missing task/job/health
  connections.
- GREEN: the focused reconciliation/task/job/health run passed 31 tests; the
  ingestion and affected CJ task run passed 177 tests with 0 failures.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

## Durable Ingestion Job Evidence

- Added Oban 2.23 with its PostgreSQL migration, supervised ingestion queue,
  bounded concurrency, daily pruning, and manual test mode.
- CJ product imports and feed discovery now enqueue normalized, non-secret jobs
  keyed by an explicit schedule window. Duplicate windows resolve to the
  existing job instead of executing twice.
- Jobs call the existing bounded runners, retry transient provider failures,
  stop safely on configuration/auth failures, and persist only redacted failure
  categories.
- Existing timer schedulers now enqueue by default. Injected legacy runners
  remain available for focused scheduler characterization, while an explicit
  enqueuer always wins and prevents inline provider work.
- Added a database-backed health summary with state counts, oldest pending,
  latest success, and latest safe failure category. Job arguments and raw Oban
  errors are not returned.
- RED: the focused run reported 24 tests and 7 failures because the worker,
  health, and enqueue-first scheduler contracts did not exist.
- GREEN: the durable-job and scheduler run passed 24 tests with 0 failures.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

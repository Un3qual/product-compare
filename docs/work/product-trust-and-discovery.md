# Product Trust And Discovery Work Doc

## Snapshot

- Status: active (price-alert view-data contract)
- Priority: P0
- Source of truth: `docs/work/index.md`
- Program design:
  `docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`
- Program plan:
  `docs/superpowers/plans/2026-07-13-product-trust-and-discovery-program.md`
- Latest completed implementation plan:
  `docs/superpowers/plans/2026-07-13-seo-and-acquisition-surfaces-implementation-plan.md`
- Active follow-up plan:
  `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`
- Owner: `codex/trust-surface-data-contracts`
- Last verified: 2026-07-14 after price-alert contract candidate verification
  (6 alert and watch tests).

## Selected Program

The user selected canonical specification-rich ingestion, complete and fresh
offer truth, durable ingestion, watchlists and alerts, public comparison
snapshots, source-backed recommendations, provenance and corrections, reviews
and Q&A, SEO/acquisition, and merchant pages.

The implementation order and safety boundaries are recorded in the program
design. In-app alerts are the first delivery transport; email stays deferred.
Recommendations are deterministic and evidence-backed.

## Price Alert View-Data Contract

- Status: active on `codex/trust-surface-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`.
- Next action: isolate active/paused watch grouping and rule, watch, and
  observation labels in a framework-free module while retaining loader reads,
  mutations, revalidation, pending/error state, links, and presentation in
  `AlertsRoute`.
- Owned paths:
  - `assets/src/routes/account/alerts/alerts-view-data.ts`
  - `assets/src/routes/account/alerts/AlertsRoute.tsx`
  - `assets/test/routes/account/alerts/alerts-view-data.test.ts`
  - `assets/test/routes/account/alerts/alerts.route.test.tsx`
  - `docs/work/product-trust-and-discovery.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: pure alert view data preserves stable grouping, every known
  rule label, missing-value copy, malformed-date behavior, and unknown-rule
  fallbacks.
- Candidate evidence: the existing alert and watch suite passed 6 tests, and
  current source inspection confirmed grouping and label policy remain
  embedded in the React route.

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
- Specification-rich enrichment and media: complete.
- Authenticated specification corrections: complete.
- Price watchlists and alerts: complete.
- Source-backed recommendations: complete.
- Immutable shareable comparison snapshots: complete.
- Reviews and product Q&A: complete.
- Merchant detail pages: complete.
- SEO and acquisition surfaces: complete.

## SEO And Acquisition Evidence

- Added one backend qualification policy shared by GraphQL page metadata,
  category inventory, and sitemap reads. Products require adequate accepted
  specifications, useful copy or source-backed media, and an eligible current
  landed-price observation; merchants require eligible current inventory;
  curated categories require descriptive copy and at least three qualifying
  products.
- Product, merchant, category, and public snapshot loaders now emit unique
  server-rendered titles, descriptions, absolute canonicals, robots policies,
  Open Graph/Twitter fields, and injection-safe schema.org JSON-LD. Cursor,
  filter, and other parameterized variants keep the canonical base but become
  `noindex,follow`.
- Comparison publication has an explicit owner-controlled search-discovery
  checkbox that is off by default. Opt-in alone is insufficient: the immutable
  capture must also contain specification and current-offer evidence, and
  revocation removes both the public read and sitemap entry.
- Added curated category GraphQL reads and landing pages with real qualifying
  inventory, specification highlights, and a handoff into the complete browse
  filters. Seeded TV, monitor, and projector metadata provides an operable local
  curation baseline; thin categories remain `noindex`.
- Phoenix now serves cached `robots.txt`, a partitioned sitemap index, and
  deterministic bounded product, merchant, category, and comparison sitemaps.
  Account, auth, ingestion, affiliate, and commerce tooling is excluded.
- Product slug changes persist the prior slug as a collision-safe alias. Legacy
  detail URLs resolve the canonical product and return a permanent redirect;
  merchant slugs and published category slugs remain stable.
- GREEN: backend qualification, controllers, GraphQL, snapshots, catalog,
  schema, and global-ID regressions passed 60 focused tests. The complete
  backend gate passed 752 tests at 83.02% coverage with Credo, ExDNA (`6/6`),
  strict smell analysis, and Dialyzer green.
- Relay compiled 43 reader, 42 normalization, and 42 operation documents. The
  complete frontend gate passed TypeScript, 56 test files with 748 tests,
  client and SSR production builds, and the client bundle contract at 181,856
  gzip bytes against the 200,000-byte budget.

## Merchant Detail Page Evidence

- Added deterministic canonical merchant slugs with a collision-resistant
  identity suffix. Existing merchants are backfilled, slugs remain stable when
  display names change, and unknown slugs return HTTP 404.
- The merchant detail summary evaluates every active merchant offer in the
  database through the shared offer-truth policy. It reports distinct products,
  observed and eligible offers, freshness classes, and the latest observation
  without inferring totals from a bounded Relay page.
- The public page separates complete summary facts from its cursor-bounded
  product listing, makes missing observations explicit, links products to their
  canonical detail pages, and applies the existing safe external destination
  policy to merchant domains.
- Merchant directory cards now link through the canonical slug without changing
  directory pagination or filtering behavior.
- GREEN: merchant identity, pricing read-model, and GraphQL suites passed 15
  tests. Merchant detail and directory frontend suites passed 29 tests. Relay
  compiled 42 reader, 41 normalization, and 41 operation documents; TypeScript,
  client/SSR production builds, and the bundle budget passed.

## Reviews And Product Q&A Evidence

- Reused the existing review, thread, and post tables while adding explicit
  pending/published/hidden/rejected moderation state, accepted answers, bounded
  reports, operator decisions, and indexes for published product reads.
- Authenticated submissions begin pending. Only published reviews contribute to
  public lists and two-decimal rating aggregates; only published questions and
  answers appear on product pages.
- One user remains limited to one review per product. Question owners can accept
  only a published answer from the same thread. Duplicate reports are rejected,
  and non-operators cannot moderate content.
- Offer association no longer derives `verified_purchase`; all existing inferred
  values are cleared because the application has no durable user-to-purchase
  evidence. Public author labels are generic and never expose email or user IDs.
- Product detail now has a Reviews & Q&A tab with rating summaries, published
  plain-text content, accepted-answer labels, and review/question/answer forms
  that explain moderation state.
- GREEN: new community context and GraphQL tests plus existing discussion
  regressions passed 18 tests. Product-community and existing detail suites
  passed 51 tests. Relay compiled 41 reader, 40 normalization, and 40 operation
  documents; TypeScript passed.

## Immutable Comparison Snapshot Evidence

- Authenticated owners can publish exactly two or three distinct products as a
  new immutable record with an optional bounded title and a 256-bit URL-safe
  public token. Republishing always creates a different version and token.
- Captures retain ordered product identity, accepted current specification
  claims and safe source evidence, eligible best offer facts and observation
  times, and the exact structured recommendation evaluated at capture time.
- Database reads normalize captured decimals and datetimes back into the typed
  public GraphQL contract. Later product, price, claim, or recommendation
  changes do not alter existing links.
- Public reads expose no account identity or saved-set identifier. Only the
  owner can revoke; a revoked or malformed token resolves with an HTTP 404 and
  cannot be restored through the application contract.
- Compare includes publish/revoke controls. The public route is self-contained,
  labels captured facts and observation times, warns that data may have changed,
  and links back to a newly evaluated live comparison.
- GREEN: snapshot context and GraphQL passed 7 tests; schema/global-ID
  regressions expanded the backend slice to 20 passing tests. Snapshot and
  comparison frontend suites passed 116 tests.
- Relay compiled 38 reader, 37 normalization, and 37 operation documents.
  TypeScript, client/SSR production builds, and the client bundle contract
  passed.

## Source-Backed Recommendation Evidence

- Added two deterministic, versioned profiles. `lowest_current_cost` ranks only
  eligible complete landed prices in one shared currency; `best_value` adds a
  requirement that every product have accepted specification claims.
- Missing products, stale or incomplete offer truth, mixed currencies, missing
  accepted evidence, and exact top-price ties return an explicit no-winner
  result instead of guessing.
- Every ranking retains the exact price-point ID, merchant-offer ID, accepted
  claim IDs, algorithm version, and structured reasons used by the decision.
- GraphQL accepts product slugs, resolves products without reordering them, and
  exposes globally encoded evidence references without raw source payloads.
- Compare now offers URL-backed profile controls and shows either the supported
  winner with exact evidence references or the reasons no winner is supportable.
- GREEN: recommendation context and GraphQL passed 4 tests. The comparison route
  and focused recommendation panel passed 112 tests; Relay compiled 35 reader,
  34 normalization, and 34 operation documents.
- Frontend TypeScript, client and SSR production builds, the client bundle
  contract, backend formatting, and warning-free compilation passed.

## Price Watchlists And Alerts Evidence

- Authenticated users can create product or offer watches for target landed
  price, percentage drop, back-in-stock, and newly available conditions. Offer
  scope must match product and currency; percentage rules capture an eligible
  baseline.
- Newly persisted price points enqueue unique Oban evaluation jobs in the same
  database transaction for both direct pricing and ingestion paths. Replayed
  observations and jobs cannot duplicate events.
- Evaluation locks each rule, uses only active in-stock fresh/aging offers with
  complete shipping-inclusive prices, records false/true state, and creates an
  event only on a new edge or a new qualifying observation after cooldown.
- Events retain the exact price-point reference and immutable safe fact
  snapshot. In-app delivery attempts are stored independently for future email
  or webhook adapters; read state, watch updates, and deletion are owner-scoped.
- Product detail contains one focused rule form. `/account/alerts` presents
  unread changes before active watch controls and supports read, pause, and
  delete actions without a dashboard-card layout.
- RED: five context tests failed because alert contexts and jobs did not exist;
  three GraphQL tests then failed because owner queries and mutations were
  absent.
- GREEN: the focused context and GraphQL run passed 8 tests. Pricing, ingestion,
  durable-job, pricing GraphQL, and alert regressions passed 165 tests. Product
  detail and alerts frontend suites passed 52 tests.
- Relay validation compiled 35 reader, 34 normalization, and 34 operation
  documents. Frontend TypeScript, client/SSR builds, and the client bundle
  contract passed.
- Final gates: `mix format --check-formatted`, `mix typecheck`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

## Authenticated Specification Correction Evidence

- Authenticated users can propose a typed replacement with a bounded reason and
  either a safe HTTP(S) source URL or explanation. The proposed user claim
  records the current claim it supersedes but cannot select itself.
- Owner queries expose only the submitting user's proposals. The moderation
  queue and decisions require an operator, and moderation notes resolve only
  for operators.
- Acceptance locks the proposal, claim, and current row; refuses stale-current
  proposals; supersedes prior truth; accepts the replacement; selects it; and
  records the decision in one transaction. Rejection leaves current truth
  unchanged, and terminal replay cannot reverse a decision.
- A partial unique constraint limits each user to one pending correction per
  product attribute. Public current attributes expose pending and accepted
  correction counts without user identity, explanations, or moderation data.
- RED: six context tests failed because proposal, moderation, owner/moderator
  reads, and aggregate contracts were absent; three GraphQL tests then failed
  because the public API was absent.
- GREEN: the focused context and GraphQL run passed 9 tests. The affected Specs,
  catalog, node, global-ID, and correction GraphQL run passed 127 tests.
- The live schema snapshot was regenerated. Relay validation compiled 30 reader,
  29 normalization, and 29 operation documents; frontend TypeScript passed.
- Final gates: `mix format --check-formatted`, `mix typecheck`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

## Specification-Rich Enrichment And Media Evidence

- The source-neutral listing contract now carries optional model, description,
  manufacturer category paths, media observations, and typed specification
  observations. The CJ adapter emits only fixture-backed category evidence and
  does not infer unsupported provider fields.
- Imports fill missing model and description values but never replace existing
  curated copy. Exact configured category aliases can replace the generic
  ingestion type; other paths create replay-safe review candidates without
  changing the current type.
- Product media accepts only HTTP(S) URLs, retains source-artifact provenance,
  uses deterministic positions, and upserts by product and URL. GraphQL exposes
  ordered safe media metadata while raw artifact payloads remain private.
- Typed specification observations validate against the attribute definition,
  persist fingerprinted proposed claims and evidence, and auto-accept only
  through an explicit provider-and-attribute allowlist with sufficient
  confidence and no current value. Bad optional enrichment increments an error
  outcome without discarding a valid offer.
- RED: the initial focused run failed compilation because media/specification
  observations and normalized listing fields did not exist.
- GREEN: the focused enrichment, parser, catalog, Specs, Taxonomy, and GraphQL
  run passed 47 tests. The expanded ingestion and affected catalog/spec/taxonomy
  run passed 175 tests with 0 failures.
- The live schema snapshot was regenerated. Relay validation compiled 30 reader,
  29 normalization, and 29 operation documents; frontend TypeScript passed.
- Final gates: `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate` (`4 ready rows`), and `git diff --check` passed.

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

# Backend Decomposition Completion Design

## Goal

Complete the three structural rows already present in the live queue and every
additional evidence-backed backend ownership split identified by the
2026-07-23 production-module audit. Deliver the work on one aggregate branch
and in one pull request, using domain milestones and focused commits without
changing product behavior or public contracts.

## Delivery Shape

This is one aggregate development program, not one atomic refactor.

- The three existing ready rows remain mandatory, independently evidenced
  outcomes.
- Additional decompositions are grouped by domain and stable acceptance
  boundary.
- Each focused owner is extracted in a milestone commit with its direct
  characterization gate green.
- Each domain group receives a combined verification pass before the next
  domain begins.
- The complete branch receives one final repository-wide verification and one
  anti-slop ownership review.
- Queue rows and lane evidence remain truthful even though the work is
  delivered through one branch and one pull request.

## Architectural Rule

Existing application-facing contexts, resolver modules, Mix-task entry points,
and predicates remain the stable caller boundaries. They retain every public
function, arity, default, guard, typespec, return value, error, and explicit
wrapper required by current callers.

Focused internal modules own concrete implementation responsibilities.
Production callers outside an implementation namespace must not bypass the
stable boundary. Internal collaboration is allowed only when two focused
owners genuinely share the current workflow; it must not create a generic
dispatch, callback, repository, adapter, or catch-all layer.

This program changes code organization only. It does not add or change schemas,
migrations, GraphQL SDL, Relay contracts, authorization, business policy,
frontend behavior, external providers, or deferred product scope.

## Fixed Scope Manifest

The manifest below is the completion boundary. A resulting file is not
recursively split merely because it remains large. A split is complete when
each named responsibility has one concrete owner and all application callers
continue through the stable facade.

### 1. Catalog Filter Metadata

Complete the existing ready row without changing
`ProductCompare.Catalog.FilterMetadata.metadata/1`.

- `FilterMetadata.Query` owns filtered-product query construction and result
  counts.
- `FilterMetadata.TaxonomyFacets` owns primary-type and use-case projections.
- `FilterMetadata.SelectedFilters` owns numeric, boolean, and enum selection
  normalization.
- `FilterMetadata.AttributeFacets` owns attribute aggregation and
  presentation.
- `FilterMetadata` remains the stable response-assembly facade.

This milestone follows the already committed catalog filter-metadata plan and
lane contract.

### 2. Community Submissions And Reads

Complete the existing Community Submissions ready row, then finish the
remaining read-side ownership split.

Submissions:

- `Submissions.WriteLimits` owns transactional UTC-hour counters.
- `Submissions.Creates` owns review, question, and answer creation plus
  idempotent receipts.
- `Submissions.OwnerActions` owns owner update and retained-removal lifecycle.
- `Submissions.Reports` owns attributable duplicate-safe reports.
- `Submissions` remains the stable discussion-context-facing facade.

Reads:

- `Reads.Legacy` owns direct thread, post, and review list operations retained
  for the context API.
- `Reads.PublicContent` owns published review and Q&A queries, summaries, and
  entropy-ID lookups.
- `Reads.ViewerSubmissions` owns owner-scoped review, question, and answer
  projections.
- `Reads.Connections` owns bounded public connection-page queries and parent
  mapping.
- `Reads` remains the stable internal read facade used only by
  `ProductCompare.Discussions`.

All visibility, publication, owner privacy, pagination, query-budget,
idempotency, moderation-reset, report, limit, transaction, lock, and rollback
behavior remains unchanged.

### 3. Commerce Attribution

Complete the existing Commerce Destination URL ready row and decompose the
remaining commerce-attribution implementation owners.

Destination URL:

- `DestinationUrl.Parser` owns browser-compatible HTTP(S) parsing, authority
  validation, and hostname canonicalization.
- `DestinationUrl.AddressPolicy` owns hostname and public-address acceptance.
- `DestinationUrl.Punycode` owns bounded RFC 3492 encoding.
- `DestinationUrl.valid?/1` remains the sole public predicate.

Clicks:

- `Clicks.Links` owns commerce-link persistence and active-link validation.
- `Clicks.Destinations` owns trusted merchant-product and affiliate
  destination selection plus public click-ID projection.
- `Clicks.Sessions` owns click-session and tracked-click persistence.
- `Clicks.Redirects` owns public redirect lookup.
- `Clicks` remains the stable commerce-context-facing facade.

Conversions:

- `Conversions.Persistence` owns conversion replay, stale-upsert, and conflict
  persistence.
- `Conversions.Attribution` owns click-session resolution, persisted
  attribution restoration, and cross-dimension conflict validation.
- `Conversions.PurchaseFacts` owns purchase-price fact creation.
- `Conversions` remains the stable commerce-context-facing facade.

Revenue:

- `Revenue.Filters` owns date, dimension, network, currency, and suppression
  option normalization.
- `Revenue.Aggregation` owns conversion/click joins, predicates, currency
  enforcement, and aggregate queries.
- `Revenue.Projection` owns suppression and JSON-ready summary values.
- `Revenue` remains the stable commerce-context-facing facade.

GraphQL:

- `Resolvers.CommerceAttribution.Reads` owns operator-authorized revenue
  summary input and result handling.
- `Resolvers.CommerceAttribution.Mutations` owns trusted-origin commerce-click
  mutation handling.
- `CommerceAttributionResolver` remains the schema-facing facade.

Destination acceptance, attribution dimensions, replay, conflicts, public
redirects, Impact click IDs, revenue calendar bounds, mixed-currency errors,
low-volume suppression, transactions, and GraphQL payloads remain unchanged.

### 4. Accounts And Authentication

Decompose authentication, API-token implementation, and their GraphQL
boundary while preserving `ProductCompare.Accounts` and
`ProductCompareWeb.Resolvers.AuthResolver`.

User authentication:

- `UserAuth.Credentials` owns password authentication and password
  verification.
- `UserAuth.Sessions` owns session-token issue, lookup, deletion, expiry,
  locking, and token cleanup.
- `UserAuth.EmailTokens` owns confirmation and reset tokens, delivery
  invocation, consumption, expiry, and delivery-failure classification.
- `UserAuth` remains the stable Accounts-internal facade.

API tokens:

- `ApiTokens.Authentication` owns secret decoding, hashing, active-token
  verification, and optional last-used updates.
- `ApiTokens.Queries` owns owner-scoped reads and status-filtered query
  construction.
- `ApiTokens.Lifecycle` owns issue, rotation, revocation, expiry defaults,
  transactions, and locks.
- `ApiTokens.Secrets` owns secure token generation, hashing, and prefix
  projection shared by authentication and lifecycle.
- `ApiTokens` remains the stable Accounts-internal facade.

GraphQL:

- `Resolvers.Auth.AccountActions` owns viewer, registration, browser login,
  logout, confirmation, and password-reset actions.
- `Resolvers.Auth.ApiTokens` owns API-token reads and create, revoke, and
  rotate actions.
- `AuthResolver` remains the schema-facing facade.

Cookie-backed Phoenix sessions, trusted-origin checks, constant-time password
behavior, token cryptography, expiration, owner scope, rotation/revocation,
configured delivery hooks, and GraphQL payloads remain unchanged.

### 5. Specifications

Decompose the remaining Specs read, claim, and GraphQL implementation owners
while preserving `ProductCompare.Specs` and
`ProductCompareWeb.Resolvers.SpecsResolver`.

Reads:

- `Reads.Artifacts` owns source-artifact reads.
- `Reads.CurrentAttributes` owns current-attribute projection, batching,
  accepted-current selection, taxonomy metadata, and ordering.
- `Reads.ReferenceData` owns filterable attribute, enum-option, and unit-symbol
  reads.
- `Reads` remains the stable Specs-internal facade.

Claims:

- `Claims.Proposals` owns user claim proposals and evidence creation.
- `Claims.Imports` owns observation validation, canonical fingerprints,
  replay-safe persistence, evidence, and auto-acceptance.
- `Claims.Moderation` owns accept/reject transitions and locked current-claim
  selection.
- `Claims` remains the stable Specs-internal facade.

GraphQL:

- `Resolvers.Specs.Reads` owns source-artifact and correction list/queue reads.
- `Resolvers.Specs.Corrections` owns proposal, moderation, typed input,
  correction projection, and payload errors.
- `SpecsResolver` remains the schema-facing facade.

Typed values, units, enum ownership, fingerprints, evidence excerpts, replay,
auto-acceptance, status transitions, stale-current protection, locks,
transactions, invalid-ID handling, query budgets, and GraphQL payloads remain
unchanged.

### 6. Remaining Resolver Boundaries

Complete the resolvers whose current files still combine independently
describable read and mutation responsibilities.

Affiliate:

- `Resolvers.Affiliate.Reads` owns active-coupon reads and connection input.
- `Resolvers.Affiliate.Mutations` owns operator-authorized network, program,
  link, and coupon mutations.
- `AffiliateResolver` remains the schema-facing facade.

Pricing:

- `Resolvers.Pricing.Merchants` owns merchant collection, detail, summary, and
  merchant-offer resolution.
- `Resolvers.Pricing.Offers` owns product offer collections, latest price,
  offer truth, and price history.
- `Resolvers.Pricing.Evidence` owns source-artifact resolution.
- `PricingResolver` remains the schema-facing facade.

Alerts:

- `Resolvers.Alerts.Reads` owns owner-scoped watch and inbox connections.
- `Resolvers.Alerts.WatchMutations` owns create, update, and delete actions.
- `Resolvers.Alerts.EventMutations` owns inbox-event state changes.
- `AlertsResolver` remains the schema-facing facade.

Operator authorization, owner scope, Global ID decoding, Dataloader behavior,
pagination, query budgets, mutation payloads, and errors remain unchanged.

## Explicit Stop Boundary

The following files and categories are intentionally excluded. Their size does
not by itself demonstrate mixed ownership.

- `ProductCompareWeb.Schema` and domain schema-type files: declarative Absinthe
  roots and notation grouped by schema domain.
- Characterization and integration test files: behavior evidence, not
  production ownership.
- `ProductCompare.Catalog.Filtering`: one filter-query composition pipeline.
- `ProductCompare.Ingestion.Sources.CJ.Client`: one external CJ GraphQL client
  boundary with shared request/response policy.
- GraphQL loader source registries: one request-scoped batching registry.
- `ProductCompare.Alerts.Evaluation`: one watch-evaluation pipeline.
- Focused SEO qualification/metadata and recommendation algorithms.
- Existing stable context facades whose remaining lines are public wrappers,
  typespecs, and documentation.
- Focused modules below this manifest unless implementation reveals a direct
  circular dependency or an unavoidable second responsibility needed to
  complete a named split.

Any such implementation discovery must be recorded as a blocker or a design
amendment. It must not silently expand the program.

## Data Flow And Dependency Direction

The dependency direction remains:

```text
GraphQL schema/controllers/jobs
  -> stable resolver or application context
    -> stable implementation facade
      -> focused internal owner
        -> Repo, schemas, or existing focused policy
```

Focused owners may return the exact existing structs, changesets, tuples,
queries, and maps. Facades assemble or forward them without inventing new
cross-domain DTOs. No caller switches to a newly extracted internal owner.

## Errors, Transactions, And Security Boundaries

- Preserve every current changeset action, error atom, error string, exception,
  rollback value, and GraphQL payload field.
- Preserve transaction and lock placement. Moving code must not shorten a lock
  window, split one atomic operation, or move a repository read outside its
  existing transaction.
- Preserve idempotency digests, conflict targets, replay behavior, and
  committed-only counters.
- Preserve authorization and trusted-origin checks before repository work.
- Preserve destination URL fail-closed behavior and all reserved-address
  exclusions.
- Do not add rescue-all fallbacks, permissive catch-alls, unreachable guards,
  or compatibility shims for inputs that cannot reach the boundary.

## Verification Strategy

### Slice Gate

Before and after each focused extraction:

1. Run the directly affected characterization suite.
2. Introduce explicit facade delegation and observe the expected missing-owner
   compilation failure when the slice plan calls for a red step.
3. Move behavior without changing tests that assert public behavior.
4. Re-run the focused suite.
5. Run formatting and diff hygiene.
6. Commit the code, behavioral tests if needed, and directly related lane
   evidence as one milestone.

Tests must remain behavior-oriented. Source-string assertions, exact private
module-name assertions, and tests that fail solely because a file moved are
not acceptable.

### Domain Gates

- Catalog:
  `mix test test/product_compare/catalog/filter_metadata_test.exs`
- Community:
  `mix test test/product_compare/discussions
  test/product_compare_web/graphql/community_content_test.exs
  test/product_compare_web/graphql/dataloader_batching_test.exs`
- Commerce attribution:
  `mix test test/product_compare/commerce_attribution
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  test/product_compare_web/graphql/commerce_click_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Accounts/auth:
  `mix test test/product_compare/accounts
  test/product_compare_web/graphql/session_auth_test.exs
  test/product_compare_web/graphql/api_token_auth_test.exs`
- Specifications:
  `mix test test/product_compare/specs
  test/product_compare_web/graphql/specification_corrections_test.exs`
- Remaining resolvers:
  `mix test test/product_compare/affiliate
  test/product_compare/pricing
  test/product_compare/alerts
  test/product_compare_web/graphql/affiliate_workflows_test.exs
  test/product_compare_web/graphql/pricing_queries_test.exs
  test/product_compare_web/graphql/merchant_detail_test.exs
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs`

Every domain gate also requires `mix typecheck`,
`mix format --check-formatted`, and `git diff --check`.

### Final Gate

Completion requires:

- Every domain characterization gate.
- Repository-wide scans proving no production caller bypasses a stable facade.
- A public-function and arity comparison for every retained facade.
- An ownership inventory showing each manifest responsibility has one owner.
- `mix work_queue.validate`.
- `mix ci`.
- `git diff --check`.
- A clean working tree after the final completion commit.
- A final anti-slop review of every new module, public API, guard, fallback,
  delegation layer, shared helper, and behavior test.

## Queue And Documentation

- The three current ready rows remain explicit and must be completed:
  Catalog Filter Metadata Decomposition, Community Submissions Decomposition,
  and Commerce Destination URL Decomposition.
- Additional domain rows are promoted only with complete owned paths,
  prerequisites, verification, internal slices, and exit conditions.
- The one-branch delivery does not collapse unrelated rows into one reviewer
  outcome inside the dispatcher.
- `docs/work/index.md`, `docs/plans/INDEX.md`, the affected lane docs, and the
  implementation plan stay aligned at each stable dispatch boundary.
- Before the final structural rows close, the coordinator validates enough
  source-backed successor work to preserve the live ready-row floor without
  inventing decomposition filler.

## Completion Definition

The program is complete when:

1. All three pre-existing ready decompositions are complete.
2. Every additional responsibility in the fixed scope manifest has one focused
   owner behind its unchanged stable boundary.
3. No production caller bypasses a retained facade.
4. All focused, domain, and repository gates pass.
5. The final anti-slop review finds no speculative module, unnecessary public
   API, one-caller generic helper, unreachable fallback, or
   implementation-coupled test.
6. Queue and lane evidence accurately record completion while preserving the
   ready-work floor.
7. The aggregate work is ready for one pull request.

# Database Domain Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every first-party enum-like string from relational columns and application-owned JSON by using native PostgreSQL enums, foreign keys, or removing redundant discriminators.

**Architecture:** Code-owned finite state machines use context-specific PostgreSQL enum types while Ecto continues to expose atoms through `Ecto.Enum`. Business, standards, and provider domains use numeric foreign keys to controlled reference rows. Redundant discriminators are removed, and immutable comparison and alert facts move from JSON maps into normalized typed tables and columns.

**Tech Stack:** PostgreSQL custom enum types and foreign keys, Ecto 3.13 migrations and schemas, ExUnit integration tests, Absinthe GraphQL.

## Global Constraints

- Enum-like values must never be stored in first-party `varchar` or `text` columns.
- `Ecto.Enum` is not sufficient unless the physical PostgreSQL column is a native enum.
- Business or standards-backed domains use foreign keys when their values carry metadata or provider identity.
- PostgreSQL enum types are context-specific; do not introduce a global catch-all `status` type.
- Shared PostgreSQL enum types are used only when the fields have identical semantics, specifically price-watch rule types and community moderation statuses.
- The project is unreleased; rewrite the migration history directly and do not add compatibility columns, dual writes, or cursor/data translation layers.
- Provider-owned `raw_json`, `raw_metadata`, and `raw_payload` remain verbatim source evidence, but application filtering and business logic may use only normalized typed columns.
- Application-owned JSON may not store categorical domain state.
- Preserve transaction, locking, uniqueness, ownership, Relay, GraphQL authorization, and immutable-history behavior.
- Use test-first red-green cycles and commit each task as a milestone.

---

### Task 1: Native PostgreSQL Enum Storage

**Files:**
- Modify: `priv/repo/migrations/20260303222607_init_extensions.exs`
- Create: `test/product_compare/repo/domain_enum_storage_test.exs`
- Modify: `priv/repo/migrations/20260303222608_create_accounts_taxonomy_catalog.exs`
- Modify: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`
- Modify: `priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs`
- Modify: `priv/repo/migrations/20260305130000_add_user_auth_fields_and_session_tokens.exs`
- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Modify: `priv/repo/migrations/20260604191000_create_ingestion_runs.exs`
- Modify: `priv/repo/migrations/20260713120000_create_product_identifiers.exs`
- Modify: `priv/repo/migrations/20260713140000_add_ingestion_reconciliation.exs`
- Modify: `priv/repo/migrations/20260713140100_allow_superseded_ingestion_reconciliation.exs`
- Modify: `priv/repo/migrations/20260713150000_add_product_enrichment.exs`
- Modify: `priv/repo/migrations/20260713160000_add_specification_corrections.exs`
- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: `priv/repo/migrations/20260713190000_add_community_moderation.exs`
- Modify: `priv/repo/migrations/20260720120000_add_community_write_controls.exs`
- Modify: `priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs`
- Modify: `lib/product_compare_schemas/accounts/user_session_token.ex`
- Modify: `lib/product_compare_schemas/catalog/product_identifier.ex`
- Modify: `lib/product_compare_schemas/catalog/product_media.ex`
- Modify: `lib/product_compare_schemas/ingestion/category_mapping_candidate.ex`
- Modify: `lib/product_compare_schemas/ingestion/import_run.ex`
- Modify: `lib/product_compare_schemas/ingestion/cj_program.ex`
- Modify: focused tests that currently assert string values for those six schemas.

**Interfaces:**
- Consumes: the approved enum inventory and the existing Ecto atom values.
- Produces: 25 native PostgreSQL enum types backing 28 live columns, with all affected Ecto schemas loading atoms.

- [x] **Step 1: Write the failing physical-storage test**

Create `test/product_compare/repo/domain_enum_storage_test.exs` with a literal inventory of these `{table, column, udt_name}` tuples:

```elixir
@enum_columns [
  {"users_tokens", "context", "user_token_context"},
  {"product_taxons", "source_type", "product_taxon_source_type"},
  {"attributes", "data_type", "attribute_data_type"},
  {"product_attribute_claims", "source_type", "product_attribute_claim_source_type"},
  {"product_attribute_claims", "status", "product_attribute_claim_status"},
  {"coupons", "discount_type", "coupon_discount_type"},
  {"commerce_links", "link_type", "commerce_link_type"},
  {"commerce_click_sessions", "source_surface", "commerce_source_surface"},
  {"commerce_conversions", "status", "commerce_conversion_status"},
  {"commerce_conversions", "attribution_confidence", "commerce_attribution_confidence"},
  {"ingestion_runs", "status", "ingestion_run_status"},
  {"ingestion_runs", "reconciliation_status", "ingestion_reconciliation_status"},
  {"product_identifiers", "scheme", "product_identifier_scheme"},
  {"product_identifiers", "verification_status", "product_identifier_verification_status"},
  {"product_media", "role", "product_media_role"},
  {"category_mapping_candidates", "status", "category_mapping_status"},
  {"specification_corrections", "status", "specification_correction_status"},
  {"price_watch_rules", "rule_type", "price_watch_rule_type"},
  {"alert_events", "rule_type", "price_watch_rule_type"},
  {"alert_delivery_attempts", "transport", "alert_delivery_transport"},
  {"alert_delivery_attempts", "state", "alert_delivery_state"},
  {"product_reviews", "moderation_status", "community_moderation_status"},
  {"product_threads", "moderation_status", "community_moderation_status"},
  {"thread_posts", "moderation_status", "community_moderation_status"},
  {"community_reports", "status", "community_report_status"},
  {"community_write_receipts", "content_type", "community_content_type"},
  {"community_write_windows", "action_kind", "community_action_kind"},
  {"cj_programs", "stage", "cj_program_stage"}
]
```

Query `information_schema.columns` for each tuple and assert `data_type == "USER-DEFINED"` and `udt_name` equals the literal expected name.

- [x] **Step 2: Run the storage test and verify RED**

Run:

```bash
mix test test/product_compare/repo/domain_enum_storage_test.exs
```

Expected: failures report the current `varchar` or `text` physical types.

- [x] **Step 3: Create the native enum types**

Extend the existing earliest migration with reversible `CREATE TYPE ... AS ENUM` and `DROP TYPE ...` statements for these exact value sets:

```elixir
@types [
  user_token_context: ~w(session confirm reset_password),
  product_taxon_source_type: ~w(scrape user derived editorial),
  attribute_data_type: ~w(bool int numeric text enum date timestamp json),
  product_attribute_claim_source_type: ~w(scrape user import derived),
  product_attribute_claim_status: ~w(proposed accepted rejected superseded),
  coupon_discount_type: ~w(percent amount free_shipping other),
  commerce_link_type: ~w(affiliate non_affiliate),
  commerce_source_surface: ~w(web api extension),
  commerce_conversion_status: ~w(pending approved reversed paid),
  commerce_attribution_confidence: ~w(high low unmatched),
  ingestion_run_status: ~w(running succeeded failed),
  ingestion_reconciliation_status:
    ~w(not_requested pending succeeded skipped_partial skipped_failed skipped_superseded),
  product_identifier_scheme: ~w(gtin mpn),
  product_identifier_verification_status: ~w(unverified validated rejected),
  product_media_role: ~w(primary gallery),
  category_mapping_status: ~w(pending mapped dismissed),
  specification_correction_status: ~w(pending accepted rejected),
  price_watch_rule_type: ~w(target_price percentage_drop back_in_stock newly_available),
  alert_delivery_transport: ~w(in_app email webhook),
  alert_delivery_state: ~w(pending delivered failed),
  community_moderation_status: ~w(pending published hidden rejected removed),
  community_report_status: ~w(pending resolved dismissed),
  community_content_type: ~w(review question answer),
  community_action_kind: ~w(review question answer report),
  cj_program_stage: ~w(new considering selected applied accepted not_pursuing declined)
]
```

Escape each literal with `Ecto.Adapters.SQL.query!/3` parameters or a migration-private literal builder whose only input is the compile-time list above. Drop types in reverse order in `down/0`.

- [x] **Step 4: Change every owned migration column to its enum type**

Replace `:string` and `:text` declarations for the 28 inventory columns with the matching enum type atom. Remove only the redundant `IN (...)` check constraints for those columns; preserve conditional business constraints such as coupon value shape and price-watch target shape.

- [x] **Step 5: Convert the six raw Ecto string schemas to `Ecto.Enum`**

Use the exact atoms from the database type in:

```elixir
field :context, Ecto.Enum, values: [:session, :confirm, :reset_password]
field :scheme, Ecto.Enum, values: [:gtin, :mpn]
field :verification_status, Ecto.Enum, values: [:unverified, :validated, :rejected]
field :role, Ecto.Enum, values: [:primary, :gallery]
field :status, Ecto.Enum, values: [:pending, :mapped, :dismissed]
field :status, Ecto.Enum, values: [:running, :succeeded, :failed]
field :reconciliation_status, Ecto.Enum,
  values: [:not_requested, :pending, :succeeded, :skipped_partial, :skipped_failed, :skipped_superseded]
field :stage, Ecto.Enum,
  values: [:new, :considering, :selected, :applied, :accepted, :not_pursuing, :declined]
```

Update internal queries and tests to use atoms at the Ecto boundary. Provider payload parsing may still accept strings and cast them through changesets.

- [x] **Step 6: Rebuild the test database and verify GREEN**

Run:

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare/repo/domain_enum_storage_test.exs
mix test test/product_compare/accounts test/product_compare/specs test/product_compare/catalog test/product_compare/affiliate test/product_compare/commerce_attribution test/product_compare/ingestion test/product_compare/alerts test/product_compare/discussions
```

Expected: all native-type assertions and focused context suites pass.

- [x] **Step 7: Run milestone verification and commit**

Run:

```bash
mix format
mix format --check-formatted
mix typecheck
mix test
mix work_queue.validate
git diff --check
```

Commit:

```bash
git add priv/repo/migrations lib/product_compare_schemas lib/product_compare test docs
git commit -m "refactor: store closed domains as postgres enums"
```

### Task 2: Commerce Reference Domains

**Files:**
- Create: `lib/product_compare_schemas/reference/currency.ex`
- Create: `lib/product_compare_schemas/affiliate/affiliate_program_status.ex`
- Modify: `priv/repo/migrations/20260303222607_init_extensions.exs`
- Modify: `priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs`
- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Modify: `priv/repo/migrations/20260604210000_create_merchant_feed_candidates.exs`
- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: pricing, affiliate, commerce-attribution, ingestion, and alert schemas and contexts that read or write currencies, program statuses, or networks.
- Test: `test/product_compare/repo/domain_reference_storage_test.exs`
- Test: existing pricing, affiliate, commerce-attribution, alert, ingestion, and GraphQL suites.

**Interfaces:**
- Consumes: Task 1 enum-backed schemas.
- Produces: numeric `currency_id`, `affiliate_program_status_id`, and `affiliate_network_id` foreign keys with no duplicated currency, program-status, or network strings.

- [x] **Step 1: Write failing FK-storage tests**

Assert that the seven approved currency owners expose `currency_id` foreign keys to `currencies`, `affiliate_programs.affiliate_program_status_id` references `affiliate_program_statuses`, and `commerce_conversions.affiliate_network_id` references `affiliate_networks`. Assert the removed `commerce_links.network` column is absent.

- [x] **Step 2: Run the FK test and verify RED**

Run `mix test test/product_compare/repo/domain_reference_storage_test.exs`.

- [x] **Step 3: Create controlled reference tables**

Create `currencies(id, code, numeric_code, minor_unit, name)` with a unique uppercase `code`, and `affiliate_program_statuses(id, code, name, enabled)` with a unique lowercase `code`. Seed only ISO currencies exercised by fixtures and the observed program states `active` and `paused`; add a deterministic seed/upsert path for additional ISO rows.

- [x] **Step 4: Replace operational strings with foreign keys**

Replace the seven currency columns with `currency_id`, replace affiliate-program status with `affiliate_program_status_id`, remove `commerce_links.network`, require `affiliate_program_id` when `link_type == :affiliate`, and replace conversion `source_network` with `affiliate_network_id`. Add a stable unique `code` to `affiliate_networks`.

- [x] **Step 5: Update Ecto and GraphQL boundaries**

Load reference associations in schemas and contexts. Preserve public ISO currency codes, affiliate status codes, and network codes as derived GraphQL values rather than exposing internal numeric IDs.

- [x] **Step 6: Verify and commit**

Run the storage test, focused context and GraphQL suites, `mix typecheck`, `mix format --check-formatted`, `mix test`, `mix work_queue.validate`, and `git diff --check`.

Commit with `git commit -m "refactor: normalize commerce reference domains"`.

### Task 3: Source and Provider Reference Domains

**Files:**
- Create: `lib/product_compare_schemas/specs/source_kind.ex`
- Create: `lib/product_compare_schemas/ingestion/integration_provider.ex`
- Create: `lib/product_compare_schemas/ingestion/integration_surface.ex`
- Create: `lib/product_compare_schemas/ingestion/provider_feed_type.ex`
- Create: `lib/product_compare_schemas/reference/country.ex`
- Create: `lib/product_compare_schemas/reference/language.ex`
- Modify: `priv/repo/migrations/20260303222607_init_extensions.exs`
- Modify: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`
- Modify: `priv/repo/migrations/20260604191000_create_ingestion_runs.exs`
- Modify: `priv/repo/migrations/20260604210000_create_merchant_feed_candidates.exs`
- Modify: source, ingestion-run, feed-candidate, CJ client/parser, reporting, task, and GraphQL files.
- Test: `test/product_compare/repo/ingestion_reference_storage_test.exs`
- Test: existing source, ingestion, Mix-task, and GraphQL suites.

**Interfaces:**
- Consumes: Task 1 ingestion enums and Task 2 `currencies`.
- Produces: controlled source-kind, provider, surface, feed-type, country, language, and currency references; provider strings are derived through `source_id`.

- [ ] **Step 1: Write failing storage tests**

Assert `sources.source_kind_id`, `sources.provider_id`, `ingestion_runs.integration_surface_id`, and feed-candidate country/language/feed-type/currency foreign keys. Assert both duplicated `provider` columns and the five external categorical text columns are absent.

- [ ] **Step 2: Run the storage test and verify RED**

Run `mix test test/product_compare/repo/ingestion_reference_storage_test.exs`.

- [ ] **Step 3: Create reference tables**

Create unique controlled codes for source kinds, integration providers, provider-scoped surfaces, provider-scoped feed types, ISO countries, and normalized languages. Preserve all observed source-kind codes during migration without conflating them.

- [ ] **Step 4: Replace source and ingestion strings**

Make `sources` own kind and provider identity, remove duplicated run/candidate provider columns, point runs at a provider-scoped surface, and replace candidate market fields with foreign keys. Preserve unrecognized provider values only inside `raw_metadata`; normalized columns remain null until a controlled reference exists.

- [ ] **Step 5: Update readers and writers**

Resolve CJ through its provider reference, use surface references for resume/reconciliation/readiness queries, and use joined codes in CLI/GraphQL output. No application query may filter on the raw JSON fallback.

- [ ] **Step 6: Verify and commit**

Run the storage test, all ingestion and Mix-task suites, affected GraphQL suites, `mix typecheck`, `mix format --check-formatted`, `mix test`, `mix work_queue.validate`, and `git diff --check`.

Commit with `git commit -m "refactor: normalize ingestion reference domains"`.

### Task 4: Remove Redundant and Unsafe Discriminators

**Files:**
- Create: `lib/product_compare_schemas/accounts/reputation_event_type.ex`
- Modify: `priv/repo/migrations/20260303222608_create_accounts_taxonomy_catalog.exs`
- Modify: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`
- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: `priv/repo/migrations/20260713190000_add_community_moderation.exs`
- Modify: `priv/repo/migrations/20260720120000_add_community_write_controls.exs`
- Modify: `priv/repo/migrations/20260604230000_add_review_status_to_merchant_feed_candidates.exs`
- Modify: `priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs`
- Modify: affected account, specification, alert, and discussion schemas and contexts.
- Test: `test/product_compare/repo/categorical_discriminator_storage_test.exs`
- Test: existing account, alert, discussion, and migration suites.

**Interfaces:**
- Consumes: Task 1 community enums.
- Produces: controlled reputation event types and no generic table-name, formula-language, unused failure-category, single-value thread-kind, duplicate receipt-kind, or transient feed-review strings.

- [ ] **Step 1: Write the failing absence/reference test**

Assert `reputation_events.reputation_event_type_id` references `reputation_event_types`, and assert absence of `ref_table`, `ref_id`, `derived_formulas.lang`, `alert_delivery_attempts.failure_category`, `product_threads.kind`, and `community_write_receipts.mutation_kind`.

- [ ] **Step 2: Run the test and verify RED**

Run `mix test test/product_compare/repo/categorical_discriminator_storage_test.exs`.

- [ ] **Step 3: Normalize reputation events**

Create `reputation_event_types(id, code, name, default_delta)` and replace `reason` with `reputation_event_type_id`. Remove the generic reference pair; add explicit subject foreign keys only alongside a concrete event producer and exactly-one-target constraint.

- [ ] **Step 4: Remove unused and duplicate columns**

Remove formula language, alert failure category, single-value question kind, and duplicate receipt mutation kind. Key community idempotency by `{user_id, content_type, idempotency_key}`. Rewrite the feed-review/CJ migrations so the transient string review status is never created.

- [ ] **Step 5: Verify and commit**

Run the storage test, affected context and GraphQL suites, migration tests, `mix typecheck`, `mix format --check-formatted`, `mix test`, `mix work_queue.validate`, and `git diff --check`.

Commit with `git commit -m "refactor: remove categorical discriminator strings"`.

### Task 5: Normalize Application-Owned Snapshot JSON

**Files:**
- Create: focused comparison snapshot product, attribute, evidence, offer, recommendation, and ranking schemas under `lib/product_compare_schemas/catalog/comparison_snapshot/`.
- Create: `lib/product_compare_schemas/catalog/recommendation_algorithm.ex`
- Modify: `priv/repo/migrations/20260713180000_create_comparison_snapshots.exs`
- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: `lib/product_compare/comparison_snapshots/capture.ex`
- Modify: `lib/product_compare/comparison_snapshots/lifecycle.ex`
- Delete: `lib/product_compare/comparison_snapshots/payload_codec.ex`
- Modify: comparison snapshot and alert event schemas, resolvers, SEO readers, and GraphQL types.
- Test: existing comparison snapshot, alert, SEO, and GraphQL suites.
- Test: `test/product_compare/repo/application_json_domain_storage_test.exs`

**Interfaces:**
- Consumes: native profile/status/source/freshness enums and normalized currency/source-kind/recommendation-algorithm references.
- Produces: immutable normalized snapshot records and typed alert facts with no application-owned categorical JSON state.

- [ ] **Step 1: Write failing normalized-storage tests**

Assert `comparison_snapshots.payload` and `alert_events.fact_snapshot` are absent. Assert snapshot child tables preserve ordered products, attributes, evidence, offers, recommendations, and rankings, and assert alert events expose typed baseline, target, and percentage fields.

- [ ] **Step 2: Run the storage and behavior tests and verify RED**

Run the new storage test plus `test/product_compare/comparison_snapshots_test.exs` and `test/product_compare/alerts/alerts_test.exs`.

- [ ] **Step 3: Normalize comparison snapshots**

Create immutable child rows for copied product facts, attributes, evidence, offers, one recommendation, and ordered rankings. Store recommendation profile/status and offer freshness as PostgreSQL enums; store source kind, currency, and recommendation algorithm as foreign keys. Keep copied names, descriptions, prices, timestamps, excerpts, reasons, and missing-input prose in typed scalar columns.

- [ ] **Step 4: Normalize alert event facts**

Drop `fact_snapshot`; retain the existing typed event columns and add nullable decimal `baseline_landed_price`, `target_amount`, and `percentage_drop` snapshot columns.

- [ ] **Step 5: Replace hydration with associations**

Load immutable child rows in bounded preloads, preserve the current public GraphQL shape, ordering, owner privacy, revocation behavior, and SELECT budgets, and delete `PayloadCodec`.

- [ ] **Step 6: Verify and commit**

Run storage, snapshot, alert, SEO, GraphQL, query-budget, `mix typecheck`, `mix format --check-formatted`, `mix test`, `mix work_queue.validate`, and `git diff --check`.

Commit with `git commit -m "refactor: normalize immutable application snapshots"`.

## Final Program Verification

- [ ] Run `MIX_ENV=test mix ecto.reset`.
- [ ] Run `mix test test/product_compare/repo`.
- [ ] Run `mix ci`.
- [ ] Run a schema audit that reports no first-party categorical `varchar` or `text` columns and no application-owned categorical JSON paths.
- [ ] Run `git diff --check`.
- [ ] Record exact verification evidence in `docs/work/database-domain-types.md`.

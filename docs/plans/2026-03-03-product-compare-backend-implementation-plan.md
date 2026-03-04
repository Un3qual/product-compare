# ProductCompare Backend MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bootstrap a Phoenix modular monolith for product comparison with typed specs, taxonomy, claims moderation, filtering, pricing history, and discussions.

**Architecture:** One Phoenix app with bounded contexts (`Accounts`, `Taxonomy`, `Catalog`, `Specs`, `Pricing`, `Affiliate`, `Discussions`) over Postgres 18. Keep append-only claims + canonical current-pointer fast path for filters. Enforce core invariants in DB constraints and transactional context functions.

**Tech Stack:** Phoenix, Ecto/Postgrex, Absinthe-ready context boundaries, Nix dev shell, Docker Compose Postgres 18.

---

## Global Assumptions

- `starting_schema.dbml` is a guide, not strict; names and structure may be adjusted for clarity and performance.
- Postgres 18 is available and used for `uuidv7()` + `entropy_id` additive IDs.
- Use `:utc_datetime_usec` in generators, migrations, and schemas.
- Public context functions include `@spec`; schema modules stay schema-only.
- Initial scope is backend domain logic + seeds + tests, not scraping pipelines/UI.

---

## Top-Level Checklist (A-F)

### A) Repo Integration / Architecture

- [ ] Initialize Nix environment and Phoenix project scaffolding.
- [ ] Add Docker Compose for Postgres 18 and wire app config.
- [ ] Establish context boundaries and module namespaces.
- [ ] Add baseline aliases/check commands (`mix precommit`, `mix typecheck`).

### B) Database Layer (Migrations + Schemas)

- [ ] Implement ordered migrations by dependency layer.
- [ ] Add all core constraints, FK rules, unique/partial indexes.
- [ ] Implement Ecto schemas and `Ecto.Enum` fields.
- [ ] Add changeset validations for typed value invariants.

### C) Core Workflows (MVP)

- [ ] Taxonomy tree + closure maintenance + use-case tagging.
- [ ] Unit/dimension conversion helper and validation path.
- [ ] Claims lifecycle + canonical current selection (atomic swap).
- [ ] Filtering query builder over current claims.
- [ ] Pricing upsert/history workflows.
- [ ] Discussions/reviews CRUD workflows.

### D) Seeds + Minimal Examples

- [ ] Seed taxonomies, sample trees, attributes, enum options, units.
- [ ] Seed sample products, claims/current values, merchant listing/prices.
- [ ] Ensure seed idempotency and deterministic inserts.

### E) Tests

- [ ] Unit conversion correctness tests.
- [ ] Taxon closure ancestor/descendant tests.
- [ ] `product_attribute_current` uniqueness + atomic swap tests.

### F) Deliverable Plan Doc

- [ ] Publish short execution checklist with migration order and boundaries.
- [ ] Document intentional deferrals and expansion points.

---

## Detailed Plan By Top-Level Task

## A) Repo Integration / Architecture (Detailed)

### Assumptions

- Phoenix app will be API-first (`--no-html --no-assets`) with room for Absinthe transport.
- Nix flake/devShell owns Erlang/Elixir/toolchain versions.

### Ordered Steps

1. Create `flake.nix` and `flake.lock` with latest stable Elixir/Erlang/Phoenix-compatible tooling available in pinned nixpkgs.
2. Add `.envrc`/dev-shell usage notes in project README.
3. Generate Phoenix app (`mix phx.new`) in current repository.
4. Set generator defaults to `timestamp_type: :utc_datetime_usec`.
5. Configure Repo defaults and naming conventions for bigint PK + additive `entropy_id` (`uuidv7`) in shared schema macro.
6. Add `docker-compose.yml` with `postgres:18`, healthcheck, named volume, mapped port.
7. Add app `dev.exs`/`runtime.exs` DB config to use compose defaults (`DATABASE_URL` fallback).
8. Add top-level context modules and boundary docs (empty public APIs acceptable initially).
9. Add baseline aliases: `mix precommit`, `mix typecheck`, `mix ci`.

### File/Module Map

- Create: `flake.nix`, `docker-compose.yml`, `.env.example`, `README.md` sections.
- Modify: `config/config.exs`, `config/dev.exs`, `mix.exs`.
- Create boundaries:
  - `lib/product_compare/accounts.ex`
  - `lib/product_compare/taxonomy.ex`
  - `lib/product_compare/catalog.ex`
  - `lib/product_compare/specs.ex`
  - `lib/product_compare/pricing.ex`
  - `lib/product_compare/affiliate.ex`
  - `lib/product_compare/discussions.ex`
  - `lib/product_compare_schemas/schema.ex`

### Verification

- `nix develop -c elixir --version` shows expected stable Elixir.
- `nix develop -c mix phx.new --version` works.
- `docker compose up -d db` reports healthy Postgres 18 container.
- `mix ecto.create` succeeds against compose database.

### Risks / Deferred

- Exact “latest stable” versions depend on nixpkgs pin; freeze in lockfile.
- Full GraphQL relay scaffolding deferred; keep contexts transport-agnostic now.

---

## B) Database Layer (Migrations + Schemas) (Detailed)

### Assumptions

- DB schema follows dependency-first ordering; denormalization limited to filter path indexes.
- `Ecto.Enum` is used in schemas for domain enums, backed by DB check constraints or Postgres enum types.

### Migration Ordering Plan

1. **Foundation**: enable `citext`; create helper extension/functions needed by app.
2. **Accounts**: `users`, `user_reputation`, `reputation_events`.
3. **Taxonomy**: `taxonomies`, `taxons`, `taxon_closure`, `taxon_aliases`, `product_taxons` (after `products` if FK strict; otherwise split migration).
4. **Catalog**: `brands`, `products`.
5. **Units/Enums/Attributes**: `dimensions`, `units`, `enum_sets`, `enum_options`, `attributes`, `taxon_attributes`.
6. **Sources & External IDs**: `sources`, `source_artifacts`, `external_products`.
7. **Claims Core**: `product_attribute_claims`, `claim_evidence`, `product_attribute_current`.
8. **Derived**: `derived_formulas`, `derived_formula_deps`, `claim_dependencies`.
9. **Pricing**: `merchants`, `merchant_products`, `price_points`.
10. **Affiliate**: `affiliate_networks`, `affiliate_programs`, `affiliate_links`, `coupons`.
11. **Discussions**: `product_threads`, `thread_posts`, `product_reviews`.
12. **Performance pass**: partial/covering indexes, check constraints, FK `on_delete` tuning.

### Schema Module Checklist

- Accounts schemas: user, reputation aggregate, reputation events.
- Taxonomy schemas: taxonomy, taxon, closure, alias, product taxon assignment.
- Catalog schemas: brand, product.
- Specs schemas: dimension, unit, enum set/option, attribute, taxon attribute, claim, claim evidence, current pointer, formula, dependencies.
- Pricing schemas: merchant, merchant product, price point.
- Affiliate schemas: network, program, link, coupon.
- Discussions schemas: thread, post, review.

### Index Strategy Checklist

- Unique lookup indexes:
  - taxonomy code, taxon `(taxonomy_id, code)`, product slug, merchant `(merchant_id,url)`.
- Closure traversal indexes:
  - `(ancestor_id, descendant_id)` unique, plus ancestor/depth and descendant indexes.
- Filter-path indexes:
  - `product_attribute_current(product_id, attribute_id)` unique.
  - `product_attribute_claims(attribute_id, value_num_base)`.
  - `product_attribute_claims(attribute_id, enum_option_id)`.
  - `product_attribute_claims(attribute_id, value_bool)`.
- Price history index:
  - `price_points(merchant_product_id, observed_at DESC)`.
- Review uniqueness:
  - `(product_id, user_id)` unique.

### Verification

- `mix ecto.migrate` succeeds on clean DB.
- `mix ecto.rollback --step 1 && mix ecto.migrate` succeeds.
- DB inspection confirms all expected indexes and constraints.

### Risks / Deferred

- Consider moving heavy enum fields from DB enum to text+check if enum churn is high.
- Advanced partitioning (e.g., `price_points`) deferred until data scale proves need.

---

## C) Core Workflows (MVP) (Detailed)

### Assumptions

- Context modules orchestrate Repo transactions; schema modules only define structure/changesets.
- Invariants are enforced in both changesets and transactional orchestration.

### C1) Taxonomy Workflow

1. Add `Taxonomy.create_taxon/1`:
   - insert taxon row,
   - insert closure self-row (`depth=0`),
   - if parent present, insert ancestor rows via parent closure + 1 depth.
2. Add `Taxonomy.move_taxon/2` (reparent):
   - transaction + row locks on subtree,
   - delete old ancestor paths for subtree,
   - insert new ancestor paths,
   - prevent cycles (new parent cannot be inside subtree).
3. Add `list_descendants/1`, `list_ancestors/1` via closure table.
4. Seed taxonomies `type` and `use_case` in seed plan.
5. Add tagging API:
   - `assign_use_case(product_id, taxon_id, created_by, source_type, confidence)`
   - `unassign_use_case(product_id, taxon_id)`
6. Guardrail: validate `products.primary_type_taxon_id` belongs to taxonomy `type` in context-level checks.

### C2) Attributes + Units

1. Add dimension/unit catalog APIs.
2. Add conversion helper:
   - canonical formula: `value_base = value * multiplier_to_base + offset_to_base`.
3. Validate unit dimension compatibility with attribute dimension.
4. Add support for range values (`value_num_base_min/max`) where needed.

### C3) Claims + Current Selection

1. `propose_claim(product_id, attribute_id, typed_value, provenance)`:
   - validate exactly one typed-value family,
   - compute `value_num_base` when numeric + unit,
   - persist append-only claim in `proposed`.
2. `accept_claim(claim_id, moderator_user_id)` and `reject_claim(...)`:
   - update status with moderation metadata.
3. `select_current_claim(product_id, attribute_id, claim_id, selector_user_id)`:
   - transaction,
   - verify claim belongs to same product+attribute,
   - upsert into `product_attribute_current` on conflict `(product_id, attribute_id)`.
4. Enforce one-row invariant via unique index and atomic upsert path.

### C4) Filtering Query Helper

1. Build composable query module (`Specs.ProductFilter`):
   - type filter by `primary_type_taxon_id`.
   - optional descendant expansion via closure.
   - numeric min/max filters on joined current claim’s `value_num_base`.
   - bool filters on `value_bool`.
   - enum filters on `enum_option_id`.
   - use-case filters via `product_taxons` constrained to `use_case` taxonomy.
2. Join path uses `product_attribute_current -> product_attribute_claims`.
3. Keep stable ordering (`products.id` or deterministic sort key).

### C5) Pricing

1. Implement `upsert_merchant/1` by unique name/domain key.
2. Implement `upsert_merchant_product/1` by `(merchant_id, url)`.
3. Implement `add_price_point/1` with observation timestamp.
4. Implement `latest_price/1` (`ORDER BY observed_at DESC LIMIT 1`).
5. Implement `price_history/2` by date range with deterministic ordering.

### C6) Discussions / Reviews

1. CRUD thread creation/listing for product.
2. CRUD posts with optional `parent_post_id`.
3. CRUD reviews with rating bounds and one-review-per-user-per-product.

### Transaction/Invariants Checklist

- No taxonomy cycles.
- Product primary type always from taxonomy `type`.
- Exactly one current claim per `(product, attribute)`.
- Current claim references valid matching claim.
- Numeric claims store normalized base values.

### Verification

- Context integration tests pass for each workflow.
- Concurrent current-claim selection test passes repeatedly.

### Risks / Deferred

- Derived formulas execution engine deferred (store definitions now, evaluate later).
- Moderation queue/permissions depth deferred beyond basic role checks.

---

## D) Seeds + Minimal Examples (Detailed)

### Assumptions

- Seeds are rerunnable without duplicating rows (upsert/find-or-create by natural keys).
- Seed data should exercise the filter and claim workflows immediately.

### Deterministic Seed Sequence

1. Insert taxonomy roots (`type`, `use_case`).
2. Insert type tree: Electronics -> Displays -> TV, Monitor, Projector.
3. Insert use-case tree: Desktop Setup -> Gaming, Office, Creative; Home Theater.
4. Insert dimensions/units:
   - frequency: `hz`
   - length: `mm`, `in`
5. Insert enum set/options for panel tech (e.g., `ips`, `va`, `oled`, `qd_oled`).
6. Insert attributes:
   - `refresh_rate` (numeric, frequency)
   - `hdr_supported` (bool)
   - `panel_tech` (enum)
   - `diagonal` (numeric, length)
7. Insert 1-2 brands + products (monitor examples).
8. Insert proposed/accepted claims and select current claims for seeded attributes.
9. Insert merchant + merchant_product listing + several historical price points.

### Example Dataset Blueprint

- Product A: 27" 16:9 gaming monitor, 165Hz, HDR true, panel `qd_oled`.
- Product B: ultrawide (height-equivalent class), 144Hz, HDR true, panel `ips`.
- Price points across 3 dates to validate trend/history queries.

### Idempotency Strategy

- Use stable natural keys (`code`, `slug`, `(merchant_id,url)`) for lookup before insert.
- For claims/current rows in seeds, clear and recreate only seed-owned sample records by marker/source where necessary.

### Verification

- `mix run priv/repo/seeds.exs` runs twice with no duplicates.
- Spot checks:
  - taxonomy descendants for `Displays` include TV/Monitor/Projector.
  - products have current claims for seeded filter attributes.
  - latest and historical price queries return expected counts/order.

### Risks / Deferred

- Seed volume is intentionally tiny; not representative of scraper-scale data.

---

## E) Tests (Detailed)

### Assumptions

- Use `DataCase` + SQL sandbox.
- Build focused fixtures for units/dimensions, taxonomies/taxons, products/attributes/claims.
- Keep concurrency tests deterministic with explicit task coordination.

### Test File Layout and Fixtures Needed

- `test/product_compare/specs/unit_conversion_test.exs`
- `test/product_compare/taxonomy/taxon_closure_test.exs`
- `test/product_compare/specs/current_claim_selection_test.exs`
- `test/support/fixtures/specs_fixtures.ex`
- `test/support/fixtures/taxonomy_fixtures.ex`
- `test/support/fixtures/catalog_fixtures.ex`

Fixture coverage:

- Dimensions + units (frequency, length, offset-capable sample).
- Taxonomies and 3-level taxon trees.
- Product + attributes + candidate claims for same `(product, attribute)`.

### Test Case Matrix

#### 1) Unit conversion base values correctness

Happy path:

- Numeric conversion with multiplier only (inches -> mm, Hz -> Hz).
- Base unit identity conversion (`multiplier=1`, `offset=0`).

Edge cases:

- Offset conversion case (for helper correctness).
- High precision decimal conversion and rounding policy assertion.
- Reject missing/incompatible unit for numeric attribute.

#### 2) `taxon_closure` descendant lookup

Happy path:

- Creating tree populates closure self and ancestor-descendant rows.
- `list_descendants/1` returns all descendants with expected depth ordering.

Edge cases:

- Reparent subtree updates closure paths correctly.
- Attempted cyclic move is rejected.
- Cross-taxonomy reparent is rejected.

#### 3) `product_attribute_current` uniqueness + atomic swap

Happy path:

- First selection inserts one `(product, attribute)` row.
- Second selection for same pair replaces old `claim_id` atomically.

Edge cases:

- Selecting claim from different product/attribute is rejected.
- Unique index blocks duplicate rows when called repeatedly.

Concurrency:

- Two concurrent selections race on same `(product, attribute)`.
- Assert only one final current row exists and points to one valid contender.
- Repeat race test multiple times to catch transaction ordering issues.

### Command Checklist

1. `mix test test/product_compare/specs/unit_conversion_test.exs`
   - Expected: all conversion tests pass.
2. `mix test test/product_compare/taxonomy/taxon_closure_test.exs`
   - Expected: tree creation/reparent/cycle tests pass.
3. `mix test test/product_compare/specs/current_claim_selection_test.exs --max-failures 1`
   - Expected: uniqueness + atomic swap + race tests pass.
4. `mix test`
   - Expected: full suite green.

### Risks / Flakiness Mitigations

- Concurrency test flakiness: use synchronization barriers and deterministic DB setup; avoid sleep-based timing.
- Precision drift: assert with decimal compare semantics, not float.
- Sandbox contention: keep concurrency tests scoped and isolated to one test module with explicit ownership mode where needed.

---

## F) Deliverable Plan / Checklist Doc (Detailed)

### Assumptions

- Team needs one concise execution checklist and one detailed living plan.

### Recommended Deliverable Structure

1. `README.md` short section: “MVP backend implementation checklist”.
2. `docs/plans/2026-03-03-product-compare-backend-implementation-plan.md` (this file) as detailed execution artifact.
3. Optional tracking table in docs with status per top-level task A-F.

### Checklist Sections + Acceptance Criteria

- **Migration ordering**
  - Acceptance: clean migrate + rollback + migrate passes.
- **Module boundaries**
  - Acceptance: contexts expose API functions; schemas remain schema-only.
- **Core workflow invariants**
  - Acceptance: tests for conversion, closure, current-claim atomicity pass.
- **Seeds**
  - Acceptance: rerunnable, deterministic, no duplicates.
- **Deferred scope**
  - Acceptance: explicit list documented so MVP doesn’t silently expand.

### Deferred Items (Explicit)

- Scraping jobs and schedulers (Oban pipelines, retries, backoff).
- Affiliate API ingestion automation and coupon reconciliation jobs.
- Derived formula execution engine + dependency recomputation workers.
- Embeddings/semantic search, full-text ranking, advanced faceted search UX.
- Advanced moderation/reputation governance and anti-spam tooling.
- Comprehensive GraphQL Relay surface + auth/session lifecycle hardening.

### Plan Maintenance Workflow

1. Update this plan whenever schema or context boundary changes.
2. Keep “DBML divergence notes” section in PR descriptions.
3. Re-run checklist gates (`mix precommit`) before marking milestones complete.

---

## Suggested Execution Order

1. A (scaffold/environment)
2. B (migrations/schemas)
3. D (seeds baseline)
4. C1-C3 (taxonomy/units/claims invariants)
5. C4-C6 (query/p pricing/discussions)
6. E (tests hardening)
7. F (final docs trim + deferred scope confirmation)


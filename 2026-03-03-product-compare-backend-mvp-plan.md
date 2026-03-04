# ProductCompare Backend MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up a Phoenix modular monolith backend for typed product comparison with taxonomy, claims, filtering, pricing history, discussions/reviews, and deterministic seeds/tests.

**Architecture:** Use one Phoenix app with strict context boundaries (`Accounts`, `Taxonomy`, `Catalog`, `Specs`, `Pricing`, `Affiliate`, `Discussions`) and schema-only Ecto modules under a dedicated schemas boundary. Persist typed spec claims append-only and maintain fast filtering via `product_attribute_current` + indexed canonical numeric values (`value_num_base`).

**Tech Stack:** Elixir/Erlang/Phoenix (latest stable), Ecto/PostgreSQL 18, Docker Compose, Nix, Absinthe-ready modular boundaries.

---

## Top-Level Task Checklist (A-F)

### A) Repo Integration / Architecture
- [x] Create Nix environment (latest stable Elixir/Erlang/Phoenix toolchain) and standard dev shell.
- [x] Generate Phoenix project configured for `:utc_datetime_usec`, bigint PK defaults, and Postgres.
- [x] Add Docker Compose for PostgreSQL 18 and wire app config to container env vars.
- [x] Establish context boundaries and public API modules.

### B) Database Layer (Migrations + Schemas)

- [x] Create migrations in dependency-safe order, adapting DBML where simplification/constraints improve maintainability.
- [x] Add `entropy_id uuid default uuidv7()` + unique index to relational tables per guide.
- [x] Implement schemas with associations, changesets, and `Ecto.Enum` fields for domain enums.
- [x] Add critical indexes for filter query performance and claim/current joins.

### C) Core Workflows (MVP)

- [x] Taxonomy tree + closure maintenance + use-case tagging with guardrails.
- [x] Unit/dimension conversion helper with base-unit normalization.
- [x] Claim lifecycle (propose/accept/reject/select current) with transactional safety.
- [x] Product filtering query builder (type descendants, ranges, bool/enum/use-case filters).
- [x] Pricing upsert/history workflows.
- [x] Discussions/reviews CRUD.

### D) Seeds + Minimal Examples

- [x] Seed taxonomies, sample trees, units, enums, attributes.
- [x] Seed sample products, claims, current pointers, and pricing history.
- [x] Keep seed flow deterministic and idempotent.

### E) Tests

- [x] Unit conversion correctness tests.
- [x] Taxon closure traversal tests.
- [x] Current-claim uniqueness and atomic replacement tests.

### F) Deliverable Plan Artifact

- [x] Maintain concise implementation checklist documenting migration order, module boundaries, and deferred scope.

---

## Parallel Subagent Dispatch Plan

Planned independent planning tracks:

- `Subagent-A`: Task A repo/bootstrap/architecture sequencing.
- `Subagent-B`: Task B migration + schema + indexing design.
- `Subagent-C`: Task C service/workflow API + transaction invariants.
- `Subagent-D`: Task D deterministic seed dataset plan.
- `Subagent-E`: Task E test matrix and fixture strategy.
- `Subagent-F`: Task F delivery document and deferred-scope framing.

Integration rule:
- Merge outputs into one execution order where A -> B -> C -> D -> E -> F, with B/C/E refined iteratively.

---

## Detailed Substep Plans (Subagent Outputs)

### Subagent-A: Repo Integration / Architecture

#### 1) Assumptions
- App namespace: `ProductCompare`.
- Phoenix app name: `product_compare`.
- PostgreSQL 18 is available through Docker only for local/dev and CI service containers.
- No frontend scaffolding needed for MVP API work (`--no-html --no-assets` acceptable).

#### 2) Ordered Checklist (2-5 minute steps)
1. Create project skeleton with Phoenix generator using latest stable versions in nix shell.
2. Set generator defaults to `timestamp_type: :utc_datetime_usec`.
3. Add shared schema macro module for relational defaults (bigint PK + microsecond timestamps).
4. Add migration helper convention for `entropy_id` column + unique index on each relational table.
5. Add Docker Compose (`postgres:18`) with named volume and healthcheck.
6. Wire dev/test repo config to `DATABASE_URL` with sane fallbacks.
7. Create context boundary modules:
   - `ProductCompare.Accounts`
   - `ProductCompare.Taxonomy`
   - `ProductCompare.Catalog`
   - `ProductCompare.Specs`
   - `ProductCompare.Pricing`
   - `ProductCompare.Affiliate`
   - `ProductCompare.Discussions`
8. Create schemas boundary root (`ProductCompareSchemas`) and schema-only submodules per context.
9. Add aliases/check tasks for compile/test/format/type gates.

#### 3) File/Module Map
- Create: `flake.nix`, `flake.lock`, `.env.example`, `docker-compose.yml`.
- Create: `lib/product_compare.ex`, `lib/product_compare_schemas.ex`.
- Create: `lib/product_compare/*.ex` (context API modules).
- Create: `lib/product_compare_schemas/schema.ex` + per-domain schema folders.
- Modify: `config/config.exs`, `config/dev.exs`, `config/test.exs`, `mix.exs`.

#### 4) Verification Checklist
- `nix develop -c elixir --version` prints expected stable Elixir.
- `nix develop -c mix phx.new --version` resolves expected Phoenix.
- `docker compose up -d db` starts healthy Postgres 18 container.
- `mix compile` succeeds with no warnings.

#### 5) Risks/Deferred
- Exact latest package versions may shift; lock in `mix.exs` and `flake.lock`.
- GraphQL transport integration is deferred from this task.

---

### Subagent-B: Database Layer (Migrations + Schemas)

#### 1) Assumptions
- Use bigint IDs as PK/FK across relational tables.
- Use additive `entropy_id` UUIDv7 column on relational tables (unique indexed).
- Keep DB enum storage as strings with `Ecto.Enum` in schemas plus DB check constraints where practical.

#### 2) Migration Ordering Plan (with rationale)
1. `enable_extensions`:
   - Enable `citext`.
   - Ensure `uuidv7()` availability (Postgres 18 expectation).
   - Rationale: required by downstream tables.
2. `create_users_and_reputation`:
   - `users`, `user_reputation`, `reputation_events`.
   - Rationale: referenced by many tables as `created_by`/`user_id`.
3. `create_taxonomy_tables`:
   - `taxonomies`, `taxons`, `taxon_closure`, `product_taxons`, optional `taxon_aliases`.
   - Rationale: product type/use-case relationships depend on taxonomy.
4. `create_catalog_tables`:
   - `brands`, `products`.
   - Rationale: core product anchor for claims/pricing/discussions.
5. `create_units_and_enums`:
   - `dimensions`, `units`, `enum_sets`, `enum_options`.
   - Rationale: attributes depend on dimensions/enums.
6. `create_attributes_tables`:
   - `attributes`, `taxon_attributes`.
   - Rationale: claims depend on attributes.
7. `create_sources_tables`:
   - `sources`, `source_artifacts`, `external_products`.
   - Rationale: evidence/provenance references.
8. `create_claims_tables`:
   - `product_attribute_claims`, `claim_evidence`, `product_attribute_current`,
   - `derived_formulas`, `derived_formula_deps`, `claim_dependencies`.
   - Rationale: central spec workflow and filtering index surface.
9. `create_pricing_tables`:
   - `merchants`, `merchant_products`, `price_points`.
10. `create_affiliate_tables`:
   - `affiliate_networks`, `affiliate_programs`, `affiliate_links`, `coupons`.
11. `create_discussions_tables`:
   - `product_threads`, `thread_posts`, `product_reviews`.
12. `add_constraints_and_perf_indexes`:
   - cross-table check constraints and additional indexes that depend on prior table existence.

#### 3) Schema Module Checklist by Context
- `ProductCompareSchemas.Accounts`:
  - `User`, `UserReputation`, `ReputationEvent`
- `ProductCompareSchemas.Taxonomy`:
  - `Taxonomy`, `Taxon`, `TaxonClosure`, `TaxonAlias`, `ProductTaxon`
- `ProductCompareSchemas.Catalog`:
  - `Brand`, `Product`, `ExternalProduct`, `Source`, `SourceArtifact`
- `ProductCompareSchemas.Specs`:
  - `Dimension`, `Unit`, `EnumSet`, `EnumOption`, `Attribute`, `TaxonAttribute`
  - `ProductAttributeClaim`, `ProductAttributeCurrent`, `ClaimEvidence`
  - `DerivedFormula`, `DerivedFormulaDep`, `ClaimDependency`
- `ProductCompareSchemas.Pricing`:
  - `Merchant`, `MerchantProduct`, `PricePoint`
- `ProductCompareSchemas.Affiliate`:
  - `AffiliateNetwork`, `AffiliateProgram`, `AffiliateLink`, `Coupon`
- `ProductCompareSchemas.Discussions`:
  - `ProductThread`, `ThreadPost`, `ProductReview`

Schema checklist rules:
- Include `@type t` for every schema.
- Keep only fields, associations, changesets, validations in schema modules.
- Put orchestration/transactions in context modules only.

#### 4) Index Strategy Checklist (critical)
- Core filtering:
  - Unique `(product_id, attribute_id)` on `product_attribute_current`.
  - Unique `(claim_id)` on `product_attribute_current`.
  - Composite join helper `(attribute_id, product_id, id)` or `(product_id, attribute_id, status)` on `product_attribute_claims` (implementation pick after EXPLAIN).
  - Numeric filter index on `product_attribute_claims(attribute_id, value_num_base)` with partial condition excluding null.
  - Bool filter index on `(attribute_id, value_bool)` partial not null.
  - Enum filter index on `(attribute_id, enum_option_id)` partial not null.
- Taxonomy traversal/filtering:
  - `taxon_closure(ancestor_id, descendant_id)` unique.
  - `taxon_closure(descendant_id)` for ancestor lookups.
  - `products(primary_type_taxon_id)`.
  - `product_taxons(taxon_id, product_id)`.
- Pricing:
  - `price_points(merchant_product_id, observed_at DESC)`.
  - `merchant_products(merchant_id, url)` unique.
- Evidence/source:
  - `source_artifacts(source_id, fetched_at DESC)`.
  - `external_products(source_id, external_id)` unique.

#### 5) Verification Checklist (commands/tests)
- `mix ecto.create`
- `mix ecto.migrate`
- `mix ecto.rollback --step 1 && mix ecto.migrate` (migration reversibility smoke test)
- `mix test test/**/schemas/*_test.exs` (schema validation/association tests)
- Add EXPLAIN assertions in integration tests for core filtering query paths.

#### 6) Risks/Deferred
- Exhaustive DB-level “exactly one typed claim value” constraint may need trigger/check complexity; phase 1 can enforce mostly in changesets + targeted checks.
- Multi-valued attributes may require additional bridge table later if claim cardinality requirements evolve.

---

### Subagent-C: Core Workflows (MVP)

#### 1) Assumptions
- Workflows are context APIs; schema modules remain persistence-only.
- All write flows return tagged tuples (`{:ok, value}` / `{:error, changeset | reason}`).

#### 2) Workflow-by-Workflow Step Plan

Taxonomy:
1. Seed taxonomies (`type`, `use_case`) once.
2. Implement `create_taxon/1`:
   - insert node
   - insert self-closure row
   - insert ancestor closure rows from parent lineage.
3. Implement `move_taxon/2`:
   - prevent cycles
   - remove old closure paths for subtree
   - insert new closure paths for subtree using transaction.
4. Implement readers:
   - `list_descendants/1`
   - `list_ancestors/1`
5. Implement use-case tagging APIs:
   - `assign_use_case/5`
   - `unassign_use_case/3`
6. Guardrails:
   - `primary_type_taxon_id` must belong to taxonomy code `type` (code-enforced in MVP).

Attributes + Units:
1. Implement `Specs.convert_to_base/3` using `multiplier_to_base` and `offset_to_base`.
2. Validate dimension compatibility before conversion.
3. Normalize numeric claims into `value_num_base` on propose flow.
4. Add unit conversion tests including offset cases (e.g., temperature-ready behavior even if unused now).

Claims + Current Selection:
1. `propose_claim/4`:
   - typed-value validation by attribute `data_type`
   - optional provenance/evidence links.
2. `accept_claim/2` and `reject_claim/2`:
   - moderator-only gate
   - status transition checks.
3. `select_current_claim/4` transaction:
   - lock product+attribute current row scope
   - upsert `product_attribute_current` with new `claim_id`
   - guarantee one row per `(product_id, attribute_id)` atomically.

Filtering Query Builder:
1. Build query composer from `Product` base query.
2. Add primary type filter with optional descendants via `taxon_closure`.
3. Add range filters through joins to `product_attribute_current` + `product_attribute_claims`.
4. Add bool and enum filters similarly.
5. Add use-case tag filter through `product_taxons` constrained to taxonomy `use_case`.

Pricing:
1. `upsert_merchant/1` by normalized name/domain.
2. `upsert_merchant_product/1` by `(merchant_id,url)` uniqueness.
3. `add_price_point/1` append-only.
4. `latest_price/1` query latest by `observed_at`.
5. `price_history/2` bounded range query with deterministic order.

Discussions/Reviews:
1. CRUD for `product_threads`.
2. CRUD for `thread_posts` (optional parent post nesting).
3. CRUD for `product_reviews` with `rating 1..5` validation and unique `(product_id,user_id)`.

#### 3) API Surface Proposal (modules/functions)
- `ProductCompare.Taxonomy`:
  - `create_taxon(attrs)`
  - `move_taxon(taxon_id, new_parent_id)`
  - `list_descendants(taxon_id)`
  - `list_ancestors(taxon_id)`
  - `assign_use_case(product_id, use_case_taxon_id, created_by, source_type, confidence)`
  - `unassign_use_case(product_id, use_case_taxon_id, removed_by)`
- `ProductCompare.Specs`:
  - `convert_to_base(value_num, unit_code_or_id, dimension_code_or_id)`
  - `propose_claim(product_id, attribute_id, typed_value, provenance)`
  - `accept_claim(claim_id, moderator_user_id)`
  - `reject_claim(claim_id, moderator_user_id)`
  - `select_current_claim(product_id, attribute_id, claim_id, selector_user_id)`
- `ProductCompare.Catalog.Filtering`:
  - `apply_filters(query \\ Product, filters)`
- `ProductCompare.Pricing`:
  - `upsert_merchant(attrs)`
  - `upsert_merchant_product(attrs)`
  - `add_price_point(attrs)`
  - `latest_price(merchant_product_id)`
  - `price_history(merchant_product_id, date_range)`
- `ProductCompare.Discussions`:
  - `create/update/delete/list` for threads/posts/reviews.

#### 4) Transaction/Invariants Checklist
- `move_taxon/2` runs in one transaction and forbids moving node under its descendant.
- `select_current_claim/4` uses transactional upsert and claim-ownership validation.
- `accept/reject` enforce legal status transitions only.
- product primary type validation checks taxonomy code before insert/update.

#### 5) Test Plan Mapping
- Taxonomy tests for closure maintenance on create + move.
- Specs tests for conversion, claim validation, state transitions.
- Current-claim tests for atomic replacement and uniqueness conflicts.
- Filtering integration tests with mixed claim types.
- Pricing tests for upsert idempotency and history sorting.
- Discussions tests for FK integrity and review uniqueness.

#### 6) Risks/Deferred
- Reputation-based edit gating can start as simple policy checks and expand later.
- Derived-formula execution engine is deferred; data model can land now.

---

### Subagent-D: Seeds + Minimal Examples

#### 1) Assumptions
- Seeds are safe to run repeatedly in dev.
- Seeds target canonical codes/slugs to avoid duplicates.

#### 2) Deterministic Seed Sequence
1. Upsert base users/admin/moderator.
2. Upsert taxonomies (`type`, `use_case`).
3. Insert type tree:
   - Electronics -> Displays -> TV / Monitor / Projector
4. Insert use-case tree:
   - Desktop Setup -> Gaming / Office / Creative
   - Home Theater
5. Upsert dimensions/units:
   - `length` (`mm`, `in`)
   - `frequency` (`hz`, `khz`)
6. Upsert enum set/options:
   - `panel_tech` with `ips`, `va`, `oled`, `qd_oled`, `mini_led`.
7. Upsert attributes:
   - `refresh_rate` (numeric + frequency)
   - `hdr_supported` (bool)
   - `panel_tech` (enum)
   - `diagonal` (numeric + length)
8. Upsert products and assign primary type taxon `monitor`.
9. Insert claims + select current for each sample attribute.
10. Upsert merchant + merchant product + multiple price points.

#### 3) Example Dataset Blueprint
- Product 1: `Acme Vision 27G`
  - refresh_rate = 165 Hz
  - hdr_supported = true
  - panel_tech = qd_oled
  - diagonal = 27 in
- Product 2: `Acme Vision 27UW`
  - refresh_rate = 144 Hz
  - hdr_supported = true
  - panel_tech = mini_led
  - diagonal = 27 in
- Merchant listing: `ExampleMart` with 3 price points over different timestamps.

#### 4) Idempotency Strategy
- `get_by + insert/update` (or `insert ... on_conflict`) keyed by stable codes:
  - taxonomies.code, taxons.(taxonomy_id, code), attributes.code, products.slug, merchant(name/domain), merchant_product(merchant_id,url).
- Only append new price points; avoid rewriting history.

#### 5) Verification Checklist
- `mix run priv/repo/seeds.exs` completes without errors twice in a row.
- Record counts remain stable for dimensional/taxonomy/attribute entities.
- Price point count increases only when intentionally adding new timestamp entries.

#### 6) Risks/Deferred
- Real scraped provenance and affiliate API imports deferred from seeds.

---

### Subagent-E: Tests

#### 1) Assumptions
- Use `DataCase` for DB tests with SQL sandbox.
- Keep fixtures focused and composable per context.

#### 2) Test File Layout
- `test/product_compare/specs/unit_conversion_test.exs`
- `test/product_compare/taxonomy/taxon_closure_test.exs`
- `test/product_compare/specs/current_claim_selection_test.exs`
- Supporting fixtures:
  - `test/support/fixtures/taxonomy_fixtures.ex`
  - `test/support/fixtures/specs_fixtures.ex`
  - `test/support/fixtures/catalog_fixtures.ex`

#### 3) Test Case Matrix
- Unit conversion:
  - same-unit passthrough
  - inch -> mm conversion
  - invalid unit/dimension mismatch returns error
  - multiplier/offset correctness
- Taxon closure descendants:
  - direct child + deep descendant retrieval
  - move_taxon reparent updates descendants correctly
  - no duplicate closure paths
- Current claim atomic swap:
  - initial select inserts row
  - reselection swaps claim in one transaction
  - concurrent selections keep single current row
  - unique constraint violations are handled gracefully

#### 4) Commands + Expected Outcomes
- `mix test test/product_compare/specs/unit_conversion_test.exs` -> all pass
- `mix test test/product_compare/taxonomy/taxon_closure_test.exs` -> all pass
- `mix test test/product_compare/specs/current_claim_selection_test.exs` -> all pass
- `mix test` -> green suite

#### 5) Risks/Flakiness Mitigation
- Concurrency tests should use explicit transactional barriers/locks, not sleeps.
- Keep deterministic timestamps in tests where ordering matters.

---

### Subagent-F: Deliverable Plan Artifact

#### 1) Assumptions
- Plan should stay useful as DBML evolves.
- Reader may have zero project context.

#### 2) Recommended Deliverable Structure
1. Scope and goals
2. Module boundaries
3. Migration order + rationale
4. Workflow implementation checklist
5. Seed/test checklist
6. Deferred scope and future phases

#### 3) Checklist Sections + Acceptance Criteria
- Migration done when all migrations run forward/back one step cleanly.
- Schema done when all schema modules compile with associations and validations.
- Workflows done when required APIs exist and tests cover invariants.
- Filtering done when numeric/bool/enum/use-case filters execute against `current` join path.
- Pricing done when latest/history queries pass integration tests.

#### 4) Deferred Items Template
- Scraping ingestion jobs + scheduling (Oban/queues).
- Affiliate API sync pipelines and coupon normalization jobs.
- Derived formula runtime executor and recomputation graph.
- Embeddings/search indexing and semantic query layer.
- Advanced moderation, anti-spam, trust/reputation governance.
- Full GraphQL schema/resolver surface and Relay pagination.

#### 5) Plan Maintenance Workflow
1. When schema changes, update migration order section first.
2. Reconcile context API checklist and tests after each feature tranche.
3. Keep deferred list explicit; move item only when acceptance criteria are added.

---

## Consolidated Migration Order (Execution Quick View)

1. Extensions + base migration helpers.
2. Accounts.
3. Taxonomy.
4. Catalog.
5. Dimensions/Units + Enum catalogs.
6. Attributes + applicability.
7. Sources/external mappings.
8. Claims/current/evidence/derived metadata.
9. Pricing.
10. Affiliate.
11. Discussions/reviews.
12. Cross-cutting constraints/index tuning.

---

## Intentionally Deferred in MVP

- Scraper orchestration and distributed ingestion workers.
- Oban pipelines and retry/dead-letter operations.
- Derived formula execution engine and dependency invalidation workers.
- Embeddings/vector search and semantic recommendation layer.
- Advanced moderation workflows and anti-abuse heuristics.
- UI/search frontend concerns.

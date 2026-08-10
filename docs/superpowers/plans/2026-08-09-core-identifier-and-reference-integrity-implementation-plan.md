# Core Identifier And Reference Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL and the owning Ecto boundaries preserve the established exact-identifier and numeric-claim reference contracts as one consolidated core-integrity outcome.

**Architecture:** Characterize the identifier and numeric-reference gaps through two focused direct-write suites, then add two explicit forward migrations and local changeset mappings. Product, taxonomy, commerce, affiliate, snapshot, and specification owners keep their existing APIs; the internal slices share one queue row, verification boundary, and closeout.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL 18 check and foreign-key constraints, ExUnit.

## Global Constraints

- Canonical route and provider identifiers reject trailing newlines and preserve their existing ASCII formats.
- Referenced specification Units cannot be deleted; unreferenced Units retain current deletion behavior.
- Never rewrite or delete durable data to make a migration pass. Stop on any nonzero preflight and report stable row identifiers.
- Add no length limit, trimming, normalization, Unicode policy, finiteness policy, identifier framework, or generic storage abstraction.
- Preserve product slug namespace triggers, taxonomy publication rules, snapshot token generation, affiliate normalization, typed-value normalization, unit conversion, claim selection, and ingestion behavior.
- Keep product, taxonomy, commerce, affiliate, comparison, and specification changes as internal slices of this one batch.
- Use milestone commits for the dispatch contract, identifier implementation, and verified numeric-reference closeout.

---

## Owned Paths

- `priv/repo/migrations/20260809130100_enforce_core_identifier_storage_integrity.exs`
- `priv/repo/migrations/20260809130200_enforce_product_attribute_claim_reference_integrity.exs`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare_schemas/catalog/product_slug_alias.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot.ex`
- `lib/product_compare_schemas/pricing/merchant.ex`
- `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- `lib/product_compare_schemas/taxonomy/taxon.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare/comparison_snapshots/lifecycle.ex`
- `test/product_compare/repo/core_identifier_storage_integrity_test.exs`
- `test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs`
- `test/product_compare/catalog/product_lookup_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/affiliate/affiliate_workflows_test.exs`
- `test/product_compare/taxonomy/taxon_closure_test.exs`
- `test/product_compare/seo_test.exs`
- `test/product_compare/comparison_snapshots_test.exs`
- `test/product_compare/specs/product_attribute_claim_changeset_test.exs`
- `test/product_compare/specs/product_attribute_claim_db_constraint_test.exs`
- `test/product_compare/specs/definition_semantics_test.exs`
- `test/product_compare/specs/unit_conversion_test.exs`
- `test/product_compare/specs/current_claim_selection_test.exs`
- `test/product_compare/specs/corrections_test.exs`
- `test/product_compare/ingestion/enrichment_test.exs`
- `test/product_compare/catalog/filter_metadata_test.exs`
- `test/product_compare/catalog/filtering_regression_test.exs`
- `test/product_compare/recommendations_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `docs/work/core-identifier-and-reference-integrity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md`
- `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
- `docs/work/commerce-identifier-storage-integrity.md`

## Internal Slices

1. Exact product, historical-alias, reservation, merchant, affiliate-network, taxonomy SEO, and comparison-token identifier boundaries.
2. Numeric claim companion and range enforcement plus restrictive referenced-Unit lifecycle behavior.
3. Consolidated dispatch, regression verification, completion history, and removal of the superseded commerce-only draft documents.

### Task 1: Promote One Consolidated Dispatch Contract

**Files:**

- Create: `docs/work/core-identifier-and-reference-integrity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Delete: `docs/work/commerce-identifier-storage-integrity.md`
- Delete: `docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md`
- Delete: `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`

**Interfaces:**

- Consumes: approved design `docs/superpowers/specs/2026-08-09-core-identifier-and-reference-integrity-design.md` and the live ready-floor exception.
- Produces: one validator-complete `ready` queue row and one prospective lane contract covering every owned path and internal slice.

- [ ] **Step 1: Write the prospective lane contract**

  Record `Status: ready`, the approved design and this plan, the two product decisions, exact owned paths, the three internal slices above, clean-preflight prerequisites, focused and full verification commands, and an exit condition that closes the row only once.

- [ ] **Step 2: Replace the commerce-only decision row**

  Add exactly one Ready Work row named `Core Identifier And Reference Integrity`. Remove the Commerce Identifier Storage Integrity `needs_decision` row. Retain a complete Ready Floor Exception explaining that the internal slices cannot count as reserve rows and that fresh core-product curation is still required.

- [ ] **Step 3: Reconcile the candidate catalog**

  Replace the separate product-slug, commerce-identifier, and numeric-claim companion `needs_decision` candidates with one consolidated `ready` candidate. Record taxonomy SEO slug and comparison-token parity as source-backed adjacent slices. Remove the superseded commerce-only design, plan, and lane files; Git remains their history.

- [ ] **Step 4: Validate and commit the planning milestone**

  Run:

  ```bash
  mix work_queue.validate
  git diff --check
  ```

  Expected: `work queue valid: 1 ready row` and no diff errors.

  Commit:

  ```bash
  git add docs/work/index.md docs/work/core-identifier-and-reference-integrity.md docs/plans/INDEX.md docs/superpowers/plans/2026-08-09-core-identifier-and-reference-integrity-implementation-plan.md docs/work/commerce-identifier-storage-integrity.md docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md
  git commit -m "docs: plan core identifier integrity batch"
  ```

### Task 2: Characterize And Enforce Exact Identifiers

**Files:**

- Create: `test/product_compare/repo/core_identifier_storage_integrity_test.exs`
- Create: `priv/repo/migrations/20260809130100_enforce_core_identifier_storage_integrity.exs`
- Modify: `lib/product_compare_schemas/catalog/product.ex`
- Modify: `lib/product_compare_schemas/catalog/product_slug_alias.ex`
- Modify: `lib/product_compare_schemas/catalog/comparison_snapshot.ex`
- Modify: `lib/product_compare_schemas/pricing/merchant.ex`
- Modify: `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- Modify: `lib/product_compare_schemas/taxonomy/taxon.ex`
- Modify: `lib/product_compare/comparison_snapshots/lifecycle.ex`
- Modify: `docs/work/index.md`
- Modify: `docs/work/core-identifier-and-reference-integrity.md`

**Interfaces:**

- Consumes: existing local identifier regexes and the product slug namespace triggers.
- Produces: six named identifier checks plus exact application patterns and mapped comparison-token parity.

- [ ] **Step 1: Run exact identifier preflights**

  Execute read-only counts for these predicates and require zero rows:

  ```sql
  SELECT id FROM products WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
  SELECT id FROM product_slug_aliases WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
  SELECT slug FROM product_slug_reservations WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
  SELECT id FROM merchants WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
  SELECT id FROM affiliate_networks WHERE code !~ '^[a-z0-9]+(_[a-z0-9]+)*$';
  SELECT id FROM taxons WHERE seo_slug IS NOT NULL AND seo_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
  ```

- [ ] **Step 2: Write failing identifier tests**

  Create an async `ProductCompare.DataCase` suite that uses real fixtures and `Repo.query/2`. Assert trailing-newline changesets are invalid for Product, ProductSlugAlias, Merchant, AffiliateNetwork, Taxon, and a 42-character-plus-newline ComparisonSnapshot token. Assert direct SQL rejects a space-containing value for each of the six migrated tables under these exact names:

  ```elixir
  @identifier_constraints %{
    products: "products_slug_format_check",
    product_slug_aliases: "product_slug_aliases_slug_format_check",
    product_slug_reservations: "product_slug_reservations_slug_format_check",
    merchants: "merchants_slug_format_check",
    affiliate_networks: "affiliate_networks_code_format_check",
    taxons: "taxons_seo_slug_format_check"
  }
  ```

  Include valid direct-write controls, nullable `taxons.seo_slug`, alias-trigger reservation creation, and existing comparison-token database rejection. Name the production change for each assertion: the exact application anchor or named PostgreSQL check.

- [ ] **Step 3: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/core_identifier_storage_integrity_test.exs
  ```

  Expected: trailing-newline changesets remain valid and the six proposed constraint-name assertions fail because the checks do not exist. Existing comparison-token database rejection may already pass.

- [ ] **Step 4: Add the identifier migration**

  Create six explicit reversible checks:

  ```elixir
  create constraint(:products, :products_slug_format_check,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:product_slug_aliases, :product_slug_aliases_slug_format_check,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:product_slug_reservations, :product_slug_reservations_slug_format_check,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:merchants, :merchants_slug_format_check,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:affiliate_networks, :affiliate_networks_code_format_check,
           check: "code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'"
         )

  create constraint(:taxons, :taxons_seo_slug_format_check,
           check: "seo_slug IS NULL OR seo_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )
  ```

  `down/0` drops the six named constraints in reverse order.

- [ ] **Step 5: Align and map application owners**

  Replace each `$`-anchored format with its exact local equivalent:

  ```elixir
  ~r/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
  ~r/\A[a-z0-9]+(?:_[a-z0-9]+)*\z/
  ~r/\A[A-Za-z0-9_-]+\z/
  ~r/\A[A-Za-z0-9_-]{43}\z/
  ```

  Add the six owning `check_constraint/3` mappings. Add
  `check_constraint(:public_token, name: :comparison_snapshots_public_token_format)`
  to the snapshot publish changeset. Do not introduce a shared pattern module.

- [ ] **Step 6: Apply and verify GREEN**

  Run:

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/core_identifier_storage_integrity_test.exs test/product_compare/catalog/product_lookup_test.exs test/product_compare/pricing/merchant_detail_test.exs test/product_compare/affiliate/affiliate_workflows_test.exs test/product_compare/taxonomy/taxon_closure_test.exs test/product_compare/seo_test.exs test/product_compare/comparison_snapshots_test.exs
  ```

  Expected: every exact identifier boundary and affected regression passes.

- [ ] **Step 7: Claim the row and commit the identifier milestone**

  Move the queue row from `ready` to `active`, identify the current detached-worktree worker, preserve the Ready Floor Exception, record focused evidence in the lane doc, and run `mix work_queue.validate` plus `git diff --check`.

  Commit the migration, schemas, focused test, and active lane/queue evidence together:

  ```bash
  git add priv/repo/migrations/20260809130100_enforce_core_identifier_storage_integrity.exs lib/product_compare_schemas/catalog/product.ex lib/product_compare_schemas/catalog/product_slug_alias.ex lib/product_compare_schemas/catalog/comparison_snapshot.ex lib/product_compare_schemas/pricing/merchant.ex lib/product_compare_schemas/affiliate/affiliate_network.ex lib/product_compare_schemas/taxonomy/taxon.ex lib/product_compare/comparison_snapshots/lifecycle.ex test/product_compare/repo/core_identifier_storage_integrity_test.exs docs/work/index.md docs/work/core-identifier-and-reference-integrity.md
  git commit -m "fix: enforce exact core identifiers"
  ```

### Task 3: Characterize And Enforce Numeric Claim References

**Files:**

- Create: `test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs`
- Create: `priv/repo/migrations/20260809130200_enforce_product_attribute_claim_reference_integrity.exs`
- Modify: `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- Modify: `docs/work/core-identifier-and-reference-integrity.md`

**Interfaces:**

- Consumes: the current changeset's numeric companion and range rules and `product_attribute_claims_unit_id_fkey`.
- Produces: two named checks, a restrictive Unit foreign key, and mapped application errors.

- [ ] **Step 1: Run numeric-reference preflights**

  Require all three queries to return zero rows:

  ```sql
  SELECT id
  FROM product_attribute_claims
  WHERE (value_num IS NOT NULL AND (unit_id IS NULL OR value_num_base IS NULL))
     OR (value_num IS NULL AND (unit_id IS NOT NULL OR value_num_base IS NOT NULL
         OR value_num_base_min IS NOT NULL OR value_num_base_max IS NOT NULL));

  SELECT id
  FROM product_attribute_claims
  WHERE value_num_base_min IS NOT NULL
    AND value_num_base_max IS NOT NULL
    AND value_num_base_min > value_num_base_max;

  SELECT claim.id
  FROM product_attribute_claims AS claim
  LEFT JOIN units AS unit ON unit.id = claim.unit_id
  WHERE claim.unit_id IS NOT NULL AND unit.id IS NULL;
  ```

  Confirm the current foreign key name and delete action from `pg_constraint` before replacement.

- [ ] **Step 2: Write failing numeric-reference tests**

  Create an async `ProductCompare.DataCase` suite with direct SQL assertions for:

  ```elixir
  @companions "product_attribute_claims_numeric_companions_check"
  @range "product_attribute_claims_numeric_range_order_check"
  @unit_fk "product_attribute_claims_unit_id_fkey"
  ```

  Cases: numeric value missing Unit, numeric value missing base value, non-numeric typed value carrying each numeric companion, inverted paired range, and deletion of a referenced Unit. Controls: numeric claim with required companions and no range, numeric claim with either one-sided range, ordered paired range, non-numeric claim without companions, and deletion of an unreferenced Unit.

- [ ] **Step 3: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs
  ```

  Expected: malformed direct inserts and referenced Unit deletion succeed before the new migration, so exact constraint assertions fail.

- [ ] **Step 4: Add the numeric-reference migration**

  Add the two checks:

  ```elixir
  create constraint(:product_attribute_claims,
           :product_attribute_claims_numeric_companions_check,
           check: """
           (value_num IS NOT NULL AND unit_id IS NOT NULL AND value_num_base IS NOT NULL)
           OR
           (value_num IS NULL AND unit_id IS NULL AND value_num_base IS NULL
            AND value_num_base_min IS NULL AND value_num_base_max IS NULL)
           """
         )

  create constraint(:product_attribute_claims,
           :product_attribute_claims_numeric_range_order_check,
           check: """
           value_num_base_min IS NULL OR value_num_base_max IS NULL
           OR value_num_base_min <= value_num_base_max
           """
         )
  ```

  Replace `product_attribute_claims_unit_id_fkey` with the same columns and
  referenced table using `ON DELETE RESTRICT`. In `down/0`, drop the two checks,
  replace the foreign key with `ON DELETE SET NULL`, and preserve its original
  name.

- [ ] **Step 5: Map owning failures**

  Add exactly:

  ```elixir
  |> check_constraint(:value_num,
    name: :product_attribute_claims_numeric_companions_check
  )
  |> check_constraint(:value_num_base_min,
    name: :product_attribute_claims_numeric_range_order_check
  )
  |> foreign_key_constraint(:unit_id,
    name: :product_attribute_claims_unit_id_fkey
  )
  ```

  Do not change validation messages or typed-value normalization.

- [ ] **Step 6: Apply and verify focused GREEN**

  Run:

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/product_attribute_claim_db_constraint_test.exs test/product_compare/specs/definition_semantics_test.exs test/product_compare/specs/unit_conversion_test.exs test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs
  ```

  Expected: malformed direct writes fail under their exact names, referenced Unit deletion is rejected, valid controls and affected specification behavior pass.

### Task 4: Verify And Close The Batch Once

**Files:**

- Modify: `docs/work/core-identifier-and-reference-integrity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`

**Interfaces:**

- Consumes: both green internal slices and their exact verification evidence.
- Produces: one completion record, a zero-ready queue with a truthful floor exception, and one verified implementation commit.

- [ ] **Step 1: Run the complete affected boundary**

  Run the identifier focused suite plus specification, ingestion, catalog,
  recommendation, snapshot, SEO, and GraphQL consumers named under Owned Paths.
  Require zero failures before the full gate.

- [ ] **Step 2: Run repository gates**

  Run fresh commands and read their complete exit status:

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Record one observed closeout**

  Change the lane section from prospective `Target Outcome` to observed `Batch
  Outcome`, record exact test counts and constraint names, remove the completed
  active row, and restore the zero-ready Ready Floor Exception. Mark the single
  consolidated catalog candidate completed and add one completion-history entry;
  do not create per-slice completion records.

- [ ] **Step 4: Commit the verified numeric and closeout milestone**

  Stage the numeric migration, schema, focused test, and all truthful closeout
  docs together:

  ```bash
  git add priv/repo/migrations/20260809130200_enforce_product_attribute_claim_reference_integrity.exs lib/product_compare_schemas/specs/product_attribute_claim.ex test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs docs/work/core-identifier-and-reference-integrity.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md
  git commit -m "fix: preserve core identifier and claim integrity"
  ```

Exit condition: PostgreSQL and Ecto agree on every selected exact identifier,
numeric claims cannot lose or contradict their companions or referenced Unit,
all focused and repository gates pass, and the queue closes one consolidated
batch without reviving its internal slices.

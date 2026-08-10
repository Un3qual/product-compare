# Database Constraint Application Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every reachable application-owned same-row PostgreSQL check an equivalent pre-write Ecto validation and explicit error mapping while preserving database authority and transactional race safety.

**Architecture:** Remediate numeric-copy, cross-field, state, and owner-mapping gaps in three RED/GREEN slices. PostgreSQL remains authoritative, one reversible migration removes only redundant price checks, and every dependent read/lock/write sequence owns or explicitly requires a transaction. A concise `AGENTS.md` contract prevents recurrence through repository guidance and ordinary behavior tests rather than a registry, DSL, source scanner, or catalog-driven CI policy.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL 18 checks and transactions, ExUnit.

## Global Constraints

- Every application-owned same-row `CHECK` reachable through a changeset has equivalent pre-write validation and explicit `check_constraint/3` mapping.
- PostgreSQL enforcement remains in place; application validation never replaces the database check.
- Do not add query-before-write existence or uniqueness validation.
- Dependent reads and writes share one transaction with the appropriate row lock or one atomic SQL statement.
- `product_slug_reservations_slug_format_check` remains the sole trigger-maintained same-row exception.
- Preserve existing accepted values, messages, normalization, capture calculations, snapshot immutability, alert behavior, ingestion lifecycle, and discussion parent-cycle behavior.
- Remove only `price_must_be_non_negative` and `shipping_must_be_non_negative`; their mapped finite, non-negative replacements remain authoritative.
- Add no generic validator framework, constraint registry, constraint DSL, source scanner, or catalog-driven CI policy.
- Treat all domain changes as internal slices of one reviewer-sized application/database parity batch.

---

## Owned Paths

- `AGENTS.md`
- `priv/repo/migrations/20260809130300_remove_redundant_price_point_checks.exs`
- `lib/product_compare_schemas/alerts/alert_event.ex`
- `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot/attribute.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot/offer.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot/ranking.ex`
- `lib/product_compare_schemas/catalog/product_media.ex`
- `lib/product_compare_schemas/catalog/saved_comparison_item.ex`
- `lib/product_compare_schemas/commerce_attribution/commerce_link.ex`
- `lib/product_compare_schemas/discussions/community_report.ex`
- `lib/product_compare_schemas/discussions/community_write_window.ex`
- `lib/product_compare_schemas/discussions/product_review.ex`
- `lib/product_compare_schemas/discussions/thread_post.ex`
- `lib/product_compare/discussions/content_lifecycle.ex`
- `lib/product_compare/discussions/submissions/write_limits.ex`
- `lib/product_compare_schemas/ingestion/category_mapping_candidate.ex`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `lib/product_compare_schemas/specs/claim_dependency.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare_schemas/taxonomy/product_taxon.ex`
- `lib/product_compare_schemas/taxonomy/taxon_closure.ex`
- `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- `test/product_compare/repo/check_constraint_error_mapping_test.exs`
- `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- `test/product_compare/discussions/community_trust_test.exs`
- `test/product_compare/discussions/thread_post_validation_test.exs`
- `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `test/product_compare/comparison_snapshot_consistency_test.exs`
- `test/product_compare/alerts/alerts_test.exs`
- affected owner and direct-write suites named below
- `docs/work/database-constraint-application-parity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`

## Internal Slices

1. Immutable snapshot, alert-event, and watch-baseline numeric validation parity.
2. Affiliate-link, write-window, ingestion-terminal, and thread-parent same-row parity, including explicit transaction ownership for direct post creation and write-limit accounting.
3. Existing-validator error mappings, redundant price-check retirement, permanent guidance, and one consolidated closeout.

### Task 1: Promote The Consolidated Batch And Record The Permanent Rule

**Files:**

- Create: `docs/work/database-constraint-application-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `AGENTS.md`

**Interfaces:**

- Consumes: approved design `docs/superpowers/specs/2026-08-09-database-constraint-application-parity-design.md` and the current zero-ready floor exception.
- Produces: one `ready` queue row, its lane contract, and repository guidance governing every later migration and changeset edit.

- [ ] **Step 1: Write the prospective lane contract**

  Record `Status: ready`, the approved design and this plan, the exact owned paths, the three internal slices, existing-constraint prerequisites, focused verification commands, transaction evidence, and the one-batch exit condition.

- [ ] **Step 2: Promote exactly one ready row**

  Add `Database Constraint Application Parity` to Ready Work. Replace the
  zero-ready exception with a one-ready exception recording that this newly
  approved integrity outcome is the only independently shippable candidate
  validated by the audit. State that numeric, cross-field, mapping, migration,
  test, and guidance work are internal slices rather than reserve rows.

- [ ] **Step 3: Add the repository guidance**

  Append this section to `AGENTS.md`:

  ```markdown
  ## Database Constraint Contract

  - Every application-owned same-row PostgreSQL `CHECK` constraint reachable
    through an Ecto changeset must have equivalent pre-write validation, an
    explicit `check_constraint/3` mapping, a changeset behavior test, and direct
    database coverage in the same batch.
  - A trigger-maintained table without an application write changeset may be an
    exception only when the originating values are validated and the trigger
    executes inside the originating SQL statement; document and test the
    exception.
  - Uniqueness, foreign keys, and cross-row invariants remain
    database-authoritative. Do not replace them with a race-prone preflight
    query.
  - When a write depends on an earlier read, perform the read, required row
    lock, and write in one `Repo.transaction/2`, or use one atomic statement.
    A lone constrained statement already has PostgreSQL statement atomicity and
    does not need a ceremonial wrapper transaction.
  - A migration that adds or changes a constraint must update its owning
    changeset contract and focused tests in the same batch.
  ```

- [ ] **Step 4: Reconcile the candidate catalog and validate dispatch**

  Add one `ready` candidate to `docs/plans/INDEX.md`, preserving the design's explicit exclusion of a meta-policy test or generic abstraction. Run:

  ```bash
  mix work_queue.validate
  git diff --check
  ```

  Expected: `work queue valid: 1 ready row` and no diff errors.

- [ ] **Step 5: Commit the dispatch milestone**

  ```bash
  git add AGENTS.md docs/work/index.md docs/work/database-constraint-application-parity.md docs/plans/INDEX.md
  git commit -m "docs: dispatch database constraint parity"
  ```

### Task 2: Prevalidate Immutable Numeric Facts At Their Final Changesets

**Files:**

- Modify: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Modify: `lib/product_compare_schemas/catalog/comparison_snapshot/attribute.ex`
- Modify: `lib/product_compare_schemas/catalog/comparison_snapshot/offer.ex`
- Modify: `lib/product_compare_schemas/catalog/comparison_snapshot/ranking.ex`
- Modify: `lib/product_compare_schemas/alerts/alert_event.ex`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Modify: `docs/work/database-constraint-application-parity.md`

**Interfaces:**

- Consumes: the five existing PostgreSQL captured-numeric checks and `ProductCompareSchemas.Schema.normalize_non_finite_decimals/2`.
- Produces: final-boundary changesets that reject negative and non-finite copied facts before SQL while retaining mapped database errors.

- [ ] **Step 1: Add failing changeset tests**

  Add aliases for `AlertEvent`, snapshot `Attribute`, `Offer`, and `Ranking`, then add pre-write assertions equivalent to:

  ```elixir
  test "captured numeric owner changesets reject invalid copied facts before SQL" do
    refute SnapshotAttribute.changeset(%SnapshotAttribute{}, %{
             snapshot_product_id: 1,
             position: 1,
             attribute_id: 1,
             claim_id: 1,
             code: "weight",
             display_name: "Weight",
             value_text: "1 kg",
             source_type: :user,
             confidence: Decimal.new("1.01")
           }).valid?

    refute SnapshotOffer.changeset(%SnapshotOffer{}, valid_offer_attrs(%{
             shipping: Decimal.new("-0.01")
           })).valid?

    refute SnapshotRanking.changeset(%SnapshotRanking{}, valid_ranking_attrs(%{
             landed_price: Decimal.new("-0.01")
           })).valid?

    refute AlertEvent.changeset(%AlertEvent{}, valid_alert_attrs(%{
             percentage_drop: Decimal.new("100.01")
           })).valid?
  end
  ```

  Add one loop per numeric owner for `Decimal.new("NaN")`, `Decimal.new("Infinity")`, and negative values where the database check rejects them. Assert errors exist on the exact owning fields without invoking `Repo.insert/2`.

  Extend the price-watch test so `create_changeset/2` rejects negative, `NaN`, and `Infinity` `baseline_landed_price` values before SQL while preserving nullable and zero controls.

- [ ] **Step 2: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs
  ```

  Expected: the new changeset assertions fail because only PostgreSQL currently enforces these copied-fact bounds.

- [ ] **Step 3: Normalize and validate each final owner**

  In each changeset, normalize only its constrained decimal fields before `cast/3`, then use local number validations:

  ```elixir
  attrs = Schema.normalize_non_finite_decimals(attrs, [:confidence])

  |> validate_number(:confidence,
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 1
  )
  |> check_constraint(:confidence,
    name: :comparison_snapshot_attributes_confidence_range
  )
  ```

  ```elixir
  attrs =
    Schema.normalize_non_finite_decimals(attrs, [:item_price, :shipping, :landed_price])

  |> validate_number(:item_price, greater_than_or_equal_to: 0)
  |> validate_number(:shipping, greater_than_or_equal_to: 0)
  |> validate_number(:landed_price, greater_than_or_equal_to: 0)
  |> check_constraint(:item_price,
    name: :comparison_snapshot_offers_amounts_non_negative
  )
  ```

  Apply the same local pattern to ranking `landed_price`; alert-event item, shipping, landed, baseline, target, and percentage values; and watch baseline values. Map `alert_events_numeric_evidence_bounds` to `:item_price`, the first required numeric owner. Do not extract a shared validator.

- [ ] **Step 4: Verify GREEN and transaction regressions**

  Run:

  ```bash
  mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs test/product_compare/comparison_snapshot_consistency_test.exs test/product_compare/comparison_snapshots_test.exs test/product_compare/alerts/alerts_test.exs
  ```

  Expected: direct SQL checks, pre-write changesets, snapshot rollback behavior, and locked alert evaluation all pass.

- [ ] **Step 5: Record evidence and commit**

  Add RED/GREEN counts and the preserved snapshot/alert transaction evidence to the lane doc, then run `git diff --check` and commit:

  ```bash
  git add lib/product_compare_schemas/catalog/comparison_snapshot/attribute.ex lib/product_compare_schemas/catalog/comparison_snapshot/offer.ex lib/product_compare_schemas/catalog/comparison_snapshot/ranking.ex lib/product_compare_schemas/alerts/alert_event.ex lib/product_compare_schemas/alerts/price_watch_rule.ex test/product_compare/repo/captured_numeric_evidence_constraints_test.exs docs/work/database-constraint-application-parity.md
  git commit -m "fix: prevalidate captured numeric constraints"
  ```

### Task 3: Prevalidate Cross-Field And State Checks And Close Transaction Gaps

**Files:**

- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare/discussions/community_trust_test.exs`
- Modify: `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- Modify: `test/product_compare/discussions/thread_post_validation_test.exs`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_link.ex`
- Modify: `lib/product_compare_schemas/discussions/community_write_window.ex`
- Modify: `lib/product_compare_schemas/ingestion/import_run.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Modify: `lib/product_compare/discussions/content_lifecycle.ex`
- Modify: `lib/product_compare/discussions/submissions/write_limits.ex`
- Modify: `docs/work/database-constraint-application-parity.md`

**Interfaces:**

- Consumes: four existing named PostgreSQL checks and the discussion read-modify-write paths that validate parents or update hourly counters.
- Produces: same-row pre-write errors without a repository read, a transaction-owning direct post-creation path, and a write-limit primitive that cannot silently release its lock before updating.

- [ ] **Step 1: Add failing owner tests**

  Add these behavior cases to their domain suites:

  ```elixir
  refute CommerceLink.changeset(%CommerceLink{}, %{
           merchant_id: 1,
           destination_url: "https://merchant.example/product",
           link_type: :affiliate
         }).valid?

  refute CommunityWriteWindow.changeset(%CommunityWriteWindow{}, %{
           user_id: 1,
           action_kind: :review,
           window_started_at: ~U[2026-08-09 12:01:00Z],
           count: 0
         }).valid?

  refute ImportRun.changeset(%ImportRun{}, %{
           source_id: 1,
           surface: "shoppingProducts",
           query: %{},
           status: :succeeded,
           started_at: ~U[2026-08-09 12:00:00Z]
         }).valid?

  refute ThreadPost.changeset(
           %ThreadPost{id: 10, thread_id: 20, user_id: 30, body_md: "post"},
           %{parent_post_id: 10}
         ).valid?
  ```

  Preserve positive controls for non-affiliate links, UTC hour boundaries, running ingestion without `finished_at`, terminal ingestion with it, and a different parent id. Assert the direct ThreadPost schema test still emits no SELECT query.

  Add two transaction regressions:

  - in an unboxed connection, hold the target `product_threads` row lock, start
    direct `Discussions.create_post/1` on a second connection, assert that it is
    blocked by the holder before any post appears, then release the holder and
    assert the post commits; and
  - in an unboxed connection, call `WriteLimits.increment!/2` directly outside
    a transaction and assert it raises before inserting or updating a
    `community_write_windows` row, while an existing submission path still
    increments successfully inside its outer transaction.

- [ ] **Step 2: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs test/product_compare/discussions/thread_post_validation_test.exs
  ```

  Expected: the four new pre-write cases fail because their checks are currently database-first or only partially validated.

- [ ] **Step 3: Add minimal same-row validators**

  Implement local validators with no `Repo` dependency and preserve the
  existing database-mapped error text:

  ```elixir
  defp validate_affiliate_program(changeset) do
    if get_field(changeset, :link_type) == :affiliate and
         is_nil(get_field(changeset, :affiliate_program_id)) do
      add_error(changeset, :affiliate_program_id, "is invalid")
    else
      changeset
    end
  end
  ```

  ```elixir
  defp validate_hour_boundary(changeset) do
    case get_field(changeset, :window_started_at) do
      %DateTime{minute: 0, second: 0, microsecond: {0, _precision}} -> changeset
      %DateTime{} -> add_error(changeset, :window_started_at, "is invalid")
      _missing_or_invalid -> changeset
    end
  end
  ```

  Add corresponding local functions for terminal status requiring `finished_at`
  and persisted posts rejecting `parent_post_id == post.id`. Use the existing
  mapped error text for terminal timestamps and `"cannot create a cycle"` for
  self-parenting. Keep existing same-thread and cycle validation in the
  Discussions context.

  Ensure all four changesets retain their existing `check_constraint/3` mappings; add `thread_posts_parent_not_self_check` because it is currently missing.

- [ ] **Step 4: Put the dependent discussion operations behind enforceable transaction boundaries**

  Build the direct `ContentLifecycle.create_post/1` changeset before opening a
  transaction. Return an already-invalid changeset without SQL. For a valid
  changeset, use `Repo.transaction/2`, lock its target `ProductThread` row with
  `FOR UPDATE` when that row exists, perform `validate_post_parent/1`, and
  insert or roll back the changeset. Preserve the existing `{:ok, post} |
  {:error, changeset}` public result and let the insert's foreign-key mapping
  handle a nonexistent thread rather than raising during the lock lookup.

  At the top of `WriteLimits.increment!/2`, verify `Repo.in_transaction?/0` and
  raise a clear `ArgumentError` before calculating or persisting the counter
  when the function is used outside its required outer transaction. Keep the
  existing insert, `FOR UPDATE` read, limit decision, and update unchanged.

- [ ] **Step 5: Verify GREEN and race safety**

  Run the RED command again, followed by:

  ```bash
  mix test test/product_compare/comparison_snapshot_consistency_test.exs test/product_compare/alerts/alerts_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/ingestion/reconciliation_test.exs test/product_compare/affiliate/affiliate_workflows_test.exs
  ```

  Require the inverse-parent concurrency test to retain its blocking order and
  one-winner result. Require the schema-only parent test to retain zero SELECTs.
  Require the direct-create transaction regression and out-of-transaction
  write-limit rejection to pass, along with the existing in-transaction
  submission cases. Inspect each changed context and record in the lane doc
  whether it uses one statement or an explicit transaction with its current
  lock; do not add a wrapper transaction where no dependent read exists.

- [ ] **Step 6: Commit the cross-field and transaction milestone**

  ```bash
  git add lib/product_compare_schemas/commerce_attribution/commerce_link.ex lib/product_compare_schemas/discussions/community_write_window.ex lib/product_compare_schemas/ingestion/import_run.ex lib/product_compare_schemas/discussions/thread_post.ex lib/product_compare/discussions/content_lifecycle.ex lib/product_compare/discussions/submissions/write_limits.ex test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs test/product_compare/discussions/thread_post_validation_test.exs docs/work/database-constraint-application-parity.md
  git commit -m "fix: enforce cross-field constraint parity"
  ```

### Task 4: Map Existing Validators And Remove Redundant Price Checks

**Files:**

- Create: `test/product_compare/repo/check_constraint_error_mapping_test.exs`
- Create: `priv/repo/migrations/20260809130300_remove_redundant_price_point_checks.exs`
- Modify: the eleven existing-validator owner schemas listed below
- Modify: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Modify: `docs/work/database-constraint-application-parity.md`

**Interfaces:**

- Consumes: eleven existing changeset validators, their named PostgreSQL checks, and the mapped finite price-point checks.
- Produces: explicit Ecto error mappings for every reachable current owner and one canonical pair of price checks.

- [ ] **Step 1: Add the failing mapping regression**

  Create a focused test that builds each owner changeset and uses the public `Ecto.Changeset.constraints/1` API:

  ```elixir
  defp assert_maps_check(changeset, constraint) do
    assert Enum.any?(Ecto.Changeset.constraints(changeset), fn mapping ->
             mapping.type == :check and mapping.constraint == constraint
           end),
           "expected #{inspect(changeset.data.__struct__)} to map #{constraint}"
  end
  ```

  Assert these exact schema/name pairs:

  ```elixir
  CategoryMappingCandidate => :category_mapping_candidates_observation_count_positive
  ClaimDependency => :claim_dependencies_not_self
  CommunityReport => :community_reports_one_target
  ImportRun => :ingestion_runs_offers_deactivated_non_negative
  ProductAttributeClaim => :product_attribute_claim_single_typed_value
  ProductAttributeClaim => :product_attribute_claims_confidence_range
  ProductMedia => :product_media_position_non_negative
  ProductReview => :product_reviews_rating_range
  ProductTaxon => :product_taxons_confidence_range
  SavedComparisonItem => :saved_comparison_items_position_range
  TaxonClosure => :taxon_closure_depth_nonnegative
  ```

  This is a regression for the current fixes only. Do not query `pg_constraint`, discover modules, or turn it into a future-policy meta-test.

- [ ] **Step 2: Add the failing canonical-price catalog assertion**

  Extend the captured numeric evidence suite with:

  ```elixir
  assert active_check_names("price_points") == [
           "price_points_price_finite_non_negative",
           "price_points_shipping_finite_non_negative"
         ]
  ```

  Filter only application price checks so unrelated table constraints do not couple the assertion to indexes or foreign keys.

- [ ] **Step 3: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/check_constraint_error_mapping_test.exs test/product_compare/repo/captured_numeric_evidence_constraints_test.exs
  ```

  Expected: eleven mapping-name assertions fail and the price catalog includes the two obsolete lower-bound checks.

- [ ] **Step 4: Add the eleven explicit mappings**

  Add these exact calls beside their existing validators:

  ```elixir
  |> check_constraint(:observation_count,
    name: :category_mapping_candidates_observation_count_positive
  )
  |> check_constraint(:depends_on_claim_id, name: :claim_dependencies_not_self)
  |> check_constraint(:target, name: :community_reports_one_target)
  |> check_constraint(:offers_deactivated,
    name: :ingestion_runs_offers_deactivated_non_negative
  )
  |> check_constraint(:base, name: :product_attribute_claim_single_typed_value)
  |> check_constraint(:confidence, name: :product_attribute_claims_confidence_range)
  |> check_constraint(:position, name: :product_media_position_non_negative)
  |> check_constraint(:rating, name: :product_reviews_rating_range)
  |> check_constraint(:confidence, name: :product_taxons_confidence_range)
  |> check_constraint(:position, name: :saved_comparison_items_position_range)
  |> check_constraint(:depth, name: :taxon_closure_depth_nonnegative)
  ```

  Do not change the existing validation messages or accepted ranges.

- [ ] **Step 5: Add and apply the reversible cleanup migration**

  Create:

  ```elixir
  defmodule ProductCompare.Repo.Migrations.RemoveRedundantPricePointChecks do
    use Ecto.Migration

    def up do
      drop constraint(:price_points, :price_must_be_non_negative)
      drop constraint(:price_points, :shipping_must_be_non_negative)
    end

    def down do
      create constraint(:price_points, :price_must_be_non_negative, check: "price >= 0")

      create constraint(:price_points, :shipping_must_be_non_negative,
               check: "shipping IS NULL OR shipping >= 0"
             )
    end
  end
  ```

  Run:

  ```bash
  MIX_ENV=test mix ecto.migrate
  MIX_ENV=test mix ecto.rollback --step 1
  MIX_ENV=test mix ecto.migrate
  ```

  Expected: the migration applies, its `down/0` restores the two legacy checks,
  and the final re-apply leaves only the canonical finite, non-negative checks.

- [ ] **Step 6: Verify GREEN and owner regressions**

  Run the RED command again, then:

  ```bash
  mix test test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/product_attribute_claim_db_constraint_test.exs test/product_compare/taxonomy/taxon_closure_test.exs test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/ingestion/enrichment_test.exs
  ```

  Expected: all mapping metadata, direct database checks, owner validations, and the canonical price catalog pass.

- [ ] **Step 7: Record evidence and commit**

  ```bash
  git add priv/repo/migrations/20260809130300_remove_redundant_price_point_checks.exs lib/product_compare_schemas/ingestion/category_mapping_candidate.ex lib/product_compare_schemas/specs/claim_dependency.ex lib/product_compare_schemas/discussions/community_report.ex lib/product_compare_schemas/ingestion/import_run.ex lib/product_compare_schemas/specs/product_attribute_claim.ex lib/product_compare_schemas/catalog/product_media.ex lib/product_compare_schemas/discussions/product_review.ex lib/product_compare_schemas/taxonomy/product_taxon.ex lib/product_compare_schemas/catalog/saved_comparison_item.ex lib/product_compare_schemas/taxonomy/taxon_closure.ex test/product_compare/repo/check_constraint_error_mapping_test.exs test/product_compare/repo/captured_numeric_evidence_constraints_test.exs docs/work/database-constraint-application-parity.md
  git commit -m "fix: map application database constraints"
  ```

### Task 5: Verify And Close One Parity Batch

**Files:**

- Modify: `docs/work/database-constraint-application-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`

**Interfaces:**

- Consumes: three GREEN internal slices, explicit transaction evidence, and the permanent `AGENTS.md` contract.
- Produces: one completed batch record, no active row, and a truthful zero-ready floor exception.

- [ ] **Step 1: Repeat the live constraint-to-owner reconciliation**

  Query the test database's active application-owned `CHECK` constraints again,
  excluding the five Oban-owned checks. Reconcile every remaining name against
  its owning changeset validation and `check_constraint/3` mapping. Record the
  post-migration catalog total, the mapped/prevalidated total, and the sole
  `product_slug_reservations_slug_format_check` trigger exception in the lane
  doc. This is one-time closeout evidence; do not commit a catalog scanner or
  inferred-equivalence meta-test.

- [ ] **Step 2: Run the complete affected boundary**

  Run:

  ```bash
  mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs test/product_compare/repo/check_constraint_error_mapping_test.exs test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs test/product_compare/comparison_snapshot_consistency_test.exs test/product_compare/comparison_snapshots_test.exs test/product_compare/alerts/alerts_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare/discussions/community_trust_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/affiliate/affiliate_workflows_test.exs test/product_compare/ingestion/reconciliation_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/product_attribute_claim_db_constraint_test.exs test/product_compare/taxonomy/taxon_closure_test.exs test/product_compare/catalog/saved_comparison_set_test.exs
  ```

- [ ] **Step 3: Run repository gates**

  Run fresh commands and read their exit statuses:

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Record one observed closeout**

  Change the lane to `Status: complete`, replace prospective language with the observed constraint, validation, mapping, migration, test-count, and transaction evidence, and retain the reservation exception. Remove the active row from `docs/work/index.md`; keep a zero-ready Ready Floor Exception that rejects the completed internal slices as filler. Mark the one catalog candidate complete and add one completion-history entry.

- [ ] **Step 5: Commit the verified closeout**

  ```bash
  git add docs/work/database-constraint-application-parity.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-31-work-index-history.md
  git commit -m "docs: close database constraint parity batch"
  ```

Exit condition: every active application same-row check with a reachable changeset is prevalidated and mapped, the reservation table remains the one documented trigger exception, redundant price checks are gone, dependent read/write paths retain their transaction and locking evidence, the permanent guidance is committed, all gates pass, and the queue closes exactly one batch.

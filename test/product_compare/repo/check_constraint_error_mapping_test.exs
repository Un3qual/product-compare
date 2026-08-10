defmodule ProductCompare.Repo.CheckConstraintErrorMappingTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.CJIngestionFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Catalog.SavedComparisonItem
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Ingestion.CategoryMappingCandidate
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.ClaimDependency
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Taxonomy.ProductTaxon
  alias ProductCompareSchemas.Taxonomy.TaxonClosure

  test "category mapping candidates map their positive observation count check" do
    assert_maps_check(
      CategoryMappingCandidate.changeset(%CategoryMappingCandidate{}, %{}),
      "category_mapping_candidates_observation_count_positive"
    )
  end

  test "category mapping candidates reject non-positive observation counts before SQL" do
    changeset =
      CategoryMappingCandidate.changeset(%CategoryMappingCandidate{}, %{observation_count: 0})

    refute changeset.valid?
    assert "must be greater than 0" in errors_on(changeset).observation_count
  end

  test "claim dependencies map their self-reference check" do
    assert_maps_check(
      ClaimDependency.changeset(%ClaimDependency{}, %{}),
      "claim_dependencies_not_self"
    )
  end

  test "claim dependencies reject self references before SQL" do
    changeset =
      ClaimDependency.changeset(%ClaimDependency{}, %{claim_id: 1, depends_on_claim_id: 1})

    refute changeset.valid?

    assert "must not reference the same claim" in errors_on(changeset).depends_on_claim_id
  end

  test "community reports map their single-target check" do
    assert_maps_check(
      CommunityReport.changeset(%CommunityReport{}, %{}),
      "community_reports_one_target"
    )
  end

  test "community reports enforce exactly one target before SQL" do
    base_attrs = %{reporter_id: 1, reason: "Constraint parity report"}

    assert CommunityReport.changeset(%CommunityReport{}, Map.put(base_attrs, :review_id, 1)).valid?

    for target_attrs <- [%{}, %{review_id: 1, thread_id: 2}] do
      changeset =
        CommunityReport.changeset(%CommunityReport{}, Map.merge(base_attrs, target_attrs))

      refute changeset.valid?
      assert "must select one item" in errors_on(changeset).target
    end
  end

  test "import runs map their deactivated-offer count check" do
    assert_maps_check(
      ImportRun.changeset(%ImportRun{}, %{}),
      "ingestion_runs_offers_deactivated_non_negative"
    )
  end

  test "import runs reject negative deactivated-offer counts before SQL" do
    changeset =
      ImportRun.changeset(%ImportRun{}, %{
        source_id: 1,
        surface: "shoppingProducts",
        query: %{},
        status: :running,
        started_at: DateTime.utc_now(),
        offers_deactivated: -1
      })

    refute changeset.valid?

    assert "must be greater than or equal to 0" in errors_on(changeset).offers_deactivated
  end

  test "product attribute claims map their single typed value check" do
    assert_maps_check(
      ProductAttributeClaim.changeset(%ProductAttributeClaim{}, %{}),
      "product_attribute_claim_single_typed_value"
    )
  end

  test "product attribute claims map their confidence range check" do
    assert_maps_check(
      ProductAttributeClaim.changeset(%ProductAttributeClaim{}, %{}),
      "product_attribute_claims_confidence_range"
    )
  end

  test "product media map their non-negative position check" do
    assert_maps_check(
      ProductMedia.changeset(%ProductMedia{}, %{}),
      "product_media_position_non_negative"
    )
  end

  test "product media reject negative positions before SQL" do
    changeset =
      ProductMedia.changeset(%ProductMedia{}, %{
        product_id: 1,
        url: "https://example.test/media.jpg",
        role: :gallery,
        position: -1,
        observed_at: DateTime.utc_now()
      })

    refute changeset.valid?
    assert "must be greater than or equal to 0" in errors_on(changeset).position
  end

  test "product reviews map their rating range check" do
    assert_maps_check(
      ProductReview.changeset(%ProductReview{}, %{}),
      "product_reviews_rating_range"
    )
  end

  test "product reviews reject ratings outside one through five before SQL" do
    for {rating, message} <- [
          {0, "must be greater than or equal to 1"},
          {6, "must be less than or equal to 5"}
        ] do
      changeset =
        ProductReview.changeset(%ProductReview{}, %{
          product_id: 1,
          user_id: 2,
          rating: rating
        })

      refute changeset.valid?
      assert message in errors_on(changeset).rating
    end
  end

  test "product taxons map their confidence range check" do
    assert_maps_check(
      ProductTaxon.changeset(%ProductTaxon{}, %{}),
      "product_taxons_confidence_range"
    )
  end

  test "saved comparison items map their position range check" do
    assert_maps_check(
      SavedComparisonItem.changeset(%SavedComparisonItem{}, %{}),
      "saved_comparison_items_position_range"
    )
  end

  test "saved comparison items reject positions outside one through three before SQL" do
    for {position, message} <- [
          {0, "must be greater than or equal to 1"},
          {4, "must be less than or equal to 3"}
        ] do
      changeset =
        SavedComparisonItem.changeset(%SavedComparisonItem{}, %{
          saved_comparison_set_id: 1,
          product_id: 2,
          position: position
        })

      refute changeset.valid?
      assert message in errors_on(changeset).position
    end
  end

  test "taxon closure rows map their non-negative depth check" do
    assert_maps_check(
      TaxonClosure.changeset(%TaxonClosure{}, %{}),
      "taxon_closure_depth_nonnegative"
    )
  end

  test "taxon closure rows reject negative depths before SQL" do
    changeset =
      TaxonClosure.changeset(%TaxonClosure{}, %{
        ancestor_id: 1,
        descendant_id: 2,
        depth: -1
      })

    refute changeset.valid?
    assert "must be greater than or equal to 0" in errors_on(changeset).depth
  end

  test "category mapping candidates enforce a positive observation count in PostgreSQL" do
    source = CJIngestionFixtures.source_fixture()
    suffix = System.unique_integer([:positive])

    assert {:ok, _result} =
             insert_category_mapping_candidate(source.id, "valid-#{suffix}", 1)

    assert_check_violation(
      insert_category_mapping_candidate(source.id, "invalid-#{suffix}", 0),
      "category_mapping_candidates_observation_count_positive"
    )
  end

  test "claim dependencies reject self references in PostgreSQL" do
    product = SpecsFixtures.product_fixture()
    attribute = SpecsFixtures.attribute_fixture()
    first_claim_id = insert_boolean_claim!(product.id, attribute.id, true)
    second_claim_id = insert_boolean_claim!(product.id, attribute.id, false)

    assert {:ok, _result} = insert_claim_dependency(first_claim_id, second_claim_id)

    assert_check_violation(
      insert_claim_dependency(first_claim_id, first_claim_id),
      "claim_dependencies_not_self"
    )
  end

  test "community reports require exactly one target in PostgreSQL" do
    review_author = AccountsFixtures.user_fixture()
    reporter = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()

    {:ok, %{rows: [[review_id]]}} =
      Repo.query(
        """
        INSERT INTO product_reviews (
          product_id, user_id, rating, inserted_at, updated_at
        )
        VALUES ($1, $2, 5, now(), now())
        RETURNING id
        """,
        [product.id, review_author.id]
      )

    assert {:ok, _result} = insert_community_report(reporter.id, review_id)

    assert_check_violation(
      insert_community_report(AccountsFixtures.user_fixture().id, nil),
      "community_reports_one_target"
    )
  end

  test "ingestion runs enforce non-negative deactivated offer counts in PostgreSQL" do
    source = CJIngestionFixtures.source_fixture()

    assert {:ok, _result} = insert_ingestion_run(source.id, 0)

    assert_check_violation(
      insert_ingestion_run(source.id, -1),
      "ingestion_runs_offers_deactivated_non_negative"
    )
  end

  test "product media enforce non-negative positions in PostgreSQL" do
    product = SpecsFixtures.product_fixture()
    suffix = System.unique_integer([:positive])

    assert {:ok, _result} = insert_product_media(product.id, "valid-#{suffix}", 0)

    assert_check_violation(
      insert_product_media(product.id, "invalid-#{suffix}", -1),
      "product_media_position_non_negative"
    )
  end

  test "product reviews enforce their rating range in PostgreSQL" do
    product = SpecsFixtures.product_fixture()

    assert {:ok, _result} =
             insert_product_review(product.id, AccountsFixtures.user_fixture().id, 5)

    assert_check_violation(
      insert_product_review(product.id, AccountsFixtures.user_fixture().id, 0),
      "product_reviews_rating_range"
    )
  end

  test "product taxons enforce their confidence range in PostgreSQL" do
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    first_taxon = TaxonomyFixtures.taxon_fixture(%{})
    second_taxon = TaxonomyFixtures.taxon_fixture(%{})

    assert {:ok, _result} = insert_product_taxon(first_product.id, first_taxon.id, 1)

    assert_check_violation(
      insert_product_taxon(second_product.id, second_taxon.id, Decimal.new("1.01")),
      "product_taxons_confidence_range"
    )
  end

  test "saved comparison items enforce their position range in PostgreSQL" do
    user = AccountsFixtures.user_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()

    {:ok, %{rows: [[comparison_set_id]]}} =
      Repo.query(
        """
        INSERT INTO saved_comparison_sets (user_id, name, inserted_at, updated_at)
        VALUES ($1, 'Constraint parity set', now(), now())
        RETURNING id
        """,
        [user.id]
      )

    assert {:ok, _result} = insert_saved_comparison_item(comparison_set_id, first_product.id, 1)

    assert_check_violation(
      insert_saved_comparison_item(comparison_set_id, second_product.id, 0),
      "saved_comparison_items_position_range"
    )
  end

  test "taxon closure rows enforce non-negative depth in PostgreSQL" do
    taxonomy =
      TaxonomyFixtures.taxonomy_fixture(
        "constraint-parity-#{System.unique_integer([:positive])}",
        "Constraint parity"
      )

    first_taxon = TaxonomyFixtures.taxon_fixture(%{taxonomy_id: taxonomy.id})
    second_taxon = TaxonomyFixtures.taxon_fixture(%{taxonomy_id: taxonomy.id})

    assert {:ok, _result} = insert_taxon_closure(first_taxon.id, second_taxon.id, 1)

    assert_check_violation(
      insert_taxon_closure(second_taxon.id, first_taxon.id, -1),
      "taxon_closure_depth_nonnegative"
    )
  end

  defp insert_category_mapping_candidate(source_id, path, observation_count) do
    Repo.query(
      """
      INSERT INTO category_mapping_candidates (
        source_id, display_path, normalized_path, observation_count,
        last_seen_at, inserted_at, updated_at
      )
      VALUES ($1, $2, $2, $3, now(), now(), now())
      """,
      [source_id, path, observation_count]
    )
  end

  defp insert_boolean_claim!(product_id, attribute_id, value) do
    {:ok, %{rows: [[claim_id]]}} =
      Repo.query(
        """
        INSERT INTO product_attribute_claims (
          product_id, attribute_id, source_type, status, value_bool, inserted_at
        )
        VALUES ($1, $2, 'user', 'proposed', $3, now())
        RETURNING id
        """,
        [product_id, attribute_id, value]
      )

    claim_id
  end

  defp insert_claim_dependency(claim_id, depends_on_claim_id) do
    Repo.query(
      """
      INSERT INTO claim_dependencies (claim_id, depends_on_claim_id, inserted_at)
      VALUES ($1, $2, now())
      """,
      [claim_id, depends_on_claim_id]
    )
  end

  defp insert_community_report(reporter_id, review_id) do
    Repo.query(
      """
      INSERT INTO community_reports (reporter_id, review_id, reason, inserted_at)
      VALUES ($1, $2, 'Constraint parity report', now())
      """,
      [reporter_id, review_id]
    )
  end

  defp insert_ingestion_run(source_id, offers_deactivated) do
    Repo.query(
      """
      INSERT INTO ingestion_runs (
        source_id, integration_surface_id, status, started_at,
        offers_deactivated, inserted_at, updated_at
      )
      VALUES ($1, 1, 'running', now(), $2, now(), now())
      """,
      [source_id, offers_deactivated]
    )
  end

  defp insert_product_media(product_id, suffix, position) do
    Repo.query(
      """
      INSERT INTO product_media (
        product_id, url, role, position, observed_at, inserted_at, updated_at
      )
      VALUES ($1, $2, 'gallery', $3, now(), now(), now())
      """,
      [product_id, "https://#{suffix}.example/media.jpg", position]
    )
  end

  defp insert_product_review(product_id, user_id, rating) do
    Repo.query(
      """
      INSERT INTO product_reviews (product_id, user_id, rating, inserted_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      """,
      [product_id, user_id, rating]
    )
  end

  defp insert_product_taxon(product_id, taxon_id, confidence) do
    Repo.query(
      """
      INSERT INTO product_taxons (
        product_id, taxon_id, source_type, confidence, inserted_at
      )
      VALUES ($1, $2, 'user', $3, now())
      """,
      [product_id, taxon_id, confidence]
    )
  end

  defp insert_saved_comparison_item(comparison_set_id, product_id, position) do
    Repo.query(
      """
      INSERT INTO saved_comparison_items (
        saved_comparison_set_id, product_id, position, inserted_at
      )
      VALUES ($1, $2, $3, now())
      """,
      [comparison_set_id, product_id, position]
    )
  end

  defp insert_taxon_closure(ancestor_id, descendant_id, depth) do
    Repo.query(
      """
      INSERT INTO taxon_closure (ancestor_id, descendant_id, depth, inserted_at)
      VALUES ($1, $2, $3, now())
      """,
      [ancestor_id, descendant_id, depth]
    )
  end

  defp assert_maps_check(changeset, constraint) do
    assert Enum.any?(Ecto.Changeset.constraints(changeset), fn mapping ->
             mapping.type == :check and mapping.constraint == constraint
           end),
           "expected #{inspect(changeset.data.__struct__)} to map #{constraint}"
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end

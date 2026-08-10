defmodule ProductCompare.Repo.CheckConstraintErrorMappingTest do
  use ExUnit.Case, async: true

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

  test "claim dependencies map their self-reference check" do
    assert_maps_check(
      ClaimDependency.changeset(%ClaimDependency{}, %{}),
      "claim_dependencies_not_self"
    )
  end

  test "community reports map their single-target check" do
    assert_maps_check(
      CommunityReport.changeset(%CommunityReport{}, %{}),
      "community_reports_one_target"
    )
  end

  test "import runs map their deactivated-offer count check" do
    assert_maps_check(
      ImportRun.changeset(%ImportRun{}, %{}),
      "ingestion_runs_offers_deactivated_non_negative"
    )
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

  test "product reviews map their rating range check" do
    assert_maps_check(
      ProductReview.changeset(%ProductReview{}, %{}),
      "product_reviews_rating_range"
    )
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

  test "taxon closure rows map their non-negative depth check" do
    assert_maps_check(
      TaxonClosure.changeset(%TaxonClosure{}, %{}),
      "taxon_closure_depth_nonnegative"
    )
  end

  defp assert_maps_check(changeset, constraint) do
    assert Enum.any?(Ecto.Changeset.constraints(changeset), fn mapping ->
             mapping.type == :check and mapping.constraint == constraint
           end),
           "expected #{inspect(changeset.data.__struct__)} to map #{constraint}"
  end
end

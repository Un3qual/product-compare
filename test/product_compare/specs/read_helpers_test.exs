defmodule ProductCompare.Specs.ReadHelpersTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @overflow_id 9_223_372_036_854_775_808
  @invalid_ids [nil, "1", 0, -1, @overflow_id]

  describe "single-ID read helpers" do
    test "return nil, false, or empty results for invalid IDs" do
      Enum.each(@invalid_ids, fn invalid_id ->
        refute Specs.get_filterable_attribute(invalid_id, :bool)
        refute Specs.enum_option_belongs_to_attribute?(invalid_id, 1)
        refute Specs.enum_option_belongs_to_attribute?(1, invalid_id)
        assert Specs.list_enum_options_for_set(invalid_id) == []
        refute Specs.unit_symbol_for_dimension(invalid_id)
        assert Specs.list_current_attributes_for_product(invalid_id) == []
      end)
    end
  end

  describe "list-based read helpers" do
    test "ignore invalid IDs while preserving valid ID results" do
      dimension = SpecsFixtures.dimension_fixture()
      unit = SpecsFixtures.unit_fixture(%{dimension: dimension, symbol: "Hz"})

      filterable_attribute =
        SpecsFixtures.attribute_fixture(%{
          data_type: :bool,
          is_filterable: true
        })

      {:ok, enum_set} = Specs.upsert_enum_set(%{code: unique_code("read-helper-enum-set")})

      {:ok, enum_option} =
        Specs.upsert_enum_option(%{
          enum_set_id: enum_set.id,
          code: unique_code("read-helper-enum-option"),
          label: "OLED",
          sort_order: 1
        })

      enum_attribute =
        SpecsFixtures.attribute_fixture(%{
          data_type: :enum,
          enum_set_id: enum_set.id,
          is_filterable: true
        })

      assert Specs.filterable_attribute_types([filterable_attribute.id | @invalid_ids]) == %{
               filterable_attribute.id => :bool
             }

      assert Specs.filterable_enum_option_pairs(
               [enum_attribute.id | @invalid_ids],
               [enum_option.id | @invalid_ids]
             ) == MapSet.new([{enum_attribute.id, enum_option.id}])

      assert Specs.list_enum_options_for_sets([enum_set.id | @invalid_ids]) == %{
               enum_set.id => [enum_option]
             }

      assert Specs.unit_symbols_for_dimensions([dimension.id | @invalid_ids]) == %{
               dimension.id => unit.symbol
             }
    end

    test "return empty results when every ID is invalid" do
      assert Specs.filterable_attribute_types(@invalid_ids) == %{}
      assert Specs.filterable_enum_option_pairs(@invalid_ids, @invalid_ids) == MapSet.new()
      assert Specs.list_enum_options_for_sets(@invalid_ids) == %{}
      assert Specs.unit_symbols_for_dimensions(@invalid_ids) == %{}
    end
  end

  describe "list_current_attributes_for_product/1 provenance" do
    test "preloads accepted claim evidence and its safe source identity" do
      moderator = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()

      attribute =
        SpecsFixtures.attribute_fixture(%{
          data_type: :text,
          display_name: "Panel",
          code: unique_code("provenance-panel")
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "manufacturer",
          name: unique_code("Acme source"),
          domain: "acme.example"
        })
        |> Repo.insert!()

      fetched_at = ~U[2026-07-13 18:00:00Z]

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://acme.example/specifications/model-1",
          fetched_at: fetched_at,
          raw_json: %{"private" => "payload"}
        })
        |> Repo.insert!()

      assert {:ok, claim} =
               Specs.propose_claim(product.id, attribute.id, %{value_text: "OLED"}, %{
                 source_type: :import,
                 confidence: Decimal.new("0.95"),
                 artifact_id: artifact.id,
                 excerpt: "Panel technology: OLED"
               })

      assert {:ok, claim} = Specs.accept_claim(claim.id, moderator.id)

      assert {:ok, _current} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)

      assert [
               %{
                 claim: %{
                   id: claim_id,
                   confidence: confidence,
                   evidence_links: [
                     %{
                       excerpt: "Panel technology: OLED",
                       artifact: %{
                         id: artifact_id,
                         fetched_at: loaded_fetched_at,
                         source: %{name: source_name, domain: "acme.example"}
                       }
                     }
                   ]
                 }
               }
             ] = Specs.list_current_attributes_for_product(product.id)

      assert claim_id == claim.id
      assert Decimal.eq?(confidence, Decimal.new("0.95"))
      assert artifact_id == artifact.id
      assert source_name == source.name
      assert DateTime.compare(loaded_fetched_at, fetched_at) == :eq
    end
  end

  defp unique_code(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}"
end

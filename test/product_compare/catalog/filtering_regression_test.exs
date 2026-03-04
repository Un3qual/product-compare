defmodule ProductCompare.Catalog.FilteringRegressionTest do
  use ProductCompare.DataCase, async: false

  alias Ecto.Adapters.SQL
  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy

  @canonical_pac_join_regex ~r/FROM "product_attribute_current" AS sp?\d+ INNER JOIN "product_attribute_claims" AS sp?\d+ ON sp?\d+\."id" = sp?\d+\."claim_id"/

  describe "filter_products/1 typed filter regressions" do
    test "numeric filters only match selected current numeric claims" do
      moderator = AccountsFixtures.user_fixture()
      {attribute, unit} = numeric_attribute_with_unit_fixture()

      stale_product = product_fixture("numeric-stale")
      current_product = product_fixture("numeric-current")

      stale_product
      |> accept_claim!(attribute, %{value_num: Decimal.new("150"), unit_id: unit.id}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      stale_product
      |> accept_claim!(attribute, %{value_num: Decimal.new("320"), unit_id: unit.id}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      current_product
      |> accept_claim!(attribute, %{value_num: Decimal.new("175"), unit_id: unit.id}, moderator)
      |> select_current_claim!(current_product, attribute, moderator)

      results =
        Catalog.filter_products(%{
          numeric: [
            %{
              attribute_id: attribute.id,
              min: Decimal.new("100"),
              max: Decimal.new("200")
            }
          ]
        })

      assert Enum.map(results, & &1.id) == [current_product.id]
    end

    test "boolean filters only match selected current boolean claims" do
      moderator = AccountsFixtures.user_fixture()
      attribute = bool_attribute_fixture()

      stale_product = product_fixture("bool-stale")
      current_product = product_fixture("bool-current")

      stale_product
      |> accept_claim!(attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      stale_product
      |> accept_claim!(attribute, %{value_bool: false}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      current_product
      |> accept_claim!(attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(current_product, attribute, moderator)

      results =
        Catalog.filter_products(%{
          booleans: [%{attribute_id: attribute.id, value: true}]
        })

      assert Enum.map(results, & &1.id) == [current_product.id]
    end

    test "enum filters only match selected current enum claims" do
      moderator = AccountsFixtures.user_fixture()
      {attribute, option_a, option_b} = enum_attribute_with_options_fixture()

      stale_product = product_fixture("enum-stale")
      current_product = product_fixture("enum-current")

      stale_product
      |> accept_claim!(attribute, %{enum_option_id: option_a.id}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      stale_product
      |> accept_claim!(attribute, %{enum_option_id: option_b.id}, moderator)
      |> select_current_claim!(stale_product, attribute, moderator)

      current_product
      |> accept_claim!(attribute, %{enum_option_id: option_a.id}, moderator)
      |> select_current_claim!(current_product, attribute, moderator)

      results =
        Catalog.filter_products(%{
          enums: [%{attribute_id: attribute.id, enum_option_id: option_a.id}]
        })

      assert Enum.map(results, & &1.id) == [current_product.id]
    end

    test "use-case filters only match products tagged in use_case taxonomy" do
      moderator = AccountsFixtures.user_fixture()
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      gaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("use-case-gaming"),
          name: "Gaming"
        })

      office_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("use-case-office"),
          name: "Office"
        })

      gaming_product = product_fixture("use-case-gaming")
      office_product = product_fixture("use-case-office")
      _untagged_product = product_fixture("use-case-untagged")

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 gaming_product.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 office_product.id,
                 office_taxon.id,
                 moderator.id,
                 :editorial
               )

      results = Catalog.filter_products(%{use_case_taxon_ids: [gaming_taxon.id]})

      assert Enum.map(results, & &1.id) == [gaming_product.id]
    end
  end

  describe "filter query plan regressions" do
    test "numeric filters preserve canonical PACUR -> PAC join and numeric index expectation" do
      moderator = AccountsFixtures.user_fixture()
      {attribute, unit} = numeric_attribute_with_unit_fixture()
      product = product_fixture("plan-numeric")

      product
      |> accept_claim!(attribute, %{value_num: Decimal.new("150"), unit_id: unit.id}, moderator)
      |> select_current_claim!(product, attribute, moderator)

      {sql, plan} =
        explain_filter_query(%{
          numeric: [
            %{
              attribute_id: attribute.id,
              min: Decimal.new("100"),
              max: Decimal.new("200")
            }
          ]
        })

      assert sql =~ @canonical_pac_join_regex
      assert plan =~ "product_attribute_current"
      assert plan =~ "product_attribute_claims"
      assert plan =~ "pac_numeric_filter_idx"
    end

    test "boolean filters preserve canonical PACUR -> PAC join and bool index expectation" do
      moderator = AccountsFixtures.user_fixture()
      attribute = bool_attribute_fixture()
      product = product_fixture("plan-bool")

      product
      |> accept_claim!(attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(product, attribute, moderator)

      {sql, plan} =
        explain_filter_query(%{
          booleans: [%{attribute_id: attribute.id, value: true}]
        })

      assert sql =~ @canonical_pac_join_regex
      assert plan =~ "product_attribute_current"
      assert plan =~ "product_attribute_claims"
      assert plan =~ "pac_bool_filter_idx"
    end

    test "enum filters preserve canonical PACUR -> PAC join and enum index expectation" do
      moderator = AccountsFixtures.user_fixture()
      {attribute, option_a, _option_b} = enum_attribute_with_options_fixture()
      product = product_fixture("plan-enum")

      product
      |> accept_claim!(attribute, %{enum_option_id: option_a.id}, moderator)
      |> select_current_claim!(product, attribute, moderator)

      {sql, plan} =
        explain_filter_query(%{
          enums: [%{attribute_id: attribute.id, enum_option_id: option_a.id}]
        })

      assert sql =~ @canonical_pac_join_regex
      assert plan =~ "product_attribute_current"
      assert plan =~ "product_attribute_claims"
      assert plan =~ "pac_enum_filter_idx"
    end
  end

  defp explain_filter_query(filters) do
    # Planner node shapes vary by Postgres version. We only assert stable fragments and
    # set local planner flags to make pac_* index expectations less noisy.
    query = Filtering.apply_filters(filters)
    {sql, params} = SQL.to_sql(:all, Repo, query)

    {:ok, plan} =
      Repo.transaction(fn ->
        Repo.query!("SET LOCAL enable_seqscan = off")
        Repo.query!("SET LOCAL enable_bitmapscan = off")

        Repo.query!("EXPLAIN (COSTS OFF) " <> sql, params).rows
        |> Enum.map(&List.first/1)
        |> Enum.join("\n")
      end)

    {sql, plan}
  end

  defp accept_claim!(product, attribute, typed_value, moderator) do
    assert {:ok, claim} =
             Specs.propose_claim(product.id, attribute.id, typed_value, %{
               source_type: :user,
               created_by: moderator.id
             })

    assert {:ok, accepted_claim} = Specs.accept_claim(claim.id, moderator.id)
    accepted_claim
  end

  defp select_current_claim!(claim, product, attribute, moderator) do
    assert {:ok, _current} =
             Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)

    claim
  end

  defp numeric_attribute_with_unit_fixture do
    dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("dim-numeric-filter")})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("unit-numeric-filter"),
        symbol: "nf"
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("attr-numeric-filter"),
        display_name: "Numeric Filter Attribute",
        data_type: :numeric,
        dimension_id: dimension.id
      })

    {attribute, unit}
  end

  defp bool_attribute_fixture do
    SpecsFixtures.attribute_fixture(%{
      code: unique_code("attr-bool-filter"),
      display_name: "Boolean Filter Attribute",
      data_type: :bool
    })
  end

  defp enum_attribute_with_options_fixture do
    {:ok, enum_set} = Specs.upsert_enum_set(%{code: unique_code("enum-set-filter")})

    {:ok, option_a} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("enum-option-a"),
        label: "Option A",
        sort_order: 1
      })

    {:ok, option_b} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("enum-option-b"),
        label: "Option B",
        sort_order: 2
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("attr-enum-filter"),
        display_name: "Enum Filter Attribute",
        data_type: :enum,
        enum_set_id: enum_set.id
      })

    {attribute, option_a, option_b}
  end

  defp product_fixture(prefix), do: SpecsFixtures.product_fixture(%{slug: unique_code(prefix)})

  defp unique_code(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}"
end

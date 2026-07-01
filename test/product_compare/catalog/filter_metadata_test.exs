defmodule ProductCompare.Catalog.FilterMetadataTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy

  describe "product_filter_metadata/1" do
    test "returns display-safe counts, ranges, options, and selected state" do
      moderator = AccountsFixtures.user_fixture()
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      monitor_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("filter-meta-monitor"),
          name: "Monitor"
        })

      laptop_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("filter-meta-laptop"),
          name: "Laptop"
        })

      gaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("filter-meta-gaming"),
          name: "Gaming"
        })

      office_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("filter-meta-office"),
          name: "Office"
        })

      streaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("filter-meta-streaming"),
          name: "Streaming"
        })

      {refresh_rate_attribute, hz_unit} = numeric_attribute_with_unit_fixture()
      hdr_attribute = bool_attribute_fixture()

      {panel_attribute, oled_option, ips_option, tn_option} =
        enum_attribute_with_options_fixture()

      matching_product =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("filter-meta-match"),
          primary_type_taxon: monitor_taxon
        })

      bool_alternative =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("filter-meta-bool-alt"),
          primary_type_taxon: monitor_taxon
        })

      use_case_alternative =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("filter-meta-use-case-alt"),
          primary_type_taxon: monitor_taxon
        })

      enum_alternative =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("filter-meta-enum-alt"),
          primary_type_taxon: monitor_taxon
        })

      matching_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(matching_product, refresh_rate_attribute, moderator)

      matching_product
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(matching_product, hdr_attribute, moderator)

      matching_product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(matching_product, panel_attribute, moderator)

      bool_alternative
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(bool_alternative, refresh_rate_attribute, moderator)

      bool_alternative
      |> accept_claim!(hdr_attribute, %{value_bool: false}, moderator)
      |> select_current_claim!(bool_alternative, hdr_attribute, moderator)

      bool_alternative
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(bool_alternative, panel_attribute, moderator)

      use_case_alternative
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(use_case_alternative, refresh_rate_attribute, moderator)

      use_case_alternative
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(use_case_alternative, hdr_attribute, moderator)

      use_case_alternative
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(use_case_alternative, panel_attribute, moderator)

      enum_alternative
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(enum_alternative, refresh_rate_attribute, moderator)

      enum_alternative
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(enum_alternative, hdr_attribute, moderator)

      enum_alternative
      |> accept_claim!(panel_attribute, %{enum_option_id: ips_option.id}, moderator)
      |> select_current_claim!(enum_alternative, panel_attribute, moderator)

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 matching_product.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 bool_alternative.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 use_case_alternative.id,
                 office_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 enum_alternative.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      metadata =
        Catalog.product_filter_metadata(%{
          primary_type_taxon_id: monitor_taxon.id,
          numeric: [
            %{
              attribute_id: refresh_rate_attribute.id,
              min: Decimal.new("120"),
              max: Decimal.new("200")
            }
          ],
          booleans: [%{attribute_id: hdr_attribute.id, value: true}],
          enums: [%{attribute_id: panel_attribute.id, enum_option_id: oled_option.id}],
          use_case_taxon_ids: [gaming_taxon.id]
        })

      monitor_taxon_id = monitor_taxon.id
      laptop_taxon_id = laptop_taxon.id
      gaming_taxon_id = gaming_taxon.id
      office_taxon_id = office_taxon.id
      streaming_taxon_id = streaming_taxon.id
      oled_option_id = oled_option.id
      ips_option_id = ips_option.id
      tn_option_id = tn_option.id

      assert metadata.result_count == 1

      assert %{
               id: ^monitor_taxon_id,
               label: "Monitor",
               count: 1,
               selected: true,
               disabled: false
             } = option_by_id(metadata.type_options, monitor_taxon.id)

      assert %{id: ^laptop_taxon_id, count: 0, selected: false, disabled: true} =
               option_by_id(metadata.type_options, laptop_taxon.id)

      assert %{id: ^gaming_taxon_id, label: "Gaming", count: 1, selected: true, disabled: false} =
               option_by_id(metadata.use_case_options, gaming_taxon.id)

      assert %{id: ^office_taxon_id, count: 1, selected: false, disabled: false} =
               option_by_id(metadata.use_case_options, office_taxon.id)

      assert %{id: ^streaming_taxon_id, count: 0, selected: false, disabled: true} =
               option_by_id(metadata.use_case_options, streaming_taxon.id)

      assert [
               %{
                 attribute_id: refresh_rate_attribute_id,
                 code: refresh_rate_code,
                 display_name: "Refresh Rate",
                 unit_symbol: "Hz",
                 min: min,
                 max: max,
                 selected_min: selected_min,
                 selected_max: selected_max
               }
             ] = metadata.numeric_filters

      assert refresh_rate_attribute_id == refresh_rate_attribute.id
      assert refresh_rate_code == refresh_rate_attribute.code
      assert Decimal.equal?(min, Decimal.new("144"))
      assert Decimal.equal?(max, Decimal.new("144"))
      assert Decimal.equal?(selected_min, Decimal.new("120"))
      assert Decimal.equal?(selected_max, Decimal.new("200"))

      assert [
               %{
                 attribute_id: hdr_attribute_id,
                 code: hdr_code,
                 display_name: "HDR",
                 true_count: 1,
                 false_count: 1,
                 selected_value: true
               }
             ] = metadata.boolean_filters

      assert hdr_attribute_id == hdr_attribute.id
      assert hdr_code == hdr_attribute.code

      assert [
               %{
                 attribute_id: panel_attribute_id,
                 code: panel_code,
                 display_name: "Panel",
                 options: enum_options
               }
             ] = metadata.enum_filters

      assert panel_attribute_id == panel_attribute.id
      assert panel_code == panel_attribute.code

      assert %{id: ^oled_option_id, label: "OLED", count: 1, selected: true, disabled: false} =
               option_by_id(enum_options, oled_option.id)

      assert %{id: ^ips_option_id, label: "IPS", count: 1, selected: false, disabled: false} =
               option_by_id(enum_options, ips_option.id)

      assert %{id: ^tn_option_id, label: "TN", count: 0, selected: false, disabled: true} =
               option_by_id(enum_options, tn_option.id)
    end

    test "counts child products for parent type facets" do
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

      display_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("filter-meta-display"),
          name: "Display"
        })

      monitor_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          parent_id: display_taxon.id,
          code: unique_code("filter-meta-display-monitor"),
          name: "Monitor"
        })

      SpecsFixtures.product_fixture(%{
        slug: unique_code("filter-meta-display-product"),
        primary_type_taxon: monitor_taxon
      })

      metadata = Catalog.product_filter_metadata(%{})

      display_taxon_id = display_taxon.id
      monitor_taxon_id = monitor_taxon.id

      assert %{id: ^display_taxon_id, count: 1, selected: false, disabled: false} =
               option_by_id(metadata.type_options, display_taxon.id)

      assert %{id: ^monitor_taxon_id, count: 1, selected: false, disabled: false} =
               option_by_id(metadata.type_options, monitor_taxon.id)
    end

    test "counts child products for parent use-case facets" do
      moderator = AccountsFixtures.user_fixture()
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      desktop_setup_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("filter-meta-desktop-setup"),
          name: "Desktop Setup"
        })

      gaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          parent_id: desktop_setup_taxon.id,
          code: unique_code("filter-meta-desktop-gaming"),
          name: "Gaming"
        })

      office_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          parent_id: desktop_setup_taxon.id,
          code: unique_code("filter-meta-desktop-office"),
          name: "Office"
        })

      product =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("filter-meta-desktop-product")
        })

      assert {:ok, _} =
               Taxonomy.assign_use_case(product.id, gaming_taxon.id, moderator.id, :editorial)

      metadata = Catalog.product_filter_metadata(%{})

      desktop_setup_taxon_id = desktop_setup_taxon.id
      gaming_taxon_id = gaming_taxon.id
      office_taxon_id = office_taxon.id

      assert %{id: ^desktop_setup_taxon_id, count: 1, selected: false, disabled: false} =
               option_by_id(metadata.use_case_options, desktop_setup_taxon.id)

      assert %{id: ^gaming_taxon_id, count: 1, selected: false, disabled: false} =
               option_by_id(metadata.use_case_options, gaming_taxon.id)

      assert %{id: ^office_taxon_id, count: 0, selected: false, disabled: true} =
               option_by_id(metadata.use_case_options, office_taxon.id)
    end

    test "treats multiple selected enum options for one attribute as alternatives" do
      moderator = AccountsFixtures.user_fixture()

      {panel_attribute, oled_option, ips_option, _tn_option} =
        enum_attribute_with_options_fixture()

      oled_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-enum-or-oled")})

      ips_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-enum-or-ips")})

      oled_product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(oled_product, panel_attribute, moderator)

      ips_product
      |> accept_claim!(panel_attribute, %{enum_option_id: ips_option.id}, moderator)
      |> select_current_claim!(ips_product, panel_attribute, moderator)

      metadata =
        Catalog.product_filter_metadata(%{
          enums: [
            %{attribute_id: panel_attribute.id, enum_option_id: oled_option.id},
            %{attribute_id: panel_attribute.id, enum_option_id: ips_option.id}
          ]
        })

      enum_filter = Enum.find(metadata.enum_filters, &(&1.attribute_id == panel_attribute.id))

      assert metadata.result_count == 2

      assert %{count: 1, selected: true, disabled: false} =
               option_by_id(enum_filter.options, oled_option.id)

      assert %{count: 1, selected: true, disabled: false} =
               option_by_id(enum_filter.options, ips_option.id)
    end

    test "labels numeric base ranges with the base unit symbol" do
      moderator = AccountsFixtures.user_fixture()
      dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("filter-meta-length-dim")})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: dimension,
          code: unique_code("filter-meta-inch"),
          symbol: "in",
          multiplier_to_base: Decimal.new("25.4")
        })

      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("filter-meta-mm"),
        symbol: "mm",
        multiplier_to_base: Decimal.new("1"),
        offset_to_base: Decimal.new("0")
      })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: unique_code("filter-meta-size"),
          display_name: "Size",
          data_type: :numeric,
          dimension_id: dimension.id,
          is_filterable: true
        })

      product = SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-inch-product")})

      product
      |> accept_claim!(
        attribute,
        %{value_num: Decimal.new("27"), unit_id: inch_unit.id},
        moderator
      )
      |> select_current_claim!(product, attribute, moderator)

      metadata = Catalog.product_filter_metadata(%{})

      assert [
               %{
                 attribute_id: attribute_id,
                 unit_symbol: "mm",
                 min: min,
                 max: max
               }
             ] = Enum.filter(metadata.numeric_filters, &(&1.attribute_id == attribute.id))

      assert attribute_id == attribute.id
      assert Decimal.equal?(min, Decimal.new("685.8"))
      assert Decimal.equal?(max, Decimal.new("685.8"))
    end

    test "labels numeric base ranges with the base unit code when symbol is empty" do
      moderator = AccountsFixtures.user_fixture()
      dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("filter-meta-code-dim")})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: dimension,
          code: unique_code("filter-meta-code-inch"),
          symbol: "in",
          multiplier_to_base: Decimal.new("25.4")
        })

      base_unit_code = unique_code("filter-meta-code-mm")

      base_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: dimension,
          code: base_unit_code,
          symbol: "mm",
          multiplier_to_base: Decimal.new("1"),
          offset_to_base: Decimal.new("0")
        })

      base_unit
      |> Ecto.Changeset.change(symbol: "")
      |> Repo.update!()

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: unique_code("filter-meta-code-size"),
          display_name: "Size",
          data_type: :numeric,
          dimension_id: dimension.id,
          is_filterable: true
        })

      product = SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-code-product")})

      product
      |> accept_claim!(
        attribute,
        %{value_num: Decimal.new("27"), unit_id: inch_unit.id},
        moderator
      )
      |> select_current_claim!(product, attribute, moderator)

      metadata = Catalog.product_filter_metadata(%{})

      assert [
               %{
                 attribute_id: attribute_id,
                 unit_symbol: ^base_unit_code,
                 min: min,
                 max: max
               }
             ] = Enum.filter(metadata.numeric_filters, &(&1.attribute_id == attribute.id))

      assert attribute_id == attribute.id
      assert Decimal.equal?(min, Decimal.new("685.8"))
      assert Decimal.equal?(max, Decimal.new("685.8"))
    end

    test "omits only the current numeric attribute when calculating selected ranges" do
      moderator = AccountsFixtures.user_fixture()
      {refresh_rate_attribute, hz_unit} = numeric_attribute_with_unit_fixture()

      size_attribute =
        SpecsFixtures.attribute_fixture(%{
          code: unique_code("filter-meta-size-selected"),
          display_name: "Size",
          data_type: :numeric,
          dimension_id: hz_unit.dimension_id,
          is_filterable: true
        })

      first_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-selected-a")})

      second_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-selected-b")})

      third_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("filter-meta-selected-c")})

      first_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(first_product, refresh_rate_attribute, moderator)

      first_product
      |> accept_claim!(
        size_attribute,
        %{value_num: Decimal.new("27"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(first_product, size_attribute, moderator)

      second_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("60"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(second_product, refresh_rate_attribute, moderator)

      second_product
      |> accept_claim!(
        size_attribute,
        %{value_num: Decimal.new("24"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(second_product, size_attribute, moderator)

      third_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("165"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(third_product, refresh_rate_attribute, moderator)

      third_product
      |> accept_claim!(
        size_attribute,
        %{value_num: Decimal.new("32"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(third_product, size_attribute, moderator)

      metadata =
        Catalog.product_filter_metadata(%{
          numeric: [
            %{attribute_id: refresh_rate_attribute.id, min: Decimal.new("100")},
            %{attribute_id: size_attribute.id, max: Decimal.new("30")}
          ]
        })

      refresh_range =
        Enum.find(metadata.numeric_filters, &(&1.attribute_id == refresh_rate_attribute.id))

      size_range = Enum.find(metadata.numeric_filters, &(&1.attribute_id == size_attribute.id))

      assert Decimal.equal?(refresh_range.min, Decimal.new("60"))
      assert Decimal.equal?(refresh_range.max, Decimal.new("144"))
      assert Decimal.equal?(size_range.min, Decimal.new("27"))
      assert Decimal.equal?(size_range.max, Decimal.new("32"))
    end
  end

  defp option_by_id(options, id) do
    Enum.find(options, &(&1.id == id))
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
    dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("filter-meta-dim")})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("filter-meta-hz"),
        symbol: "Hz"
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("filter-meta-refresh-rate"),
        display_name: "Refresh Rate",
        data_type: :numeric,
        dimension_id: dimension.id,
        is_filterable: true
      })

    {attribute, unit}
  end

  defp bool_attribute_fixture do
    SpecsFixtures.attribute_fixture(%{
      code: unique_code("filter-meta-hdr"),
      display_name: "HDR",
      data_type: :bool,
      is_filterable: true
    })
  end

  defp enum_attribute_with_options_fixture do
    {:ok, enum_set} = Specs.upsert_enum_set(%{code: unique_code("filter-meta-panel-set")})

    {:ok, oled_option} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("filter-meta-oled"),
        label: "OLED",
        sort_order: 1
      })

    {:ok, ips_option} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("filter-meta-ips"),
        label: "IPS",
        sort_order: 2
      })

    {:ok, tn_option} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("filter-meta-tn"),
        label: "TN",
        sort_order: 3
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("filter-meta-panel"),
        display_name: "Panel",
        data_type: :enum,
        enum_set_id: enum_set.id,
        is_filterable: true
      })

    {attribute, oled_option, ips_option, tn_option}
  end

  defp unique_code(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}"
end

defmodule ProductCompare.Fixtures.SpecsFixtures do
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Specs

  @spec dimension_fixture(map()) :: ProductCompareSchemas.Specs.Dimension.t()
  def dimension_fixture(attrs \\ %{}) do
    code = Map.get(attrs, :code, "dim-#{System.unique_integer([:positive])}")

    {:ok, dimension} =
      attrs
      |> Map.put_new(:code, code)
      |> Specs.upsert_dimension()

    dimension
  end

  @spec unit_fixture(map()) :: ProductCompareSchemas.Specs.Unit.t()
  def unit_fixture(attrs \\ %{}) do
    dimension = Map.get(attrs, :dimension) || dimension_fixture()

    params =
      attrs
      |> Map.delete(:dimension)
      |> Map.put_new(:dimension_id, dimension.id)
      |> Map.put_new(:code, "unit-#{System.unique_integer([:positive])}")
      |> Map.put_new(:symbol, "u")
      |> Map.put_new(:multiplier_to_base, Decimal.new("1"))
      |> Map.put_new(:offset_to_base, Decimal.new("0"))

    {:ok, unit} = Specs.upsert_unit(params)
    unit
  end

  @spec attribute_fixture(map()) :: ProductCompareSchemas.Specs.Attribute.t()
  def attribute_fixture(attrs \\ %{}) do
    code = Map.get(attrs, :code, "attr-#{System.unique_integer([:positive])}")

    params =
      attrs
      |> Map.put_new(:code, code)
      |> Map.put_new(:display_name, "Attribute #{code}")
      |> Map.put_new(:data_type, :bool)

    {:ok, attribute} = Specs.upsert_attribute(params)
    attribute
  end

  @spec product_fixture(map()) :: ProductCompareSchemas.Catalog.Product.t()
  def product_fixture(attrs \\ %{}) do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    primary_type_taxon =
      Map.get(attrs, :primary_type_taxon) ||
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: "monitor-#{System.unique_integer([:positive])}",
          name: "Monitor"
        })

    brand_id =
      Map.get(attrs, :brand_id) ||
        case Catalog.upsert_brand(%{name: "Brand #{System.unique_integer([:positive])}"}) do
          {:ok, brand} -> brand.id
        end

    slug = Map.get(attrs, :slug, "product-#{System.unique_integer([:positive])}")

    {:ok, product} =
      attrs
      |> Map.drop([:primary_type_taxon])
      |> Map.put_new(:brand_id, brand_id)
      |> Map.put_new(:primary_type_taxon_id, primary_type_taxon.id)
      |> Map.put_new(:name, "Product #{slug}")
      |> Map.put_new(:slug, slug)
      |> Catalog.create_product()

    product
  end
end

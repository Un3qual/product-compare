defmodule ProductCompare.Specs.Reads.CurrentAttributes do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.{Attribute, ProductAttributeCurrent, TaxonAttribute}

  @max_bigint_id 9_223_372_036_854_775_807

  @spec for_products([pos_integer()], keyword()) :: %{optional(pos_integer()) => [map()]}
  def for_products(product_ids, opts \\ []) do
    product_ids = normalize_ids(product_ids)
    limit = Keyword.get(opts, :limit)

    if product_ids == [] do
      %{}
    else
      products_by_id =
        Product
        |> where([product], product.id in ^product_ids)
        |> select([product], {product.id, product.primary_type_taxon_id})
        |> Repo.all()
        |> Map.new()

      current_attributes_by_product =
        product_ids
        |> current_attributes_query(limit)
        |> Repo.all()
        |> Enum.group_by(& &1.product_id)

      taxon_attributes_by_taxon_id =
        current_attributes_by_product
        |> Map.values()
        |> List.flatten()
        |> Enum.map(& &1.attribute_id)
        |> taxon_attributes_by_taxon_and_attribute_ids(
          for {_product_id, taxon_id} <- products_by_id,
              valid_id?(taxon_id),
              do: taxon_id
        )

      Map.new(product_ids, fn product_id ->
        current_attributes = Map.get(current_attributes_by_product, product_id, [])
        taxon_id = Map.get(products_by_id, product_id)
        taxon_attributes = Map.get(taxon_attributes_by_taxon_id, taxon_id, [])

        {product_id, with_metadata_from_taxon_attributes(current_attributes, taxon_attributes)}
      end)
    end
  end

  @spec for_product(pos_integer()) :: [map()]
  def for_product(product_id) do
    for_products([product_id])
    |> Map.fetch!(product_id)
  end

  @spec with_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [map()]
  def with_metadata(current_attributes, taxon_id) do
    taxon_attributes =
      current_attributes
      |> Enum.map(& &1.attribute_id)
      |> taxon_attribute_metadata_by_attribute_id(taxon_id)
      |> Map.values()

    with_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
  end

  @spec with_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  def with_metadata_from_taxon_attributes(current_attributes, taxon_attributes) do
    attribute_ids = MapSet.new(current_attributes, & &1.attribute_id)

    taxon_attributes =
      taxon_attributes
      |> List.wrap()
      |> Enum.filter(&MapSet.member?(attribute_ids, &1.attribute_id))
      |> Map.new(&{&1.attribute_id, &1})

    current_attributes
    |> Enum.map(fn current_attribute ->
      %{
        current: current_attribute,
        attribute: current_attribute.attribute,
        claim: current_attribute.claim,
        taxon_attribute: Map.get(taxon_attributes, current_attribute.attribute_id)
      }
    end)
    |> Enum.sort_by(&current_attribute_sort_key/1)
  end

  defp current_attributes_query(product_ids, nil) do
    ProductAttributeCurrent
    |> where([current], current.product_id in ^product_ids)
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([current, attribute],
      asc: current.product_id,
      asc: attribute.display_name,
      asc: attribute.code
    )
    |> preload([_current, attribute],
      attribute: attribute,
      claim: [:unit, :enum_option, evidence_links: [artifact: :source]]
    )
  end

  defp current_attributes_query(product_ids, limit) when is_integer(limit) and limit > 0 do
    ranked_current =
      ProductAttributeCurrent
      |> where([current], current.product_id in ^product_ids)
      |> join(:inner, [current], product in Product, on: product.id == current.product_id)
      |> join(:inner, [current], attribute in Attribute, on: attribute.id == current.attribute_id)
      |> join(:left, [_current, product, attribute], taxon_attribute in TaxonAttribute,
        on:
          taxon_attribute.taxon_id == product.primary_type_taxon_id and
            taxon_attribute.attribute_id == attribute.id
      )
      |> windows([current, _product, attribute, taxon_attribute],
        home_highlight: [
          partition_by: current.product_id,
          order_by: [
            asc: fragment("CASE WHEN ? IS NULL THEN 1 ELSE 0 END", taxon_attribute.sort_order),
            asc: taxon_attribute.sort_order,
            asc: fragment("lower(?)", attribute.display_name),
            asc: attribute.code
          ]
        ]
      )
      |> select([current], %{
        current_id: current.id,
        product_id: current.product_id,
        rank: over(row_number(), :home_highlight)
      })

    ProductAttributeCurrent
    |> join(:inner, [current], ranked in subquery(ranked_current),
      on: ranked.current_id == current.id and ranked.rank <= ^limit
    )
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([current, ranked], asc: current.product_id, asc: ranked.rank)
    |> preload([_current, _ranked, attribute],
      attribute: attribute,
      claim: [:unit, :enum_option, evidence_links: [artifact: :source]]
    )
  end

  defp taxon_attributes_by_taxon_and_attribute_ids(_attribute_ids, []), do: %{}
  defp taxon_attributes_by_taxon_and_attribute_ids([], _taxon_ids), do: %{}

  defp taxon_attributes_by_taxon_and_attribute_ids(attribute_ids, taxon_ids) do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id in ^taxon_ids)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Enum.group_by(& &1.taxon_id)
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, nil), do: %{}
  defp taxon_attribute_metadata_by_attribute_id([], _taxon_id), do: %{}

  defp taxon_attribute_metadata_by_attribute_id(attribute_ids, taxon_id)
       when is_integer(taxon_id) and taxon_id > 0 and taxon_id <= @max_bigint_id do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id == ^taxon_id)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Map.new(&{&1.attribute_id, &1})
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, _taxon_id), do: %{}

  defp normalize_ids(ids), do: ids |> MapSet.new() |> Enum.filter(&valid_id?/1)
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id

  defp current_attribute_sort_key(%{attribute: attribute, taxon_attribute: taxon_attribute}) do
    sort_order = taxon_attribute && taxon_attribute.sort_order

    {
      if(is_integer(sort_order), do: 0, else: 1),
      sort_order || 0,
      String.downcase(attribute.display_name || ""),
      attribute.code || ""
    }
  end
end

defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Specs
  alias ProductCompare.Specs.ClaimValue
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.Resolvers.Catalog.Discovery
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.TaxonAttribute

  @base_unit_symbol_cache_context_key :catalog_base_unit_symbol_cache_key
  @max_evidence_excerpt_length 500
  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product(parent, args, %{context: %{loader: _loader}} = resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  def product(parent, args, resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def comparison_products(parent, args, %{context: %{loader: _loader}} = resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  def comparison_products(parent, args, resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def products(parent, args, %{context: %{loader: _loader}} = resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end

  def products(parent, args, resolution) do
    clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end

  @spec product_filter_metadata(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_filter_metadata(parent, args, %{context: %{loader: _loader}} = resolution) do
    Discovery.product_filter_metadata(parent, args, resolution)
  end

  def product_filter_metadata(parent, args, resolution),
    do: Discovery.product_filter_metadata(parent, args, resolution)

  @spec current_attributes(Product.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, [map()]} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def current_attributes(
        %Product{id: product_id} = product,
        _args,
        %{context: %{loader: loader}} = resolution
      )
      when is_integer(product_id) do
    loader
    |> Dataloader.load(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
    |> Dataloader.load(Catalog, {:many, SpecificationCorrection}, product_id: product_id)
    |> load_taxon_attributes(product.primary_type_taxon_id)
    |> on_load(fn loader ->
      attributes =
        loader
        |> Dataloader.get(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
        |> Specs.with_current_attribute_metadata_from_taxon_attributes(
          loaded_taxon_attributes(loader, product.primary_type_taxon_id)
        )
        |> format_current_attributes(
          resolution,
          loader
          |> Dataloader.get(Catalog, {:many, SpecificationCorrection}, product_id: product_id)
          |> Specs.correction_counts()
        )

      {:ok, attributes}
    end)
  end

  def current_attributes(%Product{id: product_id}, _args, _resolution) do
    attributes =
      product_id
      |> Specs.list_current_attributes_for_product()
      |> format_current_attributes(nil, Specs.correction_counts_for_product(product_id))

    {:ok, attributes}
  end

  @spec my_saved_comparison_sets(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_saved_comparison_sets(_parent, args, %{
        context: %{current_user: current_user, loader: %Dataloader{} = loader}
      }) do
    connection_args = Input.connection_args(args)

    AuthorizedConnection.load_owner(
      loader,
      current_user,
      :saved_comparison_sets,
      %{},
      connection_args
    )
  end

  def my_saved_comparison_sets(_parent, args, %{context: %{current_user: current_user}}) do
    query = Catalog.list_saved_comparison_sets_query(current_user.id)
    connection_args = Input.connection_args(args)

    Connection.from_query_result(query, connection_args, Repo)
  end

  def my_saved_comparison_sets(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec create_saved_comparison_set(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_saved_comparison_set(_parent, %{input: input}, %{
        context: %{current_user: current_user}
      }) do
    with {:ok, product_ids} <-
           Input.decode_integer_id_list(
             Input.fetch_list_value(input, :product_ids),
             :product,
             "product"
           ) do
      attrs = %{
        name: Input.fetch_value(input, :name),
        product_ids: product_ids
      }

      case Catalog.create_saved_comparison_set(current_user.id, attrs) do
        {:ok, %SavedComparisonSet{} = saved_comparison_set} ->
          {:ok, %{saved_comparison_set: saved_comparison_set, errors: []}}

        {:error, :product_not_found} ->
          {:ok, saved_comparison_error_payload("NOT_FOUND", "product not found", "productIds")}

        {:error, :empty_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "at least one product is required",
             "productIds"
           )}

        {:error, :duplicate_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "duplicate products are not allowed",
             "productIds"
           )}

        {:error, :too_many_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "you can save up to 3 products",
             "productIds"
           )}

        {:error, %Ecto.Changeset{} = changeset} ->
          {:ok, saved_comparison_changeset_error_payload(changeset)}
      end
    else
      {:error, _message} ->
        {:ok, saved_comparison_error_payload("INVALID_ID", "invalid product id", "productIds")}
    end
  end

  def create_saved_comparison_set(_parent, _args, _resolution),
    do: {:ok, saved_comparison_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec delete_saved_comparison_set(
          any(),
          %{saved_comparison_set_id: String.t()},
          Absinthe.Resolution.t()
        ) ::
          {:ok, map()}
  def delete_saved_comparison_set(
        _parent,
        %{saved_comparison_set_id: saved_comparison_set_id},
        %{context: %{current_user: current_user}}
      ) do
    with {:ok, entropy_id} <-
           Input.decode_required_uuid_id(
             saved_comparison_set_id,
             :saved_comparison_set,
             "saved comparison set"
           ) do
      case Catalog.delete_saved_comparison_set(current_user.id, entropy_id) do
        {:ok, %SavedComparisonSet{} = saved_comparison_set} ->
          {:ok, %{saved_comparison_set: saved_comparison_set, errors: []}}

        {:error, :not_found} ->
          {:ok, saved_comparison_error_payload("NOT_FOUND", "saved comparison set not found")}
      end
    else
      {:error, _message} ->
        {:ok,
         saved_comparison_error_payload(
           "INVALID_ID",
           "invalid saved comparison set id",
           "savedComparisonSetId"
         )}
    end
  end

  def delete_saved_comparison_set(_parent, _args, _resolution),
    do: {:ok, saved_comparison_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  defp load_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.load(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp load_taxon_attributes(loader, _taxon_id), do: loader

  defp loaded_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.get(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp loaded_taxon_attributes(_loader, _taxon_id), do: []

  defp format_current_attributes(current_attributes, resolution, correction_counts) do
    base_unit_symbols_by_dimension =
      current_attributes
      |> Enum.flat_map(&non_base_numeric_dimension_id/1)
      |> unit_symbols_for_dimensions(resolution)

    Enum.map(
      current_attributes,
      &format_current_attribute(&1, base_unit_symbols_by_dimension, correction_counts)
    )
  end

  defp unit_symbols_for_dimensions(dimension_ids, nil),
    do: Specs.unit_symbols_for_dimensions(dimension_ids)

  defp unit_symbols_for_dimensions(dimension_ids, resolution) do
    case base_unit_symbol_cache_key(resolution) do
      nil -> Specs.unit_symbols_for_dimensions(dimension_ids)
      cache_key -> cached_unit_symbols_for_dimensions(dimension_ids, cache_key)
    end
  end

  defp cached_unit_symbols_for_dimensions(dimension_ids, cache_key) do
    dimension_ids = Enum.uniq(dimension_ids)
    cached_symbols = Process.get(cache_key, %{})

    missing_dimension_ids =
      Enum.reject(dimension_ids, &Map.has_key?(cached_symbols, &1))

    symbols =
      case missing_dimension_ids do
        [] ->
          cached_symbols

        ids ->
          fetched_symbols = Specs.unit_symbols_for_dimensions(ids)
          loaded_symbols = Map.new(ids, &{&1, Map.get(fetched_symbols, &1)})
          updated_symbols = Map.merge(cached_symbols, loaded_symbols)

          Process.put(cache_key, updated_symbols)
          updated_symbols
      end

    Map.take(symbols, dimension_ids)
  end

  defp clear_base_unit_symbol_cache(resolution) do
    if cache_key = base_unit_symbol_cache_key(resolution) do
      Process.delete(cache_key)
    end

    :ok
  end

  defp base_unit_symbol_cache_key(%{context: context}) when is_map(context),
    do: Map.get(context, @base_unit_symbol_cache_context_key)

  defp base_unit_symbol_cache_key(_resolution), do: nil

  defp non_base_numeric_dimension_id(%{
         attribute: %{data_type: :numeric, dimension_id: dimension_id},
         claim: %{value_num_base: %Decimal{}, unit: unit}
       })
       when is_integer(dimension_id) do
    if base_unit?(unit), do: [], else: [dimension_id]
  end

  defp non_base_numeric_dimension_id(_current_attribute), do: []

  defp format_current_attribute(
         %{attribute: attribute, claim: claim} = current_attribute,
         base_unit_symbols_by_dimension,
         correction_counts
       ) do
    taxon_attribute = Map.get(current_attribute, :taxon_attribute)

    attribute_correction_counts =
      Map.get(correction_counts, attribute.id, %{pending: 0, accepted: 0})

    %{
      attribute_id: GlobalId.encode(:attribute, attribute.id),
      code: attribute.code,
      display_name: attribute.display_name,
      data_type: Atom.to_string(attribute.data_type),
      value_text: ClaimValue.format(claim),
      sort_order: taxon_attribute && taxon_attribute.sort_order,
      group_label: taxon_attribute && taxon_attribute.compare_group_label,
      is_required: (taxon_attribute && taxon_attribute.is_required) || false,
      numeric_value: numeric_claim_value(claim),
      boolean_value: boolean_claim_value(claim),
      enum_option_id: GlobalId.encode_optional_value(:enum_option, claim.enum_option_id),
      unit_symbol: attribute_unit_symbol(attribute, claim, base_unit_symbols_by_dimension),
      claim_id: GlobalId.encode(:product_attribute_claim, claim.id),
      claim_status: Atom.to_string(claim.status),
      source_type: Atom.to_string(claim.source_type),
      confidence: claim.confidence,
      pending_correction_count: attribute_correction_counts.pending,
      accepted_correction_count: attribute_correction_counts.accepted,
      evidence: format_claim_evidence(claim.evidence_links)
    }
  end

  defp format_claim_evidence(evidence_links) when is_list(evidence_links) do
    Enum.map(evidence_links, fn evidence ->
      %{
        excerpt: bounded_evidence_excerpt(evidence.excerpt),
        source_artifact: evidence.artifact
      }
    end)
  end

  defp format_claim_evidence(_evidence_links), do: []

  defp bounded_evidence_excerpt(excerpt) when is_binary(excerpt),
    do: String.slice(excerpt, 0, @max_evidence_excerpt_length)

  defp bounded_evidence_excerpt(_excerpt), do: nil

  defp numeric_claim_value(%{value_num_base: %Decimal{} = value}), do: value
  defp numeric_claim_value(_claim), do: nil

  defp boolean_claim_value(%{value_bool: value}) when is_boolean(value), do: value
  defp boolean_claim_value(_claim), do: nil

  defp attribute_unit_symbol(
         %{data_type: :numeric, dimension_id: dimension_id},
         %{value_num_base: %Decimal{}, unit: unit},
         base_unit_symbols_by_dimension
       )
       when is_integer(dimension_id) do
    if base_unit?(unit) do
      unit_symbol(unit)
    else
      Map.get(base_unit_symbols_by_dimension, dimension_id)
    end
  end

  defp attribute_unit_symbol(%{data_type: :numeric}, %{value_num_base: %Decimal{}}, _symbols),
    do: nil

  defp attribute_unit_symbol(_attribute, claim, _symbols), do: unit_symbol(claim.unit)

  defp base_unit?(%{
         multiplier_to_base: %Decimal{} = multiplier,
         offset_to_base: %Decimal{} = offset
       }) do
    Decimal.equal?(multiplier, Decimal.new("1")) and Decimal.equal?(offset, Decimal.new("0"))
  end

  defp base_unit?(_unit), do: false

  defp unit_symbol(%{symbol: symbol}) when is_binary(symbol) and symbol != "", do: symbol
  defp unit_symbol(%{code: code}) when is_binary(code) and code != "", do: code
  defp unit_symbol(_unit), do: nil

  defp saved_comparison_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      saved_comparison_set: nil,
      errors: GraphQLErrors.changeset_mutation_errors(changeset)
    }
  end

  defp saved_comparison_error_payload(code, message, field \\ nil) do
    %{
      saved_comparison_set: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp saved_comparison_error_payload(error) when is_map(error) do
    %{
      saved_comparison_set: nil,
      errors: [error]
    }
  end
end

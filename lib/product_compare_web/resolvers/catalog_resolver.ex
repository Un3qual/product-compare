defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  alias ProductCompare.Catalog
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.Resolvers.Catalog.CurrentAttributes
  alias ProductCompareWeb.Resolvers.Catalog.Discovery
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonSet

  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  def product(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def comparison_products(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  def comparison_products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def products(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end

  def products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
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
  def current_attributes(product, args, resolution),
    do: CurrentAttributes.current_attributes(product, args, resolution)

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

defmodule ProductCompare.Catalog do
  @moduledoc """
  Catalog context for brands, products, and filter helpers.
  """

  import Ecto.Query
  alias Ecto.Multi

  alias ProductCompare.Catalog.Evidence
  alias ProductCompare.Catalog.FilterMetadata
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Catalog.Products
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Catalog.SavedComparisonItem
  alias ProductCompareSchemas.Catalog.SavedComparisonSet

  @max_bigint_id 9_223_372_036_854_775_807

  @spec list_products() :: [Product.t()]
  def list_products, do: Products.list_products()

  @spec filter_products(map()) :: [Product.t()]
  def filter_products(filters) do
    Product
    |> Filtering.apply_filters(filters)
    |> Repo.all()
  end

  @spec product_filter_metadata(map()) :: map()
  def product_filter_metadata(filters) do
    FilterMetadata.metadata(filters)
  end

  @spec create_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def create_brand(attrs), do: Products.create_brand(attrs)

  @spec upsert_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def upsert_brand(attrs), do: Products.upsert_brand(attrs)

  @spec create_product(map()) :: {:ok, Product.t()} | {:error, term()}
  def create_product(attrs), do: Products.create_product(attrs)

  @spec update_product(Product.t(), map()) :: {:ok, Product.t()} | {:error, term()}
  def update_product(%Product{} = product, attrs) do
    Products.update_product(product, attrs)
  end

  @spec get_product!(pos_integer()) :: Product.t()
  def get_product!(id), do: Products.get_product!(id)

  @spec get_product(pos_integer()) :: Product.t() | nil
  def get_product(id) when is_integer(id) and id > 0 and id <= @max_bigint_id,
    do: Products.get_product(id)

  @spec get_brand(pos_integer()) :: Brand.t() | nil
  def get_brand(id) when is_integer(id) and id > 0 and id <= @max_bigint_id,
    do: Products.get_brand(id)

  @spec get_product_by_slug(String.t() | nil) :: Product.t() | nil
  def get_product_by_slug(nil), do: Products.get_product_by_slug(nil)

  def get_product_by_slug(slug) when is_binary(slug) do
    Products.get_product_by_slug(slug)
  end

  @spec get_products_by_slugs([term()]) :: %{optional(String.t()) => Product.t() | nil}
  def get_products_by_slugs(slugs) when is_list(slugs) do
    Products.get_products_by_slugs(slugs)
  end

  @spec get_product_by_identifier(String.t(), String.t()) :: Product.t() | nil
  def get_product_by_identifier(scheme, normalized_value)
      when is_binary(scheme) and is_binary(normalized_value) do
    Evidence.get_product_by_identifier(scheme, normalized_value)
  end

  @spec list_product_identifiers(pos_integer(), String.t()) :: [ProductIdentifier.t()]
  def list_product_identifiers(product_id, scheme)
      when is_integer(product_id) and is_binary(scheme) do
    Evidence.list_product_identifiers(product_id, scheme)
  end

  @spec create_product_identifier(map()) ::
          {:ok, ProductIdentifier.t()} | {:error, Ecto.Changeset.t()}
  def create_product_identifier(attrs) do
    Evidence.create_product_identifier(attrs)
  end

  @spec upsert_product_media(Product.t(), term(), list(), DateTime.t()) :: %{
          persisted: non_neg_integer(),
          rejected: non_neg_integer()
        }
  def upsert_product_media(%Product{} = product, source_artifact_id, observations, observed_at)
      when is_list(observations) do
    Evidence.upsert_product_media(product, source_artifact_id, observations, observed_at)
  end

  @spec list_product_media(pos_integer()) :: [ProductMedia.t()]
  def list_product_media(product_id) when is_integer(product_id) do
    Evidence.list_product_media(product_id)
  end

  @spec list_products_by_slugs([String.t()]) :: [Product.t() | nil]
  def list_products_by_slugs(slugs) when is_list(slugs) do
    Products.list_products_by_slugs(slugs)
  end

  @spec list_products_by_slug_selections([[term()]]) :: [[Product.t() | nil]]
  def list_products_by_slug_selections(slug_selections) when is_list(slug_selections) do
    Products.list_products_by_slug_selections(slug_selections)
  end

  @spec create_saved_comparison_set(pos_integer(), %{
          name: String.t(),
          product_ids: [pos_integer()]
        }) ::
          {:ok, SavedComparisonSet.t()}
          | {:error,
             Ecto.Changeset.t()
             | :duplicate_products
             | :empty_products
             | :invalid_product_id
             | :product_not_found
             | :too_many_products}
  def create_saved_comparison_set(user_id, %{name: name, product_ids: product_ids})
      when is_integer(user_id) and is_binary(name) and is_list(product_ids) do
    with {:ok, normalized_product_ids} <- normalize_saved_comparison_product_ids(product_ids),
         :ok <- ensure_products_exist(normalized_product_ids) do
      Multi.new()
      |> Multi.insert(
        :saved_comparison_set,
        SavedComparisonSet.changeset(%SavedComparisonSet{}, %{user_id: user_id, name: name})
      )
      |> Multi.run(:saved_comparison_items, fn repo,
                                               %{saved_comparison_set: saved_comparison_set} ->
        insert_saved_comparison_items(repo, saved_comparison_set.id, normalized_product_ids)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{saved_comparison_set: saved_comparison_set}} ->
          {:ok, load_saved_comparison_set!(saved_comparison_set.id)}

        {:error, :saved_comparison_set, changeset, _changes} ->
          {:error, changeset}

        {:error, :saved_comparison_items, changeset, _changes} ->
          {:error, changeset}
      end
    end
  end

  @spec list_saved_comparison_sets_query(pos_integer()) :: Ecto.Query.t()
  def list_saved_comparison_sets_query(user_id) when is_integer(user_id) do
    from(saved_comparison_set in SavedComparisonSet,
      where: saved_comparison_set.user_id == ^user_id,
      order_by: [desc: saved_comparison_set.inserted_at, desc: saved_comparison_set.id]
    )
  end

  @doc """
  Fetches an owned saved comparison set by a raw entropy ID value.

  Invalid UUID binaries return `nil` instead of raising.
  """
  @spec get_saved_comparison_set_for_user(User.t(), binary()) :: SavedComparisonSet.t() | nil
  def get_saved_comparison_set_for_user(%User{id: user_id}, entropy_id)
      when is_binary(entropy_id) do
    user_id
    |> get_saved_comparison_sets_for_user_id([entropy_id])
    |> Map.get(entropy_id)
  end

  @spec get_saved_comparison_sets_for_user(User.t(), [binary()]) ::
          %{optional(binary()) => SavedComparisonSet.t() | nil}
  def get_saved_comparison_sets_for_user(%User{id: user_id}, entropy_ids)
      when is_list(entropy_ids) do
    get_saved_comparison_sets_for_user_id(user_id, entropy_ids)
  end

  @spec delete_saved_comparison_set(pos_integer(), Ecto.UUID.t()) ::
          {:ok, SavedComparisonSet.t()} | {:error, :not_found}
  def delete_saved_comparison_set(user_id, entropy_id)
      when is_integer(user_id) and is_binary(entropy_id) do
    with {:ok, validated_entropy_id} <- Ecto.UUID.cast(entropy_id),
         %SavedComparisonSet{} = saved_comparison_set <-
           Repo.get_by(SavedComparisonSet,
             user_id: user_id,
             entropy_id: validated_entropy_id
           ) do
      case Repo.delete(saved_comparison_set, stale_error_field: :id) do
        {:ok, deleted_saved_comparison_set} ->
          {:ok, deleted_saved_comparison_set}

        {:error, _changeset} ->
          {:error, :not_found}
      end
    else
      :error -> {:error, :not_found}
      nil -> {:error, :not_found}
    end
  end

  defp get_saved_comparison_sets_for_user_id(user_id, entropy_ids) do
    Input.uuid_lookup_results(entropy_ids, fn validated_entropy_ids ->
      SavedComparisonSet
      |> where(
        [saved_comparison_set],
        saved_comparison_set.user_id == ^user_id and
          saved_comparison_set.entropy_id in ^validated_entropy_ids
      )
      |> Repo.all()
    end)
  end

  defp insert_saved_comparison_items(repo, saved_comparison_set_id, product_ids) do
    Enum.reduce_while(Enum.with_index(product_ids, 1), {:ok, []}, fn {product_id, position},
                                                                     {:ok, items} ->
      changeset =
        SavedComparisonItem.changeset(%SavedComparisonItem{}, %{
          saved_comparison_set_id: saved_comparison_set_id,
          product_id: product_id,
          position: position
        })

      case repo.insert(changeset) do
        {:ok, saved_comparison_item} ->
          {:cont, {:ok, [saved_comparison_item | items]}}

        {:error, changeset} ->
          {:halt, {:error, changeset}}
      end
    end)
    |> case do
      {:ok, items} -> {:ok, Enum.reverse(items)}
      {:error, _} = error -> error
    end
  end

  defp ensure_products_exist(product_ids) do
    count =
      from(product in Product, where: product.id in ^product_ids)
      |> Repo.aggregate(:count)

    if count == length(product_ids), do: :ok, else: {:error, :product_not_found}
  end

  defp load_saved_comparison_set!(saved_comparison_set_id) do
    SavedComparisonSet
    |> Repo.get!(saved_comparison_set_id)
    |> Repo.preload(items: [:product])
  end

  defp normalize_saved_comparison_product_ids([]), do: {:error, :empty_products}

  defp normalize_saved_comparison_product_ids(product_ids) when is_list(product_ids) do
    cond do
      Enum.any?(product_ids, &(not is_integer(&1) or &1 <= 0)) ->
        {:error, :invalid_product_id}

      Enum.count_until(product_ids, 4) > 3 ->
        {:error, :too_many_products}

      Enum.uniq(product_ids) != product_ids ->
        {:error, :duplicate_products}

      true ->
        {:ok, product_ids}
    end
  end
end

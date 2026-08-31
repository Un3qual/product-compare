defmodule ProductCompare.Catalog do
  @moduledoc """
  Catalog context for brands, products, and filter helpers.
  """

  alias ProductCompare.Catalog.Evidence
  alias ProductCompare.Catalog.FilterMetadata
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Catalog.HomeWorkspace
  alias ProductCompare.Catalog.Products
  alias ProductCompare.Catalog.SavedComparisons
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.ProductMedia
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

  @spec home_workspace_product_candidates(keyword()) :: [Product.t()]
  def home_workspace_product_candidates(opts), do: HomeWorkspace.product_candidates(opts)

  @spec home_workspace_selected_products([term()]) :: [Product.t()]
  def home_workspace_selected_products(selected_slugs),
    do: HomeWorkspace.selected_products(selected_slugs)

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
  def get_products_by_slugs(slugs) do
    Products.get_products_by_slugs(slugs)
  end

  @spec get_product_by_identifier(atom() | String.t(), String.t()) :: Product.t() | nil
  def get_product_by_identifier(scheme, normalized_value) do
    Evidence.get_product_by_identifier(scheme, normalized_value)
  end

  @spec list_product_identifiers(pos_integer(), atom() | String.t()) :: [ProductIdentifier.t()]
  def list_product_identifiers(product_id, scheme) do
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
  def upsert_product_media(%Product{} = product, source_artifact_id, observations, observed_at) do
    Evidence.upsert_product_media(product, source_artifact_id, observations, observed_at)
  end

  @spec list_product_media(pos_integer()) :: [ProductMedia.t()]
  def list_product_media(product_id) do
    Evidence.list_product_media(product_id)
  end

  @spec list_products_by_slugs([String.t()]) :: [Product.t() | nil]
  def list_products_by_slugs(slugs) do
    Products.list_products_by_slugs(slugs)
  end

  @spec list_products_by_slug_selections([[term()]]) :: [[Product.t() | nil]]
  def list_products_by_slug_selections(slug_selections) do
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
  def create_saved_comparison_set(user_id, %{name: name, product_ids: product_ids}) do
    SavedComparisons.create_saved_comparison_set(user_id, %{
      name: name,
      product_ids: product_ids
    })
  end

  @spec list_saved_comparison_sets_query(pos_integer()) :: Ecto.Query.t()
  def list_saved_comparison_sets_query(user_id) do
    SavedComparisons.list_saved_comparison_sets_query(user_id)
  end

  @doc """
  Fetches an owned saved comparison set by a raw entropy ID value.

  Invalid UUID binaries return `nil` instead of raising.
  """
  @spec get_saved_comparison_set_for_user(User.t(), binary()) :: SavedComparisonSet.t() | nil
  def get_saved_comparison_set_for_user(%User{id: user_id}, entropy_id) do
    SavedComparisons.get_saved_comparison_set_for_user_id(user_id, entropy_id)
  end

  @spec get_saved_comparison_sets_for_user(User.t(), [binary()]) ::
          %{optional(binary()) => SavedComparisonSet.t() | nil}
  def get_saved_comparison_sets_for_user(%User{id: user_id}, entropy_ids) do
    SavedComparisons.get_saved_comparison_sets_for_user_id(user_id, entropy_ids)
  end

  @spec delete_saved_comparison_set(pos_integer(), Ecto.UUID.t()) ::
          {:ok, SavedComparisonSet.t()} | {:error, :not_found}
  def delete_saved_comparison_set(user_id, entropy_id) do
    SavedComparisons.delete_saved_comparison_set(user_id, entropy_id)
  end
end

defmodule ProductCompare.Catalog do
  @moduledoc """
  Catalog context for brands, products, and filter helpers.
  """

  import Ecto.Query

  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product

  @spec list_products() :: [Product.t()]
  def list_products do
    Repo.all(from p in Product, order_by: [asc: p.id])
  end

  @spec filter_products(map()) :: [Product.t()]
  def filter_products(filters) do
    Product
    |> Filtering.apply_filters(filters)
    |> Repo.all()
  end

  @spec create_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def create_brand(attrs) do
    %Brand{}
    |> Brand.changeset(attrs)
    |> Repo.insert()
  end

  @spec upsert_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def upsert_brand(attrs) do
    name = Map.get(attrs, :name) || Map.get(attrs, "name")

    case Repo.get_by(Brand, name: name) do
      nil -> create_brand(attrs)
      brand -> brand |> Brand.changeset(attrs) |> Repo.update()
    end
  end

  @spec create_product(map()) :: {:ok, Product.t()} | {:error, term()}
  def create_product(attrs) do
    with :ok <- validate_primary_type_taxon(attrs) do
      %Product{}
      |> Product.changeset(attrs)
      |> Repo.insert()
    end
  end

  @spec update_product(Product.t(), map()) :: {:ok, Product.t()} | {:error, term()}
  def update_product(%Product{} = product, attrs) do
    with :ok <- validate_primary_type_taxon(attrs, product) do
      product
      |> Product.changeset(attrs)
      |> Repo.update()
    end
  end

  @spec get_product!(pos_integer()) :: Product.t()
  def get_product!(id), do: Repo.get!(Product, id)

  @spec get_product_by_slug(String.t() | nil) :: Product.t() | nil
  def get_product_by_slug(nil), do: nil

  def get_product_by_slug(slug) when is_binary(slug) do
    Product
    |> Repo.get_by(slug: slug)
    |> Repo.preload(:brand)
  end

  defp validate_primary_type_taxon(attrs, product \\ nil) do
    value =
      Map.get(attrs, :primary_type_taxon_id) ||
        Map.get(attrs, "primary_type_taxon_id") ||
        (product && product.primary_type_taxon_id)

    if is_nil(value) do
      {:error, :primary_type_taxon_required}
    else
      with {:ok, primary_type_taxon_id} <- normalize_integer_id(value),
           {:ok, :type} <- Taxonomy.ensure_taxon_in_taxonomy(primary_type_taxon_id, "type") do
        :ok
      else
        _ -> {:error, :primary_type_taxon_must_be_type_taxon}
      end
    end
  end

  defp normalize_integer_id(value) when is_integer(value), do: {:ok, value}

  defp normalize_integer_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp normalize_integer_id(_value), do: :error
end

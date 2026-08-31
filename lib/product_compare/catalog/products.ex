defmodule ProductCompare.Catalog.Products do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.SearchDocuments
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductSlugAlias

  @spec list_products() :: [Product.t()]
  def list_products do
    Repo.all(from product in Product, order_by: [asc: product.id])
  end

  @spec create_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def create_brand(attrs) do
    %Brand{}
    |> Brand.changeset(attrs)
    |> Repo.insert()
  end

  @spec upsert_brand(map()) :: {:ok, Brand.t()} | {:error, Ecto.Changeset.t()}
  def upsert_brand(attrs) do
    now = DateTime.utc_now()
    changeset = Brand.changeset(%Brand{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:name])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:name],
      returning: true
    )
  end

  @spec create_product(map()) :: {:ok, Product.t()} | {:error, term()}
  def create_product(attrs) do
    Repo.transaction(fn ->
      with :ok <- validate_primary_type_taxon(attrs),
           changeset = Product.changeset(%Product{}, attrs),
           {:ok, product} <- Repo.insert(changeset),
           :ok <- SearchDocuments.refresh_product(product.id) do
        product
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  @spec update_product(Product.t(), map()) :: {:ok, Product.t()} | {:error, term()}
  def update_product(%Product{id: product_id}, attrs) do
    Repo.transaction(fn ->
      persisted_product =
        Repo.one(
          from product in Product,
            where: product.id == ^product_id,
            lock: "FOR UPDATE"
        )

      case persisted_product do
        nil ->
          Repo.rollback(:product_not_found)

        %Product{} = product ->
          next_slug = Input.fetch_attr(attrs, :slug)

          with :ok <- validate_primary_type_taxon(attrs, product),
               changeset = Product.changeset(product, drop_nil_primary_type_taxon(attrs)),
               {:ok, updated} <- Repo.update(changeset),
               :ok <- preserve_prior_slug_alias(product, next_slug),
               :ok <- SearchDocuments.refresh_product(updated.id) do
            updated
          else
            {:error, %Ecto.Changeset{} = changeset} ->
              if slug_namespace_conflict?(changeset) do
                Repo.rollback(:slug_reserved)
              else
                Repo.rollback(changeset)
              end

            {:error, reason} ->
              Repo.rollback(reason)
          end
      end
    end)
  end

  @spec get_product!(pos_integer()) :: Product.t()
  def get_product!(id), do: Repo.get!(Product, id)

  @spec get_product(pos_integer()) :: Product.t() | nil
  def get_product(id), do: Repo.get(Product, id)

  @spec get_brand(pos_integer()) :: Brand.t() | nil
  def get_brand(id), do: Repo.get(Brand, id)

  @spec get_product_by_slug(String.t() | nil) :: Product.t() | nil
  def get_product_by_slug(nil), do: nil

  def get_product_by_slug(slug) when is_binary(slug) do
    [slug]
    |> get_products_by_slugs()
    |> Map.fetch!(slug)
  end

  @spec get_products_by_slugs([term()]) :: %{optional(String.t()) => Product.t() | nil}
  def get_products_by_slugs(slugs) do
    requested_slugs = slugs |> Enum.filter(&is_binary/1) |> Enum.uniq()
    query_slugs = Enum.reject(requested_slugs, &(String.trim(&1) == ""))

    canonical_products =
      if query_slugs == [] do
        %{}
      else
        Product
        |> where([product], product.slug in ^query_slugs)
        |> Repo.all()
        |> Map.new(&{&1.slug, &1})
      end

    unresolved_slugs = query_slugs -- Map.keys(canonical_products)

    historical_products =
      if unresolved_slugs == [] do
        %{}
      else
        Product
        |> join(:inner, [product], slug_alias in ProductSlugAlias,
          on: slug_alias.product_id == product.id
        )
        |> where([_product, slug_alias], slug_alias.slug in ^unresolved_slugs)
        |> select([product, slug_alias], {slug_alias.slug, product})
        |> Repo.all()
        |> Map.new()
      end

    products_by_slug = Map.merge(historical_products, canonical_products)
    Map.new(requested_slugs, &{&1, Map.get(products_by_slug, &1)})
  end

  @spec list_products_by_slugs([String.t()]) :: [Product.t() | nil]
  def list_products_by_slugs(slugs) do
    products_by_slug =
      Product
      |> where([product], product.slug in ^slugs)
      |> Repo.all()
      |> Map.new(&{&1.slug, &1})

    Enum.map(slugs, &Map.get(products_by_slug, &1))
  end

  @spec list_products_by_slug_selections([[term()]]) :: [[Product.t() | nil]]
  def list_products_by_slug_selections(slug_selections) do
    products_by_slug =
      slug_selections
      |> List.flatten()
      |> Enum.filter(&is_binary/1)
      |> Enum.uniq()
      |> then(fn slugs ->
        Product
        |> where([product], product.slug in ^slugs)
        |> Repo.all()
        |> Map.new(&{&1.slug, &1})
      end)

    Enum.map(slug_selections, fn slugs ->
      Enum.map(slugs, &Map.get(products_by_slug, &1))
    end)
  end

  defp preserve_prior_slug_alias(%Product{} = product, next_slug)
       when is_binary(next_slug) and next_slug != product.slug do
    case %ProductSlugAlias{}
         |> ProductSlugAlias.changeset(%{product_id: product.id, slug: product.slug})
         |> Repo.insert() do
      {:ok, _alias} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp preserve_prior_slug_alias(_product, _next_slug), do: :ok

  defp slug_namespace_conflict?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn
      {:slug, {_message, opts}} ->
        to_string(opts[:constraint_name]) == "product_slug_namespace_uq"

      _error ->
        false
    end)
  end

  defp validate_primary_type_taxon(attrs, product \\ nil) do
    primary_type_taxon_id_key = "primary_type_taxon_id"

    value =
      case attrs do
        %{primary_type_taxon_id: value} when not is_nil(value) -> value
        %{^primary_type_taxon_id_key => value} when not is_nil(value) -> value
        _ -> product && product.primary_type_taxon_id
      end

    if is_nil(value) do
      {:error, :primary_type_taxon_required}
    else
      with {:ok, primary_type_taxon_id} <- Input.normalize_integer_id(value),
           {:ok, :type} <- Taxonomy.ensure_taxon_in_taxonomy(primary_type_taxon_id, "type") do
        :ok
      else
        _ -> {:error, :primary_type_taxon_must_be_type_taxon}
      end
    end
  end

  defp drop_nil_primary_type_taxon(attrs) do
    attrs
    |> drop_nil_key(:primary_type_taxon_id)
    |> drop_nil_key("primary_type_taxon_id")
  end

  defp drop_nil_key(attrs, key) do
    if Map.has_key?(attrs, key) and is_nil(Map.get(attrs, key)) do
      Map.delete(attrs, key)
    else
      attrs
    end
  end
end

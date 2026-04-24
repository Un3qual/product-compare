defmodule ProductCompare.Catalog do
  @moduledoc """
  Catalog context for brands, products, and filter helpers.
  """

  import Ecto.Query
  alias Ecto.Multi

  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonItem
  alias ProductCompareSchemas.Catalog.SavedComparisonSet

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

  @spec get_product(pos_integer()) :: Product.t() | nil
  def get_product(id) when is_integer(id) and id > 0, do: Repo.get(Product, id)

  @spec get_brand(pos_integer()) :: Brand.t() | nil
  def get_brand(id) when is_integer(id) and id > 0, do: Repo.get(Brand, id)

  @spec get_product_by_slug(String.t() | nil) :: Product.t() | nil
  def get_product_by_slug(nil), do: nil

  def get_product_by_slug(slug) when is_binary(slug) do
    Repo.get_by(Product, slug: slug)
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
    with {:ok, validated_entropy_id} <- Ecto.UUID.cast(entropy_id) do
      SavedComparisonSet
      |> where(
        [saved_comparison_set],
        saved_comparison_set.entropy_id == ^validated_entropy_id and
          saved_comparison_set.user_id == ^user_id
      )
      |> preload(items: [:product])
      |> Repo.one()
    else
      :error -> nil
    end
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

      length(product_ids) > 3 ->
        {:error, :too_many_products}

      Enum.uniq(product_ids) != product_ids ->
        {:error, :duplicate_products}

      true ->
        {:ok, product_ids}
    end
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

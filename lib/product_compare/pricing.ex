defmodule ProductCompare.Pricing do
  @moduledoc """
  Pricing context for merchants, merchant listings, and price history.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @max_bigint_id 9_223_372_036_854_775_807

  @spec upsert_merchant(map()) :: {:ok, Merchant.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant(attrs) do
    now = DateTime.utc_now()
    changeset = Merchant.changeset(%Merchant{}, attrs)

    # Merchants are identified by either key in existing data flows:
    # name-based imports and domain-based imports should converge to one row.
    case upsert_merchant_on_name(changeset, now) do
      {:error, %Ecto.Changeset{} = error_changeset} ->
        if unique_error_on_field?(error_changeset, :domain) do
          upsert_merchant_on_domain(changeset, now)
        else
          {:error, error_changeset}
        end

      result ->
        result
    end
  end

  @spec list_merchants_query() :: Ecto.Query.t()
  def list_merchants_query do
    from merchant in Merchant,
      order_by: [asc: merchant.id]
  end

  @spec list_merchants() :: [Merchant.t()]
  def list_merchants do
    list_merchants_query()
    |> Repo.all()
  end

  @spec get_merchant!(pos_integer()) :: Merchant.t()
  def get_merchant!(merchant_id), do: Repo.get!(Merchant, merchant_id)

  @spec get_merchant(pos_integer()) :: Merchant.t() | nil
  def get_merchant(merchant_id)
      when is_integer(merchant_id) and merchant_id > 0 and merchant_id <= @max_bigint_id,
      do: Repo.get(Merchant, merchant_id)

  @spec upsert_merchant_product(map()) ::
          {:ok, MerchantProduct.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_product(attrs) do
    now = DateTime.utc_now()
    changeset = MerchantProduct.changeset(%MerchantProduct{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:merchant_id, :url])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:merchant_id, :url],
      returning: true
    )
  end

  @spec list_merchant_products_query(map()) :: Ecto.Query.t()
  def list_merchant_products_query(filters) do
    product_id = get_required_filter_value(filters, :product_id)
    merchant_id = get_filter_value(filters, :merchant_id)
    active_only = get_filter_value(filters, :active_only)

    MerchantProduct
    |> where([merchant_product], merchant_product.product_id == ^product_id)
    |> maybe_where_merchant_id(merchant_id)
    |> maybe_where_active_only(active_only)
    |> order_by([merchant_product], asc: merchant_product.id)
  end

  @spec list_merchant_products(map()) :: [MerchantProduct.t()]
  def list_merchant_products(filters) do
    filters
    |> list_merchant_products_query()
    |> Repo.all()
    |> Repo.preload([:merchant, :product])
  end

  @spec get_merchant_product!(pos_integer()) :: MerchantProduct.t()
  def get_merchant_product!(merchant_product_id) do
    MerchantProduct
    |> Repo.get!(merchant_product_id)
    |> Repo.preload([:merchant, :product])
  end

  @spec get_merchant_product(pos_integer()) :: MerchantProduct.t() | nil
  def get_merchant_product(merchant_product_id)
      when is_integer(merchant_product_id) and merchant_product_id > 0 and
             merchant_product_id <= @max_bigint_id do
    Repo.get(MerchantProduct, merchant_product_id)
  end

  @spec add_price_point(map()) :: {:ok, PricePoint.t()} | {:error, Ecto.Changeset.t()}
  def add_price_point(attrs) do
    %PricePoint{}
    |> PricePoint.changeset(attrs)
    |> Repo.insert()
  end

  @spec latest_price(pos_integer()) :: PricePoint.t() | nil
  def latest_price(merchant_product_id) do
    Repo.one(
      from pp in PricePoint,
        where: pp.merchant_product_id == ^merchant_product_id,
        order_by: [desc: pp.observed_at, desc: pp.id],
        limit: 1
    )
  end

  @spec latest_prices_query(Ecto.Queryable.t(), [pos_integer()]) :: Ecto.Query.t()
  def latest_prices_query(queryable \\ PricePoint, merchant_product_ids)
      when is_list(merchant_product_ids) do
    from pp in queryable,
      where: pp.merchant_product_id in ^merchant_product_ids,
      distinct: pp.merchant_product_id,
      order_by: [asc: pp.merchant_product_id, desc: pp.observed_at, desc: pp.id]
  end

  @spec price_history_query(pos_integer(), map()) :: Ecto.Query.t()
  def price_history_query(merchant_product_id, filters \\ %{}) do
    from_dt = get_filter_value(filters, :from)
    to_dt = get_filter_value(filters, :to)

    PricePoint
    |> where([pp], pp.merchant_product_id == ^merchant_product_id)
    |> maybe_where_from(from_dt)
    |> maybe_where_to(to_dt)
    |> order_by([pp], asc: pp.observed_at, asc: pp.id)
  end

  @spec price_history(pos_integer(), map()) ::
          [PricePoint.t()]
  def price_history(merchant_product_id, filters \\ %{}) do
    merchant_product_id
    |> price_history_query(filters)
    |> Repo.all()
  end

  defp upsert_merchant_on_name(changeset, now) do
    update_fields = Map.take(changeset.changes, [:domain]) |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:name],
      returning: true
    )
  end

  defp upsert_merchant_on_domain(changeset, now) do
    update_fields = Map.take(changeset.changes, [:name]) |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:domain],
      returning: true
    )
  end

  defp maybe_where_from(query, nil), do: query
  defp maybe_where_from(query, from_dt), do: where(query, [pp], pp.observed_at >= ^from_dt)

  defp maybe_where_to(query, nil), do: query
  defp maybe_where_to(query, to_dt), do: where(query, [pp], pp.observed_at <= ^to_dt)

  defp maybe_where_merchant_id(query, nil), do: query

  defp maybe_where_merchant_id(query, merchant_id),
    do: where(query, [merchant_product], merchant_product.merchant_id == ^merchant_id)

  defp maybe_where_active_only(query, true),
    do: where(query, [merchant_product], merchant_product.is_active == true)

  defp maybe_where_active_only(query, _active_only), do: query

  defp get_filter_value(filters, key) when is_map(filters),
    do: Map.get(filters, key, Map.get(filters, Atom.to_string(key)))

  defp get_filter_value(_filters, _key), do: nil

  defp get_required_filter_value(filters, key) do
    case get_filter_value(filters, key) do
      nil -> raise ArgumentError, "missing required #{key} filter"
      value -> value
    end
  end

  defp unique_error_on_field?(%Ecto.Changeset{errors: errors}, field) do
    Enum.any?(errors, fn
      {^field, {_message, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end
end

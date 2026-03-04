defmodule ProductCompare.Pricing do
  @moduledoc """
  Pricing context for merchants, merchant listings, and price history.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

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

  @spec price_history(pos_integer(), map()) ::
          [PricePoint.t()]
  def price_history(merchant_product_id, filters \\ %{}) do
    from_dt = get_filter_value(filters, :from)
    to_dt = get_filter_value(filters, :to)

    PricePoint
    |> where([pp], pp.merchant_product_id == ^merchant_product_id)
    |> maybe_where_from(from_dt)
    |> maybe_where_to(to_dt)
    |> order_by([pp], asc: pp.observed_at, asc: pp.id)
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

  defp get_filter_value(filters, key) when is_map(filters),
    do: Map.get(filters, key, Map.get(filters, Atom.to_string(key)))

  defp get_filter_value(_filters, _key), do: nil

  defp unique_error_on_field?(%Ecto.Changeset{errors: errors}, field) do
    Enum.any?(errors, fn
      {^field, {_message, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end
end

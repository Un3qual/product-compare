defmodule ProductCompare.Pricing.Offers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @max_bigint_id 9_223_372_036_854_775_807

  @spec list_merchant_offers_query(pos_integer(), boolean()) :: Ecto.Query.t()
  def list_merchant_offers_query(merchant_id, active_only \\ true) do
    MerchantProduct
    |> where([offer], offer.merchant_id == ^merchant_id)
    |> maybe_where_active_only(active_only)
    |> order_by([offer], asc: offer.id)
  end

  @spec merchant_offer_pages([pos_integer()], %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def merchant_offer_pages(merchant_ids, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(merchant_ids) do
    merchant_ids = normalize_merchant_ids(merchant_ids)

    if merchant_ids == [] do
      %{}
    else
      ranked_offers =
        MerchantProduct
        |> where([offer], offer.merchant_id in ^merchant_ids)
        |> maybe_where_active_only(true)
        |> windows(
          [offer],
          merchant_offer_page: [partition_by: offer.merchant_id, order_by: [asc: offer.id]]
        )
        |> select([offer], %{
          id: offer.id,
          row_number: over(row_number(), :merchant_offer_page)
        })

      partitioned_merchant_product_pages(
        ranked_offers,
        merchant_ids,
        :merchant_id,
        offset,
        fetch_limit
      )
    end
  end

  @spec upsert_merchant_product(map()) ::
          {:ok, MerchantProduct.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_product(attrs) do
    now = DateTime.utc_now()
    changeset = MerchantProduct.changeset(%MerchantProduct{}, attrs)

    if changeset.valid? do
      product_id = Ecto.Changeset.get_field(changeset, :product_id)
      currency = Ecto.Changeset.get_field(changeset, :currency)

      update_fields =
        changeset.changes
        |> Map.drop([:merchant_id, :product_id, :url, :currency])
        |> Map.to_list()

      conflict_query =
        from merchant_product in MerchantProduct,
          where:
            merchant_product.product_id == ^product_id and
              merchant_product.currency == ^currency,
          update: [set: ^(update_fields ++ [updated_at: now])]

      changeset
      |> Repo.insert(
        on_conflict: conflict_query,
        conflict_target: [:merchant_id, :url],
        returning: true,
        allow_stale: true
      )
      |> resolve_merchant_product_upsert(changeset)
    else
      Ecto.Changeset.apply_action(changeset, :insert)
    end
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

  @spec product_offer_pages([pos_integer()], map(), %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def product_offer_pages(product_ids, filters, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(product_ids) and is_map(filters) do
    product_ids = normalize_product_ids(product_ids)

    if product_ids == [] do
      %{}
    else
      merchant_id = get_filter_value(filters, :merchant_id)
      active_only = get_filter_value(filters, :active_only)

      ranked_offers =
        MerchantProduct
        |> where([offer], offer.product_id in ^product_ids)
        |> maybe_where_merchant_id(merchant_id)
        |> maybe_where_active_only(active_only)
        |> windows(
          [offer],
          product_offer_page: [partition_by: offer.product_id, order_by: [asc: offer.id]]
        )
        |> select([offer], %{
          id: offer.id,
          row_number: over(row_number(), :product_offer_page)
        })

      partitioned_merchant_product_pages(
        ranked_offers,
        product_ids,
        :product_id,
        offset,
        fetch_limit
      )
    end
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

  defp resolve_merchant_product_upsert(
         {:ok, %MerchantProduct{id: nil}},
         changeset
       ) do
    existing =
      Repo.get_by!(
        MerchantProduct,
        merchant_id: Ecto.Changeset.get_field(changeset, :merchant_id),
        url: Ecto.Changeset.get_field(changeset, :url)
      )

    {:error, merchant_product_identity_changeset(changeset, existing)}
  end

  defp resolve_merchant_product_upsert(result, _changeset), do: result

  defp merchant_product_identity_changeset(changeset, existing) do
    changeset
    |> maybe_add_identity_error(
      :product_id,
      existing.product_id,
      Ecto.Changeset.get_field(changeset, :product_id)
    )
    |> maybe_add_identity_error(
      :currency,
      existing.currency,
      Ecto.Changeset.get_field(changeset, :currency)
    )
  end

  defp maybe_add_identity_error(changeset, _field, value, value), do: changeset

  defp maybe_add_identity_error(changeset, field, _existing, _requested) do
    Ecto.Changeset.add_error(changeset, field, "does not match the existing merchant offer")
  end

  defp partitioned_merchant_product_pages(
         ranked_offers,
         parent_ids,
         parent_field,
         offset,
         fetch_limit
       ) do
    offers_by_parent =
      MerchantProduct
      |> join(:inner, [offer], ranked in subquery(ranked_offers), on: ranked.id == offer.id)
      |> where(
        [_offer, ranked],
        ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
      )
      |> order_by([offer, _ranked],
        asc: field(offer, ^parent_field),
        asc: offer.id
      )
      |> Repo.all()
      |> Enum.group_by(&Map.fetch!(&1, parent_field))

    Map.new(parent_ids, fn parent_id ->
      {parent_id, Map.get(offers_by_parent, parent_id, [])}
    end)
  end

  defp normalize_merchant_ids(merchant_ids) do
    merchant_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end

  defp normalize_product_ids(product_ids) do
    product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end

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
end

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
    name = Map.get(attrs, :name) || Map.get(attrs, "name")

    case Repo.get_by(Merchant, name: name) do
      nil -> %Merchant{} |> Merchant.changeset(attrs) |> Repo.insert()
      merchant -> merchant |> Merchant.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_merchant_product(map()) ::
          {:ok, MerchantProduct.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_product(attrs) do
    merchant_id = Map.get(attrs, :merchant_id) || Map.get(attrs, "merchant_id")
    url = Map.get(attrs, :url) || Map.get(attrs, "url")

    query = from mp in MerchantProduct, where: mp.merchant_id == ^merchant_id and mp.url == ^url

    case Repo.one(query) do
      nil -> %MerchantProduct{} |> MerchantProduct.changeset(attrs) |> Repo.insert()
      merchant_product -> merchant_product |> MerchantProduct.changeset(attrs) |> Repo.update()
    end
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
        order_by: [desc: pp.observed_at],
        limit: 1
    )
  end

  @spec price_history(pos_integer(), %{
          from: DateTime.t() | NaiveDateTime.t() | nil,
          to: DateTime.t() | NaiveDateTime.t() | nil
        }) ::
          [PricePoint.t()]
  def price_history(merchant_product_id, %{from: from_dt, to: to_dt}) do
    PricePoint
    |> where([pp], pp.merchant_product_id == ^merchant_product_id)
    |> maybe_where_from(from_dt)
    |> maybe_where_to(to_dt)
    |> order_by([pp], asc: pp.observed_at)
    |> Repo.all()
  end

  defp maybe_where_from(query, nil), do: query
  defp maybe_where_from(query, from_dt), do: where(query, [pp], pp.observed_at >= ^from_dt)

  defp maybe_where_to(query, nil), do: query
  defp maybe_where_to(query, to_dt), do: where(query, [pp], pp.observed_at <= ^to_dt)
end

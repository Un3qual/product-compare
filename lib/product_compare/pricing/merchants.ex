defmodule ProductCompare.Pricing.Merchants do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.ChangesetErrors
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Pricing.PriceHistory
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @max_bigint_id 9_223_372_036_854_775_807

  @spec upsert_merchant(map()) :: {:ok, Merchant.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant(attrs) do
    now = DateTime.utc_now()
    changeset = Merchant.changeset(%Merchant{}, merchant_attrs_with_slug(attrs))

    # Merchants are identified by either key in existing data flows:
    # name-based imports and domain-based imports should converge to one row.
    case upsert_merchant_on_name(changeset, now) do
      {:error, %Ecto.Changeset{} = error_changeset} ->
        if ChangesetErrors.unique_error_on_field?(error_changeset, :domain) do
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

  @spec get_merchant_by_slug(String.t()) :: Merchant.t() | nil
  def get_merchant_by_slug(slug) when is_binary(slug) do
    [slug]
    |> get_merchants_by_slugs()
    |> Map.fetch!(slug)
  end

  def get_merchant_by_slug(_slug), do: nil

  @spec get_merchants_by_slugs([term()]) :: %{optional(String.t()) => Merchant.t() | nil}
  def get_merchants_by_slugs(slugs) when is_list(slugs) do
    requested_slugs = slugs |> Enum.filter(&is_binary/1) |> Enum.uniq()
    query_slugs = Enum.reject(requested_slugs, &(String.trim(&1) == ""))

    merchants_by_slug =
      if query_slugs == [] do
        %{}
      else
        Merchant
        |> where([merchant], merchant.slug in ^query_slugs)
        |> Repo.all()
        |> Map.new(&{&1.slug, &1})
      end

    Map.new(requested_slugs, &{&1, Map.get(merchants_by_slug, &1)})
  end

  @spec merchant_detail(String.t() | Merchant.t(), keyword()) ::
          %{merchant: Merchant.t(), summary: map()} | nil
  def merchant_detail(merchant_or_slug, opts \\ [])

  def merchant_detail(slug, opts) when is_binary(slug) do
    case get_merchant_by_slug(slug) do
      %Merchant{} = merchant -> merchant_detail(merchant, opts)
      nil -> nil
    end
  end

  def merchant_detail(%Merchant{} = merchant, opts) do
    merchant
    |> then(&merchant_details([&1], opts))
    |> Map.fetch!(merchant)
  end

  @spec merchant_details([Merchant.t()], keyword()) :: %{Merchant.t() => map()}
  def merchant_details(merchants, opts \\ [])

  def merchant_details([], _opts), do: %{}

  def merchant_details(merchants, opts) when is_list(merchants) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    merchant_ids = Enum.map(merchants, & &1.id)

    merchant_products =
      MerchantProduct
      |> where([offer], offer.merchant_id in ^merchant_ids and offer.is_active == true)
      |> order_by([offer], asc: offer.merchant_id, asc: offer.id)
      |> Repo.all()

    latest_by_offer =
      merchant_products
      |> Enum.map(& &1.id)
      |> latest_offer_truth_prices()

    products_by_merchant = Enum.group_by(merchant_products, & &1.merchant_id)

    Map.new(merchants, fn merchant ->
      products = Map.get(products_by_merchant, merchant.id, [])
      {merchant, merchant_detail_from_products(merchant, products, latest_by_offer, now, opts)}
    end)
  end

  defp merchant_detail_from_products(merchant, merchant_products, latest_by_offer, now, opts) do
    offers =
      Enum.map(merchant_products, fn offer ->
        OfferTruth.summarize(offer, Map.get(latest_by_offer, offer.id), now, opts)
      end)

    freshness_counts = Enum.frequencies_by(offers, & &1.freshness)

    %{
      merchant: merchant,
      summary: %{
        active_offer_count: length(offers),
        distinct_product_count:
          merchant_products |> Enum.map(& &1.product_id) |> Enum.uniq() |> length(),
        observed_offer_count: Enum.count(offers, & &1.observed_at),
        eligible_offer_count: Enum.count(offers, & &1.eligible),
        fresh_offer_count: Map.get(freshness_counts, :fresh, 0),
        aging_offer_count: Map.get(freshness_counts, :aging, 0),
        stale_offer_count: Map.get(freshness_counts, :stale, 0),
        unobserved_offer_count: Map.get(freshness_counts, :unobserved, 0),
        last_observed_at: latest_observed_at(offers)
      }
    }
  end

  defp latest_offer_truth_prices(merchant_product_ids),
    do: PriceHistory.latest_offer_truth_prices(merchant_product_ids)

  defp merchant_attrs_with_slug(attrs) do
    name = get_filter_value(attrs, :name)
    domain = get_filter_value(attrs, :domain)

    %{
      name: name,
      domain: domain,
      slug: merchant_slug(name, domain)
    }
  end

  defp merchant_slug(name, domain) when is_binary(name) and is_binary(domain) do
    base =
      name
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]+/u, "-")
      |> String.trim("-")

    hash = :crypto.hash(:md5, domain) |> Base.encode16(case: :lower) |> binary_part(0, 8)
    "#{if(base == "", do: "merchant", else: base)}-#{hash}"
  end

  defp merchant_slug(_name, _domain), do: nil

  defp latest_observed_at(offers) do
    offers
    |> Enum.map(& &1.observed_at)
    |> Enum.reject(&is_nil/1)
    |> Enum.max_by(&DateTime.to_unix(&1, :microsecond), fn -> nil end)
  end

  defp upsert_merchant_on_name(changeset, now) do
    update_fields = Map.take(changeset.changes, [:domain]) |> Map.to_list()

    Repo.insert(
      changeset,
      [
        on_conflict: [set: update_fields ++ [updated_at: now]],
        conflict_target: [:name],
        returning: true
      ] ++ transaction_insert_opts()
    )
  end

  defp upsert_merchant_on_domain(changeset, now) do
    update_fields = Map.take(changeset.changes, [:name]) |> Map.to_list()

    Repo.insert(
      changeset,
      [
        on_conflict: [set: update_fields ++ [updated_at: now]],
        conflict_target: [:domain],
        returning: true
      ] ++ transaction_insert_opts()
    )
  end

  defp transaction_insert_opts do
    if Repo.in_transaction?() do
      [mode: :savepoint]
    else
      []
    end
  end

  defp get_filter_value(filters, key) when is_map(filters),
    do: Map.get(filters, key, Map.get(filters, Atom.to_string(key)))

  defp get_filter_value(_filters, _key), do: nil
end

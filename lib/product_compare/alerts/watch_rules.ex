defmodule ProductCompare.Alerts.WatchRules do
  @moduledoc false

  import Ecto.Query

  alias Ecto.Changeset
  alias ProductCompare.Alerts.MarketFacts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec create_watch(pos_integer(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, Ecto.Changeset.t() | atom()}
  def create_watch(user_id, attrs) do
    attrs = atomize_watch_attrs(attrs)
    product_id = Map.get(attrs, :product_id)
    merchant_product_id = Map.get(attrs, :merchant_product_id)
    currency = attrs |> Map.get(:currency) |> normalize_currency()
    now = DateTime.utc_now()

    with {:ok, scope} <- validate_scope(product_id, merchant_product_id, currency),
         fact <- MarketFacts.current_scope_fact(scope, currency, now),
         baseline <- MarketFacts.eligible_baseline(fact),
         create_attrs <-
           attrs
           |> Map.put(:user_id, user_id)
           |> Map.put(:product_id, product_id)
           |> Map.put(:merchant_product_id, merchant_product_id)
           |> Map.put(:currency, currency)
           |> Map.put(:baseline_price_point_id, baseline && baseline.price_point_id)
           |> Map.put(:baseline_landed_price, baseline && baseline.landed_price)
           |> Map.put_new(:last_condition_met, initial_condition(attrs, fact)),
         {:ok, watch} <-
           %PriceWatchRule{}
           |> PriceWatchRule.create_changeset(create_attrs)
           |> Repo.insert() do
      {:ok, load_watch!(watch.id)}
    end
  end

  @spec list_watch_rules_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_watch_rules_query(user_id, opts) do
    PriceWatchRule
    |> where([watch], watch.user_id == ^user_id)
    |> maybe_filter_watch_enabled(Keyword.get(opts, :enabled))
    |> order_by([watch], desc: watch.inserted_at, desc: watch.id)
    |> preload([:product, merchant_product: :merchant])
  end

  @spec update_watch(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_watch(user_id, entropy_id, attrs) do
    case Repo.get_by(PriceWatchRule, user_id: user_id, entropy_id: entropy_id) do
      nil ->
        {:error, :not_found}

      watch ->
        watch
        |> PriceWatchRule.update_changeset(atomize_watch_attrs(attrs))
        |> Changeset.change(%{
          last_condition_met: false,
          last_evaluated_price_point_id: nil,
          last_evaluated_at: nil,
          last_event_at: nil
        })
        |> Repo.update()
    end
  end

  @spec delete_watch(pos_integer(), Ecto.UUID.t()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found}
  def delete_watch(user_id, entropy_id) do
    case Repo.get_by(PriceWatchRule, user_id: user_id, entropy_id: entropy_id) do
      nil -> {:error, :not_found}
      watch -> Repo.delete(watch)
    end
  end

  defp validate_scope(product_id, merchant_product_id, currency) when valid_id(product_id) do
    with %Product{} <- Repo.get(Product, product_id),
         {:ok, merchant_product} <-
           validate_scope_offer(product_id, merchant_product_id, currency) do
      {:ok,
       %{product_id: product_id, merchant_product_id: merchant_product && merchant_product.id}}
    else
      nil -> {:error, :product_not_found}
      {:error, _reason} = error -> error
    end
  end

  defp validate_scope(_product_id, _merchant_product_id, _currency),
    do: {:error, :product_not_found}

  defp validate_scope_offer(_product_id, nil, _currency), do: {:ok, nil}

  defp validate_scope_offer(product_id, merchant_product_id, currency)
       when valid_id(merchant_product_id) do
    case Repo.get(MerchantProduct, merchant_product_id) do
      %MerchantProduct{product_id: ^product_id, currency: ^currency} = merchant_product ->
        {:ok, merchant_product}

      _ ->
        {:error, invalid_scope_changeset(product_id, merchant_product_id, currency)}
    end
  end

  defp validate_scope_offer(product_id, merchant_product_id, currency),
    do: {:error, invalid_scope_changeset(product_id, merchant_product_id, currency)}

  defp invalid_scope_changeset(product_id, merchant_product_id, currency) do
    %PriceWatchRule{}
    |> PriceWatchRule.create_changeset(%{
      user_id: 1,
      product_id: product_id,
      merchant_product_id: merchant_product_id,
      rule_type: :target_price,
      currency: currency,
      target_amount: 0
    })
    |> Changeset.add_error(:merchant_product_id, "must belong to the product and currency")
  end

  defp initial_condition(attrs, fact) do
    case Map.get(attrs, :rule_type) do
      rule when rule in [:back_in_stock, :newly_available] -> fact.eligible
      _ -> false
    end
  end

  defp maybe_filter_watch_enabled(query, enabled) when is_boolean(enabled),
    do: where(query, [watch], watch.enabled == ^enabled)

  defp maybe_filter_watch_enabled(query, _enabled), do: query

  defp atomize_watch_attrs(attrs) do
    allowed = [
      :product_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :target_amount,
      :percentage_drop,
      :enabled,
      :cooldown_seconds
    ]

    Map.new(allowed, fn key -> {key, Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))} end)
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp normalize_currency(currency) when is_binary(currency), do: String.upcase(currency)
  defp normalize_currency(currency), do: currency

  defp load_watch!(watch_id) do
    PriceWatchRule
    |> Repo.get!(watch_id)
    |> Repo.preload([:product, merchant_product: :merchant])
  end
end

defmodule ProductCompare.CommerceAttribution.Revenue do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Revenue.Aggregation
  alias ProductCompare.CommerceAttribution.Revenue.Filters
  alias ProductCompare.CommerceAttribution.Revenue.Projection

  @spec dashboard_revenue_summary(map() | keyword()) :: map()
  def dashboard_revenue_summary(opts \\ %{}) do
    filters = Filters.normalize(opts)
    Projection.summary(filters, Aggregation.metrics(filters), Aggregation.click_count(filters))
  end

  @spec merchant_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def merchant_revenue_summary(merchant_id, opts \\ %{}) do
    opts
    |> Filters.put(:merchant_id, merchant_id)
    |> dashboard_revenue_summary()
  end

  @spec product_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def product_revenue_summary(product_id, opts \\ %{}) do
    opts
    |> Filters.put(:product_id, product_id)
    |> dashboard_revenue_summary()
  end

  @spec network_revenue_summary(atom() | String.t(), map() | keyword()) :: map()
  def network_revenue_summary(network, opts \\ %{}) do
    opts
    |> Filters.put(:network, network)
    |> dashboard_revenue_summary()
  end
end

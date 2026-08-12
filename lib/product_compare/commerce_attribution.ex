defmodule ProductCompare.CommerceAttribution do
  @moduledoc """
  Attribution context for commerce redirects, click sessions, conversions, and price-paid facts.
  """

  alias ProductCompare.CommerceAttribution.Clicks
  alias ProductCompare.CommerceAttribution.ClickLedger
  alias ProductCompare.CommerceAttribution.Conversions
  alias ProductCompare.CommerceAttribution.Revenue
  alias ProductCompare.CommerceAttribution.TrendingActivity
  alias ProductCompare.CommerceAttribution.Visitors
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.CommerceAttribution.AnonymousVisitor

  @spec get_or_create_anonymous_visitor(Ecto.UUID.t()) ::
          {:ok, AnonymousVisitor.t()} | {:error, Ecto.Changeset.t()}
  def get_or_create_anonymous_visitor(entropy_id), do: Visitors.get_or_create(entropy_id)
  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs), do: Clicks.upsert_commerce_link(attrs)

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs), do: Clicks.create_click_session(attrs)

  @spec track_outbound_click(map()) ::
          {:ok,
           %{
             commerce_link: CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound_click(attrs), do: Clicks.track_outbound_click(attrs)

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id), do: Clicks.redirect_destination(click_id)

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs), do: Conversions.ingest_conversion(attrs)

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs), do: Conversions.create_purchase_price_fact(attrs)

  @spec dashboard_revenue_summary(map() | keyword()) :: map()
  def dashboard_revenue_summary(opts \\ %{}), do: Revenue.dashboard_revenue_summary(opts)

  @spec click_ledger_query(map() | keyword()) :: Ecto.Query.t()
  def click_ledger_query(opts \\ %{}), do: ClickLedger.query(opts)

  @spec merchant_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def merchant_revenue_summary(merchant_id, opts \\ %{}),
    do: Revenue.merchant_revenue_summary(merchant_id, opts)

  @spec product_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def product_revenue_summary(product_id, opts \\ %{}),
    do: Revenue.product_revenue_summary(product_id, opts)

  @spec network_revenue_summary(String.t(), map() | keyword()) :: map()
  def network_revenue_summary(network, opts \\ %{}),
    do: Revenue.network_revenue_summary(network, opts)

  @doc false
  @spec trending_product_candidates_query(keyword()) :: Ecto.Query.t()
  def trending_product_candidates_query(opts \\ []), do: TrendingActivity.candidates_query(opts)
end

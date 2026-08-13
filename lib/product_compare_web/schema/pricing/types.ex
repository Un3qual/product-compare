defmodule ProductCompareWeb.Schema.Pricing.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  import Absinthe.Resolution.Helpers, only: [dataloader: 2]

  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.Affiliate.Reads, as: AffiliateReads
  alias ProductCompareWeb.Resolvers.Pricing.Evidence
  alias ProductCompareWeb.Resolvers.Pricing.Merchants
  alias ProductCompareWeb.Resolvers.Pricing.Offers
  alias ProductCompareWeb.Resolvers.SeoResolver

  input_object :merchant_products_input do
    field :product_id, non_null(:id)
    field :merchant_id, :id
    field :active_only, :boolean
  end

  node object(:merchant) do
    field :name, non_null(:string)
    field :domain, non_null(:string)
    field :slug, non_null(:string)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.merchant_metadata/3

    field :detail_summary, non_null(:merchant_detail_summary),
      resolve: &Merchants.merchant_detail_summary/3

    connection field :merchant_products,
                 node_type: :merchant_product,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&Merchants.merchant_offers/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :merchant_detail_summary do
    field :active_offer_count, non_null(:integer)
    field :distinct_product_count, non_null(:integer)
    field :observed_offer_count, non_null(:integer)
    field :eligible_offer_count, non_null(:integer)
    field :fresh_offer_count, non_null(:integer)
    field :aging_offer_count, non_null(:integer)
    field :stale_offer_count, non_null(:integer)
    field :unobserved_offer_count, non_null(:integer)
    field :last_observed_at, :datetime
  end

  connection node_type: :merchant, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:merchant)
      field :cursor, non_null(:string)
    end
  end

  node object(:merchant_product) do
    field :merchant_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:merchant, merchant_product.merchant_id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:product, merchant_product.product_id)
      end)
    end

    field :external_sku, :string
    field :url, non_null(:string)
    field :currency, non_null(:string)
    field :last_seen_at, :datetime
    field :is_active, non_null(:boolean)
    field :merchant, :merchant, resolve: dataloader(Pricing, use_parent: true)
    field :product, :product, resolve: dataloader(Pricing, use_parent: true)
    field :latest_price, :price_point, resolve: &Offers.latest_price/3

    connection field :active_coupons, node_type: :active_coupon, paginate: :forward do
      resolve(&AffiliateReads.merchant_product_active_coupons/3)
    end

    connection field :price_history, node_type: :price_point, paginate: :forward do
      arg(:from, :datetime)
      arg(:to, :datetime)

      resolve(&Offers.price_history/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  node object(:price_point) do
    field :merchant_product_id, non_null(:id) do
      resolve(fn price_point, _, _ ->
        GlobalId.encode_required(:merchant_product, price_point.merchant_product_id)
      end)
    end

    field :observed_at, non_null(:datetime)
    field :price, non_null(:decimal)
    field :shipping, :decimal
    field :in_stock, :boolean

    field :source_artifact, :source_artifact do
      resolve(&Evidence.source_artifact/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, :datetime
  end

  object :product_offer_truth do
    field :as_of, non_null(:datetime)
    field :fresh_for_seconds, non_null(:integer)
    field :stale_after_seconds, non_null(:integer)
    field :offer_count, non_null(:integer)
    field :observed_offer_count, non_null(:integer)
    field :eligible_offer_count, non_null(:integer)
    field :currency_summaries, non_null(list_of(non_null(:offer_currency_summary)))
  end

  object :product_price_trend_currency do
    field :currency, non_null(:string)
    field :merchants, non_null(list_of(non_null(:product_price_trend_merchant)))
    field :points, non_null(list_of(non_null(:product_price_trend_point)))
  end

  object :product_price_trend_merchant do
    field :id, non_null(:id) do
      resolve(fn merchant, _, _ ->
        GlobalId.encode_required(:merchant, merchant.merchant_id)
      end)
    end

    field :name, non_null(:string)

    field :merchant_product_id, non_null(:id) do
      resolve(fn merchant, _, _ ->
        GlobalId.encode_required(:merchant_product, merchant.merchant_product_id)
      end)
    end
  end

  object :product_price_trend_point do
    field :observed_at, non_null(:datetime)
    field :lowest_price, non_null(:decimal)
    field :average_price, non_null(:decimal)

    field :lowest_merchant_product_id, non_null(:id) do
      resolve(fn point, _, _ ->
        GlobalId.encode_required(:merchant_product, point.lowest_merchant_product_id)
      end)
    end

    field :merchant_prices, non_null(list_of(non_null(:product_price_trend_merchant_price)))
  end

  object :product_price_trend_merchant_price do
    field :merchant_product_id, non_null(:id) do
      resolve(fn price, _, _ ->
        GlobalId.encode_required(:merchant_product, price.merchant_product_id)
      end)
    end

    field :price, non_null(:decimal)
  end

  object :offer_currency_summary do
    field :currency, non_null(:string)
    field :offer_count, non_null(:integer)
    field :observed_offer_count, non_null(:integer)
    field :eligible_offer_count, non_null(:integer)
    field :best_offer, :current_offer
  end

  object :current_offer do
    field :merchant_product_id, non_null(:id) do
      resolve(fn offer, _, _ ->
        GlobalId.encode_required(:merchant_product, offer.merchant_product_id)
      end)
    end

    field :currency, non_null(:string)
    field :item_price, :decimal
    field :shipping, :decimal
    field :landed_price, :decimal
    field :landed_price_complete, non_null(:boolean)
    field :stock_status, non_null(:offer_stock_status)
    field :freshness, non_null(:offer_freshness)
    field :observed_at, :datetime
    field :eligible, non_null(:boolean)
    field :source_artifact, :source_artifact
  end

  enum :offer_stock_status do
    value(:in_stock)
    value(:out_of_stock)
    value(:unknown)
  end

  enum :offer_freshness do
    value(:fresh)
    value(:aging)
    value(:stale)
    value(:unobserved)
  end

  connection node_type: :price_point, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:price_point)
      field :cursor, non_null(:string)
    end
  end

  connection node_type: :merchant_product, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:merchant_product)
      field :cursor, non_null(:string)
    end
  end
end

defmodule ProductCompareWeb.Schema.Types.Commerce do
  use Absinthe.Schema.Notation

  import Absinthe.Resolution.Helpers, only: [dataloader: 2]

  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.AffiliateResolver
  alias ProductCompareWeb.Resolvers.IngestionResolver
  alias ProductCompareWeb.Resolvers.PricingResolver
  alias ProductCompareWeb.Resolvers.SeoResolver

  input_object :upsert_affiliate_network_input do
    field :name, non_null(:string)
  end

  input_object :track_commerce_click_input do
    field :merchant_product_id, non_null(:id)
  end

  input_object :revenue_summary_input do
    field :merchant_id, :id
    field :product_id, :id
    field :network, :string
    field :currency, :string
    field :from, :string
    field :to, :string
  end

  object :revenue_summary do
    field :filters, non_null(:revenue_summary_filters)
    field :metrics, non_null(:revenue_summary_metrics)
    field :suppression, non_null(:revenue_summary_suppression)
  end

  object :revenue_summary_filters do
    field :currency, :string
    field :from, :string
    field :merchant_id, :id
    field :network, :string
    field :product_id, :id
    field :to, :string
  end

  object :revenue_summary_metrics do
    field :average_paid_price, :string
    field :clicks, :integer
    field :commission_revenue, :string
    field :conversions, :integer
    field :currency, :string
    field :gross_order_value, :string
  end

  object :revenue_summary_suppression do
    field :suppressed, non_null(:boolean)
    field :threshold, non_null(:integer)
  end

  input_object :upsert_affiliate_program_input do
    field :affiliate_network_id, non_null(:id)
    field :merchant_id, non_null(:id)
    field :program_code, :string
    field :status, :string
  end

  input_object :upsert_affiliate_link_input do
    field :merchant_product_id, non_null(:id)
    field :affiliate_network_id, :id
    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
  end

  input_object :create_coupon_input do
    field :merchant_id, non_null(:id)
    field :affiliate_network_id, :id
    field :artifact_id, :id
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
  end

  input_object :active_coupons_input do
    field :merchant_id, non_null(:id)
    field :at, :datetime
    field :first, :integer
    field :after, :string
  end

  input_object :merchant_products_input do
    field :product_id, non_null(:id)
    field :merchant_id, :id
    field :active_only, :boolean
    field :first, :integer
    field :after, :string
  end

  input_object :update_cj_program_input do
    field :id, non_null(:id)
    field :stage, non_null(:cj_program_stage)
    field :note, :string
  end

  object :upsert_affiliate_network_payload do
    field :network, :affiliate_network
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_program_payload do
    field :program, :affiliate_program
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :upsert_affiliate_link_payload do
    field :link, :affiliate_link
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :create_coupon_payload do
    field :coupon, :coupon
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :track_commerce_click_payload do
    field :redirect_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :active_coupons_payload do
    field :coupons, non_null(:coupon_connection)
  end

  object :affiliate_network do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn network, _, _ -> GlobalId.encode_required(:affiliate_network, network.id) end)
    end

    field :name, non_null(:string)
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_program do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:affiliate_program, program.id) end)
    end

    field :affiliate_network_id, non_null(:id) do
      resolve(fn program, _, _ ->
        GlobalId.encode_required(:affiliate_network, program.affiliate_network_id)
      end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:merchant, program.merchant_id) end)
    end

    field :program_code, :string
    field :status, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :affiliate_link do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn link, _, _ -> GlobalId.encode_required(:affiliate_link, link.id) end)
    end

    field :merchant_product_id, non_null(:id) do
      resolve(fn link, _, _ ->
        GlobalId.encode_required(:merchant_product, link.merchant_product_id)
      end)
    end

    field :affiliate_network_id, :id do
      resolve(fn link, _, _ ->
        GlobalId.encode_optional(:affiliate_network, link.affiliate_network_id)
      end)
    end

    field :original_url, non_null(:string)
    field :affiliate_url, non_null(:string)
    field :last_verified_at, :datetime
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :coupon do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn coupon, _, _ -> GlobalId.encode_required(:coupon, coupon.id) end)
    end

    field :merchant_id, non_null(:id) do
      resolve(fn coupon, _, _ -> GlobalId.encode_required(:merchant, coupon.merchant_id) end)
    end

    field :affiliate_network_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:affiliate_network, coupon.affiliate_network_id)
      end)
    end

    field :artifact_id, :id do
      resolve(fn coupon, _, _ ->
        GlobalId.encode_optional(:source_artifact, coupon.artifact_id)
      end)
    end

    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :datetime
    field :valid_to, :datetime
    field :terms, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :coupon_connection do
    field :edges, non_null(list_of(non_null(:coupon_edge)))
    field :page_info, non_null(:page_info)
  end

  object :coupon_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:coupon)
  end

  object :active_coupon do
    field :code, non_null(:string)
    field :description, :string
    field :discount_type, non_null(:coupon_discount_type)
    field :discount_value, :decimal
    field :currency, :string
    field :valid_to, :datetime
    field :terms, :string
  end

  object :active_coupon_connection do
    field :edges, non_null(list_of(non_null(:active_coupon_edge)))
    field :page_info, non_null(:page_info)
  end

  object :active_coupon_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:active_coupon)
  end

  enum :coupon_discount_type do
    value(:percent)
    value(:amount)
    value(:free_shipping)
    value(:other)
  end

  object :update_cj_program_payload do
    field :program, :cj_program
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :merchant do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn merchant, _, _ -> GlobalId.encode_required(:merchant, merchant.id) end)
    end

    field :name, non_null(:string)
    field :domain, non_null(:string)
    field :slug, non_null(:string)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.merchant_metadata/3

    field :detail_summary, non_null(:merchant_detail_summary),
      resolve: &PricingResolver.merchant_detail_summary/3

    field :merchant_products, non_null(:merchant_product_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&PricingResolver.merchant_offers/3)
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

  object :merchant_connection do
    field :edges, non_null(list_of(non_null(:merchant_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant)
  end

  enum :cj_program_stage, name: "CJProgramStage" do
    value(:new, as: "new")
    value(:considering, as: "considering")
    value(:selected, as: "selected")
    value(:applied, as: "applied")
    value(:accepted, as: "accepted")
    value(:not_pursuing, as: "not_pursuing")
    value(:declined, as: "declined")
  end

  enum :cj_program_sort, name: "CJProgramSort" do
    value(:name_asc, as: :name_asc)
    value(:last_changed_desc, as: :last_changed_desc)
    value(:feed_count_desc, as: :feed_count_desc)
  end

  enum :cj_program_warning_code, name: "CJProgramWarningCode" do
    value(:missing_advertiser_name, as: "missing_advertiser_name")
    value(:missing_product_count, as: "missing_product_count")
    value(:non_us_market, as: "non_us_market")
    value(:non_usd_currency, as: "non_usd_currency")
    value(:non_english_language, as: "non_english_language")
  end

  object :cj_program, name: "CJProgram" do
    field :id, non_null(:id) do
      resolve(fn program, _, _ -> GlobalId.encode_required(:cj_program, program.entropy_id) end)
    end

    field :advertiser_id, non_null(:string)
    field :advertiser_name, :string
    field :stage, non_null(:cj_program_stage)
    field :note, :string

    field :last_changed, non_null(:datetime),
      resolve: fn program, _, _ -> {:ok, program.changed_at} end

    field :feed_count, :integer
    field :warning_codes, non_null(list_of(non_null(:cj_program_warning_code)))

    field :feeds, non_null(:merchant_feed_candidate_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&IngestionResolver.cj_program_feeds/3)
    end
  end

  object :cj_program_stage_counts, name: "CJProgramStageCounts" do
    field :new, non_null(:integer)
    field :considering, non_null(:integer)
    field :selected, non_null(:integer)
    field :applied, non_null(:integer)
    field :accepted, non_null(:integer)
    field :not_pursuing, non_null(:integer)
    field :declined, non_null(:integer)
  end

  object :cj_program_connection, name: "CJProgramConnection" do
    field :edges, non_null(list_of(non_null(:cj_program_edge)))
    field :page_info, non_null(:page_info)
  end

  object :cj_program_edge, name: "CJProgramEdge" do
    field :cursor, non_null(:string)
    field :node, non_null(:cj_program)
  end

  object :merchant_feed_candidate do
    field :id, non_null(:id) do
      resolve(fn candidate, _, _ ->
        GlobalId.encode_required(:merchant_feed_candidate, candidate.id)
      end)
    end

    field :provider, non_null(:string)
    field :provider_feed_id, non_null(:string)
    field :advertiser_id, :string
    field :advertiser_name, :string
    field :advertiser_country, :string
    field :source_feed_type, :string
    field :currency, :string
    field :language, :string
    field :feed_name, :string
    field :product_count, :integer
    field :provider_last_updated_at, :datetime
    field :last_seen_at, non_null(:datetime)
  end

  object :merchant_feed_candidate_connection do
    field :edges, non_null(list_of(non_null(:merchant_feed_candidate_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_feed_candidate_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant_feed_candidate)
  end

  object :merchant_product do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn merchant_product, _, _ ->
        GlobalId.encode_required(:merchant_product, merchant_product.id)
      end)
    end

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
    field :latest_price, :price_point, resolve: &PricingResolver.latest_price/3

    field :active_coupons, :active_coupon_connection do
      arg(:first, :integer)
      arg(:after, :string)

      resolve(&AffiliateResolver.merchant_product_active_coupons/3)
    end

    field :price_history, :price_point_connection do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:from, :datetime)
      arg(:to, :datetime)

      resolve(&PricingResolver.price_history/3)
    end

    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :price_point do
    interface(:node)

    field :id, non_null(:id) do
      resolve(fn price_point, _, _ -> GlobalId.encode_required(:price_point, price_point.id) end)
    end

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
      resolve(&PricingResolver.source_artifact/3)
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

  object :price_point_connection do
    field :edges, non_null(list_of(non_null(:price_point_edge)))
    field :page_info, non_null(:page_info)
  end

  object :price_point_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:price_point)
  end

  object :merchant_product_connection do
    field :edges, non_null(list_of(non_null(:merchant_product_edge)))
    field :page_info, non_null(:page_info)
  end

  object :merchant_product_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:merchant_product)
  end
end

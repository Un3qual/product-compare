defmodule ProductCompareWeb.Schema.CommerceAttribution.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  enum :commerce_click_source_surface do
    value(:web)
    value(:api)
    value(:extension)
  end

  enum :commerce_attribution_link_type do
    value(:affiliate)
    value(:non_affiliate)
  end

  enum :commerce_conversion_status do
    value(:pending)
    value(:approved)
    value(:reversed)
    value(:paid)
  end

  enum :commerce_attribution_confidence do
    value(:high)
    value(:low)
    value(:unmatched)
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

  object :commerce_attribution_click do
    field :click_id, non_null(:id)
    field :inserted_at, non_null(:datetime)
    field :source_surface, non_null(:commerce_click_source_surface)
    field :user_id, :id
    field :user_email, :string
    field :anonymous_id, :string
    field :referrer, :string
    field :user_agent, :string
    field :ip_address, :string
    field :merchant_id, non_null(:id)
    field :merchant_name, non_null(:string)
    field :product_id, :id
    field :product_name, :string
    field :merchant_product_id, :id
    field :merchant_product_external_sku, :string
    field :affiliate_program_id, :id
    field :affiliate_program_code, :string
    field :affiliate_network_id, :id
    field :affiliate_network_code, :string
    field :affiliate_network_name, :string
    field :link_type, non_null(:commerce_attribution_link_type)

    field :matched_conversions,
          non_null(list_of(non_null(:commerce_attribution_matched_conversion)))
  end

  object :commerce_attribution_matched_conversion do
    field :network_conversion_ref, non_null(:string)
    field :status, non_null(:commerce_conversion_status)
    field :attribution_confidence, non_null(:commerce_attribution_confidence)
    field :currency, non_null(:string)
    field :order_amount, :decimal
    field :commission_amount, :decimal
    field :purchased_at, :datetime
    field :reported_at, non_null(:datetime)
  end

  connection node_type: :commerce_attribution_click,
             non_null_edges: true,
             non_null_edge: true do
    edge do
      field :node, non_null(:commerce_attribution_click)
      field :cursor, non_null(:string)
    end
  end

  object :track_commerce_click_payload do
    field :redirect_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end
end

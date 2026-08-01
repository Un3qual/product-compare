defmodule ProductCompareWeb.Schema.CommerceAttribution.Types do
  use Absinthe.Schema.Notation

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

  object :track_commerce_click_payload do
    field :redirect_path, :string
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end
end

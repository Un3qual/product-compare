defmodule ProductCompareWeb.Schema.CommerceAttribution.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.CommerceAttribution.Reads

  object :commerce_attribution_queries do
    @desc "Returns individual commerce attribution clicks for operators."
    connection field :commerce_attribution_clicks,
                 node_type: :commerce_attribution_click,
                 non_null_connection: true,
                 paginate: :forward do
      arg(:input, :revenue_summary_input)
      resolve(&Reads.commerce_attribution_clicks/3)
    end

    @desc "Returns aggregate commerce revenue metrics for operators."
    field :revenue_summary, :revenue_summary do
      arg(:input, :revenue_summary_input)
      resolve(&Reads.revenue_summary/3)
    end
  end
end

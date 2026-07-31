defmodule ProductCompareWeb.Schema.CommerceAttribution.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.CommerceAttributionResolver

  object :commerce_attribution_queries do
    @desc "Returns aggregate commerce revenue metrics with public-safe suppression metadata."
    field :revenue_summary, :revenue_summary do
      arg(:input, :revenue_summary_input)
      resolve(&CommerceAttributionResolver.revenue_summary/3)
    end
  end
end

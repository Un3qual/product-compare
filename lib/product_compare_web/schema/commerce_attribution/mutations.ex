defmodule ProductCompareWeb.Schema.CommerceAttribution.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.CommerceAttribution.Mutations

  object :commerce_attribution_mutations do
    @desc "Creates a first-party tracked outbound commerce click."
    field :track_commerce_click, non_null(:track_commerce_click_payload) do
      arg(:input, non_null(:track_commerce_click_input))
      resolve(&Mutations.track_commerce_click/3)
    end
  end
end

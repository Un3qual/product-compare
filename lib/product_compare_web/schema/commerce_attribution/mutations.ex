defmodule ProductCompareWeb.Schema.CommerceAttribution.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.CommerceAttribution.Mutations

  object :commerce_attribution_mutations do
    @desc "Updates editable CJ commission ingestion settings as an operator."
    field :update_cj_commission_ingestion_settings,
          non_null(:cj_commission_ingestion_payload) do
      arg(:input, non_null(:update_cj_commission_ingestion_settings_input))
      resolve(&Mutations.update_cj_commission_ingestion_settings/3)
    end

    @desc "Queues CJ commission ingestion immediately as an operator."
    field :run_cj_commission_ingestion_now, non_null(:cj_commission_ingestion_payload) do
      resolve(&Mutations.run_cj_commission_ingestion_now/3)
    end

    @desc "Creates a first-party tracked outbound commerce click."
    field :track_commerce_click, non_null(:track_commerce_click_payload) do
      arg(:input, non_null(:track_commerce_click_input))
      resolve(&Mutations.track_commerce_click/3)
    end
  end
end

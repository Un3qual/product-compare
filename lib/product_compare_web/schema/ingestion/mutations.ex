defmodule ProductCompareWeb.Schema.Ingestion.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.IngestionResolver

  object :ingestion_mutations do
    @desc "Updates the lifecycle state and optional note for one CJ advertiser program."
    field :update_cj_program, non_null(:update_cj_program_payload) do
      arg(:input, non_null(:update_cj_program_input))
      resolve(&IngestionResolver.update_cj_program/3)
    end
  end
end

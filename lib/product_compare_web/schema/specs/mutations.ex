defmodule ProductCompareWeb.Schema.Specs.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.SpecsResolver

  object :specs_mutations do
    @desc "Proposes an authenticated, typed replacement for a product specification."
    field :propose_specification_correction,
          non_null(:specification_correction_payload) do
      arg(:input, non_null(:propose_specification_correction_input))
      resolve(&SpecsResolver.propose_specification_correction/3)
    end

    @desc "Accepts or rejects a specification correction as an operator."
    field :moderate_specification_correction,
          non_null(:specification_correction_payload) do
      arg(:input, non_null(:moderate_specification_correction_input))
      resolve(&SpecsResolver.moderate_specification_correction/3)
    end
  end
end

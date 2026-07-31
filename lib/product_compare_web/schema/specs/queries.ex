defmodule ProductCompareWeb.Schema.Specs.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.Specs.Reads

  object :specs_queries do
    @desc "Returns safe display metadata for a source artifact."
    field :source_artifact, :source_artifact do
      arg(:id, non_null(:id))
      resolve(&Reads.source_artifact/3)
    end

    @desc "Returns specification corrections submitted by the current user."
    connection field :my_specification_corrections,
                 node_type: :specification_correction,
                 non_null_connection: true do
      arg(:status, :specification_correction_status)
      resolve(&Reads.my_specification_corrections/3)
    end

    @desc "Returns the operator-only specification correction moderation queue."
    connection field :specification_correction_moderation_queue,
                 node_type: :specification_correction,
                 non_null_connection: true do
      arg(:status, :specification_correction_status)
      resolve(&Reads.specification_correction_moderation_queue/3)
    end
  end
end

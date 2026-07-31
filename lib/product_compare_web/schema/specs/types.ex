defmodule ProductCompareWeb.Schema.Specs.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.Specs.Corrections

  input_object :specification_correction_value_input do
    field :value_bool, :boolean
    field :value_int, :integer
    field :value_num, :decimal
    field :value_text, :string
    field :value_date, :date
    field :value_timestamp, :datetime
    field :unit_id, :id
    field :enum_option_id, :id
  end

  input_object :propose_specification_correction_input do
    field :product_id, non_null(:id)
    field :attribute_id, non_null(:id)
    field :value, non_null(:specification_correction_value_input)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
  end

  input_object :moderate_specification_correction_input do
    field :id, non_null(:id)
    field :decision, non_null(:specification_correction_status)
    field :moderation_note, :string
  end

  object :specification_correction_payload do
    field :correction, :specification_correction
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  node object(:source_artifact) do
    field :source_kind, non_null(:string) do
      resolve(fn %{source: %{kind: kind}}, _, _ -> {:ok, kind} end)
    end

    field :source_name, non_null(:string) do
      resolve(fn %{source: %{name: name}}, _, _ -> {:ok, name} end)
    end

    field :source_domain, :string do
      resolve(fn %{source: source}, _, _ -> {:ok, source.domain} end)
    end

    field :url, :string
    field :fetched_at, non_null(:datetime)
  end

  enum :specification_correction_status do
    value(:pending)
    value(:accepted)
    value(:rejected)
  end

  object :specification_correction do
    field :id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:specification_correction, correction.id)
      end)
    end

    field :product_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product, correction.product_id)
      end)
    end

    field :attribute_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:attribute, correction.attribute_id)
      end)
    end

    field :claim_id, non_null(:id) do
      resolve(fn correction, _, _ ->
        GlobalId.encode_required(:product_attribute_claim, correction.claim_id)
      end)
    end

    field :status, non_null(:specification_correction_status)
    field :reason, non_null(:string)
    field :source_url, :string
    field :explanation, :string
    field :value_text, non_null(:string), resolve: &Corrections.value_text/3
    field :moderation_note, :string, resolve: &Corrections.moderation_note/3

    field :submitted_at, non_null(:datetime),
      resolve: fn correction, _, _ -> {:ok, correction.inserted_at} end

    field :reviewed_at, :datetime
  end

  connection node_type: :specification_correction,
             non_null_edges: true,
             non_null_edge: true do
    edge do
      field :node, non_null(:specification_correction)
      field :cursor, non_null(:string)
    end
  end

  object :product_attribute_evidence do
    field :excerpt, :string
    field :source_artifact, non_null(:source_artifact)
  end
end

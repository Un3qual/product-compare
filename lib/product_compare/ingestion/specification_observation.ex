defmodule ProductCompare.Ingestion.SpecificationObservation do
  @moduledoc """
  Source-neutral typed specification observation.
  """

  @enforce_keys [:attribute_code, :data_type, :value]
  defstruct [
    :attribute_code,
    :data_type,
    :value,
    :unit_code,
    :enum_option_code,
    :confidence,
    :evidence_excerpt
  ]

  @type t :: %__MODULE__{
          attribute_code: String.t(),
          data_type: atom(),
          value: term(),
          unit_code: String.t() | nil,
          enum_option_code: String.t() | nil,
          confidence: Decimal.t() | nil,
          evidence_excerpt: String.t() | nil
        }
end

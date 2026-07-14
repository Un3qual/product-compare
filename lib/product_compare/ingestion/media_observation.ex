defmodule ProductCompare.Ingestion.MediaObservation do
  @moduledoc """
  Source-neutral product media observation.
  """

  @enforce_keys [:url]
  defstruct [:url, :alt_text, role: :gallery, position: 0]

  @type t :: %__MODULE__{
          url: String.t(),
          alt_text: String.t() | nil,
          role: :primary | :gallery,
          position: non_neg_integer()
        }
end

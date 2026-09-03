defmodule ProductCompare.CommerceAttribution.CJ.ImportRequest do
  @moduledoc false

  @enforce_keys [
    :publisher_ids,
    :from,
    :before,
    :max_pages,
    :trigger,
    :requested_by_user_id
  ]
  defstruct @enforce_keys

  @type t :: %__MODULE__{
          publisher_ids: [String.t()],
          from: DateTime.t(),
          before: DateTime.t(),
          max_pages: 1..100,
          trigger: :scheduled | :operator | :cli,
          requested_by_user_id: pos_integer() | nil
        }
end

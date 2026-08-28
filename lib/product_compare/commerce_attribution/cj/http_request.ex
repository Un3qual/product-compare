defmodule ProductCompare.CommerceAttribution.CJ.HttpRequest do
  @moduledoc false

  @enforce_keys [:method, :url, :headers, :body, :options]
  defstruct @enforce_keys

  @type t :: %__MODULE__{
          method: :post,
          url: String.t(),
          headers: [{String.t(), String.t()}],
          body: String.t(),
          options: keyword()
        }
end

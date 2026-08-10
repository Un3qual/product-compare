defmodule ProductCompare.Specs.HomeHighlights do
  @moduledoc false

  alias ProductCompare.Specs.Reads

  @spec highlights([term()], keyword()) :: %{optional(pos_integer()) => [map()]}
  def highlights(product_ids, opts) when is_list(product_ids) do
    limit = opts |> Keyword.get(:limit, 3) |> bounded_limit(3)

    product_ids
    |> Reads.list_current_attributes_for_products()
    |> Map.new(fn {product_id, attributes} -> {product_id, Enum.take(attributes, limit)} end)
  end

  def highlights(_product_ids, _opts), do: %{}

  defp bounded_limit(limit, _default) when is_integer(limit) and limit > 0, do: min(limit, 3)
  defp bounded_limit(_limit, default), do: default
end

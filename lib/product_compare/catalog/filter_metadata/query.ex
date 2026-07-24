defmodule ProductCompare.Catalog.FilterMetadata.Query do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product

  @spec filtered_products(map(), term()) :: Ecto.Query.t()
  def filtered_products(filters, omitted_group \\ nil) do
    Product
    |> Filtering.apply_filters_except(filters, omitted_group)
    |> exclude(:order_by)
  end

  @spec result_count(map()) :: non_neg_integer()
  def result_count(filters) do
    filters
    |> filtered_products()
    |> Repo.aggregate(:count, :id)
  end
end

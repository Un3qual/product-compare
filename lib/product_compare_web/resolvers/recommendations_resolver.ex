defmodule ProductCompareWeb.Resolvers.RecommendationsResolver do
  @moduledoc false

  alias ProductCompare.Catalog
  alias ProductCompare.Recommendations

  def comparison_recommendation(_parent, %{slugs: slugs, profile: profile}, _resolution)
      when is_list(slugs) do
    products = Catalog.list_products_by_slugs(slugs)

    if length(slugs) in 2..3 and Enum.all?(products) do
      {:ok, Recommendations.compare(Enum.map(products, & &1.id), profile)}
    else
      {:error, "recommendations require two or three existing products"}
    end
  end

  def comparison_recommendation(_parent, _args, _resolution),
    do: {:error, "invalid recommendation input"}
end

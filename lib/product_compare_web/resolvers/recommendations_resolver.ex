defmodule ProductCompareWeb.Resolvers.RecommendationsResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Recommendations
  alias ProductCompareWeb.GraphQL.Loader

  def comparison_recommendation(
        _parent,
        %{slugs: slugs, profile: profile},
        %{context: %{loader: loader}}
      )
      when is_list(slugs) do
    source = Loader.comparison_source()
    request = {slugs, profile}

    loader
    |> Loader.load(source, :recommendation, request)
    |> on_load(fn loader ->
      case Loader.get(loader, source, :recommendation, request) do
        {:error, message} -> {:error, message}
        recommendation -> {:ok, recommendation}
      end
    end)
  end

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

defmodule ProductCompareWeb.GraphQL.Loader do
  @moduledoc """
  Builds the request-scoped GraphQL dataloader sources.
  """

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.SourceArtifact

  @spec new(map()) :: Dataloader.t()
  def new(params \\ %{}) do
    Dataloader.new()
    |> Dataloader.add_source(Catalog, catalog_source(params))
    |> Dataloader.add_source(Pricing, pricing_source(params))
  end

  defp catalog_source(params) do
    Dataloader.Ecto.new(Repo, query: &catalog_query/2, default_params: params)
  end

  defp pricing_source(params) do
    Dataloader.Ecto.new(Repo,
      query: &pricing_query/2,
      default_params: params,
      run_batch: &pricing_run_batch/5
    )
  end

  defp catalog_query(ProductAttributeCurrent, _params) do
    ProductAttributeCurrent
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([_current, attribute], asc: attribute.display_name, asc: attribute.code)
    |> preload([_current, attribute],
      attribute: attribute,
      claim: [:unit, :enum_option, evidence_links: [artifact: :source]]
    )
  end

  defp catalog_query(ProductMedia, _params) do
    ProductMedia
    |> order_by([media], asc: media.position, asc: media.url, asc: media.id)
    |> preload([media], source_artifact: [:source])
  end

  defp catalog_query(SpecificationCorrection, _params) do
    SpecificationCorrection
    |> where([correction], correction.status in [:pending, :accepted])
    |> order_by([correction], asc: correction.attribute_id, asc: correction.id)
  end

  defp catalog_query(queryable, _params), do: queryable
  defp pricing_query(SourceArtifact, _params), do: preload(SourceArtifact, :source)
  defp pricing_query(queryable, _params), do: queryable

  defp pricing_run_batch(PricePoint, query, :latest_price, merchant_product_ids, repo_opts) do
    latest_prices =
      query
      |> Pricing.latest_prices_query(merchant_product_ids)
      |> Repo.all(repo_opts)
      |> Map.new(&{&1.merchant_product_id, &1})

    for merchant_product_id <- merchant_product_ids do
      [Map.get(latest_prices, merchant_product_id)]
    end
  end

  defp pricing_run_batch(queryable, query, col, inputs, repo_opts) do
    Dataloader.Ecto.run_batch(Repo, queryable, query, col, inputs, repo_opts)
  end
end

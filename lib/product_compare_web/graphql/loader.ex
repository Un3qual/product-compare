defmodule ProductCompareWeb.GraphQL.Loader do
  @moduledoc """
  Builds the request-scoped GraphQL dataloader sources.
  """

  alias ProductCompare.{Catalog, Pricing}

  alias ProductCompareWeb.GraphQL.Loader.{AssociationSources, ParentSources, RootSources}

  @merchant_detail_source {__MODULE__, :merchant_detail}
  @product_evidence_source {__MODULE__, :product_evidence}
  @community_connection_source {__MODULE__, :community_connections}
  @viewer_submission_source {__MODULE__, :viewer_community_submissions}
  @offer_connection_source {__MODULE__, :offer_connections}
  @home_offer_summary_source {__MODULE__, :home_offer_summaries}
  @category_source {__MODULE__, :categories}
  @authorized_node_source {__MODULE__, :authorized_nodes}

  @spec new(map()) :: Dataloader.t()
  def new(params \\ %{}) do
    Dataloader.new()
    |> Dataloader.add_source(Catalog, AssociationSources.catalog(params))
    |> Dataloader.add_source(Pricing, AssociationSources.pricing(params))
    |> Dataloader.add_source(
      @merchant_detail_source,
      ParentSources.merchant_detail()
    )
    |> Dataloader.add_source(
      @product_evidence_source,
      ParentSources.product_evidence()
    )
    |> Dataloader.add_source(
      @community_connection_source,
      ParentSources.community_connections()
    )
    |> Dataloader.add_source(
      @viewer_submission_source,
      ParentSources.viewer_submissions()
    )
    |> Dataloader.add_source(
      @offer_connection_source,
      ParentSources.offer_connections()
    )
    |> Dataloader.add_source(
      @home_offer_summary_source,
      ParentSources.home_offer_summaries(params)
    )
    |> Dataloader.add_source(
      @category_source,
      ParentSources.categories()
    )
    |> Dataloader.add_source(
      @authorized_node_source,
      RootSources.authorized_nodes()
    )
  end

  @spec merchant_detail_source() :: {module(), :merchant_detail}
  def merchant_detail_source, do: @merchant_detail_source

  @spec product_evidence_source() :: {module(), :product_evidence}
  def product_evidence_source, do: @product_evidence_source

  @spec community_connection_source() :: {module(), :community_connections}
  def community_connection_source, do: @community_connection_source

  @spec viewer_submission_source() :: {module(), :viewer_community_submissions}
  def viewer_submission_source, do: @viewer_submission_source

  @spec offer_connection_source() :: {module(), :offer_connections}
  def offer_connection_source, do: @offer_connection_source

  @spec home_offer_summary_source() :: {module(), :home_offer_summaries}
  def home_offer_summary_source, do: @home_offer_summary_source

  @spec category_source() :: {module(), :categories}
  def category_source, do: @category_source

  @spec authorized_node_source() :: {module(), :authorized_nodes}
  def authorized_node_source, do: @authorized_node_source
end

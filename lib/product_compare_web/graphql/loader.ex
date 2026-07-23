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
  @category_source {__MODULE__, :categories}
  @comparison_source {__MODULE__, :comparison}
  @public_slug_source {__MODULE__, :public_slugs}
  @public_opaque_source {__MODULE__, :public_opaque_keys}
  @authorized_node_source {__MODULE__, :authorized_nodes}
  @authorized_connection_source {__MODULE__, :authorized_connections}
  @operator_reporting_source {__MODULE__, :operator_reporting}
  @discovery_root_source {__MODULE__, :discovery_roots}

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
      @category_source,
      ParentSources.categories()
    )
    |> Dataloader.add_source(
      @comparison_source,
      RootSources.comparison()
    )
    |> Dataloader.add_source(
      @public_slug_source,
      RootSources.public_slugs()
    )
    |> Dataloader.add_source(
      @public_opaque_source,
      RootSources.public_opaque_keys()
    )
    |> Dataloader.add_source(
      @authorized_node_source,
      RootSources.authorized_nodes()
    )
    |> Dataloader.add_source(
      @authorized_connection_source,
      RootSources.authorized_connections()
    )
    |> Dataloader.add_source(
      @operator_reporting_source,
      RootSources.operator_reporting()
    )
    |> Dataloader.add_source(
      @discovery_root_source,
      RootSources.discovery_roots()
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

  @spec category_source() :: {module(), :categories}
  def category_source, do: @category_source

  @spec comparison_source() :: {module(), :comparison}
  def comparison_source, do: @comparison_source

  @spec public_slug_source() :: {module(), :public_slugs}
  def public_slug_source, do: @public_slug_source

  @spec public_opaque_source() :: {module(), :public_opaque_keys}
  def public_opaque_source, do: @public_opaque_source

  @spec authorized_node_source() :: {module(), :authorized_nodes}
  def authorized_node_source, do: @authorized_node_source

  @spec authorized_connection_source() :: {module(), :authorized_connections}
  def authorized_connection_source, do: @authorized_connection_source

  @spec operator_reporting_source() :: {module(), :operator_reporting}
  def operator_reporting_source, do: @operator_reporting_source

  @spec discovery_root_source() :: {module(), :discovery_roots}
  def discovery_root_source, do: @discovery_root_source
end

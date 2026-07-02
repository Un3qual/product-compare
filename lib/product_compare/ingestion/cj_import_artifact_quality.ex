defmodule ProductCompare.Ingestion.CJImportArtifactQuality do
  @moduledoc """
  Safe read-only artifact quality aggregate for persisted CJ imports.

  The summary uses read-only source lookup and returns counts and timestamps
  only. It does not call source resolvers, insert sources, expose artifact URLs,
  or return raw artifact/product payload fields.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @provider "cj"
  @source_kind "affiliate_feed"
  @source_name "CJ"
  @source_domain "cj.com"

  @type summary :: %{
          provider: String.t(),
          source_present: boolean(),
          artifact_count: non_neg_integer(),
          external_product_count: non_neg_integer(),
          linked_external_product_count: non_neg_integer(),
          unlinked_external_product_count: non_neg_integer(),
          latest_artifact_fetched_at: DateTime.t() | nil,
          latest_external_product_seen_at: DateTime.t() | nil
        }

  @spec summary() :: summary()
  def summary do
    case cj_source_id() do
      nil -> empty_summary()
      source_id -> source_summary(source_id)
    end
  end

  defp cj_source_id do
    Source
    |> where(
      [source],
      source.kind == @source_kind and source.name == @source_name and
        source.domain == @source_domain
    )
    |> select([source], source.id)
    |> Repo.one()
  end

  defp source_summary(source_id) do
    artifacts =
      SourceArtifact
      |> where([artifact], artifact.source_id == ^source_id)
      |> select([artifact], %{
        artifact_count: count(artifact.id),
        latest_artifact_fetched_at: max(artifact.fetched_at)
      })
      |> Repo.one()

    external_products =
      ExternalProduct
      |> where([external_product], external_product.source_id == ^source_id)
      |> select([external_product], %{
        external_product_count: count(external_product.id),
        linked_external_product_count:
          filter(count(external_product.id), not is_nil(external_product.product_id)),
        unlinked_external_product_count:
          filter(count(external_product.id), is_nil(external_product.product_id)),
        latest_external_product_seen_at: max(external_product.last_seen_at)
      })
      |> Repo.one()

    %{
      provider: @provider,
      source_present: true,
      artifact_count: artifacts.artifact_count,
      external_product_count: external_products.external_product_count,
      linked_external_product_count: external_products.linked_external_product_count,
      unlinked_external_product_count: external_products.unlinked_external_product_count,
      latest_artifact_fetched_at: artifacts.latest_artifact_fetched_at,
      latest_external_product_seen_at: external_products.latest_external_product_seen_at
    }
  end

  defp empty_summary do
    %{
      provider: @provider,
      source_present: false,
      artifact_count: 0,
      external_product_count: 0,
      linked_external_product_count: 0,
      unlinked_external_product_count: 0,
      latest_artifact_fetched_at: nil,
      latest_external_product_seen_at: nil
    }
  end
end

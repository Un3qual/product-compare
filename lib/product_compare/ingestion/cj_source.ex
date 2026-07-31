defmodule ProductCompare.Ingestion.CJSource do
  @moduledoc """
  Shared read-only identity for the persisted CJ affiliate-feed source.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @kind "affiliate_feed"
  @provider "cj"
  @name "CJ"
  @domain "cj.com"

  @spec query() :: Ecto.Query.t()
  def query do
    Source
    |> where(
      [source],
      source.kind == @kind and source.provider == @provider and source.name == @name and
        source.domain == @domain
    )
  end

  @spec id() :: integer() | nil
  def id do
    query()
    |> select([source], source.id)
    |> Repo.one()
  end
end

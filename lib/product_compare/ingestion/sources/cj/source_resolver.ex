defmodule ProductCompare.Ingestion.Sources.CJ.SourceResolver do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @source_attrs %{kind: "affiliate_feed", name: "CJ", domain: "cj.com"}

  @spec fetch_source() :: {:ok, Source.t()} | {:error, Ecto.Changeset.t()}
  def fetch_source do
    %Source{}
    |> Source.changeset(@source_attrs)
    |> Repo.insert(
      on_conflict: {:replace, [:domain, :updated_at]},
      conflict_target: [:kind, :name],
      returning: true
    )
  end
end

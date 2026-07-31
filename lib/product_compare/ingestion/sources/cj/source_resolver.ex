defmodule ProductCompare.Ingestion.Sources.CJ.SourceResolver do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Ingestion.SourceProviders
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @source_attrs %{kind: "affiliate_feed", provider: "cj", name: "CJ", domain: "cj.com"}

  @spec fetch_source() :: {:ok, Source.t()} | {:error, Ecto.Changeset.t()}
  def fetch_source do
    Repo.transaction(fn ->
      with {:ok, source} <- insert_or_fetch_source(),
           {:ok, _provider} <- SourceProviders.ensure_in_transaction(source.id, "cj"),
           {:ok, source} <- persist_domain(source) do
        %{source | provider: "cj"}
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp insert_or_fetch_source do
    %Source{}
    |> Source.changeset(@source_attrs)
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: [:kind, :name],
      returning: true
    )
    |> case do
      {:ok, %Source{id: nil}} ->
        {:ok,
         Source
         |> where([source], source.kind == "affiliate_feed" and source.name == "CJ")
         |> Repo.one!()}

      result ->
        result
    end
  end

  defp persist_domain(%Source{domain: "cj.com"} = source), do: {:ok, source}

  defp persist_domain(source) do
    source
    |> Source.changeset(%{domain: "cj.com"})
    |> Repo.update()
  end
end

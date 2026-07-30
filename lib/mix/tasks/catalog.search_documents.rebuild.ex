defmodule Mix.Tasks.Catalog.SearchDocuments.Rebuild do
  use Mix.Task

  alias ProductCompare.Catalog.SearchDocuments
  alias ProductCompare.MixTasks.RepoOnlyStartup

  @shortdoc "Rebuilds persisted catalog search documents"

  @impl Mix.Task
  def run(_args) do
    RepoOnlyStartup.start!()

    case SearchDocuments.rebuild() do
      {:ok, count} ->
        Mix.shell().info("Rebuilt #{count} catalog search #{document_label(count)}.")

      {:error, reason} ->
        Mix.raise("Catalog search-document rebuild failed: #{inspect(reason)}")
    end
  end

  defp document_label(1), do: "document"
  defp document_label(_count), do: "documents"
end

defmodule ProductCompare.Ingestion.CJRunCompletion do
  @moduledoc false

  alias ProductCompare.Ingestion.Runs
  alias ProductCompareSchemas.Ingestion.ImportRun

  @type counts :: %{
          pages_fetched: non_neg_integer(),
          records_failed: non_neg_integer(),
          records_fetched: non_neg_integer(),
          records_normalized: non_neg_integer(),
          records_persisted: non_neg_integer()
        }

  @spec complete(ImportRun.t(), counts(), non_neg_integer() | nil) ::
          {:ok, ImportRun.t()} | {:error, term()}
  def complete(%ImportRun{} = import_run, counts, next_cursor) do
    complete_with(import_run, counts, next_cursor, %{
      status: if(counts.records_failed == 0, do: "succeeded", else: "failed")
    })
  end

  @spec fail(ImportRun.t(), counts(), non_neg_integer() | nil, String.t()) ::
          {:ok, ImportRun.t()} | {:error, term()}
  def fail(%ImportRun{} = import_run, counts, next_cursor, error_summary) do
    complete_with(import_run, counts, next_cursor, %{
      error_summary: error_summary,
      status: "failed"
    })
  end

  defp complete_with(import_run, counts, next_cursor, attrs) do
    attrs =
      attrs
      |> Map.put(:cursor_end, next_cursor)
      |> Map.merge(counts)

    Runs.complete_import_run(import_run, attrs)
  end
end

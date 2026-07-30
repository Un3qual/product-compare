defmodule ProductCompare.Ingestion.ScheduledCursor do
  @moduledoc """
  Resolves scheduled CJ cursors from the durable import-run ledger.

  Successful runs advance to their recorded end cursor, including resetting to
  the beginning after the provider reports the end of a scope. Failed runs
  retry from their starting cursor.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.OptionNormalization
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @spec product(keyword()) :: non_neg_integer() | nil
  def product(opts) do
    if Keyword.get(opts, :complete_scope, false) do
      configured_cursor(opts)
    else
      query = %{
        "currency" => Keyword.fetch!(opts, :currency),
        "keywords" => Keyword.fetch!(opts, :keywords),
        "serviceableAreas" => Keyword.fetch!(opts, :serviceable_areas)
      }

      latest("shoppingProducts", query, configured_cursor(opts))
    end
  end

  @spec feed(keyword()) :: non_neg_integer() | nil
  def feed(opts) do
    query = %{"advertiserCountry" => Keyword.fetch!(opts, :advertiser_country)}

    latest("shoppingProductFeeds", query, configured_cursor(opts))
  end

  defp latest(surface, query, fallback) do
    ImportRun
    |> where(
      [run],
      run.provider == "cj" and run.surface == ^surface and run.query == ^query and
        not is_nil(run.finished_at)
    )
    |> order_by([run], desc: run.id)
    |> select([run], {run.status, run.cursor_start, run.cursor_end})
    |> limit(1)
    |> Repo.one()
    |> resolved_cursor(fallback)
  end

  defp resolved_cursor({:succeeded, _cursor_start, cursor_end}, _fallback), do: cursor_end

  defp resolved_cursor({_status, cursor_start, _cursor_end}, _fallback)
       when is_integer(cursor_start) and cursor_start >= 0,
       do: cursor_start

  defp resolved_cursor(_run, fallback), do: fallback

  defp configured_cursor(opts) do
    OptionNormalization.non_negative_integer_option(opts, :cursor, nil)
  end
end

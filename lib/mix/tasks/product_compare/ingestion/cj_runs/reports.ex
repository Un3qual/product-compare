defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns.Reports do
  @moduledoc false

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.ValueFormatter
  alias ProductCompare.Ingestion.CJRunReadiness
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @import_surface "shoppingProducts"
  @discovery_surface "shoppingProductFeeds"

  @spec run_report(keyword()) :: :ok
  def run_report(opts) do
    opts = Options.normalize_report_opts(opts)

    case Keyword.fetch!(opts, :report) do
      "latest" -> print_latest(opts)
      "history" -> print_history(opts)
      "failed" -> print_failed(opts)
    end
  end

  defp print_latest(opts) do
    surface = Keyword.fetch!(opts, :surface)
    latest_run = latest_run(surface)
    latest_success = CJRunReadiness.latest_success(surface)
    fresh = CJRunReadiness.fresh?(latest_success, Keyword.fetch!(opts, :max_age_hours))

    enforce_required_success!(
      surface,
      latest_success,
      fresh,
      Keyword.fetch!(opts, :require_success)
    )

    [
      {:provider, @provider},
      {:surface, surface},
      {:report, "latest"},
      {:latest_status, field(latest_run, :status)},
      {:latest_started_at, field(latest_run, :started_at)},
      {:latest_finished_at, field(latest_run, :finished_at)},
      {:latest_pages_fetched, field(latest_run, :pages_fetched)},
      {:latest_records_fetched, field(latest_run, :records_fetched)},
      {:latest_records_normalized, field(latest_run, :records_normalized)},
      {:latest_records_persisted, field(latest_run, :records_persisted)},
      {:latest_records_failed, field(latest_run, :records_failed)},
      {:latest_error_summary, sanitized_error_summary(latest_run)},
      {:latest_success_status, field(latest_success, :status)},
      {:latest_success_finished_at, field(latest_success, :finished_at)},
      {:fresh, fresh}
    ]
    |> maybe_add_candidate_count(surface)
    |> render_key_value_lines()
    |> IO.write()
  end

  defp enforce_required_success!(_surface, _latest_success, _fresh, false), do: :ok

  defp enforce_required_success!(surface, nil, _fresh, true) do
    Mix.raise("no successful CJ #{surface_label(surface)} found")
  end

  defp enforce_required_success!(surface, %ImportRun{}, false, true) do
    Mix.raise("latest successful CJ #{surface_label(surface)} is stale")
  end

  defp enforce_required_success!(_surface, %ImportRun{}, true, true), do: :ok

  defp surface_label(@import_surface), do: "product import"
  defp surface_label(@discovery_surface), do: "feed discovery run"

  defp print_history(opts) do
    surface = Keyword.fetch!(opts, :surface)
    limit = Keyword.fetch!(opts, :limit)
    runs = history_runs(surface, limit)

    header =
      [
        {:provider, @provider},
        {:surface, surface},
        {:report, "history"},
        {:count, length(runs)}
      ]
      |> maybe_add_candidate_count(surface)
      |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)

    ([header] ++ Enum.map(runs, &render_run/1))
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp print_failed(opts) do
    surface = Keyword.fetch!(opts, :surface)
    limit = Keyword.fetch!(opts, :limit)
    {runs, failed_count} = failed_runs(surface, limit)

    [
      "provider=#{@provider} failed_count=#{failed_count} surface=#{surface}"
      | Enum.map(runs, &render_run/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()

    if Keyword.fetch!(opts, :require_clean) and failed_count > 0 do
      Mix.raise("failed CJ ingestion runs found")
    end

    :ok
  end

  defp latest_run(surface) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == ^surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
  end

  defp history_runs(surface, limit) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == ^surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(^limit)
    |> Repo.all()
  end

  defp failed_runs("all", limit) do
    query =
      ImportRun
      |> where([run], run.provider == @provider)
      |> where([run], run.status == :failed)

    runs =
      query
      |> order_by([run], desc: run.started_at, desc: run.id)
      |> limit(^limit)
      |> Repo.all()

    {runs, Repo.aggregate(query, :count, :id)}
  end

  defp failed_runs(surface, limit) do
    query =
      ImportRun
      |> where([run], run.provider == @provider)
      |> where([run], run.surface == ^surface)
      |> where([run], run.status == :failed)

    runs =
      query
      |> order_by([run], desc: run.started_at, desc: run.id)
      |> limit(^limit)
      |> Repo.all()

    {runs, Repo.aggregate(query, :count, :id)}
  end

  defp render_run(%ImportRun{} = run) do
    [
      {:run_id, run.id},
      {:surface, run.surface},
      {:status, run.status},
      {:started_at, run.started_at},
      {:finished_at, run.finished_at},
      {:cursor_start, run.cursor_start},
      {:cursor_end, run.cursor_end},
      {:pages_requested, run.pages_requested},
      {:pages_fetched, run.pages_fetched},
      {:records_fetched, run.records_fetched},
      {:records_normalized, run.records_normalized},
      {:records_persisted, run.records_persisted},
      {:records_failed, run.records_failed},
      {:error_summary, sanitized_error_summary(run)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)
  end

  defp maybe_add_candidate_count(fields, @discovery_surface),
    do: fields ++ [{:candidate_count, candidate_count()}]

  defp maybe_add_candidate_count(fields, _surface), do: fields

  defp candidate_count do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> Repo.aggregate(:count, :id)
  end

  defp field(nil, _field), do: nil
  defp field(struct, field), do: Map.fetch!(struct, field)

  defp sanitized_error_summary(nil), do: nil

  defp sanitized_error_summary(%ImportRun{error_summary: error_summary})
       when is_binary(error_summary) do
    if String.trim(error_summary) == "", do: nil, else: "redacted"
  end

  defp sanitized_error_summary(%ImportRun{}), do: nil

  defp render_key_value_lines(fields) do
    fields
    |> Enum.map_join("\n", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)
    |> Kernel.<>("\n")
  end
end

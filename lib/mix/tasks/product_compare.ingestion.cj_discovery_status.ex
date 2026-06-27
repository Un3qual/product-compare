defmodule Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryStatus do
  @moduledoc "Reports persisted CJ feed discovery status without contacting CJ."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports CJ feed discovery status"
  @default_max_age_hours 48
  @provider "cj"
  @surface "shoppingProductFeeds"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_argv()
    |> build_report()
    |> enforce_required_success()
    |> render_report()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          max_age_hours: :integer,
          require_success: :boolean
        ]
      )

    %{
      max_age_hours: max_age_hours(Keyword.get(opts, :max_age_hours)),
      require_success: Keyword.get(opts, :require_success, false)
    }
  end

  defp max_age_hours(value) when is_integer(value) and value > 0, do: value
  defp max_age_hours(_invalid), do: @default_max_age_hours

  defp build_report(%{max_age_hours: max_age_hours} = opts) do
    latest_run = latest_run()
    latest_success = latest_success()

    Map.merge(opts, %{
      candidate_count: candidate_count(),
      fresh: fresh?(latest_success, max_age_hours),
      latest_run: latest_run,
      latest_success: latest_success
    })
  end

  defp latest_run do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == @surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
  end

  defp latest_success do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == @surface)
    |> where([run], run.status == "succeeded")
    |> order_by([run], desc_nulls_last: run.finished_at, desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
  end

  defp candidate_count do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> Repo.aggregate(:count, :id)
  end

  defp fresh?(%ImportRun{finished_at: %DateTime{} = finished_at}, max_age_hours) do
    DateTime.diff(DateTime.utc_now(), finished_at, :second) <= max_age_hours * 60 * 60
  end

  defp fresh?(_latest_success, _max_age_hours), do: false

  defp enforce_required_success(%{require_success: true, latest_success: nil}) do
    Mix.raise("no successful CJ feed discovery run found")
  end

  defp enforce_required_success(%{
         require_success: true,
         latest_success: %ImportRun{},
         fresh: false
       }) do
    Mix.raise("latest successful CJ feed discovery run is stale")
  end

  defp enforce_required_success(report), do: report

  defp render_report(%{
         latest_run: latest_run,
         latest_success: latest_success,
         fresh: fresh,
         candidate_count: candidate_count
       }) do
    [
      {:latest_status, field(latest_run, :status)},
      {:latest_started_at, field(latest_run, :started_at)},
      {:latest_finished_at, field(latest_run, :finished_at)},
      {:latest_pages_fetched, field(latest_run, :pages_fetched)},
      {:latest_records_fetched, field(latest_run, :records_fetched)},
      {:latest_records_persisted, field(latest_run, :records_persisted)},
      {:latest_records_failed, field(latest_run, :records_failed)},
      {:latest_error_summary, sanitized_error_summary(latest_run)},
      {:latest_success_status, field(latest_success, :status)},
      {:latest_success_finished_at, field(latest_success, :finished_at)},
      {:fresh, fresh},
      {:candidate_count, candidate_count}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp field(nil, _field), do: nil
  defp field(struct, field), do: Map.fetch!(struct, field)

  defp sanitized_error_summary(nil), do: nil

  defp sanitized_error_summary(%ImportRun{error_summary: error_summary})
       when is_binary(error_summary) do
    if String.trim(error_summary) == "", do: nil, else: "redacted"
  end

  defp sanitized_error_summary(%ImportRun{}), do: nil

  defp format_value(nil), do: ""
  defp format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_value(value) when is_boolean(value), do: to_string(value)
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)
  defp format_value(value) when is_binary(value), do: single_line(value)
  defp format_value(value), do: to_string(value)

  defp single_line(value) do
    String.replace(value, ~r/[\r\n]+/, " ")
  end
end

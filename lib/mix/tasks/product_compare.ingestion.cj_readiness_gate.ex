defmodule Mix.Tasks.ProductCompare.Ingestion.CjReadinessGate do
  @moduledoc "Checks persisted CJ ingestion readiness without contacting CJ."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion.CJRunReadiness
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Checks CJ ingestion readiness"
  @provider "cj"
  @discovery_surface "shoppingProductFeeds"
  @import_surface "shoppingProducts"
  @required_env_vars ~w(CJ_API_TOKEN CJ_ACCOUNT_ID)
  @feed_discovery_schedule_env "CJ_FEED_DISCOVERY_SCHEDULE_ENABLED"
  @product_import_schedule_env "CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED"
  @truthy_values ~w(1 true yes on)
  @default_max_discovery_age_hours 48
  @default_max_import_age_hours 48
  @default_min_candidates 1
  @default_min_shortlisted 0

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    report =
      argv
      |> parse_argv()
      |> build_report()

    report
    |> render_report()
    |> IO.write()

    if report.require_ready and not report.ready do
      Mix.raise("CJ ingestion is not ready")
    end
  end

  defp parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        max_discovery_age_hours: :integer,
        max_import_age_hours: :integer,
        min_candidates: :integer,
        min_shortlisted: :integer,
        require_scheduled: :boolean,
        require_ready: :boolean
      )

    %{
      max_discovery_age_hours:
        CliOptions.positive_integer!(
          Keyword.get(opts, :max_discovery_age_hours),
          @default_max_discovery_age_hours,
          "--max-discovery-age-hours"
        ),
      max_import_age_hours:
        CliOptions.positive_integer!(
          Keyword.get(opts, :max_import_age_hours),
          @default_max_import_age_hours,
          "--max-import-age-hours"
        ),
      min_candidates:
        CliOptions.positive_integer!(
          Keyword.get(opts, :min_candidates),
          @default_min_candidates,
          "--min-candidates"
        ),
      min_shortlisted:
        CliOptions.non_negative_integer!(
          Keyword.get(opts, :min_shortlisted),
          @default_min_shortlisted,
          "--min-shortlisted"
        ),
      require_scheduled: Keyword.get(opts, :require_scheduled, false),
      require_ready: Keyword.get(opts, :require_ready, false)
    }
  end

  defp build_report(opts) do
    missing_required = missing_required_env_vars()
    credentials_ready = missing_required == []

    discovery_fresh =
      @discovery_surface
      |> CJRunReadiness.latest_success()
      |> CJRunReadiness.fresh?(opts.max_discovery_age_hours)

    import_fresh =
      @import_surface
      |> CJRunReadiness.latest_success()
      |> CJRunReadiness.fresh?(opts.max_import_age_hours)

    candidate_count = candidate_count()
    shortlisted_count = shortlisted_count()
    feed_discovery_schedule_enabled = truthy_env?(@feed_discovery_schedule_env)
    product_import_schedule_enabled = truthy_env?(@product_import_schedule_env)
    schedules_ready = feed_discovery_schedule_enabled and product_import_schedule_enabled

    base_ready =
      credentials_ready and discovery_fresh and import_fresh and
        candidate_count >= opts.min_candidates and
        shortlisted_count >= opts.min_shortlisted

    Map.merge(opts, %{
      candidate_count: candidate_count,
      credentials_ready: credentials_ready,
      discovery_fresh: discovery_fresh,
      feed_discovery_schedule_enabled: feed_discovery_schedule_enabled,
      import_fresh: import_fresh,
      missing_required: missing_required,
      product_import_schedule_enabled: product_import_schedule_enabled,
      ready: base_ready and (not opts.require_scheduled or schedules_ready),
      schedules_ready: schedules_ready,
      shortlisted_count: shortlisted_count
    })
  end

  defp missing_required_env_vars do
    Enum.reject(@required_env_vars, &present_env?/1)
  end

  defp present_env?(name) do
    case System.get_env(name) do
      value when is_binary(value) -> String.trim(value) != ""
      _value -> false
    end
  end

  defp truthy_env?(name) do
    name
    |> System.get_env("")
    |> String.trim()
    |> String.downcase()
    |> then(&(&1 in @truthy_values))
  end

  defp candidate_count do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> Repo.aggregate(:count, :id)
  end

  defp shortlisted_count do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> where([candidate], candidate.review_status == "shortlisted")
    |> Repo.aggregate(:count, :id)
  end

  defp render_report(report) do
    [
      "provider=#{@provider}",
      "ready=#{report.ready}",
      "credentials_ready=#{report.credentials_ready}",
      "missing_required=#{Enum.join(report.missing_required, ",")}",
      "discovery_fresh=#{report.discovery_fresh}",
      "import_fresh=#{report.import_fresh}",
      "candidate_count=#{report.candidate_count}",
      "min_candidates=#{report.min_candidates}",
      "shortlisted_count=#{report.shortlisted_count}",
      "min_shortlisted=#{report.min_shortlisted}",
      "require_scheduled=#{report.require_scheduled}",
      "feed_discovery_schedule_enabled=#{report.feed_discovery_schedule_enabled}",
      "product_import_schedule_enabled=#{report.product_import_schedule_enabled}",
      "schedules_ready=#{report.schedules_ready}"
    ]
    |> Enum.join(" ")
    |> Kernel.<>("\n")
  end
end

defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options do
  @moduledoc false

  alias ProductCompare.MixTasks.CliOptions

  @import_surface "shoppingProducts"
  @discovery_surface "shoppingProductFeeds"
  @default_limit 10
  @max_limit 50
  @default_max_age_hours 48
  @default_pages 1

  @spec parse_argv([String.t()]) :: keyword()
  def parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        surface: :string,
        report: :string,
        limit: :integer,
        max_age_hours: :integer,
        require_success: :boolean,
        require_clean: :boolean,
        resume: :boolean,
        pages: :integer,
        require_cursor: :boolean
      )

    [
      surface: Keyword.get(opts, :surface),
      report: Keyword.get(opts, :report),
      limit: Keyword.get(opts, :limit),
      max_age_hours: Keyword.get(opts, :max_age_hours),
      require_success: Keyword.get(opts, :require_success, false),
      require_clean: Keyword.get(opts, :require_clean, false),
      resume: Keyword.get(opts, :resume, false),
      pages: Keyword.get(opts, :pages),
      require_cursor: Keyword.get(opts, :require_cursor, false)
    ]
  end

  @spec normalize_report_opts(keyword()) :: keyword()
  def normalize_report_opts(opts) do
    report = normalize_report(Keyword.get(opts, :report))

    surface =
      opts
      |> Keyword.get(:surface)
      |> normalize_surface(report)

    [
      surface: surface,
      report: report,
      limit: normalize_limit(Keyword.get(opts, :limit)),
      max_age_hours: normalize_max_age_hours(Keyword.get(opts, :max_age_hours)),
      require_success: Keyword.get(opts, :require_success, false),
      require_clean: Keyword.get(opts, :require_clean, false)
    ]
  end

  @spec normalize_resume_opts(keyword()) :: keyword()
  def normalize_resume_opts(opts) do
    surface =
      opts
      |> Keyword.get(:surface)
      |> normalize_surface("resume")

    [
      surface: surface,
      limit: CliOptions.optional_positive_integer!(Keyword.get(opts, :limit), "--limit"),
      pages: CliOptions.positive_integer!(Keyword.get(opts, :pages), @default_pages, "--pages"),
      require_cursor: Keyword.get(opts, :require_cursor, false),
      runner: Keyword.get(opts, :runner)
    ]
  end

  defp normalize_report(nil), do: "latest"

  defp normalize_report(report) when report in ~w(latest history failed), do: report

  defp normalize_report(report) when is_binary(report), do: Mix.raise("invalid report: #{report}")
  defp normalize_report(_report), do: Mix.raise("invalid report")

  defp normalize_surface(nil, "failed"), do: "all"
  defp normalize_surface(nil, _report), do: @import_surface
  defp normalize_surface("import", _report), do: @import_surface
  defp normalize_surface("shoppingProducts", _report), do: @import_surface
  defp normalize_surface("discovery", _report), do: @discovery_surface
  defp normalize_surface("shoppingProductFeeds", _report), do: @discovery_surface
  defp normalize_surface("all", "failed"), do: "all"

  defp normalize_surface("all", report),
    do: Mix.raise("surface all is not supported for #{report}")

  defp normalize_surface(surface, _report), do: Mix.raise("invalid surface: #{surface}")

  defp normalize_limit(nil), do: @default_limit

  defp normalize_limit(value) when is_integer(value) and value > 0 and value <= @max_limit,
    do: value

  defp normalize_limit(value) when is_integer(value) and value > @max_limit,
    do: Mix.raise("CJ runs report limit is #{@max_limit}")

  defp normalize_limit(_value), do: Mix.raise("invalid --limit: expected a positive integer")

  defp normalize_max_age_hours(value) when is_integer(value) and value > 0, do: value
  defp normalize_max_age_hours(nil), do: @default_max_age_hours

  defp normalize_max_age_hours(_value),
    do: Mix.raise("invalid --max-age-hours: expected a positive integer")
end

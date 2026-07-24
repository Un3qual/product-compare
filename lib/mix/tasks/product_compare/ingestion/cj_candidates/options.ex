defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options do
  @moduledoc false

  alias ProductCompare.MixTasks.CliOptions

  @allowed_statuses ~w(pending shortlisted dismissed all)
  @default_limit 25
  @max_limit 100
  @default_max_age_hours 168
  @default_report "stale"
  @default_format "lines"

  @spec parse_argv([String.t()]) :: keyword()
  def parse_argv(argv) do
    CliOptions.parse!(argv,
      report: :string,
      status: :string,
      limit: :integer,
      max_age_hours: :integer,
      require_fresh: :boolean,
      format: :string,
      country: :string,
      currency: :string,
      language: :string,
      min_product_count: :integer,
      require_candidates: :boolean
    )
  end

  @spec normalize(keyword()) :: keyword()
  def normalize(opts) do
    report = normalize_report(Keyword.get(opts, :report))

    [
      report: report,
      status: normalize_status(Keyword.get(opts, :status), report),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      max_age_hours: normalize_max_age_hours(Keyword.get(opts, :max_age_hours)),
      require_fresh: Keyword.get(opts, :require_fresh, false),
      format: normalize_format(Keyword.get(opts, :format)),
      country: normalize_market_value(Keyword.get(opts, :country)),
      currency: normalize_market_value(Keyword.get(opts, :currency)),
      language: normalize_market_value(Keyword.get(opts, :language)),
      min_product_count: normalize_min_product_count(Keyword.get(opts, :min_product_count)),
      require_candidates: Keyword.get(opts, :require_candidates, false)
    ]
  end

  defp normalize_report(nil), do: @default_report

  defp normalize_report(report) when report in ~w(stale fit-gaps application-cohort export),
    do: report

  defp normalize_report(report) when is_binary(report), do: Mix.raise("invalid report: #{report}")
  defp normalize_report(_report), do: Mix.raise("invalid report")

  defp normalize_status(status, _report) when is_binary(status) do
    status = status |> String.trim() |> String.downcase()

    if status in @allowed_statuses do
      status
    else
      Mix.raise("invalid review status: #{status}")
    end
  end

  defp normalize_status(_status, "fit-gaps"), do: "pending"
  defp normalize_status(_status, "application-cohort"), do: "shortlisted"
  defp normalize_status(_status, _report), do: "all"

  defp normalize_format(nil), do: @default_format
  defp normalize_format(format) when format in ~w(lines markdown), do: format
  defp normalize_format(format) when is_binary(format), do: Mix.raise("invalid format: #{format}")
  defp normalize_format(_format), do: Mix.raise("invalid format")

  defp normalize_limit(value) when is_integer(value) and value > 0, do: min(value, @max_limit)
  defp normalize_limit(nil), do: @default_limit
  defp normalize_limit(_value), do: Mix.raise("invalid --limit: expected a positive integer")

  defp normalize_max_age_hours(value) when is_integer(value) and value > 0, do: value
  defp normalize_max_age_hours(nil), do: @default_max_age_hours

  defp normalize_max_age_hours(_value),
    do: Mix.raise("invalid --max-age-hours: expected a positive integer")

  defp normalize_min_product_count(value) when is_integer(value) and value >= 0, do: value
  defp normalize_min_product_count(nil), do: nil

  defp normalize_min_product_count(_value),
    do: Mix.raise("invalid --min-product-count: expected a non-negative integer")

  @spec normalize_market_value(term()) :: String.t() | nil
  def normalize_market_value(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  def normalize_market_value(_value), do: nil
end

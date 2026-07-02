defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates do
  @moduledoc "Reports CJ feed candidates from one operator task."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports CJ feed candidates"
  @provider "cj"
  @allowed_statuses ~w(pending shortlisted dismissed all)
  @default_limit 25
  @max_limit 100
  @default_max_age_hours 168
  @default_report "stale"
  @default_format "lines"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_argv()
    |> run_report()

    :ok
  end

  @spec run_report(keyword()) :: :ok
  def run_report(opts) do
    opts = normalize_opts(opts)

    case Keyword.fetch!(opts, :report) do
      "stale" -> print_stale(opts)
      "fit-gaps" -> print_fit_gaps(opts)
      "application-cohort" -> print_application_cohort(opts)
      "export" -> Mix.raise("CJ candidate CSV export is not supported")
    end
  end

  defp parse_argv(argv) do
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

  defp normalize_opts(opts) do
    report = normalize_report(Keyword.get(opts, :report))

    [
      report: report,
      status: normalize_status(Keyword.get(opts, :status), report),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      max_age_hours: normalize_max_age_hours(Keyword.get(opts, :max_age_hours)),
      require_fresh: Keyword.get(opts, :require_fresh, false),
      format: normalize_format(Keyword.get(opts, :format)),
      country: normalize_upper(Keyword.get(opts, :country)),
      currency: normalize_upper(Keyword.get(opts, :currency)),
      language: normalize_upper(Keyword.get(opts, :language)),
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

  defp normalize_upper(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_upper(_value), do: nil

  defp print_stale(opts) do
    candidates = stale_candidates(opts)

    if Keyword.fetch!(opts, :require_fresh) and candidates != [] do
      Mix.raise("stale CJ feed candidates found")
    end

    [
      "provider=#{@provider} report=stale max_age_hours=#{Keyword.fetch!(opts, :max_age_hours)} stale_count=#{length(candidates)} status=#{Keyword.fetch!(opts, :status)}"
      | Enum.map(candidates, &render_stale_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp stale_candidates(opts) do
    cutoff =
      DateTime.utc_now()
      |> DateTime.add(-Keyword.fetch!(opts, :max_age_hours) * 60 * 60, :second)

    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> where([candidate], candidate.last_seen_at < ^cutoff)
    |> maybe_filter_status(Keyword.fetch!(opts, :status))
    |> order_by([candidate],
      asc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^Keyword.fetch!(opts, :limit))
    |> Repo.all()
  end

  defp print_fit_gaps(opts) do
    candidates = fit_gap_candidates(opts)
    analyzed = Enum.map(candidates, &{&1, compute_fit_gaps(&1)})
    counts = aggregate_gap_counts(analyzed)

    summary = [
      "provider=#{@provider}",
      "report=fit-gaps",
      "status=#{Keyword.fetch!(opts, :status)}",
      "candidate_count=#{length(candidates)}",
      "country_not_us=#{counts.country_not_us}",
      "currency_not_usd=#{counts.currency_not_usd}",
      "language_not_en=#{counts.language_not_en}",
      "missing_product_count=#{counts.missing_product_count}",
      "low_product_count=#{counts.low_product_count}",
      "missing_source_feed_type=#{counts.missing_source_feed_type}"
    ]

    [
      Enum.join(summary, " ")
      | Enum.map(analyzed, &render_fit_gap_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp fit_gap_candidates(opts) do
    status = Keyword.fetch!(opts, :status)

    query =
      if status == "all" do
        Ingestion.list_merchant_feed_candidates_query(sort: :fit_score_desc)
      else
        Ingestion.list_merchant_feed_candidates_query(
          review_status: status,
          sort: :fit_score_desc
        )
      end

    query
    |> where([candidate], candidate.provider == @provider)
    |> limit(^Keyword.fetch!(opts, :limit))
    |> Repo.all()
  end

  defp print_application_cohort(opts) do
    candidates = application_candidates(opts)

    if Keyword.fetch!(opts, :require_candidates) and candidates == [] do
      Mix.raise("no CJ application cohort candidates found")
    end

    case Keyword.fetch!(opts, :format) do
      "markdown" -> render_application_markdown(candidates)
      "lines" -> render_application_lines(candidates)
    end
    |> IO.write()
  end

  defp application_candidates(opts) do
    status = Keyword.fetch!(opts, :status)

    Ingestion.list_merchant_feed_candidates_query(
      review_status: status,
      sort: :fit_score_desc
    )
    |> where([candidate], candidate.provider == @provider)
    |> maybe_filter_string(:advertiser_country, Keyword.fetch!(opts, :country))
    |> maybe_filter_string(:currency, Keyword.fetch!(opts, :currency))
    |> maybe_filter_string(:language, Keyword.fetch!(opts, :language))
    |> maybe_filter_min_product_count(Keyword.fetch!(opts, :min_product_count))
    |> limit(^Keyword.fetch!(opts, :limit))
    |> Repo.all()
  end

  defp maybe_filter_status(query, "all"), do: query

  defp maybe_filter_status(query, status),
    do: where(query, [candidate], candidate.review_status == ^status)

  defp maybe_filter_string(query, _field, nil), do: query

  defp maybe_filter_string(query, field, expected),
    do:
      where(
        query,
        [candidate],
        fragment("UPPER(BTRIM(?))", field(candidate, ^field)) == ^expected
      )

  defp maybe_filter_min_product_count(query, nil), do: query

  defp maybe_filter_min_product_count(query, min_product_count) do
    where(
      query,
      [candidate],
      fragment("coalesce(?, 0) >= ?", candidate.product_count, ^min_product_count)
    )
  end

  defp compute_fit_gaps(candidate) do
    []
    |> maybe_add_gap(:country_not_us, normalize_upper(candidate.advertiser_country) != "US")
    |> maybe_add_gap(:currency_not_usd, normalize_upper(candidate.currency) != "USD")
    |> maybe_add_gap(:language_not_en, normalize_upper(candidate.language) != "EN")
    |> maybe_add_gap(:missing_product_count, is_nil(candidate.product_count))
    |> maybe_add_gap(:low_product_count, low_product_count?(candidate.product_count))
    |> maybe_add_gap(:missing_source_feed_type, blank?(candidate.source_feed_type))
  end

  defp maybe_add_gap(gaps, _gap, false), do: gaps
  defp maybe_add_gap(gaps, gap, true), do: gaps ++ [gap]

  defp low_product_count?(nil), do: false
  defp low_product_count?(value) when is_integer(value), do: value < 1000
  defp low_product_count?(_value), do: false

  defp blank?(value) when is_binary(value), do: String.trim(value) == ""
  defp blank?(nil), do: true
  defp blank?(_value), do: false

  defp aggregate_gap_counts(analyzed) do
    initial = %{
      country_not_us: 0,
      currency_not_usd: 0,
      language_not_en: 0,
      missing_product_count: 0,
      low_product_count: 0,
      missing_source_feed_type: 0
    }

    Enum.reduce(analyzed, initial, fn {_candidate, gaps}, counts ->
      Enum.reduce(gaps, counts, fn gap, acc -> Map.update!(acc, gap, &(&1 + 1)) end)
    end)
  end

  defp render_stale_candidate(%MerchantFeedCandidate{} = candidate) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:review_status, candidate.review_status},
      {:product_count, candidate.product_count},
      {:last_seen_at, candidate.last_seen_at},
      {:age_hours, age_hours(candidate.last_seen_at)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_fit_gap_candidate({%MerchantFeedCandidate{} = candidate, gaps}) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:review_status, candidate.review_status},
      {:product_count, candidate.product_count},
      {:gap_count, length(gaps)},
      {:gaps, gaps |> Enum.map(&Atom.to_string/1) |> Enum.join(",")}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_application_lines(candidates) do
    [
      "provider=#{@provider} report=application-cohort format=lines count=#{length(candidates)}"
      | Enum.map(candidates, &render_application_line/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_application_line(%MerchantFeedCandidate{} = candidate) do
    [
      {:candidate_id, GlobalId.encode(:merchant_feed_candidate, candidate.id)},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:country, candidate.advertiser_country},
      {:currency, candidate.currency},
      {:language, candidate.language},
      {:source_feed_type, candidate.source_feed_type},
      {:feed_name, candidate.feed_name},
      {:product_count, candidate.product_count},
      {:review_note_present, review_note_present?(candidate.review_note)},
      {:reviewed_at, candidate.reviewed_at}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_application_markdown(candidates) do
    [
      "# CJ Application Cohort",
      "",
      "count=#{length(candidates)}",
      "",
      "| Candidate | Advertiser | Advertiser ID | Country | Currency | Language | Feed | Products | Feed Type | Review Note |",
      "| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |"
      | Enum.map(candidates, &render_application_markdown_row/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_application_markdown_row(%MerchantFeedCandidate{} = candidate) do
    [
      GlobalId.encode(:merchant_feed_candidate, candidate.id),
      candidate.advertiser_name,
      candidate.advertiser_id,
      candidate.advertiser_country,
      candidate.currency,
      candidate.language,
      candidate.feed_name,
      candidate.product_count,
      candidate.source_feed_type,
      if(review_note_present?(candidate.review_note), do: "present", else: "blank")
    ]
    |> Enum.map(&format_markdown_cell/1)
    |> Enum.join(" | ")
    |> then(&"| #{&1} |")
  end

  defp review_note_present?(note) when is_binary(note), do: String.trim(note) != ""
  defp review_note_present?(_note), do: false

  defp age_hours(%DateTime{} = timestamp) do
    DateTime.diff(DateTime.utc_now(), timestamp, :second) |> div(3600)
  end

  defp format_markdown_cell(nil), do: ""
  defp format_markdown_cell(value) when is_integer(value), do: Integer.to_string(value)

  defp format_markdown_cell(value) when is_binary(value) do
    value
    |> String.replace(~r/[\r\n]+/, " ")
    |> String.replace("|", "\\|")
  end

  defp format_markdown_cell(value), do: to_string(value)

  defp format_value(nil), do: ""
  defp format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_value(value) when is_boolean(value), do: to_string(value)
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)

  defp format_value(value) when is_binary(value) do
    if String.match?(value, ~r/\s/) do
      inspect(value)
    else
      value
    end
  end

  defp format_value(value), do: to_string(value)
end

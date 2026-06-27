defmodule Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortMarkdown do
  @moduledoc "Reports shortlisted CJ application cohort candidates as Markdown."

  use Mix.Task

  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports shortlisted CJ application cohort as Markdown"
  @default_limit 25
  @max_limit 100
  @provider "cj"
  @default_review_status "shortlisted"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)

    opts
    |> load_candidates()
    |> enforce_required_candidates(opts.require_candidates)
    |> render_report()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          country: :string,
          currency: :string,
          language: :string,
          min_product_count: :integer,
          limit: :integer,
          require_candidates: :boolean
        ]
      )

    %{
      country: normalize_upper(Keyword.get(opts, :country)),
      currency: normalize_upper(Keyword.get(opts, :currency)),
      language: normalize_upper(Keyword.get(opts, :language)),
      min_product_count: normalize_min_product_count(Keyword.get(opts, :min_product_count)),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      require_candidates: Keyword.get(opts, :require_candidates, false)
    }
  end

  defp normalize_upper(nil), do: nil

  defp normalize_upper(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_limit(limit) when is_integer(limit) and limit > 0 do
    min(limit, @max_limit)
  end

  defp normalize_limit(_limit), do: @default_limit

  defp normalize_min_product_count(count) when is_integer(count) and count >= 0, do: count
  defp normalize_min_product_count(_count), do: nil

  defp load_candidates(opts) do
    Ingestion.list_merchant_feed_candidates_query(
      review_status: @default_review_status,
      sort: :fit_score_desc
    )
    |> Repo.all()
    |> filter_provider()
    |> maybe_filter_country(opts.country)
    |> maybe_filter_currency(opts.currency)
    |> maybe_filter_language(opts.language)
    |> maybe_filter_min_product_count(opts.min_product_count)
    |> Enum.take(opts.limit)
  end

  defp filter_provider(candidates), do: Enum.filter(candidates, &(&1.provider == @provider))

  defp maybe_filter_country(candidates, nil), do: candidates

  defp maybe_filter_country(candidates, expected_country),
    do: Enum.filter(candidates, &(&1.advertiser_country == expected_country))

  defp maybe_filter_currency(candidates, nil), do: candidates

  defp maybe_filter_currency(candidates, expected_currency),
    do: Enum.filter(candidates, &(&1.currency == expected_currency))

  defp maybe_filter_language(candidates, nil), do: candidates

  defp maybe_filter_language(candidates, expected_language),
    do: Enum.filter(candidates, &(&1.language == expected_language))

  defp maybe_filter_min_product_count(candidates, nil), do: candidates

  defp maybe_filter_min_product_count(candidates, min_product_count) do
    Enum.filter(candidates, &(product_count(&1.product_count) >= min_product_count))
  end

  defp enforce_required_candidates(candidates, require_candidates?) do
    if require_candidates? and length(candidates) == 0 do
      Mix.raise("no CJ application cohort candidates found")
    end

    candidates
  end

  defp render_report(candidates) do
    [
      "# CJ Application Cohort",
      "",
      "count=#{length(candidates)}",
      "",
      header_row(),
      separator_row()
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp header_row do
    "| Candidate | Advertiser | Advertiser ID | Country | Currency | Language | Feed | Products | Feed Type | Review Note |"
  end

  defp separator_row do
    "| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |"
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
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
      review_note_marker(candidate.review_note)
    ]
    |> Enum.map(&format_markdown_cell/1)
    |> Enum.join(" | ")
    |> then(&"| #{&1} |")
  end

  defp render_candidate(_candidate), do: ""

  defp review_note_marker(review_note),
    do: if(review_note_present?(review_note), do: "present", else: "blank")

  defp review_note_present?(note) when is_binary(note), do: String.trim(note) != ""
  defp review_note_present?(_note), do: false

  defp product_count(nil), do: 0
  defp product_count(value) when is_integer(value), do: value
  defp product_count(_value), do: 0

  defp format_markdown_cell(nil), do: ""
  defp format_markdown_cell(value) when is_integer(value), do: Integer.to_string(value)
  defp format_markdown_cell(value) when is_binary(value), do: String.replace(value, "|", "\\|")
  defp format_markdown_cell(value), do: to_string(value)
end

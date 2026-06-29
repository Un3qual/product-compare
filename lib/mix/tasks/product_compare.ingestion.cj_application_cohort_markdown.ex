defmodule Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortMarkdown do
  @moduledoc "Reports shortlisted CJ application cohort candidates as Markdown."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.CliOptions
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
    opts =
      CliOptions.parse!(argv,
        country: :string,
        currency: :string,
        language: :string,
        min_product_count: :integer,
        limit: :integer,
        require_candidates: :boolean
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

  defp normalize_limit(nil), do: @default_limit
  defp normalize_limit(_limit), do: Mix.raise("invalid --limit: expected a positive integer")

  defp normalize_min_product_count(count) when is_integer(count) and count >= 0, do: count
  defp normalize_min_product_count(nil), do: nil

  defp normalize_min_product_count(_count),
    do: Mix.raise("invalid --min-product-count: expected a non-negative integer")

  defp load_candidates(opts) do
    Ingestion.list_merchant_feed_candidates_query(
      review_status: @default_review_status,
      sort: :fit_score_desc
    )
    |> where([candidate], candidate.provider == @provider)
    |> maybe_filter_country(opts.country)
    |> maybe_filter_currency(opts.currency)
    |> maybe_filter_language(opts.language)
    |> maybe_filter_min_product_count(opts.min_product_count)
    |> limit(^opts.limit)
    |> Repo.all()
  end

  defp maybe_filter_country(query, nil), do: query

  defp maybe_filter_country(query, expected_country),
    do: where(query, [candidate], candidate.advertiser_country == ^expected_country)

  defp maybe_filter_currency(query, nil), do: query

  defp maybe_filter_currency(query, expected_currency),
    do: where(query, [candidate], candidate.currency == ^expected_currency)

  defp maybe_filter_language(query, nil), do: query

  defp maybe_filter_language(query, expected_language),
    do: where(query, [candidate], candidate.language == ^expected_language)

  defp maybe_filter_min_product_count(query, nil), do: query

  defp maybe_filter_min_product_count(query, min_product_count) do
    where(
      query,
      [candidate],
      fragment("coalesce(?, 0) >= ?", candidate.product_count, ^min_product_count)
    )
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

  defp format_markdown_cell(nil), do: ""
  defp format_markdown_cell(value) when is_integer(value), do: Integer.to_string(value)

  defp format_markdown_cell(value) when is_binary(value) do
    value
    |> String.replace(~r/[\r\n]+/, " ")
    |> String.replace("|", "\\|")
  end

  defp format_markdown_cell(value), do: to_string(value)
end

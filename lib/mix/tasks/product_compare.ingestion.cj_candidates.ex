defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates do
  @moduledoc "Reports CJ feed candidates from one operator task."

  use Mix.Task

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.FitGapReport
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.StaleReport
  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports CJ feed candidates"
  @provider "cj"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> Options.parse_argv()
    |> run_report()

    :ok
  end

  @spec run_report(keyword()) :: :ok
  def run_report(opts) do
    opts = Options.normalize(opts)

    case Keyword.fetch!(opts, :report) do
      "stale" -> StaleReport.print(opts)
      "fit-gaps" -> FitGapReport.print(opts)
      "application-cohort" -> print_application_cohort(opts)
      "export" -> Mix.raise("CJ candidate CSV export is not supported")
    end
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

defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.ApplicationCohortReport do
  @moduledoc false

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Output
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Ingestion.CJProgramWarnings
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareWeb.GraphQL.GlobalId

  @provider "cj"

  @spec print(keyword()) :: :ok
  def print(opts) do
    candidates = candidates(opts)

    warnings_by_program =
      CJProgramWarnings.by_program_ids(Enum.map(candidates, & &1.cj_program_id))

    candidates_with_warnings =
      Enum.map(candidates, &{&1, Map.fetch!(warnings_by_program, &1.cj_program_id)})

    if Keyword.fetch!(opts, :require_candidates) and candidates_with_warnings == [] do
      Mix.raise("no CJ application cohort candidates found")
    end

    case Keyword.fetch!(opts, :format) do
      "markdown" -> render_markdown(candidates_with_warnings)
      "lines" -> render_lines(candidates_with_warnings)
    end
    |> IO.write()
  end

  defp candidates(opts) do
    CJPrograms.list_feeds_query(stage: :selected)
    |> preload([candidate], :cj_program)
    |> maybe_filter_string(:advertiser_country, Keyword.fetch!(opts, :country))
    |> maybe_filter_string(:currency, Keyword.fetch!(opts, :currency))
    |> maybe_filter_string(:language, Keyword.fetch!(opts, :language))
    |> maybe_filter_min_product_count(Keyword.fetch!(opts, :min_product_count))
    |> limit(^Keyword.fetch!(opts, :limit))
    |> Repo.all()
  end

  defp maybe_filter_string(query, _field, nil), do: query

  defp maybe_filter_string(query, field, expected) do
    where(query, [candidate], field(candidate, ^field) == ^expected)
  end

  defp maybe_filter_min_product_count(query, nil), do: query

  defp maybe_filter_min_product_count(query, min_product_count) do
    where(
      query,
      [candidate],
      fragment("coalesce(?, 0) >= ?", candidate.product_count, ^min_product_count)
    )
  end

  defp render_lines(candidates) do
    [
      "provider=#{@provider} report=application-cohort format=lines stage=selected count=#{length(candidates)}"
      | Enum.map(candidates, &render_line/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_line(
         {%MerchantFeedCandidate{cj_program: %CJProgram{} = program} = candidate, warning_codes}
       ) do
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
      {:program_stage, program.stage},
      {:program_note_present, program_note_present?(program.note)},
      {:program_changed_at, program.changed_at},
      {:warning_codes, Enum.join(warning_codes, ",")}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{Output.format_value(value)}" end)
  end

  defp render_markdown(candidates) do
    header =
      [
        "# CJ Application Cohort",
        "",
        "count=#{length(candidates)}",
        "",
        "| Candidate | Advertiser | Advertiser ID | Country | Currency | Language | Feed | Products | Feed Type | Program Stage | Program Note | Program Changed | Warnings |",
        "| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |"
      ]
      |> Enum.join("\n")

    case candidates do
      [] -> header <> "\n"
      _ -> header <> "\n" <> Enum.map_join(candidates, "\n", &render_markdown_row/1) <> "\n"
    end
  end

  defp render_markdown_row(
         {%MerchantFeedCandidate{cj_program: %CJProgram{} = program} = candidate, warning_codes}
       ) do
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
      program.stage,
      if(program_note_present?(program.note), do: "present", else: "blank"),
      Output.format_value(program.changed_at),
      Enum.join(warning_codes, ",")
    ]
    |> Enum.map_join(" | ", &Output.format_markdown_cell/1)
    |> then(&"| #{&1} |")
  end

  defp program_note_present?(note) when is_binary(note), do: String.trim(note) != ""
  defp program_note_present?(_note), do: false
end

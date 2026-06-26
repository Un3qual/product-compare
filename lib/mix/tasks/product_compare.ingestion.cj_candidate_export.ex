defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport do
  @moduledoc "Exports reviewed CJ feed candidates as non-secret CSV."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Exports reviewed CJ feed candidates"
  @allowed_statuses ~w(pending shortlisted dismissed)
  @allowed_sorts ~w(score name)
  @columns [
    :provider,
    :provider_feed_id,
    :advertiser_id,
    :advertiser_name,
    :advertiser_country,
    :currency,
    :language,
    :feed_name,
    :product_count,
    :fit_score,
    :fit_reasons,
    :review_note,
    :last_seen_at
  ]

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    argv
    |> parse_argv()
    |> export_candidates()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          status: :string,
          sort: :string
        ]
      )

    status = Keyword.get(opts, :status, "shortlisted")
    sort = Keyword.get(opts, :sort, "score")

    unless status in @allowed_statuses do
      Mix.raise("invalid review status: #{status}")
    end

    unless sort in @allowed_sorts do
      Mix.raise("invalid sort: #{sort}")
    end

    %{status: status, sort: sort}
  end

  defp export_candidates(%{status: status, sort: sort}) do
    status
    |> candidates_for_status()
    |> sort_candidates(sort)
    |> render_csv()
  end

  defp candidates_for_status(status) do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == "cj")
    |> where([candidate], candidate.review_status == ^status)
    |> order_by([candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
    |> Repo.all()
  end

  defp sort_candidates(candidates, "score") do
    Enum.sort_by(candidates, fn candidate ->
      {
        -fit_score(candidate),
        -last_seen_unix(candidate.last_seen_at),
        candidate.advertiser_name || "",
        candidate.feed_name || "",
        candidate.provider_feed_id || "",
        candidate.id
      }
    end)
  end

  defp sort_candidates(candidates, "name"), do: candidates

  defp render_csv(candidates) do
    [
      render_row(@columns),
      Enum.map(candidates, &render_candidate/1)
    ]
    |> List.flatten()
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
    @columns
    |> Enum.map(&candidate_field_value(candidate, &1))
    |> render_row()
  end

  defp candidate_field_value(%MerchantFeedCandidate{} = candidate, :fit_score) do
    fit_score(candidate)
  end

  defp candidate_field_value(%MerchantFeedCandidate{} = candidate, :fit_reasons) do
    candidate
    |> fit_reasons()
    |> Enum.join(";")
  end

  defp candidate_field_value(%MerchantFeedCandidate{} = candidate, column) do
    Map.fetch!(candidate, column)
  end

  defp fit_score(%MerchantFeedCandidate{} = candidate) do
    product_count_points(candidate.product_count) +
      exact_field_points(candidate.advertiser_country, "US", 20) +
      exact_field_points(candidate.currency, "USD", 15) +
      exact_field_points(candidate.language, "EN", 10) +
      source_feed_type_points(candidate.source_feed_type)
  end

  defp fit_reasons(%MerchantFeedCandidate{} = candidate) do
    [
      product_count_reason(candidate.product_count),
      exact_field_reason(candidate.advertiser_country, "US", "US market"),
      exact_field_reason(candidate.currency, "USD", "USD"),
      exact_field_reason(candidate.language, "EN", "English"),
      source_feed_type_reason(candidate.source_feed_type)
    ]
    |> Enum.reject(&is_nil/1)
  end

  defp product_count_points(count) when is_integer(count) and count >= 10_000, do: 50
  defp product_count_points(count) when is_integer(count) and count >= 1_000, do: 35
  defp product_count_points(count) when is_integer(count) and count >= 100, do: 20
  defp product_count_points(count) when is_integer(count) and count > 0, do: 10
  defp product_count_points(_count), do: 0

  defp product_count_reason(count) when is_integer(count) and count >= 10_000,
    do: "10000+ products"

  defp product_count_reason(count) when is_integer(count) and count >= 1_000,
    do: "1000+ products"

  defp product_count_reason(count) when is_integer(count) and count >= 100,
    do: "100+ products"

  defp product_count_reason(count) when is_integer(count) and count > 0,
    do: "any products"

  defp product_count_reason(_count), do: nil

  defp exact_field_points(value, expected_value, points) do
    if normalized_field(value) == expected_value, do: points, else: 0
  end

  defp exact_field_reason(value, expected_value, reason) do
    if normalized_field(value) == expected_value, do: reason
  end

  defp source_feed_type_points(value), do: if(non_empty_string?(value), do: 5, else: 0)

  defp source_feed_type_reason(value) do
    if non_empty_string?(value), do: "feed type present"
  end

  defp normalized_field(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
  end

  defp normalized_field(_value), do: nil

  defp non_empty_string?(value) when is_binary(value), do: String.trim(value) != ""
  defp non_empty_string?(_value), do: false

  defp last_seen_unix(nil), do: 0
  defp last_seen_unix(%DateTime{} = value), do: DateTime.to_unix(value)

  defp render_row(values) do
    values
    |> Enum.map(&field_value/1)
    |> Enum.map(&escape_csv_value/1)
    |> Enum.join(",")
  end

  defp field_value(nil), do: ""
  defp field_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp field_value(value) when is_integer(value), do: Integer.to_string(value)
  defp field_value(value), do: to_string(value)

  defp escape_csv_value(value) do
    escaped_value = String.replace(value, ~s("), ~s(""))

    if String.contains?(value, [",", ~s("), "\r", "\n"]) do
      ~s("#{escaped_value}")
    else
      escaped_value
    end
  end
end

defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.FitGapReport do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareWeb.GraphQL.GlobalId

  @provider "cj"

  @spec print(keyword()) :: :ok
  def print(opts) do
    candidates = candidates(opts)
    analyzed = Enum.map(candidates, &{&1, compute_gaps(&1)})
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
      | Enum.map(analyzed, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp candidates(opts) do
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

  defp compute_gaps(candidate) do
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

  defp render_candidate({%MerchantFeedCandidate{} = candidate, gaps}) do
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

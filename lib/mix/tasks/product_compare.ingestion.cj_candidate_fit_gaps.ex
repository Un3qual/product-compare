defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateFitGaps do
  @moduledoc """
  Reports CJ candidate fit-gap reasons without mutating or exporting any data.
  """

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports CJ feed candidate fit gaps"
  @allowed_statuses ~w(pending shortlisted dismissed all)
  @default_limit 25
  @max_limit 100
  @provider "cj"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)

    opts
    |> load_candidates()
    |> analyze_candidates()
    |> render_report(opts)
    |> IO.write()
  end

  defp parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        status: :string,
        limit: :integer
      )

    %{
      limit: normalize_limit(Keyword.get(opts, :limit)),
      status: normalize_status(Keyword.get(opts, :status))
    }
  end

  defp normalize_status(status) when is_binary(status) do
    status = status |> String.trim() |> String.downcase()

    if status in @allowed_statuses do
      status
    else
      Mix.raise("invalid review status: #{status}")
    end
  end

  defp normalize_status(_status), do: "pending"

  defp normalize_limit(value) when is_integer(value) and value > 0 do
    min(value, @max_limit)
  end

  defp normalize_limit(nil), do: @default_limit
  defp normalize_limit(_value), do: Mix.raise("invalid --limit: expected a positive integer")

  defp load_candidates(%{status: "all", limit: limit}) do
    Ingestion.list_merchant_feed_candidates_query(sort: :fit_score_desc)
    |> where([candidate], candidate.provider == ^@provider)
    |> limit(^limit)
    |> Repo.all()
  end

  defp load_candidates(%{status: status, limit: limit}) do
    Ingestion.list_merchant_feed_candidates_query(review_status: status, sort: :fit_score_desc)
    |> where([candidate], candidate.provider == ^@provider)
    |> limit(^limit)
    |> Repo.all()
  end

  defp analyze_candidates(candidates) do
    candidates
    |> Enum.map(&{&1, compute_fit_gaps(&1)})
    |> then(&{&1, aggregate_gap_counts(&1)})
  end

  defp aggregate_gap_counts(candidates) do
    initial =
      %{
        country_not_us: 0,
        currency_not_usd: 0,
        language_not_en: 0,
        missing_product_count: 0,
        low_product_count: 0,
        missing_source_feed_type: 0
      }

    Enum.reduce(candidates, initial, fn {_candidate, fit_gaps}, counts ->
      Enum.reduce(fit_gaps, counts, fn gap, acc ->
        Map.update!(acc, gap, &(&1 + 1))
      end)
    end)
  end

  defp compute_fit_gaps(candidate) do
    []
    |> maybe_add_gap(:country_not_us, country_not_us?(candidate.advertiser_country))
    |> maybe_add_gap(:currency_not_usd, currency_not_usd?(candidate.currency))
    |> maybe_add_gap(:language_not_en, language_not_en?(candidate.language))
    |> maybe_add_gap(:missing_product_count, is_nil(candidate.product_count))
    |> maybe_add_gap(:low_product_count, low_product_count?(candidate.product_count))
    |> maybe_add_gap(:missing_source_feed_type, blank_field?(candidate.source_feed_type))
  end

  defp maybe_add_gap(gaps, _reason, false), do: gaps
  defp maybe_add_gap(gaps, reason, true), do: gaps ++ [reason]

  defp country_not_us?(country), do: normalize_country(country) != "US"
  defp currency_not_usd?(currency), do: normalize_upper(currency) != "USD"
  defp language_not_en?(language), do: normalize_upper(language) != "EN"

  defp low_product_count?(nil), do: false
  defp low_product_count?(product_count) when is_integer(product_count), do: product_count < 1000
  defp low_product_count?(_product_count), do: false

  defp blank_field?(value) when is_binary(value), do: String.trim(value) == ""
  defp blank_field?(nil), do: true
  defp blank_field?(_value), do: false

  defp normalize_upper(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
  end

  defp normalize_upper(_value), do: nil

  defp normalize_country(value) when is_binary(value), do: normalize_upper(value)
  defp normalize_country(_value), do: nil

  defp render_report({candidates, gap_counts}, %{status: status}) do
    summary = [
      "provider=#{@provider}",
      "status=#{status}",
      "candidate_count=#{length(candidates)}",
      "country_not_us=#{gap_counts.country_not_us}",
      "currency_not_usd=#{gap_counts.currency_not_usd}",
      "language_not_en=#{gap_counts.language_not_en}",
      "missing_product_count=#{gap_counts.missing_product_count}",
      "low_product_count=#{gap_counts.low_product_count}",
      "missing_source_feed_type=#{gap_counts.missing_source_feed_type}"
    ]

    [
      Enum.join(summary, " ")
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_candidate({%MerchantFeedCandidate{} = candidate, fit_gaps}) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)
    gap_names = Enum.map(fit_gaps, &Atom.to_string/1) |> Enum.join(",")

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:review_status, candidate.review_status},
      {:product_count, candidate.product_count},
      {:gap_count, length(fit_gaps)},
      {:gaps, gap_names}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
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

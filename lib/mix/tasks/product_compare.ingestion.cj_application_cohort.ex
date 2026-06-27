defmodule Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohort do
  @moduledoc "Reports shortlisted CJ application cohort candidates without contacting CJ."

  use Mix.Task

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports shortlisted CJ application cohort candidates"
  @allowed_statuses ~w(pending shortlisted dismissed)
  @default_limit 25
  @max_limit 100
  @provider "cj"

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    opts = parse_argv(argv)

    opts
    |> load_candidates()
    |> enforce_required_candidates(opts)
    |> render_report(opts)
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          country: :string,
          currency: :string,
          language: :string,
          limit: :integer,
          min_product_count: :integer,
          require_candidates: :boolean,
          status: :string
        ]
      )

    %{
      country: normalize_upper(Keyword.get(opts, :country)),
      currency: normalize_upper(Keyword.get(opts, :currency)),
      language: normalize_upper(Keyword.get(opts, :language)),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      min_product_count: normalize_min_product_count(Keyword.get(opts, :min_product_count)),
      require_candidates: Keyword.get(opts, :require_candidates, false),
      status: normalize_status(Keyword.get(opts, :status))
    }
  end

  defp normalize_status(status) when is_binary(status) do
    status = status |> String.trim() |> String.downcase()

    if status in @allowed_statuses do
      status
    else
      "shortlisted"
    end
  end

  defp normalize_status(_status), do: "shortlisted"

  defp normalize_upper(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      normalized -> String.upcase(normalized)
    end
  end

  defp normalize_upper(_value), do: nil

  defp normalize_limit(value) when is_integer(value) and value > 0 do
    min(value, @max_limit)
  end

  defp normalize_limit(_value), do: @default_limit

  defp normalize_min_product_count(value) when is_integer(value) and value >= 0, do: value
  defp normalize_min_product_count(_value), do: nil

  defp load_candidates(%{status: status} = opts) do
    Ingestion.list_merchant_feed_candidates_query(review_status: status, sort: :fit_score_desc)
    |> Repo.all()
    |> Enum.filter(&cj_candidate?/1)
    |> maybe_filter_string(:advertiser_country, opts.country)
    |> maybe_filter_string(:currency, opts.currency)
    |> maybe_filter_string(:language, opts.language)
    |> maybe_filter_min_product_count(opts.min_product_count)
    |> Enum.take(opts.limit)
  end

  defp cj_candidate?(%MerchantFeedCandidate{provider: @provider}), do: true
  defp cj_candidate?(%MerchantFeedCandidate{}), do: false

  defp maybe_filter_string(candidates, _field, nil), do: candidates

  defp maybe_filter_string(candidates, field, expected) do
    Enum.filter(candidates, fn candidate ->
      candidate
      |> Map.get(field)
      |> normalize_upper() == expected
    end)
  end

  defp maybe_filter_min_product_count(candidates, nil), do: candidates

  defp maybe_filter_min_product_count(candidates, min_product_count) do
    Enum.filter(candidates, fn candidate ->
      product_count = candidate.product_count || 0
      product_count >= min_product_count
    end)
  end

  defp enforce_required_candidates([], %{require_candidates: true}) do
    Mix.raise("no CJ application cohort candidates found")
  end

  defp enforce_required_candidates(candidates, _opts), do: candidates

  defp render_report(candidates, %{status: status}) do
    [
      "provider=#{@provider} cohort_status=#{status} count=#{length(candidates)}"
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
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
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
  end

  defp review_note_present?(note) when is_binary(note), do: String.trim(note) != ""
  defp review_note_present?(_note), do: false

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

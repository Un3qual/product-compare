defmodule ProductCompare.Ingestion.FeedCandidates do
  @moduledoc false

  import Ecto.Query
  import ProductCompare.Ingestion.FitScore, only: [merchant_feed_candidate_fit_score: 1]

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  @replace_fields [
    :provider,
    :advertiser_id,
    :advertiser_name,
    :advertiser_country,
    :source_feed_type,
    :currency,
    :language,
    :feed_name,
    :product_count,
    :provider_last_updated_at,
    :raw_metadata,
    :last_seen_at,
    :updated_at
  ]

  @spec upsert_merchant_feed_candidate(Source.t(), map()) ::
          {:ok, MerchantFeedCandidate.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_feed_candidate(%Source{id: source_id}, attrs) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:source_id, source_id)
      |> Map.put_new(:last_seen_at, DateTime.utc_now())
      |> Map.put_new(:raw_metadata, %{})

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace, @replace_fields},
      conflict_target: [:source_id, :provider_feed_id],
      returning: true
    )
  end

  @spec list_merchant_feed_candidates(Source.t()) :: [MerchantFeedCandidate.t()]
  def list_merchant_feed_candidates(%Source{id: source_id}) do
    MerchantFeedCandidate
    |> where([candidate], candidate.source_id == ^source_id)
    |> order_by([candidate], asc: candidate.advertiser_name, asc: candidate.provider_feed_id)
    |> Repo.all()
  end

  @spec list_merchant_feed_candidates_query() :: Ecto.Query.t()
  def list_merchant_feed_candidates_query, do: list_merchant_feed_candidates_query([])

  @spec list_merchant_feed_candidates_query(keyword() | map()) :: Ecto.Query.t()
  def list_merchant_feed_candidates_query(opts) do
    opts = Map.new(opts)

    MerchantFeedCandidate
    |> maybe_filter_review_status(Map.get(opts, :review_status))
    |> order_candidates(Map.get(opts, :sort, :name_asc))
  end

  @spec review_merchant_feed_candidate(integer(), map()) ::
          {:ok, MerchantFeedCandidate.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def review_merchant_feed_candidate(candidate_id, attrs)
      when is_integer(candidate_id) and is_map(attrs) do
    case Repo.get(MerchantFeedCandidate, candidate_id) do
      nil ->
        {:error, :not_found}

      %MerchantFeedCandidate{} = candidate ->
        attrs =
          attrs
          |> normalize_review_attrs()
          |> Map.put(:reviewed_at, DateTime.utc_now())

        candidate
        |> MerchantFeedCandidate.review_changeset(attrs)
        |> Repo.update()
    end
  end

  defp maybe_filter_review_status(query, status)
       when status in ["pending", "shortlisted", "dismissed"] do
    where(query, [candidate], candidate.review_status == ^status)
  end

  defp maybe_filter_review_status(query, _status), do: query

  defp order_candidates(query, :product_count_desc) do
    order_by(query, [candidate],
      desc_nulls_last: candidate.product_count,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
  end

  defp order_candidates(query, :last_seen_desc) do
    order_by(query, [candidate],
      desc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
  end

  defp order_candidates(query, :fit_score_desc) do
    order_by(query, [candidate],
      desc: merchant_feed_candidate_fit_score(candidate),
      desc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
  end

  defp order_candidates(query, _sort) do
    order_by(query, [candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
  end

  defp normalize_review_attrs(attrs) when is_map(attrs) do
    %{}
    |> put_review_attr(attrs, :review_status)
    |> put_review_attr(attrs, :review_note)
    |> normalize_review_note()
  end

  defp put_review_attr(normalized_attrs, attrs, key) do
    string_key = Atom.to_string(key)

    cond do
      Map.has_key?(attrs, key) ->
        Map.put(normalized_attrs, key, Map.fetch!(attrs, key))

      Map.has_key?(attrs, string_key) ->
        Map.put(normalized_attrs, key, Map.fetch!(attrs, string_key))

      true ->
        normalized_attrs
    end
  end

  defp normalize_review_note(attrs) do
    if Map.has_key?(attrs, :review_note) do
      Map.update!(attrs, :review_note, &blank_to_nil/1)
    else
      attrs
    end
  end

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp blank_to_nil(value), do: value
end

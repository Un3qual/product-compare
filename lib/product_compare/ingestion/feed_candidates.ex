defmodule ProductCompare.Ingestion.FeedCandidates do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Ingestion.CJPrograms
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
    :cj_program_id,
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

    Repo.transaction(fn ->
      with {:ok, cj_program_id} <- cj_program_id(source_id, attrs),
           {:ok, candidate} <- upsert_candidate(attrs, cj_program_id) do
        candidate
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
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
    |> order_candidates(Map.get(opts, :sort, :name_asc))
  end

  defp cj_program_id(source_id, attrs) do
    if attr(attrs, :provider) == "cj" do
      case normalize_advertiser_id(attr(attrs, :advertiser_id)) do
        nil ->
          {:ok, nil}

        advertiser_id ->
          CJPrograms.ensure_in_transaction(source_id, advertiser_id) |> program_id()
      end
    else
      {:ok, nil}
    end
  end

  defp program_id({:ok, %{} = program}), do: {:ok, program.id}
  defp program_id({:error, reason}), do: {:error, reason}

  defp upsert_candidate(attrs, cj_program_id) do
    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(Map.put(attrs, :cj_program_id, cj_program_id))
    |> Repo.insert(
      on_conflict: {:replace, @replace_fields},
      conflict_target: [:source_id, :provider_feed_id],
      returning: true
    )
  end

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

  defp order_candidates(query, _sort) do
    order_by(query, [candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
  end

  defp attr(attrs, key) do
    Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
  end

  defp normalize_advertiser_id(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp normalize_advertiser_id(_value), do: nil
end

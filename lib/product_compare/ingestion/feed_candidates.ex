defmodule ProductCompare.Ingestion.FeedCandidates do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Ingestion.SourceProviders
  alias ProductCompare.Repo

  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Reference.CurrencyCode
  alias ProductCompareSchemas.Specs.Source

  @replace_fields [
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
  @replace_fields_without_identity @replace_fields -- [:advertiser_id, :cj_program_id]

  @spec upsert_merchant_feed_candidate(Source.t(), map()) ::
          {:ok, MerchantFeedCandidate.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_feed_candidate(%Source{id: source_id}, attrs) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:source_id, source_id)
      |> Map.put_new(:last_seen_at, DateTime.utc_now())
      |> Map.put_new(:raw_metadata, %{})
      |> normalize_reference_codes()

    Repo.transaction(fn ->
      with {:ok, requested_provider} <- candidate_provider(attrs),
           {:ok, provider} <-
             SourceProviders.ensure_in_transaction(source_id, requested_provider),
           attrs = Map.put(attrs, :provider, provider),
           {:ok, cj_program_link} <- cj_program_link(source_id, attrs),
           {:ok, candidate} <- upsert_candidate(attrs, cj_program_link) do
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

  defp cj_program_link(source_id, attrs) do
    if attr(attrs, :provider) == "cj" do
      case CJPrograms.ensure_in_transaction(source_id, attr(attrs, :advertiser_id)) do
        {:ok, program} ->
          {:ok, {:replace, program.id}}

        {:error, :blank_advertiser_id} ->
          {:ok, :preserve}

        {:error, reason} ->
          {:error, reason}
      end
    else
      {:ok, {:replace, nil}}
    end
  end

  defp upsert_candidate(attrs, :preserve) do
    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace, @replace_fields_without_identity},
      conflict_target: [:source_id, :provider_feed_id],
      returning: true
    )
  end

  defp upsert_candidate(attrs, {:replace, cj_program_id}) do
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

  defp candidate_provider(attrs) do
    with {:ok, requested} <- normalize_requested_provider(attrs) do
      feed_type_provider =
        MerchantFeedCandidate.provider_for_feed_type(attr(attrs, :source_feed_type))

      if requested && feed_type_provider && requested != feed_type_provider do
        {:error,
         %MerchantFeedCandidate{}
         |> MerchantFeedCandidate.changeset(attrs)
         |> Ecto.Changeset.add_error(
           :provider,
           "does not own the requested provider feed type"
         )}
      else
        {:ok, requested || feed_type_provider}
      end
    end
  end

  defp normalize_requested_provider(attrs) do
    value = attr(attrs, :provider)

    case Source.normalize_provider(value) do
      provider when is_binary(provider) ->
        {:ok, provider}

      nil ->
        if blank_provider?(value) do
          {:ok, nil}
        else
          {:error,
           %MerchantFeedCandidate{}
           |> MerchantFeedCandidate.changeset(attrs)
           |> Ecto.Changeset.add_error(:provider, "is not a supported integration provider")}
        end
    end
  end

  defp blank_provider?(nil), do: true
  defp blank_provider?(value) when is_binary(value), do: String.trim(value) == ""
  defp blank_provider?(_value), do: false

  defp normalize_reference_codes(attrs) do
    attrs
    |> Map.put(
      :advertiser_country,
      MerchantFeedCandidate.normalize_country(attr(attrs, :advertiser_country))
    )
    |> Map.put(:currency, normalize_currency(attr(attrs, :currency)))
    |> Map.put(:language, MerchantFeedCandidate.normalize_language(attr(attrs, :language)))
    |> Map.put(
      :source_feed_type,
      MerchantFeedCandidate.normalize_feed_type(attr(attrs, :source_feed_type))
    )
  end

  defp normalize_currency(value) do
    case CurrencyCode.cast(value) do
      {:ok, code} -> code
      :error -> nil
    end
  end
end

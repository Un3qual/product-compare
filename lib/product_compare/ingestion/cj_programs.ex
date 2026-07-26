defmodule ProductCompare.Ingestion.CJPrograms do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @stage_keys CJProgram.stage_keys()
  @safe_feed_fields [
    :id,
    :entropy_id,
    :provider,
    :provider_feed_id,
    :advertiser_id,
    :advertiser_name,
    :advertiser_country,
    :source_feed_type,
    :currency,
    :language,
    :feed_name,
    :product_count,
    :provider_last_updated_at,
    :last_seen_at,
    :source_id,
    :cj_program_id,
    :inserted_at,
    :updated_at
  ]

  @spec list_query(keyword()) :: Ecto.Query.t()
  def list_query(opts \\ []) do
    latest_name = latest_name_query()
    feed_count = feed_count_query()

    CJProgram
    |> join(:left, [program], name in subquery(latest_name), on: name.cj_program_id == program.id)
    |> join(:left, [program, _name], count in subquery(feed_count),
      on: count.cj_program_id == program.id
    )
    |> select_merge([program, name, count], %{
      advertiser_name: coalesce(name.advertiser_name, program.advertiser_id),
      feed_count: coalesce(count.feed_count, 0)
    })
    |> maybe_filter_program_stage(Keyword.get(opts, :stage))
    |> order_programs(Keyword.get(opts, :sort, :name_asc))
  end

  @spec stage_counts() :: %{required(atom()) => non_neg_integer()}
  def stage_counts do
    CJProgram
    |> group_by([program], program.stage)
    |> select([program], {program.stage, count(program.id)})
    |> Repo.all()
    |> Enum.reduce(empty_stage_counts(), fn {stage, count}, counts ->
      case Map.fetch(@stage_keys, stage) do
        {:ok, stage_key} -> Map.put(counts, stage_key, count)
        :error -> counts
      end
    end)
  end

  @spec list_feeds_query(keyword()) :: Ecto.Query.t()
  def list_feeds_query(opts \\ []) do
    MerchantFeedCandidate
    |> linked_cj_feed_query()
    |> maybe_filter_program_id(Keyword.get(opts, :program_id))
    |> maybe_filter_feed_stage(Keyword.get(opts, :stage))
    |> safe_feed_select()
    |> order_by([feed], desc: feed.last_seen_at, asc: feed.id)
  end

  @spec list_unmatched_feeds_query() :: Ecto.Query.t()
  def list_unmatched_feeds_query do
    MerchantFeedCandidate
    |> where([feed], feed.provider == @provider and is_nil(feed.cj_program_id))
    |> safe_feed_select()
    |> order_by([feed], desc: feed.last_seen_at, asc: feed.id)
  end

  @spec pursued_stages() :: [String.t()]
  def pursued_stages, do: ["selected", "applied", "accepted"]

  @spec ensure_in_transaction(pos_integer(), String.t() | nil) ::
          {:ok, CJProgram.t()} | {:error, :blank_advertiser_id | Ecto.Changeset.t()}
  def ensure_in_transaction(source_id, raw_advertiser_id) when is_integer(source_id) do
    case normalize_advertiser_id(raw_advertiser_id) do
      nil ->
        {:error, :blank_advertiser_id}

      advertiser_id ->
        %CJProgram{}
        |> CJProgram.changeset(%{
          source_id: source_id,
          advertiser_id: advertiser_id,
          stage: "new",
          changed_at: DateTime.utc_now()
        })
        |> Repo.insert(
          on_conflict: :nothing,
          conflict_target: [:source_id, :advertiser_id],
          returning: true
        )
        |> fetch_conflicted_program(source_id, advertiser_id)
    end
  end

  @spec get_by_entropy_id(Ecto.UUID.t()) :: CJProgram.t() | nil
  def get_by_entropy_id(entropy_id) when is_binary(entropy_id) do
    Repo.get_by(CJProgram, entropy_id: entropy_id)
  end

  @spec get_summary(pos_integer()) :: CJProgram.t() | nil
  def get_summary(program_id) when is_integer(program_id) and program_id > 0 do
    list_query()
    |> where([program], program.id == ^program_id)
    |> Repo.one()
  end

  @spec update_lifecycle(Ecto.UUID.t(), map()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | :stale | Ecto.Changeset.t()}
  def update_lifecycle(entropy_id, attrs) do
    update_lifecycle(entropy_id, attrs, DateTime.utc_now())
  end

  @spec update_lifecycle(Ecto.UUID.t(), map(), DateTime.t()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | :stale | Ecto.Changeset.t()}
  def update_lifecycle(entropy_id, attrs, now) when is_binary(entropy_id) and is_map(attrs) do
    case get_by_entropy_id(entropy_id) do
      nil ->
        {:error, :not_found}

      %CJProgram{} = program ->
        with :ok <- ensure_expected_change_time(program, attrs) do
          program
          |> CJProgram.lifecycle_changeset(drop_expected_change_time(attrs))
          |> persist_lifecycle_update(program, now)
        end
    end
  end

  defp latest_name_query do
    MerchantFeedCandidate
    |> where([feed], feed.provider == @provider and not is_nil(feed.cj_program_id))
    |> where([feed], not is_nil(fragment("NULLIF(BTRIM(?), '')", feed.advertiser_name)))
    |> distinct([feed], feed.cj_program_id)
    |> order_by([feed], asc: feed.cj_program_id, desc: feed.last_seen_at, desc: feed.id)
    |> select([feed], %{
      cj_program_id: feed.cj_program_id,
      advertiser_name: feed.advertiser_name
    })
  end

  defp feed_count_query do
    MerchantFeedCandidate
    |> where([feed], feed.provider == @provider and not is_nil(feed.cj_program_id))
    |> group_by([feed], feed.cj_program_id)
    |> select([feed], %{cj_program_id: feed.cj_program_id, feed_count: count(feed.id)})
  end

  defp linked_cj_feed_query(query) do
    where(query, [feed], feed.provider == @provider and not is_nil(feed.cj_program_id))
  end

  defp safe_feed_select(query) do
    select(query, [feed], struct(feed, ^@safe_feed_fields))
  end

  defp maybe_filter_program_stage(query, nil), do: query

  defp maybe_filter_program_stage(query, stage) do
    where(query, [program], program.stage == ^stage)
  end

  defp maybe_filter_program_id(query, program_id)
       when is_integer(program_id) and program_id > 0 do
    where(query, [feed], feed.cj_program_id == ^program_id)
  end

  defp maybe_filter_program_id(query, _program_id), do: query

  defp maybe_filter_feed_stage(query, nil), do: query

  defp maybe_filter_feed_stage(query, stage) do
    join(query, :inner, [feed], program in CJProgram,
      on: program.id == feed.cj_program_id and program.stage == ^stage
    )
  end

  defp order_programs(query, :last_changed_desc) do
    order_by(query, [program], desc: program.changed_at, asc: program.id)
  end

  defp order_programs(query, :feed_count_desc) do
    order_by(query, [program, _name, count], desc: coalesce(count.feed_count, 0), asc: program.id)
  end

  defp order_programs(query, :name_asc) do
    order_by(query, [program, name],
      asc: coalesce(name.advertiser_name, program.advertiser_id),
      asc: program.id
    )
  end

  defp empty_stage_counts, do: Map.new(@stage_keys, fn {_stage, key} -> {key, 0} end)

  defp fetch_conflicted_program({:ok, %CJProgram{id: nil}}, source_id, advertiser_id) do
    {:ok, Repo.get_by!(CJProgram, source_id: source_id, advertiser_id: advertiser_id)}
  end

  defp fetch_conflicted_program(result, _source_id, _advertiser_id), do: result

  defp ensure_expected_change_time(program, attrs) do
    case attr(attrs, :expected_changed_at) do
      nil ->
        :ok

      %DateTime{} = expected_changed_at ->
        if DateTime.compare(program.changed_at, expected_changed_at) == :eq,
          do: :ok,
          else: {:error, :stale}

      _invalid ->
        {:error, :stale}
    end
  end

  defp drop_expected_change_time(attrs) do
    Map.drop(attrs, [:expected_changed_at, "expected_changed_at"])
  end

  defp persist_lifecycle_update(%Ecto.Changeset{valid?: false} = changeset, _program, _now),
    do: {:error, changeset}

  defp persist_lifecycle_update(%Ecto.Changeset{changes: changes}, program, _now)
       when map_size(changes) == 0 do
    CJProgram
    |> where([current], current.id == ^program.id and current.changed_at == ^program.changed_at)
    |> Repo.update_all(set: [changed_at: program.changed_at])
    |> case do
      {1, _rows} -> {:ok, program}
      {0, _rows} -> {:error, :stale}
    end
  end

  defp persist_lifecycle_update(changeset, _program, now) do
    changeset
    |> Ecto.Changeset.optimistic_lock(:changed_at, fn _current -> now end)
    |> Repo.update(stale_error_field: :changed_at, stale_error_message: "has changed")
    |> normalize_stale_update()
  end

  defp normalize_stale_update({:error, %Ecto.Changeset{} = changeset} = result) do
    if Keyword.has_key?(changeset.errors, :changed_at), do: {:error, :stale}, else: result
  end

  defp normalize_stale_update(result), do: result

  defp normalize_advertiser_id(value) when is_binary(value), do: blank_to_nil(value)
  defp normalize_advertiser_id(_value), do: nil

  defp attr(attrs, key), do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end
end

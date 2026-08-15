defmodule ProductCompare.DevSeeds.Support do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo

  @max_transaction_attempts 3
  @unobserved_watch_entropy_id "d3ca0000-0000-4000-8000-000000000004"

  @spec serializable_transaction((-> value)) :: {:ok, value} | {:error, term()}
        when value: var
  def serializable_transaction(fun) when is_function(fun, 0) do
    case Repo.query!("SHOW transaction_isolation").rows do
      [[level]] when level in ["repeatable read", "serializable"] ->
        if Repo.in_transaction?() do
          Repo.transaction(fun, timeout: :infinity)
        else
          retryable_transaction(fun, @max_transaction_attempts, true)
        end

      [["read committed"]] ->
        retryable_transaction(fun, @max_transaction_attempts, true)

      [[level]] ->
        raise "development seed does not support transaction isolation #{inspect(level)}"
    end
  end

  @spec unobserved_watch_entropy_id() :: Ecto.UUID.t()
  def unobserved_watch_entropy_id, do: @unobserved_watch_entropy_id

  @spec sha256(binary()) :: binary()
  def sha256(value) when is_binary(value), do: :crypto.hash(:sha256, value)

  @spec stable_uuid(String.t(), String.t()) :: Ecto.UUID.t()
  def stable_uuid(namespace, key) when is_binary(namespace) and is_binary(key) do
    hex =
      "#{namespace}:#{key}"
      |> sha256()
      |> Base.encode16(case: :lower)

    uuid =
      [
        String.slice(hex, 0, 8),
        String.slice(hex, 8, 4),
        String.slice(hex, 12, 4),
        String.slice(hex, 16, 4),
        String.slice(hex, 20, 12)
      ]
      |> Enum.join("-")

    {:ok, uuid} = Ecto.UUID.cast(uuid)
    uuid
  end

  @spec validated_row!(Ecto.Changeset.t(), [atom()], keyword()) :: map()
  def validated_row!(%Ecto.Changeset{} = changeset, persisted_fields, options)
      when is_list(persisted_fields) and is_list(options) do
    stage = Keyword.fetch!(options, :stage)
    seed_fields = options |> Keyword.delete(:stage) |> Map.new()

    case Ecto.Changeset.apply_action(changeset, :insert) do
      {:ok, struct} -> struct |> Map.take(persisted_fields) |> Map.merge(seed_fields)
      {:error, invalid_changeset} -> expect!({:error, invalid_changeset}, stage)
    end
  end

  @spec sync_owned_rows!(module(), [map()], [atom()], keyword()) :: [struct()]
  def sync_owned_rows!(schema, rows, persisted_fields, options)
      when is_atom(schema) and is_list(rows) and is_list(persisted_fields) and is_list(options) do
    stage = Keyword.fetch!(options, :stage)
    chunk_size = Keyword.get(options, :chunk_size, 1_000)
    entropy_ids = Enum.map(rows, &Map.fetch!(&1, :entropy_id))

    if length(Enum.uniq(entropy_ids)) != length(entropy_ids) do
      raise "development seed #{stage} contains duplicate entropy identifiers"
    end

    existing_by_entropy_id = fetch_by_entropy_ids(schema, entropy_ids, chunk_size)

    changed_rows =
      Enum.reject(rows, fn row ->
        case Map.get(existing_by_entropy_id, row.entropy_id) do
          nil -> false
          existing -> persisted_values_equal?(schema, existing, row, persisted_fields)
        end
      end)

    persisted_by_entropy_id =
      if changed_rows == [] do
        existing_by_entropy_id
      else
        timestamp_fields =
          if :updated_at in schema.__schema__(:fields), do: [:updated_at], else: []

        replace_fields = Enum.uniq(persisted_fields ++ timestamp_fields)

        changed_rows
        |> Enum.chunk_every(chunk_size)
        |> Enum.each(fn chunk ->
          Repo.insert_all(schema, chunk,
            on_conflict: {:replace, replace_fields},
            conflict_target: [:entropy_id]
          )
        end)

        fetch_by_entropy_ids(schema, entropy_ids, chunk_size)
      end

    Enum.map(entropy_ids, fn entropy_id ->
      Map.get(persisted_by_entropy_id, entropy_id) ||
        raise "development seed #{stage} did not persist #{entropy_id}"
    end)
  end

  @spec expect!({:ok, value} | {:error, term()}, String.t()) :: value when value: var
  def expect!({:ok, value}, _stage), do: value

  def expect!({:error, reason}, stage) do
    raise "development seed #{stage} failed: #{format_reason(reason)}"
  end

  @spec capture_token!(((String.t() -> :ok) -> :ok)) :: String.t()
  def capture_token!(delivery) when is_function(delivery, 1) do
    receiver = self()
    reference = make_ref()

    :ok =
      delivery.(fn token ->
        send(receiver, {reference, token})
        :ok
      end)

    receive do
      {^reference, token} when is_binary(token) -> token
    after
      1_000 -> raise "development seed token callback did not return a token"
    end
  end

  defp retryable_transaction(fun, attempts_left, set_serializable?) do
    result = run_transaction(fun, set_serializable?)

    case result do
      {:error, {:retry_seed_transaction, _reason}} when attempts_left > 1 ->
        retryable_transaction(fun, attempts_left - 1, set_serializable?)

      result ->
        result
    end
  rescue
    error in Postgrex.Error ->
      if retryable_transaction_error?(error) and attempts_left > 1 do
        retryable_transaction(fun, attempts_left - 1, set_serializable?)
      else
        reraise error, __STACKTRACE__
      end
  end

  defp run_transaction(fun, false), do: Repo.transaction(fun, timeout: :infinity)

  defp run_transaction(fun, true) do
    Repo.transaction(
      fn ->
        set_serializable_or_rollback!()
        fun.()
      end,
      timeout: :infinity
    )
    |> case do
      {:error, :serializable_isolation_requires_top_level_transaction} ->
        Repo.transaction(fun, timeout: :infinity)

      result ->
        result
    end
  end

  defp set_serializable_or_rollback! do
    Repo.query!("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
  rescue
    error in Postgrex.Error ->
      if active_transaction_error?(error) do
        Repo.rollback(:serializable_isolation_requires_top_level_transaction)
      else
        reraise error, __STACKTRACE__
      end
  end

  defp active_transaction_error?(%Postgrex.Error{postgres: %{code: :active_sql_transaction}}),
    do: true

  defp active_transaction_error?(%Postgrex.Error{}), do: false

  defp retryable_transaction_error?(%Postgrex.Error{postgres: %{code: code}}),
    do: code in [:serialization_failure, :deadlock_detected]

  defp retryable_transaction_error?(%Postgrex.Error{}), do: false

  defp fetch_by_entropy_ids(_schema, [], _chunk_size), do: %{}

  defp fetch_by_entropy_ids(schema, entropy_ids, chunk_size) do
    entropy_ids
    |> Enum.chunk_every(chunk_size)
    |> Enum.flat_map(fn chunk ->
      schema
      |> where([record], record.entropy_id in ^chunk)
      |> Repo.all()
    end)
    |> Map.new(&{&1.entropy_id, &1})
  end

  defp persisted_values_equal?(schema, existing, expected, fields) do
    Enum.all?(fields, fn field ->
      type = schema.__schema__(:type, field)
      Ecto.Type.equal?(type, Map.fetch!(existing, field), Map.fetch!(expected, field))
    end)
  end

  defp format_reason(%Ecto.Changeset{} = changeset), do: inspect(changeset.errors)
  defp format_reason(reason), do: inspect(reason)
end

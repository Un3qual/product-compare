defmodule ProductCompare.DevSeeds.Support do
  @moduledoc false

  alias ProductCompare.Repo

  @max_transaction_attempts 3
  @unobserved_watch_entropy_id "d3ca0000-0000-4000-8000-000000000004"

  @spec serializable_transaction((-> value)) :: {:ok, value} | {:error, term()}
        when value: var
  def serializable_transaction(fun) when is_function(fun, 0) do
    case Repo.query!("SHOW transaction_isolation").rows do
      [[level]] when level in ["repeatable read", "serializable"] ->
        Repo.transaction(fun)

      [["read committed"]] ->
        serializable_transaction(fun, @max_transaction_attempts)

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

  defp serializable_transaction(fun, attempts_left) do
    result =
      Repo.transaction(fn ->
        Repo.query!("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
        fun.()
      end)

    case result do
      {:error, {:retry_seed_transaction, _reason}} when attempts_left > 1 ->
        serializable_transaction(fun, attempts_left - 1)

      result ->
        result
    end
  rescue
    error in Postgrex.Error ->
      if retryable_transaction_error?(error) and attempts_left > 1 do
        serializable_transaction(fun, attempts_left - 1)
      else
        reraise error, __STACKTRACE__
      end
  end

  defp retryable_transaction_error?(%Postgrex.Error{postgres: %{code: code}}),
    do: code in [:serialization_failure, :deadlock_detected]

  defp retryable_transaction_error?(%Postgrex.Error{}), do: false

  defp format_reason(%Ecto.Changeset{} = changeset), do: inspect(changeset.errors)
  defp format_reason(reason), do: inspect(reason)
end

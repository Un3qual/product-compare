defmodule ProductCompare.Repo do
  use Ecto.Repo,
    otp_app: :product_compare,
    adapter: Ecto.Adapters.Postgres

  @spec repeatable_read_transaction((-> result), String.t()) ::
          {:ok, result} | {:error, term()}
        when result: term()
  def repeatable_read_transaction(fun, operation) do
    already_in_transaction? = in_transaction?()

    transaction(fn ->
      if already_in_transaction? do
        ensure_repeatable_read!(operation)
      else
        query!("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
      end

      fun.()
    end)
  end

  defp ensure_repeatable_read!(operation) do
    case query!("SHOW transaction_isolation").rows do
      [[level]] when level in ["repeatable read", "serializable"] ->
        :ok

      [[level]] ->
        raise ArgumentError,
              "#{operation} requires repeatable read or serializable isolation, got: #{level}"
    end
  end
end

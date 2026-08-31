defmodule ProductCompare.DatabaseLocks do
  @moduledoc false

  alias ProductCompare.Repo

  @spec lock_transaction!(String.t()) :: :ok
  def lock_transaction!(key) when is_binary(key) do
    unless Repo.in_transaction?() do
      raise ArgumentError, "transaction advisory locks require a database transaction"
    end

    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key])
    :ok
  end
end

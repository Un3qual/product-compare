defmodule ProductCompare.DataCase do
  @moduledoc """
  Database tests run inside an owned SQL sandbox so their writes never leak across
  tests. `async: true` keeps the sandbox private; the shared Ecto imports and
  `errors_on/1` keep persistence assertions focused on application behavior.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      alias ProductCompare.Repo

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import ProductCompare.DataCase
    end
  end

  setup tags do
    ProductCompare.DataCase.setup_sandbox(tags)
    :ok
  end

  @doc """
  Sets up the sandbox based on the test tags.
  """
  def setup_sandbox(tags) do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(ProductCompare.Repo, shared: not tags[:async])
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
  end

  @doc """
  A helper that transforms changeset errors into a map of messages.

      assert {:error, changeset} = Accounts.create_user(%{password: "short"})
      assert "password is too short" in errors_on(changeset).password
      assert %{password: ["password is too short"]} = errors_on(changeset)

  """
  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(atomize_key(key), key) |> to_string()
      end)
    end)
  end

  defp atomize_key(key) do
    String.to_existing_atom(key)
  rescue
    ArgumentError -> key
  end
end

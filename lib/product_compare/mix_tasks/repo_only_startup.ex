defmodule ProductCompare.MixTasks.RepoOnlyStartup do
  @moduledoc false

  alias ProductCompare.Repo

  def start! do
    Mix.Task.run("app.config")

    ensure_started!(:postgrex)
    ensure_started!(:ecto_sql)

    case Process.whereis(Repo) do
      nil ->
        {:ok, _pid} = Repo.start_link()
        maybe_enable_sandbox_auto()
        :ok

      _pid ->
        :ok
    end
  end

  defp ensure_started!(application) do
    case Application.ensure_all_started(application) do
      {:ok, _started} ->
        :ok

      {:error, {_application, reason}} ->
        Mix.raise("failed to start #{application}: #{inspect(reason)}")
    end
  end

  defp maybe_enable_sandbox_auto do
    if Mix.env() == :test do
      Ecto.Adapters.SQL.Sandbox.mode(Repo, :auto)
    end
  end
end

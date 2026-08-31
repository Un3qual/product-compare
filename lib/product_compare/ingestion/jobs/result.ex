defmodule ProductCompare.Ingestion.Jobs.Result do
  @moduledoc false

  @spec run((-> term())) :: :ok | {:cancel, String.t()} | {:error, String.t()}
  def run(fun) do
    fun.()
    |> classify()
  rescue
    _exception -> {:error, "runner_exception"}
  catch
    _kind, _reason -> {:error, "runner_exception"}
  end

  defp classify({:ok, _report}), do: :ok
  defp classify(:ok), do: :ok
  defp classify({:error, {:missing_env, _name}}), do: {:cancel, "configuration_error"}
  defp classify({:error, :missing_credentials}), do: {:cancel, "configuration_error"}

  defp classify({:error, {:authentication_failed, _reason}}),
    do: {:cancel, "authentication_error"}

  defp classify({:error, {:authorization_failed, _reason}}), do: {:cancel, "authorization_error"}
  defp classify({:error, _reason}), do: {:error, "transient_provider_failure"}
  defp classify(_unexpected), do: {:error, "unexpected_runner_result"}
end

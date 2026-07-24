defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns.ValueFormatter do
  @moduledoc false

  @spec format(term()) :: String.t()
  def format(nil), do: ""
  def format(%DateTime{} = value), do: DateTime.to_iso8601(value)
  def format(value) when is_boolean(value), do: to_string(value)
  def format(value) when is_integer(value), do: Integer.to_string(value)
  def format(value) when is_binary(value), do: String.replace(value, ~r/[\r\n]+/, " ")
  def format(value), do: to_string(value)
end

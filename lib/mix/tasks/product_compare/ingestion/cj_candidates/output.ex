defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Output do
  @moduledoc false

  @spec format_value(term()) :: String.t()
  def format_value(nil), do: ""
  def format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  def format_value(value) when is_boolean(value), do: to_string(value)
  def format_value(value) when is_integer(value), do: Integer.to_string(value)

  def format_value(value) when is_binary(value) do
    if String.match?(value, ~r/\s/) do
      inspect(value)
    else
      value
    end
  end

  def format_value(value), do: to_string(value)

  @spec format_markdown_cell(term()) :: String.t()
  def format_markdown_cell(nil), do: ""
  def format_markdown_cell(value) when is_integer(value), do: Integer.to_string(value)

  def format_markdown_cell(value) when is_binary(value) do
    value
    |> String.replace(~r/[\r\n]+/, " ")
    |> String.replace("|", "\\|")
  end

  def format_markdown_cell(value), do: to_string(value)
end

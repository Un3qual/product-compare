defmodule ProductCompare.Ingestion.CJFailureDiagnostics do
  @moduledoc false

  @spec category(term()) :: String.t()
  def category(%{__exception__: true, __struct__: module}) when is_atom(module),
    do: inspect(module)

  def category(reason) when is_tuple(reason) and tuple_size(reason) > 0 do
    case elem(reason, 0) do
      tag when is_atom(tag) -> Atom.to_string(tag)
      _tag -> "tuple"
    end
  end

  def category(reason) when is_atom(reason), do: Atom.to_string(reason)
  def category(reason) when is_binary(reason), do: "binary"
  def category(reason) when is_list(reason), do: "list"
  def category(reason) when is_map(reason), do: "map"
  def category(_reason), do: "term"

  @spec sanitize_stacktrace(Exception.stacktrace()) :: Exception.stacktrace()
  def sanitize_stacktrace(stacktrace) when is_list(stacktrace) do
    Enum.flat_map(stacktrace, fn
      {module, function, args, location}
      when is_atom(module) and is_atom(function) and is_list(args) ->
        [{module, function, length(args), sanitize_location(location)}]

      {module, function, arity, location}
      when is_atom(module) and is_atom(function) and is_integer(arity) and arity >= 0 ->
        [{module, function, arity, sanitize_location(location)}]

      _entry ->
        []
    end)
  end

  def sanitize_stacktrace(_stacktrace), do: []

  defp sanitize_location(location) when is_list(location) do
    location
    |> Enum.reduce([], fn
      {:file, file}, sanitized when is_binary(file) or is_list(file) ->
        Keyword.put_new(sanitized, :file, file)

      {:line, line}, sanitized when is_integer(line) and line > 0 ->
        Keyword.put_new(sanitized, :line, line)

      _entry, sanitized ->
        sanitized
    end)
    |> Enum.reverse()
  end

  defp sanitize_location(_location), do: []
end

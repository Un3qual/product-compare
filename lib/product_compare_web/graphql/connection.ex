defmodule ProductCompareWeb.GraphQL.Connection do
  @moduledoc false

  import Ecto.Query

  @default_page_size 50
  @max_page_size 100
  @cursor_prefix "cursor:"

  @spec from_list([term()], map()) :: {:ok, map()} | {:error, :invalid_cursor}
  def from_list(items, args) when is_list(items) and is_map(args) do
    first = args |> fetch_arg(:first, @default_page_size) |> normalize_page_size()

    with {:ok, start_index} <- args |> fetch_arg(:after, nil) |> decode_start_index() do
      total_count = length(items)

      page_items =
        items
        |> Enum.drop(start_index)
        |> Enum.take(first)

      edges =
        page_items
        |> Enum.with_index(start_index)
        |> Enum.map(fn {node, absolute_index} ->
          %{
            cursor: encode_cursor(absolute_index),
            node: node
          }
        end)

      {:ok,
       %{
         edges: edges,
         page_info: %{
           has_next_page: total_count > start_index + length(edges),
           has_previous_page: start_index > 0,
           start_cursor: edge_cursor(List.first(edges)),
           end_cursor: edge_cursor(List.last(edges))
         }
       }}
    end
  end

  @spec from_query(Ecto.Query.t(), map(), module()) :: {:ok, map()} | {:error, :invalid_cursor}
  def from_query(%Ecto.Query{} = query, args, repo)
      when is_map(args) and is_atom(repo) do
    first = args |> fetch_arg(:first, @default_page_size) |> normalize_page_size()

    with {:ok, start_index} <- args |> fetch_arg(:after, nil) |> decode_start_index() do
      fetch_limit = first + 1

      query_rows =
        query
        |> offset(^start_index)
        |> limit(^fetch_limit)
        |> repo.all()

      has_next_page = length(query_rows) > first
      page_items = Enum.take(query_rows, first)

      edges =
        page_items
        |> Enum.with_index(start_index)
        |> Enum.map(fn {node, absolute_index} ->
          %{
            cursor: encode_cursor(absolute_index),
            node: node
          }
        end)

      {:ok,
       %{
         edges: edges,
         page_info: %{
           has_next_page: has_next_page,
           has_previous_page: start_index > 0,
           start_cursor: edge_cursor(List.first(edges)),
           end_cursor: edge_cursor(List.last(edges))
         }
       }}
    end
  end

  defp edge_cursor(nil), do: nil
  defp edge_cursor(edge), do: edge.cursor

  defp fetch_arg(args, key, default),
    do: Map.get(args, key, Map.get(args, Atom.to_string(key), default))

  defp normalize_page_size(nil), do: @default_page_size

  defp normalize_page_size(value) when is_integer(value) and value >= 0,
    do: min(value, @max_page_size)

  defp normalize_page_size(_value), do: @default_page_size

  defp encode_cursor(index), do: Base.encode64(@cursor_prefix <> Integer.to_string(index))

  defp decode_start_index(nil), do: {:ok, 0}

  defp decode_start_index(cursor) when is_binary(cursor) do
    with {:ok, decoded_cursor} <- Base.decode64(cursor),
         true <- String.starts_with?(decoded_cursor, @cursor_prefix),
         index <- String.replace_prefix(decoded_cursor, @cursor_prefix, ""),
         {parsed_index, ""} <- Integer.parse(index),
         true <- parsed_index >= 0 do
      {:ok, parsed_index + 1}
    else
      _ -> {:error, :invalid_cursor}
    end
  end

  defp decode_start_index(_cursor), do: {:error, :invalid_cursor}
end

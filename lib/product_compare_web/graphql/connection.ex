defmodule ProductCompareWeb.GraphQL.Connection do
  @moduledoc false

  import Ecto.Query

  alias ProductCompareWeb.GraphQL.Input

  @default_page_size 50
  @max_page_size 100
  @cursor_prefix "cursor:"

  @type error_reason :: :invalid_cursor | :invalid_first

  @spec batch_window(map()) ::
          {:ok, %{offset: non_neg_integer(), fetch_limit: non_neg_integer()}}
          | {:error, error_reason()}
  def batch_window(args) when is_map(args) do
    with {:ok, first} <- normalize_first(args),
         {:ok, offset} <- args |> Input.fetch_value(:after) |> decode_start_index() do
      {:ok, %{offset: offset, fetch_limit: first + 1}}
    end
  end

  @spec from_list([term()], map()) :: {:ok, map()} | {:error, error_reason()}
  def from_list(items, args) when is_list(items) and is_map(args) do
    with {:ok, %{offset: offset, fetch_limit: fetch_limit}} <- batch_window(args) do
      first = fetch_limit - 1
      total_count = length(items)

      page_items =
        items
        |> Enum.drop(offset)
        |> Enum.take(first)

      {:ok, project_connection(page_items, offset, total_count > offset + length(page_items))}
    end
  end

  @spec from_query(Ecto.Query.t(), map(), module()) :: {:ok, map()} | {:error, error_reason()}
  def from_query(%Ecto.Query{} = query, args, repo)
      when is_map(args) and is_atom(repo) do
    with {:ok, %{offset: offset, fetch_limit: fetch_limit}} <- batch_window(args) do
      first = fetch_limit - 1

      query_rows =
        query
        |> offset(^offset)
        |> limit(^fetch_limit)
        |> repo.all()

      {:ok, project_connection(Enum.take(query_rows, first), offset, length(query_rows) > first)}
    end
  end

  @spec from_prefetched_page([term()], map()) :: {:ok, map()} | {:error, error_reason()}
  def from_prefetched_page(rows, args) when is_list(rows) and is_map(args) do
    with {:ok, %{offset: offset, fetch_limit: fetch_limit}} <- batch_window(args) do
      first = fetch_limit - 1

      {:ok, project_connection(Enum.take(rows, first), offset, length(rows) > first)}
    end
  end

  @spec from_query_result(Ecto.Query.t(), map(), module()) :: {:ok, map()} | {:error, String.t()}
  def from_query_result(%Ecto.Query{} = query, args, repo)
      when is_map(args) and is_atom(repo) do
    case from_query(query, args, repo) do
      {:ok, connection} -> {:ok, connection}
      {:error, :invalid_first} -> {:error, "invalid first"}
      {:error, :invalid_cursor} -> {:error, "invalid cursor"}
    end
  end

  defp edge_cursor(nil), do: nil
  defp edge_cursor(edge), do: edge.cursor

  defp project_connection(page_items, offset, has_next_page) do
    edges =
      page_items
      |> Enum.with_index(offset)
      |> Enum.map(fn {node, absolute_index} ->
        %{
          cursor: encode_cursor(absolute_index),
          node: node
        }
      end)

    %{
      edges: edges,
      page_info: %{
        has_next_page: has_next_page,
        has_previous_page: offset > 0,
        start_cursor: edge_cursor(List.first(edges)),
        end_cursor: edge_cursor(List.last(edges))
      }
    }
  end

  defp normalize_first(args) do
    args |> Input.fetch_value(:first, @default_page_size) |> normalize_page_size()
  end

  defp normalize_page_size(nil), do: {:ok, @default_page_size}

  defp normalize_page_size(value) when is_integer(value) and value >= 0,
    do: {:ok, min(value, @max_page_size)}

  defp normalize_page_size(_value), do: {:error, :invalid_first}

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

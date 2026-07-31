defmodule ProductCompareWeb.GraphQL.Connection do
  @moduledoc false

  alias Absinthe.Relay.Connection, as: RelayConnection
  alias ProductCompareWeb.GraphQL.Input

  @default_page_size 50
  @max_page_size 100
  @max_bigint 9_223_372_036_854_775_807

  @type error_reason :: :invalid_cursor | :invalid_first
  @type batch_window :: %{offset: non_neg_integer(), fetch_limit: non_neg_integer()}

  @spec batch_window(map()) :: {:ok, batch_window()} | {:error, error_reason()}
  def batch_window(args) when is_map(args) do
    with {:ok, relay_args} <- relay_args(args),
         {:ok, :forward, first} <- RelayConnection.limit(relay_args, @max_page_size),
         {:ok, offset} <- RelayConnection.offset(relay_args),
         fetch_limit = first + 1,
         offset = offset || 0,
         true <- offset <= @max_bigint - fetch_limit do
      {:ok, %{offset: offset, fetch_limit: fetch_limit}}
    else
      {:error, :invalid_first} -> {:error, :invalid_first}
      {:error, _reason} -> {:error, :invalid_cursor}
      false -> {:error, :invalid_cursor}
    end
  end

  @spec batch_window_result(map()) :: {:ok, batch_window()} | {:error, String.t()}
  def batch_window_result(args) when is_map(args) do
    args
    |> batch_window()
    |> to_resolver_result()
  end

  @spec from_list([term()], map()) :: {:ok, map()} | {:error, error_reason()}
  def from_list(items, args) when is_list(items) and is_map(args) do
    with {:ok, relay_args} <- relay_args(args),
         {:ok, connection} <- RelayConnection.from_list(items, relay_args, max: @max_page_size) do
      {:ok, connection}
    else
      {:error, :invalid_first} -> {:error, :invalid_first}
      {:error, _reason} -> {:error, :invalid_cursor}
    end
  end

  @spec from_query(Ecto.Query.t(), map(), module()) :: {:ok, map()} | {:error, error_reason()}
  def from_query(%Ecto.Query{} = query, args, repo)
      when is_map(args) and is_atom(repo) do
    with {:ok, relay_args} <- relay_args(args),
         {:ok, connection} <-
           RelayConnection.from_query(query, &repo.all/1, relay_args, max: @max_page_size) do
      {:ok, connection}
    else
      {:error, :invalid_first} -> {:error, :invalid_first}
      {:error, _reason} -> {:error, :invalid_cursor}
    end
  end

  @spec from_prefetched_page([term()], map()) :: {:ok, map()} | {:error, error_reason()}
  def from_prefetched_page(rows, args) when is_list(rows) and is_map(args) do
    with {:ok, %{offset: offset, fetch_limit: fetch_limit}} <- batch_window(args) do
      first = fetch_limit - 1

      RelayConnection.from_slice(Enum.take(rows, first), offset,
        has_previous_page: offset > 0,
        has_next_page: length(rows) > first
      )
    end
  end

  @spec from_query_result(Ecto.Query.t(), map(), module()) :: {:ok, map()} | {:error, String.t()}
  def from_query_result(%Ecto.Query{} = query, args, repo)
      when is_map(args) and is_atom(repo) do
    query
    |> from_query(args, repo)
    |> to_resolver_result()
  end

  defp to_resolver_result({:ok, result}), do: {:ok, result}
  defp to_resolver_result({:error, :invalid_first}), do: {:error, "invalid first"}
  defp to_resolver_result({:error, :invalid_cursor}), do: {:error, "invalid cursor"}

  defp relay_args(args) do
    with {:ok, first} <-
           args |> Input.fetch_value(:first, @default_page_size) |> normalize_page_size(),
         {:ok, after_cursor} <- args |> Input.fetch_value(:after) |> normalize_after_cursor() do
      {:ok, %{first: first, after: after_cursor}}
    end
  end

  defp normalize_after_cursor(nil), do: {:ok, nil}

  defp normalize_after_cursor(cursor) when is_binary(cursor) do
    with {:ok, offset}
         when is_integer(offset) and offset >= 0 and offset <= @max_bigint - 1 <-
           RelayConnection.cursor_to_offset(cursor),
         ^cursor <- RelayConnection.offset_to_cursor(offset) do
      {:ok, cursor}
    else
      _ -> {:error, :invalid_cursor}
    end
  end

  defp normalize_after_cursor(_cursor), do: {:error, :invalid_cursor}

  defp normalize_page_size(nil), do: {:ok, @default_page_size}

  defp normalize_page_size(value) when is_integer(value) and value >= 0,
    do: {:ok, min(value, @max_page_size)}

  defp normalize_page_size(_value), do: {:error, :invalid_first}
end

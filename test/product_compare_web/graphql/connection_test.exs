defmodule ProductCompareWeb.GraphQL.ConnectionTest do
  use ExUnit.Case, async: true

  import Ecto.Query

  alias Absinthe.Relay.Connection, as: RelayConnection
  alias ProductCompareWeb.GraphQL.Connection

  @invalid_after_cursors [
    {"negative offset", "YXJyYXljb25uZWN0aW9uOi0x"},
    {"trailing junk", "YXJyYXljb25uZWN0aW9uOjBqdW5r"},
    {"offset whose successor exceeds bigint", "YXJyYXljb25uZWN0aW9uOjkyMjMzNzIwMzY4NTQ3NzU4MDc="}
  ]

  defmodule FakeRepo do
    @moduledoc false

    def all(_query), do: []
  end

  describe "from_list/2" do
    test "uses the default page size when first is absent" do
      items = Enum.to_list(1..60)

      assert {:ok, connection} = Connection.from_list(items, %{})

      assert Enum.map(connection.edges, & &1.node) == Enum.to_list(1..50)
      assert connection.page_info.has_next_page
    end

    test "clamps oversized first values to the max page size" do
      items = Enum.to_list(1..120)

      assert {:ok, connection} = Connection.from_list(items, %{first: 200})

      assert Enum.map(connection.edges, & &1.node) == Enum.to_list(1..100)
      assert connection.page_info.has_next_page
    end

    test "allows first zero without falling back to the default page size" do
      assert {:ok, connection} = Connection.from_list([:first, :second], %{first: 0})

      assert connection.edges == []
      assert connection.page_info.has_next_page
      refute connection.page_info.has_previous_page
      assert connection.page_info.start_cursor == nil
      assert connection.page_info.end_cursor == nil
    end

    test "reads string-key pagination args" do
      assert {:ok, connection} = Connection.from_list([:first, :second, :third], %{"first" => 2})

      assert Enum.map(connection.edges, & &1.node) == [:first, :second]
      assert connection.page_info.has_next_page
      refute connection.page_info.has_previous_page

      assert {:ok, 0} =
               connection.edges
               |> List.first()
               |> Map.fetch!(:cursor)
               |> RelayConnection.cursor_to_offset()

      assert {:ok, 1} =
               connection.edges
               |> List.last()
               |> Map.fetch!(:cursor)
               |> RelayConnection.cursor_to_offset()

      assert connection.page_info.start_cursor ==
               connection.edges |> List.first() |> Map.fetch!(:cursor)

      assert connection.page_info.end_cursor ==
               connection.edges |> List.last() |> Map.fetch!(:cursor)
    end

    test "prefers atom-key pagination args over string-key args" do
      assert {:ok, connection} =
               Connection.from_list([:first, :second, :third], %{"first" => 1, first: 2})

      assert Enum.map(connection.edges, & &1.node) == [:first, :second]
    end

    test "reads string-key after cursors" do
      assert {:ok, first_page} = Connection.from_list([:first, :second, :third], %{first: 1})

      first_cursor = first_page.page_info.end_cursor

      assert {:ok, second_page} =
               Connection.from_list([:first, :second, :third], %{
                 "after" => first_cursor,
                 "first" => 1
               })

      assert Enum.map(second_page.edges, & &1.node) == [:second]
      assert second_page.page_info.has_next_page
      assert second_page.page_info.has_previous_page
    end

    test "rejects malformed cursors" do
      assert Connection.from_list([:first], %{"after" => "not-a-valid-cursor"}) ==
               {:error, :invalid_cursor}
    end

    for {case_name, cursor} <- @invalid_after_cursors do
      test "rejects #{case_name} cursor" do
        cursor = unquote(cursor)

        assert Connection.from_list([:first, :second], %{first: 1, after: cursor}) ==
                 {:error, :invalid_cursor}
      end
    end

    test "rejects invalid first values" do
      assert Connection.from_list([:first], %{first: -1}) == {:error, :invalid_first}
      assert Connection.from_list([:first], %{"first" => -1}) == {:error, :invalid_first}
      assert Connection.from_list([:first], %{"first" => "1"}) == {:error, :invalid_first}
    end
  end

  describe "from_query/3" do
    for {case_name, cursor} <- @invalid_after_cursors do
      test "rejects #{case_name} cursor" do
        query = from(product in "products", select: product.id)
        cursor = unquote(cursor)

        assert Connection.from_query(query, %{first: 1, after: cursor}, FakeRepo) ==
                 {:error, :invalid_cursor}
      end
    end
  end

  describe "from_query_result/3" do
    test "maps malformed cursors to resolver errors" do
      query = from(product in "products", select: product.id)

      assert Connection.from_query_result(
               query,
               %{"after" => "not-a-valid-cursor"},
               ProductCompare.Repo
             ) ==
               {:error, "invalid cursor"}
    end

    test "maps invalid first values to resolver errors" do
      query = from(product in "products", select: product.id)

      assert Connection.from_query_result(query, %{"first" => -1}, FakeRepo) ==
               {:error, "invalid first"}
    end
  end

  describe "batch_window_result/1" do
    test "returns the batch window with resolver-friendly validation errors" do
      assert Connection.batch_window_result(%{first: 2}) ==
               {:ok, %{offset: 0, fetch_limit: 3}}

      assert Connection.batch_window_result(%{first: -1}) == {:error, "invalid first"}

      assert Connection.batch_window_result(%{after: "not-a-valid-cursor"}) ==
               {:error, "invalid cursor"}
    end
  end

  describe "batch_window/1 and from_prefetched_page/2" do
    for {case_name, cursor} <- @invalid_after_cursors do
      test "reject #{case_name} cursor" do
        cursor = unquote(cursor)
        args = %{first: 1, after: cursor}

        assert Connection.batch_window(args) == {:error, :invalid_cursor}

        assert Connection.from_prefetched_page([:first, :second], args) ==
                 {:error, :invalid_cursor}
      end
    end

    test "accept the largest cursor whose successor fits a PostgreSQL bigint" do
      cursor = "YXJyYXljb25uZWN0aW9uOjkyMjMzNzIwMzY4NTQ3NzU4MDY="

      assert Connection.batch_window(%{first: 1, after: cursor}) ==
               {:ok, %{offset: 9_223_372_036_854_775_807, fetch_limit: 2}}
    end
  end
end

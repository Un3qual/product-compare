defmodule ProductCompareWeb.GraphQL.ConnectionTest do
  use ExUnit.Case, async: true

  import Ecto.Query

  alias ProductCompareWeb.GraphQL.Connection

  describe "from_list/2" do
    test "reads string-key pagination args" do
      assert {:ok, connection} = Connection.from_list([:first, :second, :third], %{"first" => 2})

      assert Enum.map(connection.edges, & &1.node) == [:first, :second]
      assert connection.page_info.has_next_page
      refute connection.page_info.has_previous_page

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
  end
end

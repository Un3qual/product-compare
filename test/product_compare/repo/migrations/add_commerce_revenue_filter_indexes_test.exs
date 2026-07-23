defmodule ProductCompare.Repo.Migrations.AddCommerceRevenueFilterIndexesTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Repo

  @expected_indexes ~w(
    commerce_click_sessions_inserted_at_idx
    commerce_conversions_revenue_currency_idx
    commerce_conversions_revenue_product_idx
    commerce_conversions_revenue_time_idx
    commerce_links_network_idx
  )

  test "installs the missing revenue dashboard filter indexes" do
    actual_indexes =
      Repo.query!(
        """
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = ANY($1)
        ORDER BY indexname
        """,
        [@expected_indexes]
      ).rows
      |> List.flatten()

    assert actual_indexes == Enum.sort(@expected_indexes)
  end
end

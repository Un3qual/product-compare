Process.put(
  :product_compare_test_database_process_guard,
  ProductCompare.TestDatabaseProcessGuard.acquire!(ProductCompare.Repo)
)

ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(ProductCompare.Repo, :manual)

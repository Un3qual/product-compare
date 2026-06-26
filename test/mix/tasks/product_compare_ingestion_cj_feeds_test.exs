defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeedsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjFeeds

  setup do
    original_runner = Application.get_env(:product_compare, :cj_feed_discovery_runner)

    on_exit(fn ->
      if is_nil(original_runner) do
        Application.delete_env(:product_compare, :cj_feed_discovery_runner)
      else
        Application.put_env(:product_compare, :cj_feed_discovery_runner, original_runner)
      end
    end)

    :ok
  end

  describe "run/1" do
    test "parses CLI options, calls the runner, and prints the report" do
      parent = self()

      Application.put_env(:product_compare, :cj_feed_discovery_runner, fn opts ->
        send(parent, {:runner_opts, opts})

        {:ok,
         %{
           candidates_persisted: 2,
           failed: 0,
           feeds_fetched: 3,
           pages_fetched: 2
         }}
      end)

      output =
        capture_io(fn ->
          assert :ok =
                   CjFeeds.run([
                     "--advertiser-country",
                     "CA",
                     "--limit",
                     "10",
                     "--offset",
                     "20",
                     "--pages",
                     "3"
                   ])
        end)

      assert_receive {:runner_opts, opts}
      assert opts[:advertiser_country] == "CA"
      assert opts[:limit] == 10
      assert opts[:cursor] == 20
      assert opts[:pages] == 3

      assert output =~ "feeds_fetched=3 candidates_persisted=2 pages_fetched=2 failed=0"
    end

    test "uses manual discovery defaults when CLI options are omitted" do
      parent = self()

      Application.put_env(:product_compare, :cj_feed_discovery_runner, fn opts ->
        send(parent, {:runner_opts, opts})

        {:ok,
         %{
           candidates_persisted: 0,
           failed: 0,
           feeds_fetched: 0,
           pages_fetched: 0
         }}
      end)

      capture_io(fn -> assert :ok = CjFeeds.run([]) end)

      assert_receive {:runner_opts, opts}
      assert opts[:advertiser_country] == "US"
      assert opts[:limit] == 25
      assert opts[:cursor] == nil
      assert opts[:pages] == 1
    end

    test "raises with existing failure wording when the runner fails" do
      Application.put_env(:product_compare, :cj_feed_discovery_runner, fn _opts ->
        {:error, {:missing_env, "CJ_API_TOKEN"}}
      end)

      assert_raise Mix.Error,
                   "CJ feed discovery failed: {:missing_env, \"CJ_API_TOKEN\"}",
                   fn ->
                     capture_io(fn ->
                       CjFeeds.run(["--advertiser-country", "US"])
                     end)
                   end
    end

    test "prints the report before raising on row failures" do
      report = %{
        candidates_persisted: 0,
        failed: 1,
        feeds_fetched: 1,
        pages_fetched: 1
      }

      Application.put_env(:product_compare, :cj_feed_discovery_runner, fn _opts ->
        {:error, {:row_failures, report}}
      end)

      output =
        capture_io(fn ->
          error = assert_raise Mix.Error, fn -> CjFeeds.run([]) end

          assert error.message =~ "CJ feed discovery failed: {:row_failures,"
        end)

      assert output =~ "feeds_fetched=1 candidates_persisted=0 pages_fetched=1 failed=1"
    end
  end
end

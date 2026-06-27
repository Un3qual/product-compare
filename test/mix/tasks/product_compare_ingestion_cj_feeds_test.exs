defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeedsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjFeeds
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  setup do
    original_runner = Application.get_env(:product_compare, :cj_feed_discovery_runner)
    original_api_token = System.get_env("CJ_API_TOKEN")
    original_account_id = System.get_env("CJ_ACCOUNT_ID")

    on_exit(fn ->
      if is_nil(original_runner) do
        Application.delete_env(:product_compare, :cj_feed_discovery_runner)
      else
        Application.put_env(:product_compare, :cj_feed_discovery_runner, original_runner)
      end

      restore_env("CJ_API_TOKEN", original_api_token)
      restore_env("CJ_ACCOUNT_ID", original_account_id)
    end)

    :ok
  end

  describe "run_discovery/1 credential preflight" do
    test "reports missing credentials without calling the discovery runner" do
      System.delete_env("CJ_API_TOKEN")
      System.delete_env("CJ_ACCOUNT_ID")

      flunking_runner = fn _opts ->
        flunk("credential preflight must not call the discovery runner")
      end

      assert {:ok,
              %{
                provider: "cj",
                surface: "shoppingProductFeeds",
                ready: false,
                missing_required: ["CJ_API_TOKEN", "CJ_ACCOUNT_ID"]
              }} =
               CjFeeds.run_discovery(
                 check_credentials: true,
                 api_token: "",
                 company_id: " ",
                 runner: flunking_runner
               )
    end

    test "reports ready when credentials are injected" do
      System.delete_env("CJ_API_TOKEN")
      System.delete_env("CJ_ACCOUNT_ID")

      flunking_runner = fn _opts ->
        flunk("credential preflight must not call the discovery runner")
      end

      assert {:ok,
              %{
                provider: "cj",
                surface: "shoppingProductFeeds",
                ready: true,
                missing_required: []
              }} =
               CjFeeds.run_discovery(
                 check_credentials: true,
                 api_token: "secret-token",
                 company_id: "1234567",
                 runner: flunking_runner
               )
    end
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

    test "credential preflight does not call configured runner or persist rows" do
      parent = self()
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      Application.put_env(:product_compare, :cj_feed_discovery_runner, fn _opts ->
        send(parent, :runner_called)
        {:error, :unexpected_runner_call}
      end)

      output =
        capture_io(fn ->
          assert :ok = CjFeeds.run(["--check-credentials"])
        end)

      refute_receive :runner_called
      assert Repo.aggregate(ImportRun, :count, :id) == 0
      assert Repo.aggregate(MerchantFeedCandidate, :count, :id) == 0

      assert output =~ "provider=cj"
      assert output =~ "surface=shoppingProductFeeds"
      assert output =~ "ready=true"
      refute output =~ "secret-token"
      refute output =~ "1234567"
    end

    test "credential preflight raises when readiness is required and credentials are missing" do
      System.delete_env("CJ_API_TOKEN")
      System.delete_env("CJ_ACCOUNT_ID")

      assert_raise Mix.Error,
                   "missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID",
                   fn ->
                     capture_io(fn ->
                       CjFeeds.run(["--check-credentials", "--require-ready"])
                     end)
                   end
    end
  end

  defp restore_env(name, nil), do: System.delete_env(name)
  defp restore_env(name, value), do: System.put_env(name, value)
end

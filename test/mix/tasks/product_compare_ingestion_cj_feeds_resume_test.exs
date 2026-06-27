defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeedsResumeTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjFeedsResume
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run_resume/1" do
    test "resumes the latest successful CJ feed discovery cursor with an injected runner" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: seconds_ago(20),
        finished_at: seconds_ago(10),
        cursor_end: 999
      })

      insert_run!(source, %{
        status: "failed",
        started_at: seconds_ago(15),
        finished_at: seconds_ago(8),
        cursor_end: 700
      })

      insert_run!(source, %{
        status: "succeeded",
        started_at: seconds_ago(40),
        finished_at: seconds_ago(30),
        cursor_end: 20,
        page_size: 50
      })

      insert_run!(source, %{
        status: "succeeded",
        started_at: seconds_ago(5),
        finished_at: seconds_ago(2),
        cursor_end: 80,
        page_size: 25,
        query: %{
          "advertiserCountry" => "US",
          "apiToken" => "seeded-token",
          "accountId" => "1234567",
          "tracking" => "aff_sub"
        },
        error_summary: "raw provider payload marker"
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})

        {:ok,
         %{
           feeds_fetched: 4,
           candidates_persisted: 4,
           failed: 0,
           next_cursor: 84,
           raw_payload: "raw provider payload marker",
           account_id: "1234567",
           token: "seeded-token",
           tracking: "aff_sub"
         }}
      end

      output =
        capture_io(fn ->
          assert :ok = CjFeedsResume.run_resume(runner: runner, pages: 3)
        end)

      assert_receive {:runner_opts, opts}
      assert opts[:cursor] == 80
      assert opts[:advertiser_country] == "US"
      assert opts[:limit] == 25
      assert opts[:pages] == 3

      assert output =~
               "provider=cj surface=shoppingProductFeeds cursor_start=80 pages_requested=3 limit=25 feeds_fetched=4 candidates_persisted=4 failed=0 next_cursor=84"

      refute output =~ "seeded-token"
      refute output =~ "1234567"
      refute output =~ "aff_sub"
      refute output =~ "raw provider payload marker"
      refute output =~ "raw_payload"
      refute output =~ "account_id"
      refute output =~ "token"
      refute output =~ "tracking"
    end

    test "uses explicit limit override and defaults missing advertiser country to US" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        cursor_end: 120,
        page_size: 50,
        query: %{}
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})

        {:ok,
         %{
           feeds_fetched: 1,
           candidates_persisted: 1,
           failed: 0,
           next_cursor: 121
         }}
      end

      output =
        capture_io(fn ->
          assert :ok = CjFeedsResume.run_resume(runner: runner, limit: 10)
        end)

      assert_receive {:runner_opts, opts}
      assert opts[:cursor] == 120
      assert opts[:advertiser_country] == "US"
      assert opts[:limit] == 10
      assert opts[:pages] == 1
      assert output =~ "cursor_start=120"
      assert output =~ "pages_requested=1"
      assert output =~ "limit=10"
    end

    test "raises when require_cursor is true and the latest success has no cursor" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: seconds_ago(20),
        finished_at: seconds_ago(15),
        cursor_end: 80
      })

      insert_run!(source, %{
        status: "succeeded",
        started_at: seconds_ago(5),
        finished_at: seconds_ago(2),
        cursor_end: nil
      })

      runner = fn _opts -> flunk("runner must not be called without a required cursor") end

      assert_raise Mix.Error,
                   "latest successful CJ feed discovery has no cursor to resume",
                   fn ->
                     capture_io(fn ->
                       CjFeedsResume.run_resume(runner: runner, require_cursor: true)
                     end)
                   end
    end

    test "prints resumable false and skips the runner when cursor is absent but optional" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        cursor_end: nil
      })

      runner = fn _opts -> flunk("runner must not be called without a cursor") end

      output =
        capture_io(fn ->
          assert :ok = CjFeedsResume.run_resume(runner: runner)
        end)

      assert output =~ "provider=cj surface=shoppingProductFeeds resumable=false"
    end

    test "raises when there is no successful CJ feed discovery run" do
      source = source_fixture()

      insert_run!(source, %{status: "failed", cursor_end: 80})
      insert_run!(source, %{surface: "shoppingProducts", status: "succeeded", cursor_end: 90})
      insert_run!(source, %{provider: "amazon", status: "succeeded", cursor_end: 100})

      runner = fn _opts ->
        flunk("runner must not be called without a successful discovery run")
      end

      assert_raise Mix.Error, "no successful CJ feed discovery run found", fn ->
        capture_io(fn -> CjFeedsResume.run_resume(runner: runner) end)
      end
    end

    test "raises sanitized failure when the runner fails" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        cursor_end: 80
      })

      runner = fn _opts ->
        {:error, {:missing_env, "CJ_API_TOKEN", account_id: "1234567", tracking: "aff_sub"}}
      end

      error =
        assert_raise Mix.Error, fn ->
          capture_io(fn -> CjFeedsResume.run_resume(runner: runner) end)
        end

      assert error.message == "CJ feed discovery resume failed"
      refute error.message =~ "CJ_API_TOKEN"
      refute error.message =~ "1234567"
      refute error.message =~ "aff_sub"
      refute error.message =~ "missing_env"
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp insert_run!(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProductFeeds",
          query: %{"advertiserCountry" => "US"},
          status: "succeeded",
          started_at: seconds_ago(60),
          finished_at: seconds_ago(30),
          cursor_start: 0,
          cursor_end: 80,
          page_size: 25,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 4,
          records_normalized: 4,
          records_persisted: 4,
          records_failed: 0,
          error_summary: nil
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp seconds_ago(seconds) do
    DateTime.utc_now()
    |> DateTime.add(-seconds, :second)
    |> DateTime.truncate(:microsecond)
  end
end

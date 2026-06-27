defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportResumeTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImportResume
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run_resume/1" do
    test "resumes from the latest successful shoppingProducts cursor" do
      source = source_fixture()

      insert_run!(source, %{
        query: %{
          "keywords" => ["old shoe"],
          "currency" => "EUR",
          "serviceableAreas" => ["CA"]
        },
        cursor_end: 50,
        page_size: 10,
        started_at: minutes_ago(40),
        finished_at: minutes_ago(39)
      })

      latest_success =
        insert_run!(source, %{
          query: %{
            "keywords" => ["shoe"],
            "currency" => "USD",
            "serviceableAreas" => ["US"],
            "tokenMarker" => "CJ_API_TOKEN=secret-token-marker",
            "accountMarker" => "accountId=123456789",
            "trackingMarker" => "aff_sub=tracking-marker&utm_campaign=secret"
          },
          cursor_end: 100,
          page_size: 25,
          started_at: minutes_ago(20),
          finished_at: minutes_ago(19)
        })

      insert_run!(source, %{
        status: "failed",
        query: %{"keywords" => ["newer failed shoe"]},
        cursor_end: 999,
        page_size: 99,
        records_failed: 1,
        started_at: minutes_ago(10),
        finished_at: minutes_ago(9),
        error_summary: ~s({"rawProviderPayload":"leak","accountId":"123456789"})
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})

        {:ok,
         %{
           failed: 0,
           fetched: 3,
           normalized: 3,
           persisted: 3,
           next_cursor: 125,
           raw_provider_payload: ~s({"rawProviderPayload":"secret"}),
           raw_error: "CJ_API_TOKEN=secret-token-marker accountId=123456789 aff_sub=tracking"
         }}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{next_cursor: 125}} = CjImportResume.run_resume(runner: runner, pages: 2)
        end)

      assert_receive {:runner_opts, opts}

      assert opts[:cursor] == latest_success.cursor_end
      assert opts[:keywords] == ["shoe"]
      assert opts[:currency] == "USD"
      assert opts[:serviceable_areas] == ["US"]
      assert opts[:limit] == 25
      assert opts[:pages] == 2
      assert opts[:print_report] == false

      assert output ==
               "provider=cj surface=shoppingProducts cursor_start=100 pages_requested=2 limit=25 fetched=3 normalized=3 persisted=3 failed=0 next_cursor=125\n"

      refute output =~ "old shoe"
      refute output =~ "newer failed shoe"
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "secret-token-marker"
      refute output =~ "accountId"
      refute output =~ "123456789"
      refute output =~ "aff_sub"
      refute output =~ "utm_campaign"
      refute output =~ "rawProviderPayload"
    end

    test "uses query defaults and an explicit positive limit override" do
      source = source_fixture()

      insert_run!(source, %{
        query: %{},
        cursor_end: 200,
        page_size: 25,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})
        {:ok, %{failed: 0, fetched: 1, normalized: 1, persisted: 1, next_cursor: 205}}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{next_cursor: 205}} =
                   CjImportResume.run_resume(runner: runner, limit: 5)
        end)

      assert_receive {:runner_opts, opts}

      assert opts[:cursor] == 200
      assert opts[:keywords] == ["shoe"]
      assert opts[:currency] == "USD"
      assert opts[:serviceable_areas] == ["US"]
      assert opts[:limit] == 5
      assert opts[:pages] == 1
      assert opts[:print_report] == false

      assert output =~ "limit=5"
      assert output =~ "pages_requested=1"
    end

    test "prints non-resumable output without calling the runner when cursor is absent" do
      source = source_fixture()

      insert_run!(source, %{
        cursor_end: nil,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      runner = fn _opts -> flunk("runner must not be called without a resume cursor") end

      output =
        capture_io(fn ->
          assert {:error, :no_resume_cursor} = CjImportResume.run_resume(runner: runner)
        end)

      assert output == "provider=cj surface=shoppingProducts resumable=false\n"
    end

    test "raises when cursor is absent and require_cursor is true" do
      source = source_fixture()

      insert_run!(source, %{
        cursor_end: nil,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      assert_raise Mix.Error, "latest successful CJ product import has no cursor to resume", fn ->
        capture_io(fn ->
          CjImportResume.run_resume(runner: flunking_runner(), require_cursor: true)
        end)
      end
    end

    test "raises when there is no successful CJ product import" do
      source = source_fixture()

      insert_run!(source, %{
        status: "failed",
        records_failed: 1,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      assert_raise Mix.Error, "no successful CJ product import found", fn ->
        capture_io(fn -> CjImportResume.run_resume(runner: flunking_runner()) end)
      end
    end

    test "raises a sanitized error when the runner fails" do
      source = source_fixture()

      insert_run!(source, %{
        cursor_end: 300,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      runner = fn _opts ->
        {:error,
         {:provider_error,
          "CJ_API_TOKEN=secret-token-marker accountId=123456789 rawProviderPayload"}}
      end

      assert_raise Mix.Error, "CJ product import resume failed", fn ->
        capture_io(fn -> CjImportResume.run_resume(runner: runner) end)
      end
    end

    test "raises a sanitized error when the runner returns an unexpected result" do
      source = source_fixture()

      insert_run!(source, %{
        cursor_end: 400,
        started_at: minutes_ago(2),
        finished_at: minutes_ago(1)
      })

      runner = fn _opts ->
        {:unexpected, "CJ_API_TOKEN=secret-token-marker rawProviderPayload"}
      end

      assert_raise Mix.Error, "CJ product import resume failed", fn ->
        capture_io(fn -> CjImportResume.run_resume(runner: runner) end)
      end
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = Ecto.UUID.generate()

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
          surface: "shoppingProducts",
          query: %{"keywords" => ["shoe"], "currency" => "USD", "serviceableAreas" => ["US"]},
          status: "succeeded",
          started_at: minutes_ago(5),
          finished_at: minutes_ago(4),
          cursor_start: 0,
          cursor_end: 100,
          page_size: 25,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 10,
          records_normalized: 10,
          records_persisted: 10,
          records_failed: 0
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp minutes_ago(minutes) do
    DateTime.utc_now()
    |> DateTime.add(-minutes, :minute)
    |> DateTime.truncate(:microsecond)
  end

  defp flunking_runner do
    fn _opts -> flunk("runner must not be called") end
  end
end

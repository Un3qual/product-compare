defmodule Mix.Tasks.ProductCompare.Ingestion.CjFailedRunsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjFailedRuns
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run/1" do
    test "prints failed CJ runs across both surfaces" do
      source = source_fixture()

      product_failed_run =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "failed",
          started_at: seconds_ago(60)
        })

      feed_failed_run =
        insert_run!(source, %{
          surface: "shoppingProductFeeds",
          status: "failed",
          started_at: seconds_ago(30)
        })

      _succeeded_cj_run =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "succeeded",
          started_at: seconds_ago(10)
        })

      _non_cj_failed_run =
        insert_run!(source, %{provider: "amazon", surface: "shoppingProducts", status: "failed"})

      output =
        capture_io(fn ->
          CjFailedRuns.run([])
        end)

      run_lines = output_lines(output) |> Enum.filter(&String.starts_with?(&1, "run_id="))

      lines = output_lines(output)

      assert Enum.at(lines, 0) =~ "provider=cj failed_count=2 surface=all"
      assert Enum.at(run_lines, 0) =~ "run_id=#{feed_failed_run.id}"
      assert Enum.at(run_lines, 1) =~ "run_id=#{product_failed_run.id}"
      assert output =~ "surface=shoppingProductFeeds"
      assert output =~ "surface=shoppingProducts"
      assert output =~ "run_id=#{feed_failed_run.id}"
      assert output =~ "run_id=#{product_failed_run.id}"
      refute output =~ "succeeded"
      refute output =~ "provider=amazon"
    end

    test "supports --surface shoppingProducts" do
      source = source_fixture()

      _feed_failed_run =
        insert_run!(source, %{
          surface: "shoppingProductFeeds",
          status: "failed",
          started_at: seconds_ago(20)
        })

      product_failed_run =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "failed",
          started_at: seconds_ago(10)
        })

      output =
        capture_io(fn ->
          CjFailedRuns.run(["--surface", "shoppingProducts"])
        end)

      run_lines = output_lines(output) |> Enum.filter(&String.starts_with?(&1, "run_id="))

      assert output_lines(output) |> Enum.at(0) =~
               "provider=cj failed_count=1 surface=shoppingProducts"

      assert Enum.at(run_lines, 0) =~ "run_id=#{product_failed_run.id}"
      refute output =~ "run_id=#{_feed_failed_run.id}"
    end

    test "supports --limit" do
      source = source_fixture()

      _older_run =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "failed",
          started_at: seconds_ago(60)
        })

      _newer_run =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "failed",
          started_at: seconds_ago(30)
        })

      output =
        capture_io(fn -> CjFailedRuns.run(["--surface", "shoppingProducts", "--limit", "1"]) end)

      lines = output_lines(output)

      assert length(lines) == 2
      assert Enum.at(lines, 0) =~ "provider=cj failed_count=2 surface=shoppingProducts"
      assert Enum.at(lines, 1) =~ "run_id="
    end

    test "rejects unsupported surface values" do
      assert_raise Mix.Error, "invalid surface: unknownSurface", fn ->
        capture_io(fn -> CjFailedRuns.run(["--surface", "unknownSurface"]) end)
      end
    end

    test "rejects invalid limit values" do
      assert_raise Mix.Error, "invalid --limit: expected a positive integer", fn ->
        capture_io(fn -> CjFailedRuns.run(["--limit", "0"]) end)
      end
    end

    test "supports --require-clean" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "failed",
        started_at: seconds_ago(10)
      })

      output =
        capture_io(fn ->
          assert_raise Mix.Error, "failed CJ ingestion runs found", fn ->
            CjFailedRuns.run(["--require-clean"])
          end
        end)

      assert output =~ "provider=cj failed_count=1 surface=all"
      assert output =~ "run_id="
    end

    test "prints zero failures" do
      output =
        capture_io(fn ->
          CjFailedRuns.run([])
        end)

      assert output =~ "provider=cj failed_count=0 surface=all"
      refute String.contains?(output, "run_id=")
    end

    test "redacts raw error summaries" do
      source = source_fixture()

      raw_error =
        "provider body=[{\"token\":\"abc123\",\"account_id\":\"acct-456\"}] tracking=tr-xyz CJ_API_TOKEN=super-secret"

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "failed",
        started_at: seconds_ago(10),
        error_summary: raw_error
      })

      output =
        capture_io(fn ->
          CjFailedRuns.run(["--surface", "shoppingProducts"])
        end)

      assert output =~ "error_summary=redacted"
      refute output =~ "provider body="
      refute output =~ "account_id"
      refute output =~ "token"
      refute output =~ "tracking"
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "abc123"
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
          surface: "shoppingProducts",
          query: %{"advertiserCountry" => "US"},
          status: "succeeded",
          started_at: DateTime.utc_now(),
          finished_at: DateTime.utc_now(),
          cursor_start: 0,
          cursor_end: 0,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 0,
          records_normalized: 0,
          records_persisted: 0,
          records_failed: 0,
          error_summary: nil
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp seconds_ago(seconds), do: DateTime.add(DateTime.utc_now(), -seconds, :second)

  defp output_lines(output) do
    output
    |> String.trim()
    |> String.split("\n")
  end
end

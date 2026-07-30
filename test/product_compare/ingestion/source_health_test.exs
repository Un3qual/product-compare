defmodule ProductCompare.Ingestion.SourceHealthTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion.SourceHealth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.SourceKind

  @now ~U[2026-06-27 18:00:00Z]

  describe "summary/2" do
    test "returns one safe aggregate row per source" do
      active_source =
        source_fixture(%{
          kind: "affiliate_feed",
          name: "Active affiliate feed",
          domain: "affiliate.example"
        })

      inactive_source =
        source_fixture(%{
          kind: "merchant_feed",
          name: "Dormant merchant feed",
          domain: "merchant.example"
        })

      insert_artifact(active_source,
        fetched_at: hours_ago(12),
        raw_json: %{"credential" => "do-not-return"},
        raw_text: "raw provider payload",
        url: "https://affiliate.example/products?tracking=secret"
      )

      insert_artifact(active_source,
        fetched_at: hours_ago(2),
        raw_json: %{"account_id" => "acct-123"},
        url: "https://affiliate.example/latest?token=secret"
      )

      insert_run(active_source,
        status: "failed",
        started_at: hours_ago(300),
        finished_at: hours_ago(299),
        query: %{"keywords" => ["old failure"], "accountId" => "acct-123"}
      )

      insert_run(active_source,
        status: "failed",
        started_at: hours_ago(8),
        finished_at: hours_ago(7),
        query: %{"keywords" => ["recent failure"], "tracking" => "secret"},
        error_summary: "provider payload leaked here"
      )

      insert_run(active_source,
        status: "succeeded",
        started_at: hours_ago(1),
        finished_at: @now,
        query: %{"keywords" => ["latest success"], "credential" => "secret"}
      )

      rows = SourceHealth.summary([], @now)

      rows_by_source_id = Map.new(rows, &{&1.source_id, &1})
      active_source_id = active_source.id
      inactive_source_id = inactive_source.id

      assert Map.has_key?(rows_by_source_id, active_source_id)
      assert Map.has_key?(rows_by_source_id, inactive_source_id)

      assert %{
               source_id: ^active_source_id,
               source_kind: "affiliate_feed",
               source_name: "Active affiliate feed",
               source_domain: "affiliate.example",
               artifact_count: 2,
               latest_artifact_fetched_at: latest_artifact_fetched_at,
               latest_import_run_status: "succeeded",
               latest_import_run_finished_at: latest_import_run_finished_at,
               recent_failed_run_count: 1
             } = Map.fetch!(rows_by_source_id, active_source_id)

      assert DateTime.compare(latest_artifact_fetched_at, hours_ago(2)) == :eq
      assert DateTime.compare(latest_import_run_finished_at, @now) == :eq

      assert %{
               source_id: ^inactive_source_id,
               source_kind: "merchant_feed",
               source_name: "Dormant merchant feed",
               source_domain: "merchant.example",
               artifact_count: 0,
               latest_artifact_fetched_at: nil,
               latest_import_run_status: nil,
               latest_import_run_finished_at: nil,
               recent_failed_run_count: 0
             } = Map.fetch!(rows_by_source_id, inactive_source_id)

      returned_keys = rows |> hd() |> Map.keys() |> MapSet.new()

      refute MapSet.member?(returned_keys, :raw_json)
      refute MapSet.member?(returned_keys, :raw_text)
      refute MapSet.member?(returned_keys, :url)
      refute MapSet.member?(returned_keys, :query)
      refute MapSet.member?(returned_keys, :credentials)
      refute MapSet.member?(returned_keys, :account_id)
      refute MapSet.member?(returned_keys, :tracking_params)
      refute MapSet.member?(returned_keys, :error_summary)
    end

    test "clamps the recent failure window to one through seven hundred twenty hours" do
      source = source_fixture()

      insert_run(source, status: "failed", started_at: hours_ago(3), finished_at: hours_ago(2))

      insert_run(source,
        status: "failed",
        started_at: hours_ago(601),
        finished_at: hours_ago(600)
      )

      rows_by_source_id =
        [recent_failure_hours: 0]
        |> SourceHealth.summary(@now)
        |> Map.new(&{&1.source_id, &1})

      assert %{recent_failed_run_count: 0} = Map.fetch!(rows_by_source_id, source.id)

      rows_by_source_id =
        [recent_failure_hours: 1_000]
        |> SourceHealth.summary(@now)
        |> Map.new(&{&1.source_id, &1})

      assert %{recent_failed_run_count: 2} = Map.fetch!(rows_by_source_id, source.id)
    end

    test "surfaces a running import run as the latest status" do
      source = source_fixture()

      insert_run(source,
        status: "succeeded",
        started_at: hours_ago(3),
        finished_at: hours_ago(2)
      )

      insert_run(source,
        status: "running",
        started_at: hours_ago(1),
        finished_at: nil
      )

      rows_by_source_id =
        []
        |> SourceHealth.summary(@now)
        |> Map.new(&{&1.source_id, &1})

      assert %{
               latest_import_run_status: "running",
               latest_import_run_finished_at: nil
             } = Map.fetch!(rows_by_source_id, source.id)
    end
  end

  defp source_fixture(attrs \\ %{}) do
    unique = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "Source #{unique}",
          domain: "source-#{unique}.example"
        },
        attrs
      )

    {1, [%{id: id}]} =
      Repo.insert_all(
        "sources",
        [
          attrs
          |> Map.drop([:kind])
          |> Map.merge(%{
            source_kind_id: Map.fetch!(SourceKind.codes(), attrs.kind),
            inserted_at: @now,
            updated_at: @now
          })
        ],
        returning: [:id]
      )

    Map.put(attrs, :id, id)
  end

  defp insert_artifact(source, attrs) do
    unique = System.unique_integer([:positive])

    Repo.insert_all("source_artifacts", [
      Map.merge(
        %{
          source_id: source.id,
          url: "https://#{source.domain}/artifact-#{unique}.json",
          fetched_at: @now,
          content_hash: "artifact-#{unique}",
          raw_json: %{},
          raw_text: nil,
          inserted_at: @now
        },
        Map.new(attrs)
      )
    ])
  end

  defp insert_run(source, attrs) do
    finished_at = Keyword.fetch!(attrs, :finished_at)

    Repo.insert_all("ingestion_runs", [
      Map.merge(
        %{
          source_id: source.id,
          integration_surface_id: 1,
          query: %{},
          status: Keyword.fetch!(attrs, :status),
          started_at: Keyword.get(attrs, :started_at, finished_at),
          finished_at: finished_at,
          cursor_start: nil,
          cursor_end: nil,
          page_size: nil,
          pages_requested: nil,
          pages_fetched: 0,
          records_fetched: 0,
          records_normalized: 0,
          records_persisted: 0,
          records_failed: 0,
          error_summary: nil,
          inserted_at: @now,
          updated_at: @now
        },
        Map.new(attrs)
      )
    ])
  end

  defp hours_ago(hours), do: DateTime.add(@now, -hours * 60 * 60, :second)
end

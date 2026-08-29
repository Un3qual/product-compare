defmodule ProductCompare.CommerceAttribution.CJ.ImporterTest do
  use ProductCompare.DataCase, async: false

  @moduletag capture_log: true

  import ExUnit.CaptureLog, only: [with_log: 1]

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_blocked_by: 2,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.CJ.Importer
  alias ProductCompare.CommerceAttribution.Conversions
  alias ProductCompare.CommerceAttribution.Conversions.Persistence
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.CJActionCorrection
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  setup do
    network_fixture("cj")
    :ok
  end

  test "walks every page, advances only the commission cursor, and completes truthful counts" do
    parent = self()

    fetch_page = fn request, _opts ->
      send(parent, {:page, request})

      case request.since_commission_id do
        nil ->
          {:ok,
           %{
             records: [original("c-1", "a-1")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}

        "c-1" ->
          {:ok,
           %{
             records: [original("c-2", "a-2")],
             payload_complete: true,
             max_commission_id: "c-2"
           }}
      end
    end

    assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)
    assert run.status == :succeeded
    assert run.pages_fetched == 2
    assert run.records_fetched == 2
    assert run.records_persisted == 2
    assert run.records_failed == 0
    assert run.cursor == "c-2"

    fixed_request = %{
      from: ~U[2026-08-01 00:00:00Z],
      before: ~U[2026-08-02 00:00:00Z],
      publisher_ids: ["publisher-1"]
    }

    assert_receive {:page, %{since_commission_id: nil} = first_request}
    assert_receive {:page, %{since_commission_id: "c-1"} = second_request}
    assert Map.drop(first_request, [:since_commission_id]) == fixed_request
    assert Map.drop(second_request, [:since_commission_id]) == fixed_request
  end

  test "accepts a zero-record complete page and records a completion cursor" do
    fetch_page = fn _request, _opts ->
      {:ok, %{records: [], payload_complete: true, max_commission_id: "complete-cursor"}}
    end

    assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)
    assert run.status == :succeeded
    assert run.cursor == "complete-cursor"
    assert run.pages_fetched == 1
    assert run.records_fetched == 0
    assert run.records_persisted == 0
    assert run.records_failed == 0
  end

  test "persists the Oban job identity supplied outside durable job arguments" do
    fetch_page = fn _request, _opts ->
      {:ok, %{records: [], payload_complete: true, max_commission_id: "complete-cursor"}}
    end

    assert {:ok, run} =
             Importer.run(import_request(),
               fetch_page: fetch_page,
               oban_job_id: 42,
               oban_attempt: 2
             )

    assert Map.get(run, :oban_job_id) == 42
    assert Map.get(run, :oban_attempt) == 2
  end

  test "fails closed when an incomplete page omits or blanks its continuation cursor" do
    for cursor <- [:missing, nil, "   "] do
      fetch_page = fn _request, _opts ->
        page = %{records: [], payload_complete: false}
        page = if cursor == :missing, do: page, else: Map.put(page, :max_commission_id, cursor)
        {:ok, page}
      end

      assert {:error, {:invalid_response, :max_commission_id}} =
               Importer.run(import_request(), fetch_page: fetch_page)

      assert %ConversionSyncRun{
               status: :failed,
               pages_fetched: 1,
               records_fetched: 0,
               records_persisted: 0,
               records_failed: 0,
               error_summary: "invalid_response"
             } =
               latest_run()
    end
  end

  test "rejects a non-advancing current cursor before it can refetch a page forever" do
    fetch_page = fn request, _opts ->
      case request.since_commission_id do
        nil ->
          {:ok,
           %{
             records: [original("c-1", "a-1")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}

        "c-1" ->
          {:ok,
           %{
             records: [original("c-2", "a-2")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}
      end
    end

    assert {:error, {:invalid_response, :non_advancing_cursor}} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert %{
             status: :failed,
             pages_fetched: 2,
             records_fetched: 2,
             records_persisted: 0,
             records_failed: 2,
             cursor: "c-1"
           } = latest_run()

    assert Repo.aggregate(CommerceConversion, :count, :id) == 0
  end

  test "rejects a previously seen cursor cycle before it can repeat page traversal" do
    fetch_page = fn request, _opts ->
      case request.since_commission_id do
        nil ->
          {:ok,
           %{
             records: [original("c-1", "a-1")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}

        "c-1" ->
          {:ok,
           %{
             records: [original("c-2", "a-2")],
             payload_complete: false,
             max_commission_id: "c-2"
           }}

        "c-2" ->
          {:ok,
           %{
             records: [original("c-3", "a-3")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}
      end
    end

    assert {:error, {:invalid_response, :repeated_cursor}} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert %{
             status: :failed,
             pages_fetched: 3,
             records_fetched: 3,
             records_persisted: 0,
             records_failed: 3,
             cursor: "c-2"
           } = latest_run()

    assert Repo.aggregate(CommerceConversion, :count, :id) == 0
  end

  test "accepts a terminal page that repeats the current cursor" do
    fetch_page = fn request, _opts ->
      case request.since_commission_id do
        nil ->
          {:ok,
           %{
             records: [original("c-1", "a-1")],
             payload_complete: false,
             max_commission_id: "c-1"
           }}

        "c-1" ->
          {:ok,
           %{
             records: [original("c-2", "a-2")],
             payload_complete: true,
             max_commission_id: "c-1"
           }}
      end
    end

    assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)

    assert %{
             status: :succeeded,
             pages_fetched: 2,
             records_fetched: 2,
             records_persisted: 2,
             records_failed: 0,
             cursor: "c-1"
           } = latest_run()

    assert run.status == :succeeded
    assert Repo.aggregate(CommerceConversion, :count, :id) == 2
  end

  test "accepts a terminal page that returns a previously seen cursor" do
    fetch_page = fn request, _opts ->
      case request.since_commission_id do
        nil ->
          {:ok, %{records: [], payload_complete: false, max_commission_id: "c-1"}}

        "c-1" ->
          {:ok, %{records: [], payload_complete: false, max_commission_id: "c-2"}}

        "c-2" ->
          {:ok,
           %{
             records: [original("c-3", "a-3")],
             payload_complete: true,
             max_commission_id: "c-1"
           }}
      end
    end

    assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)

    assert %{
             status: :succeeded,
             pages_fetched: 3,
             records_fetched: 1,
             records_persisted: 1,
             records_failed: 0,
             cursor: "c-1"
           } = latest_run()

    assert run.status == :succeeded
    assert Repo.aggregate(CommerceConversion, :count, :id) == 1
  end

  test "logs successful completion after durable run evidence is written" do
    fetch_page = fn _request, _opts ->
      {:ok,
       %{
         records: [original("logged-c-1", "logged-a-1")],
         payload_complete: true,
         max_commission_id: "logged-c-1"
       }}
    end

    previous_level = Logger.level()
    Logger.configure(level: :info)

    try do
      {run, log} =
        with_log(fn ->
          assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)
          run
        end)

      assert log =~ "CJ commission import succeeded"
      assert log =~ "run_id=#{run.entropy_id}"
      assert log =~ "from=#{DateTime.to_iso8601(run.window_start)}"
      assert log =~ "before=#{DateTime.to_iso8601(run.window_end)}"
      assert log =~ "category=success"
      assert log =~ "pages=1 fetched=1 persisted=1 failed=0"
    after
      Logger.configure(level: previous_level)
    end
  end

  test "logs failed completion with a redacted category and truthful counts" do
    fetch_page = fn _request, _opts ->
      {:error, {:transport_error, "provider secret"}}
    end

    {result, log} =
      with_log(fn ->
        assert {:error, {:transport_error, "provider secret"}} =
                 Importer.run(import_request(), fetch_page: fetch_page)
      end)

    run = latest_run()
    assert result == {:error, {:transport_error, "provider secret"}}
    assert log =~ "CJ commission import failed"
    assert log =~ "run_id=#{run.entropy_id}"
    assert log =~ "from=#{DateTime.to_iso8601(run.window_start)}"
    assert log =~ "before=#{DateTime.to_iso8601(run.window_end)}"
    assert log =~ "category=transport_error"
    assert log =~ "pages=0 fetched=0 persisted=0 failed=0"
    refute log =~ "provider secret"
  end

  test "fails when the bounded page ceiling is exhausted" do
    fetch_page = fn %{since_commission_id: cursor}, _opts ->
      next = if cursor, do: cursor <> "-next", else: "c-1"
      {:ok, %{records: [], payload_complete: false, max_commission_id: next}}
    end

    assert {:error, :page_ceiling_exhausted} =
             Importer.run(%{import_request() | max_pages: 2}, fetch_page: fetch_page)

    assert %{
             status: :failed,
             pages_fetched: 2,
             records_fetched: 0,
             records_persisted: 0,
             records_failed: 0,
             error_summary: "page_ceiling_exhausted"
           } = latest_run()
  end

  test "rejects malformed records before persisting any fetched page" do
    fetch_page = fn _request, _opts ->
      {:ok,
       %{
         records: [original("c-1", "a-1"), %{"commissionId" => "incomplete"}],
         payload_complete: true,
         max_commission_id: "c-1"
       }}
    end

    assert {:error, {:invalid_response, :record}} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert Repo.aggregate(CommerceConversion, :count, :id) == 0

    assert %{
             status: :failed,
             pages_fetched: 1,
             records_fetched: 2,
             records_persisted: 0,
             records_failed: 2,
             cursor: nil
           } = latest_run()
  end

  test "rejects semantically malformed originals and corrections before financial persistence" do
    invalid_records = [
      original("invalid-original", "invalid-action", %{"saleAmountUsd" => "not-money"}),
      correction("invalid-correction", "invalid-action", %{"actionStatus" => "reversed"}),
      original("non-finite-original", "invalid-action", %{"saleAmountUsd" => "NaN"}),
      correction("non-finite-correction", "invalid-action", %{
        "pubCommissionAmountUsd" => "Infinity"
      })
    ]

    for record <- invalid_records do
      fetch_page = fn _request, _opts ->
        {:ok, %{records: [record], payload_complete: true, max_commission_id: nil}}
      end

      assert {:error, {:invalid_response, :record}} =
               Importer.run(import_request(), fetch_page: fetch_page)

      assert Repo.aggregate(CommerceConversion, :count, :id) == 0

      assert %ConversionSyncRun{
               status: :failed,
               pages_fetched: 1,
               records_fetched: 1,
               records_persisted: 0,
               records_failed: 1,
               error_summary: "invalid_response"
             } = latest_run()
    end
  end

  test "classifies transport failure without persisting provider exception details" do
    fetch_page = fn _request, _opts -> {:error, {:transport_error, "secret endpoint"}} end

    assert {:error, {:transport_error, "secret endpoint"}} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert %{
             status: :failed,
             pages_fetched: 0,
             records_fetched: 0,
             error_summary: "transport_error"
           } = latest_run()
  end

  test "rescues callback failures into a category-only runner exception" do
    fetch_page = fn _request, _opts -> raise "provider secret" end

    assert {:error, :runner_exception} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert %{status: :failed, error_summary: "runner_exception"} = latest_run()
  end

  test "validates the bounded request before starting a sync run or fetching" do
    parent = self()
    fetch_page = fn _request, _opts -> send(parent, :fetched) end

    invalid_requests = [
      %{import_request() | before: ~U[2026-08-01 00:00:00Z]},
      %{
        import_request()
        | from: %{
            ~U[2026-08-01 00:00:00Z]
            | time_zone: "Etc/GMT+1",
              zone_abbr: "-01",
              utc_offset: -3_600
          }
      },
      %{import_request() | publisher_ids: []},
      %{import_request() | publisher_ids: ["publisher-1", " "]},
      %{import_request() | max_pages: 0},
      %{import_request() | max_pages: 101}
    ]

    for request <- invalid_requests do
      assert {:error, {:invalid_request, _field}} =
               Importer.run(request, fetch_page: fetch_page)
    end

    refute_received :fetched
    assert Repo.aggregate(ConversionSyncRun, :count, :id) == 0
  end

  test "collects all pages before persistence so a correction can precede its later original" do
    parent = self()

    fetch_page = fn request, _opts ->
      case request.since_commission_id do
        nil ->
          send(parent, :first_page_fetched)

          {:ok,
           %{
             records: [correction("c-2", "a-1")],
             payload_complete: false,
             max_commission_id: "c-2"
           }}

        "c-2" ->
          assert Repo.aggregate(CommerceConversion, :count, :id) == 0
          send(parent, :second_page_fetched)

          {:ok,
           %{
             records: [original("c-1", "a-1")],
             payload_complete: true,
             max_commission_id: "c-1"
           }}
      end
    end

    assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)
    assert run.records_persisted == 2
    assert_received :first_page_fetched
    assert_received :second_page_fetched

    assert %CommerceConversion{status: :reversed, network_conversion_ref: "c-1"} =
             Repo.one!(CommerceConversion)
  end

  test "orders corrections after originals and excludes partial correction amounts" do
    original =
      original("c-1", "a-1", %{
        "saleAmountUsd" => "100.00",
        "pubCommissionAmountUsd" => "10.00"
      })

    partial_correction =
      correction("c-2", "a-1", %{
        "saleAmountUsd" => "25.00",
        "pubCommissionAmountUsd" => "-2.50"
      })

    assert {:ok, %{persisted: 2, reversed: 1}} =
             Conversions.persist_cj_action_group([partial_correction, original])

    conversion = Repo.one!(CommerceConversion)
    assert conversion.status == :reversed
    assert conversion.network_conversion_ref == "c-1"
    assert conversion.network_action_ref == "a-1"
    assert conversion.currency == "USD"
    assert conversion.attribution_confidence == :unmatched
    assert conversion.purchased_at == ~U[2026-08-01 08:30:00.000000Z]
    assert Decimal.equal?(conversion.order_amount, Decimal.new("100.00"))
    assert Decimal.equal?(conversion.commission_amount, Decimal.new("10.00"))
    assert conversion.reported_at == ~U[2026-08-01 10:00:00.000000Z]
    assert conversion.data_freshness_at == ~U[2026-08-01 10:00:00.000000Z]
    assert conversion.raw_payload == partial_correction
  end

  test "selects the correction deterministically by commission identity at equal UTC freshness" do
    earlier_correction =
      correction("9", "a-1", %{"postingDate" => "2026-08-01T10:00:00Z"})

    later_correction =
      correction("10", "a-1", %{"postingDate" => "2026-08-01T10:00:00Z"})

    assert {:ok, %{persisted: 3, reversed: 1}} =
             Conversions.persist_cj_action_group([
               later_correction,
               earlier_correction,
               original("1", "a-1")
             ])

    assert %CommerceConversion{
             status: :reversed,
             reported_at: ~U[2026-08-01 10:00:00.000000Z],
             raw_payload: ^later_correction
           } = Repo.one!(CommerceConversion)

    assert {:ok, %{raw_payload: ^later_correction}} = Persistence.latest_cj_correction("a-1")

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([earlier_correction])

    assert %CommerceConversion{raw_payload: ^later_correction} = Repo.one!(CommerceConversion)
    assert {:ok, %{raw_payload: ^later_correction}} = Persistence.latest_cj_correction("a-1")
  end

  test "replays correction evidence safely when a legacy reversed row has no freshness timestamp" do
    action_ref = "legacy-freshness-#{Ecto.UUID.generate()}"

    assert {:ok, %{persisted: 2, reversed: 1}} =
             Conversions.persist_cj_action_group([
               original("1", action_ref),
               correction("9", action_ref)
             ])

    Repo.update_all(CommerceConversion, set: [data_freshness_at: nil])
    later_correction = correction("10", action_ref)

    assert {:ok, %{persisted: 1, reversed: 2}} =
             Conversions.persist_cj_action_group([later_correction])

    assert %CommerceConversion{
             data_freshness_at: ~U[2026-08-01 10:00:00.000000Z],
             raw_payload: ^later_correction
           } = Repo.one!(CommerceConversion)
  end

  test "action-key advisory locking requires a database transaction" do
    assert_raise ArgumentError,
                 "lock_cj_action_key/1 requires a database transaction",
                 fn -> Persistence.lock_cj_action_key("outside-transaction") end
  end

  test "action persistence rejects a malformed correction before it can bypass the adapter" do
    original = original("valid-original", "direct-validation-action")

    malformed_correction =
      correction("malformed-correction", "direct-validation-action", %{
        "actionStatus" => "reversed"
      })

    assert {:error, {:invalid_response, :record}} =
             Conversions.persist_cj_action_group([original, malformed_correction])

    assert Repo.aggregate(CommerceConversion, :count, :id) == 0
  end

  test "stale correction replay cannot replace fresher original evidence" do
    fresh_original =
      original("c-1", "a-1", %{
        "postingDate" => "2026-08-01T11:00:00Z",
        "actionStatus" => "locked"
      })

    stale_correction =
      correction("c-2", "a-1", %{"postingDate" => "2026-08-01T10:00:00Z"})

    assert {:ok, %{persisted: 2, reversed: 0}} =
             Conversions.persist_cj_action_group([stale_correction, fresh_original])

    conversion = Repo.one!(CommerceConversion)
    assert conversion.status == :approved
    assert conversion.reported_at == ~U[2026-08-01 11:00:00.000000Z]
    assert conversion.raw_payload == fresh_original
  end

  test "one correction reverses every conversion sharing its action reference" do
    correction = correction("c-3", "a-1")

    assert {:ok, %{persisted: 3, reversed: 2}} =
             Conversions.persist_cj_action_group([
               correction,
               original("c-2", "a-1"),
               original("c-1", "a-1")
             ])

    conversions = Repo.all(from conversion in CommerceConversion, order_by: conversion.id)
    assert [_, _] = conversions
    assert Enum.all?(conversions, &(&1.status == :reversed))
    assert Enum.all?(conversions, &(&1.raw_payload == correction))
  end

  test "fails closed for unmatched corrections and blank action references" do
    assert {:error, :unmatched_correction} =
             Conversions.persist_cj_action_group([correction("c-1", "missing-action")])

    for action_ref <- [nil, "   "] do
      assert {:error, changeset} =
               Conversions.persist_cj_action_group([correction("c-2", action_ref)])

      assert "can't be blank" in errors_on(changeset).network_action_ref
    end

    assert Repo.aggregate(CommerceConversion, :count, :id) == 0
  end

  test "durable correction evidence reverses a distinct later original that is not newer" do
    action_ref = "durable-action-#{Ecto.UUID.generate()}"
    existing_original = original("existing-#{Ecto.UUID.generate()}", action_ref)
    later_identity = original("later-#{Ecto.UUID.generate()}", action_ref)
    correction = correction("correction-#{Ecto.UUID.generate()}", action_ref)

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([existing_original])

    assert {:ok, %{persisted: 1, reversed: 1}} =
             Conversions.persist_cj_action_group([correction])

    assert {:ok, %{persisted: 1, reversed: 1}} =
             Conversions.persist_cj_action_group([later_identity])

    conversions =
      Repo.all(
        from conversion in CommerceConversion,
          where: conversion.network_action_ref == ^action_ref,
          order_by: conversion.network_conversion_ref
      )

    assert [_, _] = conversions
    assert Enum.all?(conversions, &(&1.status == :reversed))
    assert Enum.all?(conversions, &(&1.raw_payload == correction))
  end

  test "action-level correction evidence survives a newer overwrite and reverses a later stale identity" do
    action_ref = "durable-overwrite-#{Ecto.UUID.generate()}"
    original_ref = "original-#{Ecto.UUID.generate()}"

    initial_original =
      original(original_ref, action_ref, %{"postingDate" => "2026-08-01T09:00:00Z"})

    correction =
      correction("correction-#{Ecto.UUID.generate()}", action_ref, %{
        "postingDate" => "2026-08-01T10:00:00Z"
      })

    newer_original =
      original(original_ref, action_ref, %{"postingDate" => "2026-08-01T11:00:00Z"})

    stale_distinct_original =
      original("stale-#{Ecto.UUID.generate()}", action_ref, %{
        "postingDate" => "2026-08-01T09:30:00Z"
      })

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([initial_original])

    assert {:ok, %{persisted: 1, reversed: 1}} =
             Conversions.persist_cj_action_group([correction])

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([newer_original])

    assert {:ok, %{posting_date: ~U[2026-08-01 10:00:00.000000Z], raw_payload: ^correction}} =
             Persistence.latest_cj_correction(action_ref)

    assert {:ok, %{persisted: 1, reversed: 1}} =
             Conversions.persist_cj_action_group([stale_distinct_original])

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([stale_distinct_original])

    conversions =
      Repo.all(
        from conversion in CommerceConversion,
          where: conversion.network_action_ref == ^action_ref,
          order_by: conversion.network_conversion_ref
      )

    assert [newer, stale] = conversions
    assert newer.network_conversion_ref == original_ref
    assert newer.status == :approved
    assert newer.raw_payload == newer_original
    assert stale.network_conversion_ref == stale_distinct_original["commissionId"]
    assert stale.status == :reversed
    assert stale.raw_payload == correction
  end

  test "durable correction evidence requires a JSON boolean false original marker" do
    boolean_action_ref = "boolean-correction-#{Ecto.UUID.generate()}"
    boolean_original = original("boolean-original-#{Ecto.UUID.generate()}", boolean_action_ref)

    boolean_correction =
      correction("boolean-correction-#{Ecto.UUID.generate()}", boolean_action_ref)

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([boolean_original])

    assert {:ok, %{persisted: 1, reversed: 1}} =
             Conversions.persist_cj_action_group([boolean_correction])

    assert {:ok, %{raw_payload: %{"original" => false}}} =
             Persistence.latest_cj_correction(boolean_action_ref)

    string_action_ref = "string-correction-#{Ecto.UUID.generate()}"
    string_original = original("string-original-#{Ecto.UUID.generate()}", string_action_ref)
    string_correction = correction("string-correction-#{Ecto.UUID.generate()}", string_action_ref)
    string_correction = %{string_correction | "original" => "false"}

    assert {:ok, %{persisted: 1, reversed: 0}} =
             Conversions.persist_cj_action_group([string_original])

    conversion = Repo.get_by!(CommerceConversion, network_action_ref: string_action_ref)

    assert {:ok, _conversion} =
             conversion
             |> Ecto.Changeset.change(%{
               raw_payload: string_correction,
               reported_at: ~U[2026-08-01 10:00:00.000000Z],
               status: :reversed
             })
             |> Repo.update()

    assert {:ok, nil} = Persistence.latest_cj_correction(string_action_ref)
  end

  test "keeps a committed action group when a later group fails" do
    records = [
      original("c-1", "a-1"),
      correction("c-2", "a-2")
    ]

    fetch_page = fn _request, _opts ->
      {:ok, %{records: records, payload_complete: true, max_commission_id: "c-2"}}
    end

    assert {:error, :unmatched_correction} =
             Importer.run(import_request(), fetch_page: fetch_page)

    assert %CommerceConversion{network_conversion_ref: "c-1", status: :approved} =
             Repo.one!(CommerceConversion)

    assert %{
             status: :failed,
             pages_fetched: 1,
             records_fetched: 2,
             records_persisted: 1,
             records_failed: 1,
             error_summary: "unmatched_correction"
           } = latest_run()
  end

  test "separate original and correction runs serialize for both action-lock release orders" do
    for first_operation <- [:original, :correction] do
      action_ref = "concurrent-action-#{first_operation}-#{Ecto.UUID.generate()}"

      existing_original =
        original("existing-#{first_operation}-#{Ecto.UUID.generate()}", action_ref)

      later_identity = original("later-#{first_operation}-#{Ecto.UUID.generate()}", action_ref)
      correction = correction("correction-#{first_operation}-#{Ecto.UUID.generate()}", action_ref)

      _fixture = committed_conversion_fixture(existing_original)

      on_exit(fn -> delete_committed_action_fixture(action_ref) end)

      {lock_holder, lock_backend_pid} = hold_cj_action_lock(action_ref)

      {first_records, second_records} =
        if first_operation == :original,
          do: {[later_identity], [correction]},
          else: {[correction], [later_identity]}

      {first_run, first_backend_pid} = start_complete_import(first_records, "publisher-first")

      assert_blocked_by(first_backend_pid, lock_backend_pid)

      {second_run, second_backend_pid} = start_complete_import(second_records, "publisher-second")

      assert_backend_blocked(second_backend_pid)
      release_cj_action_lock(lock_holder)

      assert {:ok, %ConversionSyncRun{status: :succeeded}} = Task.await(first_run, 5_000)
      assert {:ok, %ConversionSyncRun{status: :succeeded}} = Task.await(second_run, 5_000)

      conversions =
        Sandbox.unboxed_run(Repo, fn ->
          Repo.all(
            from conversion in CommerceConversion,
              where: conversion.network_action_ref == ^action_ref
          )
        end)

      assert [_, _] = conversions
      assert Enum.all?(conversions, &(&1.status == :reversed))
      assert Enum.all?(conversions, &(&1.raw_payload == correction))
    end
  end

  defp hold_cj_action_lock(action_ref) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = ProductCompare.DatabaseTestHelpers.database_backend_pid()

            :ok = Persistence.lock_cj_action_key(action_ref)

            send(parent, {:cj_action_lock_held, self(), backend_pid})

            receive do
              :release_cj_action_lock -> :ok
            after
              5_000 -> flunk("timed out waiting to release the CJ action lock")
            end
          end)
        end)
      end)

    assert_receive {:cj_action_lock_held, task_pid, backend_pid}, 2_000
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_cj_action_lock(task) do
    send(task.pid, :release_cj_action_lock)
    assert {:ok, :ok} = Task.await(task)
  end

  defp start_complete_import(records, publisher_id) do
    start_unboxed_action(fn ->
      fetch_page = fn _request, _opts ->
        {:ok, %{records: records, payload_complete: true, max_commission_id: "complete"}}
      end

      Importer.run(%{import_request() | publisher_ids: [publisher_id]}, fetch_page: fetch_page)
    end)
  end

  defp committed_conversion_fixture(original) do
    Sandbox.unboxed_run(Repo, fn ->
      network_fixture("cj")
      {:ok, %{persisted: 1, reversed: 0}} = Conversions.persist_cj_action_group([original])
      Repo.get_by!(CommerceConversion, network_conversion_ref: original["commissionId"])
    end)
  end

  defp delete_committed_action_fixture(action_ref) do
    Sandbox.unboxed_run(Repo, fn ->
      network = Repo.get_by(AffiliateNetwork, code: "cj")

      if network do
        window_start = ~U[2026-08-01 00:00:00Z]
        window_end = ~U[2026-08-02 00:00:00Z]

        Repo.delete_all(
          from run in ConversionSyncRun,
            where:
              run.affiliate_network_id == ^network.id and
                run.window_start == ^window_start and
                run.window_end == ^window_end
        )

        Repo.delete_all(
          from conversion in CommerceConversion,
            where:
              conversion.affiliate_network_id == ^network.id and
                conversion.network_action_ref == ^action_ref
        )

        Repo.delete_all(
          from correction in CJActionCorrection,
            where:
              correction.affiliate_network_id == ^network.id and
                correction.network_action_ref == ^action_ref
        )
      end
    end)
  end

  defp latest_run do
    Repo.one!(from run in ConversionSyncRun, order_by: [desc: run.id], limit: 1)
  end

  defp import_request do
    %{
      from: ~U[2026-08-01 00:00:00Z],
      before: ~U[2026-08-02 00:00:00Z],
      publisher_ids: ["publisher-1"],
      max_pages: 3,
      trigger: :operator,
      requested_by_user_id: nil
    }
  end

  defp original(commission_id, action_ref, overrides \\ %{}) do
    Map.merge(
      %{
        "commissionId" => commission_id,
        "original" => true,
        "originalActionId" => action_ref,
        "correctionReason" => nil,
        "actionStatus" => "locked",
        "shopperId" => nil,
        "eventDate" => "2026-08-01T08:30:00Z",
        "postingDate" => "2026-08-01T09:00:00Z",
        "saleAmountUsd" => "81.25",
        "pubCommissionAmountUsd" => "8.12"
      },
      overrides
    )
  end

  defp correction(commission_id, action_ref, overrides \\ %{}) do
    Map.merge(
      %{
        "commissionId" => commission_id,
        "original" => false,
        "originalActionId" => action_ref,
        "correctionReason" => "RETURNED_MERCHANDISE",
        "actionStatus" => "new",
        "shopperId" => nil,
        "eventDate" => "2026-08-01T08:30:00Z",
        "postingDate" => "2026-08-01T10:00:00Z",
        "saleAmountUsd" => "81.25",
        "pubCommissionAmountUsd" => "-8.12"
      },
      overrides
    )
  end

  defp network_fixture(code) do
    case Repo.get_by(AffiliateNetwork, code: code) do
      %AffiliateNetwork{} = network ->
        network

      nil ->
        {:ok, network} = Affiliate.upsert_network(%{code: code, name: String.upcase(code)})
        network
    end
  end
end

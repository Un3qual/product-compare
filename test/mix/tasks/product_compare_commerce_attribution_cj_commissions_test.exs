defmodule Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissionsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  @sentinel "CJ_CLI_SENTINEL_SECRET_DO_NOT_LEAK"

  alias Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions
  alias Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions.Options
  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  setup do
    restore_system_env("CJ_API_TOKEN")
    restore_system_env("CJ_ACCOUNT_ID")
    restore_system_env("CJ_COMMISSION_PUBLISHER_IDS")

    System.put_env("CJ_API_TOKEN", "secret-test-token")
    System.put_env("CJ_ACCOUNT_ID", "secret-publisher-id")
    System.delete_env("CJ_COMMISSION_PUBLISHER_IDS")
    network_fixture("cj")

    :ok
  end

  test "parses the exact explicit bounds, lookback, page ceiling, and readiness switches" do
    assert Options.parse_argv([
             "--from",
             "2026-08-01T00:00:00Z",
             "--before",
             "2026-08-02T00:00:00+00:00",
             "--max-pages",
             "100"
           ]) ==
             [
               from: ~U[2026-08-01 00:00:00Z],
               before: ~U[2026-08-02 00:00:00Z],
               max_pages: 100,
               check_credentials: false,
               require_ready: false
             ]

    assert Options.parse_argv([
             "--lookback-days",
             "1",
             "--max-pages",
             "1",
             "--check-credentials",
             "--require-ready"
           ]) ==
             [
               lookback_days: 1,
               max_pages: 1,
               check_credentials: true,
               require_ready: true
             ]
  end

  test "rejects mixed, incomplete, non-UTC, inverted, out-of-range, and unknown input" do
    invalid_argv = [
      ["--from", "2026-08-01T00:00:00Z"],
      ["--before", "2026-08-02T00:00:00Z"],
      [
        "--from",
        "2026-08-01T00:00:00Z",
        "--before",
        "2026-08-02T00:00:00Z",
        "--lookback-days",
        "7"
      ],
      [
        "--from",
        "2026-08-01T00:00:00-07:00",
        "--before",
        "2026-08-02T00:00:00Z"
      ],
      [
        "--from",
        "2026-08-02T00:00:00Z",
        "--before",
        "2026-08-01T00:00:00Z"
      ],
      ["--lookback-days", "0"],
      ["--lookback-days", "91"],
      ["--max-pages", "0"],
      ["--max-pages", "101"],
      ["--unknown-option"]
    ]

    for argv <- invalid_argv do
      assert_raise Mix.Error, fn -> Options.parse_argv(argv) end
    end
  end

  test "credential checks print only provider, surface, and readiness without starting an import" do
    flunking_importer = fn _request, _opts -> flunk("credential checks must not import") end

    output =
      capture_io(fn ->
        assert {:ok,
                %{
                  provider: "cj",
                  surface: "publisherCommissions",
                  ready: true,
                  api_token_configured: true,
                  account_id_configured: true
                }} =
                 CjCommissions.run_import(
                   check_credentials: true,
                   require_ready: true,
                   importer: flunking_importer
                 )
      end)

    assert output =~ "provider=cj"
    assert output =~ "surface=publisherCommissions"
    assert output =~ "ready=true"
    assert output =~ "api_token_configured=true"
    assert output =~ "account_id_configured=true"
    refute output =~ "secret-test-token"
    refute output =~ "secret-publisher-id"
  end

  test "require-ready raises with a classified secret-safe credential failure" do
    System.delete_env("CJ_API_TOKEN")
    System.delete_env("CJ_ACCOUNT_ID")

    output =
      capture_io(fn ->
        assert_raise Mix.Error, ~r/CJ commission import failed: configuration_error/, fn ->
          CjCommissions.run(["--check-credentials", "--require-ready"])
        end
      end)

    assert output =~ "provider=cj surface=publisherCommissions ready=false"
    refute output =~ "secret"
  end

  test "omitted bounds use persisted lookback and max pages at the current UTC time" do
    assert {:ok, settings} =
             ConversionSyncSettings.ensure_cj(%{lookback_days: 7, max_pages: 5})

    settings
    |> ConversionSyncSetting.changeset(%{lookback_days: 7, max_pages: 5})
    |> Repo.update!()

    now = ~U[2026-08-28 12:00:00Z]
    parent = self()

    importer = fn request, opts ->
      send(parent, {:import, request, opts})
      {:ok, successful_run(request)}
    end

    output =
      capture_io(fn ->
        assert {:ok, %ConversionSyncRun{}} =
                 CjCommissions.run_import(now: now, importer: importer)
      end)

    assert_receive {:import, request, []}
    assert request.from == ~U[2026-08-21 12:00:00Z]
    assert request.before == now
    assert request.publisher_ids == ["secret-publisher-id"]
    assert request.max_pages == 5
    assert request.trigger == :cli
    assert request.requested_by_user_id == nil

    assert output =~ "provider=cj"
    assert output =~ "surface=publisherCommissions"
    assert output =~ "run_id=30ce5a1f-cb15-4c7f-bdb7-9f4130d22950"
    assert output =~ "from=2026-08-21T12:00:00Z"
    assert output =~ "before=2026-08-28T12:00:00Z"
    assert output =~ "pages=2 fetched=3 persisted=2 failed=1"
    refute output =~ "secret-test-token"
    refute output =~ "secret-publisher-id"
  end

  test "explicit bounds and max pages reach the same importer unchanged" do
    parent = self()

    importer = fn request, _opts ->
      send(parent, {:request, request})
      {:ok, successful_run(request)}
    end

    opts =
      Options.parse_argv([
        "--from",
        "2026-08-01T00:00:00Z",
        "--before",
        "2026-08-02T00:00:00Z",
        "--max-pages",
        "3"
      ])

    capture_io(fn ->
      assert {:ok, %ConversionSyncRun{}} =
               CjCommissions.run_import(Keyword.put(opts, :importer, importer))
    end)

    assert_receive {:request,
                    %{
                      from: ~U[2026-08-01 00:00:00Z],
                      before: ~U[2026-08-02 00:00:00Z],
                      max_pages: 3
                    }}
  end

  test "provider failures print only a classified failure" do
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    output =
      capture_io(fn ->
        assert {:error, :transient_provider_failure} =
                 CjCommissions.run_import(
                   now: ~U[2026-08-28 12:00:00Z],
                   importer: fn _request, _opts ->
                     {:error, {:transport_error, "secret provider body"}}
                   end
                 )
      end)

    assert output =~ "provider=cj"
    assert output =~ "surface=publisherCommissions"
    assert output =~ "status=failed"
    assert output =~ "failure=transient_provider_failure"
    refute output =~ "secret provider body"
  end

  test "raised and thrown importer failures are normalized without exposing secrets" do
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    importers = [
      fn _request, _opts -> raise "provider raised #{@sentinel}" end,
      fn _request, _opts -> throw({:provider_threw, @sentinel}) end
    ]

    for importer <- importers do
      output =
        capture_io(fn ->
          assert {:error, :provider_failure} =
                   CjCommissions.run_import(
                     now: ~U[2026-08-28 12:00:00Z],
                     importer: importer
                   )
        end)

      assert output =~ "status=failed failure=provider_failure"
      refute output =~ @sentinel
    end
  end

  test "malformed and unexpected importer outcomes fail closed without exposing secrets" do
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    outcomes = [
      {{:ok, %{status: :succeeded, provider_value: @sentinel}}, :unexpected_importer_result},
      {{:unexpected_provider_result, @sentinel}, :unexpected_importer_result},
      {{:error, {:unknown_provider_failure, @sentinel}}, :provider_failure}
    ]

    for {outcome, category} <- outcomes do
      output =
        capture_io(fn ->
          assert {:error, ^category} =
                   CjCommissions.run_import(
                     now: ~U[2026-08-28 12:00:00Z],
                     importer: fn _request, _opts -> outcome end
                   )
        end)

      assert output =~ "status=failed failure=#{category}"
      refute output =~ @sentinel
    end
  end

  test "the public task raises only the classified category when the importer raises a secret" do
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    with_importer(fn _request, _opts -> raise "provider raised #{@sentinel}" end, fn ->
      output =
        capture_io(fn ->
          error =
            assert_raise Mix.Error, fn ->
              CjCommissions.run(["--lookback-days", "1"])
            end

          assert Exception.message(error) == "CJ commission import failed: provider_failure"
          refute Exception.message(error) =~ @sentinel
        end)

      assert output =~ "status=failed failure=provider_failure"
      refute output =~ @sentinel
    end)
  end

  defp successful_run(request) do
    %ConversionSyncRun{
      entropy_id: "30ce5a1f-cb15-4c7f-bdb7-9f4130d22950",
      status: :succeeded,
      trigger: :cli,
      window_start: request.from,
      window_end: request.before,
      pages_fetched: 2,
      records_fetched: 3,
      records_persisted: 2,
      records_failed: 1
    }
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

  defp restore_system_env(name) do
    previous = System.get_env(name)

    on_exit(fn ->
      case previous do
        nil -> System.delete_env(name)
        value -> System.put_env(name, value)
      end
    end)
  end

  defp with_importer(importer, fun) do
    key = :cj_commission_sync_importer
    previous = Application.get_env(:product_compare, key, :not_set)
    Application.put_env(:product_compare, key, importer)

    try do
      fun.()
    after
      case previous do
        :not_set -> Application.delete_env(:product_compare, key)
        value -> Application.put_env(:product_compare, key, value)
      end
    end
  end
end

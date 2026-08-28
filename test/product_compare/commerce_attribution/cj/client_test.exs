defmodule ProductCompare.CommerceAttribution.CJ.ClientTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  alias ProductCompare.CommerceAttribution.CJ.Client

  @env_keys ~w(CJ_API_TOKEN CJ_ACCOUNT_ID CJ_COMMISSION_PUBLISHER_IDS)

  setup do
    original_env = Map.new(@env_keys, &{&1, System.get_env(&1)})

    on_exit(fn ->
      Enum.each(original_env, fn
        {key, nil} -> System.delete_env(key)
        {key, value} -> System.put_env(key, value)
      end)
    end)

    Enum.each(@env_keys, &System.delete_env/1)

    :ok
  end

  describe "fetch_page/2" do
    test "sends the exact publisher window and current selected fields" do
      parent = self()

      transport = fn request ->
        send(parent, {:request, request})
        {:ok, %{status: 200, body: fixture("commission_detail_sample.redacted.json")}}
      end

      assert {:ok, %{payload_complete: false, max_commission_id: "2002", records: [_ | _]}} =
               Client.fetch_page(
                 %{
                   publisher_ids: ["publisher-1"],
                   from: ~U[2026-08-01 00:00:00Z],
                   before: ~U[2026-08-02 00:00:00Z],
                   since_commission_id: nil
                 },
                 api_token: "secret-token",
                 transport: transport
               )

      assert_receive {:request,
                      %{
                        url: "https://commissions.api.cj.com/query",
                        headers: headers,
                        body: body
                      }}

      assert {"Authorization", "Bearer secret-token"} in headers

      decoded = Jason.decode!(body)

      assert decoded["variables"] == %{
               "forPublishers" => ["publisher-1"],
               "sincePostingDate" => "2026-08-01T00:00:00Z",
               "beforePostingDate" => "2026-08-02T00:00:00Z",
               "sinceCommissionId" => nil
             }

      assert decoded["query"] =~ "publisherCommissions"
      assert decoded["query"] =~ "shopperId"
      assert decoded["query"] =~ "pubCommissionAmountUsd"
      refute decoded["query"] =~ " sid "
    end

    test "returns status-only HTTP errors without provider bodies or credentials" do
      transport = fn _request ->
        {:ok, %{status: 429, body: "provider body secret-token"}}
      end

      {result, log} =
        with_log(fn ->
          Client.fetch_page(page_request(), api_token: "secret-token", transport: transport)
        end)

      assert {:error, {:http_error, 429}} = result
      refute inspect(result) =~ "secret-token"
      refute log =~ "secret-token"
      refute log =~ "provider body"
    end

    test "returns a category-only error for invalid JSON" do
      transport = fn _request -> {:ok, %{status: 200, body: "{provider body secret-token"}} end

      {result, log} =
        with_log(fn ->
          Client.fetch_page(page_request(), api_token: "secret-token", transport: transport)
        end)

      assert {:error, {:decode_error, :invalid_json}} = result
      refute inspect(result) =~ "secret-token"
      refute log =~ "secret-token"
      refute log =~ "provider body"
    end

    test "returns the optional GraphQL error code without envelope details" do
      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "errors" => [
                 %{
                   "message" => "provider body secret-token",
                   "extensions" => %{"code" => "FORBIDDEN"}
                 }
               ]
             })
         }}
      end

      {result, log} =
        with_log(fn ->
          Client.fetch_page(page_request(), api_token: "secret-token", transport: transport)
        end)

      assert {:error, {:graphql_error, "FORBIDDEN"}} = result
      refute inspect(result) =~ "secret-token"
      refute log =~ "secret-token"
      refute log =~ "provider body"
    end

    test "rejects a response without the publisher commissions root" do
      transport = fn _request -> {:ok, %{status: 200, body: Jason.encode!(%{"data" => %{}})}} end

      assert {:error, {:invalid_response, :publisher_commissions}} =
               Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
    end

    test "rejects a non-list record field" do
      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "publisherCommissions" => %{
                   "records" => %{},
                   "payloadComplete" => true,
                   "maxCommissionId" => nil
                 }
               }
             })
         }}
      end

      assert {:error, {:invalid_response, :records}} =
               Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
    end

    test "rejects records that omit any selected Commission Detail field" do
      for field <- commission_detail_fields() do
        transport = fn _request ->
          {:ok,
           %{
             status: 200,
             body: commission_detail_page(Map.delete(commission_detail_record(), field))
           }}
        end

        assert {:error, {:invalid_response, :record}} =
                 Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
      end
    end

    test "rejects records with non-CJ scalar values without retaining the record" do
      for {field, value} <- [
            {"commissionId", 2001},
            {"original", "true"},
            {"originalActionId", 1001},
            {"correctionReason", false},
            {"actionStatus", true},
            {"shopperId", 123},
            {"eventDate", 123},
            {"postingDate", %{}},
            {"saleAmountUsd", 81.25},
            {"pubCommissionAmountUsd", 8.12}
          ] do
        transport = fn _request ->
          {:ok,
           %{
             status: 200,
             body: commission_detail_page(Map.put(commission_detail_record(), field, value))
           }}
        end

        result = Client.fetch_page(page_request(), api_token: "test-token", transport: transport)

        assert {:error, {:invalid_response, :record}} = result
        refute inspect(result) =~ "record-secret"
      end
    end

    test "rejects undocumented statuses, invalid money, and non-UTC timestamps for originals and corrections" do
      invalid_values = [
        {"actionStatus", "approved"},
        {"saleAmountUsd", "not-money"},
        {"pubCommissionAmountUsd", "12.00 USD"},
        {"eventDate", "2026-08-01T08:30:00+01:00"},
        {"postingDate", "not-a-timestamp"}
      ]

      for original? <- [true, false], {field, value} <- invalid_values do
        record =
          commission_detail_record()
          |> Map.merge(%{
            "original" => original?,
            "correctionReason" => if(original?, do: nil, else: "RETURNED_MERCHANDISE")
          })
          |> Map.put(field, value)

        transport = fn _request ->
          {:ok, %{status: 200, body: commission_detail_page(record)}}
        end

        result = Client.fetch_page(page_request(), api_token: "test-token", transport: transport)

        assert {:error, {:invalid_response, :record}} = result
        refute inspect(result) =~ "record-secret"
        refute inspect(result) =~ value
      end
    end

    test "rejects a response without a boolean completion flag" do
      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "publisherCommissions" => %{
                   "records" => [],
                   "maxCommissionId" => nil
                 }
               }
             })
         }}
      end

      assert {:error, {:invalid_response, :payload_complete}} =
               Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
    end

    test "requires a nonblank string cursor on incomplete payloads" do
      for max_commission_id <- [nil, "", "   ", 2002] do
        transport = fn _request ->
          {:ok,
           %{
             status: 200,
             body:
               Jason.encode!(%{
                 "data" => %{
                   "publisherCommissions" => %{
                     "records" => [],
                     "payloadComplete" => false,
                     "maxCommissionId" => max_commission_id
                   }
                 }
               })
           }}
        end

        assert {:error, {:invalid_response, :max_commission_id}} =
                 Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
      end
    end

    test "permits a null cursor on completed payloads" do
      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "publisherCommissions" => %{
                   "records" => [],
                   "payloadComplete" => true,
                   "maxCommissionId" => nil
                 }
               }
             })
         }}
      end

      assert {:ok, %{records: [], payload_complete: true, max_commission_id: nil}} =
               Client.fetch_page(page_request(), api_token: "test-token", transport: transport)
    end

    test "validates fixed-window inputs before calling the transport" do
      transport = fn _request -> flunk("transport should not be called for an invalid window") end

      assert {:error, {:invalid_request, :publisher_ids}} =
               Client.fetch_page(
                 %{page_request() | publisher_ids: [" "]},
                 api_token: "test-token",
                 transport: transport
               )

      assert {:error, {:invalid_request, :window}} =
               Client.fetch_page(
                 %{page_request() | before: ~U[2026-08-01 00:00:00Z]},
                 api_token: "test-token",
                 transport: transport
               )
    end
  end

  describe "publisher_ids/1 and credential_status/1" do
    test "normalizes publisher lists ahead of the legacy account fallback" do
      System.put_env("CJ_COMMISSION_PUBLISHER_IDS", " publisher-1, , publisher-2 ")
      System.put_env("CJ_ACCOUNT_ID", "legacy-account")

      assert {:ok, ["publisher-1", "publisher-2"]} = Client.publisher_ids()

      assert {:ok, ["explicit-publisher"]} =
               Client.publisher_ids(publisher_ids: " explicit-publisher ")
    end

    test "falls back to the legacy account and reports its missing configuration key" do
      System.put_env("CJ_ACCOUNT_ID", " legacy-account ")
      assert {:ok, ["legacy-account"]} = Client.publisher_ids()

      System.delete_env("CJ_ACCOUNT_ID")
      assert {:error, {:missing_env, "CJ_ACCOUNT_ID"}} = Client.publisher_ids()
    end

    test "reports blank credentials as not ready without exposing configuration values" do
      System.put_env("CJ_API_TOKEN", "  ")
      System.put_env("CJ_COMMISSION_PUBLISHER_IDS", " , ")
      System.put_env("CJ_ACCOUNT_ID", " ")

      assert Client.credential_status() == %{
               ready: false,
               api_token_configured: false,
               account_id_configured: false
             }
    end

    test "reports readiness without returning token or publisher identities" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_COMMISSION_PUBLISHER_IDS", "publisher-1")

      status = Client.credential_status()

      assert status == %{
               ready: true,
               api_token_configured: true,
               account_id_configured: true
             }

      refute inspect(status) =~ "secret-token"
      refute inspect(status) =~ "publisher-1"
    end
  end

  defp page_request do
    %{
      publisher_ids: ["publisher-1"],
      from: ~U[2026-08-01 00:00:00Z],
      before: ~U[2026-08-02 00:00:00Z],
      since_commission_id: nil
    }
  end

  defp commission_detail_fields do
    [
      "commissionId",
      "original",
      "originalActionId",
      "correctionReason",
      "actionStatus",
      "shopperId",
      "eventDate",
      "postingDate",
      "saleAmountUsd",
      "pubCommissionAmountUsd"
    ]
  end

  defp commission_detail_record do
    %{
      "commissionId" => "record-secret",
      "original" => true,
      "originalActionId" => "action-1001",
      "correctionReason" => nil,
      "actionStatus" => "locked",
      "shopperId" => "00000000-0000-4000-8000-000000000001",
      "eventDate" => "2026-08-01T08:30:00Z",
      "postingDate" => "2026-08-01T09:00:00Z",
      "saleAmountUsd" => "81.25",
      "pubCommissionAmountUsd" => "8.12"
    }
  end

  defp commission_detail_page(record) do
    Jason.encode!(%{
      "data" => %{
        "publisherCommissions" => %{
          "records" => [record],
          "payloadComplete" => true,
          "maxCommissionId" => nil
        }
      }
    })
  end

  defp fixture(name) do
    __DIR__
    |> Path.join("../../../support/fixtures/cj/#{name}")
    |> File.read!()
  end
end

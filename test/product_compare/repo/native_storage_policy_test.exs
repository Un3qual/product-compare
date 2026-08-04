defmodule ProductCompare.Repo.NativeStoragePolicyTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.TestSupport.NativeStoragePolicy

  defmodule PersistedInstantFixture do
    use Ecto.Schema

    @primary_key false
    schema "native_storage_policy_fixtures" do
      field :occurred_at, :utc_datetime_usec, source: :occurred_at_utc
      field :transient_at, :utc_datetime_usec, virtual: true
    end
  end

  defmodule EmbeddedInstantFixture do
    use Ecto.Schema

    embedded_schema do
      field :occurred_at, :utc_datetime_usec
    end
  end

  defmodule PersistedInetFixture do
    use Ecto.Schema

    @primary_key false
    schema "native_storage_policy_inet_fixtures" do
      field :client_address, EctoNetwork.INET
    end
  end

  defmodule MissingHostConstraintRepo do
    def query!(sql, params) do
      result = ProductCompare.Repo.query!(sql, params)

      if String.contains?(sql, "FROM pg_constraint") do
        %{
          result
          | rows:
              Enum.reject(
                result.rows,
                &match?([_, "commerce_click_sessions_ip_address_host_check", _], &1)
              )
        }
      else
        result
      end
    end
  end

  test "discovers persisted UTC datetime fields without a table and column registry" do
    assert [
             %{
               schema: PersistedInstantFixture,
               database_schema: "public",
               table: "native_storage_policy_fixtures",
               field: :occurred_at,
               column: "occurred_at_utc",
               ecto_type: :utc_datetime_usec
             }
           ] =
             NativeStoragePolicy.utc_datetime_fields_from_modules([
               EmbeddedInstantFixture,
               PersistedInstantFixture
             ])
  end

  test "renders timestamp violations with expected and observed PostgreSQL details" do
    fields = NativeStoragePolicy.utc_datetime_fields_from_modules([PersistedInstantFixture])

    assert [
             "public.native_storage_policy_fixtures.occurred_at_utc " <>
               "(Elixir.ProductCompare.Repo.NativeStoragePolicyTest.PersistedInstantFixture " <>
               ":occurred_at) expected timestamp with time zone/timestamptz precision 6, " <>
               "observed timestamp without time zone/timestamp precision 6"
           ] =
             NativeStoragePolicy.utc_datetime_storage_violations(fields, %{
               {"public", "native_storage_policy_fixtures", "occurred_at_utc"} => %{
                 schema: "public",
                 data_type: "timestamp without time zone",
                 udt_name: "timestamp",
                 datetime_precision: 6
               }
             })
  end

  test "renders unreflected first-party timestamps while excluding only dependency tables" do
    catalog = [
      %{
        schema: "public",
        table: "native_storage_policy_fixtures",
        column: "unreflected_at",
        data_type: "timestamp without time zone",
        udt_name: "timestamp",
        datetime_precision: 6
      },
      %{
        schema: "public",
        table: "oban_jobs",
        column: "scheduled_at",
        data_type: "timestamp without time zone",
        udt_name: "timestamp",
        datetime_precision: 6
      }
    ]

    assert [
             "public.native_storage_policy_fixtures.unreflected_at (unreflected) " <>
               "expected timestamp with time zone/timestamptz precision 6, " <>
               "observed timestamp without time zone/timestamp precision 6"
           ] = NativeStoragePolicy.first_party_timestamp_violations(catalog, [])
  end

  test "rejects an unreflected timestamp with time zone below precision six" do
    catalog = [
      %{
        schema: "public",
        table: "native_storage_policy_fixtures",
        column: "unreflected_at",
        data_type: "timestamp with time zone",
        udt_name: "timestamptz",
        datetime_precision: 3
      },
      %{
        schema: "public",
        table: "oban_jobs",
        column: "scheduled_at",
        data_type: "timestamp with time zone",
        udt_name: "timestamptz",
        datetime_precision: 3
      }
    ]

    assert [
             "public.native_storage_policy_fixtures.unreflected_at (unreflected) " <>
               "expected timestamp with time zone/timestamptz precision 6, " <>
               "observed timestamp with time zone/timestamptz precision 3"
           ] = NativeStoragePolicy.first_party_timestamp_violations(catalog, [])
  end

  test "discovers every reflected native INET field while requiring the approved click field" do
    click_field = %{
      schema: ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
      database_schema: "public",
      table: "commerce_click_sessions",
      field: :ip_address,
      column: "ip_address",
      ecto_type: EctoNetwork.INET
    }

    reflected_field = %{
      schema: PersistedInetFixture,
      database_schema: "public",
      table: "native_storage_policy_inet_fixtures",
      field: :client_address,
      column: "client_address",
      ecto_type: EctoNetwork.INET
    }

    assert [
             "public.native_storage_policy_inet_fixtures.client_address " <>
               "(Elixir.ProductCompare.Repo.NativeStoragePolicyTest.PersistedInetFixture " <>
               ":client_address) expected inet/inet, observed text/text"
           ] =
             NativeStoragePolicy.inet_storage_violations([click_field, reflected_field], %{
               {"public", "commerce_click_sessions", "ip_address"} => %{
                 schema: "public",
                 data_type: "inet",
                 udt_name: "inet"
               },
               {"public", "native_storage_policy_inet_fixtures", "client_address"} => %{
                 schema: "public",
                 data_type: "text",
                 udt_name: "text"
               }
             })
  end

  test "requires the approved click field itself to remain EctoNetwork.INET" do
    assert ("public.commerce_click_sessions.ip_address " <>
              "(Elixir.ProductCompareSchemas.CommerceAttribution.CommerceClickSession " <>
              ":ip_address) expected Ecto type EctoNetwork.INET, " <>
              "observed no reflected Ecto field") in NativeStoragePolicy.inet_storage_violations(
             [],
             %{
               {"public", "commerce_click_sessions", "ip_address"} => %{
                 schema: "public",
                 data_type: "inet",
                 udt_name: "inet"
               }
             }
           )
  end

  test "keeps the approved click storage column exact while discovering reflected INET fields" do
    drifted_click_field = %{
      schema: ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
      database_schema: "public",
      table: "commerce_click_sessions",
      field: :ip_address,
      column: "other_address",
      ecto_type: EctoNetwork.INET
    }

    assert [
             "public.commerce_click_sessions.ip_address " <>
               "(Elixir.ProductCompareSchemas.CommerceAttribution.CommerceClickSession " <>
               ":ip_address) expected inet/inet, observed text/text"
           ] =
             NativeStoragePolicy.inet_storage_violations([drifted_click_field], %{
               {"public", "commerce_click_sessions", "ip_address"} => %{
                 schema: "public",
                 data_type: "text",
                 udt_name: "text"
               },
               {"public", "commerce_click_sessions", "other_address"} => %{
                 schema: "public",
                 data_type: "inet",
                 udt_name: "inet"
               }
             })
  end

  test "requires the host-only INET database constraint" do
    assert {:error, errors} = NativeStoragePolicy.validate(MissingHostConstraintRepo)

    assert Enum.any?(errors, fn error ->
             error =~
               "public.commerce_click_sessions.ip_address " <>
                 "(Elixir.ProductCompareSchemas.CommerceAttribution.CommerceClickSession " <>
                 ":ip_address) expected host-only INET constraint " <>
                 "commerce_click_sessions_ip_address_host_check"
           end)
  end

  test "reports digest and cooldown violations with their reflected Ecto fields" do
    source_artifact = %{
      schema: ProductCompareSchemas.Specs.SourceArtifact,
      database_schema: "public",
      table: "source_artifacts",
      field: :content_hash,
      column: "content_hash",
      ecto_type: :string
    }

    price_watch_rule = %{
      schema: ProductCompareSchemas.Alerts.PriceWatchRule,
      database_schema: "public",
      table: "price_watch_rules",
      field: :cooldown,
      column: "cooldown",
      ecto_type: :integer
    }

    assert ("public.source_artifacts.content_hash " <>
              "(Elixir.ProductCompareSchemas.Specs.SourceArtifact :content_hash) " <>
              "expected Ecto type :binary, observed :string") in NativeStoragePolicy.digest_storage_violations(
             [source_artifact],
             %{},
             %{}
           )

    assert ("public.source_artifacts.content_hash " <>
              "(Elixir.ProductCompareSchemas.Specs.SourceArtifact :content_hash) " <>
              "expected bytea/bytea, observed no PostgreSQL column") in NativeStoragePolicy.digest_storage_violations(
             [source_artifact],
             %{},
             %{}
           )

    assert ("public.price_watch_rules.cooldown " <>
              "(Elixir.ProductCompareSchemas.Alerts.PriceWatchRule :cooldown) " <>
              "expected Ecto type :duration, observed :integer") in NativeStoragePolicy.cooldown_storage_violations(
             [price_watch_rule],
             %{},
             %{}
           )

    assert ("public.price_watch_rules.cooldown " <>
              "(Elixir.ProductCompareSchemas.Alerts.PriceWatchRule :cooldown) " <>
              "expected interval/interval type modifier DAY TO SECOND, " <>
              "observed no PostgreSQL column") in NativeStoragePolicy.cooldown_storage_violations(
             [price_watch_rule],
             %{},
             %{}
           )
  end

  test "uses schema-qualified catalog keys and actual schema labels" do
    field = %{
      schema: PersistedInstantFixture,
      database_schema: "audit",
      table: "native_storage_policy_fixtures",
      field: :occurred_at,
      column: "occurred_at_utc"
    }

    assert [
             "audit.native_storage_policy_fixtures.occurred_at_utc " <>
               "(Elixir.ProductCompare.Repo.NativeStoragePolicyTest.PersistedInstantFixture " <>
               ":occurred_at) expected timestamp with time zone/timestamptz precision 6, " <>
               "observed timestamp without time zone/timestamp precision 6"
           ] =
             NativeStoragePolicy.utc_datetime_storage_violations([field], %{
               {"public", "native_storage_policy_fixtures", "occurred_at_utc"} => %{
                 schema: "public",
                 data_type: "timestamp with time zone",
                 udt_name: "timestamptz",
                 datetime_precision: 6
               },
               {"audit", "native_storage_policy_fixtures", "occurred_at_utc"} => %{
                 schema: "audit",
                 data_type: "timestamp without time zone",
                 udt_name: "timestamp",
                 datetime_precision: 6
               }
             })
  end

  test "accepts equivalent native-storage checks and rejects semantic changes" do
    assert NativeStoragePolicy.digest_constraint_valid?(
             "CHECK (((content_hash IS NULL) OR (octet_length((content_hash)) = 32::integer)))",
             "content_hash"
           )

    refute NativeStoragePolicy.digest_constraint_valid?(
             "CHECK (content_hash IS NULL OR octet_length(content_hash::text) = 32)",
             "content_hash"
           )

    refute NativeStoragePolicy.digest_constraint_valid?(
             "CHECK (content_hash IS NULL OR octet_length(content_hash) = 32::text)",
             "content_hash"
           )

    refute NativeStoragePolicy.digest_constraint_valid?(
             "CHECK (scope_fingerprint IS NULL OR octet_length(scope_fingerprint) = 32)",
             "content_hash"
           )

    refute NativeStoragePolicy.digest_constraint_valid?(
             "CHECK (content_hash IS NULL OR octet_length(content_hash) = 31)",
             "content_hash"
           )

    refute NativeStoragePolicy.cooldown_constraint_valid?(
             :price_watch_rules_cooldown_max_check,
             "CHECK (cooldown <= '8759:59:59'::interval)"
           )

    assert NativeStoragePolicy.cooldown_constraint_valid?(
             :price_watch_rules_cooldown_whole_seconds_check,
             "CHECK (((date_trunc('second'::text, (cooldown)) = cooldown)))"
           )

    refute NativeStoragePolicy.cooldown_constraint_valid?(
             :price_watch_rules_cooldown_whole_seconds_check,
             "CHECK (date_trunc('minute'::text, cooldown) = cooldown)"
           )
  end

  test "all compiled persisted schemas and native storage contracts use PostgreSQL-native columns" do
    assert {:ok, inventory} = NativeStoragePolicy.validate(Repo)
    assert inventory.inet_fields != []
    assert inventory.utc_datetime_fields != []

    assert inventory.digest_columns == [
             {"ingestion_runs", "scope_fingerprint"},
             {"product_attribute_claims", "fingerprint"},
             {"source_artifacts", "content_hash"}
           ]

    assert Map.get(inventory, :host_only_inet_columns) == [
             {"commerce_click_sessions", "ip_address"}
           ]
  end
end

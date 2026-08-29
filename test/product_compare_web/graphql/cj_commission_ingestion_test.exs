defmodule ProductCompareWeb.GraphQL.CJCommissionIngestionTest do
  use ProductCompareWeb.ConnCase, async: false

  import Ecto.Query

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_blocked_by: 2,
      capture_queries: 1,
      capture_select_queries: 1,
      count_select_queries_targeting_table: 2,
      hold_operator_revocation: 1,
      hold_row_lock: 3,
      release_operator_revocation: 1,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Accounts
  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.ConversionSyncRuns
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @cj_env_vars ~w(CJ_API_TOKEN CJ_ACCOUNT_ID CJ_COMMISSION_PUBLISHER_IDS)
  @sync_tables ~w(
    affiliate_networks
    commerce_conversion_sync_settings
    commerce_conversion_sync_runs
    oban_jobs
  )a

  setup %{conn: conn} do
    Enum.each(@cj_env_vars, &restore_system_env/1)
    System.put_env("CJ_API_TOKEN", "secret-test-token")
    System.put_env("CJ_ACCOUNT_ID", "secret-publisher-id")
    System.delete_env("CJ_COMMISSION_PUBLISHER_IDS")

    operator = AccountsFixtures.operator_fixture()
    member = AccountsFixtures.user_fixture()

    {:ok,
     anonymous_conn: conn,
     member_conn: conn |> log_in_user(member) |> put_req_header_same_origin(),
     operator: operator,
     operator_conn: conn |> log_in_user(operator) |> put_req_header_same_origin()}
  end

  describe "/api/graphql CJ commission ingestion reads" do
    test "anonymous and member reads are rejected before sync database access", context do
      for {request_conn, expected_code} <- [
            {context.anonymous_conn, "UNAUTHENTICATED"},
            {context.member_conn, "FORBIDDEN"}
          ],
          {query, variables} <- [
            {overview_query(), %{}},
            {runs_query(), %{"first" => 1, "after" => "not-a-cursor"}}
          ] do
        {response, queries} =
          capture_select_queries(fn -> graphql(request_conn, query, variables) end)

        assert %{
                 "data" => nil,
                 "errors" => [%{"extensions" => %{"code" => ^expected_code}} | _]
               } = response

        assert sync_query_counts(queries) == empty_sync_query_counts()
      end
    end

    test "operator reads report unavailable when CJ settings are absent", %{
      operator_conn: conn
    } do
      network_fixture()
      Repo.delete_all(ConversionSyncSetting)

      for {query, variables, field} <- [
            {overview_query(), %{}, "cjCommissionIngestion"},
            {runs_query(), %{"first" => 1}, "cjCommissionSyncRuns"}
          ] do
        assert %{
                 "data" => nil,
                 "errors" => [
                   %{
                     "message" => "CJ commission ingestion is unavailable",
                     "path" => [^field]
                   }
                   | _
                 ]
               } = graphql(conn, query, variables)
      end
    end

    test "operator reads report unavailable when the CJ network is absent", %{
      operator_conn: conn
    } do
      Repo.update_all(
        from(network in AffiliateNetwork, where: network.code == "cj"),
        set: [code: "cjmissing"]
      )

      for {query, variables, field} <- [
            {overview_query(), %{}, "cjCommissionIngestion"},
            {runs_query(), %{"first" => 1}, "cjCommissionSyncRuns"}
          ] do
        assert %{
                 "data" => nil,
                 "errors" => [
                   %{
                     "message" => "CJ commission ingestion is unavailable",
                     "path" => [^field]
                   }
                   | _
                 ]
               } = graphql(conn, query, variables)
      end
    end

    test "operator overview maps downstream database read failures to unavailable", %{
      operator_conn: conn
    } do
      ensure_settings!()
      Repo.query!("ALTER TABLE oban_jobs RENAME TO oban_jobs_unavailable")

      assert_cj_read_unavailable(graphql(conn, overview_query(), %{}), "cjCommissionIngestion")
    end

    test "operator sync-run history maps downstream database read failures to unavailable", %{
      operator_conn: conn
    } do
      ensure_settings!()

      Repo.query!(
        "ALTER TABLE commerce_conversion_sync_runs RENAME TO commerce_conversion_sync_runs_unavailable"
      )

      assert_cj_read_unavailable(
        graphql(conn, runs_query(), %{"first" => 1}),
        "cjCommissionSyncRuns"
      )
    end

    test "operator overview reads persisted settings without locking or writes", %{
      operator_conn: conn
    } do
      ensure_settings!()

      {response, queries} = capture_queries(fn -> graphql(conn, overview_query(), %{}) end)

      assert %{
               "data" => %{
                 "cjCommissionIngestion" => %{
                   "settings" => %{
                     "enabled" => false,
                     "intervalMinutes" => 1_440,
                     "lookbackDays" => 90,
                     "maxPages" => 100,
                     "nextRunAt" => nil,
                     "updatedAt" => updated_at,
                     "updatedByEmail" => nil
                   },
                   "credentials" => %{
                     "apiTokenConfigured" => true,
                     "publisherIdsConfigured" => true,
                     "ready" => true
                   },
                   "activity" => nil,
                   "latestSuccess" => nil,
                   "latestFailure" => nil
                 }
               }
             } = response

      assert {:ok, _datetime, 0} = DateTime.from_iso8601(updated_at)
      refute inspect(response) =~ "secret-test-token"
      refute inspect(response) =~ "secret-publisher-id"
      assert_read_only_queries(queries)
    end

    test "operator sync-run history reads persisted settings without locking or writes", %{
      operator_conn: conn
    } do
      ensure_settings!()

      {response, queries} =
        capture_queries(fn -> graphql(conn, runs_query(), %{"first" => 1}) end)

      assert %{"data" => %{"cjCommissionSyncRuns" => %{"edges" => []}}} = response
      assert_read_only_queries(queries)
    end

    test "operator overview projects only safe active-job and latest-run state", %{
      operator: operator,
      operator_conn: conn
    } do
      ensure_settings!()

      success =
        run_fixture(%{
          status: :succeeded,
          requested_by_user_id: operator.id,
          started_at: ~U[2026-08-27 09:00:00Z],
          finished_at: ~U[2026-08-27 09:01:00Z],
          cursor: "safe-success-cursor",
          pages_fetched: 2,
          records_fetched: 5,
          records_persisted: 5
        })

      failure =
        run_fixture(%{
          status: :failed,
          trigger: :scheduled,
          requested_by_user_id: nil,
          started_at: ~U[2026-08-27 10:00:00Z],
          finished_at: ~U[2026-08-27 10:01:00Z],
          cursor: "safe-failure-cursor",
          records_fetched: 3,
          records_persisted: 1,
          records_failed: 2,
          error_summary: "transient_provider_failure"
        })

      other_network = network_fixture("impact")

      run_fixture(%{
        affiliate_network_id: other_network.id,
        status: :succeeded,
        started_at: ~U[2026-08-27 11:00:00Z],
        finished_at: ~U[2026-08-27 11:01:00Z],
        error_summary: nil
      })

      run_fixture(%{
        affiliate_network_id: other_network.id,
        status: :failed,
        started_at: ~U[2026-08-27 12:00:00Z],
        finished_at: ~U[2026-08-27 12:01:00Z],
        error_summary: "non_cj_failure"
      })

      assert {:ok, job} =
               CJCommissionSyncWorker.enqueue(
                 publisher_ids: ["secret-publisher-id"],
                 from: ~U[2026-08-20 12:00:00Z],
                 before: ~U[2026-08-27 12:00:00Z],
                 max_pages: 100,
                 trigger: :operator,
                 requested_by_user_id: operator.id,
                 schedule_window: ~U[2026-08-27 12:00:00Z]
               )

      Repo.update_all(
        from(oban_job in Oban.Job, where: oban_job.id == ^job.id),
        set: [state: "executing", attempted_at: ~U[2026-08-27 12:00:30Z]]
      )

      response = graphql(conn, overview_query(), %{})

      assert %{
               "data" => %{
                 "cjCommissionIngestion" => %{
                   "activity" => %{
                     "state" => "EXECUTING",
                     "windowStart" => "2026-08-20T12:00:00Z",
                     "windowEnd" => "2026-08-27T12:00:00Z",
                     "scheduledAt" => scheduled_at,
                     "attemptedAt" => "2026-08-27T12:00:30.000000Z"
                   },
                   "latestSuccess" => %{
                     "id" => success_id,
                     "status" => "SUCCEEDED",
                     "trigger" => "OPERATOR",
                     "requesterEmail" => requester_email,
                     "errorSummary" => nil
                   },
                   "latestFailure" => %{
                     "id" => failure_id,
                     "status" => "FAILED",
                     "trigger" => "SCHEDULED",
                     "requesterEmail" => nil,
                     "errorSummary" => "transient_provider_failure"
                   }
                 }
               }
             } = response

      assert {:ok, _scheduled_at, 0} = DateTime.from_iso8601(scheduled_at)
      assert success_id == relay_id(:cj_commission_sync_run, success.entropy_id)
      assert failure_id == relay_id(:cj_commission_sync_run, failure.entropy_id)
      assert requester_email == operator.email
      refute inspect(response) =~ "secret-test-token"
      refute inspect(response) =~ "secret-publisher-id"
      refute inspect(response) =~ "publisher_ids"
    end

    test "sync runs use newest-first cursor pagination with an id tie-breaker", %{
      operator: operator,
      operator_conn: conn
    } do
      ensure_settings!()

      older =
        run_fixture(%{
          status: :failed,
          started_at: ~U[2026-08-27 08:00:00Z],
          finished_at: ~U[2026-08-27 08:01:00Z],
          error_summary: "older_failure"
        })

      first_tied =
        run_fixture(%{
          status: :succeeded,
          requested_by_user_id: operator.id,
          started_at: ~U[2026-08-27 09:00:00Z],
          finished_at: ~U[2026-08-27 09:01:00Z]
        })

      second_tied =
        run_fixture(%{
          status: :failed,
          started_at: ~U[2026-08-27 09:00:00Z],
          finished_at: ~U[2026-08-27 09:02:00Z],
          error_summary: "newer_failure"
        })

      other_network = network_fixture("impact")

      run_fixture(%{
        affiliate_network_id: other_network.id,
        status: :succeeded,
        started_at: ~U[2026-08-27 10:00:00Z],
        finished_at: ~U[2026-08-27 10:01:00Z]
      })

      run_fixture(%{
        affiliate_network_id: other_network.id,
        status: :failed,
        started_at: ~U[2026-08-27 11:00:00Z],
        finished_at: ~U[2026-08-27 11:01:00Z],
        error_summary: "non_cj_failure"
      })

      assert %{
               "data" => %{
                 "cjCommissionSyncRuns" => %{
                   "edges" => [
                     %{"cursor" => first_cursor, "node" => first_node},
                     %{"cursor" => second_cursor, "node" => second_node}
                   ],
                   "pageInfo" => page_info
                 }
               }
             } = graphql(conn, runs_query(), %{"first" => 2})

      assert first_node["id"] == relay_id(:cj_commission_sync_run, second_tied.entropy_id)
      assert first_node["errorSummary"] == "newer_failure"
      assert second_node["id"] == relay_id(:cj_commission_sync_run, first_tied.entropy_id)
      assert second_node["requesterEmail"] == operator.email

      assert page_info == %{
               "endCursor" => second_cursor,
               "hasNextPage" => true,
               "hasPreviousPage" => false,
               "startCursor" => first_cursor
             }

      run_fixture(%{
        status: :succeeded,
        started_at: ~U[2026-08-27 10:00:00Z],
        finished_at: ~U[2026-08-27 10:01:00Z]
      })

      assert %{
               "data" => %{
                 "cjCommissionSyncRuns" => %{
                   "edges" => [%{"node" => %{"id" => older_id}}],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } =
               graphql(conn, runs_query(), %{
                 "first" => 2,
                 "after" => second_cursor
               })

      assert older_id == relay_id(:cj_commission_sync_run, older.entropy_id)
    end

    test "the schema exposes only the operator contract and omits secret-bearing fields", %{
      operator_conn: conn
    } do
      assert %{
               "data" => %{
                 "ingestion" => %{"fields" => ingestion_fields},
                 "settings" => %{"inputFields" => nil, "fields" => settings_fields},
                 "credentials" => %{"fields" => credential_fields},
                 "activity" => %{"fields" => activity_fields},
                 "run" => %{"fields" => run_fields},
                 "input" => %{"inputFields" => input_fields},
                 "payload" => %{"fields" => payload_fields},
                 "query" => %{"fields" => query_fields},
                 "mutation" => %{"fields" => mutation_fields}
               }
             } = graphql(conn, introspection_query(), %{})

      assert field_names(ingestion_fields) ==
               ~w(activity credentials latestFailure latestSuccess settings)

      assert field_names(settings_fields) ==
               ~w(enabled intervalMinutes lookbackDays maxPages nextRunAt updatedAt updatedByEmail)

      assert field_names(credential_fields) ==
               ~w(apiTokenConfigured publisherIdsConfigured ready)

      assert field_names(activity_fields) ==
               ~w(attemptedAt scheduledAt state windowEnd windowStart)

      assert field_names(run_fields) ==
               ~w(cursor errorSummary finishedAt id pagesFetched recordsFailed recordsFetched recordsPersisted requesterEmail startedAt status trigger windowEnd windowStart)

      assert input_field_names(input_fields) ==
               ~w(enabled intervalMinutes lookbackDays maxPages)

      assert field_names(payload_fields) == ~w(errors ingestion)

      query_names = field_names(query_fields)
      mutation_names = field_names(mutation_fields)
      assert "cjCommissionIngestion" in query_names
      assert "cjCommissionSyncRuns" in query_names
      assert "updateCjCommissionIngestionSettings" in mutation_names
      assert "runCjCommissionIngestionNow" in mutation_names

      safe_configuration_fields = ~w(apiTokenConfigured publisherIdsConfigured)

      exposed_names =
        Enum.flat_map(
          [
            ingestion_fields,
            settings_fields,
            credential_fields,
            activity_fields,
            run_fields,
            input_fields,
            payload_fields
          ],
          &Enum.map(&1, fn field -> field["name"] end)
        )

      refute Enum.any?(exposed_names -- safe_configuration_fields, fn name ->
               String.match?(
                 name,
                 ~r/(token|authorization|publisher|accountId|raw|payload|requestHeaders|oban|args|exception)/i
               )
             end)
    end
  end

  describe "/api/graphql CJ commission ingestion mutations" do
    test "anonymous and member mutations return typed errors before sync database access",
         context do
      for {request_conn, expected_code} <- [
            {context.anonymous_conn, "UNAUTHENTICATED"},
            {context.member_conn, "FORBIDDEN"}
          ],
          {query, variables, mutation_name} <- [
            {update_settings_mutation(), %{"input" => %{"lookbackDays" => 30}},
             "updateCjCommissionIngestionSettings"},
            {run_now_mutation(), %{}, "runCjCommissionIngestionNow"}
          ] do
        {response, queries} =
          capture_select_queries(fn -> graphql(request_conn, query, variables) end)

        assert %{
                 "data" => %{
                   ^mutation_name => %{
                     "ingestion" => nil,
                     "errors" => [%{"code" => ^expected_code, "field" => nil}]
                   }
                 }
               } = response

        assert sync_query_counts(queries) == empty_sync_query_counts()
      end
    end

    test "settings update accepts only the four editable fields and records the operator", %{
      operator: operator,
      operator_conn: conn
    } do
      ensure_settings!()

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "ingestion" => %{
                     "settings" => %{
                       "enabled" => false,
                       "intervalMinutes" => 60,
                       "lookbackDays" => 30,
                       "maxPages" => 5,
                       "nextRunAt" => nil,
                       "updatedByEmail" => updated_by_email
                     }
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(conn, update_settings_mutation(), %{
                 "input" => %{
                   "intervalMinutes" => 60,
                   "lookbackDays" => 30,
                   "maxPages" => 5
                 }
               })

      assert updated_by_email == operator.email
    end

    test "an applied settings update reports a distinct error when its post-commit read fails", %{
      operator_conn: conn
    } do
      settings = ensure_settings!()
      Repo.query!("ALTER TABLE oban_jobs RENAME TO oban_jobs_unavailable")

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "errors" => [
                     %{
                       "code" => "INGESTION_UNAVAILABLE",
                       "field" => nil,
                       "message" =>
                         "the change was applied but CJ commission ingestion state could not be read"
                     }
                   ],
                   "ingestion" => nil
                 }
               }
             } =
               graphql(conn, update_settings_mutation(), %{
                 "input" => %{"lookbackDays" => 30}
               })

      assert Repo.get!(ConversionSyncSetting, settings.id).lookback_days == 30
    end

    test "settings update returns INVALID_ARGUMENT for each invalid field", %{
      operator_conn: conn
    } do
      settings = ensure_settings!()

      for {input, field} <- [
            {%{"enabled" => nil}, "enabled"},
            {%{"intervalMinutes" => 14}, "intervalMinutes"},
            {%{"lookbackDays" => 0}, "lookbackDays"},
            {%{"maxPages" => 0}, "maxPages"}
          ] do
        assert %{
                 "data" => %{
                   "updateCjCommissionIngestionSettings" => %{
                     "ingestion" => nil,
                     "errors" => [
                       %{"code" => "INVALID_ARGUMENT", "field" => ^field, "message" => message}
                     ]
                   }
                 }
               } = graphql(conn, update_settings_mutation(), %{"input" => input})

        assert is_binary(message) and message != ""
      end

      assert %ConversionSyncSetting{
               enabled: false,
               interval_minutes: 1_440,
               lookback_days: 90,
               max_pages: 100,
               next_run_at: nil
             } = Repo.get!(ConversionSyncSetting, settings.id)
    end

    test "enabling requires configured credentials", %{operator_conn: conn} do
      settings = ensure_settings!()
      Enum.each(@cj_env_vars, &System.delete_env/1)

      assert_typed_mutation_error(
        graphql(conn, update_settings_mutation(), %{"input" => %{"enabled" => true}}),
        "updateCjCommissionIngestionSettings",
        "CREDENTIALS_MISSING"
      )

      refute Repo.get!(ConversionSyncSetting, settings.id).enabled
    end

    test "enabling requires an existing successful run", %{operator_conn: conn} do
      settings = ensure_settings!()

      run_fixture(%{
        status: :failed,
        finished_at: ~U[2026-08-27 10:01:00Z],
        error_summary: "transient_provider_failure"
      })

      assert_typed_mutation_error(
        graphql(conn, update_settings_mutation(), %{"input" => %{"enabled" => true}}),
        "updateCjCommissionIngestionSettings",
        "ACTIVATION_NOT_READY"
      )

      refute Repo.get!(ConversionSyncSetting, settings.id).enabled
    end

    test "a successful run for another network does not satisfy CJ activation", %{
      operator_conn: conn
    } do
      settings = ensure_settings!()
      other_network = network_fixture("impact")

      run_fixture(%{
        affiliate_network_id: other_network.id,
        status: :succeeded,
        finished_at: ~U[2026-08-27 10:01:00Z]
      })

      assert_typed_mutation_error(
        graphql(conn, update_settings_mutation(), %{"input" => %{"enabled" => true}}),
        "updateCjCommissionIngestionSettings",
        "ACTIVATION_NOT_READY"
      )

      refute Repo.get!(ConversionSyncSetting, settings.id).enabled
    end

    test "successful activation schedules cadence and disabling clears it", %{
      operator_conn: conn
    } do
      settings = ensure_settings!()
      run_fixture(%{status: :succeeded, finished_at: ~U[2026-08-27 10:01:00Z]})

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "ingestion" => %{
                     "settings" => %{
                       "enabled" => true,
                       "nextRunAt" => next_run_at
                     }
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(conn, update_settings_mutation(), %{
                 "input" => %{"enabled" => true, "intervalMinutes" => 30}
               })

      assert is_binary(next_run_at)

      assert %ConversionSyncSetting{enabled: true, next_run_at: %DateTime{}} =
               Repo.get!(ConversionSyncSetting, settings.id)

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "ingestion" => %{
                     "settings" => %{"enabled" => false, "nextRunAt" => nil}
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(conn, update_settings_mutation(), %{"input" => %{"enabled" => false}})

      assert %ConversionSyncSetting{enabled: false, next_run_at: nil} =
               Repo.get!(ConversionSyncSetting, settings.id)
    end

    test "run now reports missing credentials without enqueueing work", %{operator_conn: conn} do
      ensure_settings!()
      Enum.each(@cj_env_vars, &System.delete_env/1)

      assert_typed_mutation_error(
        graphql(conn, run_now_mutation(), %{}),
        "runCjCommissionIngestionNow",
        "CREDENTIALS_MISSING"
      )

      assert Repo.aggregate(sync_job_query(), :count, :id) == 0
    end

    test "run now deduplicates active work, preserves cadence, and redacts job arguments", %{
      operator_conn: conn
    } do
      settings = ensure_settings!()
      run_fixture(%{status: :succeeded, finished_at: ~U[2026-08-27 10:01:00Z]})

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "errors" => [],
                   "ingestion" => %{"settings" => %{"nextRunAt" => next_run_at}}
                 }
               }
             } =
               graphql(conn, update_settings_mutation(), %{
                 "input" => %{"enabled" => true, "lookbackDays" => 7}
               })

      first_response = graphql(conn, run_now_mutation(), %{})

      assert %{
               "data" => %{
                 "runCjCommissionIngestionNow" => %{
                   "ingestion" => %{
                     "activity" => %{
                       "state" => "AVAILABLE",
                       "windowStart" => window_start,
                       "windowEnd" => window_end
                     },
                     "settings" => %{"nextRunAt" => ^next_run_at}
                   },
                   "errors" => []
                 }
               }
             } = first_response

      assert {:ok, _window_start, 0} = DateTime.from_iso8601(window_start)
      assert {:ok, _window_end, 0} = DateTime.from_iso8601(window_end)
      assert Repo.aggregate(sync_job_query(), :count, :id) == 1

      second_response = graphql(conn, run_now_mutation(), %{})

      assert %{
               "data" => %{
                 "runCjCommissionIngestionNow" => %{
                   "ingestion" => %{"settings" => %{"nextRunAt" => ^next_run_at}},
                   "errors" => []
                 }
               }
             } = second_response

      assert Repo.aggregate(sync_job_query(), :count, :id) == 1

      assert Repo.get!(ConversionSyncSetting, settings.id).next_run_at ==
               DateTime.from_iso8601(next_run_at) |> then(fn {:ok, value, 0} -> value end)

      refute inspect(first_response) =~ "secret-test-token"
      refute inspect(first_response) =~ "secret-publisher-id"
      refute inspect(first_response) =~ "publisher_ids"
    end

    test "settings update waits for revocation and rejects the revoked operator" do
      fixture = committed_ingestion_fixture()
      on_exit(fn -> delete_committed_ingestion_fixture(fixture) end)

      {revocation, revocation_backend_pid} = hold_operator_revocation(fixture.operator.id)

      {mutation, mutation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(
            api_token_conn(fixture.token),
            update_settings_mutation(),
            %{"input" => %{"lookbackDays" => 30}}
          )
        end)

      assert_blocked_by(mutation_backend_pid, revocation_backend_pid)
      release_operator_revocation(revocation)

      assert_typed_mutation_error(
        Task.await(mutation),
        "updateCjCommissionIngestionSettings",
        "FORBIDDEN"
      )

      assert %ConversionSyncSetting{lookback_days: 90} =
               Repo.get!(ConversionSyncSetting, fixture.settings.id)
    end

    test "run now waits for revocation and rejects the revoked operator without a job" do
      fixture = committed_ingestion_fixture()
      on_exit(fn -> delete_committed_ingestion_fixture(fixture) end)

      {revocation, revocation_backend_pid} = hold_operator_revocation(fixture.operator.id)

      {mutation, mutation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(api_token_conn(fixture.token), run_now_mutation(), %{})
        end)

      assert_blocked_by(mutation_backend_pid, revocation_backend_pid)
      release_operator_revocation(revocation)

      assert_typed_mutation_error(
        Task.await(mutation),
        "runCjCommissionIngestionNow",
        "FORBIDDEN"
      )

      assert Repo.aggregate(sync_job_query(), :count, :id) == 0
    end

    test "settings update holds operator access while waiting for the settings row" do
      fixture = committed_ingestion_fixture()
      on_exit(fn -> delete_committed_ingestion_fixture(fixture) end)

      {settings_barrier, settings_backend_pid} =
        hold_row_lock(ConversionSyncSetting, fixture.settings.id, & &1)

      {mutation, mutation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(
            api_token_conn(fixture.token),
            update_settings_mutation(),
            %{"input" => %{"lookbackDays" => 30}}
          )
        end)

      assert_blocked_by(mutation_backend_pid, settings_backend_pid)

      {revocation, revocation_backend_pid} =
        start_unboxed_action(fn ->
          fixture.operator
          |> Repo.reload!()
          |> Accounts.set_operator_access(false)
        end)

      assert_blocked_by(revocation_backend_pid, mutation_backend_pid)
      release_row_lock(settings_barrier)

      assert %{
               "data" => %{
                 "updateCjCommissionIngestionSettings" => %{
                   "ingestion" => %{"settings" => %{"lookbackDays" => 30}},
                   "errors" => []
                 }
               }
             } = Task.await(mutation)

      assert {:ok, %User{is_operator: false}} = Task.await(revocation)

      assert %ConversionSyncSetting{lookback_days: 30} =
               Repo.get!(ConversionSyncSetting, fixture.settings.id)
    end

    test "run now holds operator access while waiting for the settings row" do
      fixture = committed_ingestion_fixture()
      on_exit(fn -> delete_committed_ingestion_fixture(fixture) end)

      {settings_barrier, settings_backend_pid} =
        hold_row_lock(ConversionSyncSetting, fixture.settings.id, & &1)

      {mutation, mutation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(api_token_conn(fixture.token), run_now_mutation(), %{})
        end)

      assert_blocked_by(mutation_backend_pid, settings_backend_pid)

      {revocation, revocation_backend_pid} =
        start_unboxed_action(fn ->
          fixture.operator
          |> Repo.reload!()
          |> Accounts.set_operator_access(false)
        end)

      assert_blocked_by(revocation_backend_pid, mutation_backend_pid)
      release_row_lock(settings_barrier)

      assert %{
               "data" => %{
                 "runCjCommissionIngestionNow" => %{
                   "ingestion" => %{"activity" => %{"state" => "AVAILABLE"}},
                   "errors" => []
                 }
               }
             } = Task.await(mutation)

      assert {:ok, %User{is_operator: false}} = Task.await(revocation)
      assert Repo.aggregate(sync_job_query(), :count, :id) == 1
    end
  end

  defp overview_query do
    """
    query CJCommissionIngestion {
      cjCommissionIngestion {
        settings {
          enabled intervalMinutes lookbackDays maxPages nextRunAt updatedAt updatedByEmail
        }
        credentials { apiTokenConfigured publisherIdsConfigured ready }
        activity { state windowStart windowEnd scheduledAt attemptedAt }
        latestSuccess { id status trigger requesterEmail errorSummary }
        latestFailure { id status trigger requesterEmail errorSummary }
      }
    }
    """
  end

  defp runs_query do
    """
    query CJCommissionSyncRuns($first: Int!, $after: String) {
      cjCommissionSyncRuns(first: $first, after: $after) {
        edges {
          cursor
          node {
            id status trigger requesterEmail windowStart windowEnd cursor
            pagesFetched recordsFetched recordsPersisted recordsFailed
            startedAt finishedAt errorSummary
          }
        }
        pageInfo { startCursor endCursor hasNextPage hasPreviousPage }
      }
    }
    """
  end

  defp update_settings_mutation do
    """
    mutation UpdateCJCommissionIngestionSettings($input: UpdateCJCommissionIngestionSettingsInput!) {
      updateCjCommissionIngestionSettings(input: $input) {
        ingestion {
          settings {
            enabled intervalMinutes lookbackDays maxPages nextRunAt updatedAt updatedByEmail
          }
          credentials { apiTokenConfigured publisherIdsConfigured ready }
          activity { state windowStart windowEnd scheduledAt attemptedAt }
          latestSuccess { id status trigger requesterEmail errorSummary }
          latestFailure { id status trigger requesterEmail errorSummary }
        }
        errors { code message field }
      }
    }
    """
  end

  defp run_now_mutation do
    """
    mutation RunCJCommissionIngestionNow {
      runCjCommissionIngestionNow {
        ingestion {
          settings { enabled nextRunAt }
          activity { state windowStart windowEnd scheduledAt attemptedAt }
        }
        errors { code message field }
      }
    }
    """
  end

  defp introspection_query do
    """
    query CJCommissionIngestionIntrospection {
      ingestion: __type(name: "CJCommissionIngestion") { fields { name } }
      settings: __type(name: "CJCommissionIngestionSettings") {
        fields { name }
        inputFields { name }
      }
      credentials: __type(name: "CJCommissionCredentialStatus") { fields { name } }
      activity: __type(name: "CJCommissionIngestionActivity") { fields { name } }
      run: __type(name: "CJCommissionSyncRun") { fields { name } }
      input: __type(name: "UpdateCJCommissionIngestionSettingsInput") {
        inputFields { name }
      }
      payload: __type(name: "CJCommissionIngestionPayload") { fields { name } }
      query: __type(name: "RootQueryType") { fields { name } }
      mutation: __type(name: "RootMutationType") { fields { name } }
    }
    """
  end

  defp field_names(fields), do: fields |> Enum.map(& &1["name"]) |> Enum.sort()
  defp input_field_names(fields), do: fields |> Enum.map(& &1["name"]) |> Enum.sort()

  defp assert_typed_mutation_error(response, mutation_name, code) do
    assert %{
             "data" => %{
               ^mutation_name => %{
                 "ingestion" => nil,
                 "errors" => [%{"code" => ^code, "field" => nil, "message" => message}]
               }
             }
           } = response

    assert is_binary(message) and message != ""
  end

  defp ensure_settings! do
    network_fixture()
    assert {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

    settings
    |> ConversionSyncSetting.changeset(default_setting_attrs())
    |> Repo.update!()
  end

  defp network_fixture(code \\ "cj") do
    case Repo.get_by(AffiliateNetwork, code: code) do
      %AffiliateNetwork{} = network ->
        network

      nil ->
        assert {:ok, network} =
                 Affiliate.upsert_network(%{code: code, name: String.upcase(code)})

        network
    end
  end

  defp run_fixture(attrs) do
    affiliate_network_id =
      Map.get_lazy(attrs, :affiliate_network_id, fn -> network_fixture().id end)

    started_at = Map.get(attrs, :started_at, ~U[2026-08-27 10:00:00Z])
    status = Map.get(attrs, :status, :running)

    start_attrs =
      %{
        affiliate_network_id: affiliate_network_id,
        trigger: Map.get(attrs, :trigger, :operator),
        requested_by_user_id: Map.get(attrs, :requested_by_user_id),
        window_start: Map.get(attrs, :window_start, ~U[2026-08-20 00:00:00Z]),
        window_end: Map.get(attrs, :window_end, ~U[2026-08-27 00:00:00Z]),
        cursor: Map.get(attrs, :cursor),
        pages_fetched: 0,
        records_fetched: 0,
        records_persisted: 0,
        records_failed: 0
      }

    assert {:ok, run} = ConversionSyncRuns.start(start_attrs, started_at)

    if status == :running do
      run
    else
      completion_attrs =
        Map.take(attrs, [
          :cursor,
          :pages_fetched,
          :records_fetched,
          :records_persisted,
          :records_failed,
          :error_summary
        ])
        |> Map.put(:status, status)

      finished_at = Map.fetch!(attrs, :finished_at)
      assert {:ok, completed} = ConversionSyncRuns.complete(run, completion_attrs, finished_at)
      completed
    end
  end

  defp sync_job_query do
    from job in Oban.Job, where: job.worker == ^inspect(CJCommissionSyncWorker)
  end

  defp committed_ingestion_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      operator = AccountsFixtures.operator_fixture()
      {:ok, %{plain_text_token: token}} = Accounts.create_api_token(operator.id, %{})

      {network, network_created?} =
        case Repo.get_by(AffiliateNetwork, code: "cj") do
          %AffiliateNetwork{} = network ->
            {network, false}

          nil ->
            {:ok, network} = Affiliate.upsert_network(%{code: "cj", name: "CJ"})
            {network, true}
        end

      settings_before = Repo.get_by(ConversionSyncSetting, affiliate_network_id: network.id)
      {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

      settings =
        settings
        |> ConversionSyncSetting.changeset(default_setting_attrs())
        |> Repo.update!()

      existing_job_ids = Repo.all(select(sync_job_query(), [job], job.id))

      %{
        existing_job_ids: existing_job_ids,
        network: network,
        network_created?: network_created?,
        operator: operator,
        original_settings: settings_before,
        settings: settings,
        settings_created?: is_nil(settings_before),
        token: token
      }
    end)
  end

  defp delete_committed_ingestion_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      new_jobs =
        if fixture.existing_job_ids == [] do
          sync_job_query()
        else
          from job in sync_job_query(), where: job.id not in ^fixture.existing_job_ids
        end

      Repo.delete_all(new_jobs)

      if fixture.settings_created? do
        Repo.delete_all(
          from setting in ConversionSyncSetting, where: setting.id == ^fixture.settings.id
        )
      else
        original = fixture.original_settings

        Repo.update_all(
          from(setting in ConversionSyncSetting, where: setting.id == ^fixture.settings.id),
          set: [
            enabled: original.enabled,
            interval_minutes: original.interval_minutes,
            lookback_days: original.lookback_days,
            max_pages: original.max_pages,
            next_run_at: original.next_run_at,
            updated_by_user_id: original.updated_by_user_id,
            updated_at: original.updated_at
          ]
        )
      end

      Repo.delete_all(from user in User, where: user.id == ^fixture.operator.id)

      if fixture.network_created? do
        Repo.delete_all(
          from network in AffiliateNetwork, where: network.id == ^fixture.network.id
        )
      end
    end)
  end

  defp api_token_conn(token) do
    build_conn()
    |> put_req_header("authorization", "Bearer #{token}")
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp sync_query_counts(queries) do
    Map.new(@sync_tables, &{&1, count_select_queries_targeting_table(queries, &1)})
  end

  defp assert_read_only_queries(queries) do
    refute Enum.any?(queries, &(&1 in ["begin", "commit", "rollback"]))
    refute Enum.any?(queries, &String.contains?(&1, "FOR UPDATE"))

    refute Enum.any?(queries, fn query ->
             Regex.match?(~r/^\s*(INSERT|UPDATE|DELETE)/i, query)
           end)
  end

  defp assert_cj_read_unavailable(response, field) do
    assert %{
             "data" => nil,
             "errors" => [
               %{
                 "message" => "CJ commission ingestion is unavailable",
                 "path" => [^field]
               }
               | _
             ]
           } = response
  end

  defp empty_sync_query_counts, do: Map.new(@sync_tables, &{&1, 0})

  defp default_setting_attrs do
    %{
      enabled: false,
      interval_minutes: 1_440,
      lookback_days: 90,
      max_pages: 100,
      next_run_at: nil,
      updated_by_user_id: nil
    }
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
end

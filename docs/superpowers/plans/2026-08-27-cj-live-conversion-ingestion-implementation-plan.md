# CJ Live Conversion Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingest current CJ publisher commissions into Commerce Attribution and give operators a safe workspace for monitoring runs, triggering a bounded sync, and changing durable non-secret scheduling settings.

**Architecture:** Keep CJ transport and correction semantics provider-specific under Commerce Attribution, persist run evidence and schedule policy in focused schemas, and use one database-claimed dispatcher to enqueue bounded Oban work. Expose only secret-safe operator GraphQL projections to a lazy Relay route whose overview remains usable when deferred run history fails.

**Tech Stack:** Elixir 1.19, Phoenix 1.8, Ecto/PostgreSQL, Req, Oban 2.23, Absinthe/Relay, React 19, React Router 7, Relay 21, TanStack Table 9, Base UI, StyleX, Vitest, Testing Library, Playwright, axe

**Spec:** `docs/superpowers/specs/2026-08-27-cj-live-conversion-ingestion-design.md`

## Global Constraints

- Use CJ Commission Detail GraphQL at `https://commissions.api.cj.com/query` with bearer authentication, `publisherCommissions`, inclusive `sincePostingDate`, exclusive `beforePostingDate`, and `maxCommissionId` to `sinceCommissionId` continuation.
- Select `commissionId`, `original`, `originalActionId`, `correctionReason`, `actionStatus`, `shopperId`, `eventDate`, `postingDate`, `saleAmountUsd`, and `pubCommissionAmountUsd`; use `shopperId`, retaining only inbound fixture compatibility for legacy `sid`.
- Map `new` and `extended` to pending; map `locked` and `closed` to approved; do not claim payout confirmation from `closed`.
- Treat non-original records as conservative action-level reversals. Never create a second positive conversion, take an absolute value, invent a delta, or reverse an uncorrelated action.
- Keep the existing unique conversion identity `(affiliate_network_id, network_conversion_ref)` and add nullable `network_action_ref` only as provider evidence.
- Do not hold a database transaction across network calls. Fetch the complete bounded window first; persist each action-correlated group atomically with originals before corrections so concurrent complete runs converge and earlier completed groups survive a later group failure.
- Settings are database-authoritative after first creation: interval `15..10_080` minutes, lookback `1..90` days, maximum pages `1..100`, defaults `1_440`, `90`, and `100`, and enabled false.
- Environment values may seed defaults once. `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`, and optional `CJ_COMMISSION_PUBLISHER_IDS` remain deployment-managed and never appear in GraphQL, logs, run evidence, or browser state.
- The dispatcher checks every 60 seconds, claims due settings with `FOR UPDATE SKIP LOCKED`, advances from claim time, and emits no catch-up fan-out.
- Saving enabled state or cadence updates `next_run_at` immediately; `Run now` is explicit, deduplicates queued/running work, and never moves scheduled cadence.
- Require operator authorization before reads. For mutations, lock the operator before the settings row so concurrent revocation fails closed and no inverse lock order is introduced.
- Every application-owned same-row PostgreSQL check reachable through a changeset must have pre-write validation, a named `check_constraint/3` mapping, changeset behavior coverage, and direct database coverage.
- The operator route is `/commerce/revenue/ingestion`; Revenue links to it, but financial reporting and ingest control remain separate ownership surfaces.
- Preserve the accepted operator UI: warm mineral/paper surfaces, Instrument Sans plus IBM Plex Mono, quiet dividers, one blue action accent, 44-pixel targets, visible text for status, reduced-motion parity, contained tables, and no dashboard-card mosaic.
- Preload overview and run history concurrently. Keep history deferred behind its own Suspense/error boundary. Poll only the overview every 10 seconds while visible activity is queued or running, then stop and refresh history once at terminal state.
- Do not add a provider registry, generic cursor protocol, webhook, subscription, websocket status layer, bearer-token browser flow, production email transport, or unrelated provider implementation.
- Write a focused failing test before each production slice, witness the expected RED failure, implement the minimum coherent change, rerun GREEN, and commit at milestone boundaries.

---

## File Responsibility Map

### Persistence and domain ownership

- `priv/repo/migrations/20260827120000_add_cj_conversion_sync_storage.exs` adds `network_action_ref`, sync settings, sync runs, indexes, foreign keys, and named checks.
- `lib/product_compare_schemas/commerce_attribution/commerce_conversion.ex` accepts `network_action_ref` through the existing conversion changeset.
- `lib/product_compare_schemas/commerce_attribution/conversion_sync_setting.ex` owns the persisted schedule policy and all same-row validation/constraint mappings.
- `lib/product_compare_schemas/commerce_attribution/conversion_sync_run.ex` owns secret-safe run evidence and terminal/count/window checks.
- `lib/product_compare/commerce_attribution/conversion_sync_settings.ex` owns CJ settings bootstrap, locked updates, due claims, and enablement readiness.
- `lib/product_compare/commerce_attribution/conversion_sync_runs.ex` owns run start/completion and newest-first query projection.
- `lib/product_compare/commerce_attribution/conversions/persistence.ex` owns original upserts and locked action-level correction writes.
- `lib/product_compare/commerce_attribution/conversions.ex` and `lib/product_compare/commerce_attribution.ex` remain the stable facades.

### Provider transport and execution

- `lib/product_compare/commerce_attribution/cj/client.ex` owns the exact CJ request, credential readiness, one-page validation, and redacted errors.
- `lib/product_compare/commerce_attribution/cj/importer.ex` owns bounded page traversal, cursor validation, action grouping, run counts, and truthful completion.
- `lib/product_compare/commerce_attribution/cj_adapter.ex` owns current CJ field/status/money/click normalization.
- `lib/product_compare/commerce_attribution/jobs/cj_commission_sync_worker.ex` owns safe Oban arguments, active-state uniqueness, and importer execution.
- `lib/product_compare/commerce_attribution/cj_commission_sync_dispatcher.ex` owns the fixed process tick and delegates the transactional due claim.
- `lib/product_compare/commerce_attribution/cj_commission_sync_jobs.ex` owns queued/running safe projection and operator `Run now` deduplication.
- `lib/mix/tasks/product_compare.commerce_attribution.cj_commissions.ex` is the manual CLI entrypoint.
- `lib/mix/tasks/product_compare/commerce_attribution/cj_commissions/options.ex` owns strict bounded CLI parsing.
- `lib/product_compare/application.ex`, `config/runtime.exs`, and `.env.example` own supervision and bootstrap configuration only.

### GraphQL and browser ownership

- `lib/product_compare_web/schema/commerce_attribution/types.ex`, `queries.ex`, and `mutations.ex` define the operator contract.
- `lib/product_compare_web/resolvers/commerce_attribution/reads.ex` projects settings, readiness, active state, and run connections after authorization.
- `lib/product_compare_web/resolvers/commerce_attribution/mutations.ex` owns typed payloads and the operator-first transaction order.
- `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionRoute.tsx` owns route preload composition, overview refetching, and failure boundaries.
- `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionStatus.tsx` owns credential, active, freshness, and next-run presentation.
- `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionSettings.tsx` owns the bounded settings form and local mutation feedback.
- `assets/src/routes/commerce/revenue/ingestion/ConversionSyncRunLedger.tsx` owns the TanStack run table and inline sanitized failure evidence.
- `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionOperations.ts` owns Relay mutation documents.
- `assets/src/routes/commerce/revenue/ingestion/conversion-ingestion-data.ts` owns pure formatting, form variables, pagination URLs, and mutation outcomes without parallel Relay types.
- `assets/src/routes/config/operator-routes.tsx`, `assets/src/routes/RootDestinations.tsx`, and `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx` own discoverability and cross-links.

### Tests and generated contracts

- Backend focused tests live under `test/product_compare/commerce_attribution/`, `test/product_compare/repo/`, `test/product_compare_web/graphql/`, and `test/mix/tasks/` with provider fixture `test/support/fixtures/cj/commission_detail_sample.redacted.json`.
- Frontend focused tests live under `assets/test/routes/commerce/revenue/ingestion/`; route/navigation regressions remain in existing revenue, root, and router tests.
- `assets/schema.graphql` and `assets/src/__generated__/**` are regenerated outputs, never handwritten substitutes.
- `assets/tests/e2e/production-ui-operations.spec.ts` owns responsive, mutation, failure-isolation, active-refresh, and axe evidence.
- `docs/work/cj-live-conversion-ingestion.md`, `docs/work/index.md`, and `docs/plans/INDEX.md` own lane evidence, live dispatch, and catalog state.

---

### Task 1: Add conversion sync storage and focused context owners

**Files:**
- Create: `priv/repo/migrations/20260827120000_add_cj_conversion_sync_storage.exs`
- Create: `lib/product_compare_schemas/commerce_attribution/conversion_sync_setting.ex`
- Create: `lib/product_compare_schemas/commerce_attribution/conversion_sync_run.ex`
- Create: `lib/product_compare/commerce_attribution/conversion_sync_settings.ex`
- Create: `lib/product_compare/commerce_attribution/conversion_sync_runs.ex`
- Create: `test/product_compare/commerce_attribution/conversion_sync_storage_test.exs`
- Create: `test/product_compare/repo/commerce_conversion_sync_constraints_test.exs`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_conversion.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`

**Interfaces:**
- Produces: `ConversionSyncSettings.ensure_cj/1 :: {:ok, ConversionSyncSetting.t()} | {:error, term()}` with bootstrap defaults.
- Produces: `ConversionSyncSettings.lock_cj/0 :: ConversionSyncSetting.t() | nil`, callable only inside a transaction.
- Produces: `ConversionSyncSettings.update_locked/4 :: {:ok, ConversionSyncSetting.t()} | {:error, Ecto.Changeset.t()}` for `(locked_settings, operator_id, attrs, now)`.
- Produces: `ConversionSyncRuns.start/2 :: {:ok, ConversionSyncRun.t()} | {:error, Ecto.Changeset.t()}` and `complete/3` with an injectable clock.
- Produces: `ConversionSyncRuns.query/0 :: Ecto.Query.t()` ordered by `started_at DESC, id DESC`.
- Changes: `CommerceConversion.changeset/2` accepts nullable `network_action_ref`.

- [ ] **Step 1: Write failing schema and direct-database tests**

Add changeset cases for exact boundaries and direct insert cases for every named check:

```elixir
test "settings enforce the approved bounds and disabled next-run contract" do
  valid = %{
    affiliate_network_id: network_fixture("cj").id,
    enabled: false,
    interval_minutes: 1_440,
    lookback_days: 90,
    max_pages: 100,
    next_run_at: nil
  }

  assert ConversionSyncSetting.changeset(%ConversionSyncSetting{}, valid).valid?

  for {field, value} <- [interval_minutes: 14, interval_minutes: 10_081,
                         lookback_days: 0, lookback_days: 91,
                         max_pages: 0, max_pages: 101] do
    refute ConversionSyncSetting.changeset(
             %ConversionSyncSetting{}, Map.put(valid, field, value)
           ).valid?
  end

  refute ConversionSyncSetting.changeset(
           %ConversionSyncSetting{}, %{valid | next_run_at: ~U[2026-08-28 12:00:00Z]}
         ).valid?
end

test "terminal run evidence requires an increasing window, nonnegative counts, and finish time" do
  attrs = run_attrs(%{status: :succeeded, finished_at: nil})
  assert %{finished_at: ["is invalid"]} = errors_on(ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs))

  attrs = run_attrs(%{window_end: attrs.window_start})
  assert %{window_end: ["must be after window start"]} = errors_on(ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs))
end
```

In `commerce_conversion_sync_constraints_test.exs`, use `Repo.query/2` under `Sandbox.allow/3` as existing storage-integrity tests do and assert the exact constraint names below return PostgreSQL `:check_violation`.

- [ ] **Step 2: Run the focused tests and witness RED**

```bash
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
```

Expected: compilation fails because the migration and two schemas do not exist.

- [ ] **Step 3: Add the migration with exact constraints and indexes**

Create the two tables and conversion evidence column. Use these stable names:

```elixir
alter table(:commerce_conversions) do
  add :network_action_ref, :text
end

create index(:commerce_conversions, [:affiliate_network_id, :network_action_ref],
         name: :commerce_conversions_network_action_idx,
         where: "network_action_ref IS NOT NULL")

create table(:commerce_conversion_sync_settings) do
  add :affiliate_network_id,
      references(:affiliate_networks, type: :bigint, on_delete: :delete_all), null: false
  add :enabled, :boolean, null: false, default: false
  add :interval_minutes, :integer, null: false, default: 1_440
  add :lookback_days, :integer, null: false, default: 90
  add :max_pages, :integer, null: false, default: 100
  add :next_run_at, :timestamptz, precision: 6, size: 6
  add :updated_by_user_id, references(:users, type: :bigint, on_delete: :nilify_all)
  timestamps(type: :timestamptz, precision: 6, size: 6)
end

create unique_index(:commerce_conversion_sync_settings, [:affiliate_network_id],
         name: :commerce_conversion_sync_settings_network_uq)
create constraint(:commerce_conversion_sync_settings, :commerce_conversion_sync_settings_interval_bounds,
         check: "interval_minutes BETWEEN 15 AND 10080")
create constraint(:commerce_conversion_sync_settings, :commerce_conversion_sync_settings_lookback_bounds,
         check: "lookback_days BETWEEN 1 AND 90")
create constraint(:commerce_conversion_sync_settings, :commerce_conversion_sync_settings_max_pages_bounds,
         check: "max_pages BETWEEN 1 AND 100")
create constraint(:commerce_conversion_sync_settings, :commerce_conversion_sync_settings_enabled_next_run,
         check: "enabled OR next_run_at IS NULL")
```

Create `commerce_conversion_sync_runs` with entropy UUID, network/requester foreign keys, string-backed Ecto enums for status and trigger, window/cursor/count/timestamp/error columns, a unique entropy index, newest-run index, and checks named:

- `commerce_conversion_sync_runs_status_valid`
- `commerce_conversion_sync_runs_trigger_valid`
- `commerce_conversion_sync_runs_window_increasing`
- `commerce_conversion_sync_runs_counts_non_negative`
- `commerce_conversion_sync_runs_terminal_finished_at_required`
- `commerce_conversion_sync_runs_error_summary_length` using `char_length(error_summary) <= 500`

- [ ] **Step 4: Implement schemas with matching application validation**

Use `Ecto.Enum` values `[:running, :succeeded, :failed]` and `[:scheduled, :operator, :cli]`. In `ConversionSyncSetting.changeset/2`, derive the disabled contract before constraint mappings:

```elixir
def changeset(setting, attrs) do
  setting
  |> cast(attrs, [:affiliate_network_id, :enabled, :interval_minutes, :lookback_days,
                  :max_pages, :next_run_at, :updated_by_user_id])
  |> validate_required([:affiliate_network_id, :enabled, :interval_minutes, :lookback_days, :max_pages])
  |> validate_number(:interval_minutes, greater_than_or_equal_to: 15, less_than_or_equal_to: 10_080)
  |> validate_number(:lookback_days, greater_than_or_equal_to: 1, less_than_or_equal_to: 90)
  |> validate_number(:max_pages, greater_than_or_equal_to: 1, less_than_or_equal_to: 100)
  |> validate_disabled_next_run()
  |> unique_constraint(:affiliate_network_id, name: :commerce_conversion_sync_settings_network_uq)
  |> check_constraint(:interval_minutes, name: :commerce_conversion_sync_settings_interval_bounds)
  |> check_constraint(:lookback_days, name: :commerce_conversion_sync_settings_lookback_bounds)
  |> check_constraint(:max_pages, name: :commerce_conversion_sync_settings_max_pages_bounds)
  |> check_constraint(:next_run_at, name: :commerce_conversion_sync_settings_enabled_next_run)
end
```

Apply equivalent required, inclusion, window, count, terminal, and 500-code-point error validation in `ConversionSyncRun.changeset/2`, followed by all six named mappings.

- [ ] **Step 5: Implement idempotent bootstrap and run lifecycle owners**

Resolve CJ by normalized affiliate-network code, insert defaults with `on_conflict: :nothing`, and fetch the persisted winner. `update_locked/4` must set `updated_by_user_id` from the explicit operator ID, clear `next_run_at` when disabled, set `now + interval` when enabling or changing cadence, and otherwise preserve the existing time.

`ConversionSyncRuns.start/2` supplies running status and `started_at`; `complete/3` locks the run and returns an already-terminal row unchanged or applies succeeded/failed evidence with `finished_at`. Expose facade delegates only for callers used later in this plan.

- [ ] **Step 6: Run migrations, focused GREEN, and formatting**

```bash
mix ecto.migrate
mix format
mix test test/product_compare/commerce_attribution/conversion_sync_storage_test.exs test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
```

Expected: both settings and run changeset suites pass, direct SQL proves all named checks, and the settings bootstrap converges to one CJ row.

- [ ] **Step 7: Commit the storage milestone**

```bash
git add priv/repo/migrations/20260827120000_add_cj_conversion_sync_storage.exs \
  lib/product_compare_schemas/commerce_attribution \
  lib/product_compare/commerce_attribution.ex \
  lib/product_compare/commerce_attribution/conversion_sync_settings.ex \
  lib/product_compare/commerce_attribution/conversion_sync_runs.ex \
  test/product_compare/commerce_attribution/conversion_sync_storage_test.exs \
  test/product_compare/repo/commerce_conversion_sync_constraints_test.exs
git commit -m "feat: add conversion sync storage"
```

---

### Task 2: Implement the current CJ Commission Detail client and adapter contract

**Files:**
- Create: `lib/product_compare/commerce_attribution/cj/client.ex`
- Create: `test/product_compare/commerce_attribution/cj/client_test.exs`
- Create: `test/support/fixtures/cj/commission_detail_sample.redacted.json`
- Modify: `lib/product_compare/commerce_attribution/cj_adapter.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**
- Produces: `CJ.Client.credential_status/1 :: %{ready: boolean(), api_token_configured: boolean(), account_id_configured: boolean()}` without values.
- Produces: `CJ.Client.publisher_ids/1 :: {:ok, [String.t()]} | {:error, {:missing_env, String.t()}}`.
- Produces: `CJ.Client.fetch_page/2 :: {:ok, %{records: [map()], payload_complete: boolean(), max_commission_id: String.t() | nil}} | {:error, term()}` for one fixed window page.
- Changes: `CJAdapter.ingest_transaction/1` consumes current USD fields, `shopperId`, and `originalActionId` while retaining legacy inbound spellings.

- [ ] **Step 1: Write failing client request, response, and redaction tests**

Use an injected transport to capture the request and return the checked-in fixture:

```elixir
test "fetch_page sends the exact publisher window and current selected fields" do
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

  assert_receive {:request, %{url: "https://commissions.api.cj.com/query", headers: headers, body: body}}
  assert {"Authorization", "Bearer secret-token"} in headers
  decoded = Jason.decode!(body)
  assert decoded["variables"] == %{
           "forPublishers" => ["publisher-1"],
           "sincePostingDate" => "2026-08-01T00:00:00Z",
           "beforePostingDate" => "2026-08-02T00:00:00Z",
           "sinceCommissionId" => nil
         }
  assert decoded["query"] =~ "shopperId"
  assert decoded["query"] =~ "pubCommissionAmountUsd"
  refute decoded["query"] =~ " sid "
end
```

Add HTTP, invalid JSON, GraphQL-envelope, missing root, invalid record list, missing completion flag, and missing/non-string cursor cases. Assert returned/logged errors contain only categories, status, and optional GraphQL code—never token, headers, or provider body. Add credential-status cases for blank values and publisher-list precedence.

- [ ] **Step 2: Write failing adapter cases for current CJ vocabulary**

Extend the existing adapter matrix with `shopperId`, `saleAmountUsd`, `pubCommissionAmountUsd`, `originalActionId`, and all four statuses. Assert the normalized conversion stores `network_action_ref`, USD currency, exact Decimal values, and legacy SID still resolves only for inbound compatibility.

- [ ] **Step 3: Run focused tests and witness RED**

```bash
mix test test/product_compare/commerce_attribution/cj/client_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
```

Expected: the client module is missing and the current adapter ignores the current shopper/action/USD fields.

- [ ] **Step 4: Implement strict one-page transport**

Define the GraphQL document as a module attribute with the approved fields and validate input before transport. Request JSON variables use exact UTC ISO 8601 strings and omit no fixed window value. When the payload is incomplete, require a nonblank `maxCommissionId`; when complete, permit a null cursor.

Use a request map compatible with the existing CJ Req client and a default transport that returns only `%{status:, body:}`. Convert failures to shapes such as `{:http_error, 429}`, `{:decode_error, :invalid_json}`, `{:graphql_error, code}`, and `{:invalid_response, field}` without retaining the body.

- [ ] **Step 5: Implement credential readiness without exposing identity**

Normalize the optional comma-separated publisher list, fall back to a one-item `CJ_ACCOUNT_ID` list, and read the token at execution time:

```elixir
def credential_status(opts \\ []) do
  token? = present?(option_or_env(opts, :api_token, "CJ_API_TOKEN"))
  account? = match?({:ok, [_ | _]}, publisher_ids(opts))
  %{ready: token? and account?, api_token_configured: token?, account_id_configured: account?}
end
```

The public status map must never contain token, account, or publisher values.

- [ ] **Step 6: Update the adapter minimally**

Make `shopperId` the first publisher reference while retaining `SID`/`sid`; map the current USD fields before old fixture aliases; set `currency: "USD"`; include `network_action_ref` from `originalActionId`; and retain the existing unknown-status fail-closed behavior. Keep provider vocabulary local rather than adding a shared payload type.

- [ ] **Step 7: Run GREEN and commit the provider contract**

```bash
mix format
mix test test/product_compare/commerce_attribution/cj/client_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
git add lib/product_compare/commerce_attribution/cj/client.ex \
  lib/product_compare/commerce_attribution/cj_adapter.ex \
  test/product_compare/commerce_attribution/cj/client_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/support/fixtures/cj/commission_detail_sample.redacted.json
git commit -m "feat: add CJ commission detail client"
```

---

### Task 3: Build the bounded importer and correction-safe persistence

**Files:**
- Create: `lib/product_compare/commerce_attribution/cj/importer.ex`
- Create: `test/product_compare/commerce_attribution/cj/importer_test.exs`
- Modify: `lib/product_compare/commerce_attribution/conversions/persistence.ex`
- Modify: `lib/product_compare/commerce_attribution/conversions.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare/commerce_attribution/conversion_sync_storage_test.exs`

**Interfaces:**
- Produces: `CJ.Importer.run/2 :: {:ok, ConversionSyncRun.t()} | {:error, term()}` for `%{from:, before:, publisher_ids:, max_pages:, trigger:, requested_by_user_id:}`.
- Produces: `Conversions.persist_cj_action_group/1 :: {:ok, %{persisted: non_neg_integer(), reversed: non_neg_integer()}} | {:error, term()}`.
- Produces: `Persistence.reverse_cj_action/3 :: {:ok, %{matched: pos_integer(), updated: non_neg_integer()}} | {:error, :unmatched_correction | Ecto.Changeset.t()}` for `(network_action_ref, posting_date, raw_payload)` inside the action transaction.
- Preserves: `CommerceAttribution.ingest_conversion/1` behavior for other adapters and existing stale-evidence protection.

- [ ] **Step 1: Write failing pagination and completion tests**

Drive the importer with a stateful injected `fetch_page` callback and assert fixed window variables on every call:

```elixir
test "walks every page, advances only the commission cursor, and completes truthful counts" do
  parent = self()
  fetch_page = fn request, _opts ->
    send(parent, {:page, request})
    case request.since_commission_id do
      nil -> {:ok, %{records: [original("c-1", "a-1")], payload_complete: false, max_commission_id: "c-1"}}
      "c-1" -> {:ok, %{records: [original("c-2", "a-2")], payload_complete: true, max_commission_id: "c-2"}}
    end
  end

  assert {:ok, run} = Importer.run(import_request(), fetch_page: fetch_page)
  assert run.status == :succeeded
  assert run.pages_fetched == 2
  assert run.records_fetched == 2
  assert run.records_persisted == 2
  assert run.records_failed == 0
  assert_receive {:page, %{from: ~U[2026-08-01 00:00:00Z], before: ~U[2026-08-02 00:00:00Z]}}
end
```

Add blank, missing, repeated, and non-advancing cursor failures; completion on a page that still reports a cursor; page-ceiling exhaustion; malformed record failure; transport failure; zero-record success; and partial persistence evidence where action group one remains after group two fails.

- [ ] **Step 2: Write failing correction ordering, replay, and concurrency tests**

Cover correction-before-original provider order, original on a later page, stale correction replay, multiple rows sharing one action reference, unmatched correction failure, blank action reference, and partial adjustment exclusion. Assert reversal preserves amounts and replaces status/raw evidence/freshness only.

Add one unboxed database test with two complete import tasks over the same action group. Release their row-lock barriers in both original-first and correction-first orders; both tasks must finish and the final row must be reversed without a duplicate conversion.

- [ ] **Step 3: Run the focused suites and witness RED**

```bash
mix test test/product_compare/commerce_attribution/cj/importer_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/product_compare/commerce_attribution/conversion_sync_storage_test.exs
```

Expected: importer/action-group functions are missing and corrections are not applied.

- [ ] **Step 4: Implement strict page traversal before persistence**

Validate UTC bounds, nonblank publisher IDs, and positive page ceiling before starting the run. Start one sync-run row, collect pages into memory up to `max_pages`, and track seen cursors with `MapSet`. The loop shape is explicit:

```elixir
defp fetch_pages(request, fetch_page, seen, page, max_pages, records) do
  if page > max_pages do
    {:error, :page_ceiling_exhausted}
  else
    with {:ok, result} <- fetch_page.(request, []),
         :ok <- validate_continuation(result, seen) do
      records = records ++ result.records

      if result.payload_complete do
        {:ok, records, page, result.max_commission_id}
      else
        fetch_pages(
          %{request | since_commission_id: result.max_commission_id},
          fetch_page,
          MapSet.put(seen, result.max_commission_id),
          page + 1,
          max_pages,
          records
        )
      end
    end
  end
end
```

Use a reverse accumulator internally if needed to avoid quadratic concatenation, but preserve provider records byte-for-byte and never persist until all pages validate.

- [ ] **Step 5: Persist deterministic action groups atomically**

Partition originals and corrections, then group by normalized nonblank `originalActionId`; originals without an action reference receive a unique commission-keyed group. For each group, open one `Repo.transaction/2`, ingest every original first, then apply every correction ordered by `postingDate` and `commissionId`.

`reverse_cj_action/3` resolves the CJ network, locks all matching conversions, fails on no matches, skips rows whose `reported_at` is newer, and updates eligible rows through `CommerceConversion.changeset/2` with:

```elixir
%{
  status: :reversed,
  data_freshness_at: posting_date,
  reported_at: posting_date,
  raw_payload: raw_payload
}
```

Do not change order amount, commission amount, currency, attribution, or conversion identity. Because originals and corrections for one action share a transaction, a concurrent complete group cannot commit an equal-timestamp original after another complete group has committed its correction.

Add `:network_action_ref` to `Persistence`'s existing upsert-field allowlist so fresher original evidence may establish or update the correlation reference without broadening any other adapter contract.

- [ ] **Step 6: Complete run evidence on every outcome**

On success, store page/fetched/persisted/failed counts and last cursor. On error, complete the run as failed with a category-only summary of at most 500 code points and return the original classified error to the worker. Do not inspect arbitrary exceptions into the row; rescue/catch maps to `runner_exception`.

- [ ] **Step 7: Run GREEN and commit the importer milestone**

```bash
mix format
mix test test/product_compare/commerce_attribution/cj/importer_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/product_compare/commerce_attribution/conversion_sync_storage_test.exs \
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs
git add lib/product_compare/commerce_attribution \
  test/product_compare/commerce_attribution \
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs
git commit -m "feat: import CJ commissions safely"
```

---

### Task 4: Add durable jobs, database-claimed dispatch, and the manual CLI

**Files:**
- Create: `lib/product_compare/commerce_attribution/jobs/cj_commission_sync_worker.ex`
- Create: `lib/product_compare/commerce_attribution/cj_commission_sync_jobs.ex`
- Create: `lib/product_compare/commerce_attribution/cj_commission_sync_dispatcher.ex`
- Create: `lib/mix/tasks/product_compare.commerce_attribution.cj_commissions.ex`
- Create: `lib/mix/tasks/product_compare/commerce_attribution/cj_commissions/options.ex`
- Create: `test/product_compare/commerce_attribution/jobs/cj_commission_sync_test.exs`
- Create: `test/product_compare/commerce_attribution/cj_commission_sync_dispatcher_test.exs`
- Create: `test/mix/tasks/product_compare_commerce_attribution_cj_commissions_test.exs`
- Modify: `lib/product_compare/commerce_attribution/conversion_sync_settings.ex`
- Modify: `lib/product_compare/application.ex`
- Modify: `config/runtime.exs`
- Modify: `.env.example`

**Interfaces:**
- Produces: `CJCommissionSyncWorker.args/1 :: map()` containing only publisher IDs, UTC bounds, page ceiling, trigger, requester ID, and schedule window.
- Produces: `CJCommissionSyncWorker.enqueue/1 :: {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}` with active-state uniqueness.
- Produces: `CJCommissionSyncJobs.active/0 :: map() | nil` with only safe projected state/window/timestamps.
- Produces: `CJCommissionSyncJobs.run_now/2 :: {:ok, %{job: Oban.Job.t(), existing: boolean()}} | {:error, term()}` for `(operator_id, now)`.
- Produces: `CJCommissionSyncJobs.run_now_locked/3` for `(locked_settings, operator_id, now)` when the caller already owns the operator-first transaction.
- Produces: `ConversionSyncSettings.claim_due_cj/2 :: {:ok, :idle | %{job: Oban.Job.t(), settings: ConversionSyncSetting.t()}} | {:error, term()}` for `(now, enqueuer)`.
- Produces: `CJCommissionSyncDispatcher.dispatch_due/2 :: {:ok, term()} | {:error, term()}` for `(now, enqueuer)` plus a 60-second GenServer tick.
- Produces: `Mix.Tasks.ProductCompare.CommerceAttribution.CjCommissions.run_import/1` as the testable CLI runner.

- [ ] **Step 1: Write failing worker and `Run now` deduplication tests**

Assert safe canonical arguments and uniqueness only across active Oban states:

```elixir
test "worker arguments are bounded, canonical, and secret free" do
  args = CJCommissionSyncWorker.args(
    publisher_ids: ["publisher-1"],
    from: ~U[2026-08-01 00:00:00Z],
    before: ~U[2026-08-02 00:00:00Z],
    max_pages: 100,
    trigger: :operator,
    requested_by_user_id: 42
  )

  assert args["from"] == "2026-08-01T00:00:00Z"
  assert args["before"] == "2026-08-02T00:00:00Z"
  refute Map.has_key?(args, "api_token")
  refute Map.has_key?(args, "authorization")
  refute inspect(args) =~ "secret"
end
```

Create an active job, call `run_now/2` twice under separate transactions, and assert the second result returns the same job with `existing: true`. Complete the first job and assert a later request may enqueue a new job without shifting `next_run_at`.

- [ ] **Step 2: Write failing dispatcher and CLI tests**

Cover disabled/early/due settings; two concurrent due claims producing one job; `SKIP LOCKED` returning idle rather than blocking; claim-time window and next-run calculation; no catch-up jobs after a long gap; and a failed enqueue rolling back `next_run_at`.

For CLI parsing, assert exact `--from`, `--before`, `--lookback-days`, `--max-pages`, `--check-credentials`, and `--require-ready` behavior. Reject mixed explicit bounds/lookback, non-UTC values, inverted windows, lookback outside `1..90`, max pages outside `1..100`, and unknown options. Capture IO to prove only provider/surface/readiness, run UUID, bounds, counts, and classified failure are printed.

- [ ] **Step 3: Run focused tests and witness RED**

```bash
mix test test/product_compare/commerce_attribution/jobs/cj_commission_sync_test.exs \
  test/product_compare/commerce_attribution/cj_commission_sync_dispatcher_test.exs \
  test/mix/tasks/product_compare_commerce_attribution_cj_commissions_test.exs
```

Expected: worker, dispatcher, job owner, and Mix task are missing.

- [ ] **Step 4: Implement the worker and active-job owner**

Use `queue: :ingestion`, `max_attempts: 5`, and Oban uniqueness restricted to `[:available, :scheduled, :executing, :retryable]` so terminal windows remain intentionally replayable. `perform/1` reconstructs typed bounds and calls `CJ.Importer.run/2`; missing credentials cancel as `configuration_error`, while transport/provider failures return redacted retry categories.

`active/0` filters only this worker and pending states, orders executing before queued and newest ID next, and projects state, `scheduled_at`, `attempted_at`, `from`, and `before`. It must not return the raw args map.

`run_now/2` opens one transaction, locks the operator, locks CJ settings, and delegates to `run_now_locked/3`. The locked function checks `CJ.Client.credential_status/1`, returns the existing active job when present, or enqueues the current lookback window. The transaction never updates `next_run_at`.

- [ ] **Step 5: Implement the atomic due claim and supervised tick**

Inside `claim_due_cj/2`, select the enabled due row with `lock: "FOR UPDATE SKIP LOCKED"`. Use `before = now`, `from = DateTime.add(now, -lookback_days * 86_400, :second)`, insert one scheduled-trigger job, and update `next_run_at` to `DateTime.add(now, interval_minutes * 60, :second)` in the same transaction.

The GenServer initializes by calling `ConversionSyncSettings.ensure_cj/1` with the runtime bootstrap defaults, then schedules `:dispatch_due` every `60_000` ms through an injectable scheduler and clock. It calls the context owner, logs only idle/success/failure category, and always schedules its next tick. Add `{ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher, name: ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher}` after Repo/Oban in `Application` without an environment enable switch.

- [ ] **Step 6: Implement bootstrap config and CLI**

Add runtime key `:cj_commission_sync_defaults` populated from:

- `CJ_COMMISSION_SYNC_DEFAULT_INTERVAL_MINUTES`
- `CJ_COMMISSION_SYNC_DEFAULT_LOOKBACK_DAYS`
- `CJ_COMMISSION_SYNC_DEFAULT_MAX_PAGES`

Normalize invalid values to approved defaults and let `ensure_cj/1` enforce final bounds. Document those plus optional `CJ_COMMISSION_PUBLISHER_IDS` in `.env.example`; do not add a schedule-enabled environment variable.

The Mix task skips `app.start` for credential-only checks, otherwise starts the app and invokes the same importer. Explicit bounds take precedence only as a complete pair; omitted bounds use the persisted/default lookback and current UTC time.

- [ ] **Step 7: Run GREEN and commit the runtime milestone**

```bash
mix format
mix test test/product_compare/commerce_attribution/jobs/cj_commission_sync_test.exs \
  test/product_compare/commerce_attribution/cj_commission_sync_dispatcher_test.exs \
  test/mix/tasks/product_compare_commerce_attribution_cj_commissions_test.exs
git add lib/product_compare/commerce_attribution/jobs \
  lib/product_compare/commerce_attribution/cj_commission_sync_jobs.ex \
  lib/product_compare/commerce_attribution/cj_commission_sync_dispatcher.ex \
  lib/product_compare/commerce_attribution/conversion_sync_settings.ex \
  lib/mix/tasks/product_compare.commerce_attribution.cj_commissions.ex \
  lib/mix/tasks/product_compare/commerce_attribution/cj_commissions/options.ex \
  lib/product_compare/application.ex config/runtime.exs .env.example \
  test/product_compare/commerce_attribution/jobs \
  test/product_compare/commerce_attribution/cj_commission_sync_dispatcher_test.exs \
  test/mix/tasks/product_compare_commerce_attribution_cj_commissions_test.exs
git commit -m "feat: schedule CJ commission syncs"
```

---

### Task 5: Expose the secret-safe operator GraphQL contract

**Files:**
- Create: `test/product_compare_web/graphql/cj_commission_ingestion_test.exs`
- Modify: `lib/product_compare_web/schema/commerce_attribution/types.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/queries.ex`
- Modify: `lib/product_compare_web/schema/commerce_attribution/mutations.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/mutations.ex`
- Modify: `assets/schema.graphql`
- Modify generated output: `assets/src/__generated__/**`
- Modify: `test/product_compare_web/graphql/schema_snapshot_test.exs` only if the existing loaded-module list requires the new type owner; otherwise leave it unchanged.

**Interfaces:**
- Produces query: `cjCommissionIngestion: CJCommissionIngestion!`.
- Produces connection: `cjCommissionSyncRuns(first: Int!, after: String): CJCommissionSyncRunConnection!`.
- Produces mutation: `updateCjCommissionIngestionSettings(input: UpdateCJCommissionIngestionSettingsInput!): CJCommissionIngestionPayload!`.
- Produces mutation: `runCjCommissionIngestionNow: CJCommissionIngestionPayload!`.
- Produces typed payload errors using existing `MutationError` with codes `INVALID_ARGUMENT`, `CREDENTIALS_MISSING`, `ACTIVATION_NOT_READY`, `UNAUTHENTICATED`, and `FORBIDDEN`.

- [ ] **Step 1: Write failing authorization, projection, and pagination tests**

Prove anonymous and member reads fail before touching sync tables, then assert the operator shape:

```elixir
assert %{
         "data" => %{
           "cjCommissionIngestion" => %{
             "settings" => %{
               "enabled" => false,
               "intervalMinutes" => 1_440,
               "lookbackDays" => 90,
               "maxPages" => 100,
               "nextRunAt" => nil
             },
             "credentials" => %{
               "apiTokenConfigured" => true,
               "accountIdConfigured" => true,
               "ready" => true
             },
             "activity" => nil
           }
         }
       } = graphql(operator_conn, overview_query(), %{})
```

Insert tied run timestamps and prove newest-first cursor pagination with an ID tie-breaker. Introspect every new object/input/payload and refute fields matching token, authorization, publisher, account ID value, raw payload, request headers, Oban args, or exception.

- [ ] **Step 2: Write failing mutation and lock-order tests**

Cover valid settings updates, every field error, enablement without credentials, enablement without one successful run, successful enablement, disable clearing next run, run-now deduplication, and run-now preserving cadence.

Follow the existing committed-fixture lock harness: hold operator revocation, start each mutation, prove it waits, release revocation, and expect `FORBIDDEN` with settings/job state unchanged. Hold the settings row, start the mutation, prove operator revocation blocks behind the mutation, then release settings and assert mutation commits before revocation. This fixes the lock order as operator then settings.

- [ ] **Step 3: Run the GraphQL test and witness RED**

```bash
mix test test/product_compare_web/graphql/cj_commission_ingestion_test.exs
```

Expected: the fields and mutations do not exist.

- [ ] **Step 4: Define the GraphQL types and connection**

Add enums for activity/run status and trigger, input fields for the four editable settings, and these secret-safe objects:

```elixir
object :cj_commission_ingestion do
  field :settings, non_null(:cj_commission_ingestion_settings)
  field :credentials, non_null(:cj_commission_credential_status)
  field :activity, :cj_commission_ingestion_activity
  field :latest_success, :cj_commission_sync_run
  field :latest_failure, :cj_commission_sync_run
end

object :cj_commission_ingestion_payload do
  field :ingestion, :cj_commission_ingestion
  field :errors, non_null(list_of(non_null(:mutation_error)))
end
```

The settings object exposes enabled, interval/lookback/page ceiling, next run, updated time, and optional updater email. The activity object exposes only state, safe window bounds, scheduled time, and attempted time. The run object exposes global ID, status, trigger, requester email, window, cursor, counts, start/finish, and sanitized error summary.

- [ ] **Step 5: Implement reads with authorization-first database access**

`cj_commission_ingestion/3` requires the operator, ensures/reads CJ settings, gets credential status, active job projection, latest success, and latest failure. Start independent reads without serial dependency where practical, but do not add a generic root loader.

`cj_commission_sync_runs/3` requires the operator before validating cursor/database work, then passes `ConversionSyncRuns.query/0` through the existing `Connection.from_query_result/3`. Project entropy IDs with `GlobalId`, requester email from a preloaded association, and error summary exactly as stored.

- [ ] **Step 6: Implement mutations with operator-first transactions**

Both resolvers first call `Authorization.require_operator/1`, then invoke a transaction shaped as:

```elixir
Repo.transaction(fn ->
  with {:ok, _operator} <- Accounts.lock_operator(operator.id),
       %ConversionSyncSetting{} = settings <- ConversionSyncSettings.lock_cj(),
       {:ok, result} <- operation.(settings) do
    result
  else
    {:error, reason} -> Repo.rollback(reason)
    nil -> Repo.rollback(:not_found)
  end
end)
```

For update, normalize only `enabled`, `interval_minutes`, `lookback_days`, and `max_pages`; when enabling, require credential readiness and an existing successful run before `update_locked/4`. For run-now, delegate to `CJCommissionSyncJobs.run_now_locked/3` so it does not open a nested operator lock. Convert domain/changeset/auth failures to the exact typed payload codes.

- [ ] **Step 7: Regenerate schema, run GREEN, and commit GraphQL**

```bash
mix format
mix absinthe.schema.sdl --schema ProductCompareWeb.Schema assets/schema.graphql
cd assets && pnpm run relay && cd ..
mix test test/product_compare_web/graphql/cj_commission_ingestion_test.exs \
  test/product_compare_web/graphql/schema_snapshot_test.exs \
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs
git add lib/product_compare_web/schema/commerce_attribution \
  lib/product_compare_web/resolvers/commerce_attribution \
  test/product_compare_web/graphql/cj_commission_ingestion_test.exs \
  test/product_compare_web/graphql/schema_snapshot_test.exs \
  assets/schema.graphql assets/src/__generated__
git commit -m "feat: expose CJ ingestion operations"
```

---

### Task 6: Build the operator conversion-ingestion workspace

**Files:**
- Create: `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionRoute.tsx`
- Create: `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionStatus.tsx`
- Create: `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionSettings.tsx`
- Create: `assets/src/routes/commerce/revenue/ingestion/ConversionSyncRunLedger.tsx`
- Create: `assets/src/routes/commerce/revenue/ingestion/ConversionIngestionOperations.ts`
- Create: `assets/src/routes/commerce/revenue/ingestion/conversion-ingestion-data.ts`
- Create: `assets/test/routes/commerce/revenue/ingestion/conversion-ingestion-data.test.ts`
- Create: `assets/test/routes/commerce/revenue/ingestion/conversion-ingestion-loader.test.ts`
- Create: `assets/test/routes/commerce/revenue/ingestion/conversion-ingestion.route.test.tsx`
- Modify: `assets/src/routes/config/operator-routes.tsx`
- Modify: `assets/src/routes/RootDestinations.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/test/router.test.tsx`
- Modify: `assets/test/routes/root.route.test.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify generated output: `assets/src/__generated__/**`

**Interfaces:**
- Produces loader: `conversionIngestionLoader(args) :: Promise<{status: "ready", overviewQuery, runsQuery} | {status: "error"}>` with overview primary and run history deferred.
- Produces pure helpers: `buildSettingsVariables(FormData)`, `resolveIngestionMutationOutcome(payload, graphQLErrors)`, `buildSyncRunPaginationPath(after)`, and formatting functions over generated Relay field shapes.
- Produces route operations: `ConversionIngestionRouteQuery`, `ConversionSyncRunsQuery`, refetchable `ConversionIngestionStatus_query`, `UpdateCJCommissionIngestionSettingsMutation`, and `RunCJCommissionIngestionNowMutation`.
- Produces accessible regions `Ingestion status`, `Ingestion settings`, and table `Conversion sync runs`.

- [ ] **Step 1: Write failing pure data and loader tests**

Assert form conversion preserves generated variable ownership and exact numeric values:

```ts
const form = new FormData();
form.set("enabled", "on");
form.set("intervalMinutes", "1440");
form.set("lookbackDays", "90");
form.set("maxPages", "100");

expect(buildSettingsVariables(form)).toEqual({
  input: { enabled: true, intervalMinutes: 1440, lookbackDays: 90, maxPages: 100 },
});
```

Cover missing checkbox, invalid/non-integer/out-of-range values, payload versus top-level mutation errors, terminal duration/freshness copy, and cursor encoding.

Mock `preloadRouteQuery` and prove the loader starts overview and run-history promises before awaiting either, returns after overview resolves even when history remains pending, and preserves the rejected history promise for the route-level deferred fallback.

- [ ] **Step 2: Write failing route, mutation, and polling tests**

Require the approved hierarchy and copy:

```tsx
expect(screen.getByRole("heading", { name: "Conversion ingestion" })).toBeVisible();
expect(screen.getByRole("region", { name: "Ingestion status" })).toHaveTextContent("Next run");
expect(screen.getByRole("form", { name: "Ingestion settings" })).toBeVisible();
expect(screen.getByRole("button", { name: "Run now" })).toBeEnabled();
expect(screen.getByRole("table", { name: "Conversion sync runs" })).toBeVisible();
expect(screen.queryByText("secret-token")).not.toBeInTheDocument();
```

Exercise save success/error, enablement gate copy, run-now success/dedup/error, disabled controls while pending, field focus on validation failure, empty/latest failure evidence, ledger pagination, and history failure that leaves status/settings usable.

With fake timers, assert no polling while idle, one overview refetch after 10 seconds while queued/running and visible, no refetch while `document.visibilityState` is hidden, cleanup on unmount, and one route revalidation when activity first becomes terminal.

- [ ] **Step 3: Run focused frontend tests and witness RED**

```bash
cd assets
pnpm run test:unit -- \
  test/routes/commerce/revenue/ingestion/conversion-ingestion-data.test.ts \
  test/routes/commerce/revenue/ingestion/conversion-ingestion-loader.test.ts \
  test/routes/commerce/revenue/ingestion/conversion-ingestion.route.test.tsx \
  test/routes/commerce/revenue/revenue-summary.route.test.tsx \
  test/routes/root.route.test.tsx test/router.test.tsx
```

Expected: route modules, helpers, and navigation links do not exist.

- [ ] **Step 4: Implement concurrent route preloads and scoped refresh**

Define the overview query with the refetchable status fragment and start both preloads before awaiting the overview:

```ts
const overviewPromise = preloadRouteQuery(environment, conversionIngestionRouteQuery, {}, {
  signal: request.signal,
});
const runsPromise = preloadRouteQuery(
  environment,
  conversionSyncRunsQuery,
  { first: SYNC_RUN_PAGE_SIZE, after },
  { signal: request.signal },
);

return { status: "ready", overviewQuery: await overviewPromise, runsQuery: runsPromise };
```

Do not await run history in the loader's critical path. The status component owns one effect keyed by the derived boolean `activityIsActive`, the primitive activity state, and visibility. It installs one `visibilitychange` listener, starts one 10-second timer only while visible and active, clears both on cleanup, and uses the Relay fragment `refetch` with `fetchPolicy: "network-only"`. Derived labels/counts remain render-time values, not mirrored effect state.

- [ ] **Step 5: Implement status, settings, and mutation interactions**

Compose one shallow page surface through `PageShell`:

```tsx
<PageShell
  actions={<RunNowControl ingestion={data.cjCommissionIngestion} />}
  description="Monitor CJ commission freshness, run bounded imports, and control the persisted schedule."
  eyebrow="Commerce operations"
  title="Conversion ingestion"
>
  <ConversionIngestionStatus ingestion={data.cjCommissionIngestion} />
  <ConversionIngestionSettings ingestion={data.cjCommissionIngestion} />
  <DeferredRunLedger query={loaderData.runsQuery} />
</PageShell>
```

Status uses text plus existing `StatusBadge`, exact `<time dateTime>` values, and read-only configured/missing credential labels. Settings use labeled numeric `Input`s with min/max/step, the existing `Checkbox` for enabled, inline `role="alert"` errors, and `role="status"` success. Mutations use `commitRouteMutationPromise`; on success refetch overview, reset feedback, and never invent optimistic scheduler state.

- [ ] **Step 6: Implement the dense run ledger and navigation**

Build TanStack columns for Trigger, Window, Started, Duration, Pages, Records, and Outcome. Keep error summary in a disclosure row spanning all columns, not a permanent extra card. Display fetched/persisted/failed counts exactly and never parse money or raw provider payloads.

Register lazy route `commerce/revenue/ingestion`, add operator destination `Conversion ingestion`, add `Ingestion status` link on Revenue, and replace the obsolete Revenue statement that no live provider is connected with truthful copy linking financial evidence to operational freshness. Preserve route-level lazy import recovery and error boundaries.

- [ ] **Step 7: Generate Relay, run GREEN, and commit the workspace**

```bash
cd assets
pnpm run relay
pnpm run typecheck
pnpm run test:unit -- \
  test/routes/commerce/revenue/ingestion \
  test/routes/commerce/revenue/revenue-summary.route.test.tsx \
  test/routes/root.route.test.tsx test/router.test.tsx
cd ..
git add assets/src/routes/commerce/revenue/ingestion \
  assets/test/routes/commerce/revenue/ingestion \
  assets/src/routes/config/operator-routes.tsx \
  assets/src/routes/RootDestinations.tsx \
  assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx \
  assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx \
  assets/test/routes/root.route.test.tsx assets/test/router.test.tsx \
  assets/src/__generated__
git commit -m "feat: add conversion ingestion workspace"
```

---

### Task 7: Prove browser behavior, live-readiness gating, and repository completion

**Files:**
- Modify: `assets/tests/e2e/production-ui-operations.spec.ts`
- Modify: `docs/work/cj-live-conversion-ingestion.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify implementation files/tests from Tasks 1–6 only when fresh verification exposes a scoped defect.

**Interfaces:**
- Produces: Playwright evidence at desktop/tablet/mobile widths with reduced motion, contained ledger, working settings/run-now flows, independent failure recovery, and zero axe violations.
- Produces: optional redacted live-contract evidence through the approved Mix task; missing credentials keep schedule disabled and are recorded without blocking code verification.
- Produces: truthful lane completion and queue closeout while preserving a complete Ready Floor Exception if no additional coherent ready outcomes exist.

- [ ] **Step 1: Extend the browser fixture and write failing E2E assertions**

Add responders for overview, run history, status refetch, settings mutation, and run-now mutation. Visit `/commerce/revenue/ingestion` at every existing operations viewport and assert order, exact controls, credential readiness, next-run time, table containment, inline failure detail, navigation back to Revenue, and no secret-shaped text.

Add one mutation test that saves cadence, confirms the returned next run, clicks `Run now` twice, and verifies the second response presents the already-active job without duplicate UI state. Add one failure-isolation test where history fails and retry recovers while settings/status never disappear. Run `AxeBuilder` after both idle and editing states.

- [ ] **Step 2: Run the targeted browser test and witness RED**

```bash
cd assets
PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts --reporter=line
```

Expected before fixture/route repair: new ingestion assertions or unhandled GraphQL operation checks fail.

- [ ] **Step 3: Make only scoped E2E or accessibility repairs and rerun GREEN**

Keep status/form/ledger layout cardless, preserve 44-pixel controls and visible focus, and fix semantic or containment failures in the owning component rather than weakening assertions. Capture inspected screenshots through the existing operations helper.

```bash
cd assets
PLAYWRIGHT_PORT=4187 pnpm exec playwright test tests/e2e/production-ui-operations.spec.ts --reporter=line
cd ..
```

- [ ] **Step 4: Run the complete focused backend and frontend gates**

```bash
mix test test/product_compare/commerce_attribution \
  test/product_compare/repo/commerce_conversion_sync_constraints_test.exs \
  test/product_compare_web/graphql/cj_commission_ingestion_test.exs \
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs \
  test/mix/tasks/product_compare_commerce_attribution_cj_commissions_test.exs
cd assets
pnpm run relay:check
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test:unit -- test/routes/commerce/revenue test/routes/root.route.test.tsx test/router.test.tsx
cd ..
```

Expected: all focused contracts pass with no generated artifact drift.

- [ ] **Step 5: Run optional live evidence without activating schedule**

First run the local-only preflight:

```bash
mix product_compare.commerce_attribution.cj_commissions --check-credentials
```

If readiness is false, record `live evidence not run: credentials unavailable` in the lane doc and leave persisted scheduling disabled. If ready, run one small explicit UTC window, rerun the identical window, and record only run UUIDs, bounds, page/record counts, structural success, and row-count convergence. Never paste command output containing environment values; a live correction may refine policy only if it agrees with the synthetic correction gate.

- [ ] **Step 6: Run complete repository verification**

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
git diff --check
```

Expected: all backend/frontend/build/quality/coverage/queue gates pass. Treat the known Node-version warning as non-blocking only if it remains the same engine warning and every command exits successfully.

- [ ] **Step 7: Record completion and commit the final evidence**

Update `docs/work/cj-live-conversion-ingestion.md` from prospective `Target Outcome` to observed `Batch Outcome`, including exact test counts, live-gate disposition, and commits. Remove the completed ready row from `docs/work/index.md`; preserve a complete Ready Floor Exception unless fresh curation found at least three real successors. Update `docs/plans/INDEX.md` to mark the plan complete without presenting historical rows as dispatchable.

```bash
git add assets/tests/e2e/production-ui-operations.spec.ts \
  docs/work/cj-live-conversion-ingestion.md docs/work/index.md docs/plans/INDEX.md
git commit -m "test: verify CJ ingestion operations"
```

After the commit, rerun `git status --short`, `git diff HEAD^ --check`, and the exact pushed-HEAD verification required by the eventual branch/PR workflow.

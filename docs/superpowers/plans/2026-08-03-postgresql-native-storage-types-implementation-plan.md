# PostgreSQL Native Storage Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store first-party IP addresses, SHA-256 digests, elapsed cooldowns, and absolute instants in PostgreSQL-native types without changing public GraphQL contracts.

**Architecture:** `ecto_network` owns Ecto/Postgrex `inet` casting, Postgrex's custom type module decodes intervals into Elixir `Duration`, and focused boundary conversions preserve textual IP and integer-second GraphQL fields. Original unreleased migrations create `inet`, `bytea`, constrained `interval`, and `timestamptz(6)` directly; a compiled-schema and PostgreSQL-catalog policy test prevents regressions.

**Tech Stack:** Elixir 1.19, Ecto 3.13.5, Postgrex 0.22, ecto_network 1.6, PostgreSQL 18.4, Absinthe GraphQL, ExUnit.

## Global Constraints

- Keep GraphQL IP output textual, `cooldownSeconds` integer-valued, and datetime values ISO-8601 UTC.
- Keep monetary storage as `numeric` plus the existing currency foreign key; never introduce PostgreSQL `money`.
- Keep coupon and ingestion lifecycle endpoints as separate `timestamptz(6)` columns; do not introduce ranges or temporal overlap constraints.
- Leave Oban tables and Ecto's `schema_migrations` table unchanged.
- Update unreleased first-party migrations in place and rebuild only the test database during verification.
- Do not reset the local development database without separate explicit user approval.
- Retain raw request diagnostics without anonymization while keeping them out of logs and public user surfaces.
- Preserve the three existing `ready` queue rows while this coordinator-owned batch is active.

---

### Task 1: Native IP Storage And Queue Claim

**Files:**
- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify: `priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex`
- Modify: `lib/product_compare_web/commerce_attribution/request_diagnostics.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify: `test/product_compare_web/plugs/put_absinthe_context_test.exs`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_attribution_ledger_test.exs`
- Modify: affected commerce click and redirect tests that assert persisted IP values
- Create: `docs/work/postgresql-native-storage-types.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**
- Consumes: Phoenix `conn.remote_ip` as an Erlang IPv4 or IPv6 tuple.
- Produces: `CommerceClickSession.ip_address :: Postgrex.INET.t() | nil`, cast by `EctoNetwork.INET`; operator GraphQL continues returning `String.t() | nil`.

- [ ] **Step 1: Claim the coherent database-domain batch without consuming the ready-row floor**

Add an active coordinator row for this plan to `docs/work/index.md`, leaving rows 15, 16, and 17 `ready`. Create `docs/work/postgresql-native-storage-types.md` with the approved outcome, owned paths, internal slices, and verification contract. Add the plan to `docs/plans/INDEX.md`; keep these documentation edits staged for the Task 1 milestone commit.

- [ ] **Step 2: Write failing native-IP behavior tests**

Change request-diagnostics characterization to expect the Phoenix-resolved tuple, then add persistence and GraphQL assertions equivalent to:

```elixir
assert RequestDiagnostics.from_conn(conn).ip_address == {203, 0, 113, 42}

assert %Postgrex.INET{address: {203, 0, 113, 42}, netmask: nil} =
         Repo.reload!(click_session).ip_address

assert ledger_node["ipAddress"] == "203.0.113.42"

refute CommerceClickSession.changeset(%CommerceClickSession{}, %{
         commerce_link_id: commerce_link.id,
         ip_address: "999.0.0.1"
       }).valid?
```

Cover IPv4, compressed IPv6, invalid text, GraphQL presentation, GraphQL click tracking, and the redirect fallback.

- [ ] **Step 3: Run the focused tests and confirm the old text contract fails**

Run:

```bash
mix test test/product_compare_web/plugs/put_absinthe_context_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs \
  test/product_compare_web/graphql/commerce_click_test.exs \
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs
```

Expected: failures show string IP extraction/persistence and the missing `inet` schema type.

- [ ] **Step 4: Add ecto_network and implement native storage**

Add `{:ecto_network, "~> 1.6"}` and run `mix deps.get`. Change the migration column to:

```elixir
add :ip_address, :inet
```

Declare the persisted field as:

```elixir
field :ip_address, EctoNetwork.INET
```

Return `conn.remote_ip` directly from `RequestDiagnostics.from_conn/1`. At the operator projection boundary, render only loaded network values:

```elixir
defp format_ip(nil), do: nil
defp format_ip(%Postgrex.INET{} = address), do: to_string(address)
```

Use `format_ip(click.ip_address)` in `project_click/1`; do not add logging or public projections.

- [ ] **Step 5: Rebuild the test schema and make the focused tests pass**

Run:

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare_web/plugs/put_absinthe_context_test.exs \
  test/product_compare/commerce_attribution/commerce_attribution_test.exs \
  test/product_compare_web/graphql/commerce_attribution_ledger_test.exs \
  test/product_compare_web/graphql/commerce_click_test.exs \
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs
mix work_queue.validate
```

Expected: all focused tests pass and the queue reports three remaining ready rows.

- [ ] **Step 6: Commit the native-IP milestone**

```bash
git add mix.exs mix.lock priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs \
  lib/product_compare_schemas/commerce_attribution/commerce_click_session.ex \
  lib/product_compare_web/commerce_attribution/request_diagnostics.ex \
  lib/product_compare_web/resolvers/commerce_attribution/reads.ex \
  test/product_compare test/product_compare_web docs/work docs/plans/INDEX.md
git commit -m "refactor: store click addresses as postgres inet"
```

### Task 2: Raw SHA-256 Digest Storage

**Files:**
- Modify: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`
- Modify: `priv/repo/migrations/20260713140000_add_ingestion_reconciliation.exs`
- Modify: `priv/repo/migrations/20260713150000_add_product_enrichment.exs`
- Modify: `lib/product_compare_schemas/specs/source_artifact.ex`
- Modify: `lib/product_compare_schemas/ingestion/import_run.ex`
- Modify: `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- Modify: `lib/product_compare/ingestion/listing_persistence/artifacts.ex`
- Modify: `lib/product_compare/ingestion/reconciliation.ex`
- Modify: `lib/product_compare/specs/claims/imports.ex`
- Modify: `priv/repo/seeds/support.exs`
- Modify: `priv/repo/seeds/catalog.exs`
- Modify: `priv/repo/seeds/marketplace.exs`
- Modify: focused ingestion, enrichment, seed, and GraphQL fixture tests containing digest placeholders
- Modify: `docs/work/postgresql-native-storage-types.md`

**Interfaces:**
- Produces: each application-owned SHA-256 function returns a raw 32-byte binary.
- Preserves: the existing unique and partial-index replay/idempotency behavior.

- [ ] **Step 1: Write failing raw-digest tests**

Change focused expectations from 64 hexadecimal characters to raw bytes:

```elixir
assert byte_size(scope_fingerprint) == 32
assert scope_fingerprint == :crypto.hash(:sha256, canonical_payload)
```

Add changeset coverage proving `content_hash`, `scope_fingerprint`, and claim `fingerprint` reject non-32-byte values when present. Keep deterministic replay tests asserting identical inputs reuse the same record and distinct inputs do not collide.

- [ ] **Step 2: Run focused digest tests and confirm hexadecimal behavior fails**

Run:

```bash
mix test test/product_compare/ingestion/ingestion_test.exs \
  test/product_compare/ingestion/reconciliation_test.exs \
  test/product_compare/ingestion/enrichment_test.exs \
  test/product_compare/repo/seeds_test.exs
```

Expected: failures show 64-byte hexadecimal strings and text-backed changesets.

- [ ] **Step 3: Change migrations and schemas to constrained bytea**

Use `:binary` for all three migration columns and Ecto fields. Add named checks:

```elixir
check: "content_hash IS NULL OR octet_length(content_hash) = 32"
check: "scope_fingerprint IS NULL OR octet_length(scope_fingerprint) = 32"
check: "fingerprint IS NULL OR octet_length(fingerprint) = 32"
```

Add matching `validate_change/3` checks and `check_constraint/3` declarations to each owner schema. Preserve current nullability, unique indexes, and partial predicates.

- [ ] **Step 4: Remove Base16 persistence encoding**

End each producer at the raw hash:

```elixir
payload
|> Jason.encode!()
|> then(&:crypto.hash(:sha256, &1))
```

When the ingestion reconciliation advisory-lock name needs text, encode only that transient boundary:

```elixir
fingerprint = Base.encode16(run.scope_fingerprint, case: :lower)
lock_name = Enum.join([run.source_id, run.surface, fingerprint], ":")
```

Add `ProductCompare.DevSeeds.Support.sha256/1` and convert seed labels and test placeholders to deterministic raw digests. Do not alter encoded Argon2 hashes or token prefixes.

- [ ] **Step 5: Rebuild and pass all affected digest-owner suites**

Run:

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare/ingestion \
  test/product_compare/repo/seeds_test.exs \
  test/product_compare_web/graphql/source_artifact_query_test.exs \
  test/product_compare_web/graphql/catalog_queries_test.exs \
  test/product_compare_web/graphql/pricing_queries_test.exs \
  test/product_compare_web/graphql/dataloader_batching_test.exs \
  test/product_compare_web/graphql/node_query_test.exs \
  test/mix/tasks/product_compare_ingestion_cj_import_test.exs
```

Expected: all suites pass against `bytea` columns and replay behavior is unchanged.

- [ ] **Step 6: Commit the digest milestone**

```bash
git add priv/repo/migrations lib/product_compare_schemas lib/product_compare/ingestion \
  lib/product_compare/specs priv/repo/seeds test docs/work/postgresql-native-storage-types.md
git commit -m "refactor: store sha256 values as binary digests"
```

### Task 3: Native Cooldown Interval

**Files:**
- Create: `lib/product_compare/postgrex_types.ex`
- Create: `lib/product_compare_schemas/alerts/cooldown.ex`
- Modify: `config/config.exs`
- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Modify: `lib/product_compare/alerts/watch_rules.ex`
- Modify: `lib/product_compare/alerts/evaluation.ex`
- Modify: `lib/product_compare_web/schema/alerts/types.ex`
- Modify: `priv/repo/seeds/engagement.exs`
- Modify: `test/product_compare/alerts/alerts_test.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `docs/work/postgresql-native-storage-types.md`

**Interfaces:**
- Produces: `Cooldown.from_seconds/1 :: {:ok, Duration.t()} | :error` and `Cooldown.to_seconds/1 :: {:ok, non_neg_integer()} | :error`.
- Persists: `PriceWatchRule.cooldown :: Duration.t()` in `interval DAY TO SECOND`.
- Preserves: GraphQL `cooldownSeconds :: Int` for create, update, and read operations.

- [ ] **Step 1: Write failing duration and GraphQL compatibility tests**

Add focused expectations equivalent to:

```elixir
assert %Duration{second: 3_600} = watch.cooldown
assert response["data"]["createPriceWatch"]["watch"]["cooldownSeconds"] == 3_600
assert Cooldown.from_seconds(59) == :error
assert Cooldown.from_seconds(31_536_001) == :error
assert {:ok, 86_400} = Cooldown.to_seconds(Duration.new!(day: 1))
```

Retain an evaluation test proving an alert is allowed exactly at the cooldown boundary and denied one second before it.

- [ ] **Step 2: Run focused alert tests and confirm integer storage fails the new contract**

Run:

```bash
mix test test/product_compare/alerts/alerts_test.exs \
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs
```

Expected: the schema still loads an integer and no `Cooldown` boundary exists.

- [ ] **Step 3: Enable Duration decoding through Postgrex**

Define the generated type module at file top level:

```elixir
Postgrex.Types.define(ProductCompare.PostgrexTypes, [], interval_decode_type: Duration)
```

Configure `ProductCompare.Repo` with `types: ProductCompare.PostgrexTypes` in `config/config.exs`. Do not replace or customize other Postgrex extensions.

- [ ] **Step 4: Implement the exact elapsed-duration boundary**

`ProductCompareSchemas.Alerts.Cooldown` accepts only 60 through 31,536,000 whole seconds and converts `Duration` values containing only non-negative weeks, days, hours, minutes, seconds, and zero microseconds. It rejects year/month components and fractional seconds because those do not represent the existing exact elapsed-seconds contract.

Rename the database column to `cooldown`, use:

```elixir
add :cooldown, :duration,
  fields: "DAY TO SECOND",
  null: false,
  default: fragment("INTERVAL '1 day'")
```

Keep the named minimum/maximum check using `INTERVAL '60 seconds'` and `INTERVAL '31536000 seconds'`, and add a whole-second check. In the schema, persist `field :cooldown, :duration` and use a virtual `field :cooldown_seconds, :integer, virtual: true` only as the changeset input boundary. Convert valid seconds into `:cooldown`, report validation failures on `:cooldown_seconds`, and make the GraphQL output field resolve through `Cooldown.to_seconds/1`.

- [ ] **Step 5: Use Duration internally and pass alert suites**

Update evaluation to compare elapsed seconds with `Cooldown.to_seconds/1`, and change internal seeds/direct domain fixtures to explicit `Duration` values. Rebuild the test database, then run:

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare/alerts \
  test/product_compare_web/graphql/price_watches_and_alerts_test.exs \
  test/product_compare/repo/seeds_test.exs
```

Also run every file returned by `rg -l 'cooldownSeconds|cooldown_seconds' test`. Expected: interval persistence, integer GraphQL compatibility, and exact-boundary evaluation all pass.

- [ ] **Step 6: Commit the interval milestone**

```bash
git add lib/product_compare/postgrex_types.ex lib/product_compare_schemas/alerts \
  lib/product_compare/alerts lib/product_compare_web/schema/alerts/types.ex \
  config/config.exs priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs \
  priv/repo/seeds/engagement.exs test docs/work/postgresql-native-storage-types.md
git commit -m "refactor: store watch cooldowns as postgres intervals"
```

### Task 4: Time-Zone-Aware Instants And Native-Type Policy

**Files:**
- Create: `test/support/native_storage_policy.ex`
- Create: `test/product_compare/repo/native_storage_policy_test.exs`
- Modify: `config/config.exs`
- Modify: the 22 first-party migration files returned by `rg -l 'timestamps\(|:utc_datetime_usec' priv/repo/migrations`
- Modify: `docs/work/postgresql-native-storage-types.md`

**Interfaces:**
- Produces: `NativeStoragePolicy.validate/1 :: {:ok, map()} | {:error, [String.t()]}` with actionable schema/table/column/type violations.
- Enforces: `inet`, three 32-byte `bytea` digests, day-to-second `interval`, and first-party `timestamptz(6)`.

- [ ] **Step 1: Write the failing catalog-backed policy test**

Following `CategoricalStoragePolicy`, reflect compiled persisted schemas and query `information_schema.columns` plus `pg_constraint`. Test pure violation formatting with fixture schemas, then add a live assertion:

```elixir
assert {:ok, inventory} = NativeStoragePolicy.validate(Repo)
assert inventory.inet_fields != []
assert inventory.utc_datetime_fields != []
assert inventory.digest_columns == [
         {"ingestion_runs", "scope_fingerprint"},
         {"product_attribute_claims", "fingerprint"},
         {"source_artifacts", "content_hash"}
       ]
```

The live catalog check must reject every first-party `timestamp` column while explicitly excluding only `oban_jobs`, `oban_peers`, and `schema_migrations`. Report expected and observed data type, UDT, precision/type modifier, table, column, schema, and Ecto field where available.

- [ ] **Step 2: Run the policy test and confirm timestamp violations**

Run:

```bash
mix test test/product_compare/repo/native_storage_policy_test.exs
```

Expected: the new IP/digest/interval checks pass, while first-party `timestamp without time zone` columns are reported.

- [ ] **Step 3: Configure and rewrite first-party instant migrations**

Add the repository default:

```elixir
migration_timestamps: [type: :timestamptz, precision: 6]
```

In all 22 first-party migration files:

- change each `timestamps(type: :utc_datetime_usec)` to `timestamps(type: :timestamptz, precision: 6)`;
- change every first-party `add ..., :utc_datetime_usec` to `add ..., :timestamptz, precision: 6` while preserving null/default options;
- retain `:date` columns as dates; and
- do not modify Oban-generated migrations or dependency tables.

- [ ] **Step 4: Rebuild PostgreSQL 18 test storage and pass policy/owner tests**

Run:

```bash
MIX_ENV=test mix ecto.reset
mix test test/product_compare/repo/native_storage_policy_test.exs \
  test/product_compare/repo/domain_enum_storage_test.exs \
  test/product_compare/repo/application_json_domain_storage_test.exs \
  test/product_compare/accounts \
  test/product_compare/affiliate \
  test/product_compare/ingestion \
  test/product_compare/alerts \
  test/product_compare/commerce_attribution
```

Expected: all first-party DateTime values still load as UTC `%DateTime{}`, the native storage inventory is deterministic, and dependency-owned timestamp tables remain accepted.

- [ ] **Step 5: Hold the timestamp and policy changes for the verified closeout commit**

Run `git diff --check` and review the timestamp/policy diff, but do not make a
standalone pre-closeout commit. Task 5 bundles this final code/test slice with
truthful verification and queue-closeout documentation, satisfying the
repository rule against a docs-only completion commit.

### Task 5: Full Verification And Queue Closeout

**Files:**
- Modify: `docs/work/postgresql-native-storage-types.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md` only if its current storage description would otherwise become false

**Interfaces:**
- Produces: a clean migrated PostgreSQL 18 schema, complete verification evidence, and a queue with this completed row removed while rows 15–17 remain ready.

- [ ] **Step 1: Run anti-slop and storage-boundary audits**

Run:

```bash
rg -n 'field :ip_address, :string|add :ip_address, :text' lib priv/repo/migrations
rg -n 'Base\.encode16' lib/product_compare/ingestion lib/product_compare/specs
rg -n 'cooldown_seconds, :bigint|field :cooldown_seconds, :integer' lib priv/repo/migrations
rg -n ':utc_datetime_usec' priv/repo/migrations
rg -n 'add .*:money|field .*:money' lib priv/repo/migrations
```

Expected: no persisted IP text, digest Base16 persistence, integer cooldown column, first-party UTC migration type, or PostgreSQL money usage remains. GraphQL/virtual `cooldown_seconds` references are expected and must remain boundary-only.

- [ ] **Step 2: Run the complete backend and frontend gates**

Run:

```bash
mix deps.unlock --check-unused
mix format --check-formatted
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
git diff --check
```

Expected: every command exits successfully. Record the exact test count, coverage, frontend test count, build/bundle result, and any environment-only warning.

- [ ] **Step 3: Inspect the clean PostgreSQL catalog directly**

Against the rebuilt test database, query `information_schema.columns` and verify:

```text
commerce_click_sessions.ip_address -> inet
source_artifacts.content_hash -> bytea
ingestion_runs.scope_fingerprint -> bytea
product_attribute_claims.fingerprint -> bytea
price_watch_rules.cooldown -> interval DAY TO SECOND
first-party *_at and domain instant columns -> timestamptz with precision 6
```

Confirm the only allowed `timestamp without time zone` columns belong to Oban or `schema_migrations`.

- [ ] **Step 4: Complete lane evidence and close the active queue row**

Change the lane document from prospective `Target Outcome` to observed `Batch Outcome`, including the committed milestone hashes and exact verification. Remove the completed active row from `docs/work/index.md`, keep rows 15–17 ready, and mark the plan completed in `docs/plans/INDEX.md`. State clearly that the development database was not reset and requires `mix ecto.reset` to adopt rewritten migrations.

- [ ] **Step 5: Commit the verified closeout**

```bash
git add config/config.exs priv/repo/migrations test/support/native_storage_policy.ex \
  test/product_compare/repo/native_storage_policy_test.exs \
  docs/work/postgresql-native-storage-types.md docs/work/index.md docs/plans/INDEX.md ARCHITECTURE.md
git commit -m "refactor: store first-party instants as timestamptz"
```

If `ARCHITECTURE.md` did not require a correction, omit it from `git add`. Finish with `git status --short --branch` and confirm the worktree is clean.

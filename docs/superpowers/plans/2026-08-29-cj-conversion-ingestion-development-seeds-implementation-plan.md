# CJ Conversion Ingestion Development Seeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic, offline development fixtures for the CJ conversion-ingestion settings, status, history, and correction evidence shipped in the latest batch.

**Architecture:** A focused `ProductCompare.DevSeeds.ConversionIngestion` module owns the new singleton setting, terminal run ledger, and correction evidence. `ProductCompare.DevSeeds.Operations` supplies the existing CJ network, admin account, and reversed conversion, then exposes the new fixtures to the runner and guide without creating a second orchestrator.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Absinthe GraphQL, ExUnit

**Spec:** `docs/superpowers/specs/2026-08-29-cj-conversion-ingestion-development-seeds-design.md`

## Global Constraints

- Keep `priv/repo/seeds.exs` as the sole seed orchestrator.
- Apply the small lifecycle fixture set to both bounded and full profiles.
- Keep the persisted schedule disabled and `next_run_at` unset.
- Do not seed credentials, Oban jobs, running sync rows, or external requests.
- Restore only stable seed-owned run and correction identities.
- Preserve an existing operator-managed CJ setting and unrelated sync history.

---

### Task 1: Seed the CJ conversion-ingestion lifecycle

**Files:**
- Create: `priv/repo/seeds/conversion_ingestion.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `priv/repo/seeds/operations.exs`
- Modify: `priv/repo/seeds/guide.exs`
- Test: `test/product_compare/repo/seeds_test.exs`
- Test: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Consumes: `ProductCompare.DevSeeds.Support.stable_uuid/2`, `validated_row!/3`, and `sync_owned_rows!/4`.
- Consumes: the seeded admin user, CJ affiliate network, and reversed development conversion.
- Produces: `ProductCompare.DevSeeds.ConversionIngestion.seed!/4 :: %{settings: ConversionSyncSetting.t(), runs: [ConversionSyncRun.t()], correction: CJActionCorrection.t()}`.
- Produces: `operations.conversion_ingestion`, included in the printed fixture inventory.

- [ ] **Step 1: Write failing repository assertions**

Add a focused test that runs bounded seeds and asserts literal lifecycle values:

```elixir
assert %{settings: settings, runs: runs, correction: correction} =
         seed.operations.conversion_ingestion

assert %{enabled: false, next_run_at: nil} = settings
assert MapSet.new(runs, &{&1.status, &1.trigger}) ==
         MapSet.new([succeeded: :scheduled, failed: :operator, succeeded: :cli])
assert correction.network_action_ref == "DEV-CJ-ACTION-REVERSED"
assert correction.raw_payload["original"] == false
```

Exercise a settings update and insert an unrelated sync run, rerun the seeds,
and assert that the settings, unrelated run, seeded run IDs, and correction ID
remain present without duplication.

- [ ] **Step 2: Write failing GraphQL assertions**

Extend the existing operator development-seed query with:

```graphql
cjCommissionIngestion {
  settings { enabled intervalMinutes lookbackDays maxPages nextRunAt }
  latestSuccess { status trigger finishedAt }
  latestFailure { status trigger requesterEmail errorSummary }
}
cjCommissionSyncRuns(first: 20) {
  edges { node { status trigger requesterEmail recordsFetched recordsPersisted errorSummary } }
}
```

Assert disabled settings, a terminal success, the safe operator failure, and all
three trigger values. These assertions fail when the lifecycle fixtures are
absent even though the seed runner itself succeeds.

- [ ] **Step 3: Run the focused tests and verify the red state**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs:<new-test-line>
mix test test/product_compare_web/graphql/development_seeds_test.exs
```

Expected: repository assertions fail because `operations.conversion_ingestion`
is absent; GraphQL assertions fail because no seeded success/failure history is
returned.

- [ ] **Step 4: Implement the focused seed module**

Create `ProductCompare.DevSeeds.ConversionIngestion` with this public boundary:

```elixir
@spec seed!(map(), AffiliateNetwork.t(), CommerceConversion.t(), DateTime.t()) :: map()
def seed!(accounts, network, reversed_conversion, anchor) do
  settings = seed_settings!(network, accounts.admin)
  runs = seed_runs!(network, accounts.admin, anchor)
  correction = seed_correction!(network, reversed_conversion, anchor)
  %{settings: settings, runs: runs, correction: correction}
end
```

Use `ConversionSyncSettings.ensure_cj/1` to create safe disabled defaults without
rewriting an existing setting. Build three terminal `ConversionSyncRun`
changesets with stable UUIDs, validate them with `Support.validated_row!/3`, and
synchronize only those UUIDs through `Support.sync_owned_rows!/4`. Keep Oban
identity fields unset.

Set `network_action_ref: "DEV-CJ-ACTION-REVERSED"` on the reserved reversed
conversion. Call `CommerceAttribution.reverse_cj_action/3` with a synthetic
`%{"original" => false, "commissionId" => "DEV-CJ-CORRECTION-REVERSED"}` payload,
then fetch the resulting evidence by its reserved network/action key.

- [ ] **Step 5: Connect the module and guide**

Require `conversion_ingestion.exs` before `operations.exs`. In
`Operations.seed!/5`, call `ConversionIngestion.seed!/4` after named commerce
fixtures exist and return it as `:conversion_ingestion`. Update the guide
inventory and operator routes with the ingestion run count and
`/commerce/revenue/ingestion`.

- [ ] **Step 6: Run focused green tests and format**

Run:

```bash
mix format priv/repo/seeds/conversion_ingestion.exs priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare/repo/seeds_test.exs:<new-test-line>
mix test test/product_compare_web/graphql/development_seeds_test.exs
```

Expected: both focused test commands exit successfully with zero failures.

- [ ] **Step 7: Run the repository gate and commit**

Run:

```bash
mix ci
git diff --check
git status --short
git diff --stat
```

Review the final diff for ownership, offline safety, and unnecessary complexity,
then commit the complete milestone:

```bash
git add docs/superpowers/specs/2026-08-29-cj-conversion-ingestion-development-seeds-design.md docs/superpowers/plans/2026-08-29-cj-conversion-ingestion-development-seeds-implementation-plan.md priv/repo/seeds.exs priv/repo/seeds/conversion_ingestion.exs priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git commit -m "feat: seed CJ conversion ingestion development data"
```

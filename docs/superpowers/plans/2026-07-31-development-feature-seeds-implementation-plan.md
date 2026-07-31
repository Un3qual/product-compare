# Development Feature Seeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every delivered ProductCompare development route and backing workflow immediately testable from a deterministic, self-contained seed dataset without external provider or delivery calls.

**Architecture:** Keep `priv/repo/seeds.exs` as a thin transactional orchestrator and load focused seed-only modules from `priv/repo/seeds/`. Each module reconciles only records identified by reserved seed keys, returns explicit records to downstream modules, and uses existing contexts before schema changesets; a guide prints credentials and deep links only after the outer transaction commits.

**Tech Stack:** Elixir 1.19, Ecto/PostgreSQL, Phoenix/Absinthe GraphQL, ExUnit SQL sandbox, existing ProductCompare contexts and schemas.

## Global Constraints

- Create operator, moderator, shopper/content-owner, participant, unverified,
  and password-reset accounts with documented development credentials.
- Restore seed-owned records to a deterministic semantic baseline on rerun and
  leave unrelated local data untouched.
- Use one anchor timestamp per run for offer freshness, coupon windows, alerts,
  ingestion runs, snapshots, clicks, and conversions.
- Never call CJ, Awin, a conversion provider, a mailer, a provider scheduler,
  an ingestion job, or another network integration.
- Keep synthetic provider and attribution data explicitly labeled synthetic;
  do not present it as production-readiness evidence.
- Use existing context operations by default. Use a schema changeset directly
  only when the application has no suitable context operation.
- Keep seed-only modules under `priv/repo/seeds/`; add no production module,
  migration, dependency, generic seed DSL, callback framework, or repository
  abstraction.
- Run all reconciliation in one outer Repo transaction and print the guide only
  after a successful commit.
- Preserve the existing fail-closed operator-email rule: a preclaimed
  non-operator email is never promoted, overwritten, or given a seed password.
- Generated confirmation, reset, and API-token secrets may vary between runs;
  their account roles, labels, validity, and printed routes must remain stable.

---

### Task 1: Seed Runtime And Role-Specific Accounts

**Files:**

- Create: `priv/repo/seeds/support.exs`
- Create: `priv/repo/seeds/accounts.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `docs/work/development-feature-seeds.md`

**Interfaces:**

- Consumes: `SEED_USER_PASSWORD`, `Accounts.bootstrap_operator_user/3`,
  `Accounts.ensure_user_with_password/2`, explicit one-arity confirmation/reset
  delivery callbacks, `Accounts.create_api_token/2`, and
  `Accounts.revoke_api_token/2`.
- Produces: `ProductCompare.DevSeeds.Support.expect!/2`,
  `ProductCompare.DevSeeds.Support.capture_token!/1`, and
  `ProductCompare.DevSeeds.Accounts.seed!/2` returning
  `%{admin:, moderator:, shopper:, participant:, unverified:, reset_user:,
  active_api_token:, active_plain_text_token:, revoked_api_token:,
  confirmation_token:, reset_token:}`.

- [ ] **Step 1: Write failing account and local-token seed tests**

Require the seed-only modules from the test, invoke the real account seed
operation inside the SQL sandbox, and assert these exact contracts:

```elixir
assert %User{is_operator: true} = accounts.admin
assert %User{is_operator: true} = accounts.moderator
assert %User{is_operator: false} = accounts.shopper
assert %User{is_operator: false} = accounts.participant
assert is_nil(accounts.unverified.confirmed_at)
assert %User{} = Accounts.get_user_by_reset_password_token(accounts.reset_token)
assert {:ok, accounts.shopper, accounts.active_api_token} ==
         Accounts.authenticate_api_token(accounts.active_plain_text_token)
assert accounts.revoked_api_token.revoked_at
```

Authenticate `admin@example.com`, `moderator@example.com`,
`shopper@example.com`, `participant@example.com`, and `reset@example.com` with
the development password. Confirm that only `unverified@example.com` remains
unconfirmed. Configure the application-level mail hooks to raise if invoked;
the seed must still succeed because it uses explicit local token callbacks.

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected before implementation: the seed account modules and returned role/token
map do not exist.

- [ ] **Step 2: Add the seed-only support boundary**

Implement `Support.expect!/2` so it unwraps `{:ok, value}` and raises
`"development seed <stage> failed: ..."` for any other result. Implement
`Support.capture_token!/1` with a unique message reference and a synchronous
one-arity callback, returning the token delivered by the existing Accounts
context without using configured delivery hooks.

Keep password selection in `priv/repo/seeds.exs`: accept a non-blank
`SEED_USER_PASSWORD`, otherwise use `supersecretpass123` only in dev/test, and
retain the existing exception outside dev/test.

- [ ] **Step 3: Reconcile the six accounts and their token states**

In `ProductCompare.DevSeeds.Accounts.seed!/2`:

1. Bootstrap the two operator emails and retain the current
   `:existing_non_operator` exception text.
2. Ensure the four regular accounts exist.
3. Restore the configured password with `User.password_changeset/2`, set the
   five usable accounts confirmed with `User.confirm_changeset/1`, and set the
   unverified account's `confirmed_at` to `nil` through a validated Ecto change.
4. Restore operator/non-operator flags and reputation totals to their named
   baseline values.
5. Delete only shopper API tokens labeled `Development active` or
   `Development revoked`; create a revoked example followed by a usable active
   token.
6. Issue fresh confirmation and reset tokens through the explicit callback
   overloads and return their raw values for the post-commit guide.

Do not update any user outside the six reserved emails and do not weaken the
operator bootstrap check.

- [ ] **Step 4: Adopt the account result in the existing seed entry point**

Load `support.exs` and `accounts.exs` from `__DIR__/seeds`, choose one
microsecond-truncated `anchor`, and replace the current inline bootstrap with
`DevSeeds.Accounts.seed!(password, anchor)`. Continue passing its `admin` and
`moderator` records into the existing catalog/specification code until Task 2
extracts that code.

- [ ] **Step 5: Verify and commit the account milestone**

```bash
mix test test/product_compare/repo/seeds_test.exs
mix format priv/repo/seeds.exs priv/repo/seeds/support.exs priv/repo/seeds/accounts.exs test/product_compare/repo/seeds_test.exs
git diff --check
```

Record the passing focused evidence in the lane doc and commit:

```bash
git add priv/repo/seeds.exs priv/repo/seeds/support.exs priv/repo/seeds/accounts.exs test/product_compare/repo/seeds_test.exs docs/work/index.md docs/work/development-feature-seeds.md
git commit -m "feat: seed development account scenarios"
```

### Task 2: Catalog, Specification, Merchant, Offer, And Affiliate Scenarios

**Files:**

- Create: `priv/repo/seeds/catalog.exs`
- Create: `priv/repo/seeds/marketplace.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `docs/work/development-feature-seeds.md`

**Interfaces:**

- Consumes: the Task 1 account map, one anchor timestamp, Taxonomy, Catalog,
  Specs, Pricing, Affiliate, `SpecificationObservation`, and schema changesets
  for `Source`, `SourceArtifact`, and existing coupons where no context upsert
  exists.
- Produces: `ProductCompare.DevSeeds.Catalog.seed!/2` returning named
  taxonomies, taxons, attributes, products, evidence source/artifact, and
  claims; `ProductCompare.DevSeeds.Marketplace.seed!/2` returning named
  merchants, offers, price points, affiliate networks/programs/links, and
  coupons.

- [ ] **Step 1: Add failing catalog and marketplace scenario tests**

Run the real entry point and assert stable lookups demonstrate:

- monitor, TV, and projector products with distinct boolean, numeric, and enum
  current attributes;
- at least two merchants and products with one-merchant and multi-merchant
  availability;
- current offers representing fresh in-stock, aging, stale, out-of-stock,
  inactive/unavailable, and never-observed states relative to the anchor;
- active, future, and expired coupon codes;
- active and paused affiliate programs and affiliate links;
- an imported current claim with `ClaimEvidence` pointing at the synthetic
  manufacturer artifact.

Use stable slugs, domains, external SKUs, source name, and coupon codes in the
assertions; do not assert generated integer IDs.

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected before implementation: the TV/projector products, marketplace state
matrix, affiliate programs, coupon windows, and source evidence are absent.

- [ ] **Step 2: Extract and expand the catalog seed**

Move the existing taxonomy, dimensions, units, enum definitions, filterable
attributes, products, use-case assignments, claims, and current-claim selection
into `DevSeeds.Catalog.seed!/2` without changing the existing three product
slugs. Add TV and projector products plus attribute values that produce real
facet and comparison differences.

Upsert a source identified by
`{kind: "manufacturer", name: "Development Manufacturer Evidence"}` and one
artifact identified by a fixed content hash. Use
`Specs.import_observation/4` for at least one claim/evidence pair; use the
existing propose/accept/select workflow for editorial claims. Return records by
semantic keys rather than a positional tuple.

- [ ] **Step 3: Seed the marketplace state matrix**

Implement `DevSeeds.Marketplace.seed!/2` with stable merchant domains,
merchant-product URLs/SKUs, and price observation times derived from `anchor`.
For each price point, look up the exact merchant product and observation time
before calling `Pricing.add_price_point/1`. Restore merchant-product active and
last-seen fields through `Pricing.upsert_merchant_product/1`.

Use `Affiliate.upsert_network/1`, `upsert_program/1`, and `upsert_link/1` for
their natural conflict keys. Because coupons have no context upsert, reconcile
only exact `{merchant_id, code}` seed coupons through `Coupon.changeset/2` and
Repo insert/update. Set coupon windows relative to the shared anchor.

- [ ] **Step 4: Make the entry point a transactional domain orchestrator**

Load all current seed modules, open one `Repo.transaction/1`, call Accounts,
Catalog, and Marketplace in dependency order, and return their maps. Raise with
the Support stage label on rollback. Do not print credentials or links inside
the transaction.

- [ ] **Step 5: Verify and commit the catalog/marketplace milestone**

```bash
mix test test/product_compare/repo/seeds_test.exs
mix test test/product_compare/catalog test/product_compare/pricing test/product_compare/affiliate
mix format priv/repo/seeds.exs priv/repo/seeds/catalog.exs priv/repo/seeds/marketplace.exs test/product_compare/repo/seeds_test.exs
git diff --check
```

```bash
git add priv/repo/seeds.exs priv/repo/seeds/catalog.exs priv/repo/seeds/marketplace.exs test/product_compare/repo/seeds_test.exs docs/work/development-feature-seeds.md
git commit -m "feat: seed catalog and marketplace scenarios"
```

### Task 3: Comparison, Alert, Community, And Correction Scenarios

**Files:**

- Create: `priv/repo/seeds/engagement.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `docs/work/development-feature-seeds.md`

**Interfaces:**

- Consumes: account, catalog, and marketplace result maps;
  `Catalog.create_saved_comparison_set/2`, `ComparisonSnapshots.publish/3`,
  Alerts, Discussions, Specs correction operations, and targeted schema
  changesets only where a context has no update/upsert operation.
- Produces: `ProductCompare.DevSeeds.Engagement.seed!/4` returning named saved
  sets, public snapshot, watches/events, reviews, questions/answers/report, and
  pending/accepted/rejected corrections.

- [ ] **Step 1: Add failing owner, public, and moderation-state tests**

Assert the shopper owns two named saved comparison sets and one active public
snapshot whose token resolves through `ComparisonSnapshots.get_public/1`.
Assert enabled/disabled watch states and read/unread event states through the
Alerts queries. Assert two visible reviews, a published question with multiple
answers and one accepted answer, independently owned content, one report, and
pending/hidden/published moderation examples. Assert correction queries expose
one pending, one accepted, and one rejected example across distinct
product/attribute pairs.

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected before implementation: saved/shared comparison, alert, community, and
correction scenarios are absent.

- [ ] **Step 2: Reconcile saved and shared comparisons**

For saved sets, find only the shopper's reserved names (`Gaming shortlist` and
`Home theater shortlist`), delete them through the Catalog context, and recreate
their ordered product selections. Preserve an existing active snapshot titled
`Development comparison`; publish it only when absent so its public token and
deep link remain stable across reruns.

- [ ] **Step 3: Reconcile watches and locally generate alert events**

Identify seed watches by the shopper, product, optional merchant product, and
rule type. Delete only those exact watches through Alerts, recreate target-price,
percentage-drop, back-in-stock, and disabled watch examples, and evaluate the
named seeded price points with `Alerts.evaluate_price_point/2`. Mark one event
read through `Alerts.mark_alert_read/2`; leave another unread. Pass the shared
anchor as `now` and never enqueue alert-delivery work.

- [ ] **Step 4: Reconcile community ownership and moderation lifecycles**

Use fixed seed idempotency keys with `submit_review/4`, `ask_question/4`, and
`answer_question/4`. Restore text through `Discussions.update_owned/4`, move
records to the required published/hidden states through `moderate/5`, accept the
named participant answer through `accept_answer/3`, and create the exact
participant report only when it is absent. Keep question ownership with the
shopper and answer ownership with the participant.

- [ ] **Step 5: Reconcile correction lifecycle examples**

Use `Specs.propose_correction/5` for distinct seed product/attribute pairs and
`Specs.moderate_correction/4` for accepted and rejected examples. Restore the
pending example's reason, source URL, and explanation through its schema
changeset when it already exists. Never overwrite non-seed corrections.

- [ ] **Step 6: Verify and commit the engagement milestone**

```bash
mix test test/product_compare/repo/seeds_test.exs
mix test test/product_compare/comparison_snapshots_test.exs test/product_compare/alerts test/product_compare/discussions test/product_compare/specs
mix format priv/repo/seeds.exs priv/repo/seeds/engagement.exs test/product_compare/repo/seeds_test.exs
git diff --check
```

```bash
git add priv/repo/seeds.exs priv/repo/seeds/engagement.exs test/product_compare/repo/seeds_test.exs docs/work/development-feature-seeds.md
git commit -m "feat: seed shopper and community scenarios"
```

### Task 4: Synthetic CJ, Attribution, Guide, And GraphQL Route Coverage

**Files:**

- Create: `priv/repo/seeds/operations.exs`
- Create: `priv/repo/seeds/guide.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Create: `test/product_compare_web/graphql/development_seeds_test.exs`
- Modify: `docs/work/development-feature-seeds.md`

**Interfaces:**

- Consumes: all prior result maps; local Source changesets,
  `Ingestion.upsert_merchant_feed_candidate/2`, CJ lifecycle updates, import-run
  start/complete operations, CommerceAttribution operations, and frontend route
  paths already defined in `assets/src/router.tsx`.
- Produces: `ProductCompare.DevSeeds.Operations.seed!/4` returning named CJ
  programs/feeds/runs and commerce links/clicks/conversions/price facts;
  `ProductCompare.DevSeeds.Guide.print/1`, the only output boundary.

- [ ] **Step 1: Add failing operations and route-contract tests**

In `seeds_test.exs`, assert CJ programs cover `:new`, `:considering`,
`:selected`, `:applied`, `:accepted`, `:not_pursuing`, and `:declined`; feeds
include matched and unmatched examples; and import history includes succeeded
and failed runs for both `shoppingProducts` and `shoppingProductFeeds` with
redacted synthetic error summaries.

Assert the revenue context returns approved, pending, reversed, and paid
conversion states with commission totals and purchase-price facts. Capture seed
output and assert it contains all six emails, `/auth/verify-email?token=`,
`/auth/reset-password?token=`, the active API token, the shared comparison URL,
and the catalog, offer, merchant, saved comparison, alert, affiliate, CJ, and
revenue route families.

In the GraphQL test, run the real seeds once and issue representative public,
shopper-session, and operator-session reads for the frontend contracts:

```graphql
query DevelopmentSeedSmoke($productId: ID!) {
  products(first: 20) { edges { node { slug } } }
  merchants(first: 20) { edges { node { slug } } }
  merchantProducts(first: 20, input: {productId: $productId}) {
    edges { node { id } }
  }
}
```

Add authenticated operations for saved comparisons, alerts, API tokens,
community ownership, and revenue; add operator operations for affiliate setup,
correction moderation, and CJ programs. Assert non-empty stable semantic fields,
not generated database IDs.

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
```

Expected before implementation: operations modules, printed guide, synthetic
provider history, revenue examples, and route smoke reads are missing.

- [ ] **Step 2: Reconcile synthetic CJ programs, feeds, and runs locally**

Ensure the canonical CJ source with `Source.changeset/2`; do not call a CJ
fetcher. Upsert feeds with stable `DEV-CJ-*` provider feed and advertiser IDs.
Use blank advertiser identity for the unmatched example and update program
stages through `Ingestion.update_cj_program_lifecycle/3`.

Identify seed runs with a reserved `query["seedScenario"]` value, delete only
those exact source-owned runs, then create/complete local success and failure
history with the Ingestion context. Keep queries and error summaries redacted
and synthetic.

- [ ] **Step 3: Reconcile recorded commerce attribution**

Upsert commerce links from the seeded affiliate programs. Create click sessions
with fixed valid UUID `click_id` values or reuse the existing exact click. Ingest
conversions with stable network conversion references and status/date/amount
states derived from the anchor. Reconcile the one-to-one purchase-price fact by
conversion, using its changeset to update an existing seed fact because the
context exposes create but no update.

- [ ] **Step 4: Print the post-commit testing guide**

Call `Guide.print/1` only after `Repo.transaction/1` returns `{:ok, result}`.
Group output under Accounts, Shopper routes, Operator routes, and Synthetic data.
Print the configured password source, active plain API token, verification/reset
links, the preserved shared token, and concrete seeded product/category/merchant
paths. Print no primary keys, hashes, raw JSON, or secret-looking provider value.

- [ ] **Step 5: Prove external isolation**

In the seed test, configure delivery hooks, CJ discovery/import runners, and
scheduler runner callbacks to send an `:external_seed_call` message or raise.
Run the full entry point and refute receipt of that message. Assert no Oban job
is added by comparing the CJ worker job counts before and after the seed.

- [ ] **Step 6: Verify and commit the operations/guide milestone**

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare/ingestion test/product_compare/commerce_attribution test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs
mix format priv/repo/seeds.exs priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git diff --check
```

```bash
git add priv/repo/seeds.exs priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs docs/work/development-feature-seeds.md
git commit -m "feat: seed synthetic operator workflows"
```

### Task 5: Deterministic Rerun Contract And Full Closeout

**Files:**

- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`
- Modify: `docs/work/development-feature-seeds.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**

- Consumes: the complete seed entry point and all stable seed keys from Tasks
  1-4.
- Produces: regression evidence for duplicate-free reruns, restoration of
  seed-owned state, preservation of unrelated local data, atomic failure, and
  complete route visibility.

- [ ] **Step 1: Add the failing rerun/restoration regression**

Run the complete seed once and record counts scoped to the six seed emails,
reserved product slugs, merchant domains, API-token labels, saved-set names,
community idempotency keys, provider IDs, source name, and conversion refs.
Then:

1. rename one seeded product and change one seeded merchant/program state;
2. add an unrelated user, product, merchant, API token, and community record;
3. run the complete seed again;
4. assert all scoped counts are unchanged, the three edited seed fields return
   to baseline, the snapshot token is unchanged, and every unrelated record is
   byte-for-byte present.

Expected before final reconciliation fixes: at least one seed-owned collection
duplicates or fails to restore its edited field.

- [ ] **Step 2: Add the atomic failure regression**

Extend the existing preclaimed-operator test to assert the outer transaction
does not leave `shopper@example.com`, reserved products, merchants, or sources
behind after the operator conflict raises. Keep the attacker's hash and role
unchanged.

- [ ] **Step 3: Fix only the failing reconciliation boundaries**

Use the failing stable-key assertions to add targeted lookup/update/delete logic
inside the owning seed module. Do not introduce a general table cleaner, delete
all user-owned data, weaken context validation, or make the seed depend on a
fresh database.

- [ ] **Step 4: Run focused, affected, and full verification**

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare/accounts test/product_compare/catalog test/product_compare/pricing test/product_compare/affiliate test/product_compare/alerts test/product_compare/discussions test/product_compare/specs test/product_compare/comparison_snapshots_test.exs test/product_compare/ingestion test/product_compare/commerce_attribution
mix test test/product_compare_web/graphql
mix format --check-formatted
mix typecheck
mix quality
mix test
mix work_queue.validate
git diff --check
```

- [ ] **Step 5: Record observed evidence and close the queue row**

Change the lane doc's `Target Outcome` to observed `Batch Outcome`, record the
focused/full command results and the external-isolation/rerun evidence, remove
the completed row from `docs/work/index.md` while leaving its three unrelated
ready rows intact, and retain the plan/spec in `docs/plans/INDEX.md` as completed
development-environment history.

- [ ] **Step 6: Commit the closeout**

```bash
git add priv/repo/seeds.exs priv/repo/seeds test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs docs/work/development-feature-seeds.md docs/work/index.md docs/plans/INDEX.md
git commit -m "test: prove deterministic development seeds"
```

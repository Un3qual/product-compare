# Commerce Identifier Storage Integrity Implementation Plan

> **Status: needs decision; do not execute.** Final branch review proved that
> `Merchant.changeset/2` uses PCRE `$` and accepts a single trailing newline,
> while this draft's PostgreSQL slug predicate rejects it. Choose and align
> exact end-of-string semantics before replacing this plan. Its proposed
> `20260805060000` migration version is now assigned to a different ready row;
> any replacement commerce plan must use a fresh version.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the established merchant-slug and affiliate-network-code formats when commerce writes bypass their changesets.

**Architecture:** One forward migration adds one named POSIX check per table, each owning schema maps its failure, and one focused direct-write suite proves invalid rejection plus accepted controls. Existing commerce construction, lookup, and upsert behavior remains unchanged.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve `Merchant.changeset/2` slug behavior, merchant reads, and slug
  stability across merchant identity updates.
- Preserve `AffiliateNetwork.normalize_code/1`, default-code generation,
  network uniqueness, and affiliate upsert behavior.
- Do not implement the proposed predicates while their end-anchor semantics
  differ from the owning application regexes.
- Add no identifier length limit, Unicode policy, URL policy, normalization,
  generic helper, or storage-policy framework.
- Stop rather than rewrite values if preflight discovers invalid data.
- Use a forward migration and never reset the development database.

---

### Task 1: Characterize Direct Commerce-Identifier Writes

**Files:**

- Create: `test/product_compare/repo/commerce_identifier_storage_integrity_test.exs`
- Read: `lib/product_compare_schemas/pricing/merchant.ex`
- Read: `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- Read: `priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs`
- Read: `priv/repo/migrations/20260713200000_add_merchant_slugs.exs`

**Interfaces:**

- Consumes: `merchants.slug`, `affiliate_networks.code`, and their existing
  changeset regular expressions.
- Produces: direct-SQL characterization for
  `merchants_slug_format_check` and `affiliate_networks_code_format_check`.

- [ ] **Step 1: Add failing malformed-slug and malformed-code tests**

  In `CommerceIdentifierStorageIntegrityTest`, use `ProductCompare.Repo.query/2`
  to insert a merchant with `slug = 'bad slug'` and an affiliate network with
  `code = 'bad-code'`. Supply unique valid names, domains, timestamps, and
  entropy IDs. Assert Postgrex constraint errors name
  `merchants_slug_format_check` and `affiliate_networks_code_format_check`.

- [ ] **Step 2: Add valid direct-write controls**

  Insert a merchant with `slug = 'north-main-1'` and an affiliate network with
  `code = 'impact_network'`. Assert both inserts succeed, preserving the
  current accepted formats.

- [ ] **Step 3: Run the focused RED command**

  ```bash
  mix test test/product_compare/repo/commerce_identifier_storage_integrity_test.exs
  ```

  Expected before the migration: both malformed direct inserts succeed, so
  their exact constraint-name assertions fail.

### Task 2: Enforce and Map Both Commerce Identifier Checks

**Files:**

- Create after replanning: `priv/repo/migrations/TIMESTAMP_enforce_commerce_identifier_storage_integrity.exs`
- Modify: `lib/product_compare_schemas/pricing/merchant.ex`
- Modify: `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- Test: `test/product_compare/repo/commerce_identifier_storage_integrity_test.exs`
- Verify: `test/product_compare/pricing/merchant_detail_test.exs`
- Verify: `test/product_compare/affiliate/affiliate_workflows_test.exs`

**Interfaces:**

- Consumes: the two direct-write contracts from Task 1.
- Produces: named database checks mapped to `:slug` and `:code` in the owning
  changesets.

- [ ] **Step 1: Run exact invalid-row preflights**

  Run these read-only queries against the target database:

  ```sql
  SELECT id, slug
  FROM merchants
  WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ORDER BY id;

  SELECT id, code
  FROM affiliate_networks
  WHERE code !~ '^[a-z0-9]+(_[a-z0-9]+)*$'
  ORDER BY id;
  ```

  Expected: zero rows from both queries. If either query returns data, stop
  and report the table, IDs, and values without rewriting rows.

- [ ] **Step 2: Add the reversible forward migration**

  In `up/0`, create exactly:

  ```elixir
  create constraint(:merchants, :merchants_slug_format_check,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:affiliate_networks, :affiliate_networks_code_format_check,
           check: "code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'"
         )
  ```

  In `down/0`, remove both named constraints from their respective tables.

- [ ] **Step 3: Map each named failure in its owner**

  Add `check_constraint(:slug, name: :merchants_slug_format_check)` after
  `Merchant.changeset/2`'s existing `validate_format/3`. Add
  `check_constraint(:code, name: :affiliate_networks_code_format_check)` after
  `AffiliateNetwork.changeset/2`'s existing `validate_format/3`. Do not alter
  `put_default_code/1`, `normalize_code/1`, uniqueness mappings, or merchant
  lookup functions.

- [ ] **Step 4: Apply and verify GREEN**

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/commerce_identifier_storage_integrity_test.exs test/product_compare/pricing/merchant_detail_test.exs test/product_compare/affiliate/affiliate_workflows_test.exs
  ```

  Expected: malformed direct writes return their exact named checks, valid
  controls succeed, and the 14 existing merchant-detail and affiliate-workflow
  tests pass.

- [ ] **Step 5: Carry the implementation into the repository gates**

  Do not make a focused-test-only commit here. Carry the migration, owning
  schemas, regression test, lane evidence, and this plan together through Task
  3, then commit the verified implementation milestone once the repository
  gates pass.

### Task 3: Record Evidence and Run the Repository Gates

**Files:**

- Modify: `docs/work/commerce-identifier-storage-integrity.md`
- Modify: `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`

**Interfaces:**

- Consumes: the two constraints and results from the passing focused test suites
  from Task 2.
- Produces: observed verification evidence for coordinator dispatch closeout.

- [ ] **Step 1: Record actual preflight and direct-write results**

  Replace prospective lane wording only with observed preflight output,
  direct-write results, and focused-suite counts. Leave
  `docs/work/index.md`, `docs/plans/INDEX.md`, and work-index history for the
  coordinator dispatch update.

- [ ] **Step 2: Run repository gates**

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Commit the verified implementation and evidence together**

  ```bash
  git add priv/repo/migrations/TIMESTAMP_enforce_commerce_identifier_storage_integrity.exs lib/product_compare_schemas/pricing/merchant.ex lib/product_compare_schemas/affiliate/affiliate_network.ex test/product_compare/repo/commerce_identifier_storage_integrity_test.exs docs/work/commerce-identifier-storage-integrity.md docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md
  git commit -m "fix: constrain commerce identifier formats"
  ```

Exit condition: PostgreSQL rejects malformed merchant slugs and affiliate
network codes under their named checks, accepts the established formats, and
preserves merchant lookup plus affiliate upsert behavior.

# Runtime And Database Trust Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser origin/session authority and reachable relational/numeric database failures fail closed with predictable Phoenix, Ecto, GraphQL, and PostgreSQL behavior.

**Architecture:** Runtime authority comes from validated endpoint configuration, never the request `Host` header. Ecto rejects malformed same-row values early and maps database failures, while PostgreSQL retains the final finite-value, foreign-key, and community-storage constraints.

**Tech Stack:** Elixir 1.19, Phoenix 1.8, Plug, Ecto 3.13, PostgreSQL, Absinthe, ExUnit

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Keep Phoenix's signed session cookie and GraphQL browser-auth contract unchanged.
- The configured endpoint URL is the same-origin authority; explicit trusted origins remain exact normalized origins.
- Session cookies are host-only unless `SESSION_COOKIE_DOMAIN` explicitly opts into a validated parent domain.
- Every new or changed same-row check ships with normalization, pre-write validation, `check_constraint/3`, changeset coverage, and direct database coverage.
- Foreign keys remain database-authoritative; do not add existence preflight queries.
- Do not reset or drop the contaminated shared test database. Use a unique `MIX_TEST_PARTITION` for database verification.

---

### Task 1: Bind origin and session authority to validated runtime configuration

**Files:**

- Modify: `lib/product_compare_web/plugs/require_same_origin.ex`
- Modify: `lib/product_compare_web/runtime_config.ex`
- Modify: `config/runtime.exs`
- Modify: `lib/product_compare_web/endpoint.ex` only if session option composition needs a focused owner
- Create: `test/product_compare_web/plugs/require_same_origin_test.exs`
- Modify: `test/product_compare_web/runtime_config_test.exs`
- Modify: `test/product_compare_web/endpoint_test.exs`

**Interfaces:**

- `RuntimeConfig.endpoint_host!/1` returns a normalized non-empty production host or raises an environment-specific `ArgumentError`.
- `RuntimeConfig.session_cookie_domain/2` returns `nil` for host-only cookies and a normalized validated domain only for an explicit opt-in.
- `RequireSameOrigin.allowed_origins/1` derives its canonical origin from `ProductCompareWeb.Endpoint` URL configuration and appends normalized trusted origins.

- [ ] **Step 1: Write failing runtime and plug tests**

  Cover a forged request `Host` plus matching `Origin`, endpoint default and non-default ports, explicit trusted origins, missing/blank/invalid `PHX_HOST`, host-only default session options, and accepted/rejected explicit parent domains.

- [ ] **Step 2: Run the focused RED suite**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare_web/plugs/require_same_origin_test.exs \
    test/product_compare_web/runtime_config_test.exs \
    test/product_compare_web/endpoint_test.exs
  ```

  Expected: the forged-host and host-only/missing-host assertions fail against the current request-host fallback and automatic parent-domain behavior.

- [ ] **Step 3: Implement the minimal configured-authority boundary**

  Use endpoint URL `scheme`, `host`, and effective `port` in `RequireSameOrigin`. Validate production `PHX_HOST` before deriving trusted origins or endpoint options. Omit `:domain` from session options unless the explicit domain passes the configured-host relationship check.

- [ ] **Step 4: Re-run the focused suite and format**

  ```bash
  mix format lib/product_compare_web/plugs/require_same_origin.ex \
    lib/product_compare_web/runtime_config.ex config/runtime.exs \
    test/product_compare_web/plugs/require_same_origin_test.exs \
    test/product_compare_web/runtime_config_test.exs \
    test/product_compare_web/endpoint_test.exs
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare_web/plugs/require_same_origin_test.exs \
    test/product_compare_web/runtime_config_test.exs \
    test/product_compare_web/endpoint_test.exs
  ```

---

### Task 2: Enforce finite commerce numerics through changesets and PostgreSQL

**Files:**

- Create: `priv/repo/migrations/20260830120000_enforce_commerce_numeric_integrity.exs`
- Create: `lib/product_compare_schemas/finite_decimal.ex`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_conversion.ex`
- Modify: `lib/product_compare_schemas/commerce_attribution/purchase_price_fact.ex`
- Create: `test/product_compare/repo/commerce_numeric_integrity_test.exs`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**

- Decimal schema fields return cast errors for non-finite values without rewriting input maps.
- `CommerceConversion.changeset/2` rejects non-finite `order_amount`, `commission_amount`, and `commission_rate` before SQL.
- `PurchasePriceFact.changeset/2` rejects non-finite price facts, including signed `price_delta`, before SQL.
- PostgreSQL constraints reject all three non-finite numeric encodings; signed `price_delta` remains allowed when finite.

- [ ] **Step 1: Add failing changeset examples**

  Exercise `Decimal.new("NaN")`, `Decimal.new("Infinity")`, and `Decimal.new("-Infinity")` for each reachable monetary field. Assert finite negative `price_delta` remains valid.

- [ ] **Step 2: Add failing direct database examples**

  Insert non-finite commerce conversion and purchase-price facts with `Repo.query/2`; assert the exact intended constraint names. Include one accepted finite signed delta.

- [ ] **Step 3: Run the focused RED suite**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare/repo/commerce_numeric_integrity_test.exs \
    test/product_compare/commerce_attribution/commerce_attribution_test.exs
  ```

- [ ] **Step 4: Add finite casting, validation, mappings, and migration checks**

  Use `ProductCompareSchemas.FiniteDecimal` for ordinary Ecto cast errors without per-changeset input rewriting. Replace the two lower-bound-only checks with finite-aware named checks and add a separate finite check for `price_delta`; preserve all existing nullability and sign rules.

- [ ] **Step 5: Migrate the isolated partition and run GREEN**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix ecto.migrate
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare/repo/commerce_numeric_integrity_test.exs \
    test/product_compare/commerce_attribution/commerce_attribution_test.exs
  ```

---

### Task 3: Map cast foreign keys and camelize changeset mutation fields

**Files:**

- Modify: `lib/product_compare_schemas/catalog/product.ex`
- Modify: `lib/product_compare_schemas/taxonomy/product_taxon.ex`
- Modify: `lib/product_compare_schemas/discussions/community_report.ex`
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Create: `test/product_compare/repo/foreign_key_constraint_mapping_test.exs`
- Modify: `test/product_compare_web/graphql/errors_test.exs`

**Interfaces:**

- The three changesets map every foreign key they cast, using explicit constraint names only where Ecto cannot infer the generated name.
- `Errors.changeset_mutation_errors/1` uses the existing camelCase field normalizer; `changeset_first_error/1` retains its internal normalized-field contract.

- [ ] **Step 1: Write failing mapping and camelCase tests**

  Persist changesets with nonexistent brand/taxon/product/reporter/target ids and assert `{:error, changeset}` rather than `Ecto.ConstraintError`. Add a `:cooldown_seconds` changeset error and assert `field: "cooldownSeconds"`.

- [ ] **Step 2: Run RED**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare/repo/foreign_key_constraint_mapping_test.exs \
    test/product_compare_web/graphql/errors_test.exs
  ```

- [ ] **Step 3: Add only the missing mappings and reuse camelization**

  Do not query for relationship existence and do not change messages or `changeset_first_error/1` callers.

- [ ] **Step 4: Run GREEN**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare/repo/foreign_key_constraint_mapping_test.exs \
    test/product_compare_web/graphql/errors_test.exs
  ```

---

### Task 4: Complete community write-storage boundary coverage

**Files:**

- Modify: `test/product_compare/discussions/community_trust_test.exs`
- Modify only if a discovered mismatch requires it: `lib/product_compare_schemas/discussions/community_write_receipt.ex`
- Modify only if a discovered mismatch requires it: `lib/product_compare_schemas/discussions/community_write_window.ex`

**Interfaces:**

- Changeset coverage proves digest length, idempotency-key shape, non-negative count, and UTC-hour alignment.
- Direct SQL coverage proves the named receipt key/digest and write-window count/hour constraints remain authoritative.

- [ ] **Step 1: Add the missing focused changeset and direct-write assertions**

  Use the existing fixtures and direct SQL style in `community_trust_test.exs`; do not create a generic constraint inventory.

- [ ] **Step 2: Run the complete outcome suite**

  ```bash
  MIX_TEST_PARTITION=quality_runtime mix test \
    test/product_compare_web/plugs/require_same_origin_test.exs \
    test/product_compare_web/runtime_config_test.exs \
    test/product_compare_web/endpoint_test.exs \
    test/product_compare/repo/commerce_numeric_integrity_test.exs \
    test/product_compare/commerce_attribution/commerce_attribution_test.exs \
    test/product_compare/repo/foreign_key_constraint_mapping_test.exs \
    test/product_compare_web/graphql/errors_test.exs \
    test/product_compare/discussions/community_trust_test.exs
  mix format --check-formatted
  mix typecheck
  git diff --check
  ```

- [ ] **Step 3: Commit the reviewed outcome**

  ```bash
  git add config/runtime.exs lib/product_compare_web lib/product_compare_schemas \
    priv/repo/migrations/20260830120000_enforce_commerce_numeric_integrity.exs \
    test/product_compare test/product_compare_web docs/work/runtime-database-trust-boundaries.md \
    docs/work/index.md
  git commit -m "fix: harden runtime and database trust boundaries"
  ```

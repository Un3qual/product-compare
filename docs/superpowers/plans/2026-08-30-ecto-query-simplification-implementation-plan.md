# Ecto Query Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Ecto own ordinary application query semantics and confine unavoidable PostgreSQL SQL to small, named boundaries without changing behavior, concurrency, or query budgets.

**Architecture:** Refactor in four independently testable slices: direct query-DSL substitutions, aggregate report classification, atomic conflict updates, and native PostgreSQL boundaries. Existing focused tests characterize behavior; the implementation keeps work in SQL when it is bounded and set-based, but expresses standard operations through Ecto and presentation mapping through Elixir.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL, ExUnit, Credo, Dialyzer, ExDNA, Reach

**Spec:** `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Global Constraints

- Prefer Ecto built-ins over raw SQL and fragments whenever they express the same contract clearly.
- Keep fragments only for PostgreSQL functions, operators, conflict pseudo-tables, or lock primitives that Ecto does not model.
- Preserve transaction, row-lock, advisory-lock, stale-write, query-count, pagination, and result-ordering behavior.
- Do not load an unbounded database result into Elixir merely to eliminate a fragment.
- Migrations and direct database-contract tests may retain SQL that directly proves PostgreSQL behavior.
- Do not introduce a generic query DSL, fragment wrapper, or source-scanning policy test.

---

### Task 1: Replace ordinary SQL expressions with Ecto built-ins

**Files:**
- Modify: `lib/product_compare/pricing/price_history.ex`
- Modify: `lib/product_compare/pricing/home_offers.ex`
- Modify: `lib/product_compare/pricing/current_offers.ex`
- Modify: `lib/product_compare/alerts/home_relevance.ex`
- Modify: `lib/mix/tasks/product_compare/ingestion/cj_candidates/application_cohort_report.ex`
- Modify: `lib/product_compare/catalog/search.ex`
- Modify: `lib/product_compare/specs/reads/current_attributes.ex`
- Modify: `lib/product_compare/ingestion/cj_run_throughput.ex`
- Modify: `lib/product_compare/seo/categories.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`
- Test: `test/product_compare/pricing/home_offers_test.exs`
- Test: `test/product_compare/alerts/home_relevance_test.exs`
- Test: `test/product_compare/specs/home_highlights_test.exs`
- Test: `test/product_compare/ingestion/cj_run_throughput_test.exs`
- Test: `test/product_compare/seo_test.exs`

**Interfaces:**
- Consumes: existing public query functions and Ecto 3.13 query API.
- Produces: identical query results using `type(^nil, ...)`, `coalesce/2`, `asc_nulls_last`, `type(field, :date)`, and correlated `exists/1` subqueries.

- [ ] **Step 1: Run the characterization tests**

Run:

```bash
MIX_TEST_PARTITION=quality_tooling mix test \
  test/product_compare/pricing/pricing_test.exs \
  test/product_compare/pricing/home_offers_test.exs \
  test/product_compare/alerts/home_relevance_test.exs \
  test/product_compare/specs/home_highlights_test.exs \
  test/product_compare/ingestion/cj_run_throughput_test.exs \
  test/product_compare/seo_test.exs
```

Expected: all selected tests pass before the behavior-preserving refactor.

- [ ] **Step 2: Replace typed SQL NULL expressions**

Replace every expression shaped like:

```elixir
type(fragment("NULL"), :decimal)
```

with an Ecto-typed interpolated value:

```elixir
type(^nil, :decimal)
```

Apply the matching declared type for decimal, integer, and UTC datetime fields.

- [ ] **Step 3: Replace simple COALESCE fragments**

Use Ecto expressions such as:

```elixir
where(query, [candidate], coalesce(candidate.product_count, 0) >= ^minimum)

ilike(coalesce(product.model_number, ""), ^pattern)
```

Keep `NULLIF`, trimming, case-folding, trigram, and full-text functions in focused fragments because Ecto has no equivalent.

- [ ] **Step 4: Replace manual null ordering and date casts**

Use:

```elixir
order_by: [
  asc_nulls_last: taxon_attribute.sort_order,
  asc: fragment("lower(?)", attribute.display_name),
  asc: attribute.code
]
```

and reuse the Ecto expression:

```elixir
type(run.started_at, :date)
```

in `group_by`, `order_by`, and `select`.

- [ ] **Step 5: Replace raw EXISTS subqueries**

Name the product root binding and use correlated Ecto subqueries:

```elixir
specifications =
  from current in ProductAttributeCurrent,
    where: current.product_id == parent_as(:product).id,
    offset: ^specification_offset,
    limit: 1,
    select: 1

media =
  from media in ProductMedia,
    where: media.product_id == parent_as(:product).id,
    select: 1

from product in queryable,
  as: :product,
  where: exists(specifications),
  where:
    fragment("char_length(trim(?)) >= ?", coalesce(product.description, ""), ^minimum) or
      exists(media)
```

- [ ] **Step 6: Run focused tests and commit**

Run the command from Step 1 plus `mix format --check-formatted` and `git diff --check`.

Expected: all tests and formatting checks pass.

Commit:

```bash
git add lib test
git commit -m "refactor: prefer ecto query expressions"
```

### Task 2: Move aggregate report business rules out of fragments

**Files:**
- Modify: `lib/product_compare/ingestion/source_health.ex`
- Modify: `lib/product_compare/ingestion/cj_candidate_freshness.ex`
- Modify: `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`
- Modify: `lib/product_compare/ingestion/cj_program_warnings.ex`
- Test: `test/product_compare/ingestion/source_health_test.exs`
- Test: `test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- Test: `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`
- Test: `test/product_compare/ingestion/cj_program_warnings_test.exs`

**Interfaces:**
- Consumes: existing summary functions and `ProductCompareSchemas.Ingestion.ImportRun` / `ProductCompareSchemas.Specs.SourceArtifact` schemas.
- Produces: the same public string/atom bucket maps from schema-aware queries, filtered aggregates, and Elixir presentation mapping.

- [ ] **Step 1: Run report characterization tests**

Run:

```bash
MIX_TEST_PARTITION=quality_tooling mix test \
  test/product_compare/ingestion/source_health_test.exs \
  test/product_compare/ingestion/cj_candidate_freshness_test.exs \
  test/product_compare/ingestion/cj_candidate_market_coverage_test.exs \
  test/product_compare/ingestion/cj_program_warnings_test.exs
```

Expected: all selected tests pass.

- [ ] **Step 2: Make source health schema-aware**

Query `SourceArtifact` and `ImportRun` rather than string table names. Compare `run.status == :failed` through the `Ecto.Enum` field and normalize selected status atoms for the existing public string contract:

```elixir
defp status(nil), do: nil
defp status(value) when is_atom(value), do: Atom.to_string(value)
```

- [ ] **Step 3: Replace freshness CASE SQL with filtered aggregates**

Compute `fresh_after` and `stale_before` in Elixir, group by `program.stage`, and select:

```elixir
%{
  stage: program.stage,
  candidate_count: count(feed.id),
  fresh_count: filter(count(feed.id), feed.last_seen_at >= ^fresh_after),
  stale_count:
    filter(
      count(feed.id),
      feed.last_seen_at < ^fresh_after and feed.last_seen_at <= ^stale_before
    )
}
```

Derive `aging_count = candidate_count - fresh_count - stale_count` in Elixir and update the three fixed bucket maps without loading individual candidates.

- [ ] **Step 4: Select program stages through Ecto.Enum**

Select `program.stage` directly in freshness and market coverage queries. Map `nil` to `:unmatched`, accept existing stage atoms, and retain string fallback only for schemaless compatibility:

```elixir
defp stage(nil), do: :unmatched
defp stage(value) when value in @stages, do: value
defp stage(value) when is_binary(value), do: Map.get(@stage_keys, value, :unmatched)
```

Use `coalesce(code, "unknown")` for ordinary dimension fields.

- [ ] **Step 5: Keep only the unsupported aggregate function in warning fragments**

Express each condition with Ecto and pass it to PostgreSQL's unsupported `bool_or` aggregate:

```elixir
missing_product_count:
  fragment("bool_or(?)", is_nil(feed.product_count) or feed.product_count <= 0),
non_us_market:
  fragment("bool_or(?)", coalesce(country.code, "") != "US")
```

Keep the narrow `NULLIF(BTRIM(...))` normalization fragment for advertiser names.

- [ ] **Step 6: Run focused tests and commit**

Run the command from Step 1, `mix credo --strict`, and `git diff --check`.

Expected: all checks pass and no report performs unbounded Elixir-side filtering.

Commit:

```bash
git add lib/product_compare/ingestion test/product_compare/ingestion
git commit -m "refactor: simplify ingestion report queries"
```

### Task 3: Simplify atomic observation conflict updates

**Files:**
- Modify: `lib/product_compare/catalog/evidence.ex`
- Review without forced change: `lib/product_compare/ingestion/listing_persistence/enrichment.ex`
- Test: `test/product_compare/ingestion/enrichment_test.exs`

**Interfaces:**
- Consumes: `Catalog.upsert_product_media/4` and the existing category-candidate upsert.
- Produces: monotonic observation behavior with fewer fragments and unchanged arrival-count semantics.

- [ ] **Step 1: Run ordering characterization tests**

Run:

```bash
MIX_TEST_PARTITION=quality_tooling mix test test/product_compare/ingestion/enrichment_test.exs
```

Expected: newer-then-older media and category observations remain monotonic.

- [ ] **Step 2: Replace media CASE expressions with an Ecto conflict predicate**

Build one conflict query that updates only when the stored timestamp is not newer:

```elixir
from media in ProductMedia,
  where: media.observed_at <= ^observed_at,
  update: [
    set: [
      source_artifact_id: ^source_artifact_id,
      role: ^attrs.role,
      position: ^attrs.position,
      alt_text: ^attrs.alt_text,
      observed_at: ^observed_at,
      updated_at: ^now
    ]
  ]
```

The insert result remains count-only, so a conflict rejected by the predicate does not need a follow-up read.

- [ ] **Step 3: Retain the category candidate's narrow conflict fragments**

Confirm and document in review notes that `observation_count` increments for every arrival while display and last-seen fields update only for current observations. Ecto has no `EXCLUDED` reference, and splitting this invariant into multiple statements would be less atomic and more complex. Keep this localized conflict query unless a single-statement Ecto form preserves both requirements.

- [ ] **Step 4: Run focused tests and commit**

Run the command from Step 1 and `git diff --check`.

Expected: all tests pass, product media no longer contains repeated conditional fragments, and category arrival counting is unchanged.

Commit:

```bash
git add lib/product_compare/catalog/evidence.ex test/product_compare/ingestion/enrichment_test.exs
git commit -m "refactor: simplify observation conflict updates"
```

### Task 4: Narrow application-level native SQL boundaries

**Files:**
- Create: `lib/product_compare/database_locks.ex`
- Modify: `lib/product_compare/ingestion/merchant_identities.ex`
- Modify: `lib/product_compare/discussions/submissions/creates.ex`
- Modify: `lib/product_compare/ingestion/reconciliation.ex`
- Modify: `lib/product_compare/catalog/search_documents.ex`
- Test: `test/product_compare/ingestion/merchant_identities_concurrency_test.exs`
- Test: `test/product_compare/discussions/community_trust_test.exs`
- Test: `test/product_compare/ingestion/reconciliation_test.exs`
- Test: `test/product_compare/catalog/search_documents_test.exs`
- Test: `test/mix/tasks/catalog_search_documents_rebuild_test.exs`

**Interfaces:**
- Produces: `ProductCompare.DatabaseLocks.lock_transaction!/1 :: :ok`.
- Consumes: string logical lock keys from identity, idempotency, and reconciliation workflows.
- Produces: unchanged `SearchDocuments.refresh_product/1`, `refresh_products/1`, `refresh_brand/1`, and `rebuild/0` return contracts through `Repo.update_all/3`.

- [ ] **Step 1: Run native-boundary characterization tests**

Run:

```bash
MIX_TEST_PARTITION=quality_tooling mix test \
  test/product_compare/ingestion/merchant_identities_concurrency_test.exs \
  test/product_compare/discussions/community_trust_test.exs \
  test/product_compare/ingestion/reconciliation_test.exs \
  test/product_compare/catalog/search_documents_test.exs \
  test/mix/tasks/catalog_search_documents_rebuild_test.exs
```

Expected: all selected tests pass.

- [ ] **Step 2: Centralize the unavoidable advisory-lock statement**

Create:

```elixir
defmodule ProductCompare.DatabaseLocks do
  @moduledoc false

  alias ProductCompare.Repo

  @spec lock_transaction!(String.t()) :: :ok
  def lock_transaction!(key) when is_binary(key) do
    unless Repo.in_transaction?() do
      raise ArgumentError, "transaction-scoped advisory locks require a database transaction"
    end

    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key])
    :ok
  end
end
```

Replace the three duplicated domain statements with this function. Do not generalize table names, lock modes, or hash functions.

- [ ] **Step 3: Replace the hand-built search UPDATE with Ecto**

Build a schemaless Ecto update query over `"products"`, apply ID/brand filters with `where`, and keep only the unsupported custom document expression in a fragment:

```elixir
from product in query,
  update: [
    set: [
      search_document:
        fragment(
          "catalog_search_document(?, ?, ?, ?, (SELECT name FROM brands WHERE id = ?))",
          field(product, :name),
          field(product, :slug),
          field(product, :model_number),
          field(product, :description),
          field(product, :brand_id)
        )
    ]
  ]
```

Execute through `Repo.update_all(query, [], timeout: ...)`, preserving row counts, missing-product errors, product-list filters, brand filters, and rebuild timeout validation.

- [ ] **Step 4: Review retained SQL boundaries**

Confirm no application-level `Repo.query/2` remains except focused database operations that Ecto cannot model: advisory lock internals, the specification-correction table lock, and database-introspection Mix tasks. Keep direct SQL in migrations and database-contract/concurrency tests.

- [ ] **Step 5: Run focused tests and commit**

Run the command from Step 1, `mix dialyzer`, and `git diff --check`.

Expected: all checks pass and native SQL is centralized or reduced to one unsupported expression.

Commit:

```bash
git add lib test
git commit -m "refactor: narrow native database boundaries"
```

### Task 5: Complete whole-project verification and lane evidence

**Files:**
- Modify: `docs/work/ecto-query-simplification.md`
- Modify: `docs/work/deterministic-tooling-dependency-health.md`
- Modify: `docs/work/index.md`

**Interfaces:**
- Consumes: all prior milestone commits.
- Produces: green repository gates and truthful completed lane evidence.

- [ ] **Step 1: Run backend and frontend quality gates**

Run:

```bash
MIX_ENV=test mix compile --warnings-as-errors --all-warnings
MIX_TEST_PARTITION=quality_tooling mix ci
mix hex.audit
cd assets && pnpm audit --prod
```

Expected: compilation succeeds, 1,576 or more backend tests pass, all frontend checks/builds pass, and both advisory scans report no known applicable production vulnerabilities.

- [ ] **Step 2: Run browser and diff verification**

Run:

```bash
cd assets && PLAYWRIGHT_PORT=4194 pnpm run test:e2e
git diff --check
git status --short
```

Expected: Playwright passes on the isolated port, the diff has no whitespace errors, and only planned documentation evidence remains before the final commit.

- [ ] **Step 3: Record completion and commit**

Record the exact focused/full test counts, static-analysis results, audit results, retained native SQL rationale, and milestone commits in both lane documents. Remove completed active rows while preserving the queue floor or a complete exception.

Commit:

```bash
git add docs/work
git commit -m "docs: complete quality remediation evidence"
```

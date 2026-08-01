# CLDR Reference Data Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make maintained CLDR data own currency, territory, and language standards validation/metadata while ProductCompare retains an explicit supported-market set and deterministic relational IDs.

**Architecture:** Configure one application CLDR backend and one focused standards-code boundary. Existing Ecto codecs continue to map the supported public codes to seeded integer foreign keys, but delegate canonical standards recognition and metadata to CLDR. Database and CLDR parity tests prevent drift; migrations never execute version-dependent CLDR code.

**Tech Stack:** Elixir 1.19, `ex_cldr`, `ex_cldr_currencies`, `ex_cldr_territories`, `ex_cldr_languages`, Ecto/PostgreSQL, ExUnit.

## Global Constraints

- Do not expand supported currencies, countries, or languages in this batch.
- Keep deterministic code-to-ID maps and database parity; no runtime repository lookup from an Ecto type.
- Keep feed-type and other application-owned reference codes outside CLDR.
- Do not call CLDR from migrations or generate migration contents dynamically.
- Do not add backend currency formatting, `ex_money`, or `ex_cldr_units`.
- Centralize standards recognition only when it deletes duplicated normalization/metadata responsibility; do not wrap every CLDR function.
- Dependency upgrades must not silently change persisted IDs or supported-code membership.

---

### Task 1: Configure The CLDR Backend And Recognition Contract

**Files:**

- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify: `config/config.exs`
- Create: `lib/product_compare/reference_data/cldr.ex`
- Create: `lib/product_compare/reference_data.ex`
- Create: `test/product_compare/reference_data_test.exs`
- Modify: `docs/work/cldr-reference-data-boundary.md`

- [ ] **Step 1: Write failing standards-recognition tests**

Assert the boundary canonicalizes supported inputs such as `" usd "`, `"ca"`, and `"fr"`; recognizes valid standard codes outside the ProductCompare supported set without treating them as supported; rejects malformed/unknown codes; and returns canonical CLDR metadata for supported currencies, territories, and languages without hard-coded display-name maps.

```bash
mix test test/product_compare/reference_data_test.exs
```

Expected before implementation: the CLDR backend and reference-data boundary do not exist.

- [ ] **Step 2: Add packages and one backend**

Add:

```elixir
{:ex_cldr, "~> 2.47"},
{:ex_cldr_currencies, "~> 2.17"},
{:ex_cldr_territories, "~> 2.12"},
{:ex_cldr_languages, "~> 0.3"}
```

Configure `ProductCompare.ReferenceData.Cldr` with only the providers/locales needed by the recognition and metadata APIs. `ProductCompare.ReferenceData` exposes focused currency/territory/language canonicalization and lookup functions and normalizes library errors to `:error`/`nil` rather than raising through ingest or GraphQL boundaries.

- [ ] **Step 3: Verify and commit the backend boundary**

```bash
mix deps.get
mix test test/product_compare/reference_data_test.exs
mix format
git diff --check
git add mix.exs mix.lock config/config.exs lib/product_compare/reference_data.ex lib/product_compare/reference_data/cldr.ex test/product_compare/reference_data_test.exs docs/work/cldr-reference-data-boundary.md
git commit -m "feat: add CLDR reference data boundary"
```

### Task 2: Adopt CLDR At Currency Boundaries

**Files:**

- Modify: `lib/product_compare_schemas/reference/currency_code.ex`
- Modify: `test/product_compare/repo/reference_code_codec_parity_test.exs`
- Modify: `test/product_compare/reference_data_test.exs`
- Modify: affected currency input tests under `test/product_compare/**` and `test/product_compare_web/**`
- Modify: `docs/work/cldr-reference-data-boundary.md`

- [ ] **Step 1: Add failing currency parity tests**

For every seeded currency, assert the code is recognized by CLDR, the codec ID equals the seeded ID, `cast/dump/load` retain current case/trim behavior, and canonical metadata agrees on code/minor-unit semantics where CLDR exposes them. Assert a valid but unsupported currency such as JPY is rejected by `CurrencyCode` even though the standards boundary recognizes it.

- [ ] **Step 2: Delegate standards recognition without changing support**

Use `ReferenceData` to canonicalize/recognize the input before applying the existing supported code-to-ID map. Keep the map private and deterministic. Do not query `currencies` during cast/dump/load and do not change existing schema field types.

- [ ] **Step 3: Verify and commit currency adoption**

```bash
mix test test/product_compare/reference_data_test.exs test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare/commerce_attribution test/product_compare/ingestion test/mix/tasks/product_compare_ingestion_cj_import_test.exs
mix format
git diff --check
git add lib/product_compare_schemas/reference/currency_code.ex test/product_compare/reference_data_test.exs test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare test/product_compare_web docs/work/cldr-reference-data-boundary.md
git commit -m "refactor: validate currencies with CLDR"
```

### Task 3: Adopt CLDR At Territory And Language Boundaries

**Files:**

- Modify: `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`
- Modify: `lib/product_compare_schemas/reference/reference_code.ex` only if a standards-kind option is clearer than schema-local normalization
- Modify: `test/product_compare/repo/reference_code_codec_parity_test.exs`
- Modify: `test/product_compare/ingestion/feed_candidates_test.exs`
- Modify: CJ parser/import tests using country and language values
- Modify: `test/product_compare/reference_data_test.exs`
- Modify: `docs/work/cldr-reference-data-boundary.md`

- [ ] **Step 1: Add failing supported-versus-standard tests**

Assert CA/US and EN/FR remain supported and round-trip their existing database IDs. Assert valid CLDR codes outside the supported set (for example GB and DE) are recognized as standards but normalize to nil at the merchant-feed boundary. Assert invalid values remain nil/error exactly where existing callers expect them.

- [ ] **Step 2: Delegate country/language canonicalization**

Use the focused CLDR boundary before the schema's supported maps. If `ReferenceCode` gains a `standard:` parameter, default it to `:none` and apply it only to the two merchant-feed fields; do not route provider feed types, statuses, algorithms, or other application reference tables through CLDR.

- [ ] **Step 3: Verify and commit territory/language adoption**

```bash
mix test test/product_compare/reference_data_test.exs test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare/ingestion/feed_candidates_test.exs test/product_compare/ingestion/sources/cj
mix format
git diff --check
git add lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex lib/product_compare_schemas/reference/reference_code.ex test/product_compare/reference_data_test.exs test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare/ingestion docs/work/cldr-reference-data-boundary.md
git commit -m "refactor: validate market codes with CLDR"
```

### Task 4: Batch Verification And Handoff

- [ ] **Step 1: Prove no supported-set or database drift**

```bash
mix test test/product_compare/reference_data_test.exs test/product_compare/repo/reference_code_codec_parity_test.exs test/product_compare/ingestion test/product_compare/commerce_attribution test/product_compare_web/graphql
mix deps.unlock --check-unused
```

- [ ] **Step 2: Run repository gates**

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
git diff --check
```

- [ ] **Step 3: Record exact evidence, complete the lane, and preserve at least three ready rows**

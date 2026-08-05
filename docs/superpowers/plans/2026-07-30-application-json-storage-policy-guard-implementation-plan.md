# Application JSON Storage Policy Guard Implementation Plan

**Goal:** Prevent application-owned relational facts from drifting back into
opaque JSON columns while preserving the six current JSON fields whose raw,
open-key, or explicitly JSON-typed semantics genuinely require JSON storage.

**Architecture:** Discover persisted `:map` fields from the compiled
`ProductCompareSchemas` modules and compare them with PostgreSQL `json`/`jsonb`
columns. Require every discovered pair to have one explicit semantic
classification, and retain the existing negative assertions for the removed
comparison-snapshot payload and alert fact dump. New JSON storage therefore
fails by default until its open shape and ownership are reviewed.

**Tech Stack:** Elixir, Ecto schema reflection, PostgreSQL catalogs, ExUnit.

## Global Constraints

- Do not ban provider-owned raw evidence, provider request metadata,
  open-ended campaign parameters, or specification attributes whose declared
  value type is JSON.
- Do not allow comparison snapshots, alert facts, or another stable
  application-owned domain shape to use an opaque JSON parameter dump.
- Discover persisted schema fields automatically; do not rely only on a list
  of previously removed columns.
- Exclude virtual projection fields from the persisted-storage inventory.
- Give every allowed JSON field one narrow semantic classification and an
  actionable failure when an unclassified field appears.
- Do not change public GraphQL shapes or legitimate raw evidence in this
  policy batch.

## Task 1: Characterize The Current JSON Boundary

- [x] Prove the compiled schema inventory contains exactly six persisted
  `:map` fields and one virtual comparison-snapshot projection.
- [x] Confirm PostgreSQL exposes the same six persisted columns as
  `json`/`jsonb`.
- [x] Classify each current field as raw provider evidence, provider request
  metadata, open-key campaign metadata, or explicitly JSON-typed
  specification data.

## Task 2: Enforce The Storage Policy

- [x] Replace the two-column-only negative test with schema- and
  catalog-reflected coverage of every persisted JSON field.
- [x] Require an explicit classification for each allowed
  `{schema, field, table, column}` contract and reject unclassified JSON
  storage from either Ecto or PostgreSQL.
- [x] Retain direct regressions proving `comparison_snapshots.payload` and
  `alert_events.fact_snapshot` remain absent.
- [x] Emit field-specific failures that explain whether the drift came from
  the schema inventory, database catalog, or policy classification.

## Task 3: Verify And Commit

- [x] Rebuild the test database and run the focused JSON storage policy suite.
- [x] Run the comparison snapshot, alert, specification, ingestion, and
  commerce-attribution suites that own allowed or formerly opaque JSON data.
- [x] Run the full backend test, type, quality, formatting, queue, and diff
  gates.
- [x] Record exact evidence in
  `docs/work/application-json-storage-policy-guard.md`.
- [x] Commit with `test: enforce application json storage policy`.

Exit condition: every persisted Ecto map field and PostgreSQL JSON column is
automatically discovered and explicitly justified, stable application-owned
facts cannot silently return to opaque JSON dumps, legitimate raw/open JSON
contracts remain intact, and all repository gates pass.

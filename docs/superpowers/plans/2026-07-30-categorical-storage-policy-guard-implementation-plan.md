# Categorical Storage Policy Guard Implementation Plan

**Goal:** Turn the approved rule that relational enum-like state is never
stored as a string into an executable repository contract that covers current
and future Ecto schemas.

**Architecture:** Discover relational Ecto schemas and their parameterized
`Ecto.Enum` fields at runtime, map them to physical PostgreSQL columns, and
require native enum storage. Inspect database constraints for text-backed
closed-domain patterns and retain the existing explicit controlled-reference
contracts for metadata-bearing domains. The guard reports the exact
schema/table/column that violates policy without trying to guess whether every
free-form string is conceptually categorical.

**Tech Stack:** Elixir, Ecto schema reflection, PostgreSQL catalogs, ExUnit,
Mix tasks.

## Global Constraints

- No relational enum-like field may be stored as `varchar`, `text`, or another
  free-form string type.
- Native PostgreSQL enum is the minimum acceptable storage; controlled
  reference tables remain preferred when values have metadata, identity, or
  independent lifecycle.
- Do not classify provider-owned raw payloads, prose, URLs, names, or other
  genuinely free-form strings as closed domains.
- Discover `Ecto.Enum` fields from compiled schemas rather than maintaining a
  second hand-written list.
- Keep the existing explicit reference-table assertions for currencies,
  affiliate status/network, provider/surface/feed, country, and language
  domains.
- A scanner is a drift guard, not a substitute for semantic review of a newly
  introduced string column.

## Task 1: Characterize The Current Policy Surface

**Files:**

- Modify: `test/product_compare/repo/domain_enum_storage_test.exs`
- Modify: existing domain-reference storage tests only if shared catalog
  helpers are extracted.

- [x] Add a failing fixture/schema characterization proving discovery includes
  parameterized `Ecto.Enum` fields without a manual table/column registry.
- [x] Record all discovered relational schemas, field sources, and physical
  PostgreSQL types in deterministic order.
- [x] Confirm embedded schemas and virtual fields are excluded.

## Task 2: Enforce Native Enum And Closed-String Constraints

**Files:**

- Create: a focused repository policy owner under `lib/product_compare/`.
- Create: a matching Mix validation task only if CI needs a non-test entry
  point.
- Modify: repository policy tests and CI aliases.

- [x] Require every persisted `Ecto.Enum` field to report PostgreSQL
  `USER-DEFINED` storage and a real enum `typtype`.
- [x] Reject text/varchar columns used by database `IN (...)` or equivalent
  closed-domain constraints.
- [x] Produce actionable violations containing schema, table, column, and
  observed storage.
- [x] Preserve the explicit controlled-reference tests and make their coverage
  part of the policy gate.

## Task 3: Verify The Durable Contract

- [x] Run the focused policy and reference-storage suites from a clean migrated
  test database.
- [x] Run backend tests, typecheck, quality, and queue validation.
- [x] Run `git diff --check` and record the exact evidence in the lane doc.

Exit condition: every compiled persisted `Ecto.Enum` field is automatically
covered by native PostgreSQL enum validation, text-backed closed constraints
are rejected, controlled-reference tests remain green, and the full repository
gates pass.

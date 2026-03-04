# Product Attribute Claims Typed-Value Constraint Plan

## Purpose
Track and enforce a durable DB-level rule for `product_attribute_claims` so each row stores exactly one typed value representation.

## Problem
`product_attribute_claims` can carry several value columns. Without strict enforcement, malformed rows can be inserted by imports/scrapers/manual edits (multiple typed columns set, or none set), which breaks filtering assumptions and downstream consumers.

## Scope
Table: `product_attribute_claims`

Typed representations to treat as mutually exclusive:
- `value_bool`
- `value_int`
- numeric representation (`value_num` with `unit_id` and base helpers `value_num_base`, `value_num_base_min`, `value_num_base_max`)
- `value_text`
- `value_date`
- `value_ts`
- `enum_option_id`
- `value_json`

Index context for filtering/query performance:
- `pac_numeric_filter_idx`
- related `pac_*` indexes (`pac_enum_filter_idx`, `pac_bool_filter_idx`)

## Enforcement Approach
1. Enforce exactly-one typed value at DB level with a `CHECK` constraint on `product_attribute_claims`.
2. Keep Ecto changeset validations aligned with DB semantics.
3. If imports require transitional exceptions, use a staged rollout (validate existing rows first, then lock enforcement).

## Rollout Steps
1. Migration
- Add or confirm the named `CHECK` constraint for exactly-one typed value on `product_attribute_claims`.
- Keep/confirm confidence range check (`confidence` is `NULL` or between `0` and `1`).

2. Data Validation and Backfill
- Scan existing rows for violations.
- Correct invalid rows (deduplicate typed fields or split rows if business rules require preserving multiple values).

3. Application Alignment
- Ensure `ProductCompareSchemas.Specs.ProductAttributeClaim` changeset enforces the same exactly-one rule.
- Ensure create/update paths (`Specs.propose_claim/4`, imports) return clear errors for invalid typed payloads.

4. Test Coverage
- Add migration-level regression coverage (insert invalid records via SQL and assert failure).
- Add changeset tests for valid single-type payloads and invalid multi/empty payloads.
- Keep filtering tests passing against canonical indexes and `product_attribute_current` joins.

## Acceptance Criteria
- Any insert/update with zero typed values is rejected.
- Any insert/update with more than one typed representation is rejected.
- Valid single-type claims continue to work across propose/accept/select flows.
- Existing filtering queries continue using `pac_*` indexes with no semantic regressions.

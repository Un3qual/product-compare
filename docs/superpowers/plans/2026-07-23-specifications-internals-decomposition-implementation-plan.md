# Specifications Internals Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the Specs and GraphQL contracts while extracting focused
artifact, current-attribute, reference-data, claim-workflow, and resolver
owners.

**Architecture:** `Specs.Reads` remains the internal read facade over
artifacts, current attributes, and reference data. `Specs.Claims` remains the
claim facade over proposals, imported observations, and moderation/current
selection. `SpecsResolver` remains schema-facing over reads and correction
actions.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Decimal, Absinthe, ExUnit.

## Global Constraints

- Preserve `ProductCompare.Specs` as the only application-facing context.
- Preserve every public function, default, guard, value, error, ordering,
  preload, query budget, transaction, and lock.
- Preserve typed values, units, enum ownership, fingerprints, evidence,
  replay, auto-acceptance, moderation transitions, and stale-current safety.
- Preserve Global ID handling and GraphQL authorization/payload behavior.
- Do not change schemas, migrations, GraphQL SDL, domain policy, ingestion,
  Relay, or frontend behavior.

---

## Task 1: Source Artifact Read Ownership

**Files:**

- Create: `lib/product_compare/specs/reads/artifacts.ex`
- Modify: `lib/product_compare/specs/reads.ex`
- Test: `test/product_compare/specs/read_helpers_test.exs`
- Test: `test/product_compare_web/graphql/specification_corrections_test.exs`

**Interfaces:**

- Produces:
  `Artifacts.get/1` and
  `Artifacts.get_many/1`.

- [ ] Run both named suites as the green baseline.
- [ ] Add `Reads` delegation and verify the expected missing-owner compilation
  failure.
- [ ] Move valid-ID single reads and order-preserving/batched artifact lookup
  into `Artifacts`.
- [ ] Preserve invalid-ID nil behavior and invalid/duplicate bulk-key result
  mapping.
- [ ] Re-run both suites; expect all tests to pass.
- [ ] Commit with message `refactor: isolate specification artifact reads`.

## Task 2: Current Attribute Read Ownership

**Files:**

- Create: `lib/product_compare/specs/reads/current_attributes.ex`
- Modify: `lib/product_compare/specs/reads.ex`
- Test: `test/product_compare/specs/read_helpers_test.exs`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`
- Test: `test/product_compare/recommendations_test.exs`

**Interfaces:**

- Produces:
  `CurrentAttributes.for_products/1`,
  `for_product/1`,
  `with_metadata/2`, and
  `with_metadata_from_taxon_attributes/2`.

- [ ] Run the three named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move accepted-current claim queries, evidence/source preloads,
  product-grouped projection, taxonomy metadata lookup, and deterministic
  attribute ordering into `CurrentAttributes`.
- [ ] Preserve invalid/duplicate product IDs, selected claim semantics,
  metadata precedence, and query batching.
- [ ] Re-run all three suites; expect exact read and consumer behavior.
- [ ] Commit with message `refactor: isolate current specification reads`.

## Task 3: Specification Reference Data Ownership

**Files:**

- Create: `lib/product_compare/specs/reads/reference_data.ex`
- Modify: `lib/product_compare/specs/reads.ex`
- Test: `test/product_compare/specs/read_helpers_test.exs`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`
- Test: `test/product_compare/catalog/filtering_regression_test.exs`

**Interfaces:**

- Produces:
  `ReferenceData.list_filterable_attributes/1`,
  `filterable_attribute_types/1`,
  `get_filterable_attribute/2`,
  `filterable_enum_option_pairs/2`,
  `enum_option_belongs_to_attribute?/2`,
  `list_enum_options_for_set/1`,
  `list_enum_options_for_sets/1`,
  `unit_symbol_for_dimension/1`, and
  `unit_symbols_for_dimensions/1`.

- [ ] Run the three named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move filterable attribute, enum option/set, and unit symbol queries plus
  ID normalization and map-set construction into `ReferenceData`.
- [ ] Preserve data-type filtering, enum ownership, invalid-ID fallbacks,
  empty maps/lists, and ordering.
- [ ] Re-run all three suites; expect exact filter and metadata behavior.
- [ ] Commit with message `refactor: isolate specification reference reads`.

## Task 4: Claim Proposal Ownership

**Files:**

- Create: `lib/product_compare/specs/claims/proposals.ex`
- Modify: `lib/product_compare/specs/claims.ex`
- Test: `test/product_compare/specs/product_attribute_claim_changeset_test.exs`
- Test: `test/product_compare/specs/product_attribute_claim_db_constraint_test.exs`

**Interfaces:**

- Produces:
  `Proposals.propose/4`, returning the current
  `{:ok, ProductAttributeClaim.t()} | {:error, Ecto.Changeset.t()}` contract.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move user proposal attributes, claim changeset insertion, optional
  evidence persistence, and invalid-changeset action preservation into
  `Proposals`.
- [ ] Preserve product/attribute/provenance inputs, transaction behavior, and
  returned changeset action.
- [ ] Re-run both suites; expect exact proposal behavior.
- [ ] Commit with message `refactor: isolate specification claim proposals`.

## Task 5: Imported Claim Ownership

**Files:**

- Create: `lib/product_compare/specs/claims/imports.ex`
- Modify: `lib/product_compare/specs/claims.ex`
- Test: `test/product_compare/specs/product_attribute_claim_changeset_test.exs`
- Test: `test/product_compare/ingestion/enrichment_test.exs`

**Interfaces:**

- Produces:
  `Imports.import_observation/7` with the current arguments and result.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move attribute lookup, observation type/value normalization, canonical
  fingerprinting, replay-safe insert/fetch, evidence excerpt persistence,
  auto-acceptance, and optional current selection into `Imports`.
- [ ] Preserve every supported typed observation, mismatch/error atom,
  fingerprint input, excerpt bound of 500 characters, conflict target, and
  replay result.
- [ ] Re-run both suites; expect exact ingestion enrichment behavior.
- [ ] Commit with message `refactor: isolate imported specification claims`.

## Task 6: Claim Moderation And Current Selection Ownership

**Files:**

- Create: `lib/product_compare/specs/claims/moderation.ex`
- Modify: `lib/product_compare/specs/claims.ex`
- Test: `test/product_compare/specs/claim_moderation_status_transition_test.exs`
- Test: `test/product_compare/specs/current_claim_selection_test.exs`

**Interfaces:**

- Produces:
  `Moderation.accept/2`,
  `Moderation.reject/2`, and
  `Moderation.select_current/4`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move locked selected/current claim reads, accept/reject updates,
  current-claim upsert, supersession, and selector attribution into
  `Moderation`.
- [ ] Preserve not-found, not-accepted, scope-mismatch, status-transition,
  lock, transaction, and stale-current behavior.
- [ ] Re-run both suites; expect exact moderation and selection behavior.
- [ ] Commit with message `refactor: isolate specification claim moderation`.

## Task 7: Specification Resolver Read Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/specs/reads.ex`
- Modify: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Test: `test/product_compare_web/graphql/specification_corrections_test.exs`

**Interfaces:**

- Produces:
  `Reads.source_artifact/3`,
  `my_specification_corrections/3`, and
  `specification_correction_moderation_queue/3`.

- [ ] Run the GraphQL suite as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move source-artifact Dataloader/direct reads, owner correction
  connection, operator moderation queue, authorization, and pagination into
  `Resolvers.Specs.Reads`.
- [ ] Preserve unauthenticated/forbidden errors, invalid ID behavior, query
  budgets, and connection results.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql specification reads`.

## Task 8: Specification Correction Resolver Ownership

**Files:**

- Create: `lib/product_compare_web/resolvers/specs/corrections.ex`
- Modify: `lib/product_compare_web/resolvers/specs_resolver.ex`
- Test: `test/product_compare_web/graphql/specification_corrections_test.exs`

**Interfaces:**

- Produces:
  `Corrections.propose/3`,
  `moderate/3`,
  `value_text/3`, and
  `moderation_note/3`.

- [ ] Run the GraphQL suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move Global ID decoding, optional ID handling, typed input normalization,
  member proposal, operator moderation, value/note projection, and correction
  payload errors into `Resolvers.Specs.Corrections`.
- [ ] Preserve all callback clauses, camelized fields, visibility rules,
  values, error codes/messages/fields, and payload shapes.
- [ ] Re-run the suite; expect exact correction GraphQL behavior.
- [ ] Commit with message `refactor: isolate graphql specification corrections`.

## Task 9: Full Specifications Gate

**Files:**

- Modify: `docs/work/specifications-internals-decomposition.md`

- [ ] Run
  `mix test test/product_compare/specs
  test/product_compare/ingestion/enrichment_test.exs
  test/product_compare/catalog/filter_metadata_test.exs
  test/product_compare/catalog/filtering_regression_test.exs
  test/product_compare/recommendations_test.exs
  test/product_compare_web/graphql/specification_corrections_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller bypasses `ProductCompare.Specs`, no
  schema field bypasses `SpecsResolver`, and the new focused owners are used
  only inside their implementation namespaces.
- [ ] Record final owner sizes, exact test counts, and gate evidence.
- [ ] Include the lane doc in the final Specs milestone commit.

# Specs Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Specs` as the stable caller-facing context while
moving its unrelated definition, typed-value, claim, correction, and read
implementations into focused internal modules.

**Architecture:** Existing callers continue to use only `ProductCompare.Specs`.
The facade delegates to responsibility-focused internal modules; shared typed-
value normalization has one owner so claim and correction paths cannot drift.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit.

## Global Constraints

- Preserve every `ProductCompare.Specs` public function, arity, default,
  typespec, return value, error, ordering rule, query budget, transaction, and
  lock boundary.
- Preserve claim fingerprints, evidence truncation, import replay behavior,
  moderation transitions, current-claim selection, and correction idempotency.
- Preserve typed-value normalization, numeric conversion, enum membership,
  filter metadata, source-artifact privacy, and invalid-ID behavior.
- Keep all existing callers dependent only on `ProductCompare.Specs`; internal
  modules are implementation details.
- Do not change schemas, migrations, SQL semantics, GraphQL SDL, ingestion
  policy, moderation policy, or public product behavior.

---

### Task 1: Definition, Typed Value, And Read Modules

**Files:**

- Create: `lib/product_compare/specs/definitions.ex`
- Create: `lib/product_compare/specs/typed_values.ex`
- Create: `lib/product_compare/specs/reads.ex`
- Modify: `lib/product_compare/specs.ex`

**Interfaces:** `Definitions` owns definition upserts and unit conversion.
`TypedValues.normalize/2` owns the existing typed-value validation and numeric
normalization contract. `Reads` owns source artifacts, current attribute
projections, filterable attributes/options, and unit-symbol reads.

- [ ] Run the direct Specs characterization suite as a green baseline.
- [ ] Extract definition upserts and conversion without changing conflict
  targets, changesets, timestamps, or errors.
- [ ] Extract shared typed-value normalization without changing accepted map
  keys, decimal conversion, range validation, or enum/unit validation.
- [ ] Extract read projections without changing preload graphs, ordering,
  invalid-ID behavior, missing-value projection, or query budgets.
- [ ] Keep explicit public wrappers and typespecs in `ProductCompare.Specs`.
- [ ] Re-run the direct Specs characterization suite and commit with message
  `refactor: isolate specs definitions and reads`.

### Task 2: Claim And Correction Workflow Modules

**Files:**

- Create: `lib/product_compare/specs/claims.ex`
- Create: `lib/product_compare/specs/corrections.ex`
- Modify: `lib/product_compare/specs.ex`

**Interfaces:** `Claims` owns claim proposal, ingestion observation, evidence,
status transition, and current selection. `Corrections` owns user correction
proposal, owner/operator queries and counts, and moderation. Both consume the
shared typed-value normalization contract from Task 1.

- [ ] Extract claim and ingestion workflows without changing transactions,
  locks, fingerprints, evidence, replay, auto-acceptance, or errors.
- [ ] Extract correction workflows without changing authorization-ready query
  filters, counts, transactions, stale-current checks, moderation transitions,
  or preloads.
- [ ] Keep explicit public wrappers and typespecs in `ProductCompare.Specs` and
  verify no caller bypasses the facade.
- [ ] Run the five-suite characterization gate and commit with message
  `refactor: isolate specs claim workflows`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/specs-context-decomposition.md`

- [ ] Record final module responsibilities and public-contract parity.
- [ ] Run the exact five-suite characterization command from the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.

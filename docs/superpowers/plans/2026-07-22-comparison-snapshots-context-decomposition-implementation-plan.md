# Comparison Snapshots Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.ComparisonSnapshots` as the stable public
context while moving lifecycle, immutable capture, and payload hydration into
focused internal modules.

**Architecture:** The context remains the only caller-facing facade and
preserves every public function and result. `Lifecycle`, `Capture`, and
`PayloadCodec` receive the existing implementations by responsibility without
changing snapshot, SEO, pricing, recommendation, or GraphQL policy.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing public function, clause, guard, default, typespec,
  value, query, and error.
- Preserve immutable evidence values and ordering, token validation and
  entropy, owner scope, revocation, hydration, and search qualification.
- Keep application callers dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, SEO policy, pricing policy,
  recommendation policy, frontend contracts, or snapshot versioning.

---

### Task 1: Snapshot Lifecycle Ownership

**Files:**

- Create: `lib/product_compare/comparison_snapshots/lifecycle.ex`
- Modify: `lib/product_compare/comparison_snapshots.ex`
- Test: `test/product_compare/comparison_snapshots_test.exs`
- Test: `test/product_compare_web/graphql/comparison_snapshots_test.exs`

**Interfaces:** `ProductCompare.ComparisonSnapshots.Lifecycle` owns
publication, validation, token generation, public reads, owner queries,
revocation, and persistence. The facade retains the existing lifecycle
functions and signatures.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move lifecycle implementations and private helpers into `Lifecycle`.
- [ ] Replace facade implementations with explicit wrappers preserving
  defaults, guards, clauses, errors, queries, and return values.
- [ ] Re-run both suites and confirm publication, owner scope, public reads,
  malformed tokens, active ordering, and revocation remain unchanged.
- [ ] Commit with message `refactor: isolate comparison snapshot lifecycle`.

### Task 2: Immutable Capture Ownership

**Files:**

- Create: `lib/product_compare/comparison_snapshots/capture.ex`
- Modify: `lib/product_compare/comparison_snapshots/lifecycle.ex`
- Test: `test/product_compare/comparison_snapshots_test.exs`
- Test: `test/product_compare_web/graphql/comparison_snapshots_test.exs`

**Interfaces:** `ProductCompare.ComparisonSnapshots.Capture` owns ordered
product loading and immutable product, specification, offer, merchant, and
recommendation projection. `Lifecycle.publish/3` consumes its load and capture
results without exposing the module to application callers.

- [ ] Run the two named suites before the extraction.
- [ ] Move product loading, captured fact projection, decimal serialization,
  excerpt bounds, and recommendation projection into `Capture`.
- [ ] Keep lifecycle validation and error mapping unchanged while delegating
  only evidence loading and capture.
- [ ] Re-run both suites and confirm exact payload values, ordering, evidence,
  offers, recommendations, timestamps, and missing-product errors.
- [ ] Commit with message `refactor: isolate comparison snapshot capture`.

### Task 3: Payload Codec Ownership

**Files:**

- Create: `lib/product_compare/comparison_snapshots/payload_codec.ex`
- Modify: `lib/product_compare/comparison_snapshots/lifecycle.ex`
- Modify: `lib/product_compare/comparison_snapshots.ex`
- Test: `test/product_compare/comparison_snapshots_test.exs`
- Test: `test/product_compare_web/graphql/comparison_snapshots_test.exs`

**Interfaces:** `ProductCompare.ComparisonSnapshots.PayloadCodec.hydrate/1`
owns atom/string-key payload decoding, Decimal restoration, DateTime parsing,
and recommendation result construction. The facade retains `hydrate/1`, and
`Lifecycle` uses the codec for persisted reads.

- [ ] Run the two named suites before the extraction.
- [ ] Move hydration and all decode helpers into `PayloadCodec`.
- [ ] Add an explicit facade wrapper and update lifecycle calls without
  changing nil handling, struct matching, or decoded shapes.
- [ ] Re-run both suites and confirm persisted and public GraphQL values remain
  unchanged.
- [ ] Commit with message `refactor: isolate comparison snapshot payload codec`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/comparison-snapshots-context-decomposition.md`

- [ ] Run the exact 12-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references the three internal owners.
- [ ] Record facade size, ownership, test counts, and gates in the lane doc and
  include it in the final code/test milestone commit.

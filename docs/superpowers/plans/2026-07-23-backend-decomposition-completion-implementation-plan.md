# Backend Decomposition Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every decomposition in the approved backend scope manifest,
including all three rows already in the live queue, on one aggregate branch
and in one pull request.

**Architecture:** Preserve the current public contexts, resolver entry points,
and safety predicates as stable facades while moving concrete responsibilities
into domain-focused internal modules. Execute each independently reviewable
domain plan with milestone commits, focused verification, caller-bypass scans,
and one final repository-wide gate.

**Tech Stack:** Elixir 1.19, Phoenix, Ecto, PostgreSQL, Absinthe, ExUnit, Mix
quality tasks, Relay/TypeScript/Vitest through `mix ci`.

## Global Constraints

- Treat
  `docs/superpowers/specs/2026-07-23-backend-decomposition-completion-design.md`
  as the fixed scope and stop boundary.
- Complete the existing Catalog Filter Metadata, Community Submissions, and
  Commerce Destination URL ready rows.
- Deliver all domain plans on the current aggregate commit stack; do not create
  separate delivery branches or pull requests.
- Preserve every public function, arity, default, guard, typespec, value,
  error, transaction, lock, query, GraphQL payload, and caller path.
- Keep application callers on existing contexts and schema-facing resolvers.
- Do not add schemas, migrations, dependencies, GraphQL SDL, Relay, frontend,
  authorization, provider, or product-policy changes.
- Use behavior tests; do not add source-string or private-module-name
  assertions.
- Do not split declarative schema files, tests, the catalog filtering
  pipeline, the CJ client, loader registries, or focused policy algorithms.
- Commit each focused owner at a reviewable milestone and include related lane
  evidence with the code it describes.
- Keep `docs/work/index.md`, `docs/plans/INDEX.md`, affected lane docs, and the
  committed plan set aligned at stable dispatch boundaries.

---

## Plan Set

Existing ready-row plans:

1. `docs/superpowers/plans/2026-07-23-catalog-filter-metadata-decomposition-implementation-plan.md`
2. `docs/superpowers/plans/2026-07-23-community-submissions-decomposition-implementation-plan.md`
3. `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`

Additional approved domain plans:

4. `docs/superpowers/plans/2026-07-23-community-reads-decomposition-implementation-plan.md`
5. `docs/superpowers/plans/2026-07-23-accounts-authentication-decomposition-implementation-plan.md`
6. `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
7. `docs/superpowers/plans/2026-07-23-commerce-attribution-internals-decomposition-implementation-plan.md`
8. `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
9. `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
10. `docs/superpowers/plans/2026-07-23-alerts-resolver-decomposition-implementation-plan.md`

## Task 1: Reconcile And Promote The Aggregate Queue

**Files:**

- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Create: `docs/work/community-reads-decomposition.md`
- Create: `docs/work/accounts-authentication-decomposition.md`
- Create: `docs/work/specifications-internals-decomposition.md`
- Create: `docs/work/commerce-attribution-internals-decomposition.md`
- Create: `docs/work/affiliate-resolver-decomposition.md`
- Create: `docs/work/pricing-resolver-decomposition.md`
- Create: `docs/work/alerts-resolver-decomposition.md`
- Read: every plan in the Plan Set above

**Interfaces:**

- Consumes: the three current `ready` rows and the approved fixed scope
  manifest.
- Produces: ten complete, source-backed queue contracts with exact owned paths,
  internal slices, prerequisites, verification, and exit conditions.

- [ ] Confirm `docs/work/index.md` still contains the three mandatory ready
  rows and no active owner.
- [ ] Re-check each additional plan's source file, public functions, direct
  characterization paths, and path ownership before promotion.
- [ ] Write one lane doc per additional queue row using `Target Outcome`,
  ready evidence, boundaries, internal slices, and exact verification.
- [ ] Add the seven additional rows without modifying the three existing rows.
- [ ] Add the seven new plan files to `docs/plans/INDEX.md`.
- [ ] Run `mix work_queue.validate`; expect
  `work queue valid: 10 ready rows`.
- [ ] Do not make a standalone queue-status commit. Include this dispatch
  reconciliation in the first Catalog Filter Metadata code milestone.

## Task 2: Complete The Three Existing Ready Rows

**Files:**

- Execute:
  `docs/superpowers/plans/2026-07-23-catalog-filter-metadata-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-community-submissions-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`

**Interfaces:**

- Consumes: the existing `FilterMetadata`, `Submissions`, and
  `DestinationUrl` stable boundaries.
- Produces: the exact focused owners and completion evidence named in those
  plans.

- [ ] Execute Catalog Filter Metadata task-by-task; run its exact 10-test gate
  and all named repository gates.
- [ ] Reconcile its lane row to `done` while leaving the remaining queue rows
  unchanged.
- [ ] Execute Community Submissions task-by-task; run its exact 25-test gate
  and all named repository gates.
- [ ] Reconcile its lane row to `done`.
- [ ] Execute Commerce Destination URL task-by-task; run its exact 57-test gate
  and all named repository gates.
- [ ] Reconcile its lane row to `done`.
- [ ] Confirm all three pre-existing ready rows now have truthful completion
  evidence and no application caller bypasses their stable facades.

## Task 3: Complete Community And Accounts Domains

**Files:**

- Execute:
  `docs/superpowers/plans/2026-07-23-community-reads-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-accounts-authentication-decomposition-implementation-plan.md`

**Interfaces:**

- Consumes: completed Community Submissions ownership plus stable Discussions
  and Accounts contexts.
- Produces: focused community read, user-authentication, API-token, and
  authentication-resolver owners.

- [ ] Execute and close Community Reads with its focused and full gates.
- [ ] Execute and close Accounts Authentication with its focused and full
  gates.
- [ ] Confirm context callers continue through `ProductCompare.Discussions`
  and `ProductCompare.Accounts`.

## Task 4: Complete Specifications And Commerce Domains

**Files:**

- Execute:
  `docs/superpowers/plans/2026-07-23-specifications-internals-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-commerce-attribution-internals-decomposition-implementation-plan.md`

**Interfaces:**

- Consumes: completed Destination URL ownership plus stable Specs and Commerce
  Attribution contexts.
- Produces: focused Specs read/claim/resolver owners and commerce
  click/conversion/revenue/resolver owners.

- [ ] Execute and close Specifications Internals with its focused and full
  gates.
- [ ] Execute and close Commerce Attribution Internals with its focused and
  full gates.
- [ ] Confirm controllers, adapters, schema fields, and other contexts continue
  through their stable public boundaries.

## Task 5: Complete The Remaining Resolver Boundaries

**Files:**

- Execute:
  `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-pricing-resolver-decomposition-implementation-plan.md`
- Execute:
  `docs/superpowers/plans/2026-07-23-alerts-resolver-decomposition-implementation-plan.md`

**Interfaces:**

- Consumes: the current schema-facing resolver APIs.
- Produces: focused affiliate, pricing, and alerts resolver owners behind
  unchanged resolver facades.

- [ ] Execute and close Affiliate Resolver with its focused and full gates.
- [ ] Execute and close Pricing Resolver with its focused and full gates.
- [ ] Execute and close Alerts Resolver with its focused and full gates.
- [ ] Confirm `lib/product_compare_web/schema/**` still references only the
  stable resolver modules.

## Task 6: Final Ownership, Queue, And Repository Gate

**Files:**

- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: every lane doc created or completed by this program
- Read:
  `docs/superpowers/specs/2026-07-23-backend-decomposition-completion-design.md`

**Interfaces:**

- Consumes: all ten completed queue outcomes.
- Produces: one verified aggregate branch ready for a single pull request.

- [ ] Compare every retained facade's public function names and arities with
  its pre-decomposition version.
- [ ] Scan production and tests for direct use of focused internal owners;
  allow only the stable facade and files inside the same implementation
  namespace.
- [ ] Record final facade/owner line counts and exact focused-test results in
  each lane doc.
- [ ] Perform the explicit anti-slop review: every new module, public API,
  guard, fallback, shared helper, delegation layer, and test must have a
  concrete responsibility or reachable input.
- [ ] Remove completed rows from `docs/work/index.md` only after validating
  enough source-backed successor work to preserve at least three complete
  `ready` implementation rows. Do not invent decomposition filler.
- [ ] Run `mix work_queue.validate`.
- [ ] Run `mix format --check-formatted`.
- [ ] Run `mix typecheck`.
- [ ] Run `mix ci`.
- [ ] Run `git diff --check`.
- [ ] Run `git status --short`; expect no output after the final completion
  commit.
- [ ] Commit final evidence and queue reconciliation with message
  `docs: record backend decomposition completion`.

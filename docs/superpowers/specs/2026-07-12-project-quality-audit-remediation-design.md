# Project Quality Audit Remediation Design

## Status

Approved by the user on 2026-07-12. Execute the comprehensive
correctness-first repair as one non-draft pull request stacked on the current
open PR chain, with milestone commits and task-level review gates.

## Goal

Repair every validated correctness, authorization, data-integrity, frontend
runtime, and project-quality issue found by the repository-wide audit without
turning file length or analyzer output into indiscriminate rewrites.

The implementation starts from PR #94,
`codex/extract-credential-auth-form` at `21e8fbe5`, and preserves the four
existing `ready` rows in `docs/work/index.md` while this coordinator-owned lane
is active.

## Discovery And Alternatives

Three independent passes reviewed backend production code, frontend production
code, tests, generated contracts, migrations, tooling, and the live queue. The
baseline was 634 passing backend tests with 83.43% coverage, 706 passing
frontend tests, successful client and SSR builds, two Credo failures, four
unsuppressed Dialyzer warnings, one unsuppressed Reach finding, and one 887 KB
client entry bundle.

The user chose the comprehensive option from three alternatives:

1. Repair all validated correctness issues plus the bounded structural and
   tooling causes that allowed them.
2. Repair correctness only and defer bundle, schema-boundary, URL-policy, and
   CI work.
3. Split correctness and structural quality into two new stacked PRs.

Direction 1 is selected. It best matches the request for one detailed whole-
project review followed by one non-draft stacked PR. Direction 2 leaves known
quality failures in place, and direction 3 adds another review boundary the
user did not request.

## Selected Scope

### Operator Authorization

Self-service registration creates ordinary users, but global affiliate,
ingestion-review, and revenue-reporting surfaces currently treat any
authenticated user as an operator.

- Add a non-null `users.is_operator` boolean with a database default of
  `false`. Registration and ordinary account changes cannot grant it.
- Add one explicit Accounts context operation for trusted bootstrap/seed code;
  the existing admin and moderator seed accounts receive operator access.
- Add a shared GraphQL authorization helper that distinguishes
  `UNAUTHENTICATED` from `FORBIDDEN` without duplicating resolver clauses.
- Require operator access for global affiliate mutations, the top-level active
  coupon query, merchant-feed candidate query/review, and revenue summary.
  Shopper-facing nested active coupons remain public.
- Expose `User.isOperator` through `viewer`, carry it through Relay and the
  client viewer cache, and show affiliate setup, revenue, and feed-candidate
  navigation only to operators. Saved comparisons and API tokens remain
  ordinary authenticated-user features.
- Preserve Phoenix cookie sessions and bearer API-token authentication. The
  browser auth contract remains GraphQL `viewer` plus auth mutations over
  `/api/graphql`.

### Canonical GraphQL And Relay Contract

`assets/schema.graphql` is handwritten and differs materially from the live
Absinthe schema. In particular, it declares `Product.brand` non-null while the
database, ingestion, and live GraphQL contract allow brandless products.

- Replace the handwritten subset with the canonical SDL exported from
  `ProductCompareWeb.Schema`.
- Add a read-only schema snapshot check and a Relay artifact validation command
  so drift fails before merge instead of being repaired manually in plans.
- Regenerate all affected Relay artifacts from the canonical schema.
- Make catalog browse and compare picker render `Unknown brand` for a valid
  brandless product and fix the product fixture so explicit `brand_id: nil`
  remains nil.

### Ingestion And Attribution Integrity

- Propagate an explicit fresh/stale result from external-product freshness
  handling. A stale observation is a successful no-op before product,
  merchant-product, or price mutation, including when its URL differs.
- When a click session already supplies a dimension, reject a conflicting
  provider merchant, product, merchant-product, or link dimension instead of
  storing it as high-confidence attribution. Provider dimensions remain
  allowed where the click genuinely lacks them.
- Recognize the known Impact statuses explicitly. Unknown values return a
  validation error and cannot create or downgrade a conversion.

### Discussion And Schema Boundaries

- Serialize parent changes for posts in the same thread by locking the thread
  row before reloading, validating, and updating the post in one transaction.
  This closes the two-update cycle race without restoring recursive triggers.
- Move parent-chain and same-thread repository reads out of the schema module
  into the Discussions context. Changesets remain structural.
- Keep post authorship and review owner/product identity immutable after
  insert.
- Remove the duplicate repository lookup from
  `ProductAttributeCurrent.changeset/2`; the Specs context already validates
  and locks the selected claim.
- Normalize CJ feed-discovery cursors to non-negative integers or nil on both
  initialization and successful runner results.

### Frontend Runtime Correctness

- Return an HTTP 404 data response for a missing product while retaining the
  existing product-not-found presentation and Relay bootstrap behavior.
- Scope API-token optimistic rows and one-time plaintext to the current route
  location so filter/cursor navigation cannot leak them into another page.
- Move compare-save request state into a selection-keyed committed component;
  no ref or state mutation may occur during render.
- Pin visible locale-sensitive ordering and timestamp formatting. Revenue date
  presets retain the browser-local calendar contract but render from a stable
  hydration-safe client date rather than ambient server time.

### Delivery Size And Route Boundaries

`assets/src/router.tsx` eagerly imports every shopper, auth, account, and
operator route, producing one 887 KB client entry.

- Keep the root shell, home route, metadata, and not-found response in the
  initial route graph.
- Load non-root route components and their loaders through React Router lazy
  route functions. Use direct dynamic imports; do not add generic route
  factories or wrapper-only route modules.
- Emit a Vite manifest and add a build-output check proving rare operator and
  account routes are dynamic entries outside the initial import closure.
- Set the initial gzip budget from the measured post-split output with enough
  headroom for ordinary dependency patch drift, not the current monolith.

### URL Policy And Project Gates

`CommerceLink` currently combines an Ecto schema with approximately 425 lines
of URL, authority, numeric-IP, IPv6, IDNA, and punycode policy.

- Move that pure policy unchanged into
  `ProductCompare.CommerceAttribution.DestinationUrl` with a small `valid?/1`
  interface. Keep `CommerceLink.valid_destination_url?/1` as the compatibility
  boundary used by existing callers.
- Preserve the adversarial URL corpus, remove unreachable clauses, and address
  the eager enumeration finding. A standards-library migration is outside this
  PR because no demonstrated bypass justifies changing policy semantics.
- Strengthen the two Credo-failing connection assertions to verify returned
  nodes rather than only list length.
- Make `bun run check` validate Relay artifacts, TypeScript, unit tests, client
  and SSR builds, and the bundle contract. Make root `mix ci` and `mix
  precommit` run the frontend gate after backend validation. Add Bun to the Nix
  development shell. Browser Playwright remains a separate service-dependent
  gate.

## Error Contracts

- Anonymous protected GraphQL operations return the existing
  `UNAUTHENTICATED` contract.
- Authenticated non-operators receive `FORBIDDEN`; mutation payloads retain the
  existing typed error shape and queries use top-level GraphQL errors.
- Stale ingestion observations return success without downstream writes.
- Conflicting attribution dimensions and unknown provider statuses return
  explicit errors without partially mutating persisted conversions.
- Discussion validation returns ordinary changeset errors after acquiring the
  per-thread serialization lock.

## Testing Strategy

Every behavior fix starts with a failing regression. Pure extraction work
starts from the existing green adversarial suite and must remain behaviorally
identical.

- Authorization tests cover anonymous, member, session-operator, and API-token
  operator paths and assert database non-mutation on denial.
- Ingestion, attribution, and discussion tests exercise the exact stale,
  conflicting-dimension, unknown-status, and concurrent-cycle cases.
- GraphQL and frontend tests exercise an explicitly brandless product, HTTP
  status propagation, route navigation state reset, abandoned compare
  transitions, and deterministic render output.
- Build verification proves route chunking from the Vite manifest and enforces
  the measured entry budget.
- Each milestone runs focused tests, formatting/type checks, and diff hygiene.
  The final gate runs the complete combined project CI command and an
  independent whole-branch review.

## Deliberate Non-Changes

- Do not split the 1,023-line GraphQL schema solely by line count; it is mostly
  declarative DSL.
- Do not split large characterization suites solely to reduce LOC. Current
  ready rows already own several presentation extractions, and behavior tests
  remain more valuable than file-count churn.
- Do not replace cohesive Relay preload, safe external-link, or UI primitive
  modules with generic frameworks.
- Do not extract the CJ discovery/product-import near matches into one callback
  abstraction; they represent different provider surfaces, reports, and side
  effects.
- Do not change the existing product deferrals for email delivery, live
  conversion-provider ingestion, eBay, or production-readiness proof.

## Pull Request And Commit Shape

Use one semantic branch, `codex/project-quality-audit`, and milestone commits
for the approved design/plan, schema contract, authorization, data integrity,
discussion invariants, frontend runtime, route delivery, and project gates.
Before publication, refresh the open PR stack and base the non-draft PR on the
then-latest compatible open head; do not silently retarget to `main`.

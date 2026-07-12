# Project Quality Audit

Status: active
Owner: `codex/project-quality-audit`
Approved direction: comprehensive correctness-first remediation
Base: PR #94, `codex/extract-credential-auth-form` at `21e8fbe5`

## Goal

Repair the validated whole-project authorization, correctness, data-integrity,
frontend runtime, structural, and verification defects in one reviewed,
non-draft PR while preserving the current ready queue.

## Source Of Truth

- Design:
  `docs/superpowers/specs/2026-07-12-project-quality-audit-remediation-design.md`
- Plan:
  `docs/superpowers/plans/2026-07-12-project-quality-audit-remediation.md`
- Live dispatcher: `docs/work/index.md`

## Audit Baseline

- Backend: 634 tests, 0 failures, 83.43% total coverage.
- Frontend: 706 tests, 0 failures.
- Client and SSR production builds succeed.
- Current client delivery is one 887,488-byte JavaScript entry, 254,634 bytes
  gzip.
- `mix ci` fails on two connection-test Credo findings.
- Dialyzer reports four unsuppressed warnings in `CommerceLink`.
- Reach reports one unsuppressed eager-enumeration finding in `CommerceLink`.
- ExDNA reports six near-miss clone groups at the configured six-clone budget.

## Selected Milestones

1. Canonical GraphQL schema and brandless-product safety.
2. Explicit operator authorization across backend and frontend navigation.
3. Ingestion and attribution integrity.
4. Discussion invariants, schema-only boundaries, and scheduler cursor safety.
5. Product 404 and API-token route-state correctness.
6. Compare-save state and hydration-stable formatting.
7. Lazy route delivery and a measured bundle contract.
8. Destination URL extraction and combined project gates.

## Deliberate Non-Changes

- No line-count-only splitting of the declarative GraphQL schema or large
  characterization tests.
- No generic wrappers around cohesive Relay, external-link, UI primitive, or
  route modules.
- No callback abstraction joining distinct CJ discovery and product-import
  workflows.
- No new product scope for deferred email, live provider, eBay, or production-
  readiness work.

## Verification Ledger

Milestone evidence will be appended here with its commit after each reviewed
task. Final completion requires combined backend/frontend CI, clean analyzer
output, a clean working tree, and an independent whole-branch review.

### 2026-07-12 — Milestone 1: canonical GraphQL schema and brandless-product safety

- Replaced the handwritten Relay schema snapshot with
  `Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)` and added a backend
  snapshot regression.
- Regenerated every Relay artifact and added `bun run relay:check` for
  non-writing artifact validation.
- Preserved explicit `brand_id: nil` fixture intent without creating an
  orphaned brand; GraphQL now has a regression proving it returns `brand: null`.
- Browse and compare-picker presentation show `Unknown brand` while retaining
  the remaining results.
- Canonical SDL also makes relevant connection and relationship fields nullable.
  The approved minimal scope expansion adds defensive handling in BrowseRoute
  and OfferDiscoveryRoute without weakening the live schema.
- Verification: focused backend 36 tests, focused frontend 217 tests,
  `bun run relay:check`, `bun run typecheck`, `mix format --check-formatted`,
  and `git diff --check` all passed.

### 2026-07-12 — Milestone 2: explicit operator authorization

- Added non-null `users.is_operator` persistence with a database default of
  false. Registration cannot cast the field; trusted seed/bootstrap code uses
  the Accounts context operation, and both seeded staff accounts are operators.
- Added one GraphQL authorization helper and shared top-level/mutation error
  constructors. Anonymous callers retain `UNAUTHENTICATED`; members receive
  `FORBIDDEN` before query or mutation work.
- Protected global affiliate mutations and active coupons, merchant feed
  candidates and review, and revenue summary for both session and API-token
  authentication paths. Nested shopper coupon access remains public.
- Exposed `viewer.isOperator`, regenerated canonical SDL/Relay artifacts, and
  split member account destinations from affiliate, revenue, and feed-review
  operator destinations while preserving saved comparisons and API tokens.
- RED evidence: focused backend authorization coverage failed with member
  writes/reads succeeding and revenue remaining public; root coverage failed
  while operator links remained visible to members and the cached flag was lost.
- GREEN evidence: focused backend authorization/session suites passed 55 tests;
  focused frontend auth/root suites passed 35 tests. Final milestone gates are
  recorded in the Task 2 report.
- Independent review found that Relay `node(id:)` still treated affiliate node
  types as merely authenticated. The follow-up routes those four types through
  the same operator helper before repository access; anonymous callers now get
  `UNAUTHENTICATED`, members get `FORBIDDEN`, and session/API-token operators
  succeed. Public and owner-scoped node behavior is unchanged.

### 2026-07-12 — Milestone 3: ingestion and attribution integrity

- External-product conflict handling now exposes an explicit internal
  fresh/stale decision. Stale observations, including older different-URL
  payloads, return a report-compatible success without changing external
  product state or creating/changing product, merchant-product, or price rows.
- Resolved click sessions validate every available merchant, affiliate-program,
  product, and merchant-product dimension before high-confidence enrichment or
  persistence. Conflicts return changeset errors and valid link-only enrichment
  remains intact.
- Impact status parsing explicitly recognizes pending, approved, reversed, and
  paid. Unknown initial or update statuses return changeset errors, write
  nothing, and cannot downgrade an approved conversion.
- RED evidence: the combined focused suite ran 76 tests with 4 failures,
  reproducing the stale different-URL write, provider/click conflict write,
  unknown-status insert, and unknown-status downgrade.
- GREEN evidence: the same focused suite passed 76 tests with 0 failures, and
  `mix typecheck` passed. Dialyzer remains at the audit baseline of four
  pre-existing `CommerceLink` warnings and produced no touched-module warning.
- Independent review follow-up corrected four additional boundary cases:
  current-offer lookup no longer depends on stale merchant identity; provider
  affiliate-program and merchant-product relationships must agree with all
  click-known dimensions; castable string click-session ids resolve before
  conflict validation; and Impact requires an explicit recognized status for
  inserts and updates. RED reproduced all four gaps in 82 tests with 5 failures;
  GREEN passes the reconciled 81-test suite with 0 failures.
- Final ingestion review tightened current-offer lookup with the persisted
  external listing identity (`external_id`/`external_sku`) so a newer unrelated
  merchant offer sharing product and URL cannot be returned for a stale
  observation.

### 2026-07-12 — Milestone 4: discussion invariants and schema-only boundaries

- Parent mutations now run in one transaction that reloads the post identity,
  locks the shared product-thread row, reloads the post after the lock, validates
  parent existence/thread scope/cycles in `Discussions`, and updates. A held-lock
  database barrier proves concurrent inverse updates serialize: the first
  commits and the second returns the existing cycle changeset error.
- `ThreadPost` and `ProductReview` use creation/update-specific cast fields, so
  existing author, thread, owner, product, and merchant-product identity cannot
  be reassigned while body, title, and rating edits remain valid.
- `ThreadPost` and `ProductAttributeCurrent` changesets perform no repository
  reads. `Specs.select_current_claim/4` retains the existing not-found,
  not-accepted, and scope-mismatch contracts while selecting the claim with one
  query rather than a duplicate hidden lookup.
- CJ feed-discovery startup accepts only nil or non-negative integer cursors;
  successful reports advance only to the same safe domain. Negative, float,
  string, and malformed cursors retain safe scheduler state without crashes.
- RED evidence: the initial 21-test regression run produced eight expected
  failures covering identity mutation, hidden claim queries, invalid cursor
  propagation, context parent validation, and missing thread-lock serialization.
- GREEN evidence: the expanded focused discussion, Specs, and scheduler suites
  pass 63 tests with zero failures; `mix typecheck` passes. Dialyzer reports no
  touched-module warnings and retains only warnings outside this milestone's
  owned paths.

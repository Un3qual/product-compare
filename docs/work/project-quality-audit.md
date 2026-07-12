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

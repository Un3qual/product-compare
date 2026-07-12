# Project Quality Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` to implement this plan task-by-task.
> Every behavior change follows `superpowers:test-driven-development`, every
> task is committed, and every task receives an independent spec-and-quality
> review before the next task begins.

**Goal:** Repair the validated whole-project correctness, authorization,
integrity, frontend runtime, structural, and verification defects in one
non-draft PR stacked on the latest open ProductCompare PR.

**Architecture:** The live Absinthe schema becomes the Relay source of truth;
operator capability is an explicit user property enforced by one GraphQL
authorization boundary; data invariants live in transactional contexts rather
than repository-reading schema modules; route-owned frontend state is scoped to
committed route or selection identity; route modules become real delivery
boundaries; and one root CI gate verifies both application stacks.

**Tech Stack:** Elixir 1.19, Phoenix 1.8, Ecto/PostgreSQL 18, Absinthe, React 19,
React Router 7, Relay 20, TypeScript 5.8, Vite 7, Vitest, Bun, StyleX.

**Approved design:**
`docs/superpowers/specs/2026-07-12-project-quality-audit-remediation-design.md`

## Global Constraints

- Preserve the four existing `ready` rows in `docs/work/index.md`; this is a
  coordinator-owned active lane and must not claim or rewrite those rows.
- Preserve Phoenix as cookie-session authority. Browser login, registration,
  logout, recovery, and verification continue through GraphQL over
  `/api/graphql`; do not add REST auth endpoints or browser bearer tokens.
- Registration always creates a non-operator. Only trusted backend bootstrap
  code may change operator access.
- Anonymous protected operations return `UNAUTHENTICATED`; authenticated
  members denied an operator surface return `FORBIDDEN`.
- Shopper-facing nested active coupons remain public. Global affiliate writes,
  top-level active coupons, ingestion review, and revenue reporting are
  operator-only.
- The canonical SDL exported from `ProductCompareWeb.Schema` is the sole Relay
  schema contract. Do not hand-maintain a partial parallel schema.
- Stale ingestion, invalid attribution, unknown provider statuses, and denied
  authorization must not partially mutate persistence.
- Keep changesets structural. Cross-row validation and locking belong in
  contexts and transactions.
- Revenue date presets preserve the browser-local calendar contract while
  avoiding server/client hydration differences.
- Use direct dynamic imports for route chunks. Do not add generic route
  factories, wrapper-only route modules, barrels, render-prop frameworks, or
  memoization for simple values.
- Keep tests behavioral and semantic. Do not use source-string assertions to
  prove implementation structure.
- Do not use browser automation or browser tools for this implementation.
- Do not reopen deferred email delivery, live provider ingestion, eBay,
  production-readiness proof, or other unrelated product scope.
- Update `docs/work/project-quality-audit.md` with truthful verification at
  each milestone and commit code, tests, and lane evidence together.

---

### Task 1: Canonical GraphQL Schema And Brandless Product Safety

**Files:**

- Modify: `assets/schema.graphql`
- Modify: `assets/package.json`
- Modify: `assets/src/__generated__/**`
- Modify: `assets/src/routes/catalog/BrowseProductList.tsx`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `test/support/fixtures/specs_fixtures.ex`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Create: `test/product_compare_web/graphql/schema_snapshot_test.exs`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** `assets/schema.graphql` exactly equals
`Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)`. `bun run relay:check`
validates generated artifacts without writing. An explicit `brand_id: nil`
fixture remains brandless, GraphQL returns `brand: null`, and browse/picker
render `Unknown brand` without losing the rest of the result set.

- [ ] Add the schema-snapshot test and brandless backend/frontend regressions;
      run them RED against the handwritten schema, fixture, and unsafe reads.
- [ ] Export canonical SDL with
      `mix absinthe.schema.sdl --schema ProductCompareWeb.Schema assets/schema.graphql`.
- [ ] Fix explicit-nil fixture semantics and the two brand fallbacks.
- [ ] Regenerate Relay artifacts and add the non-writing `relay:check` script.
- [ ] Run focused backend tests, focused frontend tests, `bun run relay:check`,
      `bun run typecheck`, `mix format --check-formatted`, and
      `git diff --check`.
- [ ] Record evidence and commit the milestone.

---

### Task 2: Operator Authorization Boundary

**Files:**

- Create: `priv/repo/migrations/*_add_operator_access_to_users.exs`
- Modify: `lib/product_compare_schemas/accounts/user.ex`
- Modify: `lib/product_compare/accounts.ex`
- Create: `lib/product_compare_web/graphql/authorization.ex`
- Modify: `lib/product_compare_web/graphql/errors.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `priv/repo/seeds.exs`
- Modify: `test/support/fixtures/accounts_fixtures.ex`
- Modify: `test/product_compare_web/graphql/affiliate_workflows_test.exs`
- Modify: `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Modify: `test/product_compare_web/graphql/session_auth_test.exs`
- Modify: `assets/schema.graphql`
- Modify: `assets/src/__generated__/**`
- Modify: `assets/src/routes/root/queries/RootViewerRouteQuery.ts`
- Modify: `assets/src/routes/root/loader.ts`
- Modify: `assets/src/routes/RootRoute.tsx`
- Modify: `assets/src/routes/RootDestinations.tsx`
- Modify: `assets/src/routes/auth/mutations/LoginMutation.ts`
- Modify: `assets/src/routes/auth/mutations/RegisterMutation.ts`
- Modify: `assets/src/routes/auth/viewer-store.ts`
- Modify: relevant auth/root frontend tests under `assets/test/routes/**`
- Modify: `docs/work/graphql-auth-migration.md`
- Modify: `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- Modify: `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** Users have a non-null `is_operator` boolean defaulting false.
Registration cannot set it. A trusted Accounts context function changes it for
seed/bootstrap use. One GraphQL helper differentiates missing authentication
from missing operator capability. Session and API-token operators succeed;
members receive `FORBIDDEN` with no writes; anonymous callers retain
`UNAUTHENTICATED`. Viewer navigation reflects `isOperator` without changing
ordinary account features.

- [ ] Generate the migration and add RED authorization tests for every global
      affiliate mutation/query, feed-candidate query/review, and revenue query,
      including member non-mutation and operator API-token success.
- [ ] Add the user capability and trusted Accounts update path; mark existing
      admin and moderator seed accounts as operators.
- [ ] Add shared top-level and mutation `FORBIDDEN` error helpers and enforce
      them in the three resolvers.
- [ ] Expose `isOperator` on `viewer`, split member/operator navigation, and
      preserve it in login, registration, root-loader, and Relay-store paths.
- [ ] Export canonical SDL and regenerate Relay artifacts.
- [ ] Run focused account/GraphQL/frontend tests, migration tests,
      `bun run relay:check`, both type checks, formatting, and diff hygiene.
- [ ] Update auth-migration and lane evidence; commit the milestone.

---

### Task 3: Ingestion And Attribution Integrity

**Files:**

- Modify: `lib/product_compare/ingestion.ex`
- Modify: `test/product_compare/ingestion/ingestion_test.exs`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `lib/product_compare/commerce_attribution/impact_adapter.ex`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: relevant Impact adapter tests under
  `test/product_compare/commerce_attribution/**`
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/work/affiliate-revenue-attribution.md`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** External-product upsert returns an explicit freshness decision.
A stale observation, including one with a different URL, succeeds without
creating or changing product, merchant-product, or price rows. Provider
dimensions conflicting with a resolved click are rejected before conversion
write. Unknown Impact statuses are errors and never create or downgrade rows.

- [ ] Add RED tests for a newer URL followed by an older different URL,
      conflicting click/provider dimensions, initial unknown status, and an
      unknown-status update to an approved conversion.
- [ ] Propagate fresh/stale state through ingestion and short-circuit stale
      downstream writes while preserving current reports.
- [ ] Validate non-null click dimensions against supplied provider dimensions
      before confidence and persistence; retain link-only enrichment behavior.
- [ ] Parse only explicit known Impact statuses and return the existing adapter
      error shape for unknown values.
- [ ] Run focused ingestion, adapter, and attribution suites, type/format
      checks, and diff hygiene.
- [ ] Record both lane updates and commit the milestone.

---

### Task 4: Discussion Invariants And Schema-Only Boundaries

**Files:**

- Modify: `lib/product_compare/discussions.ex`
- Modify: `lib/product_compare_schemas/discussions/thread_post.ex`
- Modify: `lib/product_compare_schemas/discussions/product_review.ex`
- Modify: `test/product_compare/discussions/thread_post_validation_test.exs`
- Modify or create: focused review immutability tests under
  `test/product_compare/discussions/**`
- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare_schemas/specs/product_attribute_current.ex`
- Modify: relevant Specs tests under `test/product_compare/specs/**`
- Modify: `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`
- Modify: `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** A post-parent update locks its product-thread row, reloads the
post, performs same-thread and cycle validation in the Discussions context,
and updates in one transaction. Concurrent inverse parent updates cannot both
commit. Existing post/review ownership and product identity are immutable.
Schema changesets perform no Repo reads. CJ discovery cursors are nil or
non-negative integers only.

- [ ] Add RED concurrency, ownership-transfer, duplicate claim-query, and
      invalid-cursor tests. The concurrency test must coordinate two database
      tasks deterministically rather than rely on repeated timing loops.
- [ ] Move thread parent validation into the context transaction and serialize
      on the shared thread row before reloading and validating.
- [ ] Split insert/update cast fields so post author and review owner/product
      identity cannot change.
- [ ] Remove repository reads from both schema modules while retaining context
      validation and current error contracts.
- [ ] Mirror the proven product-import cursor normalizer in discovery startup
      and advancement.
- [ ] Run focused discussion, Specs, and scheduler suites, Dialyzer on touched
      modules where supported, formatting, and diff hygiene.
- [ ] Record evidence and commit the milestone.

---

### Task 5: Product 404 And API-Token Route State

**Files:**

- Modify: `assets/src/routes/products/loader.ts`
- Modify: relevant product loader/SSR tests under
  `assets/test/routes/products/**` and `assets/test/entry.server.test.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: relevant API-token tests under
  `assets/test/routes/account/api-tokens/**`
- Modify: `docs/work/frontend-product-detail.md`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** `product: null` returns React Router data with HTTP status 404
while the existing not-found content and hydration data remain available.
API-token optimistic rows and one-time plaintext belong to the current route
location/page and reset before another status/cursor location renders.

- [ ] Add RED SSR status/markup/bootstrap coverage for a missing product.
- [ ] Add RED API-token coverage that creates on one page, then navigates to a
      different status and cursor and observes neither row nor plaintext.
- [ ] Return typed 404 loader data without throwing away the current fallback.
- [ ] Key the state-owning API-token route boundary by location identity and
      retain same-location mutation/revalidation behavior.
- [ ] Run focused product/API-token/SSR suites, TypeScript, Relay validation,
      and diff hygiene.
- [ ] Record both frontend lane updates and commit the milestone.

---

### Task 6: Compare Save State And Hydration-Stable Formatting

**Files:**

- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- Modify: `assets/src/routes/offers/offer-discovery-data.ts`
- Modify: `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify or create: shared deterministic-formatting helper only if at least
  two production call sites use it
- Modify: relevant compare, ingestion, offer, and revenue tests under
  `assets/test/routes/**`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`
- Modify: `docs/work/frontend-revenue-reporting-demo-parity.md`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** Compare request refs and feedback are owned by a component keyed
to the committed selection and never reset during render. An abandoned
suspending selection render cannot strand the visible selection. Visible
ordering and timestamps use explicit product locale/timezone. Revenue presets
appear from a hydration-safe browser-local date and retain existing local-day
behavior behind and ahead of UTC.

- [ ] Add a RED abandoned-transition save regression and confirm the current
      render-time ref reset loses the completion.
- [ ] Add deterministic ordering/timestamp and SSR-hydration regressions under
      contrasting locale/timezone assumptions.
- [ ] Move selection-owned compare state into a keyed inner boundary and
      remove all render-time mutation.
- [ ] Pin product formatting inputs and make revenue preset date acquisition
      hydration-safe without changing the local-calendar path contract.
- [ ] Run focused compare, ingestion, offer, revenue, and SSR suites,
      TypeScript, and diff hygiene.
- [ ] Record evidence and commit the milestone.

---

### Task 7: Lazy Route Delivery And Bundle Contract

**Files:**

- Modify: `assets/src/router.tsx`
- Modify: `assets/vite.config.ts`
- Create: `assets/scripts/check-client-bundle.ts`
- Modify: `assets/package.json`
- Modify: `assets/test/router.test.tsx`
- Modify: relevant SSR/navigation tests under `assets/test/**`
- Modify: `docs/work/project-quality-audit.md`

**Contract:** Root shell/home, route metadata, and wildcard 404 remain in the
initial graph. Every non-root screen and its loader use a direct dynamic import
through React Router `lazy`. The Vite manifest proves affiliate setup, feed
candidates, revenue, and API tokens are dynamic entries outside the initial
import closure. A measured gzip budget protects the post-split initial closure.

- [ ] Enable a Vite manifest and add a RED build-output check against the
      current single-entry bundle.
- [ ] Add/adjust router behavior tests for lazy route contracts without
      asserting source text or component implementation details.
- [ ] Replace eager non-root imports with direct lazy functions, preserving
      static path, metadata, error, loader, and SSR behavior.
- [ ] Build client and SSR output, calculate the complete initial import
      closure, set a documented budget with reasonable headroom, and prove the
      named rare routes are outside it.
- [ ] Run router/SSR suites, full frontend unit tests, TypeScript, production
      builds, bundle check, and diff hygiene.
- [ ] Record measured before/after evidence and commit the milestone.

---

### Task 8: Destination URL Boundary And Whole-Project Gates

**Files:**

- Create: `lib/product_compare/commerce_attribution/destination_url.ex`
- Modify: `lib/product_compare_schemas/commerce_attribution/commerce_link.ex`
- Create or modify: focused URL-policy tests under
  `test/product_compare/commerce_attribution/**`
- Modify: `test/product_compare_web/graphql/connection_test.exs`
- Modify: `mix.exs`
- Modify: `assets/package.json`
- Modify: `flake.nix`
- Modify: `README.md`
- Modify: `docs/work/project-quality-audit.md`
- Modify: `docs/work/index.md`

**Contract:** `DestinationUrl.valid?/1` owns the existing URL/IP/IDNA/punycode
policy with no semantic change; `CommerceLink.valid_destination_url?/1`
delegates for compatibility. The touched module has no unsuppressed Dialyzer or
Reach finding. Connection tests assert returned nodes. `bun run check` covers
Relay validation, typecheck, unit tests, client/SSR build, and bundle contract;
root `mix ci` and `mix precommit` execute that frontend gate after backend
checks. The Nix shell provides Bun. Playwright remains separate.

- [ ] Run the existing adversarial URL suite as a green characterization, then
      extract the pure module without changing accepted/rejected cases.
- [ ] Remove unreachable clauses, replace the eager indexed enumeration, and
      make the extracted boundary pass focused Dialyzer and Reach checks.
- [ ] Strengthen the two connection assertions and verify Credo is clean.
- [ ] Compose the frontend `check` script, root Mix aliases, Nix dependency,
      and README command contract; first demonstrate each missing gate against
      the pre-change command graph.
- [ ] Run `bun run check`, `mix ci`, `mix dialyzer`, `mix
      reach.check --smells --strict --baseline .reach-baseline.json`,
      `mix ex_dna --max-clones 6`, `mix format --check-formatted`, and
      `git diff --check` with pristine output.
- [ ] Record final lane evidence, remove the active audit row while preserving
      all four ready rows, and commit the milestone.

## Final Verification And Publication

- [ ] Generate a whole-branch review package from the PR #94 base through
      `HEAD` and obtain an independent broad code review.
- [ ] Fix and re-review every Critical or Important issue; rerun affected
      focused tests after each fix.
- [ ] Re-run the combined project gates from a clean working tree.
- [ ] Refresh the open PR list. If a newer compatible stacked head exists,
      rebase onto it and rerun the combined gates; otherwise retain
      `codex/extract-credential-auth-form` as the base.
- [ ] Push `codex/project-quality-audit` and open a non-draft PR against the
      latest compatible open head with audit findings, milestone commits,
      verification evidence, and deliberate non-changes summarized.

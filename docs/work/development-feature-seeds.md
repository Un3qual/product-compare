# Development Feature Seeds

## Snapshot

- Status: complete
- Priority: P0
- Plan:
  `docs/superpowers/plans/2026-07-31-development-feature-seeds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-07-31-development-feature-seed-design.md`
- Last verified: 2026-07-31 against the current seed entry point, frontend
  route map, GraphQL surface, context APIs, and persisted schemas.

## Batch Outcome

Every delivered development route and backing workflow now has deterministic,
self-contained representative data immediately after seeding. Six documented
accounts exercise ownership, participation, moderation, operator, unverified,
and password-reset policies; synthetic CJ and attribution records require no
provider, scheduler, mailer, job, or network call.

## Observed Coverage

- The catalog spans monitor, TV, and projector facets, source-backed claims,
  offer freshness/availability states, affiliate programs/links, and
  active/future/expired coupons.
- Shopper state includes saved and shared comparisons, read/unread alerts,
  active/revoked API tokens, owned community content, an accepted answer and
  report, and pending/accepted/rejected specification corrections.
- Operator state includes every CJ program stage, matched/unmatched feeds,
  successful/failed import histories, correction moderation, coupons, and
  approved/pending/reversed/paid attribution history with revenue facts.
- The post-commit guide prints credentials, local auth tokens, and concrete
  shopper/operator paths, while GraphQL smoke coverage proves those surfaces
  are non-empty at public, shopper, and operator access levels.
- Reruns restore reserved fields and counts, preserve the shared token and
  unrelated local records, and roll back atomically on a preclaimed operator
  email.
- Reserved price-point ownership is proven only by immutable entropy IDs, and
  community fixtures do not consume or depend on interactive hourly quotas.
- Reruns preserve both an existing current claim and an intentionally empty
  current state when pending correction moderation depends on that baseline.

## Boundaries

- Preserve unrelated local data; reconcile only stable reserved seed keys.
- Preserve fail-closed operator email ownership.
- Use domain contexts first and validated schema changesets only for missing
  upsert/update operations.
- Keep all new runtime code under `priv/repo/seeds/`.
- Do not contact providers, deliver email, start schedulers, or enqueue CJ jobs.
- Keep deferred production delivery, privacy/attribution hardening, and
  production-readiness proof out of scope.

## Internal Slices

1. Transactional seed runtime, role accounts, and local auth artifacts.
   Completed in the account milestone: six reserved accounts, restored roles
   and reputations, local confirmation/reset tokens, and active/revoked API
   token examples now pass the real account boundaries without delivery hooks.
2. Catalog/specification and marketplace/affiliate state matrices.
   Completed in the catalog/marketplace milestone: five products span monitor,
   TV, and projector facets; six offers exercise fresh, aging, stale,
   out-of-stock, inactive, and unobserved states; synthetic source evidence,
   affiliate programs/links, and active/future/expired coupons are local-only.
3. Saved/shared comparison, alert, community, and correction lifecycles.
   Completed in the engagement milestone: two saved sets, one stable public
   snapshot, enabled/disabled watches with read/unread local events, multi-owner
   community moderation examples, one accepted answer/report, and all three
   correction decisions are seeded through existing lifecycle APIs.
4. Synthetic CJ/attribution history, testing guide, and route smoke coverage.
   Completed in the operator-workflow milestone: seven CJ lifecycle programs,
   matched and unmatched feeds, successful/failed import histories, four
   attribution states with purchase facts, and non-empty public/shopper/operator
   GraphQL reads are all local-only; the guide prints credentials and concrete
   test routes after commit.
5. Deterministic rerun restoration, unrelated-data preservation, and atomic
   failure proof. Completed in the closeout milestone: scoped counts remain
   fixed across two complete runs, deliberately changed seed fields return to
   baseline, unrelated records remain byte-for-byte unchanged, and an operator
   conflict leaves no partial seed records.

## Verification

- 2026-07-31: `mix test test/product_compare/repo/seeds_test.exs` — 2 tests,
  0 failures after the account milestone.
- 2026-07-31: `git diff --check` — clean after the account milestone.
- 2026-07-31: `mix test test/product_compare/repo/seeds_test.exs` — 3 tests,
  0 failures after the catalog/marketplace milestone.
- 2026-07-31: `mix test test/product_compare/catalog
  test/product_compare/pricing test/product_compare/affiliate` — 103 tests,
  0 failures.
- 2026-07-31: `git diff --check` — clean after the catalog/marketplace
  milestone.
- 2026-07-31: `mix test test/product_compare/repo/seeds_test.exs` — 4 tests,
  0 failures after the engagement milestone.
- 2026-07-31: `mix test test/product_compare/comparison_snapshots_test.exs
  test/product_compare/alerts test/product_compare/discussions
  test/product_compare/specs` — 114 tests, 0 failures.
- 2026-07-31: `git diff --check` — clean after the engagement milestone.
- 2026-07-31: `mix test test/product_compare/repo/seeds_test.exs
  test/product_compare_web/graphql/development_seeds_test.exs` — 46 tests,
  0 failures against the final reviewed seed suite.
- 2026-07-31: `mix test test/product_compare/ingestion
  test/product_compare/commerce_attribution
  test/product_compare_web/graphql/cj_program_queries_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs` — 254
  tests, 0 failures.
- External-isolation coverage observed no configured delivery/import runner call
  and no additional CJ worker job while the complete seed populated synthetic
  CJ, import, attribution, and revenue history.
- The rerun regression observed unchanged scoped counts, one stable public
  snapshot token, restored product/program fields, and byte-for-byte preserved
  unrelated user, token, product, merchant, and review records.
- The atomic failure regression observed no partial shopper, product, merchant,
  or source records after the fail-closed operator conflict.
- 2026-07-31: affected account, catalog, pricing, affiliate, alert, discussion,
  specification, comparison, ingestion, and attribution suites — 502 tests,
  0 failures.
- 2026-07-31: complete GraphQL suite — 340 tests, 0 failures.
- 2026-07-31: `mix test` — 1,105 tests, 0 failures.
- 2026-07-31: `mix format --check-formatted` and `mix typecheck` — passed.
- 2026-07-31: `mix quality` — Credo found no issues, the existing 3/3 clone
  budget held, cross-function analysis found no issues, and Dialyzer reported
  0 errors.
- 2026-07-31: `mix work_queue.validate` — valid with 3 ready rows after
  removing the completed batch.
- 2026-07-31: `git diff --check` — clean at closeout.

## Blocker Rule

Stop and record the exact missing domain transition if a representative state
cannot be created without bypassing a product invariant or calling an external
integration. Do not use unchecked inserts, broad cleanup, or fake success
states to satisfy the scenario matrix.

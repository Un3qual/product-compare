# Development Feature Seeds

## Snapshot

- Status: ready
- Priority: P0
- Plan:
  `docs/superpowers/plans/2026-07-31-development-feature-seeds-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-07-31-development-feature-seed-design.md`
- Last verified: 2026-07-31 against the current seed entry point, frontend
  route map, GraphQL surface, context APIs, and persisted schemas.

## Target Outcome

Every delivered development route and backing workflow has deterministic,
self-contained representative data immediately after seeding. Several
documented accounts exercise ownership, participation, moderation, and operator
policy; synthetic CJ and attribution records require no provider, scheduler,
mailer, or network call.

## Ready Evidence

- The current seed creates two operators, taxonomies, three monitor products,
  current claims, one merchant offer, and three price observations.
- Saved/shared comparisons, alerts, API-token lifecycle examples, community
  ownership/moderation, corrections, affiliate setup, CJ program lifecycle,
  ingestion history, and recorded revenue remain empty after a normal seed.
- `assets/src/router.tsx` exposes shopper, account, affiliate, CJ-program, and
  revenue routes backed by existing context and GraphQL operations.
- Existing contexts support local token callbacks, idempotent conversion and
  provider records, immutable comparison capture, local alert evaluation, and
  community idempotency without external services.
- The current `SeedsTest` protects operator bootstrap takeover but does not
  prove a successful seed, rerun behavior, route visibility, or provider
  isolation.

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
2. Catalog/specification and marketplace/affiliate state matrices.
3. Saved/shared comparison, alert, community, and correction lifecycles.
4. Synthetic CJ/attribution history, testing guide, route smoke coverage, and
   deterministic rerun proof.

## Verification

- seed entry-point and development-seed GraphQL suites
- affected account, catalog, pricing, affiliate, alert, discussion,
  specification, comparison, ingestion, attribution, and GraphQL suites
- full backend tests, type checks, quality, formatting, queue, and diff gates

## Blocker Rule

Stop and record the exact missing domain transition if a representative state
cannot be created without bypassing a product invariant or calling an external
integration. Do not use unchecked inserts, broad cleanup, or fake success
states to satisfy the scenario matrix.

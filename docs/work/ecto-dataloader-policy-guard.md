# Ecto Dataloader Policy Guard

## Snapshot

- Status: done; superseded by the 2026-07-31 GraphQL simplification
- Priority: P2
- Plan:
  `docs/superpowers/plans/2026-07-30-ecto-dataloader-policy-guard-implementation-plan.md`
- Last verified: 2026-07-31 against the simplified request loader, schema
  architecture contract, complete GraphQL suite, and generated SDL.

## Batch Outcome

The repository rejects first-party KV Dataloader sources, every registered
request source is a real `Dataloader.Ecto` source, and ordinary Ecto
associations retain inline Dataloader declarations without pass-through
resolvers.

## Completion Evidence

- The fake `EctoBatchSource`, term serialization, marker schema, generic loader
  delegates, and all singleton root sources were removed by the platform
  simplification.
- The request loader now registers two ordinary association sources, six
  genuine parent-set sources, and one authorized-node source. Runtime coverage
  asserts that all nine are `%Dataloader.Ecto{}` values backed by actual domain
  schemas and scalar IDs.
- The architecture test scans the production GraphQL and schema trees for
  `Dataloader.KV`, rejects the removed fake adapter, and keeps ordinary
  associations on inline Dataloader declarations.
- Root reads now call their context query APIs directly. Genuine growing-parent
  and authorized-node suites retain bounded SELECT assertions.
- The complete post-review GraphQL suite passed 328 tests with 0 failures; the
  Ecto Dataloader policy row therefore had no remaining implementation outcome
  and was removed from the live queue.

## Boundaries

- KV remains a last resort requiring explicit user approval.
- Preserve every loader source key and callback.
- Do not replace set-based Ecto batches with per-record context calls.
- Do not introduce schema helper functions merely to satisfy the policy test.
- Keep authorization and query-budget behavior unchanged.

## Verification

- schema architecture, connection, affiliate workflow, and Dataloader batching
  suites passed
- complete GraphQL suite: 328 tests, 0 failures
- Relay generation, compile with warnings as errors, typecheck, formatting, and
  diff checks passed

## Next Action

None. The dated policy-guard plan remains historical evidence; it must not be
redispatched unless live source validation finds a new violation.

# Complete Relay Node Coverage

## Snapshot

- Status: active
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-complete-relay-node-coverage-implementation-plan.md`
- Last verified: 2026-07-30 against the modular Relay schema, global-ID
  registry, Node resolver, authorized node source, and GraphQL suites.

## Target Outcome

All stable GraphQL entities with their own global IDs implement Relay Node and
can be retrieved through `node(id:)` only when the current viewer satisfies the
entity's existing public, owner, or operator visibility policy.

## Validated Scope

- Twelve entities already use `node object`.
- Ten stable entities still declare a manual globally encoded `id` on a plain
  object: `User`, `ComparisonSnapshot`, the three community content types, the
  two ingestion operator types, `SpecificationCorrection`, `PriceWatch`, and
  `AlertEvent`.
- The existing authorized node source already batches operator affiliate and
  owner saved-set/token reads; it is the set-based extension point.
- `SeoCategory`, `ProductFilterOption`, and `ComparisonSnapshotProduct` are
  projections whose IDs refer to an underlying Taxon, filter entity, or
  Product. They are intentionally not Node entities.

## Boundaries

- Public community nodes must be published; owners may retrieve their own
  retained submissions.
- Snapshots, corrections, watches, and alert events remain owner-scoped.
- CJ programs and feed candidates remain operator-only.
- `User` is self-only.
- Snapshot revocation and every current authorization error/null contract
  remain unchanged.
- No `Dataloader.KV` source or unbounded per-alias lookup is allowed.

## Verification

- Node, authorization, schema architecture, and Dataloader batching suites
- affected accounts, alerts, snapshots, discussions, ingestion, and specs
  GraphQL suites
- full backend tests, type checks, and quality gates
- Relay validation, full frontend tests, client/SSR builds, and bundle contract
- `mix work_queue.validate`
- `mix format --check-formatted`
- `git diff --check`

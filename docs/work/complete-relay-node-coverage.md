# Complete Relay Node Coverage

## Snapshot

- Status: complete
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

## Delivered

- Converted `User`, `ComparisonSnapshot`, all three community content entities,
  both ingestion operator entities, `SpecificationCorrection`, `PriceWatch`,
  and `AlertEvent` to Relay `node object` declarations.
- Extended the Node interface resolver and typed ID decoder across all 22
  stable entities while leaving the three projection objects plain.
- Added a focused discussion Node read boundary for published-or-owner
  visibility and extended the existing authorized Ecto batch source for self,
  owner, operator, and owner-or-operator policies.
- Preserved revoked snapshot hiding, current-user isolation, community
  moderation, correction moderation access, and operator authorization.
- Added growing-alias tests proving each new authorization class retains a
  fixed SELECT budget.
- Regenerated `assets/schema.graphql`; Relay compilation confirmed the existing
  generated operations remain current.

## Verification Evidence

- Focused Node, authorization, architecture, batching, and affected-domain
  GraphQL suites: 151 tests passed.
- Complete backend test suite: 1,023 tests passed.
- `mix typecheck`: passed.
- `mix quality`: Credo found no issues, ExDNA stayed within the 3/3 clone
  baseline, cross-function analysis found no issues, and Dialyzer reported zero
  errors.
- `CI=true mise exec -- pnpm --dir assets run check`: Relay validation,
  TypeScript, Oxlint, Oxfmt, 1,508 Vitest tests, client build, SSR build, and the
  200 KB gzip bundle contract all passed.
- `mix work_queue.validate`, `mix format --check-formatted`, and
  `git diff --check`: passed at closeout.

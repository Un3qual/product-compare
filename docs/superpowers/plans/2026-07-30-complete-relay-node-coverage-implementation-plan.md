# Complete Relay Node Coverage Implementation Plan

**Goal:** Make every stable GraphQL entity with its own global ID a Relay Node
without broadening who may retrieve public, owner-scoped, or operator-scoped
records.

**Architecture:** Convert the remaining entity objects to Absinthe Relay
`node object` declarations and extend the existing request-scoped authorized
node batch. Public community nodes retain moderation visibility, owner nodes
remain visible only to their owner, operator nodes retain operator
authorization, and `User` resolves only for the current viewer. Projection
objects whose IDs refer to another entity remain plain objects.

**Tech Stack:** Elixir, Absinthe Relay modern mode, Dataloader Ecto, Ecto,
PostgreSQL, ExUnit, Relay Compiler.

## Global Constraints

- Breaking SDL and Relay artifact changes are allowed; the project is
  unreleased.
- Convert the ten remaining stable entities: `User`, `ComparisonSnapshot`,
  `ProductReview`, `ProductQuestion`, `ProductAnswer`, `CJProgram`,
  `MerchantFeedCandidate`, `SpecificationCorrection`, `PriceWatch`, and
  `AlertEvent`.
- Do not convert projections such as `SeoCategory`, `ProductFilterOption`, or
  `ComparisonSnapshotProduct`; their IDs identify another entity rather than
  the projection itself.
- Preserve community moderation visibility, owner isolation, operator
  authorization, snapshot revocation, and existing public lookup policy.
- Batch repeated aliases with the existing Ecto-backed authorized node source.
  Do not add `Dataloader.KV`.
- Do not add compatibility fields or alternate root lookups.

## Task 1: Freeze Entity And Authorization Coverage

- [x] Extend the schema architecture contract to enumerate all 22 Relay node
  objects and reject stable entity objects with manual global-ID fields.
- [x] Add failing Node-query cases for self, public community, owner, operator,
  cross-owner, unauthorized, hidden, revoked, missing, and malformed IDs.
- [x] Add growing-alias query-budget coverage for the new authorization
  classes.

## Task 2: Convert Remaining Entity Objects

- [x] Replace the ten plain entity objects and manual ID resolvers with
  `node object`, using entropy-ID fetchers where required.
- [x] Preserve GraphQL names such as `CJProgram` and all existing field
  nullability.
- [x] Regenerate the SDL and Relay artifacts after the intentional contract
  change.

## Task 3: Extend Authorized Node Loading

- [x] Decode integer and UUID node classes explicitly.
- [x] Add set-based Ecto batches for public community visibility, current-user
  identity, owner-scoped entities, and operator-scoped ingestion entities.
- [x] Preserve direct resolver fallback semantics without bypassing
  authorization.

## Task 4: Verify And Close

- [x] Run Node, authorization, schema architecture, Dataloader batching, and
  affected domain GraphQL suites.
- [x] Run full backend tests, type checks, quality gates, Relay validation,
  frontend tests/builds, queue validation, formatting, and `git diff --check`.
- [x] Record exact evidence and close the lane with three ready successors.

Exit condition: all 22 stable GraphQL entities use Relay `node object`, every
new root Node lookup applies its existing visibility policy, repeated aliases
remain set-based, projections stay plain, no KV source exists, generated
contracts are current, and all repository gates pass.

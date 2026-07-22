# Discussions Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-discussions-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the final extracted context, all direct
  discussion suites, community GraphQL, SEO qualification, and Dataloader
  batching.

## Batch Outcome

`ProductCompare.Discussions` remains the stable application-facing context,
while read/query, legacy CRUD, submission/owner-policy, and moderation
implementations live in focused internal modules with unchanged public APIs,
queries, locks, transactions, privacy, limits, idempotency, errors, and GraphQL
behavior.

## Pre-extraction Baseline

The following measurements are the historical baseline recorded before the
implementation was split into focused internal modules.

- `lib/product_compare/discussions.ex` is 1,285 lines and owns at least four
  independently describable responsibilities: read/query projection, raw
  thread/post/review CRUD, authenticated submission and owner lifecycle policy,
  and operator moderation.
- The public context API is already a stable boundary used by resolvers, SEO,
  and tests, so implementation can retain that facade while moving internal
  ownership without caller changes.
- The selected seven-suite characterization gate passed 104 tests on
  2026-07-22. It covers direct CRUD, verified-purchase immutability, post-parent
  validation, community lifecycle policy, SEO qualification, GraphQL behavior,
  privacy, and fixed Dataloader query budgets.
- This row is path-disjoint from operator-reporting and schema ownership. It is
  also independent from request-loader decomposition because callers continue
  to use the unchanged `ProductCompare.Discussions` facade.

## Internal Slices

1. Read and query ownership extraction.
2. Legacy CRUD and parent-validation ownership extraction.
3. Submission, owner lifecycle, idempotency, reporting, and rate-policy
   extraction.
4. Answer-acceptance and operator-moderation ownership extraction.

## Boundaries

- Preserve every public `ProductCompare.Discussions` function, arity, default,
  typespec, result, and error.
- Preserve Ecto filters, order, pagination, locks, transactions, moderation
  transitions, accepted-answer cleanup, owner visibility, write limits, and
  idempotency replay/conflict behavior.
- Keep resolvers, SEO, and other contexts dependent only on the facade.
- Do not change migrations, schemas, GraphQL SDL, frontend behavior, or product
  policy.
- Use responsibility-focused modules; do not replace the monolith with generic
  callback dispatch or one new catch-all implementation module.

## Verification

- `mix test test/product_compare/discussions/community_trust_test.exs test/product_compare/discussions/product_review_immutability_test.exs test/product_compare/discussions/thread_crud_test.exs test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/seo_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Final Contract And Lane Gate (2026-07-22)

- Snapshot Status is **complete** after clean task and whole-batch review; the
  active queue row is closed while three ready successors remain.
- `ProductCompare.Discussions` is a 252-line stable public facade: it retains
  all caller-facing contracts and delegates reads/query projection to
  `Reads` (429 lines), raw thread/post/review CRUD and parent validation to
  `Crud` (190 lines), authenticated submission, ownership, idempotency,
  reporting, and write-limit policy to `Submissions` (483 lines), and
  answer acceptance plus operator moderation to `Moderation` (176 lines).
- A repository-wide search for direct `Reads`, `Crud`, `Submissions`, or
  `Moderation` references outside the facade and implementation directory
  found no production callers; the only result was this change's design-plan
  prose. Resolvers, SEO, and tests therefore continue through the facade.
- The seven focused suites passed with **108 tests, 0 failures** (10.9s).
  `mix typecheck`, `mix format --check-formatted`, and `git diff --check`
  each exited 0.
- `mix work_queue.validate` first failed before startup in the sandbox because
  Mix.PubSub could not open its local TCP socket (`:eperm`); the identical
  command passed with the allowed escalation: `work queue valid: 3 ready
  rows`.
- The post-fix `mix ci` command exited 0. Its quality gate checked 303 source
  files / 3,519 mods-funs with no Credo issues; ExDNA passed at **6/6** clones
  and Dialyzer passed. The CI backend coverage stage passed **902 tests, 0
  failures** in 27.9s at **83.77%** total coverage (69% threshold). The
  frontend check passed Relay validation (51 reader, 50 normalization, and 50
  operation documents), TypeScript, **105** Vitest files / **1,507** tests,
  both Vite builds, and the client-bundle contract at 182,164 gzip bytes under
  its 200,000-byte budget.
- Observed non-failing output: backend tests emitted expected delivery-hook and
  CJ-import warning-path logs; Vite advised that a 596,440-byte raw initial
  client chunk exceeds its 500 kB advisory threshold. Historical diagnostic:
  the pre-fix ExDNA run was 13/6; the approved consolidation resolved it to
  the passing 6/6 result above.

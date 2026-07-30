# Discussion Content Lifecycle Naming

## Snapshot

- Status: active
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-30 against the live discussions facade and focused
  write-owner test.

## Target Outcome

The owner of raw discussion thread, post, and review persistence is named for
its content-lifecycle responsibility rather than the implementation acronym
`Crud`.

## Validated Scope

- `ProductCompare.Discussions.Crud` owns create, update, and delete behavior for
  product threads, thread posts, and product reviews.
- `ProductCompare.Discussions` is the stable public facade and is the only live
  source caller.
- `thread_crud_test.exs` characterizes the owner directly.
- `ContentLifecycle` is the narrowest accurate responsibility name across all
  three content types.

## Boundaries

- Keep the public discussions facade unchanged.
- Rename the existing owner directly; add no compatibility alias, extra
  delegate, manager, service, helper, or utility layer.
- Preserve historical documents when their old naming is evidence rather than
  an active executable contract.

## Verification

- focused discussions content-lifecycle and GraphQL suites
- active source/test naming scan
- `mix typecheck`
- `mix test`
- `mix work_queue.validate`
- `git diff --check`


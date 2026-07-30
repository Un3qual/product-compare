# Discussion Content Lifecycle Naming

## Snapshot

- Status: done
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-30 after the full backend test suite.

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

## Completed Outcome

- Renamed the write owner directly to
  `ProductCompare.Discussions.ContentLifecycle` and moved it to
  `content_lifecycle.ex`.
- Renamed the focused test to `content_lifecycle_test.exs` and its module and
  lifecycle description accordingly.
- Updated only the stable `ProductCompare.Discussions` facade alias and
  delegates; no compatibility alias or additional layer was introduced.
- Active `lib/` and `test/` scans contain no `Crud`, `CRUD`, or `crud`
  identifier or path.

## Verification

- original focused baseline: 5 tests passed
- discussions, SEO, GraphQL community, and Dataloader gate: 106 tests passed
- `mix typecheck`: passed
- full backend suite: 984 tests passed
- active source/test naming scan: passed
- work queue: 3 ready rows
- `git diff --check`: passed

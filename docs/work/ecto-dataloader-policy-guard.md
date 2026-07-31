# Ecto Dataloader Policy Guard

## Snapshot

- Status: ready
- Priority: P2
- Plan:
  `docs/superpowers/plans/2026-07-30-ecto-dataloader-policy-guard-implementation-plan.md`
- Last verified: 2026-07-30 against the current schema architecture test,
  request loader, and inline association declarations.

## Target Outcome

The repository automatically rejects first-party KV Dataloader sources and
unnecessary resolver indirection for ordinary Ecto associations.

## Validated Scope

- The current architecture test scans only the GraphQL loader, schema folder,
  and root schema for the literal `Dataloader.KV`; a helper elsewhere under
  `lib` can evade that policy check.
- The request loader currently registers two association sources and thirteen
  set-based custom batch sources. All fifteen are implemented with
  `Dataloader.Ecto`, but no runtime architecture assertion locks that in.
- Six ordinary schema associations already use the approved inline
  `resolve: dataloader(Context, use_parent: true)` form.
- Query-budget suites already characterize batching behavior and remain the
  semantic guard; this batch adds architecture policy, not new loading
  behavior.

## Boundaries

- KV remains a last resort requiring explicit user approval.
- Preserve every loader source key and callback.
- Do not replace set-based Ecto batches with per-record context calls.
- Do not introduce schema helper functions merely to satisfy the policy test.
- Keep authorization and query-budget behavior unchanged.

## Verification

- schema architecture and Dataloader batching suites
- complete GraphQL suite
- full backend tests, typecheck, and quality
- `mix work_queue.validate`
- `mix format --check-formatted`
- `git diff --check`

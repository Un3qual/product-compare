# Strict Credo Enforcement

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-24-strict-credo-enforcement-implementation-plan.md`
- Last verified: 2026-07-24 with `mix credo --all --strict`.

## Target Outcome

The normal repository Credo gate enforces strict readability checks and the two
test-support modules explain repository-specific contracts instead of
narrating their names.

## Ready Evidence

- Non-strict Credo passes.
- Strict Credo reports exactly two narrator-documentation findings in ConnCase
  and DataCase.

## Verification

- `mix credo --all`
- `mix quality`
- `mix ci`

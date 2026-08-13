# Frontend Inferred Type Simplification

## Snapshot

- Status: active
- Priority: P1
- Requested: 2026-08-12 after Product Discovery And Evaluation.
- Owner: current detached worktree.

## Target Outcome

The whole frontend prefers inference and generated Relay contracts over local
annotations, duplicated response schemas, and generic route helper files while
retaining explicit types at public component, URL, storage, transport, custom
scalar, and exhaustive-union boundaries.

## Owned Paths

- `assets/src/**`, generated Relay artifacts, and focused frontend tests.
- This lane document and the active dispatcher row.

## Internal Slices

1. Inventory redundant declarations and annotations.
2. Replace successful GraphQL response schemas with generated Relay types.
3. Remove or relocate generic root route helpers to their real owners.
4. Infer local values and result types across remaining route/UI modules.
5. Run focused, structural, complete frontend, and browser gates.

## Guardrails

- Do not erase useful discriminated unions, exported component contracts,
  exhaustive checks, external-library adaptation, or validation at untyped
  browser/network/URL/storage/custom-scalar boundaries.
- Do not use assertions merely to reduce annotation counts.
- A moved helper must gain a concrete owner; do not rename slop into another
  generic utility file.

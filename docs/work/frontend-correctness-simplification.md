# Frontend Correctness And Simplification

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-30-frontend-correctness-simplification-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Target Outcome

Product detail recovers only a safe optional GraphQL region; Relay owns every
in-scope connection; affiliate mutations live with their submitting steps; and
the shared select and route descriptor expose only behavior the application
actually uses.

## Owned Paths

- `assets/src/routes/products/ProductDetailRoute.tsx`
- `assets/src/routes/products/community/**`
- `assets/src/routes/compare/picker/**`
- `assets/src/routes/compare/sharing/**`
- `assets/src/routes/affiliate/setup/**`
- `assets/src/ui/primitives/Select.tsx`
- `assets/src/relay/route-preload.ts`
- Matching generated Relay artifacts
- Focused frontend tests named by the plan
- This lane document

## Internal Slices

1. Safe product-detail partial recovery.
2. Community review/question/answer Relay pagination.
3. Compare picker and snapshot Relay pagination.
4. Step-local affiliate mutation state.
5. Single-select and compact route-descriptor contracts.

## Blocker Rule

Stop if a connection cannot be expressed with Relay's existing schema without
a backend API change, if mutation state is shared by more than one workflow
step, or if descriptor compaction would require weakening SSR query retention
or operation identity.

## Completion Evidence

Pending implementation. Record focused component/loader RED/GREEN results,
generated artifact review, complete frontend gate, browser flow, code/file
reduction, and the milestone commit here.

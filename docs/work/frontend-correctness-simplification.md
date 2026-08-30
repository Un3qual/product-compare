# Frontend Correctness And Simplification

## Snapshot

- Status: complete
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

- Product-detail recovery now accepts only errors rooted at
  `product.merchantProducts` and validates the retained identity and SEO
  projection before rendering a partial response.
- Relay pagination fragments own community reviews, questions, answers, the
  compare picker, and comparison snapshots. Four manual cursor/append helpers
  and their effect-driven accumulation paths were removed.
- Affiliate setup mutations, pending/error/result state, and duplicate-submit
  guards live in their four submitting steps; the route owns only network and
  merchant identity shared by later steps.
- `Select` is single-select only. Route descriptors serialize generated
  `cacheID`, diagnostic operation name, and stable variables without GraphQL
  operation text.
- Focused evidence: 91 product/community tests, 132 compare tests, 36 affiliate
  tests, 21 route-preload tests, and 23 primitive tests passed. The full suite
  passed 1,500 tests across 110 files.
- `pnpm run relay:check`, `pnpm run typecheck`, `pnpm run lint`,
  `pnpm run format:check`, and `pnpm run build` passed. The production build
  passed client, SSR, StyleX-mangle, and bundle-budget checks.
- `PLAYWRIGHT_PORT=4193 pnpm run test:e2e --
  tests/e2e/product-experience-foundations.spec.ts` passed all five desktop,
  tablet, mobile, auth-navigation, and operator-route cases after aligning the
  fixture with the generated `merchantName` field and current date-time/price
  presentation contracts.
- Milestone commits: `97bcc250`, `1c7907c9`, and `c51e5ac8`; the final
  single-select/descriptor contract and this closeout share the lane-completion
  commit.

# Product Trust And Discovery Program Implementation Plan

**Goal:** Deliver the selected feature-completion program without allowing
later shopper surfaces to outrun catalog, offer, or provenance truth.

**Design:**
`docs/superpowers/specs/2026-07-13-product-trust-and-discovery-program-design.md`

## Execution Sequence

1. Canonical product identity.
2. Public specification provenance.
3. Complete offer read contract.
4. Durable ingestion jobs and complete-run reconciliation.
5. Specification enrichment, media, taxonomy mapping, and corrections.
6. Watch rules, durable alert evaluation, and in-app alert inbox.
7. Deterministic recommendation profiles and evidence references.
8. Immutable shareable comparison snapshots.
9. Reviews and product Q&A with moderation.
10. Merchant detail reads and pages.
11. Product, merchant, category, and public-comparison SEO surfaces.

Each numbered item is a milestone boundary with red-green tests, focused
verification, lane evidence, and a commit. Dependent plans are written and
promoted only after their input contract is green; they are not used as queue
filler.

## Active Foundation Plans

- `docs/superpowers/plans/2026-07-13-canonical-product-identity-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-specification-provenance-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-offer-truth-read-contract-implementation-plan.md`
- `docs/superpowers/plans/2026-07-13-durable-ingestion-job-foundation-implementation-plan.md`

## Program Verification

Every milestone runs its focused tests plus:

```sh
mix format --check-formatted
mix typecheck
mix work_queue.validate
git diff --check
```

Frontend milestones additionally run Relay generation, focused Vitest suites,
TypeScript typecheck, and a production build. Program closeout runs `mix ci`.


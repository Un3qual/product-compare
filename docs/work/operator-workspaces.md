# Operator Workspaces

## Snapshot

- Status: ready
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-12-operator-workspaces-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
- Last verified: 2026-08-12 against affiliate setup, CJ lifecycle/feed, revenue
  summary/ledger, generated Relay operations, and focused route tests.

## Target Outcome

Affiliate setup is a guided workflow, CJ is a lifecycle ledger with independent
feed regions, and revenue is a dense control/metric/attribution workspace with
independent failure recovery and generated type ownership.

## Owned Paths

- Affiliate setup, CJ programs, and commerce revenue route capabilities and
  focused tests named by the plan.
- Production operations Playwright spec and snapshots.
- This lane document.

## Internal Slices

1. Density/lifecycle/failure characterization.
2. Guided affiliate workflow.
3. CJ lifecycle and feed inspection.
4. Revenue controls, metrics, and attribution details.
5. Operator overvalidation and file-ownership audit.
6. Browser and full verification.

## Verification

Focused operator suites, deterministic browser/axe/visual checks at three
widths, `cd assets && pnpm run check`, backend full gates, queue validation, and
diff checks.

## Blocker Rule

Stop before editing backend operator contracts, router/head infrastructure,
shopper/account routes, or seeds. Preserve all independent pagination and
failure regions.

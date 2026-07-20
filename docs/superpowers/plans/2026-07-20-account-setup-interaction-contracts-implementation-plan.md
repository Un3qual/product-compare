# Account And Setup Interaction Contracts Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive affiliate merchant context and API-token lifecycle actions
from deterministic framework-free policy owners.

**Architecture:** Existing route-data modules remain the policy boundary.
React continues to own Relay, forms, refs, callbacks, markup, and styling while
consuming copy and action facts from pure functions.

**Tech Stack:** React 19, Relay 20, TypeScript, Vitest, Bun, StyleX.

## Global Constraints

- Preserve GraphQL operations, mutations, form submission, markup,
  accessibility, and normal-path copy.
- Preserve row-scoped API-token pending mutual exclusion.
- Pure data modules stay transitively free of React, Relay, router, StyleX,
  Radix, and generated-operation imports.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Affiliate Merchant Context

**Files:**

- Modify: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`

**Interfaces:** The data owner returns nullable selected-merchant copy for each
merchant-scoped form and current-merchant context from the canonical merchant
choice plus `getMerchantSummary` result.

- [ ] Add failing pure and route cases for all selected-merchant forms, current
  merchant context, and missing selection.
- [ ] Run both focused suites and confirm React still constructs the policy copy.
- [ ] Move exact copy construction into `affiliate-setup-data.ts`; keep
  selection state, form controls, and markup in React.
- [ ] Re-run focused tests, TypeScript, and the pure-module dependency scan.
- [ ] Commit with message `refactor: centralize affiliate merchant context`.

### Task 2: API-Token Lifecycle Actions

**Files:**

- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Modify: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`

**Interfaces:** The route-data owner returns rotate/revoke visibility, disabled
state, and exact pending copy from token lifecycle and row-scoped pending facts.

- [ ] Add failing pure and route cases for active, expired, revoked,
  rotate-pending, and revoke-pending rows.
- [ ] Run both focused suites and confirm at least one action rule remains in
  the React component.
- [ ] Move action visibility, mutual exclusion, and button copy into the pure
  policy owner while retaining forms, refs, and callbacks in React.
- [ ] Re-run focused tests, TypeScript, and the pure-module dependency scan.
- [ ] Commit with message `refactor: centralize api token action policy`.

### Task 3: Batch Gate

**Files:**

- Modify: `docs/work/frontend-account-setup-presentation-contracts.md`

- [ ] Record both slice RED/GREEN results in the lane doc.
- [ ] Run both focused cohorts, `cd assets && bun run check`, dependency scans,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.

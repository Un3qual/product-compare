# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary unless a complete `Ready Floor Exception` records why the
  repository currently supports fewer coherent outcomes.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- A queue row is one independently shippable and reviewable outcome. Per-file,
  per-route, path-disjoint, or test-sized implementation steps belong under
  internal slices in the linked plan and lane doc.
- Group candidates that enforce the same invariant and share one acceptance
  boundary. Parallel safety alone does not justify separate queue rows.
- Numeric batch requests and the ready-row floor never justify micro-batches or
  filler. Return fewer coherent batches and record the missing decision when
  the repository does not support the requested count.
- Before a claim would leave fewer than three other ready rows, the coordinator
  validates and promotes more work or commits a complete ready floor exception
  in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue satisfies the floor or its explicit exception.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row when three other ready
  rows will remain or the ready floor exception covers the smaller truthful set.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

### 1. Production UI System Spine And Home

Status: active
Owner: Codex subagent-driven implementation in the current managed worktree
Lane: Production UI system and home
Plan: `docs/superpowers/plans/2026-08-10-production-ui-system-home-implementation-plan.md`
Batch outcome: ProductCompare gains one stable production visual system and a
useful, SSR-safe homepage with ranked search, category entry, a bounded product
ledger, URL-backed comparison continuity, and truthful fault-isolated new,
trending, and owner-private relevant deals.
Next action: Execute Task 1's RED domain boundary tests, then implement the
set-based homepage workspace and deal reads without weakening the approved
eligibility, privacy, or query-budget contract.
Owned paths:

- Shared frontend package, router, root navigation, layout, feedback,
  primitive, theme, font, brand, comparison-continuity, and product-ledger
  paths named by the plan.
- New `assets/src/routes/home/**`, focused home/root/UI tests, generated Home
  Relay artifacts, and home Playwright snapshots.
- Focused Catalog, SEO, Specs, Pricing, Alerts, Commerce Attribution, GraphQL home
  schema/resolver, and tests named by the plan.
- `docs/work/production-ui-system-home.md`.

Internal slices:

- Set-based home workspace, offer, activity, watch, and saved-comparison reads.
- Typed GraphQL workspace/deal operations with privacy and fixed query budgets.
- Visual tokens, local fonts, responsive navigation/layouts, controls, and
  reduced-motion behavior.
- Useful index workbench with essential workspace and optional deals.
- Browser, accessibility, responsive, visual, bundle, and production gates.

Prerequisites:

- The production UI design and complete route functionality matrix are
  approved.
- The current root loader, domain owners, GraphQL schema, frontend stack, and
  route tests match the plan's verified baseline.
- The four later cohort plans remain dependent on this shared spine and are not
  active or ready.

Verification:

- Focused backend boundary and GraphQL semantic/privacy/query-budget suites
  named by the plan.
- Focused frontend home/root/router/UI suites and deterministic Playwright,
  axe, reduced-motion, visual, and no-overflow checks at three widths.
- `cd assets && pnpm run check`.
- `mix typecheck`, `mix quality`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.

Exit condition: Every system/home feature-parity row and production gate passes,
the shared owners are stable, the lane records observed evidence, and the
coordinator closes this row while promoting the four path-disjoint successor
cohorts together.

## Ready Work

None.

## Ready Floor Exception

Reason: The only independently shippable outcome is active. Discover & Evaluate,
Compare & Return, Account & Setup, and Operations all require the stable shared
system spine before their otherwise path-disjoint plans become executable, so
no other coherent outcome is currently ready.
Rejected split: Backend home reads, GraphQL fields, fonts, tokens, shell,
homepage regions, responsive states, and test gates all enforce the same
system/home acceptance boundary and are internal slices, not reserve rows.
Replenishment action: Complete and verify the System Spine And Home row, audit
the now-stable shared owners, then promote all four approved successor cohort
plans together at the same coordinator boundary.

## Needs Decision Work

None.

## Blocked Work

None.

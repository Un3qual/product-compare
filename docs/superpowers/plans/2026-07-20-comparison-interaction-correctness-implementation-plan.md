# Comparison Interaction Correctness Implementation Plan

**Status:** complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep comparison observation facts temporally truthful and snapshot
revocation state isolated to the affected row.

**Architecture:** Existing strict GraphQL DateTime helpers own validation and
chronological comparison. Snapshot mutation state is keyed by snapshot ID in
React; framework-free data helpers continue owning outcome copy and duplicate
guards.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, Vitest, Bun.

## Global Constraints

- Preserve valid observation labels, ordering, and semantic time values.
- Invalid timestamps never normalize into another date or win recency
  selection.
- Preserve successful snapshot mutation handling, accessibility, markup, and
  independent-row usability.
- Use behavior tests and verify RED before production changes.

---

### Task 1: Strict Comparison Observation Truth

**Files:**

- Modify: `assets/src/routes/compare/decision-summary-data.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Modify: `assets/test/routes/compare/decision-summary-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`

**Interfaces:** Use `graphQLDateTimeLabel` for display and
`parseGraphQLDateTime` for chronological comparison. Invalid values retain only
the existing exact-source fallback and are excluded from most-recent selection.

- [ ] Add failing cases for impossible dates, missing offsets, malformed values,
  mixed valid/invalid observations, and two valid explicit offsets.
- [ ] Run the focused data and route tests and confirm permissive parsing can
  produce a false label or winner.
- [ ] Replace permissive date construction with the strict helpers without
  changing valid copy or selected-product order.
- [ ] Re-run focused tests and TypeScript.
- [ ] Commit with message `fix: enforce comparison timestamp truth`.

### Task 2: Row-Scoped Snapshot Revocation

**Files:**

- Modify: `assets/src/routes/compare/share-comparison-data.ts`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Modify: `assets/test/routes/compare/share-comparison-data.test.ts`
- Modify: `assets/test/routes/compare/compare.route.test.tsx`

**Interfaces:** Snapshot revocation tracks in-flight snapshot IDs rather than a
global pending boolean. `Revoking…`, disabled state, duplicate suppression, and
failure copy apply only to the matching row.

- [ ] Add a failing two-row case that revokes one snapshot and proves the other
  remains enabled and unchanged through success and failure paths.
- [ ] Run the focused data and route tests and confirm current global pending
  state affects both rows.
- [ ] Implement ID-keyed in-flight/error state and clear the key in every
  completion path.
- [ ] Re-run focused tests, TypeScript, and accessibility assertions.
- [ ] Commit with message `fix: scope snapshot revocation by row`.

### Task 3: Batch Gate

**Files:**

- Modify: `docs/work/comparison-interaction-correctness.md`

- [ ] Record both comparison slice results in the new lane doc and preserve the
  coordinator's grouping references to the historical frontend evidence.
- [ ] Run all focused comparison suites followed by
  `cd assets && bun run check`, `mix work_queue.validate`, and
  `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.

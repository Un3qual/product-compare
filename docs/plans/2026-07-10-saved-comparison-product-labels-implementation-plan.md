# Saved Comparison Product Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:test-driven-development` and either
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task.

**Status:** ready

**Goal:** Show saved comparison product names in stored order instead of raw
slugs while preserving reopen order and pagination behavior.

**Architecture:** Extend the existing saved-comparison Relay query with the
already-public product `name`, retain ordered `{name, slug}` summaries in the
route loader, render names on cards, and continue deriving repeated reopen
parameters from slugs.

**Tech Stack:** React, TypeScript, Relay, GraphQL, Vitest, Bun.

## Global Constraints

- Keep the current GraphQL schema and backend resolvers unchanged.
- Preserve item `position` ordering and repeated reopen `slug` parameter order.
- Preserve authentication, filtering, sorting, pagination, and delete behavior.
- Regenerate Relay artifacts from the checked-in query source.

## Owned Paths

- `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`
- `assets/src/routes/compare/saved-data.ts`
- `assets/src/routes/compare/saved.tsx`
- `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-saved-comparisons-ui.md`

## Interfaces

- `SavedComparisonSetSummary` stores ordered products with `name` and `slug`.
- Card copy renders ordered product names.
- `buildSavedComparisonHref` continues to append ordered slugs to `/compare`.

## Batches

- [ ] **1. Add RED saved-card coverage.** Prove cards render product names in
  stored position order, do not expose raw slugs as display copy, and retain the
  same repeated-slug reopen href.
- [ ] **2. Extend route data.** Select `product { name slug }`, validate both
  strings in the summarizer, and retain ordered product objects.
- [ ] **3. Render labels and regenerate Relay output.** Render names from the
  ordered summary and build reopen links from its slugs; run Relay generation.
- [ ] **4. Verify and record the lane.** Run generation, the focused saved
  comparison cases, TypeScript, and diff checks; append RED/GREEN evidence.
- [ ] **5. Commit the milestone.** Commit source, generated artifact, tests, and
  lane evidence with `feat: label saved comparison products`.

## Verification

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "saved comparison.*product|stored position order"`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

Saved comparison cards display ordered product names and reopen the exact stored
slug order with all existing route behavior intact.

## Blocker And Fallback

If the local schema snapshot does not expose `Product.name`, refresh it from the
current checked-in backend schema and rerun Relay generation. Do not add a
route-local fetch or derive display names from slugs.

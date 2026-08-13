# Route Configuration Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the ambiguous top-level `assets/src/routing` directory by relocating its four route-configuration files to `assets/src/routes/config` without changing runtime behavior.

**Architecture:** `assets/src/router.tsx` remains the router composition root. The three route tables and their lazy-import recovery helper move together into `assets/src/routes/config`, adjacent to but distinct from the page and feature implementations they load.

**Tech Stack:** TypeScript, React, React Router, Vite, Vitest, Playwright, pnpm.

## Global Constraints

- Preserve every URL, route identifier, loader, metadata value, error boundary, redirect, and lazy-import recovery behavior.
- Make no component, data-flow, or presentation changes.
- Do not inline the route tables into `router.tsx` or scatter configuration files among feature directories.
- Remove `assets/src/routing` after all four files have moved.

---

### Task 1: Relocate the route configuration boundary

**Files:**

- Move: `assets/src/routing/account-routes.tsx` to `assets/src/routes/config/account-routes.tsx`
- Move: `assets/src/routing/operator-routes.tsx` to `assets/src/routes/config/operator-routes.tsx`
- Move: `assets/src/routing/shopper-routes.tsx` to `assets/src/routes/config/shopper-routes.tsx`
- Move: `assets/src/routing/lazy-route.tsx` to `assets/src/routes/config/lazy-route.tsx`
- Modify: `assets/src/router.tsx:6-8`

**Interfaces:**

- Consumes: React Router's `RouteObject`, route metadata, route page modules, and the existing `withLazyRouteImportRecovery` helper.
- Produces: unchanged `accountRoutes`, `operatorRoutes`, `shopperRoutes`, and `withLazyRouteImportRecovery` exports from their new paths.

- [ ] **Step 1: Establish the behavior-preserving baseline**

Run:

```bash
cd assets
pnpm run typecheck
pnpm run test:unit
```

Expected: TypeScript succeeds and all unit tests pass before the move. This is a pure relocation, so existing compiler and test coverage is the characterization boundary; no new behavioral test is warranted.

- [ ] **Step 2: Move the four files and repair only path-relative imports**

Use patch-based file moves so Git records the relocations. Apply these import transformations:

```text
assets/src/router.tsx
  ./routing/account-routes  -> ./routes/config/account-routes
  ./routing/operator-routes -> ./routes/config/operator-routes
  ./routing/shopper-routes  -> ./routes/config/shopper-routes

assets/src/routes/config/*-routes.tsx
  ../frontend/head                 -> ../../frontend/head
  ../routes/compare/...            -> ../compare/...
  ../routes/<feature>/...          -> ../<feature>/...
  ./lazy-route                     -> ./lazy-route
```

Do not change route objects, strings, exports, or executable statements.

- [ ] **Step 3: Prove the old boundary is gone**

Run:

```bash
test ! -d assets/src/routing
rg -n 'src/routing|/routing/' assets/src assets/tests
```

Expected: the directory test succeeds and `rg` returns no matches.

- [ ] **Step 4: Verify compilation, formatting, tests, and production builds**

Run:

```bash
cd assets
pnpm run check
PLAYWRIGHT_PORT=4192 pnpm exec playwright test tests/e2e/smoke.spec.ts
cd ..
git diff --check
```

Expected: the complete frontend gate and smoke browser spec pass, and Git reports no whitespace errors.

- [ ] **Step 5: Commit the structural refactor**

```bash
git add assets/src/router.tsx assets/src/routes/config assets/src/routing
git commit -m "refactor: colocate route configuration"
```

# Frontend Logout Route Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing browser logout route so the delivered frontend auth baseline matches the existing GraphQL logout contract.

**Architecture:** Keep Phoenix as the cookie-backed session authority and commit the existing `logout` mutation through Relay. The frontend route renders a small confirmation form, handles typed/top-level/transport errors through the existing auth error helpers, and redirects to sign-in after Phoenix clears the session cookie.

**Tech Stack:** React Router, React Relay, TypeScript, Vitest, Testing Library, Phoenix Absinthe GraphQL.

---

## Existing Contract

- `ARCHITECTURE.md` says browser auth routes include logout.
- Backend GraphQL already exposes `logout: LogoutPayload!`, and `test/product_compare_web/graphql/session_auth_test.exs` covers session deletion.
- Frontend auth routes already commit `login`, `register`, `forgotPassword`, `resetPassword`, and `verifyEmail` through Relay mutation artifacts.
- `assets/src/router.tsx` currently registers no `/auth/logout` route, and `assets/src/routes/auth/mutations/LogoutMutation.ts` does not exist.

## File Structure

- Modify `assets/src/routes/auth/__tests__/session.route.test.tsx` for RED route-level logout coverage.
- Modify `assets/src/routes/__tests__/root.route.test.tsx` for the navigation link.
- Modify `assets/src/__tests__/router.test.tsx` for route registration.
- Create `assets/src/routes/auth/mutations/LogoutMutation.ts`.
- Create `assets/src/routes/auth/logout.tsx`.
- Modify generated `assets/src/__generated__/LogoutMutation.graphql.ts`.
- Modify `assets/src/router.tsx`.
- Modify `assets/src/routes/root.tsx`.
- Update `docs/work/frontend-logout-route-baseline.md`, `docs/work/graphql-auth-migration.md`, this implementation plan, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the closing milestone.

---

### Task 1: Add The Relay Logout Route

**Files:**
- Modify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `assets/src/__tests__/router.test.tsx`
- Create: `assets/src/routes/auth/mutations/LogoutMutation.ts`
- Create: `assets/src/routes/auth/logout.tsx`
- Modify generated: `assets/src/__generated__/LogoutMutation.graphql.ts`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify after verification: `docs/work/frontend-logout-route-baseline.md`
- Modify after verification: `docs/work/graphql-auth-migration.md`
- Modify after verification: `docs/plans/2026-06-01-frontend-logout-route-baseline-implementation-plan.md`

- [x] **Step 1: Write failing route, navigation, and router tests**

Add logout coverage that expects `/auth/logout` to render a confirmation button, commit the Relay mutation without variables, and redirect to `/auth/login` after an `ok: true` payload.

Also cover generic error handling for failed logout payloads, root navigation exposing a `Sign out` link to `/auth/logout`, and router registration for `LogoutRoute`.

- [x] **Step 2: Run the focused frontend tests to verify RED**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
```

Expected: FAIL because `LogoutRoute`, `LogoutMutation`, the route registration, and the navigation link are absent.

Observed 2026-06-01: after restoring `assets/node_modules` with `bun install`, FAIL because `LogoutRoute` was missing and the root navigation tests could not find the `Sign out` link.

- [x] **Step 3: Add logout mutation source and route implementation**

Create `LogoutMutation.ts`:

```tsx
import { graphql } from "react-relay";

export const logoutMutation = graphql`
  mutation LogoutMutation {
    logout {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;
```

Create `LogoutRoute` using the existing auth helpers:

```tsx
const result = resolveActionMutationResult(response?.logout, graphQLErrors);

if (isSuccessfulActionResult(result)) {
  navigate("/auth/login");
  return;
}
```

Render a confirmation form with a `Sign out` submit button and footer links back to browse and sign-in.

- [x] **Step 4: Register the route and navigation link**

Add `auth/logout` to `assets/src/router.tsx` and expose a `Sign out` link in the root primary navigation and home actions.

- [x] **Step 5: Generate Relay artifacts and verify GREEN**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

Observed 2026-06-01: PASS. `bun run relay` completed, `bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` passed 18 tests, and `bun run typecheck` completed with `tsc --noEmit`.

- [x] **Step 6: Update lane docs**

Record RED/GREEN evidence in the work doc and this plan. If no follow-up remains, advance to Task 2.

---

### Task 2: Run Auth-Slice Verification And Close The Lane

**Files:**
- Modify: `docs/work/frontend-logout-route-baseline.md`
- Modify: `docs/work/graphql-auth-migration.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/plans/2026-06-01-frontend-logout-route-baseline-implementation-plan.md`

- [x] **Step 1: Run focused auth/frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
mix test test/product_compare_web/graphql/session_auth_test.exs
```

Expected: PASS.

Observed 2026-06-01: PASS. `bun run relay` completed, `bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` passed 32 tests, `bun run typecheck` completed with `tsc --noEmit`, and `mix test test/product_compare_web/graphql/session_auth_test.exs` passed 22 tests.

- [x] **Step 2: Run broader frontend and diff checks**

Run:

```bash
cd assets && bun run check
git diff --check
```

Expected: PASS.

Observed 2026-06-01: PASS. `bun run check` passed 34 test files and 298 tests after typecheck, and `git diff --check` passed.

- [x] **Step 3: Close the queue**

Mark this lane completed, update auth migration steady-state wording to include the frontend logout route, move this plan to recently completed in `docs/plans/INDEX.md`, return `docs/plans/NOW.md` to no current unblocked batch, and keep product ingestion blocked until provider evidence is available.

Observed 2026-06-01: closed the lane and returned the active queue to blocked product ingestion only.

# Frontend Auth State Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the browser shell reflect the current GraphQL `viewer` session state and harden logout/auth coverage before the logout branch opens a PR.

**Architecture:** Add a root Relay route query for `viewer`, preload it through the existing request-scoped route-loader Relay environment, and render guest versus authenticated auth links from that data. Keep Phoenix as the cookie-backed session authority; login/register/logout mutations update Relay's root `viewer` field after successful payloads so the shell does not show stale auth links. Finish by tightening browser e2e and backend session-auth contract coverage for logout and trusted-origin behavior.

**Tech Stack:** React Router, React Relay, TypeScript, Vitest, Testing Library, Playwright, Phoenix Absinthe GraphQL, ExUnit.

---

## Existing Contract

- `ARCHITECTURE.md` says browser auth flows use GraphQL over `/api/graphql`, and Phoenix remains the session-cookie authority.
- `docs/work/graphql-auth-migration.md` records GraphQL auth as completed, including `viewer`, `register`, `login`, `logout`, `forgotPassword`, `resetPassword`, and `verifyEmail`.
- The current branch added `/auth/logout`, but `assets/src/routes/root.tsx` still renders `Sign in`, `Sign out`, and `Create account` at the same time.
- Backend GraphQL already exposes `viewer`, and `test/product_compare_web/graphql/session_auth_test.exs` verifies session-backed viewer lookup and logout session deletion.
- `assets/tests/e2e/auth.spec.ts` covers browser auth flows but does not cover logout, and its operation-name mocks still use pre-Relay names like `Login` instead of generated names like `LoginMutation`.

## File Structure

- Create `assets/src/routes/root/queries/RootViewerRouteQuery.ts` for the root `viewer` Relay query.
- Create `assets/src/routes/root/loader.ts` for a conservative root loader that preloads `viewer` and falls back to guest state if the viewer fetch fails.
- Modify generated `assets/src/__generated__/RootViewerRouteQuery.graphql.ts` after `bun run relay`.
- Modify `assets/src/router.tsx` to register `id: "root"` and `loader: rootLoader` on the root route.
- Modify `assets/src/routes/root.tsx` to render auth links from viewer state and pass root viewer context to the home route.
- Create `assets/src/routes/auth/viewer-store.ts` for small `commitLocalUpdate` helpers that set or clear Relay root `viewer`.
- Modify `assets/src/routes/auth/login.tsx`, `assets/src/routes/auth/register.tsx`, and `assets/src/routes/auth/logout.tsx` to update the root `viewer` field only after graphQLError-aware successful auth mutation results.
- Modify `assets/src/routes/__tests__/root.route.test.tsx`, `assets/src/__tests__/router.test.tsx`, and `assets/src/routes/auth/__tests__/session.route.test.tsx` for focused frontend RED/GREEN coverage.
- Modify `assets/tests/e2e/auth.spec.ts` for Relay operation-name mocks, root viewer query mocks, and logout browser coverage.
- Modify `test/product_compare_web/graphql/session_auth_test.exs` for backend logout idempotency and trusted-origin contract coverage.
- Update `docs/work/frontend-auth-state-hardening.md`, `docs/work/graphql-auth-migration.md`, this plan, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the closing milestone.

---

### Task 1: Add Viewer-Aware Root Route Data And Auth Links

**Files:**
- Create: `assets/src/routes/root/queries/RootViewerRouteQuery.ts`
- Create: `assets/src/routes/root/loader.ts`
- Modify generated: `assets/src/__generated__/RootViewerRouteQuery.graphql.ts`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `assets/src/__tests__/router.test.tsx`
- Modify after verification: `docs/work/frontend-auth-state-hardening.md`
- Modify after verification: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`

- [x] **Step 1: Write failing root route tests**

Update `assets/src/routes/__tests__/root.route.test.tsx` so it covers both guest and authenticated root rendering. Use a React Router data router for integration tests, because the root route will have loader data.

Add tests with these expectations:

```tsx
expect(within(primaryNavigation).getByRole("link", { name: "Sign in" })).toHaveAttribute(
  "href",
  "/auth/login"
);
expect(within(primaryNavigation).getByRole("link", { name: "Create account" })).toHaveAttribute(
  "href",
  "/auth/register"
);
expect(within(primaryNavigation).queryByRole("link", { name: "Sign out" })).not.toBeInTheDocument();
```

For an authenticated viewer fixture `{ id: "viewer-1", email: "person@example.com" }`, expect:

```tsx
expect(within(primaryNavigation).getByRole("link", { name: "Sign out" })).toHaveAttribute(
  "href",
  "/auth/logout"
);
expect(within(primaryNavigation).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
expect(within(primaryNavigation).queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
```

Repeat the same guest/authenticated assertions for the `Home actions` group on the index route.

- [x] **Step 2: Write failing router registration test**

Update `assets/src/__tests__/router.test.tsx` to assert that the root route has the stable root id and loader:

```tsx
import { rootLoader, ROOT_ROUTE_ID } from "../routes/root/loader";

test("root route preloads viewer state", () => {
  expect(routes[0]).toEqual(
    expect.objectContaining({
      id: ROOT_ROUTE_ID,
      loader: rootLoader
    })
  );
});
```

- [x] **Step 3: Run focused tests to verify RED**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
```

Expected: FAIL because `rootLoader`, `ROOT_ROUTE_ID`, `RootViewerRouteQuery`, and viewer-aware link rendering do not exist yet.

- [x] **Step 4: Add the root viewer query**

Create `assets/src/routes/root/queries/RootViewerRouteQuery.ts`:

```tsx
import { graphql } from "react-relay";

export const rootViewerRouteQuery = graphql`
  query RootViewerRouteQuery {
    viewer {
      id
      email
    }
  }
`;
```

- [x] **Step 5: Add the root loader**

Create `assets/src/routes/root/loader.ts` with a conservative guest fallback. The root shell must not make public routes unusable if the viewer query fails.

```tsx
import type { LoaderFunctionArgs } from "react-router-dom";
import type { RootViewerRouteQuery } from "../../__generated__/RootViewerRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { rootViewerRouteQuery } from "./queries/RootViewerRouteQuery";

export const ROOT_ROUTE_ID = "root";

export type RootViewer = {
  id: string;
  email: string;
};

export type RootViewerQueryDescriptor = RelayRouteQueryDescriptor<
  RootViewerRouteQuery["variables"]
>;

export type RootLoaderData =
  | {
      status: "ready";
      viewer: RootViewer | null;
      viewerQuery: RootViewerQueryDescriptor;
    }
  | {
      status: "guest";
      viewer: null;
      viewerQuery: null;
    };

export async function rootLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<RootLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetchedViewer = await fetchRouteQuery<RootViewerRouteQuery>(
      environment,
      rootViewerRouteQuery,
      {},
      { signal: request.signal }
    );

    return {
      status: "ready",
      viewer: normalizeViewer(fetchedViewer.data.viewer),
      viewerQuery: fetchedViewer.descriptor
    };
  } catch {
    return {
      status: "guest",
      viewer: null,
      viewerQuery: null
    };
  }
}

function normalizeViewer(viewer: unknown): RootViewer | null {
  if (!viewer || typeof viewer !== "object") {
    return null;
  }

  const candidate = viewer as { email?: unknown; id?: unknown };

  if (typeof candidate.id !== "string" || typeof candidate.email !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email
  };
}
```

- [x] **Step 6: Register the root loader**

Modify `assets/src/router.tsx`:

```tsx
import { rootLoader, ROOT_ROUTE_ID } from "./routes/root/loader";
```

Add `id` and `loader` on the root route object:

```tsx
{
  path: "/",
  id: ROOT_ROUTE_ID,
  loader: rootLoader,
  element: <RootLayout />,
  children: [
    // existing children stay unchanged
  ]
}
```

- [x] **Step 7: Render auth links from viewer state**

Modify `assets/src/routes/root.tsx` so `RootLayout` reads `RootLoaderData`, resolves `viewer`, renders auth links from that value, and passes `{ viewer }` through outlet context for the home route.

Keep the public route behavior simple:

```tsx
function AuthLinks({ viewer }: { viewer: RootViewer | null }) {
  if (viewer) {
    return (
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/logout">Sign out</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/login">Sign in</Link>
      </Button>
      <Button asChild {...stylex.props(styles.link)}>
        <Link to="/auth/register">Create account</Link>
      </Button>
    </>
  );
}
```

Use the same `AuthLinks` component in primary navigation and home actions so the two surfaces cannot drift.

- [x] **Step 8: Generate Relay artifacts and verify GREEN**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
```

Expected: PASS. `bun run relay` creates `assets/src/__generated__/RootViewerRouteQuery.graphql.ts`.

- [x] **Step 9: Update lane docs**

Record RED/GREEN evidence in `docs/work/frontend-auth-state-hardening.md` and check off Task 1 steps in this plan.

---

### Task 2: Keep Relay Viewer State Fresh After Auth Mutations

**Files:**
- Create: `assets/src/routes/auth/viewer-store.ts`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/logout.tsx`
- Modify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Modify after verification: `docs/work/frontend-auth-state-hardening.md`
- Modify after verification: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`

- [x] **Step 1: Write failing success-gated viewer-store tests**

Extend `assets/src/routes/auth/__tests__/session.route.test.tsx` so login/register/logout tests assert root `viewer` changes happen only after graphQLError-aware success resolution.

Final coverage asserts:

- login/register mutation options do not include unconditional Relay `updater` callbacks.
- successful login/register responses call a local Relay update that sets root `viewer`.
- failed login/register payloads and top-level GraphQL errors do not call the local Relay update.
- successful logout responses call a local Relay update that clears root `viewer`.
- failed logout payloads, `ok: true` with typed errors, missing `ok`, and top-level GraphQL errors do not call the local Relay update.

- [x] **Step 2: Run focused tests to verify RED**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx
```

Expected initial RED: FAIL before Task 2 because auth mutations did not update root `viewer` at all.

Expected re-review RED: FAIL while auth mutations still used unconditional Relay `updater` callbacks, because store writes could run before graphQLError-aware result handling.

- [x] **Step 3: Add local viewer store helpers**

Create `assets/src/routes/auth/viewer-store.ts` with helpers that use `commitLocalUpdate` against the current Relay environment:

```tsx
import {
  commitLocalUpdate,
  type Environment,
  type RecordSourceProxy
} from "relay-runtime";

type RootViewer = {
  id: string;
  email: string;
};

export function setRootViewer(environment: Environment, viewer: RootViewer) {
  commitLocalUpdate(environment, (store) => {
    const viewerRecord = store.get(viewer.id) ?? store.create(viewer.id, "User");

    viewerRecord.setValue(viewer.id, "id");
    viewerRecord.setValue(viewer.email, "email");
    store.getRoot().setLinkedRecord(viewerRecord, "viewer");
  });
}

export function clearRootViewer(environment: Environment) {
  commitLocalUpdate(environment, (store: RecordSourceProxy) => {
    store.getRoot().setValue(null, "viewer");
  });
}
```

- [x] **Step 4: Add success-gated viewer writes to login/register/logout**

In `assets/src/routes/auth/login.tsx`, call `useRelayEnvironment()` and update root `viewer` only after `resolveSessionMutationResult` returns a viewer:

```tsx
if (result.viewer) {
  setRootViewer(relayEnvironment, result.viewer);
  navigate("/");
  return;
}
```

In `assets/src/routes/auth/register.tsx`, use the same success-gated pattern:

```tsx
if (result.viewer) {
  setRootViewer(relayEnvironment, result.viewer);
  navigate("/");
  return;
}
```

In `assets/src/routes/auth/logout.tsx`, call `useRelayEnvironment()` and clear root `viewer` only after `resolveActionMutationResult` plus `isSuccessfulActionResult` succeeds:

```tsx
if (isSuccessfulActionResult(result)) {
  clearRootViewer(relayEnvironment);
  navigate("/auth/login");
  return;
}
```

Do not use unconditional mutation `updater` options for these auth shell state changes; top-level GraphQL errors must be handled before mutating root `viewer`. Do not change navigation behavior or payload error handling in this task.

- [x] **Step 5: Verify GREEN**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx
cd assets && bun run typecheck
```

Expected: PASS. Final Task 2 verification includes standalone session-route coverage and paired session/root coverage; after the final spec re-review coverage addition, the session route suite has 15 tests and the paired session/root command has 21 tests.

- [x] **Step 6: Update lane docs**

Record RED/GREEN evidence in `docs/work/frontend-auth-state-hardening.md` and check off Task 2 steps in this plan.

---

### Task 3: Harden Browser And Backend Auth Coverage

**Files:**
- Modify: `assets/tests/e2e/auth.spec.ts`
- Modify: `test/product_compare_web/graphql/session_auth_test.exs`
- Modify after verification: `docs/work/frontend-auth-state-hardening.md`
- Modify after verification: `docs/work/graphql-auth-migration.md`
- Modify after verification: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`

- [x] **Step 1: Write failing Playwright logout coverage**

Update `assets/tests/e2e/auth.spec.ts` so GraphQL mocks use current Relay operation names:

```tsx
LoginMutation
RegisterMutation
ForgotPasswordMutation
ResetPasswordMutation
VerifyEmailMutation
LogoutMutation
RootViewerRouteQuery
```

Add a default helper response for `RootViewerRouteQuery`:

```tsx
function rootViewerResponse(viewer: { id: string; email: string } | null = null) {
  return {
    data: {
      viewer
    }
  };
}
```

Add a logout browser test:

```tsx
test("logout clears the browser session through GraphQL and returns to sign in", async ({ page }) => {
  const requests = await mockGraphQL(page, {
    RootViewerRouteQuery: rootViewerResponse({ id: "viewer-1", email: "person@example.com" }),
    LogoutMutation: {
      data: {
        logout: {
          ok: true,
          errors: []
        }
      }
    }
  });

  await page.goto("/auth/logout");
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/auth/login");
  expect(requests).toContainEqual({
    operationName: "LogoutMutation",
    variables: {}
  });
});
```

- [x] **Step 2: Write failing backend session-auth coverage**

Add an unauthenticated logout idempotency test to `test/product_compare_web/graphql/session_auth_test.exs`:

```elixir
test "logout without an active session is idempotent", %{conn: conn} do
  conn =
    conn
    |> put_req_header_same_origin()
    |> graphql_request(logout_mutation())

  assert %{
           "data" => %{
             "logout" => %{
               "ok" => true,
               "errors" => []
             }
           }
         } = json_response(conn, 200)

  assert conn.private[:plug_session_info] == :drop
end
```

Expand the existing untrusted-origin test so it covers `register`, `login`, and `logout`. For `logout`, start from a logged-in conn, set origin to `https://evil.example.com`, call `logout_mutation()`, and assert:

```elixir
assert %{
         "data" => %{
           "logout" => %{
             "ok" => false,
             "errors" => [
               %{
                 "code" => "INVALID_ORIGIN",
                 "message" => "cross-origin request rejected",
                 "field" => nil
               }
             ]
           }
         }
       } = json_response(conn, 200)

refute conn.private[:plug_session_info] == :drop
```

- [x] **Step 3: Run focused tests to verify RED**

Run:

```bash
cd assets && bun x playwright test tests/e2e/auth.spec.ts
mix test test/product_compare_web/graphql/session_auth_test.exs
```

Expected: Playwright FAILS before e2e operation-name/logout updates are complete. Backend may PASS if the existing resolver already satisfies the new contract; if it passes immediately, record that the RED check found coverage-only backend behavior.

- [x] **Step 4: Implement e2e mock and backend test updates**

Update `assets/tests/e2e/auth.spec.ts` operation response keys from old operation names to Relay names, include `RootViewerRouteQuery` responses for pages that load the root route, and add the logout browser test.

Update `test/product_compare_web/graphql/session_auth_test.exs` with the logout idempotency test and expanded untrusted-origin assertions.

- [x] **Step 5: Verify GREEN**

Run:

```bash
cd assets && bun x playwright test tests/e2e/auth.spec.ts
mix test test/product_compare_web/graphql/session_auth_test.exs
cd assets && bun run typecheck
```

Expected: PASS.

2026-06-01 GREEN:

- The first GREEN attempt exposed a Task 2 runtime bug: the new logout browser coverage sent `RootViewerRouteQuery` and `LogoutMutation`, then the root viewer clear path raised `RelayRecordProxy#setLinkedRecord(): Expected a record, got null`.
- Task 2 follow-up fixed `clearRootViewer` to clear the root `viewer` field with Relay's supported null scalar write path.
- Code-quality follow-up tightened logout browser coverage to assert the root shell renders guest auth links after redirect and tightened backend untrusted-origin logout coverage to prove the original viewer still resolves.
- `cd assets && bun x playwright test tests/e2e/auth.spec.ts` exited 0 with escalation after sandbox port binding was blocked: 9 tests passed.
- `mix test test/product_compare_web/graphql/session_auth_test.exs` exited 0: 23 tests, 0 failures.
- `cd assets && bun run typecheck` exited 0 with `tsc --noEmit`.

- [x] **Step 6: Update lane docs**

Record Playwright and backend contract evidence in `docs/work/frontend-auth-state-hardening.md`, `docs/work/graphql-auth-migration.md`, and this plan.

---

### Task 4: Run Final Auth-State Verification And Close The Batch

**Files:**
- Modify: `docs/work/frontend-auth-state-hardening.md`
- Modify: `docs/work/graphql-auth-migration.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`

- [x] **Step 1: Run final focused verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx
cd assets && bun x playwright test tests/e2e/auth.spec.ts
mix test test/product_compare_web/graphql/session_auth_test.exs
cd assets && bun run typecheck
```

Expected: PASS.

2026-06-01 verification:

- `cd assets && bun run relay` exited 0 and left Relay artifacts current.
- `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` exited 0: 4 files passed, 41 tests passed.
- `cd assets && bun x playwright test tests/e2e/auth.spec.ts` exited 0 with escalation after sandbox port binding was blocked: 9 tests passed.
- `mix test test/product_compare_web/graphql/session_auth_test.exs` exited 0: 23 tests, 0 failures.
- `cd assets && bun run typecheck` exited 0 with `tsc --noEmit`.

- [x] **Step 2: Run broader frontend and diff checks**

Run:

```bash
cd assets && bun run check
git diff --check
```

Expected: PASS.

2026-06-01 verification:

- `cd assets && bun run check` exited 0: 34 files passed, 307 tests passed.
- `git diff --check` exited 0.

- [x] **Step 3: Close or advance the queue**

If all verification passes, mark `docs/work/frontend-auth-state-hardening.md` completed, update `docs/work/graphql-auth-migration.md` with the new steady state, move this plan to Recently Completed in `docs/plans/INDEX.md`, and return `docs/plans/NOW.md` to no current unblocked batch unless another unblocked batch has been explicitly selected.

Keep product ingestion blocked until live CJ credential access, quota behavior, representative account-scoped sample payloads, and source onboarding compliance signoff are recorded.

---

## Self-Review

- Spec coverage: Task 1 covers viewer-aware root auth state, Task 2 covers graphQLError-aware success-gated Relay root `viewer` local updates after auth mutations, Task 3 covers Playwright logout and backend session-auth contract hardening, and Task 4 covers final verification and queue closure.
- Placeholder scan: no placeholder tasks remain; every task names exact files, commands, and expected outcomes.
- Type consistency: `RootViewer`, `RootLoaderData`, `RootViewerRouteQuery`, `ROOT_ROUTE_ID`, `setRootViewer`, and `clearRootViewer` are used consistently across the plan.

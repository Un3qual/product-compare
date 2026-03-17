# GraphQL Auth Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Goal:** Migrate frontend-facing browser auth from REST endpoints to GraphQL, starting in this PR with cookie-backed `login`, `register`, and `logout`.

**Architecture:** Keep Phoenix as the session authority and move browser auth writes onto `/api/graphql`. Add typed GraphQL auth mutations plus a small request-scoped session bridge that applies session mutations to the Phoenix `conn` before the GraphQL response is finalized. Remove the frontend-facing REST routes for `login`, `register`, and `logout` once the GraphQL replacements are verified.

**Tech Stack:** Elixir, Phoenix, Absinthe, Plug session cookies, ExUnit, Relay-oriented GraphQL schema design.

---

## Progress

- [x] Design approved.
- [x] Migration design doc written.
- [x] Future-agent guardrails added.
- [x] PR checkpoint: docs committed.
- [x] PR checkpoint: failing GraphQL auth tests committed.
- [x] PR checkpoint: GraphQL auth implementation committed.
- [x] PR verification complete.
- [x] Phase 2 checkpoint: backend reset/confirmation token primitives committed.
- [x] Phase 2 checkpoint: GraphQL `forgotPassword`, `resetPassword`, and `verifyEmail` committed.
- [x] Phase 2 checkpoint: `register` dispatches verification instructions when a delivery hook exists.
- [ ] Phase 2 checkpoint: auth token delivery transport committed.
- [ ] Phase 2 checkpoint: frontend auth recovery and verification flows committed.

### Task 1: Document the GraphQL-only auth contract

**Files:**
- Create: `AGENTS.md`
- Create: `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- Modify: `docs/plans/2026-03-05-frontend-fullstack-design.md`
- Modify: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`

**Step 1: Write the doc updates**

- Add a repo-level guardrail that browser auth must use GraphQL.
- Write a migration design doc with phased scope and future-agent instructions.
- Add a short correction note to the earlier frontend design and implementation docs so they no longer point browser auth toward REST.

**Step 2: Verify the docs are present**

Run: `sed -n '1,220p' AGENTS.md && sed -n '1,260p' docs/plans/2026-03-16-graphql-auth-migration-design.md`
Expected: New guardrail text and migration design render correctly.

**Step 3: Commit**

```bash
git add AGENTS.md docs/plans/2026-03-16-graphql-auth-migration-design.md docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md docs/plans/2026-03-05-frontend-fullstack-design.md docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md
git commit -m "docs(auth): document GraphQL auth migration"
```

### Task 2: Add failing GraphQL auth mutation tests

**Files:**
- Modify: `test/product_compare_web/graphql/session_auth_test.exs`
- Delete: `test/product_compare_web/controllers/auth_controller_test.exs`

**Step 1: Write the failing tests**

Add focused tests for:

- `register` creates a user, sets a session, and returns `viewer`.
- `login` sets a session and returns `viewer`.
- `login` with bad credentials returns typed payload errors and does not set a session.
- `logout` drops the session and returns `ok`.
- Untrusted origins cannot use `login`, `register`, or `logout`.

**Step 2: Run the targeted test file to verify failure**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: FAIL because the auth mutations do not exist yet.

**Step 3: Commit**

```bash
git add test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/controllers/auth_controller_test.exs
git commit -m "test(graphql): add session auth mutation coverage"
```

### Task 3: Add the GraphQL session mutation bridge

**Files:**
- Create: `lib/product_compare_web/graphql/session_mutation_bridge.ex`
- Create: `lib/product_compare_web/plugs/apply_graphql_session_mutations.ex`
- Modify: `lib/product_compare_web/plugs/put_absinthe_context.ex`
- Modify: `lib/product_compare_web/router.ex`

**Step 1: Write the minimal bridge**

- Add a request-process bridge that records session mutations during resolver execution.
- Support:
  - renew + set `:user_token`
  - drop session
- Ensure pending mutations are cleared before and after each GraphQL request.

**Step 2: Expose the needed request context**

- Put `:session_user_token` into Absinthe context.
- Put a boolean like `:trusted_request_origin?` into Absinthe context for auth mutation enforcement.

**Step 3: Apply the mutations at the GraphQL boundary**

- Register a `before_send` hook in the GraphQL pipeline.
- Apply pending bridge operations to the Phoenix `conn` so `Plug.Session` persists the cookie changes.

**Step 4: Run the targeted test file**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: Still FAIL, but only because the auth mutations and resolvers are not implemented yet.

### Task 4: Add GraphQL `login`, `register`, and `logout`

**Files:**
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/router.ex`

**Step 1: Add schema fields and payload types**

- Add `login`, `register`, and `logout` mutations.
- Add typed payload objects for auth session mutations.

**Step 2: Implement minimal resolver behavior**

- `login`: authenticate credentials, enqueue session renewal, return `viewer`.
- `register`: create the user, enqueue session renewal, return `viewer`.
- `logout`: revoke the current session token when present, enqueue session drop, return `ok: true`.
- Reject untrusted origins with typed `INVALID_ORIGIN` errors.

**Step 3: Remove the public REST routes for `login`, `register`, `logout`**

- Delete the obsolete session controller.
- Stop routing browser auth writes through `/api/auth/login`, `/api/auth/register`, and `/api/auth/logout`.
- Leave follow-up REST stubs only where Phase 2 has not yet migrated the flow.

**Step 4: Run the targeted GraphQL auth tests**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare_web/graphql/session_mutation_bridge.ex lib/product_compare_web/plugs/apply_graphql_session_mutations.ex lib/product_compare_web/plugs/put_absinthe_context.ex lib/product_compare_web/router.ex lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/auth_resolver.ex test/product_compare_web/graphql/session_auth_test.exs
git commit -m "feat(graphql): add cookie-backed auth mutations"
```

### Task 5: Run regression coverage for the PR slice

**Files:**
- Test: `test/product_compare_web/graphql/session_auth_test.exs`
- Test: `test/product_compare_web/graphql/api_token_auth_test.exs`
- Test: `test/product_compare/accounts/user_auth_schema_test.exs`

**Step 1: Run focused backend auth checks**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/user_auth_schema_test.exs`
Expected: PASS.

**Step 2: Run the full backend suite**

Run: `mix test`
Expected: PASS.

**Step 3: Run frontend unit verification**

Run: `cd assets && bun run test:unit`
Expected: PASS.

### Task 6: Follow-up migration backlog

**Files:**
- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare/accounts/user_auth.ex`
- Modify: `lib/product_compare_schemas/accounts/user.ex`
- Modify later: `lib/product_compare_web/schema.ex`
- Modify later: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify later: `assets/schema.graphql`
- Modify later: frontend auth route files under `assets/src/routes/auth`

**Progress:**

- [x] Add backend reset and confirmation token primitives on `users_tokens`.
- [x] Add GraphQL `forgotPassword`, `resetPassword`, and `verifyEmail` with typed `ok/errors` payloads.
- [x] Dispatch verification instructions from `register` when a delivery hook is configured.
- [x] Keep `/api/auth/forgot-password`, `/api/auth/reset-password`, and `/api/auth/verify-email` removed and covered by router tests.
- [ ] Wire reset and verification token delivery to a real mailer or notification transport.
- [ ] Add frontend Relay auth routes and end-to-end coverage for recovery and verification.

**Step 1: Add GraphQL `forgotPassword`, `resetPassword`, `verifyEmail`**

- Follow the same typed-payload pattern.
- Use `users_tokens` plus `confirmed_at` for reset and verification token consumption.
- Require trusted browser origins for these GraphQL browser-auth mutations.
- `resetPassword` drops the current session on success because password rotation invalidates all sessions.

**Step 2: Keep delivery transport-agnostic until a mailer exists**

- Add a small Accounts-layer delivery hook for reset and verification tokens.
- Tests can capture raw tokens through the hook.
- If no delivery transport is configured, GraphQL request mutations remain safe no-ops instead of exposing raw tokens.

**Step 3: Remove remaining browser auth REST surface**

- Already complete for `/api/auth/forgot-password`, `/api/auth/reset-password`, and `/api/auth/verify-email`.
- Keep router coverage so those routes stay gone.

**Step 4: Add end-to-end coverage**

- Verify the final GraphQL-only browser auth path from the Bun frontend.

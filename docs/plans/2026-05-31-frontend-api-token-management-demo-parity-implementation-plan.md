# Frontend API Token Management Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing GraphQL API-token lifecycle demoable from the browser UI without adding REST endpoints.

**Architecture:** Add a Relay-backed `/account/api-tokens` route that loads the current user's token list, renders active/revoked status, and commits create, revoke, and rotate mutations through the existing GraphQL schema. Keep Phoenix session cookies as the browser auth authority; unauthenticated route loads show a sign-in prompt instead of adding token-bearing browser auth.

**Tech Stack:** Phoenix Absinthe GraphQL, React Router loaders, React Relay, Bun, Vitest, Testing Library, StyleX primitives.

---

## Existing Contract

- Backend query: `myApiTokens(first: Int, after: String, status: ApiTokenStatusFilter)`.
- Backend mutations: `createApiToken(label: String, expiresAt: DateTime)`, `revokeApiToken(tokenId: ID!)`, and `rotateApiToken(tokenId: ID!, label: String, expiresAt: DateTime)`.
- Browser auth rule: use GraphQL over `/api/graphql`; do not add browser REST endpoints or return bearer/session tokens for browser login.
- Existing frontend patterns to follow:
  - Relay route preloading from `assets/src/relay/route-preload.ts`.
  - Saved comparison pagination and unauthorized handling in `assets/src/routes/compare/saved-data.ts`.
  - Route mutation helpers in `assets/src/routes/relay-mutations.ts`.
  - Root navigation tests in `assets/src/routes/__tests__/root.route.test.tsx`.

## File Structure

- Create `assets/src/routes/account/api-tokens/queries/ApiTokensRouteQuery.ts` for the route query.
- Create `assets/src/routes/account/api-tokens/mutations/CreateApiTokenMutation.ts` for creating tokens.
- Create `assets/src/routes/account/api-tokens/mutations/RevokeApiTokenMutation.ts` for revoking tokens.
- Create `assets/src/routes/account/api-tokens/mutations/RotateApiTokenMutation.ts` for rotating tokens.
- Create `assets/src/routes/account/api-tokens/loader.ts` for route preloading, pagination, summaries, and unauthorized handling.
- Create `assets/src/routes/account/api-tokens/index.tsx` for the route UI and mutation flows.
- Create `assets/src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` for loader and summary tests.
- Create `assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx` for route render and mutation tests.
- Modify `assets/src/router.tsx` to register `/account/api-tokens`.
- Modify `assets/src/routes/root.tsx` and `assets/src/routes/__tests__/root.route.test.tsx` to expose the route from primary navigation and home actions.
- Modify `assets/src/react-relay.d.ts` only if the current Relay shim lacks a needed hook signature.
- Modify `assets/schema.graphql` when the local Relay schema snapshot is missing the already-exposed backend API-token contract.
- Generated Relay artifacts under `assets/src/__generated__/**` are produced by `bun run relay`.
- Update `docs/work/frontend-api-token-management-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` with each completed batch.

---

### Task 1: Add The Relay Route Query And Loader

**Files:**
- Modify: `assets/schema.graphql`
- Create: `assets/src/routes/account/api-tokens/queries/ApiTokensRouteQuery.ts`
- Create: `assets/src/routes/account/api-tokens/loader.ts`
- Create: `assets/src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts`
- Modify after verification: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing loader tests**

Create `assets/src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts` with coverage for:

```ts
test("apiTokensLoader returns unauthorized state for myApiTokens UNAUTHENTICATED errors");
test("apiTokensLoader summarizes paginated token records in connection order");
test("apiTokensLoader rejects invalid pagination cursors");
test("apiTokensLoader propagates aborted requests");
```

The ready-state fixture must include these token fields so the route contract is locked before implementation:

```ts
const TOKEN_NODE = {
  id: "QXBpVG9rZW46MDEyMzQ1NjctODlhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVm",
  label: "CLI",
  tokenPrefix: "abcdef123456",
  lastUsedAt: null,
  expiresAt: "2026-08-29T12:00:00Z",
  revokedAt: null,
  insertedAt: "2026-05-31T12:00:00Z"
};
```

- [x] **Step 2: Run the loader tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts
```

Expected: FAIL because the route query and loader do not exist.

- [x] **Step 3: Add the route query**

Create `assets/src/routes/account/api-tokens/queries/ApiTokensRouteQuery.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  query ApiTokensRouteQuery(
    $first: Int!
    $after: String
    $status: ApiTokenStatusFilter
  ) {
    myApiTokens(first: $first, after: $after, status: $status) {
      edges {
        cursor
        node {
          id
          label
          tokenPrefix
          lastUsedAt
          expiresAt
          revokedAt
          insertedAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
```

- [x] **Step 4: Add the loader**

Create `assets/src/routes/account/api-tokens/loader.ts` using the same route-preload pattern as saved comparisons:

- `API_TOKENS_PAGE_SIZE = 20`.
- `API_TOKENS_MAX_PAGES = 50`.
- Accepted `status` query params are `active`, `revoked`, and `all`; missing or invalid values default to `all`.
- `UNAUTHENTICATED` GraphQL errors on `myApiTokens` return `{ status: "unauthorized", tokenQueries: [], tokens: [], tokenStatus: "all" }`.
- Ready/empty responses include `tokenQueries`, `tokens`, and `tokenStatus`.
- Invalid missing or repeated cursors throw an error instead of looping.
- Aborted requests throw the abort reason when one is available.

Export these types and helpers:

```ts
export type ApiTokenStatus = "active" | "revoked" | "all";

export interface ApiTokenSummary {
  id: string;
  label: string | null;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  insertedAt: string;
}

export type ApiTokensRouteLoaderData =
  | {
      status: "ready" | "empty";
      tokenQueries: ApiTokenQueryDescriptor[];
      tokens: ApiTokenSummary[];
      tokenStatus: ApiTokenStatus;
    }
  | {
      status: "unauthorized";
      tokenQueries: [];
      tokens: [];
      tokenStatus: ApiTokenStatus;
    };
```

- [x] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/ApiTokensRouteQuery.graphql.ts`.

- [x] **Step 6: Run the loader tests to verify they pass**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts
```

Expected: PASS.

- [x] **Step 7: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 8: Update queue docs**

Update `docs/work/frontend-api-token-management-demo-parity.md` and `docs/plans/NOW.md`:

- Mark Task 1 complete.
- Record the exact verification commands.
- Advance the current batch to Task 2.

- [x] **Step 9: Commit**

If committing at this milestone, include the query, loader, tests, generated artifact, and docs in one commit:

```bash
git add assets/schema.graphql assets/src/routes/account/api-tokens/queries/ApiTokensRouteQuery.ts assets/src/routes/account/api-tokens/loader.ts assets/src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts assets/src/__generated__/ApiTokensRouteQuery.graphql.ts docs/work/frontend-api-token-management-demo-parity.md docs/plans/NOW.md
git commit -m "feat(frontend): preload api token management route"
```

---

### Task 2: Render The API Token Management Route

**Files:**
- Create: `assets/src/routes/account/api-tokens/index.tsx`
- Create: `assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify after verification: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing route render tests**

Create route tests covering:

```ts
test("API token route prompts unauthenticated users to sign in");
test("API token route renders an empty state for authenticated users without tokens");
test("API token route renders token label, prefix, expiry, last-used, created, and status");
test("API token route links status filters without losing the route path");
```

The ready-state assertion must treat `revokedAt === null` as active and non-null `revokedAt` as revoked.

- [x] **Step 2: Run the route tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: FAIL because the route component does not exist.

- [x] **Step 3: Add the route component**

Create `assets/src/routes/account/api-tokens/index.tsx` with:

- `ApiTokensRoute` reading `apiTokensLoader` data through `useLoaderData`.
- A sign-in link to `/auth/login` for unauthorized state.
- A token status summary with `role="status"` and `aria-live="polite"`.
- Filter links to `/account/api-tokens?status=all`, `/account/api-tokens?status=active`, and `/account/api-tokens?status=revoked`.
- A Suspense + `ResettableErrorBoundary` path that renders Relay-preloaded token pages when `tokenQueries` are present.
- A summary fallback list from loader summaries when Relay records are unavailable.

- [x] **Step 4: Register the route**

Modify `assets/src/router.tsx`:

```ts
import { apiTokensLoader } from "./routes/account/api-tokens/loader";
import { ApiTokensRoute } from "./routes/account/api-tokens";
```

Add a child route:

```tsx
{
  path: "account/api-tokens",
  loader: apiTokensLoader,
  element: <ApiTokensRoute />
}
```

- [x] **Step 5: Run route tests**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts
```

Expected: PASS.

- [x] **Step 6: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 7: Update queue docs**

Mark Task 2 complete, record verification, and advance the current batch to Task 3.

- [x] **Step 8: Commit**

```bash
git add assets/src/routes/account/api-tokens/index.tsx assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx assets/src/router.tsx docs/work/frontend-api-token-management-demo-parity.md docs/plans/NOW.md
git commit -m "feat(frontend): render api token management route"
```

---

### Task 3: Add Create Token Flow

**Files:**
- Modify: `assets/schema.graphql`
- Create: `assets/src/routes/account/api-tokens/mutations/CreateApiTokenMutation.ts`
- Modify: `assets/src/routes/account/api-tokens/index.tsx`
- Modify: `assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx`
- Modify after verification: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing create-flow tests**

Add route tests covering:

```ts
test("create token submits label and displays the one-time plain text token");
test("create token clears the one-time token when the next create starts");
test("create token renders mutation payload errors");
test("create token renders a generic alert for top-level GraphQL errors");
```

The success response fixture must include both `plainTextToken` and `apiToken`, and the UI must label the secret as one-time visible.

- [x] **Step 2: Run tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: FAIL because the create mutation and form are not implemented.

- [x] **Step 3: Add the create mutation**

Create `assets/src/routes/account/api-tokens/mutations/CreateApiTokenMutation.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  mutation CreateApiTokenMutation($label: String, $expiresAt: DateTime) {
    createApiToken(label: $label, expiresAt: $expiresAt) {
      plainTextToken
      apiToken {
        id
        label
        tokenPrefix
        lastUsedAt
        expiresAt
        revokedAt
        insertedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;
```

- [x] **Step 4: Implement the create form**

In `ApiTokensRoute`:

- Add a label input with `name="label"`.
- Add an optional expiry input with `name="expiresAt"` and `type="datetime-local"`.
- Commit `CreateApiTokenMutation` through `useMutation` and `commitRouteMutationPromise`.
- On success with no GraphQL errors, render the `plainTextToken` in a dedicated success region.
- Do not store or display `plainTextToken` after a subsequent mutation starts.
- Render payload errors through `routeMutationErrorMessage`.

- [x] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/CreateApiTokenMutation.graphql.ts`.

- [x] **Step 6: Run create-flow tests**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: PASS.

- [x] **Step 7: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 8: Update queue docs**

Mark Task 3 complete, record verification, and advance the current batch to Task 4.

- [x] **Step 9: Commit**

```bash
git add assets/schema.graphql assets/src/routes/account/api-tokens/mutations/CreateApiTokenMutation.ts assets/src/routes/account/api-tokens/index.tsx assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx assets/src/__generated__/CreateApiTokenMutation.graphql.ts docs/work/frontend-api-token-management-demo-parity.md docs/plans/NOW.md
git commit -m "feat(frontend): create api tokens from the browser"
```

---

### Task 4: Add Revoke Token Flow

**Files:**
- Create: `assets/src/routes/account/api-tokens/mutations/RevokeApiTokenMutation.ts`
- Modify: `assets/src/routes/account/api-tokens/index.tsx`
- Modify: `assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx`
- Modify after verification: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing revoke-flow tests**

Add route tests covering:

```ts
test("revoke token commits the selected token id and updates the row status");
test("revoke token suppresses duplicate clicks while a row is pending");
test("revoke token renders mutation payload errors");
test("revoke token renders a generic alert for network errors");
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: FAIL because revoke is not implemented.

- [ ] **Step 3: Add the revoke mutation**

Create `assets/src/routes/account/api-tokens/mutations/RevokeApiTokenMutation.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  mutation RevokeApiTokenMutation($tokenId: ID!) {
    revokeApiToken(tokenId: $tokenId) {
      apiToken {
        id
        label
        tokenPrefix
        lastUsedAt
        expiresAt
        revokedAt
        insertedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;
```

- [ ] **Step 4: Implement revoke UI**

In `ApiTokensRoute`:

- Add a revoke button for active rows.
- Track pending revoke IDs in a `ReadonlySet<string>`.
- Disable only the pending row.
- On success, update local row state so the revoked row displays revoked status.
- Keep revoked rows visible when the current filter is `all` or `revoked`; hide them from the active filter after local status changes.

- [ ] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/RevokeApiTokenMutation.graphql.ts`.

- [ ] **Step 6: Run revoke-flow tests**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 8: Update queue docs**

Mark Task 4 complete, record verification, and advance the current batch to Task 5.

- [ ] **Step 9: Commit**

```bash
git add assets/src/routes/account/api-tokens/mutations/RevokeApiTokenMutation.ts assets/src/routes/account/api-tokens/index.tsx assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx assets/src/__generated__/RevokeApiTokenMutation.graphql.ts docs/work/frontend-api-token-management-demo-parity.md docs/plans/NOW.md
git commit -m "feat(frontend): revoke api tokens from the browser"
```

---

### Task 5: Add Rotate Token Flow

**Files:**
- Create: `assets/src/routes/account/api-tokens/mutations/RotateApiTokenMutation.ts`
- Modify: `assets/src/routes/account/api-tokens/index.tsx`
- Modify: `assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx`
- Modify after verification: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing rotate-flow tests**

Add route tests covering:

```ts
test("rotate token commits the selected token id and displays the replacement one-time token");
test("rotate token uses the selected row label when no replacement label is entered");
test("rotate token disables only the pending row");
test("rotate token renders mutation payload errors");
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: FAIL because rotate is not implemented.

- [ ] **Step 3: Add the rotate mutation**

Create `assets/src/routes/account/api-tokens/mutations/RotateApiTokenMutation.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  mutation RotateApiTokenMutation($tokenId: ID!, $label: String, $expiresAt: DateTime) {
    rotateApiToken(tokenId: $tokenId, label: $label, expiresAt: $expiresAt) {
      plainTextToken
      apiToken {
        id
        label
        tokenPrefix
        lastUsedAt
        expiresAt
        revokedAt
        insertedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;
```

- [ ] **Step 4: Implement rotate UI**

In `ApiTokensRoute`:

- Add a rotate button for active rows.
- Use the existing row label as the replacement label unless the user has typed a replacement value.
- Track pending rotate IDs separately from revoke IDs.
- On success, show the replacement `plainTextToken` in the same one-time secret region used by create.
- Add the replacement token to local row state and mark the old row revoked from the mutation response when the response contains enough data.

- [ ] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/RotateApiTokenMutation.graphql.ts`.

- [ ] **Step 6: Run rotate-flow tests**

Run:

```bash
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 8: Update queue docs**

Mark Task 5 complete, record verification, and advance the current batch to Task 6.

- [ ] **Step 9: Commit**

```bash
git add assets/src/routes/account/api-tokens/mutations/RotateApiTokenMutation.ts assets/src/routes/account/api-tokens/index.tsx assets/src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx assets/src/__generated__/RotateApiTokenMutation.graphql.ts docs/work/frontend-api-token-management-demo-parity.md docs/plans/NOW.md
git commit -m "feat(frontend): rotate api tokens from the browser"
```

---

### Task 6: Wire Navigation And Close The Lane

**Files:**
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`

- [ ] **Step 1: Write failing navigation tests**

Update `assets/src/routes/__tests__/root.route.test.tsx` to assert:

```ts
expect(screen.getByRole("link", { name: "API tokens" })).toHaveAttribute(
  "href",
  "/account/api-tokens"
);
```

Assert the link exists in both primary navigation and home actions.

- [ ] **Step 2: Run navigation tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx
```

Expected: FAIL because the navigation link is not rendered.

- [ ] **Step 3: Add navigation links**

Update `RootLayout` and `RootRoute` in `assets/src/routes/root.tsx` to add `API tokens` links to `/account/api-tokens`.

- [ ] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/account/api-tokens/__tests__/api-tokens-loader.test.ts src/routes/account/api-tokens/__tests__/api-tokens.route.test.tsx src/routes/__tests__/root.route.test.tsx
cd assets && bun run typecheck
```

Expected: all commands pass.

- [ ] **Step 5: Run broader frontend verification**

Run:

```bash
cd assets && bun run check
```

Expected: PASS.

- [ ] **Step 6: Run backend contract verification**

Run:

```bash
mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/api_token_test.exs
```

Expected: PASS.

- [ ] **Step 7: Close queue docs**

Update queue and architecture docs to mark the API-token management demo parity lane completed:

- `docs/work/frontend-api-token-management-demo-parity.md`
- `docs/work/index.md`
- `docs/plans/NOW.md`
- `docs/plans/INDEX.md`
- `ARCHITECTURE.md`
- this implementation plan

- [ ] **Step 8: Final verification**

Run:

```bash
cd assets && bun run check
mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/api_token_test.exs
git diff --check
```

Expected: all commands pass.

- [ ] **Step 9: Commit**

If Tasks 1-5 were committed individually, include only Task 6 files here. If this lane is committed as one milestone, include all route, Relay artifact, test, and doc changes together.

```bash
git add assets/src/routes/root.tsx assets/src/routes/__tests__/root.route.test.tsx docs/work/frontend-api-token-management-demo-parity.md docs/work/index.md docs/plans/NOW.md docs/plans/INDEX.md ARCHITECTURE.md docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md
git commit -m "feat(frontend): finish api token management demo parity"
```

# Frontend + Session Auth + Relay Implementation Plan

> Auth contract correction (2026-03-16): replace any browser-facing `/api/auth/*` steps in this older plan with GraphQL mutations on `/api/graphql`. Do not add or keep frontend-facing REST auth endpoints for browser `login`, `register`, or `logout`.
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the V1 web product for ProductCompare with Bun-only SSR (`app.example.com`), Phoenix API/session authority (`api.example.com`), StyleX + Radix UI, and Relay-based data flows.

**Architecture:** Create a new `assets/` Bun + Vite + React Router v7 SSR app and integrate it with Phoenix over GraphQL + session cookies. Implement missing backend auth/session + GraphQL surfaces to support V1 user journeys (auth, browse/filter, product detail, compare up to 3, private saved comparisons). Keep OAuth and public share links out of V1.

**Tech Stack:** Bun, Vite, React 19, React Router v7 SSR, StyleX, Radix UI, Relay, TypeScript, Vitest, Playwright, Elixir/Phoenix/Absinthe/Ecto/Postgres.

---

## Global Conventions for Execution

- Use TDD for every task.
- Keep commits small (one commit per task in this plan).
- Run the task-local tests in each task, then run integration gates at phase boundaries.
- Do not defer schema/test/docs updates once a task is started.

### Phase Boundary Gates

- Frontend gate: `cd assets && bun run typecheck && bun run test`
- Backend gate: `mix test`
- Full gate before release tasks: `mix precommit && cd assets && bun run check`

---

### Task 1: Bootstrap `assets/` Bun SSR App

**Files:**
- Create: `assets/package.json`
- Create: `assets/bunfig.toml`
- Create: `assets/tsconfig.json`
- Create: `assets/vite.config.ts`
- Create: `assets/index.html`
- Create: `assets/src/entry.client.tsx`
- Create: `assets/src/entry.server.tsx`
- Create: `assets/src/router.tsx`
- Create: `assets/src/routes/root.tsx`
- Test: `assets/src/routes/__tests__/root.route.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { RootRoute } from "../root";

test("renders product compare shell title", () => {
  render(<RootRoute />);
  expect(screen.getByRole("heading", { name: /product compare/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/__tests__/root.route.test.tsx`
Expected: FAIL with module/file not found errors.

**Step 3: Write minimal implementation**

```tsx
export function RootRoute() {
  return (
    <main>
      <h1>Product Compare</h1>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun test src/routes/__tests__/root.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets
git commit -m "feat(frontend): scaffold bun vite react-router ssr app"
```

---

### Task 2: Add Testing Toolchain and Project Scripts

**Files:**
- Modify: `assets/package.json`
- Create: `assets/vitest.config.ts`
- Create: `assets/src/test/setup.ts`
- Create: `assets/playwright.config.ts`
- Create: `assets/tests/e2e/smoke.spec.ts`
- Test: `assets/src/routes/__tests__/root.route.test.tsx`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("home route responds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product Compare" })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun x playwright test tests/e2e/smoke.spec.ts`
Expected: FAIL due to missing config/dev server wiring.

**Step 3: Write minimal implementation**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check": "bun run typecheck && bun run test"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun run test && bun run typecheck`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/package.json assets/vitest.config.ts assets/src/test/setup.ts assets/playwright.config.ts assets/tests/e2e/smoke.spec.ts
git commit -m "test(frontend): add vitest and playwright harness"
```

---

### Task 3: Integrate StyleX + Radix UI App Shell

**Files:**
- Create: `assets/src/ui/providers/app-providers.tsx`
- Create: `assets/src/ui/theme/tokens.stylex.ts`
- Create: `assets/src/ui/theme/theme.css`
- Create: `assets/src/ui/components/layout/app-shell.tsx`
- Modify: `assets/src/routes/root.tsx`
- Test: `assets/src/ui/__tests__/app-shell.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "../components/layout/app-shell";

test("renders primary nav landmarks", () => {
  render(<AppShell><div>content</div></AppShell>);
  expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/ui/__tests__/app-shell.test.tsx`
Expected: FAIL because AppShell/provider files do not exist.

**Step 3: Write minimal implementation**

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav aria-label="Primary">...</nav>
      <main>{children}</main>
    </>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun test src/ui/__tests__/app-shell.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/ui assets/src/routes/root.tsx
git commit -m "feat(frontend): add stylex tokenized theme and radix app shell"
```

---

### Task 4: Add Relay Compiler + Network Layer

**Files:**
- Create: `assets/relay.config.json`
- Create: `assets/src/relay/environment.ts`
- Create: `assets/src/relay/fetch-graphql.ts`
- Create: `assets/src/relay/load-query.ts`
- Modify: `assets/src/entry.client.tsx`
- Modify: `assets/src/entry.server.tsx`
- Test: `assets/src/relay/__tests__/fetch-graphql.test.ts`

**Step 1: Write the failing test**

```ts
import { fetchGraphQL } from "../fetch-graphql";

test("sends credentials for session auth", async () => {
  const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
  global.fetch = mock as unknown as typeof fetch;

  await fetchGraphQL("query Viewer { viewer { id } }", {});

  expect(mock).toHaveBeenCalledWith(
    expect.stringContaining("/api/graphql"),
    expect.objectContaining({ credentials: "include" })
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/relay/__tests__/fetch-graphql.test.ts`
Expected: FAIL due to missing implementation.

**Step 3: Write minimal implementation**

```ts
export async function fetchGraphQL(query: string, variables: Record<string, unknown>) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/graphql`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun test src/relay/__tests__/fetch-graphql.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/relay.config.json assets/src/relay assets/src/entry.client.tsx assets/src/entry.server.tsx
git commit -m "feat(frontend): wire relay compiler and authenticated network layer"
```

---

### Task 5: Add Backend Auth Schema (Users + Session Tokens)

**Files:**
- Create: `priv/repo/migrations/<timestamp>_add_user_auth_fields_and_session_tokens.exs`
- Modify: `lib/product_compare_schemas/accounts/user.ex`
- Create: `lib/product_compare_schemas/accounts/user_session_token.ex`
- Test: `test/product_compare/accounts/user_auth_schema_test.exs`

**Step 1: Write the failing test**

```elixir
test "user requires hashed_password for registration changeset" do
  changeset = User.registration_changeset(%User{}, %{email: "a@example.com", password: "short"})
  refute changeset.valid?
  assert %{password: ["should be at least 12 character(s)"]} = errors_on(changeset)
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare/accounts/user_auth_schema_test.exs`
Expected: FAIL due to missing fields/functions.

**Step 3: Write minimal implementation**

```elixir
alter table(:users) do
  add :hashed_password, :binary, null: false
  add :confirmed_at, :utc_datetime_usec
end

create table(:users_tokens, primary_key: false) do
  add :id, :uuid, primary_key: true, null: false, default: fragment("uuidv7()")
  add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
  add :token_hash, :binary, null: false
  add :context, :string, null: false
  add :sent_to, :citext
  add :expires_at, :utc_datetime_usec, null: false
  timestamps(type: :utc_datetime_usec, updated_at: false)
end
```

**Step 4: Run test to verify it passes**

Run: `mix ecto.migrate && mix test test/product_compare/accounts/user_auth_schema_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add priv/repo/migrations lib/product_compare_schemas/accounts/user.ex lib/product_compare_schemas/accounts/user_session_token.ex test/product_compare/accounts/user_auth_schema_test.exs
git commit -m "feat(accounts): add password auth fields and session token schema"
```

---

### Task 6: Implement Accounts Registration/Login/Session APIs

**Files:**
- Modify: `mix.exs`
- Modify: `lib/product_compare/accounts.ex`
- Create: `lib/product_compare/accounts/user_auth.ex`
- Create: `test/product_compare/accounts/user_auth_test.exs`

**Step 1: Write the failing test**

```elixir
test "authenticate_user_by_email_and_password/2 returns user for valid credentials" do
  user = user_fixture(%{password: "supersecretpass123"})
  assert %User{id: ^user.id} =
           Accounts.authenticate_user_by_email_and_password(user.email, "supersecretpass123")
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare/accounts/user_auth_test.exs`
Expected: FAIL with undefined auth functions.

**Step 3: Write minimal implementation**

```elixir
def authenticate_user_by_email_and_password(email, password) do
  with %User{} = user <- get_user_by_email(email),
       true <- Argon2.verify_pass(password, user.hashed_password) do
    user
  else
    _ -> nil
  end
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare/accounts/user_auth_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add mix.exs mix.lock lib/product_compare/accounts.ex lib/product_compare/accounts/user_auth.ex test/product_compare/accounts/user_auth_test.exs test/support/fixtures/accounts_fixtures.ex
git commit -m "feat(accounts): add credential auth and session token lifecycle"
```

---

### Task 7: Add GraphQL Auth Mutations and Session Plug Flow

> **Note:** This task was superseded by the GraphQL auth migration (2026-03-16). Browser auth now uses GraphQL mutations instead of REST endpoints. The REST-specific files mentioned below (session_controller.ex, auth_json.ex, routes under "/api/auth/login") are deprecated and have been replaced with GraphQL equivalents.

**Files:**
- Modify: `lib/product_compare_web/schema.ex` (GraphQL auth mutations)
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex` (login, register, logout resolvers)
- Create: `lib/product_compare_web/graphql/session_mutation_bridge.ex` (session management)
- Create: `lib/product_compare_web/plugs/fetch_current_user.ex`
- Modify: `lib/product_compare_web/router.ex`
- Modify: `lib/product_compare_web/endpoint.ex`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Step 1: Write the failing test**

```elixir
test "login mutation sets session and returns viewer payload", %{conn: conn} do
  user = user_fixture(%{password: "supersecretpass123"})
  query = """
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      viewer { email }
      errors { code message }
    }
  }
  """
  conn = graphql(conn, query, %{email: user.email, password: "supersecretpass123"})
  assert %{"data" => %{"login" => %{"viewer" => %{"email" => email}}}} = json_response(conn, 200)
  assert email == user.email
  assert get_session(conn, :user_token)
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: FAIL with mutation not defined.

**Step 3: Write minimal implementation**

```elixir
# In schema.ex
field :login, non_null(:auth_payload) do
  arg :email, non_null(:string)
  arg :password, non_null(:string)
  resolve(&AuthResolver.login/3)
end

field :register, non_null(:auth_payload) do
  arg :email, non_null(:string)
  arg :password, non_null(:string)
  resolve(&AuthResolver.register/3)
end

field :logout, non_null(:logout_payload) do
  resolve(&AuthResolver.logout/3)
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/auth_resolver.ex lib/product_compare_web/graphql/session_mutation_bridge.ex lib/product_compare_web/plugs/fetch_current_user.ex lib/product_compare_web/router.ex lib/product_compare_web/endpoint.ex test/product_compare_web/graphql/session_auth_test.exs
git commit -m "feat(graphql): add session-backed auth mutations"
```

---

### Task 8: Make GraphQL Session-Aware (Viewer via Cookie Session)

**Files:**
- Create: `lib/product_compare_web/plugs/authenticate_session_user.ex`
- Modify: `lib/product_compare_web/plugs/authenticate_api_token.ex`
- Modify: `lib/product_compare_web/plugs/put_absinthe_context.ex`
- Modify: `lib/product_compare_web/router.ex`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Step 1: Write the failing test**

```elixir
test "viewer resolves from session without bearer token", %{conn: conn} do
  user = user_fixture(%{password: "supersecretpass123"})
  conn = log_in_user(conn, user)
  body = graphql(conn, "query { viewer { email } }")
  assert %{"data" => %{"viewer" => %{"email" => ^user.email}}} = body
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: FAIL with viewer nil.

**Step 3: Write minimal implementation**

```elixir
pipeline :graphql_api do
  plug ProductCompareWeb.Plugs.AuthenticateApiToken
  plug ProductCompareWeb.Plugs.AuthenticateSessionUser
  plug ProductCompareWeb.Plugs.PutAbsintheContext
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare_web/plugs lib/product_compare_web/router.ex test/product_compare_web/graphql/session_auth_test.exs test/support/conn_case.ex
git commit -m "feat(graphql): support session-authenticated viewer context"
```

---

### Task 9: Add GraphQL Catalog Browse + Product Detail Queries

**Files:**
- Modify: `lib/product_compare_web/schema.ex`
- Create: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/pricing.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`

**Step 1: Write the failing test**

```elixir
test "products query supports filters and returns connection", %{conn: conn} do
  query = """
  query($first: Int!, $filters: ProductFiltersInput) {
    products(first: $first, filters: $filters) {
      edges { node { id name } }
      pageInfo { hasNextPage }
    }
  }
  """
  assert %{"data" => %{"products" => _}} = graphql(conn, query, %{"first" => 10, "filters" => %{}})
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
Expected: FAIL with unknown field `products`.

**Step 3: Write minimal implementation**

```elixir
field :products, non_null(:product_connection) do
  arg :first, :integer
  arg :after, :string
  arg :filters, :product_filters_input
  resolve(&CatalogResolver.products/3)
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare/catalog.ex lib/product_compare/pricing.ex test/product_compare_web/graphql/catalog_queries_test.exs
git commit -m "feat(graphql): add catalog browse and product detail queries"
```

---

### Task 10: Add Saved Comparison Persistence + GraphQL Mutations

**Files:**
- Create: `priv/repo/migrations/<timestamp>_create_saved_comparison_sets.exs`
- Create: `lib/product_compare_schemas/catalog/saved_comparison_set.ex`
- Create: `lib/product_compare_schemas/catalog/saved_comparison_item.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Test: `test/product_compare/catalog/saved_comparison_set_test.exs`
- Test: `test/product_compare_web/graphql/saved_comparisons_test.exs`

**Step 1: Write the failing test**

```elixir
test "create_saved_comparison_set/3 enforces max 3 products" do
  user = user_fixture()
  assert {:error, :too_many_products} = Catalog.create_saved_comparison_set(user.id, "Too many", [1, 2, 3, 4])
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare/catalog/saved_comparison_set_test.exs`
Expected: FAIL due to missing schema/context functions.

**Step 3: Write minimal implementation**

```elixir
def create_saved_comparison_set(_user_id, _name, product_ids) when length(product_ids) > 3 do
  {:error, :too_many_products}
end
```

**Step 4: Run test to verify it passes**

Run: `mix ecto.migrate && mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add priv/repo/migrations lib/product_compare_schemas/catalog/saved_comparison_set.ex lib/product_compare_schemas/catalog/saved_comparison_item.ex lib/product_compare/catalog.ex lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/catalog_resolver.ex test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs
git commit -m "feat(compare): add private saved comparison persistence and graphql api"
```

---

### Task 11: Implement Frontend Auth Routes and Session UX

> **Note:** This task was superseded by the GraphQL auth migration (2026-03-16). The loginAction now calls the GraphQL auth mutation instead of POSTing to "/api/auth/login". REST auth endpoints are deprecated.

**Files:**
- Create: `assets/src/routes/auth/login.tsx`
- Create: `assets/src/routes/auth/register.tsx`
- Create: `assets/src/routes/auth/forgot-password.tsx`
- Create: `assets/src/routes/auth/reset-password.tsx`
- Create: `assets/src/routes/auth/verify-email.tsx`
- Create: `assets/src/routes/auth/actions.ts`
- Create: `assets/src/routes/auth/__tests__/login.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`

**Step 1: Write the failing test**

```tsx
test("submits login and redirects to browse", async () => {
  render(<LoginRoute />);
  await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "supersecretpass123");
  await userEvent.click(screen.getByRole("button", { name: /log in/i }));
  expect(mockNavigate).toHaveBeenCalledWith("/browse");
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/auth/__tests__/login.route.test.tsx`
Expected: FAIL due to missing route/action wiring.

**Step 3: Write minimal implementation**

```ts
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const mutation = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        viewer { id email }
        errors { code message }
      }
    }
  `;

  const response = await fetchGraphQL(mutation, { email, password });

  if (response.data?.login?.viewer) {
    return redirect("/browse");
  }

  // Handle errors
  return { errors: response.data?.login?.errors ?? [] };
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun test src/routes/auth/__tests__/login.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/auth assets/src/router.tsx assets/src/routes/root.tsx
git commit -m "feat(frontend): implement auth routes with graphql mutations"
```

---

### Task 12: Implement Browse Route with Relay Filters

**Files:**
- Create: `assets/src/routes/browse/index.tsx`
- Create: `assets/src/routes/browse/ProductGrid.tsx`
- Create: `assets/src/routes/browse/FilterPanel.tsx`
- Create: `assets/src/routes/browse/queries/BrowseProductsQuery.graphql`
- Create: `assets/src/routes/browse/__tests__/browse.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing test**

```tsx
test("updates query variables when numeric filter changes", async () => {
  render(<BrowseRoute />);
  await userEvent.type(screen.getByLabelText(/minimum price/i), "500");
  expect(mockLoadQuery).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ filters: expect.objectContaining({ numeric: expect.any(Array) }) })
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/browse/__tests__/browse.route.test.tsx`
Expected: FAIL due to missing browse route/query wiring.

**Step 3: Write minimal implementation**

```tsx
const query = graphql`
  query BrowseProductsQuery($first: Int!, $filters: ProductFiltersInput) {
    products(first: $first, filters: $filters) {
      edges { node { id name slug } }
    }
  }
`;
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun run relay && bun test src/routes/browse/__tests__/browse.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/browse assets/src/router.tsx assets/src/__generated__
git commit -m "feat(frontend): add relay-powered browse and filter route"
```

---

### Task 13: Implement Product Detail Route (Specs + Pricing + Coupons)

**Files:**
- Create: `assets/src/routes/products/detail.tsx`
- Create: `assets/src/routes/products/SpecTable.tsx`
- Create: `assets/src/routes/products/PriceHistoryChart.tsx`
- Create: `assets/src/routes/products/CouponList.tsx`
- Create: `assets/src/routes/products/queries/ProductDetailQuery.graphql`
- Create: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing test**

```tsx
test("renders active coupons section when coupons exist", () => {
  render(<ProductDetailRoute />);
  expect(screen.getByRole("heading", { name: /active offers/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/products/__tests__/detail.route.test.tsx`
Expected: FAIL due to missing route/components.

**Step 3: Write minimal implementation**

```tsx
<section aria-label="Active offers">
  <h2>Active offers</h2>
  <CouponList coupons={data.product.activeCoupons} />
</section>
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun run relay && bun test src/routes/products/__tests__/detail.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/products assets/src/router.tsx assets/src/__generated__
git commit -m "feat(frontend): add product detail route with specs pricing coupons"
```

---

### Task 14: Implement Compare Flow + Saved Comparisons UI

**Files:**
- Create: `assets/src/routes/compare/index.tsx`
- Create: `assets/src/routes/compare/CompareTray.tsx`
- Create: `assets/src/routes/compare/ComparisonGrid.tsx`
- Create: `assets/src/routes/compare/saved.tsx`
- Create: `assets/src/routes/compare/queries/CompareProductsQuery.graphql`
- Create: `assets/src/routes/compare/mutations/CreateSavedComparisonMutation.graphql`
- Create: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing test**

```tsx
test("prevents adding more than 3 products", async () => {
  render(<CompareTray />);
  await addFourProducts();
  expect(screen.getByText(/you can compare up to 3 products/i)).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL due to missing compare state guard.

**Step 3: Write minimal implementation**

```ts
if (nextIds.length > 3) {
  setError("You can compare up to 3 products");
  return;
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun run relay && bun test src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare assets/src/router.tsx assets/src/__generated__
git commit -m "feat(frontend): add compare and private saved comparisons ui"
```

---

### Task 15: Accessibility, Responsive, and Error-Boundary Hardening

**Files:**
- Create: `assets/src/ui/components/errors/route-error-boundary.tsx`
- Modify: `assets/src/router.tsx`
- Create: `assets/tests/e2e/a11y-auth-browse.spec.ts`
- Create: `assets/tests/e2e/responsive-compare.spec.ts`
- Create: `assets/src/routes/__tests__/a11y.smoke.test.tsx`

**Step 1: Write the failing test**

```tsx
test("root route has no critical axe violations", async () => {
  const { container } = render(<RootRoute />);
  const results = await axe(container);
  expect(results.violations).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

Run: `cd assets && bun test src/routes/__tests__/a11y.smoke.test.tsx`
Expected: FAIL with at least one landmark/label violation.

**Step 3: Write minimal implementation**

```tsx
export function RouteErrorBoundary() {
  return (
    <main aria-live="polite">
      <h1>Something went wrong</h1>
      <p>Please retry your request.</p>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd assets && bun run test && bun x playwright test tests/e2e/a11y-auth-browse.spec.ts tests/e2e/responsive-compare.spec.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/ui/components/errors assets/src/router.tsx assets/tests/e2e assets/src/routes/__tests__/a11y.smoke.test.tsx
git commit -m "test(frontend): add a11y responsive and route error hardening"
```

---

### Task 16: Deployment and Cross-Subdomain Session Configuration

**Files:**
- Modify: `config/runtime.exs`
- Modify: `config/prod.exs`
- Modify: `lib/product_compare_web/endpoint.ex`
- Create: `docs/deploy/single-vm-bun-phoenix.md`
- Create: `assets/Dockerfile` (if containerized locally on VM) or `assets/scripts/start-prod.sh`
- Test: `test/product_compare_web/graphql/session_auth_test.exs`

**Step 1: Write the failing test**

```elixir
test "session cookie config supports cross-subdomain app/api setup" do
  cookie_domain = Application.fetch_env!(:product_compare, ProductCompareWeb.Endpoint)[:session_domain]
  assert cookie_domain == ".example.com"
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs`
Expected: FAIL because session domain/secure config is missing.

**Step 3: Write minimal implementation**

```elixir
config :product_compare, ProductCompareWeb.Endpoint,
  session_domain: System.get_env("SESSION_DOMAIN", ".example.com"),
  check_origin: ["https://app.example.com"]
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare_web/graphql/session_auth_test.exs && mix precommit && cd assets && bun run check`
Expected: PASS.

**Step 5: Commit**

```bash
git add config/runtime.exs config/prod.exs lib/product_compare_web/endpoint.ex docs/deploy/single-vm-bun-phoenix.md assets/Dockerfile assets/scripts/start-prod.sh test/product_compare_web/graphql/session_auth_test.exs
git commit -m "chore(deploy): configure single-vm bun+phoenix and session domain policy"
```

---

## Final Verification Checklist

1. `mix ecto.migrate`
2. `mix test`
3. `mix precommit`
4. `cd assets && bun install`
5. `cd assets && bun run relay`
6. `cd assets && bun run check`
7. `cd assets && bun x playwright test`
8. Manual smoke:
   - register/login/logout
   - browse + filter
   - product detail + coupon visibility
   - compare up to 3
   - save and reopen comparison

## Deliverables

- New frontend app in `assets/` with SSR, StyleX, Radix, Relay.
- Phoenix auth/session flows for browser users.
- GraphQL browse/detail/compare/saved-comparison surfaces.
- Automated tests for backend auth + GraphQL + frontend flows.
- Deploy guide for single VM with `app.example.com` + `api.example.com`.
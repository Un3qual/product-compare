# React Router 8 Framework Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Product Compare frontend to the exact React Router 8.3.1 Framework Mode stack and materially reduce custom router, SSR, metadata, route-type, and test infrastructure without changing Relay, GraphQL, auth, HTTP, navigation, or user-facing behavior.

**Architecture:** An explicit Framework Mode route config maps existing URLs to route modules; a framework root owns the document, metadata components, application shell, request context, and root error handling. Small custom entries attach the request/browser Relay environment and transfer normalized records, while React Router owns route discovery, loaders/actions, hydration, code splitting, response status/headers, and the client/server build.

**Tech Stack:** React Router 8.3.1 Framework Mode, React 19.2.7, Node 24.18.1, TypeScript 5.9, Vite 8.2, Relay 21.0.1, StyleX 0.18.1, Vitest 4.1, Playwright, Phoenix 1.8

**Spec:** `docs/superpowers/specs/2026-09-02-react-router-8-framework-mode-design.md`

## Global Constraints

- Work only on `codex/react-router-8-framework-mode`, stacked on
  `codex/project-quality-remediation` at
  `2a76b443f394f07c02fd286a0615093a5e030fde`.
- Keep every React Router package at exactly 8.3.1 and React/React DOM at
  19.2.7. Remove `react-router-dom` and `@unhead/react`; add a direct runtime
  adapter only when application code imports or executes it.
- Preserve browser auth through GraphQL `/api/graphql` and Phoenix session
  cookies. Never introduce REST auth or browser bearer/session tokens.
- Preserve Relay preloading, request semantics, redirects/status codes,
  not-found behavior, SEO, navigation, and error UX.
- Keep request creation and JSON serialization inside the typed GraphQL
  transport failure boundary.
- Remove the cross-realm signal bridge only after the framework removes the
  relevant application-owned request construction and a jsdom/Vitest abort
  check proves that deletion safe.
- Use generated Framework `Route` types and inference. Do not carry React
  Router 7 `LoaderFunctionArgs` fixtures, manual route aliases, or wrapper types
  that duplicate generated contracts.
- Preserve domain-specific Relay cache, optimistic mutation, and GraphQL
  infrastructure. Do not force it into router actions.
- Do not keep the Data Mode and Framework Mode architectures side by side.
- Use `/opt/homebrew/bin/mise exec --` for frontend and project commands so
  verification runs under the pinned Node 24.18.1/pnpm 11.18.0 toolchain.

---

### Task 1: Establish the Framework package, build, and document boundary

**Files:**

- Modify: `assets/package.json`, `assets/pnpm-lock.yaml`, `assets/vite.config.ts`
- Modify: `assets/tsconfig.json`, `assets/playwright.config.ts`
- Create: `assets/react-router.config.ts`, `assets/src/routes.ts`
- Modify: Phoenix frontend watcher configuration only if the existing package
  script indirection does not launch `react-router dev`

**Interfaces:**

- `pnpm dev` launches Framework Mode development.
- `pnpm typecheck` generates route types before `tsc`.
- `pnpm build` emits the Framework client/server build and then verifies StyleX
  and bundle constraints against the client manifest.
- `pnpm start` serves the built application through the selected 8.3.1 runtime.

- [ ] **Step 1: Replace and align dependencies**

  Patch the manifest to exact React Router 8.3.1 and React 19.2.7 versions,
  remove Data Mode/Unhead dependencies, add the development plugin and standard
  serve runtime, then run the pinned `pnpm install`. Inspect the resulting
  direct and peer dependency graph; do not retain a compatibility package
  merely because it is transitive.

- [ ] **Step 2: Make type generation and Framework builds the primary scripts**

  Replace Vite-only dev/build/SSR scripts with React Router equivalents. Add
  `.react-router/types` to TypeScript `rootDirs` and includes. Update bundle,
  manifest, and StyleX validation paths only for the emitted Framework client
  layout.

- [ ] **Step 3: Compose the React Router and existing StyleX Vite plugins**

  Keep the Relay/StyleX Babel transforms and aliases while letting the
  Framework plugin own React transformation, client/server entries, manifests,
  and route splitting. Remove any extra React or class-mangling plugin whose
  ownership now conflicts with the Framework compiler. Add SSR Framework
  configuration and an explicit route config with every current URL.

- [ ] **Step 4: Generate types and prove the toolchain boundary**

  ```bash
  cd assets
  /opt/homebrew/bin/mise exec -- pnpm exec react-router typegen
  /opt/homebrew/bin/mise exec -- pnpm exec tsc --noEmit
  /opt/homebrew/bin/mise exec -- pnpm exec react-router build
  ```

  Expected: route types generate under `.react-router/types`; TypeScript and the
  Framework client/server compiler reach route-module failures rather than
  package, peer, or plugin incompatibilities.

- [ ] **Step 5: Commit the package and Framework build boundary**

  ```bash
  git add assets/package.json assets/pnpm-lock.yaml assets/vite.config.ts \
    assets/tsconfig.json assets/playwright.config.ts \
    assets/react-router.config.ts assets/src/routes.ts
  git commit -m "build: establish React Router 8 framework mode"
  ```

---

### Task 2: Replace the custom router, document, SSR, and head pipeline

**Files:**

- Create: `assets/src/root.tsx`
- Modify: `assets/src/entry.client.tsx`, `assets/src/entry.server.tsx`
- Modify: `assets/src/relay/route-preload.ts` and direct Relay environment
  providers/serialization helpers as required
- Delete: `assets/src/router.tsx`, `assets/index.html`
- Delete: superseded files under `assets/src/frontend/head/**` and
  `assets/src/frontend/ssr/**`
- Delete: `assets/src/routes/RouteMetadata.tsx` and obsolete route
  configuration modules
- Modify: `assets/src/routes/RootRoute.tsx`,
  `assets/src/routes/RouteErrorBoundary.tsx`, and
  `assets/src/routes/NotFoundRoute.tsx`
- Modify/delete: direct tests for the superseded router, SSR, head, and config
  helpers

**Interfaces:**

- Root server middleware installs the request-scoped Relay environment in typed
  route context before loaders.
- Client `HydratedRouter.getContext` supplies the seeded browser environment.
- The root document emits framework metadata/links/scripts plus one safely
  escaped Relay record-source payload.
- The server entry renders the framework router using its supplied status,
  headers, and context; it does not reconstruct the request or aggregate route
  responses itself.

- [ ] **Step 1: Characterize the critical document contracts**

  Run the focused SSR, head/SEO, root, status/redirect, and Relay hydration
  suites. Add or migrate only the minimum framework-facing assertions needed to
  cover the same observable output before deleting implementation-coupled
  tests.

- [ ] **Step 2: Build the Framework root and Relay context lifecycle**

  Move the full document, shell, root loader, error boundary, metadata
  components, and Relay bootstrap script into framework conventions. Keep
  normalization and escaping helpers only where Relay requires them.

- [ ] **Step 3: Reduce both entries to Relay adapters**

  Render `HydratedRouter` on the client and `ServerRouter` on the server. Delete
  manual browser router creation, static handlers, request reconstruction,
  response aggregation, stream-to-string head injection, and hand-built
  hydration data plumbing now supplied by Framework Mode.

- [ ] **Step 4: Migrate SEO and HTTP behavior**

  Replace metadata handles and Unhead adapters with route `meta`/`links`
  exports, including canonical and JSON-LD descriptors. Use native route
  responses for redirects, 404s, and error statuses. Preserve the existing
  markup and status assertions.

- [ ] **Step 5: Decide the signal bridge from evidence**

  Trace every remaining `new Request` call. If the application no longer
  rebuilds a foreign-realm request, run an exact jsdom/Vitest abort propagation
  test through the framework-facing boundary and delete the bridge. Otherwise
  retain it only at the remaining adapter and document why.

- [ ] **Step 6: Verify and commit the runtime replacement**

  Run focused SSR/root/SEO/error/Relay tests plus typecheck and a Framework
  build. Confirm no source import of `router.tsx`, Unhead, the deleted SSR
  helpers, or old route config remains.

  ```bash
  git add assets/src assets/test assets/index.html
  git commit -m "refactor: adopt framework routing and document SSR"
  ```

---

### Task 3: Convert route data, auth, navigation, and types to route modules

**Files:**

- Modify: route modules under `assets/src/routes/**`
- Modify: route-focused tests under `assets/test/routes/**`
- Modify/delete: route test helpers and custom route typing under
  `assets/test/support/**` and `assets/src/**`

**Interfaces:**

- Relay data routes expose server `loader` and browser `clientLoader` adapters
  around one feature-local preload implementation.
- Browser auth submissions use `clientAction` and `Form` when route ownership
  replaces local submission/navigation state without losing UX.
- Route modules consume their generated local `Route` namespace.

- [ ] **Step 1: Convert Relay loaders without duplicating domain behavior**

  Introduce server/browser adapters for every Relay-preloaded screen, retain
  descriptor/cache leases, and use generated args/data types. Verify SSR and
  client-navigation preload behavior before removing old loader signatures.

- [ ] **Step 2: Convert credential auth and revalidation plumbing**

  Move login, registration, logout, password, and email-verification route
  orchestration into browser route actions/loaders where it shortens component
  code. Keep GraphQL requests credentialed and preserve Phoenix cookie
  continuity, field errors, pending states, redirects, and root viewer
  revalidation.

- [ ] **Step 3: Keep Relay-owned domain mutations in Relay**

  Audit every remaining `useRevalidator`, `useNavigation`, form, and mutation.
  Remove routing glue made redundant by native actions, but retain optimistic
  updates and connection maintenance in Relay with a short code-level reason
  only when the ownership is non-obvious.

- [ ] **Step 4: Replace custom route types and fixtures**

  Remove imports from `react-router-dom`, manual `LoaderFunctionArgs` aliases,
  obsolete v7 fields, and home-grown loader fixtures. Test route modules or
  observable components directly; use route stubs only for intentionally
  stubbed manifests rather than forcing generated application route types into
  them.

- [ ] **Step 5: Run the complete focused route/auth matrix and commit**

  ```bash
  /opt/homebrew/bin/mise exec -- pnpm --dir assets run relay:check
  /opt/homebrew/bin/mise exec -- pnpm --dir assets run typecheck
  /opt/homebrew/bin/mise exec -- pnpm --dir assets run test:unit -- routes
  git add assets/src/routes assets/test/routes assets/test/support
  git commit -m "refactor: use framework route module contracts"
  ```

---

### Task 4: Remove leftovers and prove the complete stack

**Files:**

- Modify: `assets/scripts/**`, remaining frontend config/tests, and
  `docs/work/frontend-react-router-framework-mode.md`
- Modify at closeout: `docs/work/index.md`, `docs/plans/INDEX.md`
- Delete: every superseded file, helper, alias, script, dependency, and test
  identified by the final inventory

**Interfaces:**

- The frontend has one Framework Mode router/runtime path.
- Build checks consume `dist/client`; the server artifact runs under the
  standard serve adapter.
- The lane record reports exact verification counts and retained custom
  abstractions.

- [ ] **Step 1: Audit the whole frontend diff**

  Search for `react-router-dom`, `RouterProvider`, `createBrowserRouter`,
  `createStaticHandler`, `StaticRouterProvider`, `RouteObject`, Unhead, route
  metadata handles, old request/response helpers, lazy-import recovery,
  hand-written loader argument types, duplicate route configs, and stale build
  output paths. Remove each leftover or record the concrete behavior that
  requires it.

- [ ] **Step 2: Measure simplification**

  Compare the merge-base and branch counts for frontend infrastructure source
  files and lines covering router, entries, SSR, head, route config, and custom
  route typing. Explain any retained abstraction and require a net reduction in
  that infrastructure boundary unless a contract proves otherwise.

- [ ] **Step 3: Run full frontend verification**

  Run the pinned Relay validation, typecheck/typegen, lint, format check,
  complete Vitest suite, Framework production build, StyleX and bundle checks,
  and relevant Playwright auth/navigation/SEO/404 flows. Record exact tests,
  browsers, assets, raw/gzip bundle totals, and server/client build status.

- [ ] **Step 4: Run repository verification**

  ```bash
  /opt/homebrew/bin/mise exec -- mix work_queue.validate
  git diff --check
  /opt/homebrew/bin/mise exec -- mix ci
  ```

  Start the repository's existing test database service only if the gate proves
  it is not already available. Do not weaken or skip a failing check.

- [ ] **Step 5: Close the queue and commit verification evidence**

  Mark the lane `done`, remove it from Active Work, restore a truthful Ready
  Floor Exception, and update the plan catalog. Commit the verified closeout
  with any final source cleanup.

  ```bash
  git add assets docs/work docs/plans/INDEX.md
  git commit -m "chore: verify React Router framework migration"
  ```

- [ ] **Step 6: Publish the stacked pull request**

  Push `codex/react-router-8-framework-mode`, open a non-draft PR with base
  `codex/project-quality-remediation`, and verify the published head/base and
  checks. The PR body summarizes architecture ownership, retained custom Relay
  boundaries, simplification delta, and exact verification evidence.

## Completion

Tasks 1 through 4 were completed in milestone commits. The final self-review
found one Framework Mode runtime, no authored import of React Router internals,
no obsolete router/head dependencies, and no duplicate route, request,
response, metadata, lazy-loading, or route-type compatibility layer. The
verified package versions, test counts, build artifacts, HTTP smoke results,
retained custom boundaries, and simplification measurements are recorded in
`docs/work/frontend-react-router-framework-mode.md`. Independent review also
confirmed that the compare revalidation contract is exported under the native
framework name, fully awaited routes avoid duplicate hydration requests, the
two deferred Relay routes retain evidence-backed hydration, and the custom
server entry preserves framework-standard shell streaming. A final route-module
audit also replaced pass-through `clientLoader` functions with direct export
aliases everywhere no Framework-specific client behavior is attached.

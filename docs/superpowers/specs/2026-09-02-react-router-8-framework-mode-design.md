# React Router 8 Framework Mode Design

## Goal

Upgrade the Product Compare frontend from React Router 7.18.2 Data Mode to
React Router 8.3.1 Framework Mode while removing the hand-written routing,
static-handler, document-head, response, and route-typing infrastructure that
Framework Mode now owns.

## Decision

Use the approved full Framework Mode migration with explicit route
configuration and the standard React Router Node serve runtime. Keep small
custom client and server entries only where Product Compare must attach a Relay
environment and serialize the Relay record source across SSR hydration.

The package set is exact and aligned:

- `react-router`, `@react-router/dev`, and `@react-router/serve` 8.3.1
- `isbot` 5.2.2 for the framework-standard bot streaming decision in the custom
  Relay server entry
- `react` and `react-dom` 19.2.7, the minimum supported React version for
  React Router 8
- no `react-router-dom`, `@unhead/react`, or direct `@react-router/node`
  dependency unless implementation proves that the application imports the
  Node adapter directly

Node 24.18.1 satisfies React Router 8's Node 22.22 minimum. The installed
versions of Vite 8.2.0, TypeScript 5.9, Relay 21.0.1, StyleX 0.18.1, and Vitest
4.1 remain in place and must be proven together by the repository gates.

## Considered Approaches

### 1. Full Framework Mode with the standard serve runtime — selected

Adopt `react-router.config.ts`, the React Router Vite plugin, explicit
`src/routes.ts`, a Framework root route, generated route types, framework
entries, automatic code splitting, and `react-router-serve`. This removes the
largest amount of bespoke infrastructure while preserving narrow Relay hooks.

### 2. Framework Mode with a custom Node host

Use the same route modules and build, but maintain a custom Node listener around
`@react-router/node`. This offers control Product Compare does not currently
need and would retain server plumbing without a demonstrated Phoenix
integration requirement.

### 3. Incremental Data Mode upgrade

Upgrade packages while retaining `createBrowserRouter`, static handlers,
manual manifests, and the current document pipeline. This is the lowest-change
upgrade but fails the simplification objective and leaves the old and new
architectures adjacent.

## Framework Application Shape

`assets/src/root.tsx` owns the HTML document and exports Framework Mode
`Layout`, root loader/middleware, metadata, links, the application shell, and
the root error boundary. It renders React Router's `Meta`, `Links`,
`ScrollRestoration`, and `Scripts` components. The static `index.html`, Unhead
provider, route-handle metadata walker, and string-based head insertion are
removed.

`assets/src/routes.ts` explicitly maps the existing public URLs to route module
files. Route configuration remains explicit because Product Compare's URL
taxonomy is already deliberate, but the three hand-written `RouteObject`
configuration trees and lazy-import recovery wrapper are removed. Framework
route discovery and build-time route-module splitting own lazy loading.

Each route module exports the framework contracts it uses: default component,
`loader`, `clientLoader`, `clientAction`, `ErrorBoundary`, `meta`, `links`,
`headers`, or `shouldRevalidate`. It consumes generated `Route` types from its
local `+types` output rather than `LoaderFunctionArgs`, hand-built route
aliases, or test fixture types.

## Relay And Data Loading

The root server middleware creates one Relay environment for each document
request and stores it in React Router's typed load context before child loaders
run. The custom server entry reads that same environment and wraps
`ServerRouter` with the existing Relay provider.

The custom client entry creates one browser Relay environment, seeds it from
the SSR record-source script, supplies it through `HydratedRouter.getContext`,
and wraps the router with the Relay provider. The root document emits the
escaped Relay record source before React Router's scripts. React Router owns
route loader serialization; the application owns Relay records because React
Router cannot infer or hydrate Relay's normalized cache.

Relay-backed data routes share one feature-local preload implementation and
directly export it as both `loader` and `clientLoader`. Server document requests
use the request-scoped environment and browser navigations use the singleton
browser environment. Existing descriptor, lease, and preload-cache behavior is
retained because it is Relay lifecycle policy rather than routing machinery.
Fully awaited routes reuse serialized server loader data during hydration. The
revenue and CJ routes alone rerun their client loaders during hydration because
each intentionally returns an optional deferred Relay preload that can settle
after the root route serializes the normalized record source.

GraphQL request construction and `JSON.stringify` remain inside the existing
typed transport `try` boundary. This preserves the guarantee that unsupported
values such as `BigInt` become the established Relay network failure instead
of escaping synchronously.

## Navigation, Actions, And HTTP Semantics

Credential auth screens use Framework Mode `Form` and browser-side
`clientAction`/`clientLoader` contracts where that removes component-owned
submission and navigation plumbing. They continue to call GraphQL at
`/api/graphql` with browser credentials; Phoenix remains the cookie-backed
session authority and no REST auth or browser token contract is introduced.

Domain mutations keep Relay ownership when optimistic updates, connection
maintenance, or feature-specific mutation state make a route action a worse
owner. Revalidation uses React Router's native action/navigation semantics
where available and retains explicit Relay invalidation only for normalized
cache behavior React Router cannot provide.

Routes throw or return native React Router responses/data for redirects,
not-found results, and non-200 statuses. Framework Mode propagates status and
headers through the server entry. The hand-written response-header aggregator,
manual static-handler request, status special case, and wildcard status shim
are removed. The existing user-facing error presentation is retained behind
route-module error boundaries. The Relay-aware server entry follows the
framework default streaming policy: human requests receive the rendered shell,
while bots and SPA mode wait for `allReady`.

## Metadata And Links

Static and loader-dependent SEO move to route-module `meta` and `links`
exports. Canonical links use React Router metadata link descriptors and
structured data uses its JSON-LD descriptor. The root document renders the
framework metadata components once. This removes `@unhead/react`,
`RouteMetadata`, route metadata handles, and the custom SEO-to-head adapter
without changing titles, descriptions, canonical URLs, Open Graph data, or
structured data.

## Request Compatibility Boundary

Framework Mode eliminates the application's server-side reconstruction of the
incoming Fetch `Request`, so the existing server bridge is deleted if no
application-owned request reconstruction remains. Any test helper or adapter
that still constructs a request from a foreign realm must keep the
`Request.signal` bridge. Deletion requires an exact jsdom/Vitest cancellation
test proving that the Framework request reaches loaders without the cross-realm
constructor failure.

## Build And Type Generation

The React Router Vite plugin owns React transformation and HMR and is composed
with the existing Relay/StyleX Babel transform. The redundant direct React
Vite plugin and the post-transform class-name mangler are removed. Framework
route splitting can compile client and server module graphs independently, so
the extra mangling layer no longer has a sound cross-graph ownership point;
StyleX's compiler output remains deterministic without it.

`react-router.config.ts` enables SSR and uses the existing `src` application
directory and `dist` build directory. Package scripts use `react-router dev`,
`react-router typegen`, `react-router build`, and `react-router-serve`.

TypeScript includes `.react-router/types` through `rootDirs`; generated files
are build products and are not hand edited. Bundle and StyleX verification read
the Framework client output and manifest rather than the old Vite-only `dist`
shape. Phoenix remains the GraphQL/session host and its development watcher
continues to launch the frontend development command.

## Testing Strategy

Keep focused characterization of Relay preload, redirects/statuses, SEO,
authentication continuity, navigation, and user-facing failures. Prefer route
module exports, extracted UI components, SSR documents, and Playwright-visible
behavior over recreating the old `RouteObject` tree in tests. Do not force
typed application route modules through `createRoutesStub` when generated
Framework types and stub types model different route manifests.

Browser tests that stub GraphQL hydrate a static auth route first and then use
real client navigation to reach data routes, so the browser-owned mock observes
the same client-loader request path used in production. Direct auth-route tests
wait for hydration before submitting Framework forms.

Test fixtures use React Router 8 route contracts or call feature-local domain
loading functions directly. Obsolete React Router 7 argument fields and
home-grown `LoaderFunctionArgs` substitutes are deleted.

## Retained Custom Infrastructure

- Relay environment creation and normalized-record hydration: Framework Mode
  does not own Relay's record source.
- Relay route-preload descriptors, leases, and cache invalidation: these encode
  normalized GraphQL lifecycle and optimistic-update behavior.
- Relay-aware framework entries: the client installs and hydrates the browser
  environment, and the server provides the request environment while retaining
  the framework's human-shell/bot-complete streaming policy.
- GraphQL transport and typed failure normalization: this preserves endpoint,
  cookie, abort, JSON serialization, and Relay error semantics.
- StyleX and Relay Babel compilation: the React Router Vite plugin does not
  replace either repository-specific transform. StyleX constants register as
  the root route's first dependency so route-split modules see the same values
  in client and server builds.
- Vite dependency optimization inventory: Framework route discovery loads many
  dependency subpaths lazily. The explicit Vite 8 inventory prevents optimizer
  hash invalidation from aborting in-flight route modules; it contains only
  packages actually imported by the frontend.
- Phoenix `/api/graphql` and session handling: React Router is the frontend SSR
  runtime, not the application's API or authentication authority.

No other routing, request, response, head, lazy-loading, or route-type wrapper
is retained without a concrete failing contract proving it necessary.

## Verification And Completion

Run focused tests while migrating, then the exact pinned toolchain's Relay
validation, framework type generation plus TypeScript, lint, format, complete
Vitest suite, client/server production build, StyleX and bundle checks,
relevant Playwright flows, `git diff --check`, work-queue validation, and full
`mix ci`. Record exact test totals, build outputs, and the frontend
infrastructure line/file delta. Review the complete frontend diff for remnants
of both routing systems, duplicate abstractions, compatibility-only packages,
unnecessary defensive types, and behavior lost to over-aggressive framework
adoption before publication.

## Official Design Inputs

- [React Router v8 upgrade guide](https://reactrouter.com/upgrading/v7)
- [Adopting Framework Mode](https://reactrouter.com/upgrading/framework)
- [Framework route modules](https://reactrouter.com/start/framework/route-module)
- [Framework type safety](https://reactrouter.com/explanation/type-safety)
- [Framework testing](https://reactrouter.com/start/framework/testing)
- [React Router changelog](https://reactrouter.com/changelog)

## Implementation Self-Review

The implemented diff matches the selected approach. Framework Mode owns the
route manifest, module discovery and splitting, document metadata/links,
navigation forms/actions, status and redirect propagation, error boundaries,
request handling, and client/server build. The final audit removed the old
Data Mode router, static-handler and response pipeline, Unhead integration,
lazy route wrapper, class-name mangler, manual loader fixtures, and redundant
route types. The retained Relay, GraphQL transport, StyleX compiler, Vite
optimizer, and Phoenix boundaries are limited to the domain and toolchain
responsibilities listed above; no retained abstraction duplicates a React
Router Framework Mode guarantee.

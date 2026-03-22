# Frontend Relay Route-Data Design

## Context

The frontend under `assets/` already ships a Relay environment, compiler config, and authenticated GraphQL transport helper, but the route modules still fetch GraphQL manually through route-local `api.ts` files. Those modules own query strings, transport calls, payload parsing, and route state normalization for `/products`, `/products/:slug`, `/compare`, and the auth mutations.

That split leaves the app in an awkward middle state:

- Relay is installed, but route components do not use `graphql`, `usePreloadedQuery`, `useFragment`, or `useMutation`.
- `assets/src/__generated__/` has no committed Relay artifacts yet.
- React Router loaders are doing full DTO assembly instead of query preloading and route guarding.
- The `api.ts` filename now reads like a REST client even though the code is GraphQL-over-HTTP.

## Goals

- Make Relay the default frontend data path for browser and SSR route data.
- Keep React Router loaders, but narrow them to route-specific URL parsing, redirects, and Relay query preloading.
- Dehydrate the server Relay store into the SSR payload and hydrate the client environment from it so the first client paint reuses server-fetched data.
- Replace ambiguous route-local `api.ts` modules with explicit `loader.ts`, `queries/`, `fragments/`, and `mutations/` modules.
- Leave Phoenix as the `/api/graphql` session authority and avoid reopening the auth contract.

## Non-Goals

- Do not change the backend GraphQL schema as part of this slice.
- Do not widen the current browse/detail/compare product scope beyond the data already rendered today.
- Do not fold the saved-comparisons list/reopen/delete UI into the same slice; that should follow once compare route Relay adoption is stable.

## Chosen Architecture

### 1. Relay owns GraphQL documents and component data

Each route that currently fetches GraphQL manually should move to Relay-tagged operations and colocated fragments. Route components should read data through Relay hooks rather than from manually normalized DTOs.

- Query documents live under route-local `queries/`.
- Reusable UI slices use colocated fragments under `fragments/` when the route grows beyond a single component.
- Mutations move under route-local `mutations/` and are executed with `useMutation`.

### 2. React Router loaders stay, but only as preload/guard glue

The app already uses React Router SSR and route loaders successfully. Replacing that with a separate route-prepass system would be a larger rewrite than this repo needs. The cleaner compromise is:

- loaders parse params and query params,
- loaders handle local guards and redirects,
- loaders preload one or more Relay operations into a request-scoped environment when a route spans multiple existing GraphQL surfaces,
- route components render with Relay hooks instead of loader-built DTOs.

This keeps SSR parity and route ownership intact while removing the current manual GraphQL parsing layer.

### 3. SSR and hydration share one serialized Relay store snapshot

The current server render creates a Relay environment, but nothing seeds the client from the server store. This slice should add a small Relay SSR utility that can:

- create an environment from optional initial records,
- dehydrate the environment after the server loaders have preloaded matched route queries,
- inject that payload into the HTML bootstrap data,
- restore the client environment from the serialized records before hydration.

The result should be one network fetch on the server and store reuse on the first client render, not a second route-level fetch after hydration.

### 4. Naming becomes explicit

The end state should not keep route-local `api.ts` files for GraphQL work. Those modules should become one of:

- `loader.ts` for React Router loader code,
- `queries/*.ts` for Relay tagged queries,
- `mutations/*.ts` for Relay tagged mutations,
- `errors.ts` or `state.ts` for non-GraphQL route helpers.

That makes it obvious whether a file owns route orchestration, a Relay document, or UI state.

## Migration Order

1. Add Relay hydration/preload primitives.
2. Migrate `/products` browse first because it is the narrowest list query and already SSRs cleanly.
3. Migrate `/products/:slug` next, including the offers section, to prove a larger route query shape.
4. Migrate `/compare` and the save-comparison mutation once the product route queries are stable.
5. Migrate auth mutations so no route module still imports `fetchGraphQL` directly.
6. Requeue the saved-comparisons list/reopen/delete UI on top of the new compare route pattern.

## Alternatives Considered

### A. Keep the current loader DTO pattern and only rename `api.ts`

This is the smallest change, but it preserves the real problem: hand-written GraphQL strings and response parsing continue to spread through route code while Relay remains mostly decorative.

### B. Drop loaders entirely and use component-only Relay hooks

This is closer to a pure Relay app, but it fights the existing React Router SSR structure and would require a second route-discovery/preload system. That is too much churn for the current codebase.

### C. Keep loaders, but make them Relay preload/guard glue

This is the recommended approach. It fits the current app structure, removes the confusing manual fetch layer, and gets the user-visible benefits of “normal Relay” without rewriting the entire router.

## Risks And Mitigations

- Query ref serialization is not directly portable across SSR boundaries.
  - Mitigation: serialize Relay records plus route variables, then recreate preloaded access on the client from the restored environment.
- React Router loader tests are currently written around plain DTO payloads.
  - Mitigation: shift those tests toward rendered route behavior and add focused Relay preload/hydration tests for the new primitives.
- Saved-comparisons UI is queued today.
  - Mitigation: explicitly rebaseline the queue so Relay adoption lands first and the saved-comparisons route is built on the new path instead of extending the old one.

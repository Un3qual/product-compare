# Effect GraphQL Transport Pilot Implementation Plan

**Goal:** Prove Effect at one high-value frontend boundary by giving the Relay
GraphQL transport typed configuration, network, HTTP, and response-decoding
failures without spreading Effect through routes or React components.

**Architecture:** Keep `fetchGraphQL/3` as the stable Promise-returning Relay
interface. Build one internal Effect workflow for endpoint resolution, request
execution, status validation, and JSON decoding, then run that workflow at the
existing adapter boundary. Preserve browser credentials, SSR cookie and origin
forwarding, AbortSignal identity, top-level GraphQL responses, public error
messages, and the client bundle budget.

**Tech Stack:** TypeScript, Effect, Relay, Vitest, Vite, Rolldown, Oxc.

## Global Constraints

- Keep `fetchGraphQL/3` as the stable Promise-returning Relay interface.
- Confine Effect imports to the GraphQL transport and focused transport tests.
- Preserve browser credentials, SSR cookies and trusted origins, AbortSignal
  identity, endpoint rules, top-level GraphQL responses, and public error
  messages.
- Do not add a service registry, dependency-injection framework, generic error
  layer, route wrapper, React integration, retry policy, or fallback transport.
- Keep the client bundle within the existing 200,000-byte gzip budget.

## Task 1: Freeze The Transport Contract

**Files:**
- Modify: `assets/test/relay/fetch-graphql.test.ts`

- [ ] Add focused characterization for network failures, non-success HTTP
  responses, malformed JSON, abort propagation, browser credentials, and SSR
  forwarding.
- [ ] Run the focused suite and confirm only the new typed-failure expectations
  fail.

## Task 2: Introduce The Effect Boundary

**Files:**
- Modify: `assets/package.json`
- Modify: `assets/pnpm-lock.yaml`
- Modify: `assets/src/relay/fetch-graphql.ts`
- Modify: `assets/test/relay/fetch-graphql.test.ts`

- [ ] Add one exact Effect dependency through pnpm.
- [ ] Define narrow tagged transport failures and an internal Effect workflow;
  do not add a service registry, application layer, route wrapper, or React
  integration.
- [ ] Keep `fetchGraphQL/3` as the only Relay-facing adapter and preserve abort
  behavior and the existing response shape.
- [ ] Prove the typed workflow directly and the Promise adapter behavior
  through focused tests.

## Task 3: Verify The Pilot

- [ ] Run Relay validation, TypeScript, Oxc, focused transport/environment
  tests, the full frontend suite, client and SSR builds, and the bundle
  contract.
- [ ] Confirm Effect imports remain confined to the transport boundary and its
  focused tests.
- [ ] Record exact evidence in
  `docs/work/frontend-effect-graphql-transport.md`.
- [ ] Commit with `refactor: type graphql transport failures with effect`.

Exit condition: typed Effect failures cover the transport boundary, Relay still
receives the same Promise response contract, cancellation and browser/SSR
behavior are unchanged, Effect has not spread into application UI code, and
every frontend gate passes.

# Frontend Effect GraphQL Transport

## Snapshot

- Status: active
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-effect-graphql-transport-pilot-implementation-plan.md`
- Last verified: 2026-07-30 against the current Relay transport and focused
  transport suite.

## Target Outcome

The GraphQL transport uses one internal Effect workflow to model configuration,
network, HTTP, and response-decoding failures while Relay continues consuming
the stable Promise-returning `fetchGraphQL/3` interface.

## Validated Scope

- `assets/src/relay/fetch-graphql.ts` currently combines endpoint resolution,
  browser/SSR request construction, network exception normalization, HTTP
  validation, and unchecked JSON decoding in one async function.
- The boundary already has focused browser credential, SSR cookie/origin,
  AbortSignal, endpoint, and GraphQL-response tests.
- No Effect dependency or import exists today.
- The pilot is limited to the transport and its tests. Route loaders,
  components, mutations, and Relay environment APIs do not become Effect
  consumers.

## Boundaries

- Preserve abort identity and cancellation semantics.
- Preserve cookie-backed browser authentication and SSR forwarding.
- Preserve top-level GraphQL error responses for Relay to interpret.
- Do not create a service registry, dependency-injection framework, route
  wrapper, or generic error utility.
- The client bundle must remain below its existing 200,000-byte gzip budget.

## Verification

- focused transport and Relay environment tests
- Effect import-boundary scan
- Relay validation, TypeScript, and Oxc
- full frontend unit suite
- Vite client and SSR builds
- bundle contract
- `mix work_queue.validate`
- `git diff --check`

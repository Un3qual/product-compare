# Frontend Effect GraphQL Transport

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-effect-graphql-transport-pilot-implementation-plan.md`
- Last verified: 2026-07-30 with the complete frontend verification gate.

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
- Effect `3.22.0` is exact-pinned and only the lightweight `effect/Micro`
  runtime is imported. The full Effect runtime exceeded the client bundle
  contract; Micro preserves typed effect failures while keeping the initial
  client bundle at 173,129 gzip bytes.
- The pilot remains limited to the transport and its tests. Route loaders,
  components, mutations, and Relay environment APIs are not Effect consumers.

## Boundaries

- Preserve abort identity and cancellation semantics.
- Preserve cookie-backed browser authentication and SSR forwarding.
- Preserve top-level GraphQL error responses for Relay to interpret.
- Do not create a service registry, dependency-injection framework, route
  wrapper, or generic error utility.
- The client bundle must remain below its existing 200,000-byte gzip budget.

## Verification

- Focused transport and Relay environment tests: 23 passing.
- Effect import-boundary scan: only
  `assets/src/relay/fetch-graphql.ts` and its focused test import Effect.
- Relay validation, TypeScript, Oxlint, and Oxfmt: passing.
- Full frontend suite: 105 files and 1,512 tests passing.
- Vite client and SSR production builds: passing.
- Bundle contract: 589,055 raw / 173,129 gzip bytes across three initial
  JavaScript files, below the 200,000-byte gzip budget.
- Frozen pnpm install and `git diff --check`: passing.

## Delivered

- `fetchGraphQL/3` remains the stable Promise-returning Relay adapter.
- Configuration, network, HTTP, abort, and response-decoding failures are
  narrow tagged values inside one Effect Micro workflow.
- The Promise boundary retains existing public messages and returns original
  abort and decode failures by identity.
- Browser credentials, SSR cookie/origin forwarding, endpoint rules, and
  top-level GraphQL response behavior remain unchanged.
- No retries, services, dependency injection, React integration, route wrapper,
  or shared error abstraction was introduced.
- Implementation milestone: `17ad60f9`.

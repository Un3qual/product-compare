# Frontend GraphQL Transport

## Snapshot

- Status: complete; Effect pilot removed
- Priority: P1
- Original plan:
  `docs/superpowers/plans/2026-07-30-effect-graphql-transport-pilot-implementation-plan.md`
- Reconciliation plan:
  `docs/superpowers/plans/2026-07-31-platform-modernization-simplification.md`
- Last verified: 2026-07-31 against the direct Promise transport and focused
  Relay transport tests.

## Batch Outcome

Relay consumes the stable Promise-returning `fetchGraphQL/3` interface through
one direct `async`/`await` transport. Configuration, network, HTTP,
response-decoding, and abort behavior remain explicit without a second runtime
or tagged-failure adapter.

## Reconciled State

- `assets/src/relay/fetch-graphql.ts` directly owns endpoint resolution,
  browser/SSR request construction, network and HTTP failures, JSON validation,
  and abort identity.
- Browser credentials, SSR cookie/origin forwarding, GraphQL top-level error
  pass-through, configured endpoints, malformed/nonobject response handling,
  and abort signals remain covered at the Promise boundary.
- The former Effect/Micro workflow, tagged failures, package dependency, and
  lockfile entries are removed. Route loaders, components, mutations, and
  Relay environment APIs remain ordinary Promise consumers.

## Boundaries

- Preserve abort identity and cancellation semantics.
- Preserve cookie-backed browser authentication and SSR forwarding.
- Preserve top-level GraphQL error responses for Relay to interpret.
- Do not create a service registry, dependency-injection framework, route
  wrapper, or generic error utility.
- The transport must remain inside the combined initial JavaScript/CSS bundle
  contract.

## Verification

- Focused Select, transport, and community mutation run: 3 files and 26 tests
  passed.
- TypeScript and focused Oxfmt checks passed.
- The complete frontend check passed after dependency removal, including Relay,
  Oxc, Vitest, client/SSR builds, and the combined bundle contract.

## Delivered

- `fetchGraphQL/3` remains the stable Promise-returning Relay adapter.
- The Promise boundary retains existing public messages and returns original
  abort and decode failures by identity.
- Browser credentials, SSR cookie/origin forwarding, endpoint rules, and
  top-level GraphQL response behavior remain unchanged.
- No retries, services, dependency injection, React integration, route wrapper,
  or shared error abstraction was introduced.
- The original pilot milestone is preserved in repository history; the current
  direct transport landed in `ae8cb75e` with keyboard-regression follow-up in
  `cd966429`.

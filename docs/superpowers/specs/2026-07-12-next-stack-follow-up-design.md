# Next Stack Follow-Up Batches Design

## Status

Approved for autonomous execution under the user's standing instruction to
write plans normally and assume approval while completing the stacked PR run.

## Goal

Provide four additional executable frontend batches after the current four
presentation-boundary rows, without reopening deferred product scope or
creating wrapper-only abstractions.

## Discovery And Alternatives

Fresh source and test inspection considered three directions:

1. Fix one current functional gap and then extract three clear responsibility
   seams in unrelated routes.
2. Continue splitting the same compare, product-detail, catalog, and offer
   components already covered by the current queue.
3. Reopen deferred ingestion, eBay, production-readiness, or auth-delivery
   scope to create deeper product work.

Direction 1 is selected. Direction 2 risks over-abstraction immediately after
the existing decompositions, and direction 3 contradicts recorded product
decisions. The selected cohort combines a visible missing behavior with
evidence-backed maintainability work and has non-overlapping owned paths.

## Selected Batches

### Affiliate Setup Merchant Pagination

The affiliate loader and Relay query already accept `first` and `after` and
return `pageInfo`, but the route discards that pagination data and exposes no
way to reach additional merchant choices. The route will receive the existing
normalized pagination state, derive first/next links from the loaded
connection, and render the shared pagination primitive. Mutation contracts,
selection behavior, and Relay ownership remain unchanged.

### Merchant Directory View Boundary

The merchant route currently combines loader/Relay/error ownership with page
controls, local visible-page filtering, list markup, safe website links, empty
states, and pagination. A typed sibling view will own those presentation
concerns. The route keeps loader data, query reads, suspense/error boundaries,
and route-derived href construction.

### Saved Comparison View State

The saved-comparison route contains a cohesive block of pure deletion,
filtering, sorting, and status-message derivation beside Relay and mutation
orchestration. A small pure module will own that state derivation and its
contract tests. The route retains loader/query retainers, deletion mutation,
navigation paths, and UI state.

### Credential Auth Form Presentation

Login and registration duplicate the same email/password shell and field
markup while correctly keeping different Relay mutations and session outcomes
in their route owners. A typed `CredentialAuthForm` will own only the common
form presentation and accept route-specific copy, password autocomplete,
errors, pending state, links, and submit callback. The routes keep GraphQL
mutations, Phoenix session authority, viewer-cache updates, navigation, and
error resolution.

## Boundaries And Data Flow

- Browser data continues through GraphQL and Relay.
- URL and cursor serialization stays with route-owned helpers.
- Presentation components receive explicit typed values and callbacks; no
  render-prop framework, barrel, or generic form system is introduced.
- The saved-comparison module is pure and has no React, Relay, or router
  dependency.
- Auth browser contracts remain `viewer` plus GraphQL mutations over
  `/api/graphql`; no token or REST behavior changes.

## Error Handling

Existing route error and suspense boundaries remain authoritative. Pagination
links appear only when connection `pageInfo` and normalized cursor state make
them truthful. The refactors preserve existing empty, unauthorized, mutation,
transport, and malformed-data behavior rather than adding new fallbacks.

## Testing

Each batch uses TDD and an existing behavior suite:

- Affiliate setup: loader and route tests cover normalized cursor links and
  retained mutation behavior.
- Merchant directory: direct view tests cover controls, filtering, safe links,
  empty states, and pagination while the route suite preserves Relay behavior.
- Saved comparisons: a new pure-module suite covers deletion, filter, sort, and
  status derivation; the route-state suite remains green.
- Auth: direct credential-form tests cover route-specific copy and accessible
  fields while the session route suite preserves mutation and session behavior.

The five existing characterization files passed 93 tests together before
promotion on 2026-07-12.

## Self-Review

- No placeholders or deferred decisions remain.
- All four batches have disjoint source, test, and lane-document ownership.
- The selected seams preserve route data and mutation ownership.
- Previously completed feed-candidate, revenue-view, catalog-list, and offer-
  card extractions are not promoted again.

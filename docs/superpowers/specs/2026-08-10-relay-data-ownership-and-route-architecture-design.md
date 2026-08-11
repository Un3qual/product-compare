# Relay Data Ownership And Route Architecture Design

## Status

Approved in conversation on 2026-08-10 for one coordinated architecture cleanup.
This document is the durable contract for anonymous commerce identity, the
homepage GraphQL shape, Relay fragment ownership, route operation placement,
loader organization, and frontend import aliases.

## Problem

The production-home work introduced useful behavior, but it exposed several
architectural inconsistencies:

- trending activity combines authenticated and anonymous identities by
  concatenating tagged strings even though click sessions already store the
  identities in separate columns;
- real guest click paths do not currently supply a stable anonymous identity;
- homepage collections are fixed-size GraphQL lists rather than Relay
  connections, and the six-item presentation choice leaks into backend limits
  and frontend slicing;
- `HomeWorkspaceProduct` wraps a real `Product` instead of making the product
  the connection node and keeping homepage-only facts on the edge;
- route operations select most component data centrally, while reusable cards,
  rows, and list items rarely declare Relay fragments;
- many files under `queries/` contain only a GraphQL tagged node, while many
  `loader.ts` files repeat the same route-preload shell and export types to
  unrelated components; and
- frontend modules cross multiple directory levels through brittle relative
  imports because Vite and TypeScript do not expose local source aliases.

These are one data-ownership problem rather than six unrelated cleanups. The
GraphQL schema should expose stable domain identities, Relay components should
own the data they render, route modules should own route lifecycle behavior,
and imports should state architectural ownership without encoding directory
depth.

## Goal

Ship a Relay-native, SSR-safe frontend architecture in which:

- member and guest commerce activity have typed, separate identities;
- every growing homepage collection is a forward Relay connection;
- homepage product and deal connections normalize their real `Product` nodes;
- reusable components own meaningful GraphQL data requirements through
  colocated fragments;
- standalone query-only files and thin loader shells are removed;
- complex parsing and projection remain in purpose-named modules rather than
  moving into oversized route components; and
- cross-boundary frontend imports use stable local aliases.

The refactor must preserve current product behavior, URL state, SSR metadata,
canonical redirects, authentication, authorization, partial-failure behavior,
and the approved production UI.

## Considered Approaches

### 1. Homepage-only correction

Convert the homepage lists and fix anonymous activity without changing the
rest of the frontend ownership model. This is rejected because it leaves the
same query-file, loader-file, fragment, and import problems in every adjacent
route and guarantees the next feature will copy one of two competing patterns.

### 2. Literal fragment-per-component rewrite

Give every component a Relay fragment, including formatting helpers and
components that intentionally consume derived view models. This is rejected
because it couples pure presentation to GraphQL, creates generated artifacts
without meaningful ownership, and makes list-level sorting or comparison logic
harder to place.

### 3. Complete ownership cleanup with meaningful fragments (selected)

Apply the backend and route cleanup across the frontend, and perform a complete
fragment-ownership audit. Every reusable component that directly consumes a
GraphQL entity or meaningful GraphQL projection owns a colocated fragment.
Pure presentation components consuming intentional derived values do not.

This combines the breadth of a full Relay pass with a boundary that prevents
fragment proliferation and transport coupling.

## Architecture

The implementation has five milestone slices with one final acceptance
boundary:

1. typed anonymous visitor identity and relational constraints;
2. Relay-native homepage connections;
3. component-owned fragments across current GraphQL routes;
4. route operation and loader colocation; and
5. stable frontend source aliases and import migration.

Each slice uses a red-green test cycle and produces a reviewable milestone
commit. Later slices may adapt code introduced by earlier slices, but no slice
may preserve a transitional compatibility layer after all consumers have
moved.

## Anonymous Commerce Identity

### Storage

`commerce_click_sessions.user_id` remains the authenticated identity and
continues to reference `users.id`. Add an `anonymous_visitors` table following
the repository's relational identity convention:

- an internal bigint `id` primary key;
- a non-null generated UUID `entropy_id` with a unique index; and
- microsecond `inserted_at` and `updated_at` timestamps.

The table deliberately has no profile, fingerprint, account association,
activity counters, or mutable last-seen field. It is a first-class relational
identity and foreign-key target, not a visitor analytics model.

Replace the free-form `commerce_click_sessions.anonymous_id` text column with
`anonymous_visitor_id`, a nullable bigint foreign key to
`anonymous_visitors.id`. Use `ON DELETE SET NULL`, matching the existing user
deletion behavior: removing an identity detaches it from historical clicks
without deleting attribution and conversion records.

Add a named same-row check that prevents `user_id` and
`anonymous_visitor_id` from both being populated. A click may still have
neither identity when it comes from an internal or legacy path; such clicks
remain valid attribution records but never contribute to trending identity
thresholds. The owning Ecto changeset must provide equivalent pre-write
validation, an explicit `check_constraint/3` mapping, a changeset behavior
test, and direct database coverage.

### Existing data migration

The migration must preserve equality groups without assuming existing text
values are UUIDs. It will:

1. create `anonymous_visitors` and its unique entropy-ID index;
2. add nullable `commerce_click_sessions.anonymous_visitor_id` with its foreign
   key and lookup index;
3. build a transaction-local mapping from each distinct, nonblank legacy
   `anonymous_id` to one newly inserted visitor row;
4. backfill guest clicks with the mapped internal visitor IDs;
5. leave the new anonymous value null when `user_id` is present, matching the
   existing user-first trending semantics;
6. add the named mutual-exclusion check; and
7. drop the legacy text column and temporary mapping.

Repeated legacy strings must resolve to one visitor row, while distinct legacy
strings resolve to distinct rows. The reverse migration restores a text
anonymous ID from each related visitor's entropy UUID before removing the
foreign key and visitor table, preserving identity equality even though it
cannot recover the original opaque legacy text. The migration must not rewrite
user identities or expose visitor IDs through GraphQL.

### Browser lifecycle

A narrowly scoped web plug owns a signed, HTTP-only first-party visitor UUID
cookie. The cookie value is the visitor row's entropy UUID, never its internal
primary key. The plug verifies an existing signed UUID or generates one, makes
the UUID available to trusted click-tracking code, and renews or sets the
cookie with `SameSite=Lax`, a deliberate long-lived maximum age, and secure
transport in production.

Visitor rows are created lazily when a guest performs a tracked commerce
click, not on ordinary page views. The commerce-attribution visitor boundary
resolves or inserts the cookie entropy UUID through a unique constraint and an
atomic conflict-safe insert, then persists the resulting internal foreign key
on the click. Concurrent first clicks carrying the same cookie must converge on
one visitor row without a read-then-insert race.

Authenticated clicks skip visitor lookup and persist only `user_id`. Browser
GraphQL input does not accept an arbitrary visitor ID. Direct and GraphQL
tracked-click paths use the same server-owned identity selection. Invalid or
forged cookies are replaced rather than accepted.

### Trending aggregation

Remove the `"u:"` and `"a:"` SQL concatenation. For each product, trending
activity computes:

`count(distinct user_id) + count(distinct anonymous_visitor_id)`

The mutual-exclusion constraint makes the sum an exact count of qualifying
activity identities. The anonymous count uses internal visitor foreign keys;
it does not join or group by cookie UUIDs. Ordering, seven-day boundaries, the
five-identity threshold, active-offer qualification, and the rule that identity
counts are never exposed remain unchanged.

## Relay-Native Homepage Contract

### Connection boundaries

Growing homepage collections become forward connections with standard
`first`, `after`, `edges`, and `pageInfo` fields:

- `HomeWorkspace.products` uses a dedicated homepage-product connection whose
  edge node is the existing Relay `Product` node;
- `HomeWorkspace.categories` uses a category connection whose node is the
  existing meaningful SEO category projection;
- `HomeDeals.new`, `HomeDeals.trending`, and `HomeDeals.forYou` use one
  homepage-deal connection whose edge node is the existing Relay `Product`
  node.

Homepage-only facts belong on connection edges:

- workspace-product edges expose specification highlights and the current
  homepage offer summary;
- deal edges expose the offer summary and typed reason list.

`HomeWorkspaceProduct` and `HomeDeal` wrapper objects are removed. Product
identity, cache normalization, and cross-route equality come from the existing
`Product` node and global ID.

### Intentionally bounded lists

The following remain lists because their cardinality is a product invariant,
not an unbounded result set:

- selected comparison products, capped at the canonical three-product limit;
- specification highlights, capped by the homepage presentation contract; and
- deal reasons, a small typed explanation set.

These fields must not be wrapped in ceremonial connections.

### Pagination and limits

The shared GraphQL connection boundary validates cursors and caps requested
page sizes. Homepage domain reads accept an explicit validated window and apply
stable SQL ordering plus `LIMIT`/`OFFSET` sufficient to determine
`hasNextPage`. Hidden six-row caps and frontend `.slice(0, 6)` calls are
removed.

The homepage route requests a named six-item presentation page size. That
number belongs to the route's product design, not to domain query defaults.
The current UI does not add load-more controls merely because the API is now a
connection, but returned `pageInfo` must be truthful and subsequent cursors
must work.

Viewer fallback deals preserve current semantics. When a signed-in viewer has
no private matches, the fallback combines new and trending results in stable,
deduplicated order before applying the requested connection window.

### Query budgets and privacy

The connection migration must not introduce per-row product reads. Products,
highlights, offers, categories, and viewer relevance remain set-based or
request-batched. Query-budget tests cover small and maximum connection windows,
and anonymous requests must perform no private alert or saved-comparison work.

## Relay Fragment Ownership

### Ownership rule

Every reusable component that directly reads a GraphQL entity or meaningful
GraphQL projection owns a fragment in the same source file. Route operations
compose those fragments. Component props receive generated fragment keys, and
the component calls `useFragment` at its boundary.

The audit includes current product cards and rows, homepage ledger and deal
rows, category summaries, merchant rows, offer cards, comparison products,
saved comparisons, alert and watch rows, API-token rows, CJ-program rows,
attribution rows, and product community/offer sections where those components
directly consume server data.

### Deliberate non-fragment components

Do not add fragments to:

- buttons, badges, labels, layout primitives, feedback, disclosures, or
  pagination controls;
- formatting utilities and path builders;
- components whose public input is an intentional derived view model;
- mutation-only controls that need only caller-owned IDs and labels; or
- one-off rendering helpers that do not establish a reusable data boundary.

When a parent needs scalar fields for page-level sorting, filtering, pricing
comparison, or URL construction, it may select those minimal fields alongside
a masked child fragment. The child still owns its rendering fields. Relay
deduplicates overlapping selections in the compiled operation.

### Pagination ownership

Existing URL-driven pagination remains URL-driven. A connection-owning
component declares a normal masked fragment and receives the route query's
current connection page. Do not introduce `usePaginationFragment` or
client-owned pagination where it would replace canonical URL state.

Use `usePaginationFragment` only for an existing component-owned load-more
interaction, with a stable `@connection` key and refetchable parent. This pass
does not change navigation behavior solely to demonstrate a Relay API.

### Fragment masking and nodes

Remove current `@relay(mask: false)` usage where a component fragment can own
the fields. New fragments remain masked by default. Non-node projections may
have fragments when they represent meaningful GraphQL concepts, but wrappers
that merely contain a real node plus presentation facts must become connection
edges.

## GraphQL Operation Placement

Delete standalone source files whose only responsibility is exporting one
GraphQL query.

- A route's top-level query is declared in the route module that owns the
  loader and renders the query.
- An auxiliary query used by one component is declared beside that component.
- Mutations stay beside the control or cohesive operations module that owns
  their behavior; this design does not split useful mutation logic merely to
  achieve colocation.
- Generated Relay artifacts remain under `src/__generated__` and are never
  hand-edited.

After migration there is no `routes/**/queries/` architecture. A new
query-only wrapper file requires a concrete reason beyond keeping GraphQL text
separate from its consumer.

## Route Loader Organization

Each route module exports its React component and React Router loader from the
same lazy-loaded module. The router loads one module per lazy route instead of
coordinating separate component and loader imports.

The loader remains responsible for behavior React Router needs before render:

- request cancellation;
- query preloading and descriptor creation;
- 404 and authorization results;
- canonical redirects;
- SSR document metadata;
- URL parsing and validated variables; and
- explicit degraded or partial-data outcomes.

Do not remove a loader responsibility merely to make the file smaller.
Instead, move substantial pure logic to purpose-named modules such as route
data, pagination, filters, metadata, or view-state modules. Shared transport
mechanics continue to live in the existing Relay route-preload boundary. Do
not add a generic loader factory, configuration DSL, or inheritance layer.

All `loader.ts` files are removed after their public types move to the owning
route or an existing responsibility-named module. Components must not import
domain types from a generic loader file.

## Frontend Import Aliases

Configure matching Vite and TypeScript aliases:

- `$ui/*` maps to `src/ui/*`;
- `$routes/*` maps to `src/routes/*`;
- `$relay/*` maps to `src/relay/*`; and
- `$generated/*` maps to `src/__generated__/*`.

Use aliases for imports that cross these source boundaries. Keep `./` relative
imports within one feature directory so local cohesion remains visible.
Migrate frontend tests to the same aliases when they import application code.

Prefer direct aliased module imports such as
`import { Button } from "$ui/primitives/Button"`. Do not create a universal UI
barrel solely to shorten that to one import; direct modules preserve tree
shaking, avoid circular dependencies, and make ownership explicit. Small
existing responsibility-specific export surfaces may remain when they already
provide a coherent public API.

## Error Handling And Compatibility

- Invalid pagination arguments return the repository's existing stable
  GraphQL connection errors.
- Aborted route requests continue to propagate instead of rendering fallback
  UI.
- Homepage workspace and deal failure remain independently recoverable.
- Auth, privacy, canonical redirect, metadata, and partial-product behavior
  remain unchanged.
- Relay store records for homepage products use the same global Product IDs as
  browse, detail, offer, and comparison routes.
- Signed visitor cookie failure is fail-closed: the supplied value is ignored
  and replaced.
- No compatibility field preserves the old homepage list shape after all
  frontend operations migrate; the schema and frontend land in the same
  coordinated branch.

## Testing Strategy

Follow test-driven red-green-refactor cycles for every milestone.

### Identity coverage

- anonymous-visitor changeset, unique entropy-ID, click foreign-key, deletion,
  and direct-database tests;
- changeset and direct-database tests for the user/visitor mutual-exclusion
  check;
- migration coverage for repeated legacy IDs, authenticated legacy rows,
  blank/nil IDs, and mapping equality;
- signed-cookie tests for reuse, generation, forgery replacement, production
  flags, and guest/member precedence;
- concurrent first-click coverage proving one visitor row is created for one
  signed entropy UUID;
- GraphQL and direct redirect tests proving guest visitor persistence without
  accepting a browser-supplied identity; and
- trending tests proving separate user/visitor counts, collision resistance,
  duplicate suppression, ignored unidentified clicks, and unchanged time and
  qualification boundaries.

### GraphQL coverage

- schema/introspection tests for connection types and the removal of wrapper
  objects;
- first-page, subsequent-cursor, zero-page, invalid-cursor, maximum-window,
  stable-order, and truthful `pageInfo` behavior;
- canonical Product IDs across every homepage connection;
- edge-field correctness for highlights, offers, and reasons;
- viewer privacy and fallback behavior; and
- constant query-budget assertions as page size and activity volume grow.

### Frontend coverage

- Relay compiler validation for every colocated fragment and operation;
- component tests using real Relay fragment keys and test environments rather
  than untyped object casts;
- route behavior tests for metadata, redirects, 404s, authorization, aborts,
  fallbacks, query disposal, pagination, and SSR hydration;
- import-resolution coverage through TypeScript, Vitest, client build, and SSR
  build; and
- the existing production homepage Playwright journeys and accepted desktop,
  tablet, and mobile visual baselines.

### Final gates

Run focused tests after each milestone, then the complete unpartitioned backend
suite, backend quality/type/format gates, Relay generation and validation,
frontend type/lint/format/unit/build gates, the exact homepage Playwright suite,
bundle budget, queue validation, and diff hygiene.

## Non-Goals

- Anonymous visitor profiles, visitor analytics APIs, cross-device identity
  merge, account linking, fingerprint data, or mutable visit statistics beyond
  the identity row required by the approved foreign key.
- Browser-provided visitor IDs or fingerprinting from IP address, user agent,
  or other request diagnostics.
- Connections around fixed-size value lists.
- Client-owned pagination replacing shareable URL state.
- Fragments on pure presentation primitives or derived view models.
- A generic route-loader factory, route DSL, GraphQL code-generation wrapper,
  or universal UI barrel.
- Visual redesign, new homepage sections, marketing content, or changes to
  current user-facing language.
- Hand editing Relay artifacts or weakening current privacy, authorization,
  SSR, metadata, error, or query-budget contracts.

## Acceptance Criteria

- Guest browser clicks reference one persisted anonymous-visitor row through an
  internal foreign key, member clicks carry only their user foreign key, and
  PostgreSQL prevents a click from carrying both.
- Signed visitor entropy UUIDs are resolved through a race-safe unique insert;
  ordinary page views do not create visitor rows, and visitor deletion detaches
  historical clicks without deleting attribution records.
- Trending activity contains no tagged string concatenation and counts
  distinct user and visitor columns correctly.
- Every growing homepage collection is a valid forward Relay connection with
  truthful cursors and page information.
- Homepage workspace and deal edges normalize the same Product nodes used by
  the rest of the graph; `HomeWorkspaceProduct` and `HomeDeal` no longer exist.
- The backend no longer contains a hidden six-row homepage cap, and the
  frontend no longer slices GraphQL results to six.
- Every reusable GraphQL-data component found by the ownership audit either
  owns a colocated masked fragment or has a documented derived-view-model
  reason not to.
- No route query-only directories or `loader.ts` files remain, and no generic
  loader abstraction replaces them.
- Cross-boundary frontend imports use the approved aliases while same-feature
  imports remain local.
- Existing route behavior, SSR, authorization, privacy, pagination, accepted
  visuals, complete backend/frontend tests, and production bundle budget all
  pass on the final branch.

# Production UI Redesign Design

## Status

Approved interactively on 2026-08-10. This document is the durable design for
written-spec review before implementation planning.

## Problem

ProductCompare is functionally broad and well tested, but its frontend still
reads as an implementation-complete utility rather than a production product.
The existing routes expose useful catalog, offer, comparison, account, and
operator behavior, yet the visual hierarchy, product identity, responsive
density, and cross-route continuity are not strong enough for a public launch.

The redesign must not turn the application into a corporate marketing site.
The homepage and every route start with useful product work: search, browsing,
comparison, current prices, saved decisions, status, or operator action. The
program preserves the existing GraphQL, Relay, React Router SSR, session-auth,
and domain behavior unless an approved UI outcome requires a deliberate new
read model.

## Goal

Ship one coherent, production-ready ProductCompare interface across public,
account, setup, and operator routes. The completed product must feel
recognizable, useful, responsive, accessible, resilient under partial failure,
and trustworthy about why information appears.

## Approved Direction

Use a **system-spine then route-cohort** program:

1. establish the visual system, shared application shell, useful homepage, and
   homepage read contracts;
2. apply the stable system to Discover & Evaluate routes;
3. apply it to Compare & Return routes;
4. apply it to Account & Setup routes; and
5. apply it to Operations routes.

Each cohort is an independently shippable and reviewable outcome. The shared
spine is a prerequisite; later cohorts may proceed in parallel only when their
owned paths are disjoint and the live queue contract permits it.

## Scope

### In scope

- a distinctive but restrained visual system;
- a useful, search-first homepage with a compact product ledger;
- comparison continuity on the homepage and relevant shopper routes;
- a small new, trending, and signed-in relevant-deals surface;
- responsive behavior designed by information priority rather than shrinkage;
- consistent navigation, route shells, controls, tables/lists, feedback, and
  destructive-action presentation;
- plain user-facing language across public, account, setup, and operator pages;
- localized loading, empty, degraded, and mutation-failure behavior;
- self-hosted typography, reduced-motion behavior, accessibility automation,
  deterministic visual regression coverage, and production verification gates;
  and
- the backend and GraphQL read contracts required by the homepage and deal
  module.

### Out of scope

- a marketing or campaign landing page;
- changing the browser auth contract away from GraphQL and Phoenix sessions;
- replacing Relay, React Router, StyleX, Radix, or the existing SSR pipeline;
- a new general-purpose design-system package, styling framework, or animation
  library;
- inferred sensitive interests, cross-site behavior, or opaque personalization;
- email delivery, live conversion-provider ingestion, eBay ingestion, or new
  discussion/community product features;
- operator dashboards beyond redesigning the already shipped CJ-program and
  revenue-reporting workspaces; and
- unrelated backend refactors.

## Visual Thesis

ProductCompare is a warm, precise buying workspace: mineral canvas, warm paper,
decisive ink, comparison blue, and source-freshness green. Personality comes
from the comparison interaction itself rather than decorative chrome.

The recurring identity cues are:

- a compact asymmetric compare mark;
- stable numbered product selections across browse, detail, tray, and matrix
  surfaces;
- a narrow freshness/source signal rail on rows whose current information is
  decision-relevant;
- compact mono labels for prices, timestamps, counts, and technical metadata;
  and
- direct action language such as `Add product`, `Open comparison`, `Why this
  deal`, and `Last checked`.

Use a self-hosted humanist variable sans family for interface hierarchy and a
self-hosted compact mono family for data labels. Instrument Sans and IBM Plex
Mono are the approved design targets. They must be bundled with the application
instead of loaded from a third-party font service. The implementation may use
the corresponding maintained package artifacts or checked-in font assets, but
must preserve licensing notices and the bundle budget.

## Composition And Content Plan

Application routes do not use marketing heroes. A public or authenticated route
is composed from:

1. persistent navigation and route orientation;
2. the primary working surface;
3. secondary context or a narrow inspector when it materially helps a decision;
4. localized feedback beside the affected work; and
5. one clear primary action per region.

Use whitespace, alignment, typographic scale, dividers, and muted fills before
adding containers. A box is justified when it is the interactive object, such
as a selected comparison item, form group, dialog, or bounded feedback state.
Do not build dashboard-card mosaics or wrap every section in a raised panel.

## Interaction Thesis

Motion communicates state and continuity:

- selected comparison items shift smoothly when a product is added, removed,
  or reordered;
- filter and sort results use a short opacity/position transition so the update
  is legible without blocking interaction; and
- Radix overlays, disclosures, and dialogs use consistent 120–180 ms presence
  transitions.

No page-opening animation, scroll spectacle, parallax, or ornamental loop is
part of the product. Reduced-motion mode removes movement while preserving the
same state feedback and focus behavior. Existing CSS and Radix state attributes
are sufficient; do not add a motion library solely for this program.

## Useful Homepage

The approved homepage is a balanced workbench, not a landing page.

### First viewport

- A search field accepts product names, categories, and model numbers and
  routes to the existing ranked catalog search.
- A comparison-continuity strip appears only when selected product slugs are
  present. It uses stable selection numbers and opens the canonical comparison
  URL.
- Category shortcuts provide direct entry to catalog scopes.
- A bounded product ledger previews useful products without duplicating the
  entire catalog.

### Product ledger

Desktop width must be earned by decision information. The ledger aligns these
visual columns:

- product identity;
- category-specific key specifications;
- best current offer and merchant;
- a truthful price signal;
- last-checked/source freshness; and
- compare and detail actions.

The ledger is one semantic list of product articles, not separate desktop and
mobile DOM trees. Tablet removes secondary columns before stacking regions.
Mobile keeps product identity, best current offer, comparison action, and
detail access visible; secondary facts move into an accessible disclosure.
Actual comparison matrices remain semantic tables with deliberate horizontal
overflow when their two-dimensional relationship cannot be collapsed.

The default homepage preview uses the existing ranked catalog ordering and
shows at most six eligible products. An eligible preview product satisfies the
existing public catalog rules, has at least one displayable specification
highlight, and has an active in-stock offer whose latest price observation is
no older than 24 hours. Category selection links to the full catalog rather
than turning the homepage into a second fully stateful filter application.

### Deals module

The homepage includes a deliberately small `New & trending deals` region below
the primary product workspace. Deals never displace search, browsing, or
comparison from the first decision hierarchy.

The three logical views are:

- **New:** an active offer for which the earlier of the offer insertion time and
  its first price observation is within the previous 72 hours, and whose latest
  in-stock price observation is within the previous 24 hours.
- **Trending:** an active offer with at least five distinct first-party
  activity identities during the rolling seven-day window and a current landed
  price below that product's rolling 30-day landed-price median. An activity
  identity is the authenticated user id when present and otherwise the
  anonymous id. Click sessions with neither identity do not count toward the
  threshold. The UI never exposes activity counts or identity data.
- **For you:** a signed-in viewer's products from explicit price watches, saved
  comparisons, and the current URL-backed comparison selection. Price-watch
  target matches rank first, followed by saved/current comparison matches;
  price improvement and observation freshness break ties.

`For you` appears only when the viewer is signed in and at least one qualifying
deal exists. Otherwise the module defaults to `New`; it does not render an
empty personalization pane. Guests receive only `New` and `Trending`.

Every deal carries a typed reason code plus the facts required to explain it,
such as the price-watch target, prior median, merchant, and observation time.
The frontend maps those values to plain copy. No server-supplied arbitrary
marketing sentence and no frontend reimplementation of ranking policy is
allowed.

## Navigation And Comparison Continuity

The URL remains the canonical unsaved comparison state. Relevant home, browse,
product-detail, offer, and comparison links preserve normalized repeated
`slug` parameters. The home route renders the comparison strip from those
parameters after bounded product lookup.

Do not add local-storage comparison authority. This avoids SSR hydration drift,
conflicting state, and selections that cannot be shared. Signed-in saved
comparisons remain the explicit long-term persistence path. A direct homepage
visit without comparison parameters simply omits the continuity strip.

Desktop navigation exposes the high-frequency shopper destinations directly.
Authenticated and operator-only destinations move into clearly labelled menus
when horizontal space is constrained. Mobile keeps search and the comparison
state reachable in the first navigation layer; it does not rely on a
horizontal-scrolling link strip.

## Route Cohorts

These cohorts are visual and implementation ownership boundaries. They do not
change current route authorization, session requirements, or operator policy.

### Cohort 1: System Spine And Home

- theme primitives and self-hosted fonts;
- application shell, responsive navigation, page/workspace layouts, focus and
  feedback primitives;
- approved useful homepage;
- comparison continuity;
- bounded homepage product summaries; and
- new, trending, and viewer-relevant deals.

### Cohort 2: Discover And Evaluate

- `/products`;
- `/categories/:slug`;
- `/products/:slug`;
- `/offers`;
- `/merchants`; and
- `/merchants/:slug`.

The cohort makes product identity, specifications, current price, availability,
merchant context, freshness, and compare actions consistent across discovery
surfaces.

### Cohort 3: Compare And Return

- `/compare`;
- `/compare/saved`;
- `/compare/shared/:token`; and
- `/account/alerts`.

The cohort applies stable numbered selections, readable comparison density,
clear differences, saved/shared status, row-scoped actions, and price-change
context across the decision lifecycle.

### Cohort 4: Account And Setup

- login, logout, registration, verification, and password-recovery routes;
- `/account/api-tokens`; and
- `/affiliate/setup`.

The cohort prioritizes consequences, recovery, one-time values, ownership, and
destructive-action clarity. It does not change the GraphQL/Phoenix session
contract.

### Cohort 5: Operations

- `/ingestion/cj-programs`; and
- `/commerce/revenue`.

These remain dense utility workspaces. Provider, advertiser-program,
commission, and revenue terms are acceptable when they are the operators'
actual domain language. Marketing layout and schema-implementation vocabulary
are not.

## Plain-Language Boundary

Internal precision stays in code, schemas, GraphQL, tests, logs, and operator
diagnostics. Public and account UI must make sense without knowledge of the
data model.

Required translations include:

| Internal term | User-facing language |
| --- | --- |
| evidence | details, source, last checked, or price history |
| taxon | category |
| merchant product | offer |
| source artifact | source |
| current attributes | specifications |
| qualification | why this product appears here or meets category requirements |
| recommendation profile | buying priority |
| persisted snapshot | saved or shared comparison |

Do not perform blind string replacement. Copy is chosen for the local meaning.
Headings, helper text, empty states, errors, dialog copy, metadata, and document
titles are all included in this review boundary.

## Frontend Architecture

Keep the existing platform:

- React 19;
- React Router route loaders and SSR;
- Relay query and mutation ownership;
- StyleX authored styles plus semantic CSS variables;
- Radix primitives behind local wrappers; and
- the existing route-level Suspense and resettable error boundaries.

Evolve existing owners before adding parallel abstractions:

- `AppShell`, `PageShell`, `WorkspaceLayout`, `ContextRail`, and the theme token
  files own shared layout and material;
- local primitive wrappers own focus, size, semantic state, and reduced-motion
  behavior;
- pure route view-data modules translate GraphQL data into plain labels and
  display states;
- a product-ledger component is shared only where the same row contract and
  responsive behavior are genuinely reused;
- comparison continuity owns normalized numbered selection presentation; and
- the deals component renders typed deal rows but does not rank them.

Do not introduce a configurable dashboard component, a page-schema renderer,
one component with route-kind flags, or a new generic data-display DSL. Route
composition remains route-owned.

## Homepage Data Architecture

Keep the current root viewer loader limited to viewer/session navigation data.
Homepage data belongs to the index route so non-home routes do not pay for it.

The index route preloads two independent logical operations:

1. **Home workspace:** category shortcuts, at most six product summaries, and
   selected comparison-product summaries for normalized URL slugs.
2. **Home deals:** new/trending rows plus viewer-relevant rows when authorized.

The workspace is essential. The deals operation is optional and isolated: a
deal timeout or GraphQL failure renders a local retry state while the rest of
the homepage remains useful. The index loader must preserve request aborts and
SSR dehydration through the existing Relay route-preload boundary.

Backend responsibilities stay with their domains:

- Catalog selects bounded products, saved-comparison product ids, category
  identity, and display metadata;
- Specs returns category-appropriate specification highlights in one set-based
  read;
- Pricing returns current best landed price, merchant, active-offer count,
  observation time, first-seen time, and rolling median inputs in set-based
  reads;
- Alerts supplies the current viewer's watched product ids and targets;
- Commerce Attribution supplies only thresholded aggregate first-party
  activity identities; and
- the GraphQL resolver composes these typed domain results into the two logical
  homepage payloads.

The implementation may choose schema-conventional field names, but must not
create one all-purpose dashboard payload or issue product-detail queries per
row. Query-budget tests compare small and maximum homepage result sets and
require per-table SELECT counts to remain fixed as rows grow.

## Error And Degraded-State Contract

- Loading retains the route title, filters, and stable geometry; only unresolved
  data rows use skeletons.
- Empty states explain the active scope and offer one relevant next action.
- A deal failure does not hide product search, categories, product rows, or
  comparison continuity.
- A product-summary failure retains search and category navigation and exposes a
  route-local retry.
- Mutation failures preserve input and selection and render on the affected row
  or control.
- Route error boundaries use plain resource names and recovery actions.
- Auth/session degradation preserves the current safe guest behavior.

No user-facing error includes GraphQL type names, field names, schema terms,
provider secrets, raw ids, or stack/runtime wording.

## Responsive Contract

- Desktop uses width for meaningful product, specification, offer, price,
  freshness, and action columns.
- Tablet removes or discloses secondary columns before stacking whole regions.
- Mobile keeps product identity, current offer, comparison status, and next
  action immediately reachable.
- Context rails stack after the primary workspace when the side-by-side layout
  no longer has readable measure.
- Touch targets meet the component-system minimum; no meaning or action is
  hover-only.
- Comparison matrices may scroll horizontally with sticky identity context;
  ordinary product ledgers must not cause page-level horizontal overflow.

## Accessibility Contract

- Preserve skip navigation, landmark structure, logical headings, visible focus,
  and focus restoration.
- Use one semantic content tree per responsive component.
- All controls have accessible names derived from user-facing language.
- Status and mutation results use appropriate live-region behavior without
  repeatedly announcing unrelated content.
- Color is never the sole carrier of price, availability, selection, or error
  meaning.
- Reduced-motion mode has behavior parity.
- Automated accessibility checks supplement explicit keyboard/focus tests; they
  do not replace them.

## Verification Strategy

Every cohort uses focused red/green behavior cycles and ends with the complete
production gate appropriate to its touched surfaces.

### Frontend behavior

- pure view-data and path tests;
- component tests for loading, empty, partial failure, mutation failure,
  destructive confirmation, focus, keyboard use, and plain-language copy;
- route-loader abort, degraded, Relay descriptor, and SSR hydration tests;
- responsive tests for primary-column retention and no duplicated semantic
  content; and
- existing affected route suites.

### Backend and GraphQL

- exact deal eligibility, ordering, and fallback tests at the 72-hour,
  24-hour, seven-day, five-identity, and 30-day boundaries;
- owner privacy and authorization tests for watches and saved comparisons;
- tests proving no viewer-specific candidate leaks into another viewer or guest
  response;
- semantic payload tests before query-count assertions;
- small-versus-maximum fixed query-budget tests; and
- resolver error and missing-data behavior.

### Browser and visual quality

- deterministic Playwright journeys at representative desktop, tablet, and
  mobile widths;
- seeded visual snapshots after self-hosted fonts are ready;
- automated accessibility scans on the homepage and one representative route
  from each cohort;
- explicit keyboard-only flows for navigation, search, compare selection,
  dialogs, disclosures, tables/lists, forms, pagination, and retry states;
- reduced-motion and no-horizontal-overflow checks; and
- client and SSR build verification.

### Repository gates

- Relay validation/generation as appropriate;
- TypeScript typecheck;
- lint and format checks;
- complete frontend unit tests;
- frontend client/SSR builds and bundle budget;
- focused and complete backend tests for backend-touching cohorts;
- backend type and quality gates;
- `mix work_queue.validate`; and
- `git diff --check`.

A cohort is not complete because selected screenshots look polished. All
meaningful route states and the production gate must pass.

## Rollout And Queue Contract

The implementation plan must create substantive queue rows matching the five
approved outcomes. Per-file styling, font installation, individual components,
individual routes, responsive breakpoints, and test suites are internal slices,
not separate queue rows.

The system-spine row owns the shared foundation and homepage contract. Later
rows may depend on its stable primitives without reopening its visual decisions.
If implementation discovers a shared requirement outside a cohort's owned
paths, the worker records a blocker instead of silently widening scope.

Each cohort closes with:

- observed before/after behavior;
- plain-language review;
- focused and full verification evidence;
- responsive screenshots at the approved widths;
- updated lane and queue state; and
- a milestone commit containing code, tests, and truthful docs together.

## Completion Criteria

The program is complete when:

- the approved visual system and useful homepage are shipped;
- all four route cohorts use the same production system without route-specific
  visual drift;
- user-facing pages contain no accidental internal domain vocabulary;
- new, trending, and viewer-relevant deal reasons are truthful, private, and
  tested;
- comparison continuity is URL-authoritative and SSR-safe;
- desktop, tablet, and mobile preserve the approved information hierarchy;
- loading, empty, degraded, and mutation-failure states are localized and
  useful;
- accessibility, visual regression, browser, SSR, bundle, frontend, backend,
  and queue gates pass; and
- the live queue and plan catalog truthfully record completion without reviving
  internal slices as follow-up filler.

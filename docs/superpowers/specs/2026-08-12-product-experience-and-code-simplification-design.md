# Product Experience And Code Simplification Design

## Status

Approved in written form on 2026-08-12. Implementation is dispatched through
the six cohort plans listed in `docs/plans/INDEX.md`.

This document amends the production UI direction in
`docs/superpowers/specs/2026-08-10-production-ui-redesign-design.md`. Where the
two documents differ, this document controls the product-detail, comparison,
authentication-continuity, operator, development-seed, metadata, sitemap, and
code-simplification work described below.

## Problem

The production UI foundation is stronger than the route experiences built on
top of it. Product detail still spreads decision information across a redundant
overview, a passive specification list, individually scoped merchant charts,
and a narrow action rail. Comparison and operator screens expose complete
behavior but use layouts that compress the information users need. Guests who
attempt account-backed shopper actions receive implementation-level
authorization failures and lose continuity.

The code has a related structural problem. Several frontend files introduce
manual types, validation, projection, and fallback layers around values already
typed by Relay. Route features are split into many generically named `*-data.ts`
files while genuinely overloaded component files remain hundreds of lines
long. The root of `assets/src` contains entrypoint, routing, and declaration
files with mixed responsibilities. Similar overvalidation exists in backend
paths after public inputs have already crossed a validated boundary.

The remedy is not indiscriminate deletion. URL parameters, browser storage,
network failures, third-party callbacks, authorization, database constraints,
and cross-row concurrency are real boundaries. The design removes redundant
interpretation inside trusted typed code while retaining one clear validation
owner at each untrusted boundary.

## Goals

- Make product pages useful decision workspaces rather than tabbed data dumps.
- Let shoppers select several product specifications and open a catalog result
  filtered by all of them.
- Present a truthful product-wide price history across merchants.
- Preserve shopper work when authentication becomes necessary.
- Make comparison and operator screens readable without losing behavior.
- Make development data dense and varied enough to exercise the real product.
- Replace hand-built XML and metadata plumbing with maintained libraries.
- Remove displayed slugs, redundant adapters, recreated Relay types, repeated
  bigint checks, and unjustified validation or fallback layers.
- Reorganize route source by recognizable product responsibilities while
  reducing the total number of trivial files.
- Find and remediate similar issues in the touched route, root, and backend
  boundaries rather than limiting the work to the originally named files.

## Non-Goals

- A fuzzy product-similarity or recommendation engine.
- Arbitrary numeric similarity tolerances.
- A new frontend framework, state-management framework, design system, or
  generic repository abstraction.
- Replacing GraphQL, Relay, React Router SSR, StyleX, Phoenix sessions, Ecto, or
  PostgreSQL authority.
- Combining currencies, inventing unavailable values, or inferring price
  history before an observation exists.
- Silently submitting account-backed actions after authentication.
- Removing validation required by the repository's database constraint
  contract or weakening authorization, ownership, concurrency, redirect, or
  external-URL protections.
- Universal barrel files, route-wide barrels, or barrels over generated Relay
  artifacts.
- New operator products beyond improving the shipped affiliate, CJ, and revenue
  workflows.

## Delivery Strategy

Use cohort-led restructuring:

1. characterize the current behavior and failure states;
2. reorganize only the route cohort being changed;
3. add the approved behavior test-first;
4. run focused and full verification; and
5. commit the coherent code, test, generated artifact, and lane evidence
   together.

Do not perform a repository-wide file move before behavior work. Do not add new
features to files already approved for removal and defer cleanup until later.
Each cohort owns its relevant restructuring so reviewers can evaluate behavior
and structure together.

The live dispatcher must be reconciled before execution. Existing ready UI rows
whose contracts forbid backend, GraphQL, router, or shared-infrastructure edits
cannot silently absorb the product-wide chart, auth continuity, or metadata
work. The coordinator will revise or replace those rows while preserving the
ready-row floor and non-overlapping ownership.

## Product Detail Workspace

### Page hierarchy

Remove the `Overview` tab. Its useful facts become a persistent decision header
above the remaining tabs:

- product identity, brand, and model;
- best current price and merchant when comparable;
- active offer count;
- freshness as a relative date with an exact-date tooltip; and
- a short set of meaningful specifications selected by existing category
  ordering rather than a hard-coded product-type switch.

The remaining tabs are `Specifications`, `Offers`, and `Reviews & Q&A`. The
header remains visible as the shopper switches tabs. Product slugs never render
as identity or metadata.

### Specification filter composer

Specifications remain grouped, readable rows. Each filterable row has a clear
selection affordance. Selection behavior is:

- enum and boolean values default to exact matching;
- numeric values default to `Same` and may be edited to `At least` or `At
  most`;
- selected specifications combine with AND semantics;
- text or otherwise unsupported specification types remain readable but are
  not presented as filterable;
- selecting the first specification opens the filter drawer; and
- selection survives group changes, product-detail tab changes, and browser
  back/forward navigation for the same product.

The selected state is stored as a versioned, product-scoped session value. It
contains only attribute identifiers, typed values, units, and comparison modes;
it contains no account or credential data. Invalid or obsolete stored entries
are discarded at this browser-storage boundary.

The drawer is a centered, height-limited bottom sheet on desktop and a
full-width sheet on narrow screens. Its collapsed tray shows the selection
count, `Clear`, and the primary `Show matching products` action. Expanded, it
shows every selected filter with remove and edit controls. Numeric controls live
in the drawer rather than crowding the specification rows.

Submitting opens `/products` with the existing catalog filter URL contract.
Enum and boolean filters map to exact filters. Numeric modes map as follows:

- `Same`: `min=value` and `max=value`;
- `At least`: `min=value`; and
- `At most`: `max=value`.

The catalog URL is the shareable source of truth after navigation. The product
page does not introduce a second catalog filtering implementation.

### Product-wide price chart

The product page shows one 90-day chart above merchant offer rows. It is not
derived from the currently paginated offers. A new product-level GraphQL read
projection covers all qualifying active merchant products for the requested
product and window.

The backend owns price-series semantics and Decimal arithmetic. It returns
separate currency groups and deterministic time points. For each time point:

- a merchant contributes its latest known in-stock item price at or before the
  point;
- an out-of-stock observation removes that merchant until a later in-stock
  observation;
- the lowest value is the minimum of known merchant values;
- the average is the Decimal mean of known merchant values;
- the merchant identity that supplied the lowest value is retained; and
- no value is carried backward before the merchant's first known observation.

The opening state may use the last qualifying observation before the requested
window, clearly as the value carried into the window. The projection is bounded
to the approved 90-day presentation window and a deterministic display
resolution so an active product cannot create an unbounded response.

The UI modes are:

- `Lowest` by default, with each point colored for its winning merchant;
- `Average`; and
- `By merchant`, with all merchant lines in one plot.

Merchant colors are stable for the loaded product. Tooltips identify merchant,
value, currency, and exact timestamp. The chart never joins different
currencies. If more than one currency exists, the UI presents an explicit
currency selector or separate labeled groups rather than implying
comparability. The accessible data table remains available to assistive
technology.

TanStack Charts may emit internal class names such as `ts-chart-host`. Those are
third-party implementation hooks, not authored styling. ProductCompare styles
charts through the chart theme API and a StyleX-owned wrapper. Application CSS
and tests must not select or assert TanStack's internal class names.

## Comparison Experience

Replace the narrow comparison context rail with a wide toolbar above the
comparison content. It contains:

- stable selected-product chips with remove controls;
- `Add product` when capacity remains;
- save and share actions; and
- concise status feedback.

The toolbar wraps deliberately at narrow widths without squeezing product names
into unreadable columns. Shared specifications, differences, and all
specifications are navigation tabs immediately above the specification matrix,
not under the page header or around unrelated content.

Replace `Individual product details` with curated product summaries. Each
summary contains identity, description when useful, current buying position,
meaningful differentiators, and a link to the full product page. It does not
render slugs, generic property dumps, or every available field. Captured shared
comparisons continue distinguishing immutable captured facts from current live
facts.

## Authentication Continuity

Account-backed shopper actions detect a guest before mutation submission and
open a modal. The modal:

- explains the requested benefit in context;
- offers `Sign in`, `Create account`, and `Cancel`;
- preserves the untouched form behind it; and
- restores focus correctly when cancelled or closed.

Supported pending intents initially include price watches and saving a
comparison. Each intent has an explicit schema and version and stores only the
minimum safe draft: product or ordered comparison identity, watch rule, amount,
currency, and a validated relative return path. Arbitrary forms, credentials,
secrets, and operator mutations are never serialized.

Login and registration remain GraphQL mutations backed by the Phoenix session
cookie. Their return path must be relative and same-origin. After successful
authentication the shopper returns to the originating surface with the draft
restored for review. The application never silently creates the watch or saves
the comparison. Server-side authorization remains authoritative if the viewer
state changes or a request bypasses the modal.

## Relative And Exact Dates

Use relative dates when recency is the decision signal, including price checks,
offer freshness, recent content, and ordinary lifecycle updates. Render a
semantic `<time dateTime>` value and expose the exact localized timestamp on
hover, keyboard focus, and touch-accessible disclosure.

Keep exact dates primary for financial reporting ranges, coupon expiration,
scheduled expiration, security-sensitive events, and operator reconciliation.
These fields may include relative context as secondary copy. Server-rendered
relative labels use an explicit render-time reference so hydration does not
change their text immediately.

## Operator Workspaces

Operator routes use dense workspaces rather than consumer cards or oversized
headings.

Affiliate setup becomes a guided sequence: network, program, merchant link,
then coupon. Existing records and status remain visible beside the relevant
step. CJ programs become a lifecycle ledger with status, last change, required
action, and row-local controls; program feeds and unmatched feeds retain
independent expansion, pagination, loading, and error state. Revenue keeps one
control band, an aligned metric strip, and attribution rows with expandable
conversion details. Summary and ledger failures remain independent.

Operator language replaces implementation jargon only where the internal term
does not help an operator act. Investigation identifiers and exact timestamps
remain available where operationally useful. Existing mutations, optimistic
concurrency, nullable facts, pagination regions, one-time values, and
authorization are preserved.

## Realistic Offline Development Data

The scale, runtime-profile, deterministic-generation, and profile-reconciliation
details in this section are superseded by
`docs/superpowers/specs/2026-08-14-scalable-realistic-development-data-design.md`.
The behavioral scenarios and safety constraints below remain authoritative.

Extend the existing deterministic, domain-oriented seed system rather than
replacing it. The target dataset includes:

- approximately 30 believable products across several brands and existing
  product types;
- enough specification combinations to exercise exact, minimum, maximum,
  shared, differing, missing, and unsupported filter states;
- six to eight merchants with overlapping product coverage;
- several offers per representative product, including fresh, aging, stale,
  unavailable, unobserved, and inactive cases;
- six to twelve months of deterministic price history with merchant crossovers,
  stable periods, stock changes, and at least one separate-currency scenario;
- varied coupons and validity states;
- more saved comparisons, watches, alerts, reviews, questions, answers,
  corrections, clicks, conversions, CJ records, and revenue rows; and
- enough rows to exercise pagination and empty/partial states through different
  accounts.

Use stable, authored product and merchant facts rather than random generation or
names such as `Sample 1`. Reuse a small checked-in set of category-appropriate
development images or intentional fallbacks so the dataset remains fully
offline. Preserve role-specific accounts, immutable seed ownership, scoped
reconciliation, unrelated local data, the pending-correction empty-baseline
rule, and the ban on network, provider, scheduler, job, or mail delivery calls.

## Metadata And Sitemap Boundaries

Use Unhead's React integration as the document-head owner. Route loaders provide
typed metadata values; route components register title, description, robots,
canonical, Open Graph, Twitter, and structured data through the library. The
server render creates and renders one head instance; hydration adopts that
state without duplicate tags. Structured data stays data, not concatenated
markup, and untrusted values never enter an unsafe head API.

Remove `route-metadata-data.ts`, the manual deepest-match record inspection,
and manual tag-policy projection after equivalent SSR, hydration, canonical,
indexability, structured-data, and deduplication behavior is characterized.

Use Saxy's XML element builder and encoder for sitemap indexes and URL sets.
Keep the current dynamic Phoenix endpoints and sitemap partitioning. Do not add
filesystem generation, cloud storage, scheduled pinging, or a sitemap framework
whose lifecycle the application does not need. Tests parse the generated XML
and assert namespaces and values rather than relying only on substrings.

## Commerce Redirect Naming

Keep public URLs unchanged but rename controller actions after their behavior:

- `redirect_tracked_click` resolves and redirects an already recorded click ID;
  and
- `track_merchant_product_click` validates navigation, records a new outbound
  merchant-product click, then redirects through the recorded click.

The same-origin, destination, attribution, anonymous-visitor, and not-found
behavior remains unchanged.

## Type And Validation Provenance

### Source-of-truth order

Every frontend type must have an identifiable owner. Use this precedence:

1. Relay-generated operation, fragment, enum, input, and payload types for
   GraphQL data;
2. library types for React Router, Relay runtime, Base UI, TanStack, Unhead, and
   browser APIs;
3. a domain type for application state that does not exist in either source;
4. a local component prop type for an intentional projection.

Do not recreate a type at level 3 or 4 when level 1 or 2 already expresses it.
Do not widen generated scalar fields to `unknown` and then rebuild their schema
with `typeof`, `Array.isArray`, or record guards.

### Concrete frontend removal targets

The audit starts with, but is not limited to, these known clusters:

- remove the hand-written `react-relay.d.ts` API recreation when the installed
  package and official type package cover the used hooks; keep only a narrowly
  named augmentation for a demonstrated upstream gap;
- retain the narrow `babel-plugin-relay.d.ts` shim: verified installed
  `babel-plugin-relay` 21.0.1 ships no TypeScript declarations, while
  `assets/stylex-plugin.ts` imports its default plugin; do not remove or
  relocate this required declaration unless a real upstream declaration source
  is adopted and verified;
- replace manual `ProductFiltersInput`, numeric, boolean, enum, and sort types
  with the types generated for the catalog operation;
- replace the manual price-watch enum and input/payload types with the generated
  mutation types and remove `priceWatchRuleTypeFromValue`;
- use typed select items or one library-boundary narrowing point for Base UI's
  callback, including an explicit policy for Relay's `%future added value`
  sentinel, rather than a domain-wide fallback helper;
- replace manual affiliate, API-token, alert, community, comparison-save,
  sharing, and tracked-click payload shapes with their generated mutation data
  types;
- stop declaring GraphQL-selected offer, coupon, price-point, page-info, and
  connection fields as `unknown` in view-model files;
- remove record guards around values that came directly from a successfully
  typed Relay operation; and
- remove one-use defensive fallback functions whose only effect is replacing a
  valid generated value with a generic default.

The audit must search every route source file, not only files named in the user
report. A manual type or validator stays only when its review note names the
boundary it protects.

### Checks that remain

Retain focused validation at these boundaries:

- URL and route parameters;
- `FormData` and third-party widget callbacks whose library API is wider than
  the application choice set;
- versioned `sessionStorage` pending intents;
- network, transport, and partial GraphQL error envelopes not represented by an
  operation's successful data type;
- external URLs, redirect destinations, and same-origin return paths;
- SSR bootstrap data read from the document;
- public GraphQL global IDs before conversion to database integers;
- Relay cursor decoding and arithmetic; and
- database changesets, constraints, row locks, and transactions required by
  the repository contracts.

Retained checks happen once at the boundary and return a trusted typed value.
Downstream code does not repeat them.

### Bigint and backend validation

Keep PostgreSQL bigint range enforcement at decoded public integer IDs and
Relay offset arithmetic, where oversized untrusted values could otherwise reach
PostgreSQL. Remove repeated maximum-ID filtering from internal lists and
context calls after those values have crossed the public boundary.

For backend invariants, identify one domain owner. Remove repeated resolver and
context checks when a prior boundary already returns the required typed value.
Retain changeset validation plus `check_constraint/3` and direct database
coverage for application-owned same-row checks, because those layers serve
different user-feedback and race-safe database responsibilities. Keep unique,
foreign-key, and cross-row invariants database- or transaction-authoritative;
do not replace them with preflight queries.

## Route And Root Source Organization

### Organization rules

- A route entry owns its operation, loader/action, top-level state boundary,
  and page composition.
- Split by recognizable user capability, not mechanically into `components`,
  `hooks`, `utils`, `styles`, and `data` folders.
- Merge a helper into its sole consumer when it only maps props, supplies copy,
  or wraps one function.
- Keep substantial URL serialization, Decimal comparison, chart aggregation,
  pagination state, and multi-consumer domain transformations separate and name
  them after that responsibility.
- A subfolder must represent a capability, not one component.
- Tests follow the surviving responsibility. Existing tests do not justify
  retaining an unnecessary production file.
- The restructure should reduce the total number of trivial files even though
  genuinely overloaded files split.

### `assets/src` root

- Keep `entry.client.tsx` as a minimal client bootstrap.
- Keep `entry.server.tsx` as a minimal server-render orchestration entry and
  move request adaptation, stream readiness, response-header composition, and
  HTML/bootstrap insertion into focused SSR modules.
- Split the route registry into shopper, auth/account, and operator route
  groups while retaining router creation, lazy-import recovery, and root
  revalidation in the root router module.
- Remove `react-relay.d.ts` if official types pass. Preserve only proven gaps as
  narrow declarations under a dedicated type boundary.
- Retain the narrow root `babel-plugin-relay.d.ts` declaration: the verified
  installed 21.0.1 package has no declaration source and `stylex-plugin.ts`
  consumes its default import. Do not remove or relocate this shim without a
  verified replacement declaration source.
- Keep `vite-env.d.ts` only if Vite/TypeScript still require it.

Moving code out of the root is not success by itself. Every new destination
must own a concrete SSR, routing, or typing responsibility.

### Route cohorts

- `products/` keeps the product route and gains capability folders for
  `specifications`, `offers`, and `community`. Split review, question, answer,
  submission, and moderation lifecycles out of the current overloaded
  community files. Merge their one-use copy and projection helpers into the
  owning capability.
- `compare/` separates `live`, `picker`, `sharing`, `saved`, and immutable
  `shared` capabilities. Keep substantial specification comparison logic
  separate under a responsibility name. Merge tiny mutation, name, selection,
  and tab-navigation data files into their owners.
- `catalog/` separates filter URL/form behavior from results. Keep its
  substantial decimal and URL parser; merge route-only, list-only, form-only,
  and status-only helpers.
- `offers/` separates discovery from the tracked commerce-click boundary.
  Merge card-only projection and click-only fallback files into their owners.
- `account/alerts` separates watch and alert-row lifecycles. `account/api-tokens`
  separates creation, token rows, rotation, and revocation instead of retaining
  one 500-line generic route-data file.
- `auth/continuity` owns the new modal intent and restoration contract. Tiny
  reset and verification helpers merge into their routes unless they gain a
  second real consumer.
- Affiliate setup separates network, program, merchant-link, and coupon steps.
  CJ separates program lifecycle from feed inspection. Revenue separates
  summary controls from attribution and conversion details.
- Real cross-route boundaries such as relative date presentation, mutation
  transport, safe external URLs, and loader recovery move out of the route root
  into narrowly named infrastructure. Delete generic remnants such as
  `form-data.ts` when the native API is clearer.

### Barrel files

Add `index.ts` only to stable leaf directories whose consumers commonly import
several public siblings. Do not add barrels to route registries, generated
Relay artifacts, large feature trees, or dependencies where the barrel would
hide ownership, create cycles, or pull unnecessary modules into a chunk.
Source-boundary imports remain explicit, and the production bundle gate must
show no regression.

## Similar-Issue Audit

Within every owned cohort, search for adjacent instances of:

- displayed slugs or implementation vocabulary;
- generic `*-data.ts` or `*-view-data.ts` files with only one consumer;
- manual GraphQL enums, inputs, payloads, connections, and selected-node types;
- `unknown` fields that are already generated as typed scalars;
- repeated record, array, string, bigint, and enum checks after a trusted
  boundary;
- fallback functions that hide contract violations instead of representing a
  real partial state;
- direct metadata or XML string construction;
- non-StyleX application styling coupled to third-party internal classes;
- route files that own several distinct workflows;
- tiny files that obscure rather than isolate behavior; and
- backend validations repeated across resolver, context, changeset, and query
  layers without distinct responsibilities.

The audit is scoped to the touched product, compare, account, operator, root,
SEO, pricing, seed, and adjacent shared-boundary paths. It is not authorization
for an unrelated repository rewrite.

## Error Handling

- Product history failure leaves identity, specifications, and offers usable.
- Offer failure leaves product identity and specifications usable.
- Community failure remains localized to reviews and Q&A.
- Auth modal cancellation is not an error and leaves the draft untouched.
- Expired or invalid pending intents are discarded with ordinary explanatory
  copy, never submitted partially.
- Metadata failure falls back to route defaults without emitting malformed or
  duplicate tags.
- Sitemap encoding failure returns a server error and is logged; it does not
  emit partial XML as a successful response.
- Operator summary and detail regions retain independent loading, retry, and
  failure boundaries.
- Generated Relay types define successful payload shape. Transport failures and
  server-reported mutation errors use the shared Relay error boundary rather
  than per-route ad hoc record inspection.

## Testing And Verification

### Behavior-first cycles

Before moving existing code, add or confirm characterization for every affected
capability. New behavior begins with a failing test that fails for the intended
reason. File-only moves must keep the characterized suite green without
weakening assertions.

### Focused acceptance

- Product tests cover removal of Overview, persistent decision facts, no
  displayed slugs, drawer selection/edit/removal/clear, AND-filter URLs,
  session restoration, all chart modes, sparse history, stock changes,
  merchant crossover, and currency separation.
- Backend chart tests cover Decimal lowest/average values, opening state,
  inactive offers, missing observations, deterministic bounding, and query
  count.
- Comparison tests cover the wide toolbar, tab placement, curated summaries,
  responsive wrapping, and immutable-versus-live copy.
- Auth tests cover modal choice, cancel/focus restoration, same-origin return
  paths, restored drafts after login and registration, expiry, and no automatic
  submission.
- Relative-date tests cover semantic time values, deterministic SSR, exact-date
  tooltip access by mouse, keyboard, and touch, and exact-primary exceptions.
- Metadata tests cover SSR, hydration, canonical URLs, robots, Open Graph,
  Twitter, structured data, XSS safety, deduplication, and route fallback.
- Sitemap tests parse index and URL-set documents and verify XML namespaces,
  escaping, locations, modification dates, empty partitions, and content type.
- Seed tests run the seed twice, verify counts and representative scenarios,
  preserve unrelated developer rows, preserve pending-correction baselines,
  and prove no external side effects.
- Type-provenance tests are primarily compile-time: deleting manual types must
  leave Relay validation and TypeScript clean. Focused runtime tests remain only
  for true untyped boundaries.
- Backend simplification retains direct tests for every surviving validation,
  constraint, authorization, and concurrency owner.

### Browser and visual acceptance

Run deterministic desktop, tablet, and mobile journeys for product filtering,
chart interaction, comparison controls, authentication continuity, affiliate
setup, CJ lifecycle, and revenue details. Include keyboard-only operation,
axe, reduced motion, tooltip/dialog focus, drawer behavior, and page-level
no-overflow assertions.

### Complete gates

- focused frontend and backend suites for each milestone;
- Relay compiler validation;
- TypeScript, lint, formatting, unit tests, client build, SSR build, StyleX
  mangling, and bundle budget through `cd assets && pnpm run check`;
- backend formatting, compile/type, quality, and full test gates through the
  repository's established Mix commands;
- `mix work_queue.validate`; and
- `git diff --check`.

Fresh output is required before a completion claim or milestone commit.

## Implementation Cohorts

This program is too broad for one implementation plan. After written approval,
create separate executable plans and queue outcomes for:

1. frontend and SEO foundations;
2. product discovery and evaluation;
3. comparison, return, and authentication continuity;
4. operator workspaces;
5. realistic offline development data; and
6. cross-stack type, validation, and residual slop remediation.

The type-and-validation audit is applied during every cohort and completed by
the residual remediation cohort. It is not postponed wholesale until the end.

### Residual cohort batch boundary

The cross-stack residual remediation is one queue row and one reviewer
decision. Its frontend simplification work is an internal milestone, not a
second batch beside the consolidated outcome. The shared acceptance invariant
is that types, validation, fallbacks, and file boundaries remain only at their
real ownership boundary while current behavior and fail-closed contracts stay
intact.

Execution uses these milestone commits inside that one batch:

1. refresh the repository inventory and promote the exact owned paths;
2. replace recreated declarations and manual GraphQL types with official or
   generated ownership;
3. merge trivial route indirection and finish relative-date adoption;
4. remove repeated bigint and backend validation after trusted boundaries; and
5. run the repository-wide anti-slop review and complete gates.

The inventory is coordinator curation and cannot be promoted as a standalone
implementation outcome. It must also discard stale targets that earlier
cohorts already removed. Split the backend work into a successor only if the
fresh trace discovers a materially different reviewer decision, such as a
database schema change, public API contract change, migration, or concurrency
redesign. Ordinary path separation or differing test commands are not enough
to split the batch.

## Traceability To Reported Issues

| Reported issue | Design owner |
| --- | --- |
| 1, 2 | Product decision header and specification drawer |
| 3 | Realistic offline development data |
| 4 | TanStack chart boundary and StyleX wrapper |
| 5 | Product-wide price projection and chart modes |
| 6 | Authentication-continuity modal and pending intents |
| 7, 9, 11 | Comparison toolbar, tab placement, and curated summaries |
| 8 | Relative and exact dates |
| 10 | Product and comparison identity rules plus similar-issue audit |
| 12 | Selective stable-leaf barrels |
| 13 | Operator workspaces |
| 14 | Commerce redirect naming |
| 15 | Saxy sitemap encoding |
| 16 | Unhead metadata ownership |
| 17-21, 24 | Route/root simplification and responsibility-led organization |
| 22 | Relay-generated enum and input ownership |
| 23 | Public-boundary-only bigint enforcement |
| 25 | Backend validation provenance and database contract |

## Approval Criteria

The written spec is ready for implementation planning when it contains no
unresolved design choices, every reported issue maps to a design owner, retained
validation has a named boundary, and no cohort silently widens an existing
ready row's ownership or prerequisites.

# Route Policy Data Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep established frontend route surfaces maintainable by
extracting their deterministic form, summary, path, normalization, and view-
state policy into small, framework-free contracts without changing user
behavior, and directly characterize the shared external-destination safety
boundary used by offer and merchant surfaces.

**Architecture:** Extraction tasks create or extend a small framework-free
TypeScript owner beside their React consumer. React components retain Relay
reads and mutations, router integration, local state, effects, boundaries, and
semantic presentation.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript 5.8, Vitest, Bun,
StyleX.

## Global Constraints

- Follow test-driven development and verify RED before creating each module.
- Keep data modules free of React, Relay, router, StyleX, and Radix imports.
- Preserve exact field normalization, URL parameters, item ordering, fallback
  copy, mutation nullability, and unavailable/error behavior.
- Keep tests behavioral; do not add source-string assertions.
- Update the owned lane doc and commit code, tests, and evidence together.

---

### Task 1: Affiliate Setup Route Data Contract

**Files:**

- Create: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Create: `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `docs/work/frontend-affiliate-setup-demo-parity.md`

**Interfaces:** The pure module produces merchant choices and summaries plus
network, program, link, and coupon mutation variables from scalar form values.
The route retains Relay operations, request guards, form reset behavior,
selection state, feedback, boundaries, and presentation.

- [x] Write pure tests for invalid merchant nodes, selected summaries, required
  and optional trimming, currency casing, date normalization, invalid dates,
  and every mutation-variable shape; run them and verify the missing-module
  failure.
- [x] Extract the deterministic policy and adapt `FormData` to scalar values at
  the route boundary.
- [x] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 2: Offer Discovery Filter Data Contract

**Files:**

- Create: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- Modify: `assets/src/routes/offers/loader.ts`
- Modify: `assets/src/routes/offers/paths.ts`
- Create: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-offer-discovery-demo-parity.md`

**Interfaces:** The pure module returns the form reset key, ordered active-filter
summary items, selected-product detail path, reset visibility, merchant-clear
path, and sort label. The component retains form and semantic list markup,
links, controls, and StyleX.

- [x] Write pure tests for default and selected product summaries, optional
  brand and merchant rows, status/page/sort labels, reset visibility, encoded
  product paths, merchant clearing, and future sort fallbacks; verify RED.
- [x] Extract the cohesive deterministic filter policy without changing form
  defaults or URL construction. Keep page-size defaults, ordered sort options,
  sort types, and unknown-sort normalization in one framework-free owner shared
  by the loader, path builder, and form.
- [x] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 3: Catalog Browse Route Data Contract

**Files:**

- Create: `assets/src/routes/catalog/browse-route-data.ts`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Modify: `assets/src/routes/compare/paths.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Create: `assets/test/routes/catalog/browse-route-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`
- Review fix docs: `docs/work/index.md`, `docs/plans/INDEX.md`, and
  `docs/work/frontend-product-offers.md`

**Interfaces:** The pure module derives the canonical browse pathname, product
detail path, add/selected/full compare actions, and selected-item removal paths
from the current filters and compare selection. `BrowseRoute` retains Relay
reads, route location, Suspense and error boundaries, layout, and presentation.

- [x] Write pure tests for root-path normalization, encoded detail paths,
  preserved compare selection, add/selected/full actions, maximum selection,
  and removal ordering; verify RED.
- [x] Extract only deterministic route/path policy and keep Relay-derived
  availability decisions in the route owner.
- [x] Run the pure and existing browse suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Review fix: centralize compare slug normalization, addition, and path
  serialization in the framework-free `compare/paths.ts` owner; preserve
  loader exports for existing route consumers and add direct whitespace, blank,
  duplicate, ordering, and maximum-selection coverage.
- [x] Review fix verification: RED failed because `normalizedCompareSlugs` was
  not exported; GREEN passed 69 catalog tests and 109 compare-route tests,
  TypeScript, the `browse-route-data.ts` -> `compare/paths.ts` framework scan,
  and `git diff --check`. `mix work_queue.validate` was sandbox-blocked by
  Mix PubSub TCP permission (`:eperm`).
- [x] Final branch-review fix: remove false maximum configurability from
  `createBrowseRouteData` and use `compare/paths.ts`'s canonical
  `MAX_COMPARE_PRODUCTS` for normalization, actions, and serialization.
- [x] Final branch-review verification: the pure and browse route suites passed
  69 tests, TypeScript and the transitive framework scan passed, and the
  reactivated product-offers lane now points only to current source and tests.

---

### Task 4: Product Detail Route Data Contract

**Files:**

- Create: `assets/src/routes/products/product-detail-route-data.ts`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Create: `assets/test/routes/products/product-detail-route-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interfaces:** The pure module derives the selected detail tab, overview
summary items, encoded product-detail and compare-selection paths, and the
add/selected/full compare action. `ProductDetailRoute` retains Relay reads,
router location and navigation, Suspense and error boundaries, detail-tab
presentation, layout, and child panels.

- [x] Write pure tests for explicit and fallback tabs, offer-cursor fallback,
  overview counts, encoded product paths, preserved unrelated search and hash
  state, compare selection order, add/selected/full states, maximum selection,
  and selected-item removal; verify RED.
- [x] Extract only deterministic route policy and keep Relay-derived product
  availability and router side effects in the route owner.
- [x] Run the pure and existing detail suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Review fix: remove the falsely configurable detail compare maximum and
  use `compare/paths.ts`'s canonical `MAX_COMPARE_PRODUCTS` for selection,
  actions, compare links, browse links, and removal links.
- [x] Review fix verification: the pure and existing detail suites passed 67
  tests, TypeScript and the transitive framework scan passed, and independent
  re-review found no remaining actionable issues.

---

### Task 5: Compare Picker Data Contract

**Files:**

- Create: `assets/src/routes/compare/compare-picker-data.ts`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Create: `assets/test/routes/compare/compare-picker-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-compare-saved-hardening.md`

**Interfaces:** The pure module derives picker reset identity, stable unique
page accumulation, available options, next cursor, empty-state copy, and
compare paths. `CompareProductPickerBoundary` retains Relay reads, effects,
state transitions, Suspense and error boundaries, while
`CompareProductPickerView` retains presentation and loaded-option filtering.

- [x] Write pure tests for reset identity, duplicate page rows, selected-item
  exclusion, unknown-brand fallback, next-cursor rules, empty copy, maximum
  selection, encoded paths, and specification mode; verify RED.
- [x] Extract only deterministic picker policy and preserve existing state and
  Relay request timing.
- [x] Run the pure and existing compare suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Task review verification: the pure and existing compare suites passed 116
  tests, TypeScript and the transitive framework scan passed, and independent
  review found no actionable correctness, lifecycle, purity, or test issues.

---

### Task 6: Product Offer Panel Data Contract

**Files:**

- Create: `assets/src/routes/products/product-offer-panel-data.ts`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/src/routes/products/ProductOfferList.tsx`
- Create: `assets/test/routes/products/product-offer-panel-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-offers.md`

**Interfaces:** The pure module derives visible offer rows, coupon and price-
history rows, snapshot display values, and first/next pagination paths from a
transport-neutral offer connection. `ProductOfferPanel` retains error, empty,
snapshot, list, and pagination markup; `ProductOfferList` retains offer-row
presentation and tracked commerce actions.

- [x] Write pure tests for unsafe URL exclusion, merchant fallback, numeric and
  currency validation, coupon discount/date semantics, price-history filtering,
  mixed-currency snapshots, compare-slug ordering, and first/next pagination;
  verify RED.
- [x] Extract only deterministic offer-panel data and path policy while keeping
  React identifiers, markup, accessibility, and tracked commerce presentation
  in the component owners.
- [x] Run the pure and existing detail suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Task review verification: the pure and existing product-detail suites
  passed 59 tests, TypeScript and the transitive framework scan passed, and
  independent review found no actionable spec, correctness, boundary,
  performance, maintainability, or test-quality issues.

---

### Task 7: External Destination Safety Contract

**Files:**

- Modify: `assets/src/routes/external-links.ts`
- Create: `assets/test/routes/external-links.test.ts`
- Create: `docs/work/frontend-external-destination-safety.md`
- Test: `assets/test/routes/products/product-offer-panel-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Test: `assets/test/routes/merchants/merchant-detail.route.test.tsx`

**Interfaces:** The existing framework-free module remains the single owner of
external HTTP URL and bare website-domain normalization. The batch adds direct
behavioral coverage and changes production code only where that contract
reveals duplicated or unsafe behavior; offer, product, and merchant consumers
remain unchanged.

- [x] Write direct tests for trimming and exact href preservation, safe public
  HTTP(S), bare-domain HTTPS promotion, credentials, malformed authorities,
  unsupported schemes, hostname and port validation, localhost, reserved IPv4
  ranges, and reserved or IPv4-embedded IPv6 destinations; verify the current
  behavior before changing production code.
- [x] Simplify or correct the policy only where direct evidence requires it,
  without weakening consumer safety or introducing runtime dependencies.
- [x] Run the direct contract and existing product-offer, product-detail,
  offer-discovery, and merchant consumer suites, TypeScript, and `git diff
  --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Task review verification: 140 direct cases and 139 unchanged consumer
  cases passed. Review follow-up replaced divergent raw/WHATWG authority
  interpretation and textual IPv6 checks with one strict raw-authority parse
  plus a dated, longest-prefix IPv6 registry policy. Independent re-review
  found no remaining actionable issue.

---

### Task 8: Trust-Surface Date Presentation Contract

**Files:**

- Modify: `assets/src/routes/product-formatting.ts`
- Modify: `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- Modify: `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- Create: `assets/test/routes/product-formatting.test.ts`
- Test: `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-trust-date-presentation.md`

**Interfaces:** The framework-free product formatter adds separate string-input
UTC date-only and date-time label functions. Merchant detail consumes the
date-only function; public comparison snapshots consume the date-time function.
Both preserve the original source string as the fallback for malformed values,
while the React owners retain semantic `<time dateTime>` markup and layout.

- [x] Write direct tests for UTC date-only and date-time labels, offset
  normalization across a day boundary, malformed-string fallback, and the
  existing `Date`-input formatter; verify RED for the missing string helpers.
- [x] Replace the two route-local date formatters without changing semantic
  `dateTime` attributes, captured recommendation copy, or merchant-summary
  fallback behavior.
- [x] Run the direct formatter and existing merchant-detail and comparison-
  snapshot suites, TypeScript, the framework-import scan, and `git diff
  --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Review fix: route string inputs through the existing strict GraphQL
  DateTime validator so impossible dates and timestamps without offsets retain
  their original source strings instead of normalizing through `Date.parse`.
- [x] Review fix verification: two new regression cases failed before the fix;
  the formatter, validator, merchant, and snapshot suites then passed 26 tests,
  and the full frontend gate passed 71 files and 995 tests.
- [x] Independent re-review confirmed the malformed-date finding is resolved
  with no remaining actionable issue.

---

### Task 9: Product Attribute Grouping Data Contract

**Files:**

- Create: `assets/src/routes/products/product-attribute-list-data.ts`
- Modify: `assets/src/routes/products/ProductAttributeList.tsx`
- Create: `assets/test/routes/products/product-attribute-list-data.test.ts`
- Create: `docs/work/frontend-product-attribute-grouping.md`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`

**Interfaces:** The framework-free data module partitions product attributes
into first-seen labeled groups and an ungrouped tail. It trims labels, matches
labels case-insensitively while retaining the first display label, and
preserves attribute order. `ProductAttributeList` retains StyleX, empty-state,
section, heading, and definition-list presentation.

- [x] Write pure tests for empty input, all-ungrouped input, trimmed labels,
  case-insensitive grouping, first-label retention, first-seen group order,
  stable attribute order, and ungrouped tail order; verify RED.
- [x] Extract only deterministic grouping data and keep all markup and styling
  in `ProductAttributeList`.
- [x] Run the pure, product-detail, and compare route suites, TypeScript, the
  framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Independent review found no actionable behavior, reference, mutation,
  type-compatibility, React-performance, test-quality, or queue issue.

---

### Task 10: Route Metadata Resolution Data Contract

**Files:**

- Create: `assets/src/routes/route-metadata-data.ts`
- Modify: `assets/src/routes/RouteMetadata.tsx`
- Create: `assets/test/routes/route-metadata-data.test.ts`
- Create: `docs/work/frontend-route-metadata-resolution.md`
- Test: `assets/test/routes/route-metadata.test.tsx`

**Interfaces:** The framework-free data module selects the deepest valid route
metadata, preferring loader data over the same match's static handle, and
parses the required and optional document fields. `RouteMetadata` retains
`useMatches` and all title, meta, link, and structured-data markup.

- [x] Write pure tests for deepest-match precedence, loader-data precedence,
  invalid-loader handle fallback, required title and description strings,
  optional string fields, explicit-true indexability, and no valid metadata;
  verify RED.
- [x] Extract only deterministic match selection and metadata parsing while
  retaining router access and document-head markup in `RouteMetadata`.
- [x] Run the pure and existing integration suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Independent review confirmed production behavior and found one direct-
  suite gap: skipping a fully invalid deepest match in favor of valid
  shallower metadata. Add the regression case and verify the focused and full
  gates again.
- [x] Independent re-review confirmed the regression closes the finding with
  no remaining actionable issue.

---

### Task 11: Saved Comparison Navigation Data Contract

**Files:**

- Create: `assets/src/routes/compare/saved-comparisons-route-data.ts`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Create: `assets/test/routes/compare/saved-comparisons-route-data.test.ts`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-saved-comparison-navigation.md`

**Interfaces:** The framework-free data module builds an ordered saved-set
reopen path and first/next cursor pagination paths from transport-neutral
values. `SavedComparisonsRoute` retains Relay query retention, mutation and
local-state orchestration, router links, boundaries, and presentation.

- [x] Write pure tests for empty and ordered product selections, encoded
  slugs, unauthorized pagination, first-page return visibility, absent or
  empty next cursors, and encoded advancing cursors; verify RED.
- [x] Extract only deterministic navigation data while preserving stored
  product order, query-retainer identity, delete behavior, and route markup.
- [x] Run the pure and existing route-state suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Task review found that the transport-neutral contract relied on the
  loader to reject a repeated next cursor. Add a failing direct regression,
  enforce cursor advancement in the pure owner, cover absent `undefined`, and
  restore the validated P2 lane priority.
- [x] Task re-review approved the completed contract with no remaining issue.
- [x] Final review found `hasNextPage: false` lacked independent coverage. Add
  a direct final-page case, prove it fails without the existing guard, restore
  production unchanged, and verify the focused and full gates again.
- [x] Final whole-batch re-review approved saved navigation and the narrowed
  queue successor with no remaining issue.

---

### Task 12: API Token Lifecycle Display Data Contract

**Files:**

- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Create: `docs/work/frontend-api-token-lifecycle-display.md`

**Interfaces:** The existing framework-free API-token route-data owner returns
one display record per token with its label, strict UTC lifecycle-date labels,
optional empty-state labels, and revoked/active/expired status copy.
`ApiTokenItem` retains semantic detail markup, status tone, rotation presets,
errors, and lifecycle actions.

- [x] Write pure tests for labeled and unlabeled tokens, valid UTC and offset
  timestamps, optional-date fallbacks, impossible and offset-less timestamp
  fallbacks, and revoked/active/expired status precedence; verify RED.
- [x] Move only deterministic item-display data into the existing route-data
  owner while preserving item markup and lifecycle behavior.
- [x] Run the pure and existing API-token route suites, TypeScript, the
  framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 13: Catalog Specification Highlights Data Contract

**Files:**

- Create: `assets/src/routes/catalog/browse-product-list-data.ts`
- Modify: `assets/src/routes/catalog/BrowseProductList.tsx`
- Create: `assets/test/routes/catalog/browse-product-list-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Create: `docs/work/frontend-catalog-specification-highlights.md`

**Interfaces:** The framework-free data module selects at most three catalog
specification highlights by ascending explicit sort order, places unspecified
orders last, preserves source order for ties, and leaves the Relay input
unchanged. `BrowseProductList` retains product-card, empty omission, list,
decision-action, and StyleX presentation.

- [x] Write pure tests for empty input, ascending order, the three-row bound,
  unspecified orders, stable ties, and input immutability; verify RED.
- [x] Extract only deterministic highlight selection while retaining all card
  markup and styling in `BrowseProductList`.
- [x] Run the pure and existing catalog route suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 14: Recommendation Profile Route Data Contract

**Files:**

- Create: `assets/src/routes/compare/recommendation-route-data.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Modify: `assets/src/routes/compare/RecommendationPanel.tsx`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Create: `assets/test/routes/compare/recommendation-route-data.test.ts`
- Test: `assets/test/routes/compare/recommendation-panel.test.tsx`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-recommendation-profile-navigation.md`

**Interfaces:** The framework-free route-data module parses recommendation
profiles, builds ordered profile paths, and suppresses core comparison reloads
only when the recommendation profile is the sole route change. React retains
location access, Relay reads, boundaries, snapshot behavior, and recommendation
presentation. The completed `share-comparison-data.ts` contract retains
snapshot publish-input construction and GraphQL profile mapping.

- [x] Write pure tests for default and best-value parsing, ordered encoded
  slugs, all specification modes, profile query defaults, sole-profile
  revalidation, and unrelated route changes; verify RED.
- [x] Consolidate only deterministic recommendation route policy while
  preserving Relay variables, snapshot profile behavior, error/Suspense
  boundaries, and panel markup.
- [x] Run the pure and existing recommendation/snapshot suites, TypeScript,
  the framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 15: Saved Comparison Naming Data Contract

**Files:**

- Create: `assets/src/routes/compare/saved-comparison-name-data.ts`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Create: `assets/test/routes/compare/saved-comparison-name-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Create: `docs/work/frontend-saved-comparison-naming.md`

**Interfaces:** The framework-free route-data module builds the existing saved-
comparison name from ordered product names by trimming names, omitting empty
names, and preserving the current zero-, one-, and multi-product copy.
`CompareRoute` retains Relay data, save mutation orchestration, in-flight
protection, feedback, and presentation.

- [x] Write pure tests for empty input, whitespace-only names, one product,
  ordered multiple products, and input immutability; verify RED.
- [x] Extract only deterministic name construction while preserving mutation
  variables and save behavior.
- [x] Run the pure and existing compare route suites, TypeScript, the
  framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 16: Merchant Directory Visible-Page Filter Data Contract

**Files:**

- Create: `assets/src/routes/merchants/merchant-directory-view-data.ts`
- Modify: `assets/src/routes/merchants/MerchantDirectoryView.tsx`
- Create: `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Modify: `docs/work/frontend-merchant-discovery-demo-parity.md`

**Interfaces:** The framework-free view-data module normalizes the current
page's filter text, selects visible merchants by case-insensitive name match,
and returns the existing filtered and unfiltered heading copy without mutating
the merchant input. `MerchantDirectoryView` retains filter state, the search
field, empty-page and no-match presentation, merchant markup and links, and
cursor pagination.

- [x] Write pure tests for blank and trimmed filters, case-insensitive matches,
  no matches, heading copy, source ordering, and input immutability; verify RED.
- [x] Extract only deterministic visible-page filter data while preserving
  local state, page boundaries, markup, links, and pagination.
- [x] Run the pure and existing merchant-directory route suites, TypeScript,
  the framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 17: Price-Watch Input Data Contract

**Files:**

- Create: `assets/src/routes/products/price-watch-data.ts`
- Modify: `assets/src/routes/products/PriceWatchControl.tsx`
- Create: `assets/test/routes/products/price-watch-data.test.ts`
- Test: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Create: `docs/work/frontend-price-watch-input.md`

**Interfaces:** The framework-free data module identifies amount-bearing rule
types and builds the existing create-watch input from trimmed amount and
uppercased currency values, omitting amount fields for availability rules.
`PriceWatchControl` retains product-scoped form reset, state, Relay mutation
orchestration, validation attributes, success and error feedback, and markup.

- [x] Write pure tests for every rule type, trimmed amounts, uppercased
  currency, availability-rule omission, and input immutability; verify RED.
- [x] Extract only deterministic rule and mutation-input data while preserving
  form state, Relay behavior, feedback, and presentation.
- [x] Run the pure and existing price-watch control suites, TypeScript, the
  framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 18: Feed-Candidate Review View-Data Contract

**Files:**

- Create: `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-data.ts`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- Create: `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts`
- Test: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Create: `docs/work/frontend-feed-candidate-review-data.md`

**Interfaces:** The framework-free view-data module owns candidate name,
product-count, fit score and reasons, review status label/tone/counts,
reviewed-time, and filter-preserving pagination-path policy.
`FeedCandidateReviewList` retains Relay connection consumption, review and note
callbacks, list/summary/pagination markup, buttons, and StyleX presentation;
`FeedCandidatesRoute` retains loader/query/mutation orchestration, draft state,
revalidation, and feedback.

- [x] Write pure tests for name fallback, product-count thresholds, normalized
  market/currency/language and feed-type scoring, reasons, status label/tone and
  counts, valid/invalid reviewed time, filtered first/next paths, and input
  immutability; verify RED.
- [x] Extract only deterministic review view data while preserving Relay,
  mutation, draft-note, event, and presentation behavior.
- [x] Run the pure and existing feed-candidate route suites, TypeScript, the
  framework-import scan, secret/raw-field scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 19: Tracked-Commerce Click Data Contract

**Files:**

- Create: `assets/src/routes/offers/tracked-commerce-click-data.ts`
- Modify: `assets/src/routes/offers/TrackedCommerceClickAction.tsx`
- Create: `assets/test/routes/offers/tracked-commerce-click-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Create: `docs/work/frontend-tracked-commerce-click-data.md`

**Interfaces:** The framework-free data module qualifies normal unmodified
primary clicks, builds the existing encoded first-party merchant-product
tracking href, and resolves only redirect paths whose origin matches the API
endpoint origin. `TrackedCommerceClickAction` retains React event handling,
pending/error state, Relay mutation orchestration, browser navigation, and
markup.

- [x] Write pure tests for primary and modified clicks, encoded merchant-
  product IDs, API-origin absolute and relative redirects, cross-origin and
  non-HTTP redirects, and input immutability; verify RED.
- [x] Extract only deterministic click and URL policy while preserving Relay,
  error, pending, navigation, and presentation behavior.
- [x] Run the pure and existing offer-discovery route suites, TypeScript, the
  framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 20: Immutable Route-State Collection Contract

**Files:**

- Create: `assets/src/routes/immutable-collection-state.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Create: `assets/test/routes/immutable-collection-state.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-immutable-route-state.md`

**Interfaces:** The framework-free route-state module owns copy-on-write map
upsert/remove and set add/remove helpers. Set membership and map-removal no-ops
preserve the original collection identity; changes return a new collection and
leave the input unchanged. Route owners retain all React state transitions,
Relay orchestration, errors, feedback, and presentation.

- [x] Write pure tests for map insert/replace/remove, set add/remove, source
  ordering, no-op identity, changed-result identity, and input immutability;
  verify RED.
- [x] Replace only the duplicate collection helpers while preserving route
  state and mutation behavior.
- [x] Run the pure and existing API-token and saved-comparison route-state
  suites, TypeScript, the framework-import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 21: Catalog Filter Form State Contract

**Files:**

- Create: `assets/src/routes/catalog/catalog-filter-form-state.ts`
- Modify: `assets/src/routes/catalog/CatalogFilterForm.tsx`
- Create: `assets/test/routes/catalog/catalog-filter-form-state.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Create: `docs/work/frontend-catalog-filter-form-state.md`

**Interfaces:** The framework-free state module owns initial type and descendant
state, type-selection transitions, and whether advanced filters initially open.
The first type selected from an empty state enables descendants; clearing the
type disables descendants; changing one selected type to another preserves the
current descendant choice. `CatalogFilterForm` retains React state, controls,
form serialization, active-filter summary behavior, and markup.

- [x] Write pure tests for empty and selected initial type state, descendant
  initialization, first selection, clear, selected-type changes with both
  descendant choices, every advanced-filter collection, and input immutability;
  verify RED.
- [x] Extract only deterministic state policy while preserving React controls,
  URL form fields, advanced-filter presentation, and summaries.
- [x] Run the pure and existing catalog route suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 22: Feed-Candidate Review Mutation Data Contract

**Files:**

- Create: `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.ts`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- Create: `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.test.ts`
- Test: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Create: `docs/work/frontend-feed-candidate-review-mutation-data.md`

**Interfaces:** The framework-free data module owns explicit-draft detection,
trimmed review mutation-input construction, and immutable successful-draft
removal. An explicit blank draft includes `note: ""` so a persisted note can be
cleared; an absent draft falls back to the persisted note and omits `note` when
that trimmed value is empty. `FeedCandidatesRoute` retains React state, Relay
mutation orchestration, errors, feedback, revalidation, and presentation.

- [x] Write pure tests for explicit nonblank and blank drafts, absent drafts
  with nonblank and empty persisted notes, trimmed notes, own-property draft
  detection, successful-draft removal, missing-draft behavior, source ordering,
  result identity, and input immutability; verify RED.
- [x] Extract only deterministic mutation-input and draft-removal policy while
  preserving React state, Relay behavior, errors, feedback, revalidation, and
  presentation.
- [x] Run the pure and existing feed-candidate route suites, TypeScript, the
  framework-import scan, secret/raw-field scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 23: Offer-Discovery Card View-Data Contract

**Files:**

- Create: `assets/src/routes/offers/offer-discovery-card-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryCard.tsx`
- Create: `assets/test/routes/offers/offer-discovery-card-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Create: `docs/work/frontend-offer-discovery-card-data.md`

**Interfaces:** The framework-free view-data module owns product, status,
merchant, domain, and latest-price labels, nullable coupon/price-history
connection fallbacks, and ordered valid price-history rows.
`OfferDiscoveryCard` retains safe versus tracked merchant-action selection,
observation and coupon rendering, markup, and StyleX presentation.

- [x] Write pure tests for nullish and empty-string label fallbacks, active and
  inactive status copy, nullable connection fallbacks and existing-connection
  identity, ordered valid/invalid price-history rows, and input immutability;
  verify RED.
- [x] Extract only deterministic card view data while preserving merchant
  action, observation, coupon, markup, and presentation behavior.
- [x] Run the pure and existing offer-discovery route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 24: Category Landing View-Data Contract

**Files:**

- Create: `assets/src/routes/categories/category-view-data.ts`
- Modify: `assets/src/routes/categories/CategoryRoute.tsx`
- Create: `assets/test/routes/categories/category-view-data.test.ts`
- Test: `assets/test/routes/categories/category.route.test.tsx`
- Create: `docs/work/frontend-category-view-data.md`

**Interfaces:** The framework-free view-data module owns category title and
qualification copy, the encoded catalog browse and conditional next-page
paths, source-ordered product rows, nullish brand fallback, and the first three
source-ordered specification highlights. `CategoryRoute` retains loader and
Relay reads, route fallbacks, empty-state rendering, markup, links, and StyleX.

- [x] Write pure tests for category copy, encoded browse IDs and cursors,
  next-page eligibility, nullish versus empty brand names, empty products,
  source ordering, first-three highlight truncation, and input immutability;
  verify RED.
- [x] Extract only deterministic category view data while preserving Relay,
  route fallbacks, empty-state behavior, markup, links, and presentation.
- [x] Run the pure and existing category route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 25: Alerts Mutation Data Contract

**Files:**

- Create: `assets/src/routes/account/alerts/alerts-mutation-data.ts`
- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Create: `assets/test/routes/account/alerts/alerts-mutation-data.test.ts`
- Test: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Create: `docs/work/frontend-alerts-mutation-data.md`

**Interfaces:** The framework-free mutation-data module owns exact toggle,
delete, and mark-read variables plus operation-specific success/error
resolution. A truthy updated watch, deleted-watch ID, or alert event is success;
all other payload and GraphQL outcomes delegate to shared route mutation-error
copy. `AlertsRoute` retains pending state, Relay commits, revalidation, failure
catching, feedback, and presentation.

- [x] Write pure tests for all three variable shapes, toggle inversion,
  operation-specific success, payload and GraphQL failure copy, result identity
  where relevant, and input immutability; verify RED.
- [x] Extract only deterministic variables and outcome policy while preserving
  React state, Relay commit lifecycle, revalidation, feedback, and presentation.
- [x] Run the pure and existing alerts route suites, TypeScript, the framework/
  transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 26: Recommendation Result View-Data Contract

**Files:**

- Create: `assets/src/routes/compare/recommendation-view-data.ts`
- Modify: `assets/src/routes/compare/RecommendationPanel.tsx`
- Create: `assets/test/routes/compare/recommendation-view-data.test.ts`
- Test: `assets/test/routes/compare/recommendation-panel.test.tsx`
- Create: `docs/work/frontend-recommendation-view-data.md`

**Interfaces:** The framework-free view-data module owns first matching-winner
selection, supported versus no-winner reasons, and exact evidence copy with
singular/plural accepted-claim references. `RecommendationPanel` retains Relay
fetching, profile navigation, suspense and error handling, markup, and StyleX.

- [x] Write pure tests for a matching winner, first-match selection, missing or
  unmatched winners, supported and missing-input reason order, zero/one/many
  claim-reference copy, and input immutability; verify RED.
- [x] Extract only deterministic result presentation while preserving Relay,
  profiles, query lifecycle, fallbacks, markup, and presentation.
- [x] Run the pure and existing recommendation-panel suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 27: Shared Route-Error View-Data Contract

**Files:**

- Create: `assets/src/routes/compare/route-error-view-data.ts`
- Modify: `assets/src/routes/compare/RouteErrorBoundary.tsx`
- Create: `assets/test/routes/compare/route-error-view-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Test: `assets/test/router.test.tsx`
- Create: `docs/work/frontend-route-error-view-data.md`

**Interfaces:** The framework-free view-data module owns resource
capitalization plus default, 5xx, 404, 401/403, other-response, network, and
unexpected-error copy. `RouteErrorBoundary` retains React Router error
detection and boundary presentation and passes only normalized response,
ordinary-error, or unknown context into the pure owner.

- [x] Write pure tests for every status branch, case-insensitive network/fetch
  messages, `NetworkError`, qualifying and ordinary `TypeError`, generic errors,
  unknown values, resource capitalization, exact retry copy, and input
  immutability; verify RED.
- [x] Extract only deterministic classification and copy while preserving React
  Router detection, registration, markup, and presentation.
- [x] Run the pure, compare, and router suites, TypeScript, the framework/router
  dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 28: Shared Comparison Mutation Data Contract

**Files:**

- Modify: `assets/src/routes/compare/share-comparison-data.ts`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Modify: `assets/test/routes/compare/share-comparison-data.test.ts`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-share-comparison-mutation-data.md`

**Interfaces:** The existing framework-free sharing module additionally owns
publish and revoke mutation variables, structural payload-to-snapshot
projection, source-node projection, and immutable published/revoked state
transitions with their exact success copy. `ShareComparisonControl` retains
form adaptation, Relay commits, pending state, query pagination, suspense and
error handling, callbacks, markup, and StyleX.

- [x] Write pure tests for publish and revoke variables, complete and partial
  publish payloads, source-node fallback, publish deduplication and prepend
  order, revoke removal and tombstones, exact success copy, and input
  immutability; verify RED where the new exports do not yet exist.
- [x] Extract only deterministic mutation and local-state policy while
  preserving Relay lifecycle, pagination, feedback errors, markup, and
  presentation.
- [x] Run the pure sharing and existing snapshot suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 29: Catalog Advanced-Filter View-Data Contract

**Files:**

- Create: `assets/src/routes/catalog/catalog-advanced-filter-data.ts`
- Modify: `assets/src/routes/catalog/CatalogAdvancedFilters.tsx`
- Create: `assets/test/routes/catalog/catalog-advanced-filter-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Create: `docs/work/frontend-catalog-advanced-filter-data.md`

**Interfaces:** The framework-free view-data module owns effective use-case,
numeric, boolean, and enum selections plus selected-option disabled policy,
stable field identities, and source ordering. `CatalogAdvancedFilters`
retains fieldset, label, input, and TextField presentation and receives only
render-ready structural rows.

- [x] Write pure tests for URL-state precedence, metadata fallback, false and
  empty values, repeated enum selection last-write behavior, selected disabled
  options, stable field identities, empty groups, source ordering, and input
  immutability; verify RED.
- [x] Extract only deterministic advanced-filter view data while preserving
  form names, values, accessibility, uncontrolled input behavior, and
  presentation.
- [x] Run the pure and existing browse suites, TypeScript, the framework/
  transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 30: Root Destination Policy Data Contract

**Files:**

- Create: `assets/src/routes/root-destination-data.ts`
- Modify: `assets/src/routes/RootDestinations.tsx`
- Create: `assets/test/routes/root-destination-data.test.ts`
- Test: `assets/test/routes/root.route.test.tsx`
- Create: `docs/work/frontend-root-destination-data.md`

**Interfaces:** The framework-free data module owns ordered public, shopper,
authenticated, operator, secondary, and auth destination groups plus viewer-
specific primary and home composition. `RootDestinations` retains active-path
matching, NavLink and Button composition, semantic navigation markup, and
StyleX.

- [x] Write pure tests for guest, authenticated member, and operator primary
  and home groups, exact destination copy, secondary-public exclusion,
  comparison end matching metadata, source ordering, and input immutability;
  verify RED.
- [x] Extract only deterministic destination policy while preserving active
  matching, markup, button variants, accessibility labels, and presentation.
- [x] Run the pure and existing root-route suites, TypeScript, the framework/
  transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 31: Compare Saved-Set Mutation Data Contract

**Files:**

- Create: `assets/src/routes/compare/saved-comparison-mutation-data.ts`
- Modify: `assets/src/routes/compare/CompareRoute.tsx`
- Create: `assets/test/routes/compare/saved-comparison-mutation-data.test.ts`
- Test: `assets/test/routes/compare/compare-save-feedback.test.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Create: `docs/work/frontend-compare-saved-set-mutation-data.md`

**Interfaces:** The framework-free mutation-data module composes the existing
saved-comparison naming policy into the exact ordered create input and
classifies structural mutation completion as success or the existing shared
route error. `CompareRoute` retains Relay commits, ready and in-flight guards,
request identity, callbacks, feedback state, query reads, markup, and styling.

- [x] Write pure tests for empty, trimmed, singular, and ordered names; ordered
  product IDs; structural success; missing IDs; payload and top-level GraphQL
  errors; exact success copy; and input immutability; verify RED.
- [x] Extract only deterministic create-input and completion policy while
  preserving the existing naming and shared route-error owners plus every
  Relay and stale-request lifecycle guard.
- [x] Run the pure mutation-data, save-feedback, and compare route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 32: API-Token Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Create: `docs/work/frontend-api-token-mutation-outcome-data.md`

**Interfaces:** The existing framework-free route-data module additionally
owns revoke mutation variables plus structural create/rotate credential and
revoke completion outcomes. It composes the existing token projection and
shared route-error policy. `ApiTokensRoute` retains FormData, Relay commits,
pending and concurrency guards, one-time-secret lifecycle, state transitions,
dialogs, row-scoped errors, callbacks, markup, and styling.

- [x] Write pure tests for revoke variables; credential success; missing,
  null, and empty plaintext; missing tokens; revoke success; top-level GraphQL
  precedence; payload/default errors; complete payloads that also contain
  payload errors; and input immutability; verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  truthy plaintext semantics, generated mutation contracts, optimistic state
  application, pending cleanup, and shared error behavior.
- [x] Run the pure route-data and API-token route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 33: Merchant Detail View-Data Contract

**Files:**

- Create: `assets/src/routes/merchants/detail/merchant-detail-view-data.ts`
- Modify: `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- Create: `assets/test/routes/merchants/merchant-detail-view-data.test.ts`
- Test: `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- Create: `docs/work/frontend-merchant-detail-view-data.md`

**Interfaces:** The framework-free view-data module owns exact merchant
coverage summary rows, observation and freshness copy, source-ordered offer-row
projection, product-detail paths, and conditional pagination paths.
`MerchantDetailRoute` retains Relay reads, safe external website resolution,
semantic links and time markup, empty and error states, and StyleX.

- [x] Write pure tests for exact summary order and copy, observed and missing
  observation text, source-ordered available and unavailable product rows,
  price, shipping, stock, and no-price fallbacks, encoded product and advancing
  pagination paths, absent pagination, and input immutability; verify RED.
- [x] Extract only deterministic merchant detail view and path policy while
  preserving the existing product-date and external-destination owners,
  generated query contract, semantic markup, feedback states, and presentation.
- [x] Run the pure view-data and existing merchant-detail suites, TypeScript,
  the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 34: Saved-Comparison Delete Mutation Data Contract

**Files:**

- Create: `assets/src/routes/compare/saved-comparison-delete-mutation-data.ts`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Create: `assets/test/routes/compare/saved-comparison-delete-mutation-data.test.ts`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-saved-comparison-delete-mutation-data.md`

**Interfaces:** The framework-free mutation-data module owns exact delete
variables and structural deletion completion as a deleted ID or the existing
shared route error. `SavedComparisonsRoute` retains row-scoped in-flight
guards, Relay commits and callbacks, pending and deleted set state, feedback,
query retention, markup, and styling.

- [x] Write pure tests for exact delete variables; deleted-ID success; missing
  IDs; null payloads; payload and top-level GraphQL errors; complete payloads
  that also contain payload errors; shared default fallback; and input
  immutability; verify RED.
- [x] Extract only deterministic variable and completion policy while
  preserving the generated mutation contract, top-level error precedence,
  row-scoped concurrency and cleanup, state updates, and shared error behavior.
- [x] Run the pure mutation-data and existing saved-comparisons route-state
  suites, TypeScript, the framework/transport dependency scan, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 35: Product Community Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/products/product-community-data.ts`
- Modify: `assets/src/routes/products/ProductCommunityPanel.tsx`
- Modify: `assets/test/routes/products/product-community-data.test.ts`
- Test: `assets/test/routes/products/product-community-panel.test.tsx`
- Create: `docs/work/frontend-product-community-mutation-outcome-data.md`

**Interfaces:** The existing framework-free community-data module additionally
owns exact review, question, and answer completion messages from structural
mutation payloads and the existing shared route-error policy.
`ProductCommunityPanel` retains FormData, Relay mutation promises, pending
state, input adaptation, feedback placement, pagination, markup, and styling.

- [x] Write pure tests for review, question, and answer success copy; missing
  and null completion facts; payload and top-level GraphQL errors; complete
  facts that coexist with payload or top-level errors; shared default fallback;
  and input immutability; verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  current fact-first success semantics, generated mutation contracts, authored-
  text normalization, Relay promise handling, pending state, and shared errors.
- [x] Run the pure community-data and existing community-panel suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 36: Affiliate Setup Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Create: `docs/work/frontend-affiliate-setup-mutation-outcome-data.md`

**Interfaces:** The existing framework-free setup-data module additionally owns
structural network, program, link, and coupon completion outcomes as their
original complete fact or the existing shared route error.
`AffiliateSetupRoute` retains FormData adaptation, Relay mutation promises,
in-flight and pending guards, selected state, feedback placement, markup, and
presentation.

- [x] Write pure tests for each operation's complete fact and identity; missing
  and null facts; top-level GraphQL-error precedence; payload and default
  errors; complete facts that also contain payload errors; and input
  immutability; verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  generated mutation contracts, top-level error precedence, current payload-
  error success behavior, Relay promise handling, guards, state, and shared
  errors.
- [x] Run the pure setup-data and existing affiliate setup route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 37: Share-Comparison Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/compare/share-comparison-data.ts`
- Modify: `assets/src/routes/compare/ShareComparisonControl.tsx`
- Modify: `assets/test/routes/compare/share-comparison-data.test.ts`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-share-comparison-mutation-outcome-data.md`

**Interfaces:** The existing framework-free share-comparison data module
additionally owns structural publish and revoke completion outcomes as the
projected published snapshot or original revoked snapshot and the existing
shared route error. `ShareComparisonControl` retains FormData and location
adaptation, Relay mutation promises, hooks, component state and callbacks,
snapshot paging, markup, and styling.

- [x] Write pure tests for complete publish projection and revoke identity;
  missing and null publish IDs, share paths, payloads, and revoke facts;
  payload and top-level GraphQL errors on incomplete facts; complete facts
  that coexist with payload or top-level errors; shared default fallback; and
  input immutability; verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  current fact-first success semantics, generated mutation contracts, Relay
  promise handling, local state transitions, callbacks, and shared errors.
- [x] Run the pure share-comparison and existing comparison-snapshots suites,
  TypeScript, the framework/transport dependency scan, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 38: Price-Watch Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/products/price-watch-data.ts`
- Modify: `assets/src/routes/products/PriceWatchControl.tsx`
- Modify: `assets/test/routes/products/price-watch-data.test.ts`
- Test: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Create: `docs/work/frontend-price-watch-mutation-outcome-data.md`

**Interfaces:** The existing framework-free price-watch data module
additionally owns structural create-watch completion as the exact success copy
or the existing shared route error. `PriceWatchControl` retains FormData
adaptation, Relay mutation promises, product-keyed reset, rule and pending
state, feedback placement, markup, and styling.

- [x] Write pure tests for success copy; missing and null watches and payloads;
  payload and top-level GraphQL errors; a complete watch that coexists with
  payload or top-level errors; shared default fallback; and input immutability;
  verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  current fact-first success semantics, the generated mutation contract,
  input normalization, Relay promise handling, keyed reset, pending state, and
  shared errors.
- [x] Run the pure price-watch and existing alerts-route suites, TypeScript,
  the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 39: Tracked-Commerce Click Mutation Outcome Data Contract

**Files:**

- Modify: `assets/src/routes/offers/tracked-commerce-click-data.ts`
- Modify: `assets/src/routes/offers/TrackedCommerceClickAction.tsx`
- Modify: `assets/test/routes/offers/tracked-commerce-click-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-tracked-commerce-click-data.md`

**Interfaces:** The existing framework-free tracked-commerce data module
additionally owns structural mutation completion as a resolved same-origin
redirect URL or the existing shared route error. `TrackedCommerceClickAction`
retains event handling, Relay mutation orchestration, pending and error state,
browser navigation, markup, and presentation.

- [x] Write pure tests for resolved redirect success; missing and null paths
  and payloads; payload and top-level GraphQL errors; unsafe redirect paths;
  shared default fallback; and input immutability; verify RED.
- [x] Extract only deterministic completion interpretation while preserving
  current success requirements, the generated mutation contract, same-origin
  validation, Relay lifecycle, navigation, component state, and shared errors.
- [x] Run the pure tracked-commerce data and existing offer-discovery suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 40: Reset-Password Request Data Contract

**Files:**

- Create: `assets/src/routes/auth/reset-password-data.ts`
- Modify: `assets/src/routes/auth/ResetPasswordRoute.tsx`
- Create: `assets/test/routes/auth/reset-password-data.test.ts`
- Test: `assets/test/routes/auth/recovery.route.test.tsx`
- Create: `docs/work/frontend-reset-password-request-data.md`

**Interfaces:** A framework-free reset-password data module owns token
normalization, missing-token state, mutation-variable construction, exact
success copy, and stale-response eligibility. `ResetPasswordRoute` retains URL
and FormData adaptation, Relay mutation orchestration, request-version
ownership, hooks, state, markup, and presentation; existing auth errors retain
outcome and transport-error normalization.

- [x] Write pure tests for trimmed, blank, and missing tokens; missing-token
  error identity; mutation variables; exact success copy; current and stale
  request versions; and input immutability; verify RED.
- [x] Extract only deterministic request data while preserving the generated
  mutation contract, auth outcome/error owners, Relay lifecycle, stale-response
  suppression, hooks, component state, and presentation.
- [x] Run the pure reset-password data and existing recovery-route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 41: Shared Comparison View Data Contract

**Files:**

- Create: `assets/src/routes/compare/shared/shared-comparison-view-data.ts`
- Modify: `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- Create: `assets/test/routes/compare/shared-comparison-view-data.test.ts`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-shared-comparison-view-data.md`

**Interfaces:** A framework-free shared-comparison view-data module owns
captured recommendation selection, exact fallback copy, product and offer fact
projection, and the ordered live-comparison path. `SharedComparisonRoute`
retains route state, Relay query reads, semantic markup, StyleX presentation,
and existing date formatting.

- [x] Write pure tests for winner and unsupported states; title, brand, model,
  claim-evidence, and offer fallbacks; ordered live-comparison paths; malformed
  nullable collections; and deep input immutability; verify RED.
- [x] Extract only deterministic view projection while preserving the generated
  query contract, date and compare-path policy owners, Relay lifecycle, route
  state, semantic markup, and presentation.
- [x] Run the pure shared-comparison view-data and existing snapshot-route
  suites, TypeScript, the framework/transport dependency scan, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 42: Compare Picker Visible-Option Data Contract

**Files:**

- Modify: `assets/src/routes/compare/compare-picker-data.ts`
- Modify: `assets/src/routes/compare/CompareProductPickerView.tsx`
- Modify: `assets/test/routes/compare/compare-picker-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Create: `docs/work/frontend-compare-picker-visible-option-data.md`

**Interfaces:** The existing framework-free compare-picker data module
additionally owns filter normalization, case-insensitive visible-option
selection, source-order preservation, and exact empty-state copy.
`CompareProductPickerView` retains local state, generated IDs, input events,
actions, markup, and presentation.

- [x] Write pure tests for trimmed and case-insensitive filtering, blank
  filters, source order, no matches, exact empty-state copy, stable identity,
  and deep input immutability; verify RED.
- [x] Extract only deterministic visible-option policy while preserving picker
  option identity, paths, pagination, loaded-page bounds, local state, IDs,
  events, actions, markup, and presentation.
- [x] Run the pure compare-picker data and existing compare-route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 43: Compare-Selection Tray View Data Contract

**Files:**

- Create: `assets/src/routes/compare/compare-selection-tray-data.ts`
- Modify: `assets/src/routes/compare/CompareSelectionTray.tsx`
- Create: `assets/test/routes/compare/compare-selection-tray-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Create: `docs/work/frontend-compare-selection-tray-view-data.md`

**Interfaces:** A framework-free compare-selection tray data module owns exact
selection-count copy, exact-slug label resolution with slug fallback, ordered
removal-path projection, and open-action visibility. `CompareSelectionTray`
retains generated IDs, semantic markup, links, buttons, StyleX presentation,
and events; callers retain open-comparison and removal-path policy.

- [x] Write pure tests for zero and bounded selection copy, exact-slug label
  resolution and fallback, source order, projected removal paths, open-action
  visibility, stable empty identity, and deep input immutability; verify RED.
- [x] Extract only deterministic tray view data while preserving caller-owned
  route policy, selected-slug identity and order, generated IDs, semantic
  markup, actions, events, and presentation.
- [x] Run the pure tray data plus existing catalog-browse and product-detail
  consumer suites, TypeScript, the framework/transport dependency scan, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 44: Verify-Email Request Data Contract

**Files:**

- Create: `assets/src/routes/auth/verify-email-data.ts`
- Modify: `assets/src/routes/auth/VerifyEmailRoute.tsx`
- Create: `assets/test/routes/auth/verify-email-data.test.ts`
- Test: `assets/test/routes/auth/recovery.route.test.tsx`
- Create: `docs/work/frontend-verify-email-request-data.md`

**Interfaces:** A framework-free verify-email data module owns token
normalization, missing-token state and error identity, mutation-variable
construction, exact success and status copy, and failed-outcome retry
eligibility. `VerifyEmailRoute` retains the promise cache, successful request
deduplication, Relay orchestration, commit ref, effect cancellation, hooks,
state, markup, and presentation; existing auth errors retain action-outcome and
transport-error normalization.

- [x] Write pure tests for trimmed, blank, and missing tokens; missing-token
  error identity; mutation variables; exact success, loading, and ready copy;
  successful and failed cache eligibility; and input immutability; verify RED.
- [x] Extract only deterministic request data while preserving the generated
  mutation contract, auth outcome/error owners, successful request reuse,
  failed request eviction, Relay lifecycle, cancellation, state, and
  presentation.
- [x] Run the pure verify-email data and existing recovery-route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 45: API Token Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/account/api-tokens/api-token-route-data.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Modify: `assets/test/routes/account/api-tokens/api-token-route-data.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Create: `docs/work/frontend-api-token-pagination-data.md`

**Interfaces:** The existing framework-free API-token route-data owner
additionally owns first-page and next-page link visibility and path projection
through the canonical `apiTokenPagePath` builder. `ApiTokenPagination` retains
the shared `Pagination` markup, label, and presentation.

- [x] Write pure tests for current-cursor first-page visibility, absent-cursor
  identity, complete and incomplete next-page facts, status preservation,
  cursor encoding, and input immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving status
  and cursor path policy, Relay page-info bounds, markup, labels, and
  presentation.
- [x] Run the pure API-token route-data and existing route suites, TypeScript,
  the framework dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 46: Affiliate Setup Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/affiliate/setup/pagination.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Modify: `assets/test/routes/affiliate/setup/affiliate-setup-loader.test.ts`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Create: `docs/work/frontend-affiliate-setup-pagination-data.md`

**Interfaces:** The existing framework-free affiliate-setup pagination owner
additionally owns merchant first-page and next-page link visibility and path
projection through the canonical `affiliateSetupPagePath` builder.
`AffiliateSetupRoute` retains shared `Pagination` markup, labels, and
presentation.

- [x] Write pure tests for current-cursor first-page visibility, previous-page
  bounds, complete and incomplete next-page facts, page-size preservation,
  cursor encoding, and input immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving the
  canonical path builder, Relay page-info bounds, markup, labels, and
  presentation.
- [x] Run the affiliate-setup loader and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 47: Feed-Candidate Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-data.ts`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- Modify: `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts`
- Test: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Create: `docs/work/frontend-feed-candidate-pagination-data.md`

**Interfaces:** The existing framework-free feed-candidate review-data owner
additionally owns first-page and next-page link visibility and path projection
through the existing path builders. `FeedCandidateReviewList` retains shared
`Pagination` markup, labels, and presentation.

- [x] Write pure tests for current-cursor first-page visibility, previous-page
  bounds, complete and incomplete next-page facts, filter and sort
  preservation, cursor encoding, and input immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving the
  existing path builders, Relay page-info bounds, empty-list behavior, markup,
  labels, and presentation.
- [x] Run the pure feed-candidate review-data and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 48: Merchant Directory Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/merchants/pagination.ts`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory-loader.test.ts`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Create: `docs/work/frontend-merchant-directory-pagination-data.md`

**Interfaces:** The existing framework-free merchant-directory pagination
owner additionally owns first-page and next-page link visibility and path
projection through the canonical `merchantDirectoryPagePath` builder.
`MerchantDirectoryView` retains shared `Pagination` markup, labels, and
presentation.

- [x] Write pure tests for current-cursor first-page visibility, previous-page
  bounds, complete and incomplete next-page facts, page-size preservation,
  cursor encoding, and input immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving the
  canonical path builder, Relay page-info bounds, markup, labels, and
  presentation.
- [x] Run the merchant-directory loader and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 49: Catalog Browse Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/catalog/paths.ts`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Create: `assets/test/routes/catalog/paths.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Create: `docs/work/frontend-catalog-browse-pagination-data.md`

**Interfaces:** The existing framework-free catalog path owner additionally
owns first-page and next-page link visibility and path projection through the
canonical browse path builders. `BrowseRoute` retains shared `Pagination`
markup, labels, empty-page recovery behavior, and presentation.

- [x] Write pure tests for current-cursor first-page visibility, absent-cursor
  identity, complete and incomplete next-page facts, filter and page-size
  preservation, ordered compare-slug preservation, cursor encoding, and input
  immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving the
  canonical path builders, current-cursor and Relay next-page bounds, empty-
  result recovery, markup, labels, and presentation.
- [x] Run the pure catalog path and browse route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 50: Offer Discovery Pagination Data Contract

**Files:**

- Modify: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryList.tsx`
- Modify: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Create: `docs/work/frontend-offer-discovery-pagination-data.md`

**Interfaces:** The existing framework-free offer-discovery filter-data owner
additionally owns first-page and next-page link visibility and path projection
through the canonical `offerDiscoveryPath` builder. `OfferDiscoveryList`
retains shared `Pagination` markup, labels, and presentation.

- [x] Write pure tests for current-cursor first-page visibility, previous-page
  bounds, complete and incomplete next-page facts, product, merchant, active-
  only, page-size, and sort preservation, cursor encoding, and input
  immutability; verify RED.
- [x] Extract only deterministic pagination projection while preserving the
  canonical path builder, Relay page-info bounds, markup, labels, and
  presentation.
- [x] Run the pure offer-discovery filter-data and route suites, TypeScript,
  the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 51: Alert Product Navigation Contract

**Files:**

- Modify: `assets/src/routes/account/alerts/AlertsRoute.tsx`
- Test: `assets/test/routes/account/alerts/alerts.route.test.tsx`
- Create: `docs/work/frontend-alert-product-navigation.md`

**Interfaces:** Alert-event and watch links use the existing canonical
`productDetailPath` builder. `AlertsRoute` retains link markup and labels,
view-data grouping, Relay mutations, pending/error state, and presentation.

- [x] Add route coverage for alert-event and watch slugs containing reserved
  characters; verify the current inline destinations characterize the same
  encoded behavior.
- [x] Replace duplicate URL construction with the canonical product-detail
  path builder without changing ordinary destinations, link labels, grouping,
  or mutation ownership.
- [x] Run the alert view-data and route suites, TypeScript, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 52: Merchant Directory Row Data Contract

**Files:**

- Modify: `assets/src/routes/merchants/merchant-directory-view-data.ts`
- Modify: `assets/src/routes/merchants/MerchantDirectoryRoute.tsx`
- Modify: `assets/test/routes/merchants/merchant-directory-view-data.test.ts`
- Test: `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- Create: `docs/work/frontend-merchant-directory-row-data.md`

**Interfaces:** The existing framework-free merchant-directory view-data owner
additionally projects Relay result nodes into exact view rows, including
encoded detail paths and website destinations resolved by the shared external-
link safety policy. React retains Relay reads, pagination, visible-page
filtering, markup, labels, and presentation.

- [x] Write pure tests for source-order preservation, field projection,
  reserved-character slug encoding, safe and unsafe website destinations, and
  input immutability; verify RED.
- [x] Extract only deterministic merchant-row projection while preserving the
  shared external-link policy and every React, Relay, pagination, filtering,
  and presentation owner.
- [x] Run the merchant-directory view-data and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 53: Product Offer Navigation Path Contract

**Files:**

- Modify: `assets/src/routes/offers/paths.ts`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/compare/DecisionSummary.tsx`
- Create: `assets/test/routes/offers/paths.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Create: `docs/work/frontend-product-offer-navigation-paths.md`

**Interfaces:** The existing offer path owner exposes one canonical product-
scoped discovery path that encodes the product ID as a single `productId`
query parameter. Browse, product-detail, and decision-summary presentation
retain link markup, labels, and presentation.

- [x] Write pure tests for ordinary, reserved-character, whitespace, and empty
  product IDs; verify RED.
- [x] Replace only duplicate product-scoped offer URL construction while
  preserving existing destinations and every React presentation owner.
- [x] Run the offer path, browse, product-detail, and compare route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 54: Category Product Navigation Contract

**Files:**

- Modify: `assets/src/routes/categories/CategoryRoute.tsx`
- Test: `assets/test/routes/categories/category.route.test.tsx`
- Create: `docs/work/frontend-category-product-navigation.md`

**Interfaces:** Category product links use the existing canonical
`productDetailPath` builder. `CategoryRoute` retains link markup and labels,
view-data projection, list order, and presentation.

- [x] Add route coverage for a category product slug containing reserved
  characters; verify RED against the current raw interpolation.
- [x] Replace duplicate URL construction with the canonical product-detail
  path builder without changing ordinary destinations, link labels, list
  order, or presentation.
- [x] Run the category view-data and route suites, TypeScript, and
  `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 55: Revenue Summary Filter-Form Data Contract

**Files:**

- Modify: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Modify: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Test: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Create: `docs/work/frontend-revenue-filter-form-data.md`

**Interfaces:** The existing framework-free revenue view-data owner returns
normalized uncontrolled-form values plus a collision-free reset identity.
`RevenueSummaryView` retains form fields, labels, submission, links, markup,
and presentation.

- [x] Write pure tests for nullish and empty values, exact value preservation,
  reset-identity stability, and delimiter-containing filter combinations that
  previously collided; verify RED.
- [x] Extract only deterministic filter-form projection while preserving the
  current uncontrolled form and every presentation owner.
- [x] Run the pure revenue view-data and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 56: Category Pagination Navigation Contract

**Files:**

- Modify: `assets/src/routes/categories/category-view-data.ts`
- Modify: `assets/test/routes/categories/category-view-data.test.ts`
- Create: `docs/work/frontend-category-pagination-navigation.md`
- Test: `assets/test/routes/categories/category.route.test.tsx`

**Interfaces:** The existing framework-free category view-data owner emits a
next-page path that encodes both the category slug path segment and Relay
cursor. React retains route loading, pagination markup, labels, and
presentation.

- [x] Add a pure reserved-character category-slug case; verify RED against the
  current raw path interpolation.
- [x] Encode only the category path segment without changing cursor bounds,
  product rows, or presentation.
- [x] Run the category view-data and route suites, TypeScript, the framework/
  transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 57: Saved-Comparison Sort Input Data Contract

**Files:**

- Modify: `assets/src/routes/compare/saved-view-state.ts`
- Modify: `assets/src/routes/compare/SavedComparisonSetList.tsx`
- Modify: `assets/test/routes/compare/saved-comparisons-view-state.test.ts`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-saved-comparison-sort-input.md`

**Interfaces:** The existing framework-free saved-comparison view-state owner
normalizes raw select values to the four supported sort modes. The list owner
retains select events, local state callbacks, options, markup, and
presentation.

- [x] Write pure tests for all supported values plus blank, unknown, and future
  values falling back to current order; verify RED.
- [x] Move only deterministic select-value normalization while preserving
  sorting, filtering, events, and presentation.
- [x] Run the pure saved-comparison view-state and route-state suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 58: Offer-Discovery Selected-Product Context Contract

**Files:**

- Modify: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryRoute.tsx`
- Modify: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Create: `docs/work/frontend-offer-selected-product-context.md`

**Interfaces:** The existing framework-free offer-discovery filter-data owner
qualifies a nullable transport-neutral selected-product node by `__typename`
and projects its exact brand, ID, name, and slug context. React retains Relay
reads, suspense and error boundaries, offer rendering, and presentation.

- [ ] Write pure tests for nullish and non-product nodes, product projection
  with present and null brands, source identity, and input immutability; verify
  RED.
- [ ] Extract only deterministic selected-product qualification and projection
  while preserving Relay, route fallbacks, summaries, and presentation.
- [ ] Run the pure offer-discovery filter-data and route suites, TypeScript, the
  framework/transport dependency scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 59: Relay Query Descriptor Identity Contract

**Files:**

- Modify: `assets/src/relay/route-preload.ts`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenList.tsx`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Modify: `assets/test/relay/route-preload.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-relay-query-descriptor-identity.md`

**Interfaces:** The Relay preload owner exports one canonical descriptor
identity over operation name, query text, and stable variables. API-token and
saved-comparison React retainers consume that identity while retaining query
lifecycle, rendering, and route orchestration.

- [ ] Add direct identity tests for property-order stability and query-text
  distinction; verify RED for the missing public contract.
- [ ] Replace both duplicated, weaker consumer keys with the canonical identity
  without changing retention or rendering.
- [ ] Run the Relay preload, API-token route, and saved-comparison route-state
  suites, TypeScript, a consumer scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 60: Price-Watch Rule-Type Select Input Contract

**Files:**

- Modify: `assets/src/routes/products/price-watch-data.ts`
- Modify: `assets/src/routes/products/PriceWatchControl.tsx`
- Modify: `assets/test/routes/products/price-watch-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Create: `docs/work/frontend-price-watch-rule-type-input.md`

**Interfaces:** The existing framework-free price-watch data owner normalizes
raw select values to the four supported rule types. The form owner retains
select events, local state, amount-field visibility, mutation orchestration,
markup, and presentation.

- [ ] Write pure tests for all supported values plus blank, unknown, and future
  values falling back to target price; verify RED.
- [ ] Move only deterministic rule-type normalization while preserving form
  state, amount policy, mutation inputs, events, and presentation.
- [ ] Run the pure price-watch data and product-detail route suites,
  TypeScript, the framework/transport dependency scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- Saved-comparison sort input completed on 2026-07-17 after an explicit
  missing-contract RED case covering all four supported values and three safe-
  fallback values. The pure and route-state suites pass 55 tests, and the full
  frontend gate passes 1,363 tests, Relay validation, TypeScript, client and
  SSR builds, and the bundle contract.
- Category pagination completed on 2026-07-17 after an explicit reserved-slug
  RED case. The pure and route suites pass 8 tests, with pagination eligibility
  and React presentation unchanged. The full frontend gate passes 1,356 tests,
  Relay validation, TypeScript, client and SSR builds, and the bundle contract.
- Before the category-pagination claim, current source inspection found that
  API-token and saved-comparison retainers duplicate a weaker query identity
  while `route-preload.ts` already owns the canonical operation-name, query-
  text, and stable-variable descriptor identity. The three characterization
  suites pass 94 tests, and the candidate is path-disjoint from Tasks 56-58.
- Before the saved-comparison sort-input claim, current source inspection found
  `PriceWatchControl` asserting a raw select value to the rule-type union while
  `price-watch-data.ts` already owns that union and all downstream amount
  policy. The pure and product-detail characterization suites pass 71 tests,
  and the candidate is path-disjoint from Tasks 57-59.
- The existing affiliate setup, offer discovery, catalog browse, product
  detail, and compare route suites passed 299 tests on 2026-07-14.
- Current source inspection found the named deterministic policies in five
  separate React owners with no code, test, or lane-doc ownership overlap.
- Current source inspection on 2026-07-16 found create-saved-set input and
  completion policy still embedded in `CompareRoute`; the two existing compare
  suites pass 116 tests, and the candidate is path-disjoint from Tasks 28-30.
- Current source inspection on 2026-07-16 found create, rotate, and revoke
  completion interpretation still embedded in `ApiTokensRoute`; its existing
  pure owner and route suites pass 64 tests, and the candidate is path-disjoint
  from Tasks 29-31.
- Current source inspection on 2026-07-16 found merchant coverage summaries,
  freshness copy, source-ordered offer projection, price, shipping, and stock
  labels, product-detail paths, and pagination policy still embedded in
  `MerchantDetailRoute`. Its existing suite passes two tests, and the candidate
  is path-disjoint from Tasks 30-32 while leaving the completed date-formatting
  and external-destination owners unchanged.
- Current source inspection on 2026-07-16 found delete-variable construction
  and structural completion interpretation still embedded in
  `SavedComparisonsRoute`; its existing navigation-data and route-state suites
  pass 43 tests. The candidate is path-disjoint from Tasks 31-33 and preserves
  the generated mutation, shared error policy, Relay lifecycle, and row-scoped
  concurrency owners.
- Current source inspection on 2026-07-16 found merchant first-page and next-
  page visibility and path projection still embedded in
  `MerchantDirectoryRoute`; its existing framework-free pagination owner
  provides canonical page-size- and cursor-preserving paths. The current loader
  and route suites pass 33 tests, and the candidate is path-disjoint from Tasks
  45-47.
- Current source inspection on 2026-07-17 found catalog first-page and next-
  page visibility and path projection still embedded in `BrowseRoute`; its
  existing framework-free path owner preserves filters, page size, ordered
  compare slugs, and cursor encoding. The current browse route suite passes 62
  tests, and the candidate is path-disjoint from Tasks 46-48.
- Current source inspection on 2026-07-17 found offer-discovery first-page and
  next-page visibility and path projection still embedded in
  `OfferDiscoveryList`; its existing framework-free filter-data owner preserves
  product, merchant, active-only, page-size, sort, and cursor policy. The pure
  and route suites pass 60 tests, and the candidate is path-disjoint from Tasks
  47-49.
- Current source inspection on 2026-07-17 found alert-event and watch product-
  detail paths still constructed independently in `AlertsRoute` even though
  the canonical encoded path builder already exists. The alert view-data and
  route suites pass 15 tests, and the candidate is path-disjoint from Tasks
  48-50.
- Current source inspection on 2026-07-17 found merchant result-node
  projection, detail-path construction, and safe website-destination
  resolution still embedded in `MerchantDirectoryRoute`; its framework-free
  view-data owner currently owns only visible-page filtering. The view-data and
  route suites pass 31 tests, and the candidate is path-disjoint from Tasks
  49-51.
- Current source inspection on 2026-07-17 found the same product-scoped offer
  path constructed independently in catalog browse, product detail, and the
  comparison decision summary. Their route suites pass 226 tests, and the
  candidate is path-disjoint from Tasks 50-52.
- Current source inspection on 2026-07-17 found category product links still
  interpolate raw slugs in `CategoryRoute` even though the canonical encoded
  product-detail path builder already exists. The category view-data and route
  suites pass eight tests, and the candidate is path-disjoint from Tasks
  51-53.
- Current source inspection on 2026-07-16 found review, question, and answer
  completion copy plus shared-error interpretation still embedded in
  `ProductCommunityPanel`; its existing framework-free owner already owns the
  corresponding input policy. The pure and panel suites pass eight tests, and
  the candidate is path-disjoint from Tasks 32-34 while preserving current
  fact-first success semantics and every Relay and presentation owner.
- Current source inspection on 2026-07-16 found network, program, link, and
  coupon completion interpretation still embedded in `AffiliateSetupRoute`;
  its existing framework-free owner already builds all four mutation inputs.
  The pure and route suites pass 28 tests, and the candidate is path-disjoint
  from Tasks 33-35 while preserving generated mutation, concurrency, shared-
  error, and presentation owners.
- Current source inspection on 2026-07-16 found publish and revoke structural
  outcome and shared-error interpretation still embedded in
  `ShareComparisonControl`; its existing framework-free owner already builds
  inputs and variables, projects published snapshots, and owns immutable
  snapshot state. The pure and control suites pass 17 tests, and the candidate
  is path-disjoint from Tasks 34-36 while preserving current fact-first
  success semantics and every Relay and presentation owner.
- The compare picker candidate is distinct from its completed presentation
  extraction: the view owns markup and loaded-option filtering, while the new
  contract owns route reset, page accumulation, option, cursor, empty-state,
  and path policy.
- The product-offer panel candidate is distinct from its completed offer-list
  presentation extraction: the list owns markup and tracked commerce actions,
  while the new contract owns connection normalization, snapshot values, and
  pagination policy. Its existing route characterization passed 55 tests on
  2026-07-14.
- The external-destination candidate is a non-overlapping safety hardening
  batch over the existing 410-line framework-free policy. Offer-discovery and
  merchant consumer suites passed 80 tests on 2026-07-14, while source and test
  inspection found no direct contract suite for its HTTP(S), credential,
  hostname, port, localhost, or reserved-address decisions.
- The completed product-detail contract and route characterization passed 67
  focused tests on 2026-07-14. The contract shares the canonical compare limit
  and path utilities, and independent re-review found no actionable issues.
- The trust-surface date candidate is non-overlapping with the three earlier
  ready contracts. Current source inspection found duplicate UTC date parsing
  and formatting in merchant detail and public comparison snapshots around the
  existing framework-free product formatter; their focused suites passed 8
  tests on 2026-07-14.
- The completed compare-picker contract and existing route characterization
  passed 116 focused tests on 2026-07-14; independent task review found no
  actionable issues.
- The product-attribute grouping candidate is non-overlapping with product-
  offer, external-destination, and date-presentation ownership. Current source
  inspection found deterministic grouping embedded in the StyleX list owner;
  the product-detail and compare consumer suites passed 164 tests on
  2026-07-14.
- The completed product-offer panel contract and existing product-detail route
  characterization passed 59 focused tests on 2026-07-14; independent task
  review found no actionable issues.
- The route-metadata resolution candidate is non-overlapping with external-
  destination safety, date presentation, and product-attribute grouping.
  Current source inspection found deterministic selection and parsing embedded
  in the React head owner; its integration suite passed 2 tests on 2026-07-14.
- External-destination safety completed with 140 direct cases and 139 unchanged
  consumer cases passing. The contract now validates the raw HTTP authority
  before WHATWG canonicalization, rejects userinfo and ambiguous authority
  forms, and applies order-independent longest-prefix rules to non-global IPv6
  parents, their globally reachable exceptions, and intentional IPv4-
  transition exclusions without rejecting public boundary neighbors.
- The saved-comparison navigation candidate is non-overlapping with date
  presentation, product-attribute grouping, and route-metadata resolution.
  Current source inspection found ordered reopen and cursor-pagination path
  policy embedded in `SavedComparisonsRoute.tsx`; its route-state suite passed
  31 tests on 2026-07-14.
- The API-token lifecycle display candidate is non-overlapping with product-
  attribute grouping, route-metadata resolution, and saved-comparison
  navigation. Current source inspection found token labels, UTC lifecycle-date
  formatting, optional fallbacks, and status copy embedded in
  `ApiTokenItem.tsx`; its route-data and route suites passed 55 tests on
  2026-07-14.
- The catalog specification-highlights candidate is non-overlapping with route-
  metadata resolution, saved-comparison navigation, and API-token lifecycle
  display. Current source inspection found bounded sort-order selection
  embedded in `BrowseProductList.tsx`; its catalog route suite passed 62 tests
  on 2026-07-14.
- The recommendation-profile route-data candidate is non-overlapping with
  saved-comparison navigation, API-token lifecycle display, and catalog
  specification highlights. Current source inspection found profile parsing,
  path construction, and revalidation policy split between `loader.ts` and
  `RecommendationPanel.tsx`; its recommendation and snapshot suites passed 11
  tests on 2026-07-14. The completed snapshot contract remains the sole owner
  of snapshot publish-input and GraphQL profile mapping.
- Final whole-batch review found the initial recommendation-profile candidate
  duplicated the completed snapshot contract's GraphQL mapping ownership. The
  ready row, task interface, tests, and exit condition now exclude that policy
  and explicitly preserve `share-comparison-data.ts` as its sole owner.
- Final whole-batch re-review confirmed the narrowed candidate is executable
  within its owned paths and the three ready rows are path-disjoint.
- The saved-comparison naming candidate is non-overlapping with API-token
  lifecycle display, catalog specification highlights, and recommendation-
  profile navigation. Current source inspection found deterministic trimming,
  default, single-product, and ordered multi-product naming embedded in
  `CompareRoute.tsx`; its route suite passed 109 tests on 2026-07-15.
- Before the catalog-highlight claim on 2026-07-15, current source inspection
  confirmed that visible-page merchant filter normalization, selection, and
  heading copy remain embedded in `MerchantDirectoryView`; its route suite
  passed 27 tests.
- The same replenishment pass confirmed that amount-bearing rule selection and
  create-watch input normalization remain embedded in `PriceWatchControl`.
  Its focused alert/control suite passed 6 tests, and the product-detail host
  route suite passed 55 tests.
- Before the saved-comparison naming claim on 2026-07-15, current source
  inspection confirmed that scoring, reasons, review summary/status, reviewed-
  time, and pagination-path policy remain embedded in the 409-line
  `FeedCandidateReviewList`; its route suite passed 17 tests.
- Before the merchant visible-page filter claim on 2026-07-15, current source
  inspection confirmed that normal click qualification, first-party tracking
  href construction, and same-origin redirect resolution remain embedded in
  `TrackedCommerceClickAction`; its offer-discovery route suite passed 51 tests.
  The tracked-click candidate is path-disjoint from merchant filtering, price-
  watch input, and feed-candidate review data.
- The completed merchant visible-page filter contract and existing route
  characterization passed 31 focused tests on 2026-07-15. The contract retains
  ordinary lowercasing, source ordering, existing headings, and input identity;
  independent task review found no actionable issues.
- Before the price-watch input claim on 2026-07-15, current source inspection
  confirmed duplicate immutable set add/remove helpers in API-token and saved-
  comparison route owners, plus map upsert/remove helpers in the token owner.
  Their route suites passed 45 and 31 tests. The shared-state candidate is path-
  disjoint from price-watch input, feed-candidate review, and tracked-commerce
  click data.
- The completed price-watch input contract and existing alert route
  characterization passed 16 focused tests on 2026-07-15. Task review found no
  Critical or Important issue; queue closeout corrected the lane status noted
  as the sole Minor finding.
- Category landing, alerts mutation, and recommendation result contracts
  completed serially on 2026-07-16 with 8, 16, and 13 focused tests. Each task
  passed an independent spec-and-quality review with no findings.
- Shared route-error view data completed on 2026-07-16 with 13 pure contract
  tests and 125 unchanged compare/router tests. TypeScript and the framework/
  router boundary passed; the three previously promoted, mutually disjoint
  successors preserve the ready-row floor.
- Shared comparison mutation data completed on 2026-07-16 in `6c37ca1f` with
  17 focused tests; task re-review was clean after the behavioral assertion fix.
- Catalog advanced-filter view data completed on 2026-07-16 in `c8405e3d` with
  67 focused tests; task re-review was clean after stable-identity coverage.
- Root destination policy data completed on 2026-07-16 in `f78adfc2` and
  `48771a58` with 20 focused tests; task and final re-review were clean after
  the auth-link presentation fix, and verification blocker `ee9cc1ac` was
  reviewed clean.
- Compare saved-set mutation data completed on 2026-07-16 in `a16e47ed` with
  124 focused tests; task review was approved.
- Before the alerts claim, current source inspection confirmed and promoted
  three mutually disjoint successors: comparison snapshot mutation projection
  and local state remain in `ShareComparisonControl`, advanced filter selection
  policy remains in `CatalogAdvancedFilters`, and viewer-specific destination
  composition remains in `RootDestinations`. Their existing snapshot, browse,
  and root characterization suites passed 82 tests on 2026-07-16. None
  overlaps the remaining shared route-error row.
- Before the feed-candidate review view-data claim on 2026-07-15, current source
  inspection confirmed that catalog type-filter initialization and transitions
  plus advanced-filter disclosure policy remain embedded in
  `CatalogFilterForm`; its route suite passed 62 tests. The catalog state
  candidate is path-disjoint from feed-candidate review, tracked-commerce
  clicks, and immutable route-state collections.
- The completed feed-candidate review view-data contract and existing route
  characterization passed 24 focused tests on 2026-07-15. Framework and
  secret/raw-field scans passed, and independent task review found no
  actionable issues.
- Before the tracked-commerce click-data claim on 2026-07-15, current source
  inspection confirmed that explicit-draft detection, trimmed mutation-input
  construction, and successful-draft removal remain embedded in
  `FeedCandidatesRoute`; its route suite passed 17 tests. The mutation-data
  candidate is path-disjoint from tracked-commerce clicks, immutable route-
  state collections, and catalog filter-form state.
- The completed tracked-commerce click-data contract and existing offer-
  discovery route characterization passed 58 focused tests on 2026-07-15. The
  pure owner requires explicit endpoint input and has no framework, transport,
  or environment dependency. Dependency and sensitive-field scans passed, and
  independent task re-review found no actionable issues after exact scheme,
  host, and port coverage was added. Final branch review then identified the
  asynchronous redirect-rejection boundary; route-level regression coverage
  now proves resolution or navigation failures render existing default error
  feedback without escaping the Relay completion callback.
- Reset-password request data completed on 2026-07-16 with 5 pure contract
  tests and 14 unchanged recovery-route tests. The framework-free owner now
  owns normalized token/request data, missing-token error identity, exact
  success copy, and current-response eligibility while React retains URL and
  FormData adaptation, request-version mutation, Relay, state, and
  presentation.
- Shared-comparison view data completed on 2026-07-16 with 4 pure contract
  tests and 6 unchanged snapshot-route tests. The framework-free owner now
  projects captured title and metadata, recommendation state, ordered product,
  claim, and offer facts, honest fallbacks, and the existing compare-path
  policy while React retains Relay, date formatting, markup, and StyleX.
- Before the immutable route-state claim on 2026-07-15, current source
  inspection confirmed product/status/merchant/domain/latest-price labels,
  nullable connection fallbacks, and ordered price-history view rows remain
  embedded in `OfferDiscoveryCard`; its route suite passed 51 tests. The card
  candidate is path-disjoint from immutable route state, catalog filter-form
  state, and feed-candidate review mutation data.
- The completed immutable route-state contract and existing API-token and saved-
  comparison characterization passed 84 focused tests on 2026-07-15.
  TypeScript and the pure-module dependency boundary passed, and independent
  task review found no actionable issues.
- Before claiming Tasks 21–23 on 2026-07-15, current source inspection found
  deterministic category landing composition, alert mutation variables and
  outcomes, recommendation result presentation, and shared route-error
  classification still embedded in four path-disjoint React owners. Their
  category, alerts, recommendation, compare, and router suites passed 138 tests.
  The four successors do not overlap each other or the three claimed rows.
- The completed catalog filter-form, feed-candidate review mutation, and offer-
  discovery card contracts passed 172 focused tests on 2026-07-15. TypeScript
  and all framework/transport/sensitive-field boundaries passed. Independent
  task reviews approved feed and offer directly and approved catalog after an
  explicit runtime-null normalization case was added.

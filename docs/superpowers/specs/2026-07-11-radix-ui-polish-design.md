# Radix UI Polish Design

Date: 2026-07-11
Status: Approved for implementation planning

## Goal

Improve every registered frontend screen so Product Compare feels like a
deliberate, readable application rather than a quick prototype. The result
should be calm and expressive while supporting information-dense product,
offer, comparison, and operational data.

This pass establishes a reusable Radix-backed design system that can be tuned
later as the product's brand colors and visual identity mature.

## Visual Thesis

Product Compare uses calm marketplace surfaces, restrained color, crisp
typography, and expressive changes in scale and spacing. Hierarchy comes from
alignment, typography, whitespace, dividers, and selective surface changes
rather than decorative gradients or excessive card chrome.

Dense screens must remain easy to scan. Parameters are grouped into named
sections, important values are aligned and emphasized, secondary metadata is
visually quieter, and advanced controls use progressive disclosure where that
reduces initial complexity without hiding active state.

## Technology Direction

Use a layered Radix system:

- Radix Themes provides accessible interactive controls and foundational
  color, spacing, radius, typography, and shadow scales.
- Radix primitives remain appropriate for behaviors that Radix Themes does not
  directly cover or where the application needs a more specialized component.
- Thin local wrappers add Product Compare variants, defaults, and semantic
  naming without reimplementing Radix behavior.
- StyleX handles application layout and route-specific composition while
  consuming semantic CSS variables.

Do not build a custom control when a suitable Radix Themes component or Radix
primitive exists. Custom components that need interactive behavior must be
based on the corresponding Radix component unless the required behavior cannot
reasonably be expressed through it.

## Theme and Token System

Wrap the application in a Radix `Theme` configured initially with a restrained
slate neutral scale, an indigo accent, medium radii, subtle shadows, and a
comfortable density. The first pass implements a light theme only.

Define Product Compare semantic CSS aliases above the Radix variables:

- Surfaces: canvas, raised, muted, and interactive.
- Text: primary, secondary, subtle, and inverted.
- Borders: quiet, standard, and emphasized.
- Actions: accent, accent hover, and destructive.
- Commerce states: positive price, coupon, warning, and unavailable.
- Layout: application width, reading width, route spacing, control heights,
  and navigation height.

Map StyleX variables to those semantic CSS aliases. Route and component styles
must consume semantic variables rather than hard-coded brand colors. This
boundary allows later brand adjustments and remains compatible with a future
dark theme without requiring a dark-mode control in this pass.

## Reusable Component Structure

Prefer Radix Themes components directly when no product-specific contract is
needed. Create thin local wrappers where consistent variants or application
semantics add real value. Expected shared building blocks include:

- Application shell and responsive primary navigation.
- Page shell with title, orientation copy, actions, and content regions.
- Button and link-button variants.
- Form controls based on Radix text fields, selects, checkboxes, labels, and
  related primitives.
- Tabs or segmented navigation for view selection.
- Status badges for availability, activity, and operational state.
- Callouts for loading, empty, success, warning, and error feedback.
- Disclosure controls for advanced filter groups and secondary detail.
- Structured list, definition-list, and data-table patterns.
- Action groups and pagination controls.

Cards are reserved for genuine interaction or grouping boundaries. Ordinary
page regions should use layout, dividers, and surface changes instead of a
stack of unrelated panels.

## Application Shell

The shared shell has a recognizable Product Compare wordmark, grouped public
navigation, quieter account or authenticated navigation, a constrained content
canvas, and responsive overflow behavior. The active route is visually clear
without rendering every navigation item as a heavy button.

The main content region supplies consistent outer spacing while allowing route
layouts to select the appropriate reading width or application width.

## Shared Page Composition

Each route uses the same conceptual structure when applicable:

1. Page header with title, short orientation copy, and primary actions.
2. Control region for filters, sorting, view controls, or contextual actions.
3. Content region for lists, comparisons, forms, or operational data.
4. Feedback region for loading, empty, success, warning, and error states.
5. Pagination or continuation controls.

The structure is a composition contract rather than a rigid visual template.
Auth pages remain narrow and focused, while comparison and operational routes
may use the full application width.

## Route Treatment

The pass covers every route registered in `assets/src/router.tsx`.

### Home

Use a more expressive but still product-oriented composition: strong Product
Compare identity, a concise explanation, and three clear shopper paths for
browsing, comparing, and reviewing offers. Secondary and authenticated actions
remain available but visually quieter. Do not introduce a decorative marketing
hero or unrelated imagery.

### Products and Product Detail

Product browse uses clearly separated product rows or responsive product
groups with emphasized product names, compact brand and specification context,
and a consistent decision-action zone. Filters are grouped for scanning;
advanced attribute filters may use disclosure while active filter state stays
visible.

Product detail uses a clear summary, primary decision actions, grouped
specification sections, aligned definition lists, and readable offer context.

### Merchants and Offers

Merchant and offer lists use stable row alignment, emphasized merchant or
product identity, compact metadata, and explicit action placement. Prices,
coupon state, activity, and observation context receive semantic emphasis.
Snapshot metrics remain a coherent summary rather than becoming a dashboard
card mosaic.

### Compare and Saved Comparisons

Comparison views prioritize aligned data. Specification modes use Radix-backed
tabs or equivalent accessible view navigation. Shared values, differences, and
important price signals receive restrained emphasis. Selection and save actions
remain visible without competing with the comparison content.

Saved comparisons use structured rows with product labels, metadata, and a
clear action zone.

### Affiliate Setup, Revenue, Feed Candidates, and API Tokens

Operational screens use dense but readable tables, structured lists, compact
form sections, status badges, and explicit action zones. Destructive or
high-impact actions remain visually distinct. Explanatory copy is concise and
placed near the decision it supports.

### Authentication

Login, registration, logout, forgot-password, reset-password, and email
verification routes use a narrow focused layout with consistent fields,
feedback, submit actions, and recovery links. They do not inherit the dense
application layout.

## Information Density Rules

- Group related parameters under useful labels rather than presenting one
  continuous form or list.
- Keep primary identity, status, price, and action information in predictable
  positions.
- Use typographic weight and muted text before adding more colors.
- Align comparable values in columns or definition lists.
- Keep active filters visible even when advanced filter controls are collapsed.
- Use responsive horizontal scrolling for genuinely tabular comparisons rather
  than destroying column relationships on small screens.
- Preserve document order and meaning when multi-column layouts collapse.
- Ensure controls and actions remain reachable at narrow widths.

## Feedback and Error Handling

Standardize feedback with Radix-backed treatments while preserving current
route semantics:

- Loading states retain stable page structure and concise status text.
- Empty states explain the condition and provide the most useful next action.
- Errors use accessible alert semantics and clear recovery guidance.
- Mutation success and failure feedback does not cause avoidable layout jumps.
- Disabled and in-progress actions retain explicit labels.
- Status badges supplement rather than replace text.

Existing loader recovery, Relay error boundaries, mutation behavior, and route
error contracts remain intact.

## Interaction and Motion

Use small, consistent transitions to clarify hierarchy and affordance:

- Active navigation and tab-state transitions.
- Disclosure expansion for advanced filters or secondary detail.
- Hover and focus transitions for interactive rows and actions.

Motion must respect reduced-motion preferences, remain fast, and never delay
navigation, form submission, or data interaction.

## Data and Behavior Constraints

This is a presentation-layer pass. Preserve:

- Relay queries and data requirements unless presentation needs a currently
  queried field to be rendered differently.
- Loader, mutation, pagination, authorization, and session behavior.
- Route URLs, query-string semantics, and form-submission contracts.
- Existing accessible names and behavior-test contracts unless a deliberate
  usability improvement requires an accompanying behavior-test update.

No backend or GraphQL API changes are part of this design.

## Implementation Sequence

1. Add Radix Themes and establish theme, semantic tokens, and shared controls.
2. Polish the application shell and shared feedback/page patterns.
3. Polish home and shopper routes: products, detail, merchants, offers,
   compare, and saved comparisons.
4. Polish operational routes: affiliate setup, revenue, feed candidates, and
   API tokens.
5. Polish all authentication routes.
6. Run complete verification and reconcile the frontend lane and dispatch
   documentation at the implementation milestone boundary.

Implementation planning must account for the repository's live queue rules
before claiming this work and must preserve the ready-work floor.

## Testing and Verification

Use behavior-first tests for shared components and meaningful accessibility
semantics. During implementation, run focused route suites at each milestone.
Before completion, run:

- The complete frontend unit test suite.
- TypeScript typechecking.
- Relay generation if GraphQL query markup changes.
- Client and SSR production builds through the repository's `bun run build`
  gate.
- Diff hygiene checks.
- The work-queue validator after queue or lane documentation changes.

Visual polish should also be reviewed across representative wide and narrow
viewport layouts without changing product behavior.

## Non-Goals

- A final brand identity or finalized brand color selection.
- Dark-mode UI or a theme switcher.
- Backend, GraphQL schema, or data-model changes.
- New product capabilities or altered route behavior.
- Decorative imagery, a marketing-site redesign, or ornamental animation.
- Replacing StyleX as the route-layout styling system.

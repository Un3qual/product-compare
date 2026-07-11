# Task-First Workspace Layout Design

Date: 2026-07-11
Status: Approved for implementation planning

## Context

The first Radix UI pass established a calmer visual language, semantic theme
tokens, shared controls, and consistent page styling. It did not sufficiently
change the information architecture of several screens. Many routes still use
the same flat sequence of page header, controls, summaries, and repeated list
rows. The result looks more deliberate but can still feel like a styled
parameter dump.

This follow-up pass changes layout and reading order across every registered
screen. It preserves the approved calm, expressive visual direction and the
existing Radix-backed theme while making the primary task, supporting context,
and detailed information easier to distinguish.

## Goal

Give every screen a clear answer to two questions:

1. What should the user look at or do first?
2. Where can the user find supporting detail without losing the primary task?

The interface remains information dense. Density comes from alignment,
predictable placement, concise labels, and progressive disclosure rather than
from compressing unrelated parameters into one uninterrupted surface.

## Chosen Direction

Use a task-first workspace as the dominant application layout.

- Primary results, records, or decision content occupy the main workspace.
- Filters, summaries, and secondary actions live in a context rail when they
  support the primary workspace.
- Major categories of detail use Radix Tabs when users switch between peer
  views.
- Supporting groups use Radix Accordion or Collapsible when the information is
  useful but not required for initial understanding.
- Creation and infrequent configuration flows use Radix Dialog where removing
  the form from the persistent page makes the existing records easier to scan.

This direction was selected over a purely guided single-column layout and a
table-first layout. Guided layouts remain appropriate for authentication and
setup flows. Tables remain appropriate for genuinely relational data, but
neither becomes the single composition applied indiscriminately to every
screen.

## Layout Archetypes

### Workspace

The workspace composition has a flexible main region and an optional context
rail. The main region contains the current result set, record list, comparison,
or operational queue. The rail contains controls and context that directly
affect or explain that content.

At wide widths the rail is sticky below the application navigation. It has a
stable width and its own logical sections, but it does not become a stack of
decorative cards. At narrow widths the rail content moves before the main
content and is exposed through a Radix Collapsible or Dialog as appropriate.
Document order remains meaningful when the columns collapse.

Use this archetype for catalog browse, offer discovery, merchant directory,
saved comparisons, API tokens, revenue, and feed candidates.

### Detail

The detail composition starts with identity, a concise decision summary, and
primary actions. Peer categories of detailed information follow in Radix Tabs.
Within a tab, dense supporting groups may use Radix Accordion.

Tabs must preserve meaningful URLs when the selected view should be shareable
or survive navigation. Initial content must not be duplicated merely to fill
tabs, and important decision information must not be hidden behind a tab.

Use this archetype for product detail and comparison.

### Guided Flow

The guided-flow composition presents a small number of ordered steps or
clearly sequenced sections. Only complexity relevant to the current action is
prominent. Supporting explanation is placed beside the decision it explains,
not in a disconnected preamble.

Use this archetype for authentication, affiliate setup, and focused creation
or configuration flows.

## Shared Composition Components

Add reusable layout components only where they establish a stable semantic or
responsive contract:

- `WorkspaceLayout`: main workspace plus optional responsive context rail.
- `ContextRail`: labeled groups for filters, summary, and secondary actions.
- `MobileContextPanel`: the same context content exposed through a Radix
  Collapsible or Dialog at narrow widths.
- `DetailTabs`: a thin, URL-aware composition based on Radix Tabs.
- `DisclosureGroup`: a thin semantic composition based on Radix Accordion.
- `SummaryStrip`: a compact definition-list treatment for metrics and decision
  signals without dashboard-card chrome.
- `FilterBar`: essential search, sort, and scope controls.
- `ActiveFilterChips`: removable active filters that remain visible when
  advanced controls are closed.
- `RecordTable`: a responsive semantic table for relational operational data.
- `ActionDialog`: a shared Radix Dialog pattern for creation and infrequent
  configuration forms.

Do not add a wrapper when direct use of a Radix component is clearer. Local
interactive components must be built on Radix primitives or Radix Themes
components unless the required behavior cannot reasonably be expressed with
them.

## Route Treatment

### Application Shell And Home

Reduce the visual dominance of route headers so the current task starts closer
to the top of the viewport. Keep the application shell calm and recognizable.

The home route prioritizes three shopper goals: browse products, compare
products, and find offers. Account and operational destinations remain
available through secondary navigation and do not compete equally with those
primary paths.

### Catalog Browse

Place results in the main workspace. Keep search, sort, page size, and the most
useful product-type control immediately available. Move advanced taxonomy and
attribute controls into progressive disclosure in the context rail. Keep
active filters visible as removable chips even when advanced controls are
closed.

Place the result count, active selection state, and pagination adjacent to the
results they describe. Product rows use stable identity, highlight, metadata,
and action zones rather than a loose vertical collection of facts.

### Offer Discovery And Merchant Directory

Offer results and merchant records become the main workspace. Essential scope
and sort controls live in the rail. Offer snapshot metrics use a compact
summary strip near the result heading. Price, availability, coupon state, and
observation freshness occupy predictable columns or aligned row regions.

Merchant rows emphasize merchant identity and current program state. Less
frequently needed metadata is disclosed without obscuring the primary action.

### Product Detail

Present product identity, decision highlights, offer range, and primary actions
before exhaustive attributes. Use Radix Tabs for overview, specifications, and
offers. The overview preserves the important cross-category signals so users
do not need to inspect every tab before understanding the product.

Specifications are grouped into understandable attribute families. Dense
families may use Accordion, while small groups remain directly visible.

### Comparison

Keep selected products as stable column anchors while specification groups form
readable rows. Preserve horizontal relationships on narrow screens with a
labeled scroll region rather than stacking values into unrelated blocks.

Keep a decision summary visible near the comparison controls. It highlights
meaningful differences, missing data, and available price signals without
claiming a universal winner. Specification modes remain Radix Tabs and retain
their current URL behavior.

### Saved Comparisons And API Tokens

Existing records are the primary content. Move creation forms into Radix
Dialogs so they do not permanently consume the first screenful. Keep one-time
token disclosure prominent and outside ordinary record density when it exists.

Record actions remain scoped to their row. Destructive actions keep explicit
labels, confirmation behavior, and visible pending or error feedback.

### Revenue, Feed Candidates, And Affiliate Setup

Revenue starts with the reporting scope and concise summary, followed by the
records or breakdown that support it. Feed candidates start with review status
and the next required action; diagnostics and source metadata are secondary.

Affiliate setup becomes a guided operational flow. Current integration status
and required next action appear before configuration detail. Network, program,
link, and coupon management use ordered sections, peer tabs, or dialogs based
on whether the user is switching views or performing a focused mutation.

### Authentication

Authentication remains narrow and focused. Heading scale and surrounding
chrome become quieter. The current form action is primary; recovery links,
explanation, and alternate authentication destinations remain visibly
secondary. Existing GraphQL session behavior and route contracts are
unchanged.

## Responsive Behavior

- Wide workspace layouts use a main column and a rail sized by semantic layout
  tokens.
- The rail becomes non-sticky before it would constrain the main reading area.
- Narrow layouts expose contextual controls in a Radix Collapsible or Dialog
  with a clear summary of active state.
- Genuine tables and comparison matrices retain column relationships through
  labeled horizontal scroll regions.
- Sticky elements account for the application navigation height and never hide
  focused controls.
- Touch targets, focus rings, and action spacing remain usable at narrow
  widths.

## Theme And Tokens

The existing Radix theme and Product Compare semantic aliases remain the source
of truth for color, spacing, typography, radii, borders, shadows, and motion.
Add semantic layout tokens for:

- workspace column gap;
- context rail width;
- sticky navigation offset;
- compact content spacing;
- table cell spacing;
- route header scale; and
- responsive layout thresholds where CSS variables are appropriate.

Do not hard-code brand colors or create a second token system. The additions
must remain compatible with later brand tuning and a future dark theme.

## Accessibility

- Use semantic tables when values have row and column relationships.
- Preserve a logical heading hierarchy based on reading order.
- Use Radix keyboard and focus behavior for tabs, dialogs, accordions,
  collapsibles, and other interactive disclosure.
- Keep selected tabs, active filters, statuses, and differences understandable
  without relying on color alone.
- Give horizontal comparison regions accessible names and keyboard-reachable
  content.
- Restore focus appropriately when dialogs close.
- Preserve live-region behavior for loading, mutation, and error feedback.

## Behavior And Data Constraints

This remains a presentation and information-architecture change. Preserve:

- Relay queries and fragments unless a currently available field must move to
  a different visible region;
- loader, mutation, authorization, and session behavior;
- route URLs and existing query-string semantics;
- filter and pagination contracts;
- compare selection and saved-set behavior;
- tracked outbound commerce behavior; and
- existing feedback and recovery contracts.

No backend or GraphQL API changes are included.

## Verification Strategy

Add behavior-first tests for the new shared layout contracts and for meaningful
route hierarchy. Tests should assert semantics and user-visible behavior rather
than source strings or implementation details.

At each route-family milestone run its focused route suites, the shared UI
suites, TypeScript typechecking, and the production build. Before completion,
run the full frontend suite, Relay artifact checks, client and SSR production
builds, formatting/diff checks, and the work-queue validator.

## Implementation Order

1. Establish layout tokens and shared workspace, disclosure, summary, table,
   and dialog compositions.
2. Reshape the shell, home, catalog, merchants, and offers around the workspace
   hierarchy.
3. Reshape product detail and comparison around decision-first detail layouts.
4. Reshape saved comparisons and operational routes around records-first and
   guided-flow layouts.
5. Tighten authentication hierarchy and narrow-screen behavior.
6. Run full verification, update lane evidence, commit milestones, push the
   existing PR branch, and re-check review feedback.


# Base UI, StyleX, And Table Foundation Design

## Status

Approved by the user on 2026-08-11. The user approved a complete cutover and
asked execution to continue without additional approval checkpoints until the
first complete implementation is finished.

## Problem

The production UI spine currently mixes project-authored wrappers, Radix
Themes, and individual Radix primitives. Its controls are functional and well
covered, but the dependency and API surface is wider than necessary. The
application also renders three table surfaces directly without one headless
table model, and production StyleX class names remain long even though the user
provided an initial mangling plugin.

The supplied `assets/src/stylex-mangle.ts` is a useful prototype but is not yet
safe to enable. It lives with runtime source instead of build tooling, assumes
the `__stylex_` prefix while the configured StyleX compiler emits the default
`x` prefix, maintains bundle-local ordinal mappings that can diverge between
the separate client and SSR builds, defines local approximations of Rollup
types, and has no behavioral coverage.

## Goal

Replace Radix completely with locally owned `shadcn-cssinjs` components built
on Base UI, preserve and refine ProductCompare's visual identity, use TanStack
Table for every current semantic table, and enable deterministic production
StyleX class-name mangling across client and SSR output.

## Source Baseline

- Vendor source: `shadcn-labs/shadcn-cssinjs` commit
  `5f0337ee4606f5d6c8f3cb2cb95924c8a70e9a5f`.
- Base UI: exact dependency `@base-ui/react@1.7.0`.
- TanStack Table: exact dependency `@tanstack/react-table@9.1.2`.
- StyleX remains `@stylexjs/stylex@0.18.1` with the existing Babel pipeline.
- React remains `19.2.4`; Relay, React Router SSR, Vite, and Vitest remain
  unchanged.

The registry source is copied into this repository and then owned here. It is
not a runtime dependency on the registry website. Adaptations must preserve the
recognizable upstream component boundary while using repository aliases,
ProductCompare tokens, 44px controls, and existing form contracts.

## Approved Architecture

### Component ownership

Relevant registry components live in `assets/src/ui/primitives/`. They import
Base UI only inside the primitive layer. Routes and ProductCompare composites
consume the local primitive APIs and do not import Base UI directly.

The cutover is complete in one batch:

- remove all `@radix-ui/*` packages and imports;
- remove the Radix Themes stylesheet and provider;
- remove the Slot compatibility primitive;
- migrate `asChild` composition to Base UI's `render` API;
- migrate old `solid`, `soft`, numeric-size, and `tone` props to the registry's
  `default`, `secondary`, `ghost`, `destructive`, `sm`, `default`, and `lg`
  variants; and
- keep product-specific composites only where they encode real application
  behavior, such as destructive confirmation and localized feedback.

The selected registry component set is Button, Input, Textarea, Checkbox,
Radio Group, Select, Label, Separator, Collapsible, Accordion, Dialog, Alert
Dialog, Popover, Spinner, Alert, Badge, Tabs, Scroll Area, and Table. Do not add
unused registry components or a general design-system package.

### Theme and visual direction

ProductCompare's existing semantic variables remain the source of truth. The
shadcn-style variables used by copied registry code alias to the existing
`--pc-*` values rather than defining a second palette. The migration may
improve contrast, focus visibility, spacing consistency, control density, and
responsive behavior, but it must preserve the warm mineral/paper canvas,
decisive ink, comparison blue, freshness green, Instrument Sans, and IBM Plex
Mono identity.

Visual thesis: ProductCompare remains a warm, precise buying workbench. The new
component foundation should make it feel calmer and more coherent, not like a
stock shadcn demo.

Content plan: product routes continue to lead with the primary working surface,
then decision context, localized feedback, and one clear action per region.
No marketing hero, dashboard-card mosaic, or ornamental component gallery is
introduced.

Interaction thesis: Base UI state attributes drive consistent 120-180ms
overlay and disclosure transitions, visible keyboard focus, and predictable
pressed/open/selected feedback. `prefers-reduced-motion` removes movement
without removing state or focus cues.

### StyleX build contract

Move the user-supplied prototype to focused build tooling:

- `assets/plugins/stylex-class-name.ts` owns validated parsing, deterministic
  encoding, and text rewriting;
- `assets/plugins/stylex-mangle.ts` owns the Vite/Rollup lifecycle and bundle
  reference updates; and
- `assets/stylex-plugin.ts` exports one production class prefix used by both
  the Babel plugin and mangler configuration.

Production StyleX compilation uses the distinctive alphanumeric `pcx` prefix. The
mangler converts each base-36 StyleX hash directly to a CSS-safe base-62 name
with a one-character namespace, making the mapping injective and independent
of discovery order or bundle contents. A class therefore receives the same
short name in client and SSR builds even when their module graphs differ.
Development and test builds retain readable StyleX output.

The plugin uses official Vite/Rollup types, applies only to production builds,
rewrites JavaScript, emitted CSS, and emitted HTML, refreshes content-hashed CSS
references when required, ignores StyleX variables and keyframes, and fails on
an authored-class collision. It does not write a persistent manifest or rely
on one build running before another.

The production bundle gate must prove that client and SSR output contain
mangled StyleX classes, contain no unmangled `pcx` atomic class names, and
stay within the existing client bundle budget.

### Table contract

All three current table surfaces use TanStack Table v9 as their headless row
and column model and the local shadcn-cssinjs Table primitives for semantic
markup:

- `AttributionLedger` preserves Relay-owned server filtering, ordering,
  pagination, retry, partial failure, and load-more behavior;
- `DecisionSummary` preserves exact Decimal, mixed-currency, incomplete-page,
  coupon, and recent-price presentation; and
- `CompareSpecificationMatrix` preserves product order, all/shared/difference
  modes, missing cells, row headings, and deliberate horizontal overflow.

Each table defines only the TanStack features it uses. Initial migration uses
the v9 core row model only; it does not invent client sorting, filtering,
selection, pagination, or virtualization that would compete with Relay or URL
state. Data and column definitions have stable references at module scope or
through `useMemo`, and each specialized table owns its own columns rather than
being forced through a generic all-purpose DataTable abstraction.

### Behavior and error handling

The migration preserves:

- native form names, values, disabled state, required state, reset behavior,
  and controlled/uncontrolled Select behavior;
- link versus button semantics and default `type="button"` safety;
- dialog focus trapping, dismissal, action/cancel behavior, and focus return;
- keyboard navigation, visible focus, selected/highlighted states, and
  accessible names;
- SSR markup, hydration, Relay ownership, and route error boundaries; and
- existing empty, loading, unavailable, validation, and mutation feedback.

No GraphQL, backend, URL, authorization, or product-policy contract changes in
this batch.

## Verification

Use test-first cycles for the mangler, primitive contracts, provider boundary,
and standardized table markup. Existing route tests are characterization
coverage for behavior-preserving consumer and table migrations.

Completion requires:

- focused mangler, primitive, overlay, layout, compare, and revenue tests;
- the complete frontend unit suite;
- Relay validation, TypeScript, lint, and formatting;
- client and SSR production builds plus bundle and mangling contracts;
- deterministic production UI Playwright coverage at desktop, tablet, and
  mobile widths with accessibility, keyboard, reduced-motion, and visual
  inspection;
- no remaining Radix dependency or import;
- `mix work_queue.validate` and `git diff --check`; and
- a final anti-slop review of every new helper, wrapper, compatibility path,
  and fallback.

## Non-goals

- No Tailwind CSS.
- No second token source or stock shadcn theme.
- No new component package or monorepo boundary.
- No route feature redesign, backend change, or Relay ownership change.
- No speculative TanStack features.
- No permanent Radix compatibility layer.
- No one-off wrappers that only rename a registry component.

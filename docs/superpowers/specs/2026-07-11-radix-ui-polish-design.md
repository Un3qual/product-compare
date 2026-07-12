# Frontend UI Architecture

Date: 2026-07-11
Status: Implemented

## Goal

Keep Product Compare calm, expressive, and readable even when a screen carries
many filters, attributes, offers, or operational controls. Hierarchy comes from
alignment, typography, spacing, dividers, and restrained surface changes rather
than a grid of decorative cards.

## UI Stack

- Radix primitives provide interactive behavior: Dialog, Scroll Area, Tabs,
  Accordion, Collapsible, Direction, Label, Separator, and Slot.
- Project components provide product semantics and styling. Interactive wrappers
  compose the relevant Radix primitive instead of recreating its behavior.
- StyleX handles component and route composition.
- `assets/src/ui/theme/theme.css` owns brand primitives and semantic CSS tokens.
  `tokens.stylex.ts` exposes those semantic tokens to StyleX.
- Native controls remain appropriate where browser form behavior is the useful
  behavior, including GET-form selects, date inputs, checkboxes, and radios.

The application does not import the all-components Radix Themes stylesheet.
That stylesheet was disproportionate to the small subset of widgets in use.

## Theme Contract

Brand tuning starts with the primitive variables at the top of `theme.css`.
Components and routes consume semantic variables only:

- surfaces: canvas, raised, muted, interactive;
- text: primary, secondary, subtle, inverted;
- borders: quiet, standard, emphasized;
- actions and states: accent, hover, positive, coupon, warning, danger,
  unavailable;
- shape and depth: small, medium, and large radii plus overlay shadow; and
- layout: page width, reading width, navigation height, route spacing, control
  height, workspace gap, context-rail width, and table spacing.

This boundary allows later brand and dark-theme work without rewriting route
styles.

## Composition Rules

Use shared components when they encode a repeated semantic or behavioral
contract. Do not create a component only to wrap one route-specific fragment.

- `PageShell` supplies route title, orientation copy, actions, and content.
- `WorkspaceLayout` keeps the primary task before supporting context in both DOM
  and responsive visual order.
- `ContextRail` contains filters, selection controls, and adjacent actions.
- `DetailTabs`, `DisclosureGroup`, and `ActionDialog` use Radix behavior.
- `SummaryStrip`, `DataList`, `StatusBadge`, `FeedbackState`, and `Pagination`
  standardize dense repeated information.
- `Button` and `TextField` are small styled semantic wrappers. `Button` uses the
  Radix Slot primitive for `asChild` composition.

Cards are reserved for real grouping or interaction boundaries. Prefer a clear
reading path, aligned definitions, and dividers for ordinary records.

## Screen Archetypes

- Discovery routes place results in the primary workspace and filters in the
  context rail. Advanced filters use progressive disclosure.
- Product detail uses URL-addressable Overview, Specifications, and Offers tabs.
- Comparison prioritizes decision signals and the aligned specification matrix;
  selection and save controls remain adjacent in the context rail.
- Record and operations routes keep inventories, reports, or review queues in
  the primary reading path and place scope controls in the rail.
- Authentication routes use a focused form panel with concise account context.

At narrow widths the primary workspace remains first. Supporting controls move
below it, matching visual, reading, and keyboard order.

## Accessibility And Testing

- Preserve native landmarks, labels, table relationships, and control types.
- Test user-visible behavior and accessibility state, not private Radix class
  names or incidental component markup.
- URL-backed view state must survive refresh and sharing.
- Dialog focus management, tabs, disclosures, and scroll areas stay delegated
  to Radix primitives.
- Reduced-motion preferences disable nonessential transitions.

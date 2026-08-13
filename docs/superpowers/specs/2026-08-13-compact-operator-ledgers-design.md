# Compact Operator Ledgers Design

## Goal

Make the revenue attribution and CJ program ledgers materially denser and keep
every table inside the workspace available beside its context rail without
removing operator information or capabilities.

## Non-Loss Contract

The redesign must preserve every fact and action currently exposed by the
affected surfaces:

- Revenue click time, source surface, link type, customer identity state,
  referrer, user agent, IP address, merchant, product, affiliate network,
  merchant SKU, affiliate program code, and every matched conversion.
- Conversion order amount, commission amount, currency, status, attribution
  confidence, network reference, merchant, product, affiliate network,
  purchased time, and reported time.
- CJ advertiser name and ID, provider, feed count, lifecycle stage, warnings,
  last-change time, required action, note, stage editing, save feedback, and
  program-feed inspection and recovery.

Information may move into an accessible disclosure when it is secondary to
scanning, but it must remain available without navigation or a separate page.

## Revenue Ledger Composition

The ledger will use four columns instead of five:

1. **Visit** combines click time, source/link badges, and identity. The click
   time and email or anonymous state remain the primary scan targets.
2. **Request** keeps the referrer as the primary fact and presents the browser
   and IP address as compact secondary metadata.
3. **Commerce** keeps merchant and product together, followed by compact
   network, SKU, and program metadata.
4. **Conversion** presents each match as one dense summary line led by order
   amount, with status, match confidence, and reference available without
   expansion.

Cell content should use short inline groups where facts naturally belong
together. Vertical stacks remain only when they create a real hierarchy. Row
height must come from content, not generous nested-card padding or repeated
gaps.

## Conversion Disclosure

The collapsed conversion summary will not be a card nested inside the table.
Its disclosure opens a compact, visually organized investigation panel:

- An earnings strip pairs order amount with commission amount.
- A commerce context line identifies merchant, product, and affiliate network.
- A two-event timeline shows purchased and reported states with their exact
  timestamps, including the existing missing-purchase fallback.

The panel will use labels and spatial grouping rather than prose sentences or a
definition-list/parameter-dump layout. The disclosure remains keyboard
operable, exposes its open state, and retains the conversion reference in its
accessible name.

## CJ Program Composition

The main CJ row will contain four compact columns: Merchant, Lifecycle, Last
change, and Action. The Action column shows the required next step and one
`Edit program` disclosure trigger. It will not contain the full form.

Expanding a program inserts a full-width detail row directly after its summary
row. That row contains the stage selector, note field, save action and feedback,
and feed disclosure/recovery controls. The edit region is associated with the
program name, and closing it returns the table to its compact scanning state.
Warnings remain visible in the collapsed lifecycle cell because they can change
the required action.

## Table Containment

The shared table container must be allowed to shrink inside grid and flex
parents by using a zero minimum inline size. Operator tables will remove fixed
64–68rem minimum widths and define content-sized column behavior locally.

At desktop widths, operator tables must fit inside the workspace column beside
the context rail. At narrower widths, the context rail already moves below the
workspace; if a table still needs horizontal scrolling, the scroll must be
contained within the table container and no column may be visually hidden by
the rail or create document-level overflow.

Other consumers of the shared table primitive will receive a containment audit.
True comparison matrices may keep deliberate internal horizontal scrolling;
ordinary ledgers must not solve density by becoming wider.

## Accessibility and Responsive Behavior

- Keep native table semantics for ledger relationships.
- Disclosure triggers must describe both the action and their program or
  conversion target.
- Expanded CJ content must use one cell spanning all visible columns.
- Keyboard operation, focus visibility, reduced motion, and existing independent
  error boundaries remain unchanged.
- Desktop, tablet, and mobile checks must prove no document-level horizontal
  overflow and must measure that every shared table container stays within its
  rendered parent.

## Verification

Focused component/route tests will first characterize the four-column revenue
ledger, non-loss conversion disclosure, compact CJ summary row, full-width edit
row, and table-container shrink behavior. These tests must fail against the
current implementation before production changes begin.

Browser acceptance will cover revenue and CJ at the existing desktop, tablet,
and mobile viewports. It will assert preserved information, exercise both
disclosures and their mutations/recovery paths, run accessibility analysis,
check document width, and verify all rendered shared table containers remain
inside their parent bounds. The complete frontend gate and relevant repository
validation will run before closeout.

## Scope Boundaries

This work does not change GraphQL data contracts, loader ownership, pagination,
mutation behavior, failure isolation, backend operator behavior, or the
workspace/context-rail breakpoint. It does not convert ledgers into cards or
reduce typography merely to conceal structural bloat.

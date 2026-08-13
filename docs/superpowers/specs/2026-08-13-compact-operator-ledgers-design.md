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

Record information must not move into a disclosure merely to make a row appear
smaller. Disclosures remain appropriate for working interfaces such as the CJ
edit form and feed inspection, where the operator is starting a task rather
than scanning a record.

## Information Hierarchy

Every cell must distinguish three levels instead of giving each fact equal
visual weight:

1. **Primary facts** answer which record this is and what state it is in. They
   use the strongest weight and occupy the first scan line.
2. **Supporting facts** explain the primary fact or the next decision. They use
   normal or secondary text and stay close to the fact they qualify.
3. **Diagnostic identifiers** support investigation but rarely drive the first
   decision. They use compact monospaced or subdued text without becoming a
   vertical parameter list.

Badges remain useful for genuinely categorical state, such as lifecycle,
conversion status, and confidence. Cards or tinted groups remain acceptable
when they make one meaningful unit easier to parse, but they must not create a
second layout shell around every cell or promote low-value metadata.

## Revenue Ledger Composition

The ledger will use four columns instead of five:

1. **Visit** combines click time and identity as primary facts. Source surface
   and link type are supporting context on the same compact band.
2. **Request** keeps the referrer as the primary fact. Browser identity is
   supporting context and IP address is diagnostic metadata.
3. **Commerce** leads with merchant and product. Affiliate network supports
   that relationship; SKU and program code are diagnostic identifiers on one
   compact line.
4. **Conversion** leads with order value and conversion status. Commission and
   attribution confidence are supporting decision facts. Merchant, product,
   network, purchased/reported times, and network reference remain visible as
   compact context and diagnostic lines.

Cell content should use short inline groups where facts naturally belong
together. Vertical stacks remain only when they create a real hierarchy. Row
height must come from content, not generous nested-card padding or repeated
gaps.

## Conversion Composition

Conversion information will be visible in the ledger without a details
disclosure. Each matched conversion forms one compact record with three bands:

- The primary band pairs order value with status, then commission with match
  confidence.
- The context band identifies conversion merchant, product, and affiliate
  network without repeating a heading or card shell.
- The time/reference band shows purchased and reported timestamps and the
  network reference, including the existing missing-purchase fallback.

Short labels and spatial grouping replace prose sentences and parameter dumps.
Multiple conversions remain separate list items inside the conversion cell so
real additional information, rather than decorative spacing, determines row
height.

## CJ Program Composition

The main CJ row will contain four compact columns: Merchant, Lifecycle, Last
change, and Action. No cell may contain a heading element. Merchant name,
lifecycle state, and required action are the primary scan targets. Provider,
advertiser ID, and feed count form one supporting metadata line. The exact
last-change time remains visible but visually secondary. Warnings remain next
to lifecycle state and become prominent only when present.

The Action column shows the required next step and one compact `Edit program`
trigger. It will not contain the full form.

Expanding a program inserts a full-width detail row directly after its summary
row. That row contains the stage selector, note field, save action and feedback,
and feed disclosure/recovery controls. The edit region is associated with the
program name, and closing it returns the table to its compact scanning state.
Warnings remain visible in the summary lifecycle cell because they can change
the required action. The full-width edit row may use a grouped surface because
it is a task workspace, but its stage, note, save, feedback, and feed controls
must use a compact horizontal hierarchy where space allows.

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

The shared table primitive will use a modestly tighter cell rhythm so all table
consumers benefit. Route-level composition, not globally tiny typography or an
arbitrary height cap, remains the primary density mechanism. Comparison row
headers keep their semantic emphasis, while ordinary data cells avoid headings
and card-like vertical stacks.

## Accessibility and Responsive Behavior

- Keep native table semantics for ledger relationships.
- CJ edit and feed disclosure triggers must describe both the action and their
  program target.
- Expanded CJ content must use one cell spanning all visible columns.
- Keyboard operation, focus visibility, reduced motion, and existing independent
  error boundaries remain unchanged.
- Desktop, tablet, and mobile checks must prove no document-level horizontal
  overflow and must measure that every shared table container stays within its
  rendered parent.

## Verification

Focused component/route tests will first characterize the four-column revenue
ledger, always-visible conversion facts, heading-free CJ summary row,
full-width edit row, and table-container shrink behavior. These tests must fail
against the current implementation before production changes begin.

Browser acceptance will cover revenue and CJ at the existing desktop, tablet,
and mobile viewports. It will assert preserved information without imposing
brittle pixel or row-height limits, exercise CJ editing/feed recovery, run
accessibility analysis, check document width, and verify all rendered shared
table containers remain inside their parent bounds. Generated screenshots will
be inspected for hierarchy, wrapping, and wasted space. The complete frontend
gate and relevant repository validation will run before closeout.

## Scope Boundaries

This work does not change GraphQL data contracts, loader ownership, pagination,
mutation behavior, failure isolation, backend operator behavior, or the
workspace/context-rail breakpoint. It does not convert ledgers into cards or
reduce typography merely to conceal structural bloat.

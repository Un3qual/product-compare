# Revenue and CJ Operator Dashboard Design

## Status and Precedence

This document records the approved visual direction for the revenue reporting
and CJ programs operator screens.

It supersedes
`docs/superpowers/specs/2026-08-13-compact-operator-ledgers-design.md` where
that document requires all revenue diagnostics to remain visible in the closed
table row or retains the persistent CJ context rail. The earlier non-loss,
table-containment, accessibility, mutation, pagination, and failure-isolation
contracts remain in force unless this document explicitly changes them.

The generated mockups were design exploration only. This document is the
durable implementation source of truth.

## Goal

Turn both operator pages into compact, decision-oriented dashboards while
retaining the Product Compare application's existing light, warm visual
language and preserving every fact and action already available.

The pages should answer three questions in order:

1. What is happening overall?
2. Which records need attention?
3. What evidence is available when an operator investigates one record?

The default view must optimize for the first two questions. The third belongs
in a deliberate row-level expansion, not in every closed row.

## Visual and Interaction Thesis

**Visual thesis:** a calm, light operational workspace with strong alignment,
shallow surfaces, quiet dividers, compact typography, and the application's
existing blue accent; hierarchy comes from placement and type weight rather
than nested cards, large headings, or decorative chrome.

**Content plan:** controls first, aggregate status second, dense work ledgers
third, and record evidence only when requested.

**Interaction thesis:** filters update the whole working set; a compact ledger
row expands an immediately adjacent full-width detail row; lifecycle editing
uses the same established below-row workspace pattern. State changes should
use the application's existing restrained transition behavior and respect
reduced-motion preferences.

Cards, pills, and status color are allowed when they clarify a real unit or
state. They must not turn every fact into its own object or create a dashboard
card mosaic.

## Shared Information Hierarchy

Every surface uses three levels of emphasis:

1. **Decision facts** identify the record, outcome, or required action. They
   receive the strongest weight and occupy the most stable scan positions.
2. **Comparison facts** distinguish neighboring records, such as time, money,
   lifecycle, conversion status, and feed health. They remain visible in the
   closed view.
3. **Investigation facts** prove or diagnose the record, such as request
   evidence, network references, IDs, SKUs, and exact secondary timestamps.
   They remain available without being repeated in every closed row.

No ordinary data cell uses a heading element. Labels inside a compact group
use normal text, definition-list semantics, or table headers as appropriate.
Status badges are reserved for categorical state, not generic metadata.

## Revenue Reporting

### Page Composition

The page keeps the existing title, preview label, explanatory copy, and Product
Compare shell. It is composed as:

1. one shallow filter command band aligned with the page heading;
2. one dashboard band containing attribution performance, revenue outcome,
   and recent conversion modules;
3. one dense attribution-click ledger.

The modules form one dashboard band, but they should not each accumulate thick
shells or large empty interiors. On a wide screen the three modules share one
row. On narrower screens they wrap at meaningful boundaries before individual
contents are squeezed.

### Filter Command Band

The existing network, currency, from, and to controls remain, along with date
preset links, apply, and clear behavior. They sit in one shallow, responsive
band. Labels remain visible, controls use intrinsic widths, and actions stay in
the same scan line when space permits.

The band may wrap into two compact lines at smaller widths. It must not create
document-level overflow or force the ledger wider. Active filters may use a
quiet inline summary, but they must not produce a second tall strip of chips.

### Attribution Performance Module

This module presents:

- clicks;
- conversions;
- conversion rate.

Clicks and conversions are the inputs; conversion rate is the derived result.
The relationship may use a restrained directional treatment, but it is not a
progress bar and does not imply that clicks advance through guaranteed stages.

Conversion rate is calculated only when clicks and conversions are present and
clicks are greater than zero. It is `conversions / clicks`, formatted as a
percentage with at most one decimal place. When either input is unavailable or
clicks are zero, the rate is `Not available`; the interface must not display
`NaN`, infinity, or a misleading zero.

The three values have clear visual priority without each becoming a large
card. A short formula note is acceptable if it fits without increasing the
module's height materially.

### Revenue Outcome Module

This module presents the existing server-provided metrics:

- gross order value;
- commission revenue;
- average paid price.

The amounts use one aligned metric row with quiet separators. Currency is
shown with each amount because the filter can change it and because a standalone
number is ambiguous. Missing values retain the existing `Not available`
semantics.

### Recent Conversion Module

The approved dashboard composition includes a concise conversion spotlight,
but the current GraphQL contract orders the ledger by click time rather than
conversion report time. The module therefore uses the heading **Recent
conversion** and the scope label **Latest in loaded activity**. It must not
claim to be the globally latest conversion.

Within the currently loaded click page, select the matched conversion with the
greatest `reportedAt`. Display its decision and comparison facts:

- conversion status and attribution confidence;
- merchant and product;
- order amount and commission amount with currency;
- reported time.

If multiple conversions have the same `reportedAt`, use their stable loaded
order as the tie-breaker. If the loaded page contains no matched conversion,
show a compact neutral empty state rather than an empty card.

This module belongs to the independently loaded attribution surface. Its
loading, empty, and failure feedback must occupy only its dashboard slot, while
the ledger slot presents its own corresponding feedback. Neither slot may
delay or replace the attribution-performance or revenue-outcome metrics. The
server summary and deferred ledger remain independent.

### Attribution Clicks Ledger

The closed state is an ordinary, dense table. Its columns are:

1. **Visit** — formatted click time.
2. **Customer** — email or anonymous/unidentified identity plus known-account
   state.
3. **Commerce** — merchant and product.
4. **Order** — the matched conversion's order amount and currency.
5. **Commission** — the matched conversion's commission amount and currency.
6. **State** — conversion status and attribution confidence.
7. an unlabeled action column containing the row's details control.

Each closed row uses one primary scan line. Supporting identity copy or the
merchant/product pair may share that line using subdued text or a small neutral
pill. Closed rows do not show source, link type, referrer, user agent, IP,
network, SKU, program code, conversion timestamps, or network references.
Those facts remain available in the inline detail row.

The `Details` action changes to `Close details` while expanded and includes a
directional chevron. It uses `aria-expanded` and `aria-controls`, and its
accessible name identifies the target click without exposing the internal
click ID as visible UI.

The ledger heading, one-line scope description, pagination action, and table
header share a compact section treatment. `Load more` sits at the trailing edge
of the section heading when space permits. Existing pagination loading,
failure, retry, and connection behavior remain unchanged.

### Inline Detail Row

Selecting `Details` inserts one new table row immediately after the selected
summary row. The summary row itself does not become taller. The new row:

- contains one cell spanning every visible ledger column;
- pushes later records down naturally;
- does not resize unrelated closed rows;
- is visually connected to its summary row with a quiet accent edge or surface;
- contains no modal, side drawer, overlay, or viewport-level inspector.

The detail region is labeled for assistive technology and groups evidence in
four horizontal sections on wide screens:

1. **Touchpoint** — source surface, link type, and referrer.
2. **Request evidence** — user agent and IP address.
3. **Commerce** — merchant, product, affiliate network, merchant SKU, and
   affiliate program code.
4. **Conversion** — every matched conversion and all of its order amount,
   commission amount, currency, status, confidence, merchant, product,
   affiliate network, purchased time, reported time, and network reference.

Short labels and aligned value pairs replace prose and parameter dumps.
Monospaced styling is limited to identifiers and machine evidence. Missing
values retain their current explicit fallbacks.

On medium screens the four groups become a two-column detail grid. On small
screens they stack within the spanning cell. Only an expanded detail row may
grow with its evidence; the closed ledger remains compact and horizontally
scrolls inside its own container if all columns cannot fit.

Expansion state is local to each click row. Multiple rows may remain open;
opening one row does not silently discard another operator's inspection state.
Closing removes only that row's detail region.

### Conversion Cardinality

The closed-row outcome must never imply that several conversions are one
conversion:

- With no matched conversions, Order and Commission show em dashes, State
  shows `No conversion`, and the detail region still exposes click evidence.
- With one matched conversion, the row shows that conversion's amounts, status,
  and confidence.
- With more than one matched conversion, Order and Commission show `Multiple`,
  State shows an exact conversion-count badge, and the detail region lists each
  conversion separately in server-provided order. The client does not invent a
  cross-currency or precision-losing aggregate.

## CJ Programs

### Page Composition

The CJ page uses the same application shell and visual language, with less
unused vertical space than the approved exploration. It is composed as:

1. a compact title and inline program-control band;
2. a shallow aggregate lifecycle strip;
3. a single operational status band;
4. the dense programs work ledger;
5. the dense unmatched-feeds ledger.

The persistent context rail is removed from this route. Stage and sort controls
move into the main content command band. Only the existing stage and sort
choices are shown; the UI does not invent a separate order control that the
current contract does not support.

### Aggregate Lifecycle Strip

The stage counts are aggregate counts, not a progression. They appear as one
shallow segmented strip with `All programs` followed by New, Considering,
Selected, Applied, Accepted, Not pursuing, and Declined.

`All programs` is derived by summing the seven server-provided global stage
counts. No line, arrow, completion percentage, or funnel treatment connects
the values. The active stage filter may receive restrained emphasis, but the
other counts remain visible because they provide global context.

### Operational Status Band

Program attention and feed health share one compact, two-part status band
instead of two large cards.

The program half summarizes actionable rows in the currently loaded program
page, using truthful copy such as `Needs attention on this page`. It identifies
one visible program and its required action without duplicating a full ledger
row. A row is actionable when its derived required action is not `No action
required`. Warning-bearing rows take priority; otherwise use the first
actionable row in the current server-provided sort order. If more than one
visible program needs attention, show the exact loaded-page count and link into
the program ledger; do not create one card per program.

The feed half reports whether loaded unmatched feeds need review. Because the
existing connection does not expose a global total, any number is labeled as a
loaded-page count. When one loaded feed is present, the band may identify it
and its affected product count. It must not describe that number as the total
unmatched-feed count.

The unmatched-feed query remains independently deferred. Its loading or error
state renders scoped feedback in the feed-health half and the unmatched-feeds
ledger slot; the program counts, controls, attention status, and program ledger
remain usable.

### Programs Work Ledger

The programs ledger retains the existing Merchant, Lifecycle, Last change, and
Action columns in a denser section:

- Merchant leads with advertiser name; provider, advertiser ID, and feed count
  form one quiet metadata line.
- Lifecycle uses one stage badge. Warnings remain visible because they change
  the required action, but use concise inline treatment before wrapping into a
  list.
- Last change displays the exact formatted time without a heading or card.
- Action leads with the required action and a compact `Edit program` control.

The current below-row program editor remains the interaction model. It spans
all columns and preserves stage selection, note editing, save feedback,
conflict recovery, and feed inspection. Its form lays out horizontally where
space allows and stacks responsively. No information or mutation behavior is
removed.

### Unmatched Feeds Ledger

Unmatched feeds become a native compact table rather than a heading plus a
wrapped parameter paragraph for every feed. Its columns are:

- Provider feed — feed name as the primary value and provider feed ID as quiet
  identifier metadata;
- Last seen;
- Products;
- Advertiser;
- Feed type;
- Country;
- Currency;
- Language.

The table preserves every current feed fact and the existing pagination
behavior. Missing values use concise explicit fallbacks. It shares the same
containment rules as the program and revenue ledgers.

## Data Ownership and Failure Isolation

This redesign does not change GraphQL contracts, route authorization,
pagination inputs, filter URL behavior, mutation payloads, or server ordering.

- Revenue summary metrics remain owned by `revenueSummary`.
- Recent conversion and attribution rows remain owned by the deferred
  `commerceAttributionClicks` connection.
- CJ aggregate counts and program rows remain owned by the CJ programs query.
- Feed health and unmatched-feed rows remain owned by the independently
  deferred unmatched-feed query.

The visual composition may place data beside each other, but must not merge
their Suspense or error boundaries in a way that lets one failed surface blank
another.

## Table Containment and Responsive Behavior

Every ordinary operator ledger must fit the main content area without being
covered or clipped by a sidebar. The CJ route no longer has a persistent
sidebar; other table consumers still receive containment protection.

Shared grid and flex parents, table wrappers, and workspace content use a zero
minimum inline size where needed. Ordinary ledgers use intentional column
allocation and contained horizontal scrolling at narrow widths rather than
large fixed minimum widths. Horizontal overflow belongs to the table wrapper,
never the document.

Desktop favors one-line summary rows and horizontal evidence groups. Tablet
may reduce low-priority column width and use a two-column detail grid. Mobile
keeps table semantics and contained horizontal scrolling instead of converting
every record into a tall card.

## Accessibility

- Preserve native table, row-header, and column-header relationships.
- Associate each revenue details control with its spanning detail region using
  `aria-expanded` and `aria-controls`.
- Give the revenue detail region a target-specific accessible name.
- Keep the program editor's existing target-specific labels and full-width
  table relationship.
- Use status color only as reinforcement; all states retain visible text.
- Preserve keyboard operation, focus visibility, sufficient target size,
  reduced-motion behavior, and meaningful loading/error announcements.
- Do not place heading elements inside ordinary closed data cells.

## Verification

Focused tests verify behavior and information preservation rather than brittle
pixel dimensions:

- revenue metrics, conversion-rate derivation, zero/unavailable semantics, and
  recent-loaded-conversion selection;
- closed revenue rows show only decision and comparison facts;
- `Details` inserts a correctly spanned row immediately after its summary row,
  exposes every investigation fact and every conversion, updates accessible
  state, and removes only that region when closed;
- zero, one, and multiple conversion states remain truthful;
- CJ totals are global, attention/feed counts are correctly page-scoped, and
  the two deferred surfaces keep independent fallbacks;
- CJ program editing and unmatched-feed pagination preserve their current
  behavior and data;
- no closed data cell introduces a heading element.

Browser acceptance covers revenue, CJ programs, and representative other
table routes at desktop, tablet, and mobile widths. It checks document-level
overflow, table-wrapper containment, keyboard interaction, accessibility, and
screenshots for hierarchy, wrapping, density, and clipped right edges. It does
not add row-height caps or pixel-height assertions.

The complete frontend type, Relay, test, build, accessibility, and relevant
repository validation gates run before implementation closeout.

## Non-Goals

This work does not add live conversion-provider ingestion, change the revenue
preview claim, introduce new backend totals or sort modes, aggregate money in
the browser, remove diagnostic information, turn every row into a card, add a
global details drawer, or solve density by shrinking text below the existing
application's readable type scale.

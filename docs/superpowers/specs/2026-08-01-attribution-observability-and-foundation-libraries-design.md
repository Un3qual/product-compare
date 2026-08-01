# Attribution Observability And Foundation Libraries Design

## Summary

ProductCompare already persists one commerce click session per outbound click,
associates GraphQL-tracked clicks with the signed-in user, and can resolve a
conversion back to a click through the public click UUID. The development
operator surface currently hides low-volume revenue metrics and exposes only an
aggregate summary, however, so a developer cannot inspect the individual click
and conversion records that produced those totals. CJ affiliate redirects also
do not put the public click UUID in CJ's `sid` parameter.

This change keeps the aggregate revenue overview but removes low-volume
suppression, adds an operator-only individual attribution ledger, and completes
CJ click-ID propagation. In parallel, it replaces narrowly reimplemented
infrastructure with maintained libraries where the library owns a real
standards or transport responsibility.

## Goals

- Always return the actual revenue summary metrics, including zero- and
  one-conversion results.
- Let an operator trace a persisted click to its signed-in account, affiliate
  network and destination dimensions, and any matched conversions.
- Put every CJ affiliate click's public click UUID in the outbound `sid`
  parameter and normalize a returned CJ SID into the existing conversion
  attribution boundary.
- Preserve signed-in attribution for the direct-navigation redirect fallback,
  not only the primary GraphQL mutation path.
- Replace the hand-written CJ `:httpc` transport with Req.
- Replace the local punycode implementation with the `idna` package while
  preserving ProductCompare's public-address and browser-URL policy.
- Use CLDR packages as the standards-data authority for currency, territory,
  and language codes and metadata while retaining ProductCompare's supported
  set and relational database IDs.

## Non-Goals

- Do not expose attribution reads to ordinary users or anonymous clients.
- Do not change public community identity presentation such as
  `Community Member`.
- Do not weaken log, secret, provider-payload, authentication, authorization,
  same-origin, redirect, or SSRF protections.
- Do not store raw IP addresses, raw user-agent strings, or new browser
  fingerprints. Anonymous clicks remain individually identifiable by their
  existing unique click UUID; this change does not add a persistent anonymous
  tracking cookie.
- Do not add provider polling or scheduling for CJ transactions. A CJ
  conversion adapter normalizes already-fetched payloads into the existing
  conversion boundary.
- Do not add `ex_money` or `ex_cldr_units`. Current money persistence and unit
  conversion are small, domain-specific contracts that do not yet justify
  those abstractions.
- Do not expand the database's supported currencies, countries, or languages
  merely because CLDR knows about them.

## Approved Product Shape

The aggregate revenue summary remains as a useful overview. It no longer has a
minimum-conversion threshold, suppression branch, or suppression metadata. A
separate cursor-paginated operator ledger exposes individual clicks and their
matched conversions. This is the approved middle option between changing only
the threshold and deleting the summary entirely.

## Attribution Read Model

### Unsuppressed revenue summary

`revenueSummary` keeps its existing operator authorization and filters. The
domain projection always returns its calculated metrics. The following code and
contract elements are removed:

- the `min_conversions` filter;
- the hard-coded GraphQL threshold;
- the metric-nulling projection branch;
- the GraphQL `RevenueSummarySuppression` type and `suppression` field;
- frontend suppression messaging and tests.

Zero totals continue to use the existing explicit zero representation and an
undefined average remains nullable. Mixed-currency requests continue to require
an explicit currency filter rather than adding incompatible monetary values.

### Individual click ledger

Add an operator-only forward cursor connection rooted in commerce click
sessions. Rows are ordered newest-first by `inserted_at` with the database ID as
a deterministic tie-breaker. The read accepts the existing merchant, product,
network, currency, and date filters where they apply. It does not use a
k-anonymity threshold or discard unmatched clicks.

Each click node exposes enough information to trace the lifecycle without
exposing raw provider evidence or secrets:

- public click UUID and creation time;
- source surface;
- signed-in user global ID and email when a user was associated;
- existing anonymous ID when one was supplied by an authorized producer;
- merchant, product, merchant-product, affiliate program, and network
  identifiers and display labels when present;
- whether the link is affiliate or non-affiliate;
- matched conversions with provider conversion reference, status, attribution
  confidence, currency, order amount, commission amount, purchase time, and
  report time.

The ledger does not expose `raw_payload`, credentials, destination query
secrets, IP hashes, or user-agent hashes. Account email is available only on the
operator-authorized ledger; public community and account surfaces retain their
existing presentation rules.

The operator revenue route keeps the summary at the top and adds the paginated
ledger below it. Summary and ledger filters share one route-level filter model
so the overview and individual evidence describe the same slice. Relay owns
pagination state and generated artifacts.

### Click identity consistency

The primary GraphQL click mutation already associates a click with the current
signed-in user. The direct `/r/merchant-product` fallback will run through the
existing session/current-user plugs and pass that user ID into the same domain
operation. This preserves attribution for modified clicks, copied links, and
JavaScript fallback navigation without creating a second tracking path.

Anonymous clicks remain distinct through the generated public click UUID. No
new cross-click anonymous identity mechanism is introduced.

## CJ SID Lifecycle

Outbound affiliate click decoration becomes network-specific:

- Impact continues to use `ClickId`.
- CJ uses lowercase `sid`.
- Non-affiliate and unsupported-network URLs remain unchanged.

The parameter value is the existing public click UUID. The URL helper owns a
single operation that puts the network's reserved attribution parameter while
preserving unrelated query parameters and the fragment. If the reserved
parameter is already present, its value is replaced so a configured static SID
cannot defeat per-click attribution; duplicate attribution parameters are not
emitted. Tests cover empty and populated queries, fragments, reserved-parameter
replacement, and non-target networks.

A focused CJ conversion adapter maps a valid returned `sid` to
`public_click_id`, letting the existing attribution resolver hydrate the click
session and commerce dimensions. A nonempty invalid SID remains available as a
network click reference and produces an unmatched conversion instead of being
silently discarded. The adapter follows the existing conversion upsert,
freshness, conflict, raw-evidence persistence, and secret-safe logging
contracts. It does not fetch transactions itself.

## Dependency Boundaries

### Req

Add Req and replace the CJ client's direct `:inets`, `:ssl`, charlist, and
`:httpc` request assembly with `Req.post/2`. Preserve the current client-facing
success/error contract, explicit timeouts, status handling, JSON decoding,
authorization header behavior, and injectable transport seam used by focused
tests. Logs and errors must not include the personal access token or raw request
headers.

Req owns HTTP transport behavior. ProductCompare continues to own CJ GraphQL
queries, response validation, pagination, and domain normalization.

### idna

Add `idna` and delete the local punycode encoder. The destination parser uses
the library for Unicode hostname-to-ASCII normalization. ProductCompare keeps
ownership of accepted schemes, browser-compatible URL cleanup, hostname shape,
private/reserved address denial, IP literal handling, and redirect validation.

Existing URL-policy tests become characterization coverage around the library
boundary. Additional cases cover Unicode labels, already-punycoded labels,
invalid IDNA input, label/domain limits, and unchanged public-address denial.

### CLDR reference data

Add `ex_cldr`, `ex_cldr_currencies`, `ex_cldr_territories`, and
`ex_cldr_languages`, with one application CLDR backend. A focused reference-data
module owns code normalization and standards metadata lookup. Currency,
territory, and language inputs are checked against CLDR before they reach the
application's supported-code codecs.

The database remains the authority for which codes ProductCompare supports and
for the integer IDs stored by foreign keys. The small supported-code-to-ID maps
remain deterministic because some IDs are application-specific and Ecto types
cannot depend on runtime repository queries. Database-parity tests continue to
guard those maps, while CLDR-parity tests prove that each configured public code
is a recognized standard code and provide canonical names/metadata without new
hard-coded lookup tables.

CLDR data is not read from old migrations and does not silently expand seeded
reference tables during a dependency upgrade. Adding a supported market remains
an explicit migration plus codec change.

## Authorization, Privacy, And Error Handling

Both attribution queries require the existing operator role. Authorization is
checked before filters or records are returned. Invalid global IDs, dates,
currencies, or cursors produce the repository's existing GraphQL error shapes.
An empty ledger returns an empty connection rather than an authorization-like
error.

Removing suppression changes only operator visibility into already-persisted
records. It does not alter public responses or logging. Provider raw payloads
remain stored and redacted according to their existing evidence policy but are
not projected into the ledger.

CJ and Impact redirects fail closed when their final decorated URL violates the
existing destination policy. Req transport errors are normalized at the CJ
client boundary. IDNA failures make a destination invalid rather than raising
through a request.

## Implementation Batches

This program is split into three reviewable batches:

1. **Attribution observability and CJ SID**: remove suppression, add the ledger
   and route UI, make fallback tracking session-aware, decorate CJ redirects,
   and normalize returned SIDs.
2. **Transport and hostname library adoption**: replace `:httpc` with Req and
   local punycode with `idna`, deleting superseded code and retaining boundary
   tests.
3. **CLDR reference-data boundary**: configure the CLDR backend, centralize
   standards validation/metadata, and prove database/supported-code parity.

The batches may use milestone commits on one branch. Each follows a strict
red-green-refactor cycle, and each commit includes its code, tests, and affected
documentation.

## Verification

Focused verification includes:

- revenue projection and GraphQL summary tests for zero and one conversions;
- operator authorization, filter, pagination, user identity, unmatched click,
  and click-to-conversion ledger tests;
- controller and GraphQL click tests for signed-in and anonymous navigation;
- CJ and Impact redirect URL cases plus CJ conversion normalization;
- CJ client transport/status/timeout/secret-redaction tests using Req;
- destination parser and address-policy tests around the `idna` boundary;
- reference-code database parity and CLDR recognition tests;
- operator revenue route, Relay pagination, TypeScript, accessibility, and
  frontend tests.

Final verification runs formatting, type checks, quality gates, the complete
backend suite, the frontend check and build gates, work-queue validation, and
`git diff --check`.

## Queue Coordination

The approved program produces three independently reviewable outcomes with
disjoint acceptance boundaries. Before implementation, the coordinator will
write their detailed plans, add validated lane evidence, and promote the useful
rows to `docs/work/index.md`. Claiming the first row must leave at least three
other complete ready rows; the repository's current unrelated rows remain
available while the successor rows are curated.

# Attribution Observability And Foundation Libraries Design

## Summary

ProductCompare already persists one commerce click session per outbound click,
associates GraphQL-tracked clicks with the signed-in user, and can resolve a
conversion back to a click through the public click UUID. The development
operator surface currently hides low-volume revenue metrics and exposes only an
aggregate summary, however, so a developer cannot inspect the individual click
and conversion records that produced those totals. CJ, Awin, and Rakuten
affiliate redirects do not put ProductCompare's public click reference in the
networks' publisher-reporting parameters, and Impact currently misuses
Impact's network-generated `ClickId` parameter for that purpose.

This change keeps the aggregate revenue overview but removes low-volume
suppression, adds an operator-only individual attribution ledger, and completes
verified publisher click-reference propagation for the supported affiliate
networks. In parallel, it replaces narrowly reimplemented
infrastructure with maintained libraries where the library owns a real
standards or transport responsibility.

## Goals

- Always return the actual revenue summary metrics, including zero- and
  one-conversion results.
- Let an operator trace a persisted click to its signed-in account, affiliate
  network and destination dimensions, and any matched conversions.
- Put every supported affiliate click's public click reference in the network's
  documented publisher-reporting parameter and normalize returned references
  into the existing conversion attribution boundary.
- Preserve signed-in attribution for the direct-navigation redirect fallback,
  not only the primary GraphQL mutation path.
- Persist the raw request referrer, user-agent value, and Phoenix-resolved
  remote IP for each browser click so development diagnostics do not depend on
  irreversible hashes or anonymized placeholders.
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
- Do not add a persistent anonymous tracking cookie or browser fingerprint.
  Anonymous clicks remain individually identifiable by their existing unique
  click UUID.
- Do not remove ingestion scope fingerprints, claim fingerprints, password
  hashes, token hashes, or other hashes whose purpose is idempotency,
  integrity, or authentication rather than attribution anonymization.
- Do not add provider polling or scheduling for affiliate transactions. Focused
  conversion adapters normalize already-fetched payloads into the existing
  conversion boundary.
- Do not dynamically modify Amazon Associates `tag` values. Amazon tracking IDs
  are pre-issued account identifiers, and Amazon's current policy forbids
  assigning sub-tags dynamically to specific end users.
- Do not decorate custom database networks without an explicit mapping backed
  by that network's current publisher documentation.
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
- raw referrer, user-agent value, and Phoenix-resolved remote IP;
- merchant, product, merchant-product, affiliate program, and network
  identifiers and display labels when present;
- whether the link is affiliate or non-affiliate;
- matched conversions with provider conversion reference, status, attribution
  confidence, currency, order amount, commission amount, purchase time, and
  report time.

The ledger does not expose `raw_payload`, credentials, or destination query
secrets. Account email and raw request diagnostics are available only on the
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

One focused request-attribution extractor supplies the same raw diagnostic
values to the GraphQL context and redirect controller. It reads the `referer`
and `user-agent` request headers and formats `conn.remote_ip`; it does not trust
forwarding headers independently of Phoenix's endpoint/proxy configuration.
The domain operation receives `referrer`, `user_agent`, and `ip_address`
directly and performs no hashing, truncation, masking, or subnet aggregation.

Anonymous clicks remain distinct through the generated public click UUID. No
new cross-click anonymous identity mechanism is introduced.

### Raw diagnostic storage

Because the application is unreleased and the existing hash columns have no
production writer, the commerce-attribution schema is simplified in place:

- `user_agent_hash` becomes `user_agent` text;
- `ip_hash` becomes `ip_address` text;
- `referrer` remains raw text;
- synthetic seeds, schemas, domain attribute lists, and tests use the raw field
  names and representative raw values.

The original development migration is updated rather than preserving obsolete
hash-named columns plus a rename migration. Existing local development and test
databases require a reset to receive the revised unreleased schema. The values
are persisted for operator diagnostics but are not added to application logs,
error payloads, or public APIs.

## Affiliate Network Click-Reference Lifecycle

Outbound affiliate click decoration is driven by a closed mapping for the
networks seeded as supported production networks:

| Network | Outbound parameter | Returned field | ProductCompare value |
| --- | --- | --- | --- |
| CJ | `sid` | SID / `sid` | canonical public click UUID |
| Impact | `subId1` | `SubId1` | canonical public click UUID |
| Awin | `clickref` | `clickRef` / `ClickRef` | canonical public click UUID |
| Rakuten Advertising | `u1` | member ID / `u1` | 32-character UUID hex without hyphens |
| Amazon Associates | none | none | no dynamic per-click decoration |

Impact's `ClickId` is generated by Impact and represents Impact's own referral
identifier. ProductCompare stops writing its UUID into `ClickId`. The existing
Impact adapter instead reads ProductCompare's UUID from `SubId1` and retains an
actual Impact `ClickId` as `network_click_ref`.

Rakuten documents `u1` as an alphanumeric member ID of at most 72 characters.
The reversible compact UUID representation meets that contract; the inbound
adapter restores the canonical UUID before attribution. CJ, Impact, and Awin
use the canonical UUID directly.

The URL helper owns a single operation that puts the network's reserved
publisher-reference parameter while preserving unrelated query parameters and
the fragment. If the reserved parameter is already present, its value is
replaced so a configured static value cannot defeat per-click attribution;
duplicate attribution parameters are not emitted. Non-affiliate, Amazon, and
unmapped custom-network URLs remain unchanged. Tests cover empty and populated
queries, fragments, reserved-parameter replacement, each mapped network, and
non-target networks.

Focused CJ, Awin, and Rakuten conversion adapters map valid returned publisher
references to `public_click_id`, letting the existing attribution resolver
hydrate the click session and commerce dimensions. The Impact adapter adopts
the corrected `SubId1` mapping. A nonempty invalid reference remains available
as a network click reference and produces an unmatched conversion instead of
being silently discarded. The adapters follow the existing conversion upsert,
freshness, conflict, raw-evidence persistence, and secret-safe logging
contracts. They normalize already-fetched payloads and do not add provider
polling.

### Network contract evidence

- [Impact tracking-link creation](https://integrations.impact.com/impact-publisher/reference/create-a-tracking-link)
  defines `subId1` as a publisher reporting value, and the
  [Impact action object](https://integrations.impact.com/impact-publisher/reference/the-action-object)
  returns it as `SubId1`.
- [Awin link generation](https://help.awin.com/apidocs/generatelink) accepts
  `clickref`, and
  [Awin transaction notifications](https://help.awin.com/developers/docs/transaction-notifications)
  return it through the `clickRef` placeholder.
- [Rakuten Signature](https://pubhelp.rakutenadvertising.com/hc/en-us/articles/4412244196877-Signature-Overview)
  defines the publisher-controlled `u1` member ID and transaction-level
  reporting.
- [CJ's SID guidance](https://junction.cj.com/article/cj-account-manager-top-notch-tactical-tips)
  identifies SID as the optional publisher internal-tracking parameter.
- [Amazon Associates policies](https://affiliate-program.amazon.com/help/operating/policies)
  require pre-issued tracking IDs and prohibit dynamically associating a
  sub-tag with a specific end user, so ProductCompare does not synthesize a
  per-click Amazon value.

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

Removing suppression and persisting raw request diagnostics change only
operator visibility into attribution records. They do not alter public
responses or logging. Provider raw payloads remain stored under their existing
evidence policy but are not projected into the ledger.
Raw IP, user-agent, and referrer values are neither anonymized before
persistence nor emitted to logs.

CJ and Impact redirects fail closed when their final decorated URL violates the
existing destination policy. Req transport errors are normalized at the CJ
client boundary. IDNA failures make a destination invalid rather than raising
through a request.

## Implementation Batches

This program is split into three reviewable batches:

1. **Attribution observability and affiliate click references**: remove
   suppression, add the ledger and route UI, replace hash-named diagnostic
   fields with captured raw request values, make fallback tracking
   session-aware, decorate verified CJ, Impact, Awin, and Rakuten redirects,
   and normalize returned publisher references.
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
  raw request diagnostics, and click-to-conversion ledger tests;
- controller and GraphQL click tests for signed-in and anonymous navigation,
  including exact referrer, user-agent, and remote-IP persistence;
- CJ, Impact, Awin, Rakuten, Amazon, and custom-network redirect URL cases plus
  publisher-reference conversion normalization;
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

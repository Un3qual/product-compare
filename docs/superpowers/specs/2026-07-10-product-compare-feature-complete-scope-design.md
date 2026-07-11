# Product Compare Feature-Complete Scope Design

## Decision

The current feature-complete milestone covers the shopper comparison experience
and a bounded, operable CJ product-data loop. It does not cover production
launch readiness, production privacy and attribution controls, live conversion
ingestion, or production email delivery.

The milestone preserves the existing V1 deferrals for OAuth, public saved-set
sharing, and user-generated discussion surfaces. It also preserves the current
product decisions that defer eBay fallback, ingestion dashboards, automated
merchant application submission, account-manager automation, credential
persistence, Tier-3 scraping, and CSV export.

## Outcomes

The milestone is complete when:

1. The root route explains the shopper journey and prioritizes product browse,
   comparison, and offer review.
2. Public navigation remains visible to every visitor while saved comparisons,
   affiliate setup, revenue preview, API tokens, and sign-out are visible only
   to authenticated viewers.
3. The compare decision summary identifies the lowest already-loaded
   same-currency price without making unsafe cross-currency or malformed-price
   claims.
4. Saved-comparison cards display ordered product names while reopening the
   exact stored slug order.
5. Revenue reporting is explicitly positioned as an authenticated preview; the
   milestone makes no claim that live Impact, CJ, or Awin conversion ingestion
   is operational.
6. Operators can distinguish a manually fresh CJ pilot from a recurring
   scheduled CJ supply. The readiness contract reports whether both bounded CJ
   schedulers are enabled and can optionally require scheduled operation in
   addition to credentials, recent successful runs, and candidate thresholds.

## Shopper Experience Design

The four existing ready implementation plans remain authoritative for home
content, viewer-aware navigation, relative loaded-price comparison, and saved
product labels. Their route data, GraphQL contracts, and backend behavior do not
change.

The root route will define reusable public and authenticated destination lists
so the navigation and home action groups cannot drift. Public destinations are
Product Compare, Browse products, Merchants, Offers, and Compare products.
Authenticated destinations are Saved comparisons, Affiliate setup, Revenue
preview, and API tokens. Guest authentication actions remain Sign in and Create
account; authenticated users receive Sign out.

The home page will separate primary shopper actions from secondary public and
account actions. The primary group links to `/products`, `/compare`, and
`/offers`. It will not expose GraphQL, Relay, auth-migration, ingestion, or
implementation-status language.

The comparison price signal will use decimal-string ordering rather than
JavaScript floating-point coercion. It will require at least two usable prices
and one shared currency across every comparable value. Mixed currencies,
missing or malformed prices, and unavailable offer contexts render `Not
comparable`; no savings amount or subtraction is introduced.

Saved-comparison route data will retain ordered `{name, slug}` product
summaries. Cards render names, while reopen URLs continue to use repeated slug
parameters in stored position order.

## Revenue Preview Positioning

The authenticated navigation label and revenue page will state that revenue is
a preview backed by recorded attribution data. The page will not imply that a
live conversion provider is connected. Existing revenue queries, filters,
suppression behavior, and authorization remain unchanged.

This is intentionally narrower than adding live Impact ingestion. No callback,
webhook, report pull, provider credentials, raw payload persistence, or new
network surface is part of this milestone.

## CJ Scheduled-Supply Readiness

The existing CJ feed-discovery and product-import schedulers remain disabled by
default and opt in through their current environment variables. The repository
will not commit credentials or force schedules on in every environment.

The existing `mix product_compare.ingestion.cj_readiness_gate` task will add a
non-secret schedule report:

- `feed_discovery_schedule_enabled`
- `product_import_schedule_enabled`
- `schedules_ready`

The task will accept `--require-scheduled`. Without that option, its current
manual-pilot readiness semantics remain backward compatible. With the option,
`ready=true` additionally requires both schedules to be enabled. As today,
`--require-ready` is the independent enforcement switch that raises when the
computed result is not ready. The task will continue to require credential
presence, fresh successful discovery and import runs, and configured candidate
thresholds. It will never print credential or account values.

The CJ operator runbook will add a scheduled-operation section that:

1. names the two existing enable flags and bounded interval/query variables;
2. requires credential preflight before activation;
3. runs the readiness gate with `--require-scheduled` after activation and
   successful bounded runs;
4. keeps manual candidate review and application submission boundaries intact;
5. explains that a failed scheduled-readiness gate is an operational signal,
   not permission to broaden provider or scraping scope.

This design improves the repository contract and verification for recurring CJ
operation. Actual environment activation and credential installation remain an
operator action outside source control.

## Error Handling And Safety

- Shopper routes keep their existing loader and GraphQL error behavior.
- Unsafe price comparisons fail closed to `Not comparable`.
- Missing saved product names or slugs are rejected by the existing route-data
  validation path rather than rendered partially.
- The CJ gate reports `ready=false` when `--require-scheduled` is requested and
  either schedule is disabled; combining it with `--require-ready` raises
  through the existing enforcement path.
- CJ readiness output remains non-secret and bounded to booleans, missing
  variable names, freshness, and counts.
- No live provider call is added to automated tests.

## Verification Strategy

Every behavior change follows red-green TDD and is committed at a milestone
boundary with its code, tests, generated Relay artifact when applicable, and
lane evidence.

Focused verification includes:

- root route guest and authenticated rendering tests;
- compare relative-price safety cases;
- saved-comparison ordered name and reopen-link cases plus Relay generation;
- revenue preview rendering tests;
- CJ readiness-gate tests for manual compatibility, one or both disabled
  schedules, both enabled schedules, and combined `--require-scheduled` plus
  `--require-ready` enforcement;
- TypeScript and Elixir type checks;
- frontend and backend full test suites after all focused batches;
- formatting and `git diff --check`.

## Explicit Non-Goals

- Production email transport.
- Live Impact, CJ, Awin, or other conversion ingestion.
- Production deployment proof, staging dry runs, TLS, reverse-proxy, or
  observability work.
- Production privacy, consent, retention, DSAR, or attribution-governance work.
- eBay fallback, ingestion dashboards, Tier-3 scraping, automated merchant
  application submission, account-manager automation, or CSV export.
- OAuth, public saved-comparison sharing, or user-generated review surfaces.

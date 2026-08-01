# Development Feature Seed Design

## Summary

ProductCompare's development seed currently creates operator accounts, a small
taxonomy and specification catalog, three monitor products, one merchant offer,
and price history. That is enough for basic catalog browsing, but it leaves most
authenticated, operator, lifecycle, and attribution features empty unless a
developer imports provider data or manually builds state through the UI.

The development seed will become a self-contained, repeatable feature dataset.
It will create several role-specific accounts and representative records for
every delivered product surface without contacting CJ, an email service, a
conversion provider, a scheduler, or any other network integration.

## Goals

- Make every delivered development UI route and its backing GraphQL workflow
  testable immediately after `mix ecto.reset` or `mix run priv/repo/seeds.exs`.
- Represent meaningful visible states, not merely one row from each table.
- Provide several documented accounts so ownership, participation, reporting,
  moderation, and operator actions can coexist.
- Reconcile seed-owned records to a deterministic baseline when seeds are run
  again while preserving unrelated local data.
- Print a concise guide containing credentials and ready-to-open deep links for
  authentication, shared comparison, account, operator, and shopper workflows.
- Keep seed-only orchestration outside the production application module tree.

## Non-Goals

- The seed will not make live CJ, Awin, email, conversion-provider, or other
  external requests.
- The seed will not start provider schedulers or background ingestion jobs.
- The seed will not claim that synthetic ingestion or attribution records prove
  production integration readiness.
- The seed will not erase unrelated local records or become a general-purpose
  database reset mechanism.
- Deferred production email delivery, privacy and attribution hardening, and
  production-readiness proof remain outside this change.

## Architecture

`priv/repo/seeds.exs` remains the only execution entry point. It validates the
environment and password policy, chooses one anchor timestamp, opens one outer
database transaction, runs seed domains in dependency order, and prints the
testing guide only after the transaction commits.

Focused modules under `priv/repo/seeds/` own the seed domains. These modules are
loaded by the entry point only while seeding and are not compiled as production
application modules. The entry point passes explicit result maps between them:

1. accounts and local authentication tokens;
2. taxonomy, products, specifications, source evidence, and corrections;
3. merchants, offers, price history, affiliate configuration, and coupons;
4. saved and shared comparisons, price alerts, and community state;
5. synthetic CJ lifecycle, import-run, and commerce-attribution state;
6. the final credentials and deep-link guide.

Each domain exposes one focused seed operation and returns the named records
required by later domains. Common reconciliation helpers are centralized only
when two or more domains need the same lookup/update behavior. The design does
not introduce a generic seed DSL, callback framework, repository abstraction,
or production-facing API.

Existing context operations are the default write boundary because they keep
domain validation and invariants active. A seed module may use an existing
schema changeset directly only when no suitable context operation exists. Raw
SQL and unchecked bulk inserts are excluded.

## Account Scenarios

The seed creates or restores these identities with one documented development
password unless a configured seed password overrides it:

- `admin@example.com`: primary operator for affiliate and CJ workflows;
- `moderator@example.com`: second operator for claim and community moderation;
- `shopper@example.com`: regular user who owns comparisons, alerts, reviews,
  questions, corrections, and tracked shopping activity;
- `participant@example.com`: regular user who answers questions, writes a
  second review, and reports content;
- `unverified@example.com`: regular user with a locally generated confirmation
  token and printed verification link;
- `reset@example.com`: regular user with a locally generated reset token and
  printed password-reset link.

The shopper owns one usable API token whose plain value is printed for local
testing and one revoked token that exercises historical token presentation.
Both seed-owned token rows use reserved immutable entropy IDs so labels remain
purely presentational and user-created tokens with the same labels are preserved.
Generated confirmation, reset, and API-token secrets may change between seed
runs. Their semantic states and printed routes remain deterministic.

Operator bootstrap keeps the existing fail-closed behavior: a non-operator who
already owns a configured operator email is never promoted or overwritten.

## Catalog And Specification Scenarios

The existing type and use-case trees remain, but the catalog grows to include
several products across monitor, TV, and projector categories. Products vary
across numeric, boolean, and enum attributes so catalog facets, category pages,
product detail, comparison differences, and compare metadata are all visible.

Seeded products include stable brands, slugs, model numbers, identifiers,
descriptions, accepted current claims, and source-backed evidence. The dataset
includes both editorial and synthetic-import provenance. It also includes a
shopper-owned pending specification correction and completed moderation states
needed to inspect correction ownership and operator queues through GraphQL.

## Merchant, Offer, Affiliate, And Coupon Scenarios

Multiple merchants and merchant products use stable domains and external SKUs.
Their observations are derived from the shared anchor timestamp and cover:

- fresh, aging, stale, and never-observed offers;
- in-stock, out-of-stock, and unavailable offers;
- multiple price histories suitable for charts and relative-price comparison;
- products available from one merchant and from multiple merchants.

Synthetic affiliate networks, programs, and links cover configured and inactive
program states. Coupons include active, future, and expired examples so shopper
offer presentation and operator setup reads have meaningful data. All outbound
URLs use reserved local or example domains.

## Comparison, Alert, And Community Scenarios

The shopper owns multiple saved comparison sets, including a primary reopenable
selection. Seed-owned saved sets and the public comparison snapshot use reserved
immutable entropy IDs so visible names and titles may be reused by unrelated
local records. The snapshot contains products, attributes, offer evidence,
ranking, and recommendation data. Its public token is preserved across reruns
and the corresponding `/compare/shared/:token` link is printed.

Alert state includes enabled and disabled watches, price and availability
conditions, and both read and unread alert events. Events are created as durable
local records from seeded price observations; the seed does not enqueue or run
background delivery.

Community state spans two regular users and includes:

- visible reviews with differing ratings;
- an owner-editable question;
- multiple answers and one accepted answer;
- participant-owned content that exercises independent edit/remove policy;
- reported content;
- pending, visible, and hidden moderation states.

The scenarios preserve valid ownership and moderation transitions rather than
forcing conflicting states onto one account or record.

## Synthetic Provider And Revenue Scenarios

The operator workspace receives synthetic CJ source and advertiser data with
programs across supported lifecycle stages. Observed feeds include program-
matched and unmatched examples. Import history includes completed successes and
failures with redacted, non-secret summaries. Seed execution calls neither the
CJ client nor the feed/product schedulers.

Recorded commerce data includes links, click sessions, conversions, commission
amounts, and purchase-price facts across representative merchants and dates.
This makes the existing revenue preview useful while retaining its documented
meaning: the data demonstrates recorded attribution behavior, not a live
conversion-provider connection.

## Reconciliation And Failure Handling

Seed-owned records use stable natural identifiers wherever the domain provides
them: email, product slug, merchant domain, external SKU, source identity,
provider advertiser/feed ID, network name, coupon code, saved-set name, and
seed labels. Rerunning the seed restores fields and lifecycle states associated
with those identifiers.

For owned records without a safe unique key, reconciliation starts from a
seed-owned parent and a reserved label or token. It updates an existing record
or removes and recreates only that precisely identified seed record. It never
deletes all records belonging to a user, merchant, product, or provider.

Every seed stage returns its result or raises an error naming the stage and
underlying validation failure. The outer transaction rolls back the complete
seed attempt on error, and the guide is not printed for a rolled-back run.

## Testing Guide Output

Successful seed output is concise and grouped by workflow. It contains:

- each demo email, password source, and role;
- login and account-management routes;
- the current plain API token;
- ready-to-open verification and password-reset links;
- primary catalog, product, category, offer, merchant, comparison, saved-set,
  alert, affiliate, CJ-program, and revenue routes;
- the public shared-comparison link;
- a reminder that all provider and attribution examples are synthetic.

The output avoids database primary keys, hashed tokens, raw provider payloads,
or secret-looking placeholder credentials other than the explicitly usable
development password and API token.

## Verification Strategy

The seed integration test remains asynchronous-disabled and evaluates the real
entry point. It will verify:

- a fresh test database receives all representative scenarios;
- running the seed twice does not duplicate seed-owned records;
- editing a seed-owned record and rerunning restores its baseline;
- unrelated user-created records survive a rerun unchanged;
- demo credentials authenticate and operator roles remain correct;
- generated confirmation, reset, API-token, and shared-comparison links resolve
  through their existing domain boundaries;
- the printed guide contains the documented accounts and route families;
- representative context and GraphQL reads expose the data consumed by every
  delivered development route;
- provider fetchers, mail delivery hooks, and scheduler runners are not called;
- preclaimed operator emails continue to fail closed without promotion.

Implementation follows red-green-refactor cycles. Focused seed tests run first,
followed by the affected account, catalog, pricing, alert, discussion,
affiliate, ingestion, attribution, and GraphQL suites. Completion requires the
repository's full backend tests, type checks, formatting and quality gates,
`mix work_queue.validate`, and `git diff --check`.

## Queue Coordination

This request is one independently shippable development-experience outcome.
Before implementation is claimed, its execution plan and lane work document
will be added to the live dispatch index as one coherent row. The existing
three unrelated ready rows remain available, satisfying the repository's
ready-work floor after this row becomes active.

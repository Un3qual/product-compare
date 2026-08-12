# Pre-release schema and comparison-continuity cleanup

## Goal

Remove compatibility machinery that only serves an already-released database,
close the reviewed homepage query and URL-state gaps, and leave the branch with
one final-schema implementation for anonymous visitors.

The application is unreleased. Existing development databases may be reset;
the implementation does not preserve obsolete `anonymous_id` data or support
old and new application writers concurrently.

## Final database schema

The original commerce-attribution migration creates `anonymous_visitors`
before `commerce_click_sessions`. Anonymous visitors contain the public cookie
entropy UUID and timestamps. Click sessions reference one anonymous visitor by
foreign key and do not contain a legacy anonymous string.

The original migration also owns:

- the unique visitor entropy index;
- the click-session anonymous-visitor lookup index;
- the foreign key from click sessions to anonymous visitors; and
- the same-row constraint prohibiting simultaneous `user_id` and
  `anonymous_visitor_id` values.

The later anonymous-visitor expansion migration is deleted. Its transition
function, trigger, legacy identifier column, backfill, reentrant rollout code,
rollback reconstruction, and rollout-specific tests are deleted with it.
Fresh-schema migration and changeset/database tests prove the final contract.

## Homepage New-deal access path

The original pricing migration adds the index required by the public New-deals
candidate query. The physical key is `(currency_id, inserted_at, id)` and the
index is partial to active merchant products. Keeping currency in the key makes
the index usable with Ecto's parameterized currency predicate, including after
PostgreSQL selects a generic prepared plan; hard-coding USD in the predicate
would not provide that guarantee.

The migration test inspects the real PostgreSQL index definition. Query
behavior tests continue to prove the exact 72-hour semantics and ranking.

## Offers comparison continuity

Normalized repeated `slug` parameters are route state, not GraphQL input.
Offers parsing retains at most the canonical comparison limit. Every Offers
URL builder appends those slugs while replacing only the owned filter or cursor
parameters.

The following paths preserve the selection:

- the Offers GET filter form;
- reset, clear-merchant, first-page, and next-page links;
- Browse and product-detail links into Offers;
- comparison-result links into Offers;
- Offers links back to product details or Browse; and
- missing/error recovery links.

Behavior tests exercise normalization and full interaction round trips rather
than checking source strings.

## API cleanup

Delete `Pricing.home_offer_price_signals/2` and
`Pricing.HomeOffers.price_signals/2`. They have no production or test consumer;
the resolver-owned path is `home_offer_page_facts/3`, which remains the only
page-scoped fact hydration API.

## Additional compatibility audit

Review every branch-added migration and executable module relative to
`origin/main` for legacy columns, migration backfills, transitional triggers,
dual-write paths, compatibility aliases, and unused public delegations.
Remove only code whose purpose is compatibility with a schema or API that has
never shipped. Keep ordinary data seeding, exact current-state derivation, and
migrations that create genuinely new final-state indexes.

## Verification

Verification includes focused migration, Pricing, resolver, Offers, Browse,
product-detail, and Compare tests; fresh migrations from an empty database;
frontend Relay/type/lint/format checks; the complete backend suite; repository
quality gates; diff checks; and a final anti-slop audit. The user-owned
`config/dev.exs` change remains untouched and unstaged.

# Scalable Realistic Development Data Design

## Status

Approved in conversation on 2026-08-14.

This focused design supersedes the scale and generation details in the
`Realistic Offline Development Data` section of
`docs/superpowers/specs/2026-08-12-product-experience-and-code-simplification-design.md`
and its existing implementation plan. The earlier design's product scenarios,
ownership rules, offline boundary, and production-contract constraints remain
in force.

## Problem

The current development seed contains five products, two merchants, and a small
set of offers and lifecycle examples. That is enough to prove individual
contracts, but it does not exercise realistic catalog navigation, merchant
competition, connection pagination, price-history volume, community activity,
or operator ledgers.

One fixed high-volume dataset would make ordinary development resets needlessly
slow. One permanently small dataset would continue to hide scale-dependent
product behavior. Developers need the same stable catalog and merchant universe
with a runtime choice between practical and data-heavy related-record density.

## Goals

- Seed exactly 300 products and 70 merchants in both density profiles.
- Preserve the existing hand-authored products, merchants, and named lifecycle
  scenarios as stable behavioral anchors.
- Generate the remaining names and facts deterministically from small checked-in
  dictionaries rather than maintaining hundreds of bespoke fixture literals.
- Give the bounded profile realistic marketplace breadth while keeping routine
  local resets practical.
- Give the full profile deeper price history and substantially more lifecycle,
  community, attribution, and operator data without increasing product count.
- Reconcile profile changes in either direction without adopting, changing, or
  deleting unrelated local rows.
- Keep all seed execution offline and limited to development and test.

## Non-Goals

- This is not a benchmark harness or a production-scale load generator.
- It does not add product types, taxonomy, attributes, currencies, or production
  APIs solely to make the fixtures more varied.
- It does not require every generated product or merchant to have a handcrafted
  marketing name or description.
- It does not create a second seed framework, a production-callable bypass, or
  a generic fixture DSL.
- It does not make random data, remote images, provider calls, jobs, mail, or
  scheduler execution part of seeding.

## Command Contract

The existing `priv/repo/seeds.exs` file remains the sole orchestrator. It accepts
one strict option after Mix's argument separator:

```bash
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density bounded
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density full
```

Omitting `--density` selects `bounded`. The only accepted values are `bounded`
and `full`. Unknown options, duplicate density options, positional arguments,
and unsupported values fail before the seed transaction begins. The selected
profile is printed in the local guide output.

The parser produces one small configuration map that is passed explicitly from
the orchestrator to the catalog, marketplace, engagement, and operations seed
modules. Seed modules do not read process-global arguments independently.

## Shared Inventory

Both profiles produce the same stable inventory:

- exactly 300 seed-owned products across the existing monitor, television, and
  projector types;
- exactly 70 seed-owned merchants using safe `.test` domains;
- the five existing hand-authored products and two existing merchants with their
  current slugs, domains, keys, and behavioral roles; and
- enough specification contrast to cover exact, minimum, maximum, shared,
  differing, missing, and unsupported display states.

A checked-in seed dictionary holds short brand, series, merchant-prefix,
merchant-suffix, and description fragments. Stable indexes combine those words
with type-appropriate model numbers. Generation must be ordered and based only
on checked-in values and the profile configuration; it must not use randomness,
hash-map iteration order, or wall-clock values for identity.

Generated products use readable names and descriptions, but uniqueness and
stability matter more than individually clever copy. Stable slugs, merchant
domains, external SKUs, evidence hashes, and entropy identifiers make the same
logical row addressable on every run.

## Bounded Profile

The bounded profile targets 1,700 to 1,900 seed-owned offers across the 300
products:

- ordinary products generally have four to eight offers;
- representative products have twelve to twenty-five offers so product-offer
  pagination and merchant comparison remain demonstrable; and
- deterministic merchant rotation gives all 70 merchants meaningful catalog
  coverage and creates deliberate crossover between products.

Every offer has a current observation. Named scenario offers additionally cover
fresh, aging, stale, unavailable, unobserved, inactive, stock-transition,
merchant-crossover, separate-currency, and coupon-lifecycle behavior. A selected
cohort receives six to twelve months of weekly or daily price history; ordinary
secondary offers keep only the observations needed for current marketplace
truth and representative sorting.

Community, comparison, alert, correction, attribution, CJ, import, and revenue
rows exceed the relevant production connection page sizes and include all
existing named lifecycle states. They remain intentionally bounded rather than
scaling with every product-offer pair.

## Full Profile

The full profile keeps the same 300 products and 70 merchants and targets 2,900
to 3,100 seed-owned offers, averaging about ten offers per product.
Representative products exceed that average to guarantee multi-page offer
views; lower-coverage products keep the total within the profile range.

Its additional density comes primarily from related facts:

- primary offers receive six to twelve months of weekly history;
- secondary offers receive deterministic monthly history;
- named scenario offers retain denser stock and price transitions;
- comparison, watch, alert, review, question, answer, correction, click,
  conversion, CJ, import, and revenue datasets are materially deeper than the
  bounded profile; and
- each relevant shopper and operator connection has several pages of stable
  results across multiple filter and status combinations.

The full profile is allowed to take materially longer than bounded seeding. It
must still use existing domain write contracts and must not bypass validation or
referential integrity merely to reduce runtime.

## Deterministic Time And Scenario Data

The execution anchor is the start of the current UTC hour. It remains current
enough for freshness-sensitive product behavior while giving repeated local runs
a stable timestamp boundary. Seed identities and the expected observation set
are derived from that anchor and named offsets. Repeating a profile within the
hour yields the same logical rows. A later run reconciles obsolete seed-owned
observations rather than accumulating unbounded history.

Prices use authored Decimal bases plus deterministic merchant, product, and
scenario adjustments. Currencies, stock states, coupon windows, community
timestamps, lifecycle stages, and revenue dates come from named scenario rules,
not random generation.

## Ownership And Profile Reconciliation

The generator computes the complete expected ownership set before applying
writes. Generated records use stable seed-only keys or entropy identifiers that
cannot collide with ordinary local data.

Each run performs scoped reconciliation:

1. upsert the expected seed-owned rows through existing domain contracts;
2. verify that any existing matching identity still belongs to the expected
   seed owner and fail closed on conflicts;
3. remove obsolete rows only when their immutable identity proves seed
   ownership and dependent seed-owned rows can be removed safely; and
4. leave all rows outside the expected ownership namespace byte-for-byte
   unchanged.

This applies when rerunning one profile and when switching `bounded → full` or
`full → bounded`. The latter must remove full-only offers, observations, and
related lifecycle rows instead of leaving a union of both profiles.

The pending-correction empty-current baseline remains mandatory. Reconciliation
must preserve row-lock and transaction requirements already enforced by the
production write paths.

## Data Flow And Components

The existing transaction and domain-oriented modules remain the architecture:

1. the orchestrator parses the profile and establishes the seed anchor;
2. accounts preserve the stable role identities;
3. catalog loads the checked-in dictionary, validates generated uniqueness, and
   reconciles products, specifications, evidence, identifiers, and media;
4. marketplace distributes merchants and offers, then reconciles observations,
   coupons, and affiliate facts according to the selected density;
5. engagement builds comparisons, watches, alerts, community content, and
   corrections from stable catalog and marketplace keys;
6. operations builds attribution, conversion, CJ, import, and revenue scenarios;
   and
7. the guide prints the selected density, stable credentials, counts, and
   representative local URLs.

`priv/repo/seeds/profile.exs` owns strict CLI parsing and the two configuration
maps. `priv/repo/seeds/dictionary.exs` owns the checked-in word lists and ordered
fixture generation. Existing domain seed modules own reconciliation and may use
small domain-neutral helpers from `priv/repo/seeds/support.exs`. Production
contexts remain the write authority; there is no new generic repository, seed
behavior, or callback layer.

## Error Handling

- CLI and dictionary validation fail before database mutation.
- Duplicate generated slugs, domains, SKUs, evidence keys, or entropy IDs are
  fatal and identify the conflicting values.
- Existing rows with a seed identity but conflicting ownership fail closed.
- Domain changeset, constraint, authorization, or transaction errors retain
  their current explicit seed context.
- Any provider, network, scheduler, job, mailer, or conversion-service call is a
  seed failure.
- The entire dataset remains inside the existing serializable transaction so a
  failed run does not leave a partially switched profile.

## Verification

Focused tests must prove:

- omitted, bounded, full, duplicate, invalid, positional, and unknown CLI
  argument behavior;
- exact shared inventory counts and the bounded/full offer ranges;
- stable representative specifications, offer states, currencies, coupons,
  histories, and lifecycle scenarios;
- enough data for shopper, account, community, attribution, CJ, and revenue
  connection pagination;
- two consecutive bounded runs and two consecutive full runs preserve logical
  identities and owned counts;
- `bounded → full → bounded` leaves the exact bounded ownership set;
- unrelated lookalike products, merchants, offers, observations, accounts, and
  lifecycle rows remain byte-for-byte unchanged;
- pending-correction baselines survive every rerun and profile switch;
- external clients, network adapters, Oban, schedulers, and mail delivery are
  never invoked; and
- representative local catalog, product, comparison, account, community, CJ,
  and revenue pages render from only the seeded data.

Complete backend and frontend gates, work-queue validation, formatting, and diff
checks remain required before closeout.

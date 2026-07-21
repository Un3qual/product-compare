# Final Product-Offer Closeout Evidence Fix

## Changes

- Corrected `docs/plans/INDEX.md` so the bounded product-offer/coupon/history
  connection outcome is recorded as complete, alongside the other completed
  backend read-budget outcomes.
- Corrected `docs/work/bounded-product-offer-graphql-connections.md` so the
  compare-shaped GraphQL regression is credited only with the behavior it
  queries and asserts: product and active-only offer ordering, coupon validity,
  bounded descending price history, Relay pagination values, latest-price
  values, and fixed nested SELECT budgets as product parents grow.
- Recorded merchant-filter parity under the separate Pricing context tests,
  which exercise product, merchant, and active-only offer filtering.
- Made no production, schema, or test behavior changes.

## Verification

- `mix work_queue.validate` — passed: `work queue valid: 3 ready rows`.
- `mix format --check-formatted` — passed.
- `git diff --check` — passed.

## Deferred Future Hardening

The query-budget classifier currently recognizes exact `FROM "table"` text.
Future JOIN or CTE SQL shapes could evade that classifier. This is triaged as
future hardening and was intentionally not changed in this documentation-truth
fix.

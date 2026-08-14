# Realistic Development Data

## Snapshot

- Status: completed
- Priority: P1
- Plan: `docs/superpowers/plans/2026-08-14-scalable-realistic-development-data-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-14-scalable-realistic-development-data-design.md`
- Last verified: 2026-08-14 against both live development profiles, the complete
  backend and frontend suites, focused seed/GraphQL coverage, static analysis,
  work-queue validation, and the final bounded inventory.

## Batch Outcome

The offline deterministic seed system now accepts
`--density bounded|full`, defaults to bounded, and produces exactly 300 products
and 70 merchants in either profile. Bounded finishes at 1,845 offers; full
finishes at 3,065 offers, or about ten offers per product. Both profiles include
realistic catalog, price-history, comparison, alert, community, correction,
attribution, conversion, CJ, and import lifecycles while preserving unrelated
local rows and prohibiting external effects.

Bounded inventory:

- 17,500 price observations;
- 24 saved comparisons, 48 watches, 64 alerts, 120 reviews, 80 questions, and
  24 corrections;
- 70 CJ feeds, 40 import runs, 120 clicks, 80 conversions, and 45 purchase-price
  facts.

Full inventory:

- 75,796 price observations;
- 60 saved comparisons, 160 watches, 240 alerts, 300 reviews, 180 questions,
  and 90 corrections;
- 210 CJ feeds, 120 import runs, 600 clicks, 400 conversions, and 215
  purchase-price facts.

## Owned Paths

- `priv/repo/seeds/**`, seed orchestration only when required, focused seed and
  development-GraphQL tests, optional checked-in development media, and this
  lane document.

## Internal Slices

1. Dataset contract characterization.
2. Catalog/specification expansion.
3. Merchant/offer/coupon/history expansion.
4. Account/community/correction/comparison journeys.
5. Attribution/operator journeys and guide.
6. Two-run and full verification.

## Verification

- Live development sequence on the existing database completed bounded,
  bounded, full, full, bounded in 22.58s, 15.01s, 23.19s, 20.60s, and 18.50s.
  The reset step was intentionally skipped because it would destroy unrelated
  local data; ownership reconciliation returned the final live inventory to the
  exact bounded counts above.
- The bounded/bounded/full/full/bounded test proof preserved logical identities,
  preserved database IDs for all operations rows, removed full-only ownership,
  and completed in 95.3s.
- Production GraphQL connections returned two verified pages for catalog
  products (100 rows per page), representative offers (10), saved comparisons
  (20), watches (20), CJ programs (20), unmatched feeds (10), and attribution
  ledger rows (20).
- The seed and development GraphQL suites passed 63 tests with zero failures in
  1,069.2s. The complete backend suite passed 1,501 tests with zero failures in
  1,103.6s.
- The frontend gate passed Relay validation, TypeScript, lint, formatting, 118
  test files and 1,547 tests, client/SSR builds, StyleX mangling, and bundle
  budgets. It emitted only the existing local Node engine warning (25.6.0 in
  use; 24.18.1 requested).
- `mix format --check-formatted`, `mix typecheck`, `mix quality`,
  `mix work_queue.validate`, and `git diff --check` passed. Credo reported zero
  issues, ExDNA remained at its 3/3 baseline, Reach reported no unsuppressed
  smells, and Dialyzer passed with the existing skipped warning.
- External account delivery and CJ runner hooks were configured to fail if
  called; both profiles completed without invoking them or inserting CJ jobs.

## Blocker Rule

Stop before adding a production-callable seed bypass, provider/network/job/mail
call, mutable lookalike ownership, or changes outside seed/test/local-media
paths.

# Realistic Development Data Implementation Plan

> Superseded on 2026-08-14 by
> `docs/superpowers/plans/2026-08-14-scalable-realistic-development-data-implementation-plan.md`.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the deterministic offline seed dataset so development renders realistic shopper, account, community, attribution, and operator states at useful pagination depth.

**Architecture:** Extend the existing domain-oriented seed modules and immutable ownership markers. Authored fixtures describe believable products, merchants, specification combinations, and deterministic time-series scenarios; seed functions reconcile only their owned records and derive related offers, price points, watches, alerts, comparisons, community content, and operator history without network or production side effects.

**Tech Stack:** Elixir 1.19, Ecto/PostgreSQL, existing `ProductCompare.DevSeeds` modules, ExUnit

## Global Constraints

- Target approximately 30 believable products across existing product types and brands, six to eight merchants, overlapping offers, and six to twelve months of deterministic price history.
- Include exact/min/max/shared/different/missing/unsupported spec states; merchant crossover, stock transition, stale/unobserved/inactive offer, coupon lifecycle, and separate-currency scenarios.
- Add useful saved comparisons, watches, alerts, reviews, questions, answers, corrections, clicks, conversions, CJ lifecycle/import, and revenue rows with enough depth for pagination.
- Use stable authored facts and checked-in offline images or intentional fallbacks; never random `Sample N` content.
- Preserve role accounts, immutable seed ownership, scoped reruns, unrelated local rows, and the pending-correction empty-baseline rule.
- Never contact providers, network, schedulers, jobs, mailers, or conversion services.
- Keep `priv/repo/seeds.exs` as the sole orchestrator; do not create a second seed framework or a monolithic script.
- Existing production APIs must not gain a seed-only bypass.

---

### Task 1: Lock dataset scale, scenarios, rerun safety, and offline behavior

**Files:**
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`
- Modify: `priv/repo/seeds/guide.exs`

**Interfaces:**
- Produces: assertions for exact owned counts/ranges, named representative scenarios, two-run idempotence, unrelated-row preservation, pending-correction baseline, pagination depth, role access, and zero external side effects.

- [ ] **Step 1: Add scale and scenario RED assertions**

  Assert 28–32 seed-owned products, 6–8 merchants, representative products with three merchants, at least one 365-day history, one merchant crossover, one stock gap, one separate-currency offer, one missing required spec, one unsupported text spec, and at least two pages for shopper/operator connections using their production page sizes.

- [ ] **Step 2: Add lifecycle RED assertions**

  Assert multiple saved/live/shared comparisons, each watch rule, read/unread alerts, review/Q&A ownership/moderation, pending/accepted corrections, anonymous/member clicks, matched/unmatched conversions, CJ stages/feeds, and revenue date/status combinations.

- [ ] **Step 3: Strengthen rerun and offline proofs**

  Insert unrelated lookalike local rows, run seeds twice, compare owned identifiers/counts, and assert unrelated rows remain byte-for-byte unchanged. Instrument Req/provider clients, Oban, mail delivery, scheduler modules, and network adapters to fail the test if invoked.

- [ ] **Step 4: Run RED and commit**

  ```bash
  mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
  git add test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs priv/repo/seeds/guide.exs
  git commit -m "test: define realistic development dataset"
  ```

---

### Task 2: Expand authored catalog and specification coverage

**Files:**
- Modify: `priv/repo/seeds/catalog.exs`
- Modify: `priv/repo/seeds/support.exs`
- Add only if needed: checked-in development media under the existing static asset path
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Produces: stable product fixture maps keyed by immutable seed keys, with believable name, brand, model, category, description, media/fallback, and typed specification values.
- Produces: category-appropriate attribute combinations that map to existing taxons, attributes, units, and enum options; no new production taxonomy is invented just to fill seeds.

- [ ] **Step 1: Author the product inventory**

  Expand the existing five products to approximately thirty across several existing types. Use stable names/models and descriptions; avoid numbered filler names. Reuse category ordering to select key specs.

- [ ] **Step 2: Author filter contrast**

  Ensure enum/boolean and numeric values create meaningful exact, same, at-least, at-most, shared, and differences results. Include deliberate missing optional facts and one unsupported readable text attribute without violating required constraints.

- [ ] **Step 3: Add offline media intentionally**

  Reuse a small checked-in set by category or use the existing intentional fallback. Do not reference remote images. Give each image meaningful alt text and immutable seed ownership.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  mix format
  mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
  git add priv/repo/seeds/catalog.exs priv/repo/seeds/support.exs test/product_compare assets/public
  git commit -m "feat: expand development catalog fixtures"
  ```

  Stage the public asset path only if this task actually adds local media.

---

### Task 3: Expand merchants, offers, coupons, and deterministic price histories

**Files:**
- Modify: `priv/repo/seeds/marketplace.exs`
- Modify: `priv/repo/seeds/support.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Produces: 6–8 seed-owned merchants and authored product coverage.
- Produces: deterministic history scenarios from an explicit anchor date and scenario point lists; no random prices or `DateTime.utc_now()`-dependent identities.
- Produces: fresh, aging, stale, unavailable, unobserved, inactive, stock-transition, crossover, stable-period, coupon-validity, and separate-currency states.

- [ ] **Step 1: Author merchant coverage and offers**

  Give representative products 3–5 overlapping merchants and long-tail products 1–2. Preserve safe domains, external SKUs, active/inactive status, and currencies.

- [ ] **Step 2: Generate deterministic observations from named scenarios**

  Use authored anchor-relative offsets and Decimal strings. Cover 6–12 months while bounding volume; include daily/weekly cadence appropriate to the scenario and explicit in-stock transitions. Reconciliation keys include immutable offer key plus observed timestamp.

- [ ] **Step 3: Expand coupon lifecycles**

  Add valid, upcoming, expired, code/no-code, percentage/fixed, complete/partial-terms examples linked to relevant offers without bypassing production validation.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs test/product_compare/pricing/product_price_trends_test.exs
  git add priv/repo/seeds/marketplace.exs priv/repo/seeds/support.exs test/product_compare
  git commit -m "feat: expand development marketplace history"
  ```

---

### Task 4: Expand account, community, correction, and comparison journeys

**Files:**
- Modify: `priv/repo/seeds/engagement.exs`
- Modify: `priv/repo/seeds/community_writes.exs`
- Modify: `priv/repo/seeds/correction_safety.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Produces: ordered live/saved/shared comparisons, all watch rule types, alert qualification/read states, reviews/questions/answers with ownership and moderation diversity, and correction lifecycles with the empty-current pending baseline preserved.

- [ ] **Step 1: Expand return journeys**

  Seed comparisons with 2–3 products, meaningful names, varied spec overlap, saved owner rows, indexable/non-indexable shared snapshots, and revoked examples. Seed watches for target price, percentage drop, back in stock, and newly available with matching/nonmatching alerts.

- [ ] **Step 2: Expand community depth**

  Add enough reviews and questions for pagination, accepted/unaccepted answers, owner/non-owner rows, moderation states, and recent/older timestamps. Keep quotas and bypasses seed-local.

- [ ] **Step 3: Preserve correction safety**

  Add pending and accepted correction examples without adopting legacy lookalikes. For pending corrections with `supersedes_claim_id: nil`, keep the current-claim baseline empty after every rerun.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs
  git add priv/repo/seeds/engagement.exs priv/repo/seeds/community_writes.exs priv/repo/seeds/correction_safety.exs test/product_compare
  git commit -m "feat: expand development shopper journeys"
  ```

---

### Task 5: Expand attribution and operator journeys and update the guide

**Files:**
- Modify: `priv/repo/seeds/operations.exs`
- Modify: `priv/repo/seeds/accounts.exs`
- Modify: `priv/repo/seeds/guide.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Produces: affiliate networks/programs/links/coupons, CJ program stages and matched/unmatched feeds, anonymous/member clicks, matched/unmatched conversions, and revenue rows across filter ranges/statuses.
- Produces: concise local guide with role credentials, representative URLs, and named scenarios.

- [ ] **Step 1: Expand affiliate and CJ lifecycle data**

  Seed several networks and merchants, program stages requiring different operator actions, multiple program-feed pages, unmatched feed rows, import run history, and concurrency timestamps. Do not call CJ clients or schedulers.

- [ ] **Step 2: Expand attribution and revenue data**

  Link clicks to safe seeded commerce destinations and explicit anonymous/member identities. Add conversions with purchase/report timing, status, currency, revenue, and commission diversity plus rows with legitimately absent facts.

- [ ] **Step 3: Refresh the local testing guide**

  Print stable credentials for shopper/operator roles and direct links for product filter/chart, comparison/auth, alerts, affiliate setup, CJ, and revenue scenarios. Never print production secrets or one-time API tokens.

- [ ] **Step 4: Run GREEN and commit**

  ```bash
  mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs
  git add priv/repo/seeds test/product_compare
  git commit -m "feat: expand development operator journeys"
  ```

---

### Task 6: Verify deterministic reruns and close the seed outcome

**Files:**
- Modify: `docs/work/realistic-development-data.md`

**Interfaces:**
- Produces: exact owned counts, representative scenario inventory, first/second run results, unrelated-row preservation evidence, external-side-effect proof, and manual page inspection notes.

- [ ] **Step 1: Reset and run the seed twice**

  ```bash
  MIX_ENV=dev mix ecto.reset
  MIX_ENV=dev mix run priv/repo/seeds.exs
  MIX_ENV=dev mix run priv/repo/seeds.exs
  ```

  Compare the guide output and database owned counts after each run.

- [ ] **Step 2: Inspect representative pages**

  Verify catalog pagination/filter combinations, product chart crossovers/currencies, compare differences, watch/alert data, community pages, affiliate sequence, CJ feeds, and revenue ledger using only local data.

- [ ] **Step 3: Run complete gates**

  ```bash
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  cd assets && pnpm run check
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Commit closure**

  ```bash
  git add priv/repo/seeds test docs/work/realistic-development-data.md
  git commit -m "feat: complete realistic development data"
  ```

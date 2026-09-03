# CJ Live Conversion Ingestion

## Snapshot

- Status: complete
- Priority: P1
- Owner: Codex Task 7 closeout
- Design: `docs/superpowers/specs/2026-08-27-cj-live-conversion-ingestion-design.md`
- Plan: `docs/superpowers/plans/2026-08-27-cj-live-conversion-ingestion-implementation-plan.md`
- Validated: 2026-08-27 against the approved design, the completed Commerce
  Attribution and operator implementations, browser evidence, all repository
  gates, the credential preflight, and the refreshed live queue.

## Batch Outcome

ProductCompare now fetches current CJ Commission Detail records into the existing
Commerce Attribution conversion model through a bounded, replay-safe importer.
Operators can inspect credential readiness and current activity, review
secret-safe run evidence, trigger a bounded sync, and configure the durable
non-secret schedule policy from `/commerce/revenue/ingestion`.

This is one reviewable cross-stack outcome. Provider transport, correction-safe
persistence, scheduling, GraphQL, and the operator workspace jointly close the
same live-conversion lifecycle and share one enablement gate.

## Validated Scope

- Persist CJ conversion-sync settings and run evidence with full application
  and PostgreSQL check-constraint parity.
- Fetch and validate CJ Commission Detail GraphQL pages with strict cursor and
  page ceilings.
- Normalize current CJ fields through the existing adapter and reconcile
  action-correlated corrections conservatively.
- Run bounded imports through Oban, a database-claimed 60-second dispatcher,
  an explicit operator mutation, and a strict Mix task.
- Expose operator-only Relay queries and mutations without credentials or raw
  provider failure material.
- Add the dedicated operator ingestion workspace, Revenue and operator
  navigation links, scoped active-state refresh, deferred run history, and
  responsive/accessibility coverage.

## Owned Paths

- `priv/repo/migrations/20260827120000_add_cj_conversion_sync_storage.exs`
- `lib/product_compare_schemas/commerce_attribution/`
- `lib/product_compare/commerce_attribution/`
- `lib/product_compare/application.ex`
- `lib/product_compare_web/schema/commerce_attribution/`
- `lib/product_compare_web/resolvers/commerce_attribution/`
- `lib/mix/tasks/product_compare.commerce_attribution.cj_commissions.ex`
- `lib/mix/tasks/product_compare/commerce_attribution/cj_commissions/`
- `config/runtime.exs`
- `.env.example`
- `assets/schema.graphql`
- `assets/src/__generated__/`
- `assets/src/routes/commerce/revenue/ingestion/`
- `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- `assets/src/routes/config/operator-routes.tsx`
- `assets/src/routes/RootDestinations.tsx`
- `assets/test/routes/commerce/revenue/`
- `assets/test/routes/config/`
- `assets/test/routes/root/`
- `assets/tests/e2e/production-ui-operations.spec.ts`
- `test/product_compare/commerce_attribution/`
- `test/product_compare/repo/commerce_conversion_sync_constraints_test.exs`
- `test/product_compare_web/graphql/commerce_attribution_queries_test.exs`
- `test/product_compare_web/graphql/commerce_attribution_mutations_test.exs`
- `test/mix/tasks/product_compare.commerce_attribution.cj_commissions_test.exs`
- `test/support/fixtures/cj/commission_detail_sample.redacted.json`
- `docs/work/cj-live-conversion-ingestion.md`

The implementation plan is the authoritative per-task file map. Generated
Relay artifacts are touched only by the normal compiler after the schema and
authored operations change.

## Internal Slices

1. Add settings and run storage with focused context owners and database
   contract coverage.
2. Implement the current CJ client and update adapter normalization.
3. Build bounded page traversal and action-level correction persistence.
4. Add Oban execution, database-claimed dispatch, and the strict CLI.
5. Expose the operator-only GraphQL contract and regenerate Relay ownership.
6. Build the dedicated ingestion workspace and navigation links.
7. Prove browser behavior, optional live readiness, and full repository gates.

## Completion Evidence

- Storage completed through `9de81845` and `7625ac2e`; current CJ transport
  completed through `dfddaed0` and `af310509`; bounded correction-safe import
  completed through `ddaad397` and `bc9ff122`.
- Durable execution completed through `61d5bd29`, `35eb6e9f`, and `f4fa2063`;
  operator GraphQL completed through `b4e657a7` and `f617bf38`; the workspace
  completed through `d97ed8f7` and `d4434f8d`.
- Task 7 browser proof and feature-local quality repairs completed in
  `08f64956`, with review hardening in `9c3366da`. The exact targeted Playwright
  command first produced a valid RED
  with 5 passing and 4 failing tests: the new history-retry control was absent,
  and three existing viewport cases exposed a stale user-agent fixture literal.
  The same command then passed 9 tests after adding route-owned recovery and
  correcting the fixture. Desktop, tablet, and mobile reduced-motion captures
  were inspected; the ledger remains contained, and idle/editing axe scans
  reported zero violations.
- Final whole-branch review hardening completed through `6e93b430`, `191808f9`,
  `a9bd0f34`, and `eab31ae8`. It added durable action-level CJ correction
  evidence with full changeset/database constraint parity; rejected
  undocumented statuses, invalid UTC timestamps, and non-finite commission
  amounts at the shared provider boundary; kept every nonterminal Oban state
  polling; reconciled persisted settings through Relay's refreshed overview
  ownership; and explicitly classified the correction payload as raw provider
  evidence in the repository JSON storage policy.
- The focused Commerce Attribution, direct-constraint, GraphQL, ledger, and CLI
  backend command passed 215 tests. Relay validation generated no drift and
  reported 88 reader, 62 normalization, and 88 operation-text artifacts;
  focused frontend typecheck, lint, format, and unit gates passed 113 files and
  1,522 tests.
- Final complete verification passed again on August 29 after the deterministic
  development ingestion settings, run ledger, and correction evidence seeds
  landed: `mix format --check-formatted`, `mix typecheck`,
  `mix quality` (Credo zero issues, ExDNA 3/3 clone budget, Reach zero new
  smells, Dialyzer successful with the existing single ignored warning), and
  `mix test --cover` with 1,671 tests, zero failures, and 86.83% total coverage.
  The seed suites include repeat-run stability and operator GraphQL visibility
  for the seeded ingestion state. `mix frontend_check` passed Relay, typecheck,
  lint, format, 114 unit-test files with 1,530 tests, client and SSR builds,
  StyleX mangling, and the bundle budget. The unchanged Node engine warning
  remained non-blocking because every frontend command exited successfully.
- Credential preflight completed locally without disclosing environment values:
  readiness was false, with both required credential indicators false. **live
  evidence not run: credentials unavailable**. No live window or replay ran,
  no schedule mutation was issued, and persisted scheduling remains disabled.
- Closeout curation rechecked the current implementation, the complete backend
  and frontend gates, source TODO/FIXME markers, `ARCHITECTURE.md`, the candidate
  pool, and lane evidence. It found no new failing contract or independently
  shippable validated successor: remaining provider/product possibilities are
  explicitly deferred, and completed internal slices cannot be redispatched.
  The live queue therefore retains a complete Ready Floor Exception rather than
  manufacturing rows.

## Boundaries

- Credentials and publisher identity remain deployment-managed; the browser
  receives readiness state only.
- Scheduled sync remains disabled by default. Enabling requires configured
  credentials and a successful prior run.
- `Run now` does not move scheduled cadence, and dispatcher recovery does not
  create catch-up fan-out.
- Existing Revenue reporting remains the financial interpretation surface.
- Production email delivery, additional providers, a generic ingestion
  framework, webhooks, subscriptions, and deployment proof remain deferred.

## Blocker And Fallback Rule

Missing live CJ credentials do not block implementation or automated
verification. Keep scheduling disabled, prove the redacted fixture contract,
and record the optional live-readiness command as not run. Stop and update this
lane before widening provider semantics, weakening correction fail-closed
behavior, exposing secret material, or crossing an unlisted product boundary.

## Verification

- Focused RED/GREEN commands in every implementation-plan task.
- `mix ecto.reset`
- `mix check.typespecs`
- `mix typecheck`
- `mix test`
- `mix assets.verify`
- `mix work_queue.validate`
- `mix format --check-formatted`
- `git diff --check`
- Optional credential-gated live command from Task 7, with redacted output.

## Exit Condition

CJ pages import idempotently; corrections converge without positive duplicate
revenue; run and settings constraints hold in changesets and PostgreSQL; queued
or running work deduplicates; dispatcher cadence is database-coordinated; the
operator GraphQL and Relay surfaces are authorization-safe and secret-safe;
the workspace passes functional, responsive, reduced-motion, and accessibility
checks; and all repository gates pass. Preserve milestone evidence here, remove
the completed row from the live queue, and replenish the queue or renew its
complete ready-floor exception in the same coordinator update.

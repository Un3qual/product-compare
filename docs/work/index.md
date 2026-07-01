# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row or one explicitly requested parallel batch of independent
  ready rows, remove the decision row so the selected `blocked` row becomes
  highest-ranked, or leave the missing decision named.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-07-01

The 2026-06-29 usable-product batch is complete. It moved the shopper decision
loop forward across product browse cards, product detail actions, compare
selection, offer filter context, and saved-comparison return paths.

The first explicitly requested parallel batch from the product filtering and
in-depth comparison plan set is complete. Backend filter metadata/facets and
frontend compare matrix modes landed in separate commits with focused
verification.

The full product filtering and in-depth comparison plan set is complete.
Persistent Compare Tray work is complete through
`871fecb docs: record persistent compare tray verification`, and the compare,
catalog, and detail lane docs record the completed evidence.

The CJ read-model and weekly operator-runbook batch is now promoted as the live
parallel batch. The batch is CJ-only and keeps application submission,
account-manager automation, Tier-3 scraping, credential persistence, GraphQL/UI
surfaces, scheduler behavior, network calls, mutations, CSV export paths, raw
artifact exposure, account ids, tracking params, provider error payloads, and
secret values out of scope.

## Ready Work

### Parallel Batch: CJ Read-Model And Weekly Operator Runbook

Batch rules:

- Workers start from `docs/work/index.md`, `docs/work/operating-model.md`,
  `docs/work/product-data-scraping.md`, and their row's active plan.
- Parallel workers may edit only their row's owned paths and the named evidence
  heading in `docs/work/product-data-scraping.md`.
- Do not implement another row's read model, runbook, tests, or evidence
  heading from the same worker branch.
- CJ candidate CSV score export remains rejected and must not be promoted.

#### CJ Candidate Freshness Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md`
Next action: Add the read-only CJ candidate freshness aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_candidate_freshness.ex`
- `test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- `docs/work/product-data-scraping.md` under `### Candidate Freshness Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: Candidate freshness read model is covered by focused tests and completion evidence is recorded only under `### Candidate Freshness Evidence`.

#### CJ Run Health Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md`
Next action: Add the read-only CJ run health aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_run_health.ex`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `docs/work/product-data-scraping.md` under `### Run Health Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_run_health_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ run health read model is covered by focused tests and completion evidence is recorded only under `### Run Health Evidence`.

#### CJ Run Throughput Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md`
Next action: Add the read-only CJ run throughput aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_run_throughput.ex`
- `test/product_compare/ingestion/cj_run_throughput_test.exs`
- `docs/work/product-data-scraping.md` under `### Run Throughput Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ run throughput read model is covered by focused tests and completion evidence is recorded only under `### Run Throughput Evidence`.

#### CJ Import Artifact Quality Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md`
Next action: Add the read-only CJ import artifact quality aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_import_artifact_quality.ex`
- `test/product_compare/ingestion/cj_import_artifact_quality_test.exs`
- `docs/work/product-data-scraping.md` under `### Import Artifact Quality Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ import artifact quality read model is covered by focused tests and completion evidence is recorded only under `### Import Artifact Quality Evidence`.

#### CJ Import Price Quality Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md`
Next action: Add the read-only CJ import price quality aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_import_price_quality.ex`
- `test/product_compare/ingestion/cj_import_price_quality_test.exs`
- `docs/work/product-data-scraping.md` under `### Import Price Quality Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ import price quality read model is covered by focused tests and completion evidence is recorded only under `### Import Price Quality Evidence`.

#### CJ Merchant Identity Quality Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md`
Next action: Add the read-only CJ merchant identity quality aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_merchant_identity_quality.ex`
- `test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`
- `docs/work/product-data-scraping.md` under `### Merchant Identity Quality Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ merchant identity quality read model is covered by focused tests and completion evidence is recorded only under `### Merchant Identity Quality Evidence`.

#### CJ Application Readiness Read Model

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md`
Next action: Add the read-only CJ application readiness aggregate and focused tests without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credentials, account ids, application submission, or CSV export paths.
Owned paths:

- `lib/product_compare/ingestion/cj_application_readiness.ex`
- `test/product_compare/ingestion/cj_application_readiness_test.exs`
- `docs/work/product-data-scraping.md` under `### Application Readiness Evidence` only
Verification:

- `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`
- `mix format --check-formatted`
- `mix typecheck`
- `git diff --check`
Exit condition: CJ application readiness read model is covered by focused tests and completion evidence is recorded only under `### Application Readiness Evidence`.

#### CJ Weekly Operator Runbook

Status: ready
Lane: Product data scraping (`docs/work/product-data-scraping.md`)
Active plan: `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md`
Next action: Write the docs-only weekly CJ operator runbook without adding scheduler behavior, network calls, GraphQL fields, browser routes, mutations, credential persistence, application submission, account-manager automation, Tier-3 scraping, or CSV export paths.
Owned paths:

- `docs/runbooks/cj-weekly-operator-loop.md`
- `docs/work/product-data-scraping.md` under `### Weekly Operator Runbook Evidence` only
Verification:

- `rg -n "T[O]DO|T[B]D|CJ candidate CSV score export is all[o]wed|CJ_(API_T[O]KEN|ACCOUNT_ID)=[^[:space:]]+" docs/runbooks/cj-weekly-operator-loop.md` exits 1 with no matches
- `git diff --check`
Exit condition: The weekly operator runbook exists, avoids unfinished placeholders and secret-looking assignments, and completion evidence is recorded only under `### Weekly Operator Runbook Evidence`.

## Just Completed

The 2026-06-30 first product filtering and in-depth comparison parallel batch
and dependent catalog UI follow-up completed these three work items:

- Backend filter metadata/facets: GraphQL now exposes
  `productFilterMetadata(filters:)` with display-safe counts, ranges, selected
  state, and typed filter validation using the existing `ProductFiltersInput`.
- Frontend product comparison: `/compare` now supports URL-backed
  `specs=shared|differences|all` matrix modes with mode-preserving add/remove
  links and explicit missing values.
- Frontend catalog browse: `/products` now renders metadata-backed faceted
  filters, preserves active filter URLs through pagination, and clears back to
  the unfiltered browse page.
- Compare attribute metadata: `Product.currentAttributes` now includes typed,
  ordered, groupable metadata used by product detail and compare rendering while
  preserving the `valueText` fallback contract.
- Compare offer decision helpers: `/compare` now renders a bounded, resilient
  decision summary for current price and offer quality using the existing
  `merchantProducts(input:)` pricing contract.

The 2026-06-29 usable-product batch completed these five work items:

- Frontend catalog browse: `/products` product decision cards with stable
  detail, compare, and offer actions.
- Frontend product detail: `/products/:slug` next-action block for compare,
  offer review, and browse return.
- Frontend product comparison: `/compare` selected-product tray and add-another
  affordance.
- Frontend offer discovery: `/offers` active filter context, reset actions, and
  product-selection guidance.
- Frontend saved comparisons: `/compare/saved` card summaries, scoped actions,
  and empty/no-match return links.

The 2026-06-27 cross-project parallel batch completed these ten work items:

- Frontend catalog browse: `/products` page-size controls.
- Frontend product detail: `/products/:slug` active-offer pagination.
- Frontend offer discovery: visible `/offers` filters.
- Frontend merchant discovery: `/merchants` page-size controls.
- Frontend revenue reporting: deterministic date preset links.
- Frontend saved comparisons: client-side saved-set filtering.
- Frontend product comparison: compare-selection remove controls.
- Frontend API token management: create/rotate expiration presets.
- Frontend affiliate setup: selected merchant context summaries.
- Product data scraping: provider-neutral source-health read model.

## Retained Follow-Up Work

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted. eBay Browse fallback remains blocked on
CJ catalog-scope evidence.

## Executor Prompts

Coordinator:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row.
Make exactly one decision or unblock exactly one blocker.
Update only the live queue plus the directly affected lane or plan docs.
End with either one ready row or a clearly named blocker.
```

Worker:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Execute only the highest-ranked row whose Status is ready.
Open only that row's Work Doc, linked active plan if any, Target Paths, and immediate tests.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them as Target Paths.
Stop if the row is blocked, stale, or needs a decision.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.

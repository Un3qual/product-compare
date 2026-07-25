# CJ Weekly Operator Loop

## Purpose

Run a weekly CJ ingestion loop that keeps program stages, feed quality, run
health, and manual application decisions current without adding automation or
exposing secrets. This runbook uses existing Mix tasks and the operator-only CJ
programs page.

## Prerequisites

- Required environment variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`.
- Optional environment variable name: `CJ_PROPERTY_ID`.
- Keep credential values outside git in ignored local env files or process
  environment variables.
- Record only readiness, counts, CJ program stages, provider feed ids, and
  manual decisions. Do not record credential values, account ids, tracking
  params, provider payloads, raw metadata, or source artifact payloads.

## Bounded Scheduled Operation

Recurring CJ operation remains opt-in. Before enabling either schedule, run the
credential preflight and one bounded manual discovery/import cycle from the
weekly flow below. Set runtime values outside source control.

- `CJ_FEED_DISCOVERY_SCHEDULE_ENABLED=true` enables bounded CJ feed discovery.
- `CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED=true` enables bounded product import.
- `CJ_FEED_DISCOVERY_INTERVAL_MINUTES` and
  `CJ_PRODUCT_IMPORT_INTERVAL_MINUTES` default to `1440`.
- `CJ_FEED_DISCOVERY_LIMIT`, `CJ_PRODUCT_IMPORT_LIMIT`,
  `CJ_FEED_DISCOVERY_PAGES`, and `CJ_PRODUCT_IMPORT_PAGES` bound each run.
- Product import query scope remains controlled by
  `CJ_PRODUCT_IMPORT_KEYWORDS`, `CJ_PRODUCT_IMPORT_CURRENCY`, and
  `CJ_PRODUCT_IMPORT_SERVICEABLE_AREAS`.
- `CJ_PRODUCT_IMPORT_COMPLETE_SCOPE=true` opts the exact configured query into
  unseen-offer reconciliation. Leave it false unless the operator has verified
  that the query is intended as a stable membership scope and the configured
  page bound can reach the provider's end cursor. A partial, failed, or
  superseded run is still fail-closed and cannot deactivate offers.

After both schedules are enabled and each surface has completed a successful
bounded run, require scheduled readiness:

```sh
mix product_compare.ingestion.cj_readiness_gate \
  --max-discovery-age-hours 48 \
  --max-import-age-hours 48 \
  --min-candidates 1 \
  --require-scheduled \
  --require-ready
```

The report exposes schedule booleans only; it does not print environment values
or start either scheduler. A failed scheduled-readiness gate is an operational
signal to inspect the bounded CJ runs. It does not authorize eBay fallback,
Tier-3 scraping, ingestion dashboards, automated merchant applications,
account-manager automation, credential persistence, or CSV export.

## Weekly Flow

1. Check credential presence before any network-facing CJ command:

   ```sh
   mix product_compare.ingestion.cj_credentials --require-ready
   ```

2. Check persisted readiness and recent successful discovery/import state:

   ```sh
   mix product_compare.ingestion.cj_readiness_gate --max-discovery-age-hours 168 --max-import-age-hours 168 --min-candidates 1 --require-ready
   ```

3. Review the latest discovery and import runs:

   ```sh
   mix product_compare.ingestion.cj_runs --report latest --surface discovery --max-age-hours 168
   mix product_compare.ingestion.cj_runs --report latest --surface import --max-age-hours 168
   ```

4. Review recent history when the latest status is unclear:

   ```sh
   mix product_compare.ingestion.cj_runs --report history --surface discovery --limit 10
   mix product_compare.ingestion.cj_runs --report history --surface import --limit 10
   ```

5. Check failed runs before making program-stage decisions:

   ```sh
   mix product_compare.ingestion.cj_runs --report failed --surface all --limit 25
   ```

6. Use **CJ programs** at `/ingestion/cj-programs` to inspect every linked
   advertiser program, its feeds, and unmatched feeds. Review stage-scoped
   reports when additional feed evidence is useful:

   ```sh
   mix product_compare.ingestion.cj_candidates --report stale --stage all --max-age-hours 168 --limit 25
   mix product_compare.ingestion.cj_candidates --report fit-gaps --stage new --limit 25
   ```

7. If discovery is stale or feed volume is too low, run one bounded feed
   discovery pass after credential checks:

   ```sh
   mix product_compare.ingestion.cj_feeds --check-credentials --require-ready
   mix product_compare.ingestion.cj_feeds --advertiser-country US --limit 25 --pages 1
   ```

8. If product import evidence is stale, run one bounded import pass from
   Selected, Applied, and Accepted CJ programs:

   ```sh
   mix product_compare.ingestion.cj_import --check-credentials --require-ready
   mix product_compare.ingestion.cj_import --from-programs --feed-limit 10 --limit 25 --pages 1
   ```

9. Use **CJ programs** at `/ingestion/cj-programs` to move each advertiser
   program directly to the appropriate stage. **Selected** is the manual
   application cohort; record the decision and stop before application
   submission.

10. Generate the manual application cohort report and stop before any application
    submission:

    ```sh
    mix product_compare.ingestion.cj_candidates --report application-cohort --format markdown --country US --currency USD --language EN --min-product-count 1 --limit 25
    ```

## Commands

- `mix product_compare.ingestion.cj_credentials`
  checks required CJ credential presence and can enforce readiness with
  `--require-ready`.
- `mix product_compare.ingestion.cj_readiness_gate`
  checks persisted readiness using recent discovery/import runs, feed counts,
  and pursued CJ program counts; `--require-scheduled` additionally
  requires both existing runtime schedules to be enabled.
- `mix product_compare.ingestion.cj_runs`
  reports `latest`, `history`, or `failed` CJ runs for discovery and import
  surfaces.
- `mix product_compare.ingestion.cj_candidates`
  reports stale feeds, fit gaps, and the Selected-program application cohort in
  line or Markdown format. Use `--stage` to narrow feed evidence.
- `mix product_compare.ingestion.cj_feeds`
  performs bounded manual feed discovery.
- `mix product_compare.ingestion.cj_import`
  performs bounded manual product import, including `--from-programs` for
  Selected, Applied, and Accepted programs. Repeated `--stage` narrows that
  pursued-stage set, while explicit `--provider-feed-id` values import those
  CJ feeds directly. Add `--complete-scope` only after verifying the exact
  query is an intended stable membership scope and the page bound can reach its
  end cursor.

## Decision Records

For each weekly pass, record:

- Date of the weekly pass.
- Credential readiness result by readiness boolean and missing variable names
  only.
- Latest discovery and import run status, freshness, pages, records, and failed
  counts.
- Program-stage, feed freshness, or fit-gap summary.
- Program stage movements and provider feed ids when explicitly imported.
- Selected application-cohort count and manual next decision.

Do not record credential values, account ids, tracking params, raw metadata, raw
provider payloads, source artifact payloads, or application-submission text.

## Troubleshooting

- Missing credentials: run `mix product_compare.ingestion.cj_credentials` and
  populate the missing required variable names outside git before retrying a CJ
  network-facing command.
- Stale discovery: run a single bounded `mix product_compare.ingestion.cj_feeds`
  pass, then recheck `mix product_compare.ingestion.cj_runs --report latest
  --surface discovery`.
- Stale import: run a single bounded `mix product_compare.ingestion.cj_import`
  pass from pursued CJ programs, then recheck the latest import run.
- Zero feeds: run the readiness gate and discovery latest report first. If
  credentials are ready and discovery is stale, run one bounded discovery pass.
- Failed runs: inspect `mix product_compare.ingestion.cj_runs --report failed
  --surface all --limit 25`, then rerun only the smallest bounded discovery or
  import command that addresses the failed surface.
- No application cohort rows: inspect fit gaps, move qualifying programs to
  Selected in CJ programs, regenerate the cohort report, and stop before
  application submission.

## Hard Guardrails

- Do not add or use CJ program or feed CSV score export.
- Do not automate merchant application submission.
- Do not automate account-manager contact.
- Do not persist CJ credentials or credential-derived config.
- Do not add Tier-3 direct scraping.
- Do not add scheduler behavior, GraphQL fields, UI surfaces, browser routes, or
  new mutation surfaces from this weekly loop.
- Do not expose artifact URLs, raw source artifacts, raw metadata, account ids,
  tracking params, provider error payloads, or secret values.
- Stop at the application cohort report. Application submission remains a later
  explicit owner decision.

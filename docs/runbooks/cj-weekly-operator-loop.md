# CJ Weekly Operator Loop

## Purpose

Run a weekly CJ ingestion review loop that keeps candidate quality, run health,
and manual application decisions current without adding automation or exposing
secrets. This runbook uses existing Mix tasks and read-only reporting surfaces.

## Prerequisites

- Required environment variable names: `CJ_API_TOKEN`, `CJ_ACCOUNT_ID`.
- Optional environment variable name: `CJ_PROPERTY_ID`.
- Keep credential values outside git in ignored local env files or process
  environment variables.
- Record only readiness, counts, candidate ids, provider feed ids, and manual
  decisions. Do not record credential values, account ids, tracking params,
  provider payloads, raw metadata, or source artifact payloads.

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

5. Check failed runs before making candidate decisions:

   ```sh
   mix product_compare.ingestion.cj_runs --report failed --surface all --limit 25
   ```

6. Review stale candidates and fit gaps:

   ```sh
   mix product_compare.ingestion.cj_candidates --report stale --status all --max-age-hours 168 --limit 25
   mix product_compare.ingestion.cj_candidates --report fit-gaps --status pending --limit 25
   ```

7. If discovery is stale or candidate volume is too low, run one bounded feed
   discovery pass after credential checks:

   ```sh
   mix product_compare.ingestion.cj_feeds --check-credentials --require-ready
   mix product_compare.ingestion.cj_feeds --advertiser-country US --limit 25 --pages 1
   ```

8. If product import evidence is stale, run one bounded import pass from reviewed
   candidates:

   ```sh
   mix product_compare.ingestion.cj_import --check-credentials --require-ready
   mix product_compare.ingestion.cj_import --from-candidates --review-status shortlisted --candidate-limit 10 --limit 25 --pages 1
   ```

9. Dry-run review decisions for explicit candidates first. Use repeated
   `--provider-feed-id` or repeated `--id` values from the reports:

   ```sh
   mix product_compare.ingestion.cj_candidate_review_batch --provider-feed-id provider-feed-id --status shortlisted --note "weekly review"
   ```

10. Apply only intentional shortlist or dismiss decisions after checking the
    dry-run output:

    ```sh
    mix product_compare.ingestion.cj_candidate_review_batch --provider-feed-id provider-feed-id --status shortlisted --note "weekly review" --apply
    ```

11. Generate the manual application cohort report and stop before any application
    submission:

    ```sh
    mix product_compare.ingestion.cj_candidates --report application-cohort --format markdown --country US --currency USD --language EN --min-product-count 1 --limit 25
    ```

## Commands

- `mix product_compare.ingestion.cj_credentials`
  checks required CJ credential presence and can enforce readiness with
  `--require-ready`.
- `mix product_compare.ingestion.cj_readiness_gate`
  checks persisted readiness using recent discovery/import runs and candidate
  counts.
- `mix product_compare.ingestion.cj_runs`
  reports `latest`, `history`, or `failed` CJ runs for discovery and import
  surfaces.
- `mix product_compare.ingestion.cj_candidates`
  reports stale candidates, fit gaps, and application cohorts in line or
  Markdown format.
- `mix product_compare.ingestion.cj_candidate_review_batch`
  dry-runs or applies explicit candidate review-status changes.
- `mix product_compare.ingestion.cj_feeds`
  performs bounded manual feed discovery.
- `mix product_compare.ingestion.cj_import`
  performs bounded manual product import, including from reviewed candidates.

## Decision Records

For each weekly pass, record:

- Date of the weekly pass.
- Credential readiness result by readiness boolean and missing variable names
  only.
- Latest discovery and import run status, freshness, pages, records, and failed
  counts.
- Candidate freshness or fit-gap summary.
- Candidate review decisions applied, using candidate ids or provider feed ids.
- Application cohort count and manual next decision.

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
  pass from shortlisted candidates, then recheck the latest import run.
- Zero candidates: run the readiness gate and discovery latest report first. If
  credentials are ready and discovery is stale, run one bounded discovery pass.
- Failed runs: inspect `mix product_compare.ingestion.cj_runs --report failed
  --surface all --limit 25`, then rerun only the smallest bounded discovery or
  import command that addresses the failed surface.
- No application cohort rows: inspect fit gaps, shortlist only reviewed
  candidates that meet the manual criteria, regenerate the cohort report, and
  stop before application submission.

## Hard Guardrails

- Do not add or use CJ candidate CSV score export.
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

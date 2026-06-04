# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row, remove the decision row so the selected `blocked` row
  becomes highest-ranked, or leave the missing decision named.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-06-04

| Rank | Status | Lane | Work Doc | Next Action | Target Paths | Verification | Exit Condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Product data ingestion | `docs/work/product-data-scraping.md` | Implement the first manual CJ connector batch against `ads.api.cj.com/query`: add an env-var-backed GraphQL client, wire `ProductParser.fetch_batch/2`, and add a one-page manual import Mix task. | `docs/work/index.md`, `docs/work/product-data-scraping.md`, `docs/plans/INDEX.md`, `docs/plans/2026-06-04-manual-cj-connector-implementation-plan.md`, `lib/product_compare/ingestion/sources/cj/client.ex`, `lib/product_compare/ingestion/sources/cj/product_parser.ex`, `lib/mix/tasks/product_compare.ingestion.cj_import.ex`, `test/product_compare/ingestion/sources/cj/client_test.exs`, `test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `test/product_compare/ingestion/ingestion_test.exs`, `test/mix/tasks/product_compare_ingestion_cj_import_test.exs` | `mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/ingestion/ingestion_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs`; `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`; `mix typecheck`; `git diff --check` | Promote a live manual import verification row, or record the exact CJ API/client/persistence blocker. |

## Ready Work

Product data ingestion has one ready manual connector row. Keep the batch
manual and env-var-backed: no scheduled polling, credential config, account
automation, or Tier-3 direct scraping in this row.

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

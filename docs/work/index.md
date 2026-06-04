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
| 1 | needs_decision | Product/backend priority | `docs/plans/INDEX.md` | Choose exactly one path: keep CJ validation as the next blocker to clear, declare CJ unavailable and plan the eBay Browse fallback, or create one new demo-parity/frontend candidate. | `docs/work/index.md`, `docs/plans/INDEX.md`, `docs/plans/NOW.md`, and the selected lane doc or new plan only. | `git diff --check`; verify the promoted row has concrete target paths and verification. | Decision recorded by either promoting exactly one `ready` row, or removing this row and making the CJ blocker the highest-ranked row until evidence arrives; otherwise this row remains `needs_decision` with the missing decision named. |
| 2 | blocked | Product data ingestion | `docs/work/product-data-scraping.md` | Record non-secret CJ credential access, product catalog surface and quota behavior, permission for one redacted account-scoped sample, and a named compliance approver. | `docs/work/index.md`, `docs/work/product-data-scraping.md`, `docs/plans/INDEX.md`, `docs/plans/2026-06-01-live-cj-provider-validation-and-source-onboarding-implementation-plan.md`, `docs/decisions/2026-06-01-live-cj-provider-validation-and-source-onboarding.md`, `test/support/fixtures/cj/product_validation_sample.redacted.json`, `test/product_compare/ingestion/**`, `lib/product_compare/ingestion/sources/cj/product_parser.ex` only if the sample proves a parser gap. | Before unblock: evidence review only. After unblock: run the focused commands in `docs/work/product-data-scraping.md`. | Promote CJ validation Task 1 to `ready`, or record why CJ is unavailable and promote the fallback-planning row. |

## No Ready Work

There is currently no unblocked implementation batch. The next useful action is a
coordinator decision or the external CJ/compliance evidence listed above.

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

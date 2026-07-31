# Frontend Radix Disclosure Controls

## Snapshot

- Status: ready
- Priority: P3
- Plan:
  `docs/superpowers/plans/2026-07-30-radix-disclosure-controls-implementation-plan.md`
- Last verified: 2026-07-30 against the existing Radix Collapsible wrapper,
  the five native application disclosures, and their focused route suites.

## Target Outcome

Price-watch creation, comparison sharing, review creation, question creation,
and answer creation use the existing Radix Collapsible wrapper with their
current lazy-loading, form, accessibility, and styling behavior preserved.

## Validated Scope

- `PriceWatchControl` contains one native disclosure.
- `ShareComparisonControl` contains one native controlled disclosure whose
  open state gates snapshot-history work.
- `ProductCommunityPanel` contains native review, question, and answer
  disclosures.
- The repository already owns a thin Radix Collapsible primitive and has
  focused route tests for all five consumers.
- No other native `<details>` or `<summary>` element exists under
  `assets/src`.

## Boundaries

- Reuse the existing wrapper; do not add a parallel disclosure abstraction.
- Preserve StyleX and current form/mutation ownership.
- Preserve closed-by-default, keyboard, focus, `aria-expanded`, and SSR
  behavior.
- Preserve comparison history's expansion-driven loading.
- Do not absorb the separate visible form-control migration.

## Verification

- focused alert, comparison snapshot, community, and primitive tests
- native visible-disclosure architecture scan
- TypeScript, Oxc, Oxfmt, and full frontend tests
- Vite client and SSR builds plus bundle contract
- `mix work_queue.validate`
- `git diff --check`

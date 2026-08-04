# Frontend Radix Disclosure Controls

## Snapshot

- Status: done
- Priority: P3
- Plan:
  `docs/superpowers/plans/2026-07-30-radix-disclosure-controls-implementation-plan.md`
- Last verified: 2026-08-04 against all five migrated disclosures, the native-
  disclosure architecture guard, 40 focused tests, and the full frontend gate.

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

## Evidence

- TDD characterization first failed in four places: the architecture scan found
  seven source lines containing native disclosure tags, and the alert,
  comparison-snapshot, and community suites could not find button triggers.
  After the migration, the five focused files passed 40 tests.
- Price-watch, review, question, and answer forms use uncontrolled Radix
  Collapsible roots with force-mounted, closed-hidden content so form state is
  retained. Comparison sharing keeps its controlled open state, and snapshot
  history still begins only on first expansion.
- The native-disclosure scan now rejects `<details>` and `<summary>` anywhere
  under `assets/src`; no parallel primitive or styling abstraction was added.
- Fresh full verification passed Relay validation, TypeScript, Oxc, Oxfmt over
  398 files, 105 Vitest files with 1,528 tests, client and SSR production
  builds, and the 1,327,203-raw / 268,729-gzip-byte client bundle contract.
- `mix work_queue.validate` passed with three ready rows after closeout, and
  `git diff --check` passed.

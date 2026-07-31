# Radix Disclosure Controls Implementation Plan

**Goal:** Replace the five remaining native application disclosures with the
existing Radix Collapsible primitive while preserving lazy work, form state,
accessibility, and StyleX ownership.

**Architecture:** Reuse the project-local `Collapsible`,
`CollapsibleTrigger`, and `CollapsibleContent` wrappers. Keep each disclosure
locally owned by its route component, use Radix's uncontrolled state when no
consumer observes expansion, and use controlled state only where comparison
snapshot history already depends on expansion.

**Tech Stack:** React, Radix Collapsible, StyleX, TypeScript, Vitest, Vite.

## Global Constraints

- Preserve StyleX as the styling owner.
- Do not add another disclosure abstraction or dependency.
- Preserve closed-by-default behavior, keyboard activation, focusability,
  `aria-expanded`, form submission, mutation state, and SSR output.
- Preserve comparison snapshot history's first-expansion loading boundary.
- Keep the form-control migration in its separately ranked Radix batch.

## Task 1: Freeze Disclosure Behavior

- [ ] Characterize closed/open semantics, keyboard-accessible triggers, and
  form availability for price-watch and community disclosures.
- [ ] Characterize comparison-sharing controlled expansion and lazy snapshot
  history loading.
- [ ] Add an architecture assertion rejecting native visible
  `<details>/<summary>` elements under `assets/src`.

## Task 2: Migrate The Five Disclosures

- [ ] Rebase price-watch creation on the existing Radix Collapsible wrapper.
- [ ] Rebase comparison sharing without changing its controlled open-state
  contract.
- [ ] Rebase review, question, and answer creation disclosures without
  changing submission or idempotency behavior.

## Task 3: Verify And Close

- [ ] Run focused alert, comparison-snapshot, community, and UI primitive
  suites.
- [ ] Run TypeScript, Oxc, Oxfmt, the full frontend suite, client/SSR builds,
  and the bundle contract.
- [ ] Record exact evidence and close the lane.

Exit condition: no visible native disclosure remains under `assets/src`, the
five affected controls use the existing Radix wrapper, lazy and submission
behavior is unchanged, StyleX remains in place, and every frontend gate passes.

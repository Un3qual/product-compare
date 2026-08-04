# Frontend Destructive Action Confirmation

## Snapshot

- Status: ready
- Priority: P2
- Design:
  `docs/superpowers/specs/2026-08-04-destructive-action-confirmation-design.md`
- Plan:
  `docs/superpowers/plans/2026-08-04-destructive-action-confirmation-implementation-plan.md`
- Last verified: 2026-08-04 against the four direct danger controls, existing
  route tests, Radix dependencies, and the completed disclosure-control batch.

## Target Outcome

Revoking a public comparison link, deleting a saved comparison, revoking an API
token, and deleting a price watch each require an explicit, accessible,
cancelable confirmation before their existing mutation begins.

## Ready Evidence

- All four actions are currently danger-styled buttons that invoke their
  callback or GraphQL mutation on the first click.
- Each route already owns row-scoped pending, error, and success behavior that
  can remain unchanged behind a confirmation boundary.
- The frontend already uses Radix Dialog and Radix Themes buttons, and its
  lockfile already contains Radix AlertDialog 1.1.23 transitively, but the
  application has no direct AlertDialog dependency or destructive-confirmation
  component.
- Community removal already has explicit confirmation, and API-token rotation
  is already a multi-step replacement workflow; neither belongs in this batch.
- The owned frontend paths are disjoint from ready backend rows 16-18.

## Boundaries

- Use one concrete `DestructiveActionDialog`; do not generalize mutation or
  route state into the overlay layer.
- Opening and canceling are inert. Confirming invokes the unchanged selected-row
  action exactly once.
- Preserve entity-specific accessible copy, focus restoration, StyleX, SSR,
  and all current mutation outcomes.
- Do not add typed-text confirmation, undo, toast infrastructure, backend
  changes, or unrelated danger-action redesign.

## Verification

- focused shared-dialog and four affected route suites
- TypeScript, Oxc, Oxfmt, Relay validation, and the complete frontend test suite
- Vite client and SSR builds plus bundle contract
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop and record the exact surface if confirmation cannot wrap its existing
row-scoped action without moving mutation ownership into the shared dialog or
changing a public mutation outcome.

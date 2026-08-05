# Frontend Destructive Action Confirmation

## Snapshot

- Status: complete
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

## Completion Evidence

- One project-local `DestructiveActionDialog` now owns Radix AlertDialog
  semantics, focus management, cancel, confirmation presentation, and StyleX.
- Public-link revocation, saved-comparison deletion, API-token revocation, and
  price-watch deletion import that component directly and pass their unchanged
  selected snapshot, saved-set ID, token ID, or watch only from `onConfirm`.
- The existing route owners still retain all mutation submission, row-scoped
  pending and error state, success removal or relabeling, and concurrent-row
  behavior.
- Batch 19 is removed from the live queue after completion. Ready rows 20-22
  remain unchanged, leaving the required three-row floor intact.

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

- RED: the four affected route suites ran 95 tests with 22 expected failures;
  first clicks invoked the existing callbacks immediately and no alert dialog
  existed.
- GREEN: the shared-dialog and four route suites passed 96/96 tests. The two
  broader saved-comparison integration suites then passed 118/118 after their
  existing delete flows were updated to confirm explicitly.
- Full frontend gate: Relay validated 55 reader, 53 normalization, and 54
  operation-text documents; TypeScript and Oxc passed; Oxfmt checked 398 files;
  and all 1,530 tests in 106 files passed.
- Production builds passed with 1,082 transformed client modules and 250 SSR
  modules. The bundle contract passed at 1,327,264 raw / 268,764 gzip bytes
  against the 300,000-byte gzip budget.
- `mix work_queue.validate` passed with ready rows 20-22 intact, and
  `git diff --check` passed.

## Blocker Rule

Stop and record the exact surface if confirmation cannot wrap its existing
row-scoped action without moving mutation ownership into the shared dialog or
changing a public mutation outcome.

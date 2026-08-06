# Destructive Action Confirmation Design

## Status

Approved for queue promotion on 2026-08-04 as a validated reserve batch. This
design is not part of the active Operator Mutation Authorization Freshness
implementation.

## Context

Four user-visible danger actions currently invoke an irreversible GraphQL
mutation on the first click: revoking a public comparison link, deleting a
saved comparison, revoking an API token, and deleting a price watch. Each
surface already owns correct row-scoped pending, error, and success behavior,
but none gives the user a distinct cancelable confirmation step.

Community-content removal is already explicitly confirmed through its own
form. API-token rotation is already a multi-step replacement workflow. Both
remain outside this batch.

## Considered Approaches

1. Extend the creation-oriented `ActionDialog`. This avoids another component
   but mixes creation/help content with irreversible confirmation semantics and
   its fixed `Close` action.
2. Add one Radix AlertDialog-backed `DestructiveActionDialog`. This gives the
   four surfaces a shared cancel/confirm contract, correct modal semantics, and
   one styling owner without absorbing their mutations. This is the selected
   approach.
3. Implement four route-local dialogs. This minimizes shared API design but
   duplicates focus, labeling, cancel, overlay, and destructive-action rules.

## Design

Add `@radix-ui/react-alert-dialog` as a direct frontend dependency and one
`DestructiveActionDialog` overlay component. The component owns Radix portal,
overlay, title, description, cancel, explicit danger confirmation, focus
management, and StyleX presentation. It accepts a trigger, title, description,
confirmation label, and `onConfirm` callback; it does not know GraphQL, route
state, entity types, or mutation outcomes.

Each route keeps its existing action owner:

- comparison sharing passes the selected snapshot to its existing revoke
  callback only after confirmation;
- the saved-comparison list passes the selected set ID to `onDelete` only after
  confirmation;
- the API-token item passes the token ID to `onRevoke` only after confirmation;
- the alert watch row passes the watch to `onDelete` only after confirmation.

Opening or canceling performs no mutation. Confirming closes the dialog and
invokes the existing callback once. Existing row-scoped pending state disables
the trigger, existing success behavior may remove or relabel the row, and
existing mutation failures remain visible on the row rather than reopening the
dialog.

## Accessibility And Presentation

Radix AlertDialog supplies modal alert-dialog semantics, focus containment,
Escape handling, outside-interaction protection, and trigger-focus restoration
on cancel. Every dialog has an explicit title and consequence description.
The confirmation button retains the existing danger tone; cancel is a soft
button. StyleX remains the only styling owner.

## Verification

TDD first proves the shared dialog does not confirm on open or cancel and
confirms exactly once on the explicit action. Focused route tests then prove
each first click opens the correctly labeled dialog without invoking its
mutation, cancel is inert, confirm passes the same row/entity argument, and
existing pending/error/success behavior is unchanged. The full frontend gate,
client and SSR builds, bundle budget, work-queue validator, and diff hygiene
close the batch.

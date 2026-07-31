# Ecto Dataloader Policy Guard Implementation Plan

**Goal:** Make the approved Ecto-first GraphQL loading policy executable so a
KV source or unnecessary association resolver cannot return without an
explicit architecture change.

**Architecture:** Strengthen the existing GraphQL architecture suite at both
source and runtime boundaries. Scan all first-party library code rather than
only the current GraphQL folders, inspect every source built by `Loader.new/1`,
and lock the ordinary association fields to Absinthe's inline
`resolve: dataloader(Context)` form.

**Tech Stack:** Elixir, Absinthe, Dataloader Ecto, ExUnit.

## Global Constraints

- KV Dataloader remains prohibited unless the user explicitly approves a
  separately reviewed exception.
- Use `Dataloader.Ecto` for association and set-based custom batches.
- Ordinary associations use inline `resolve: dataloader(Context)` declarations;
  do not add pass-through resolver functions or block fields.
- Preserve source keys, authorization boundaries, values, errors, timestamps,
  and query budgets.
- Do not create a generic repository architecture framework.

## Task 1: Characterize The Policy Gap

- [ ] Prove the existing source scan can miss a KV source placed outside the
  current GraphQL/schema folders.
- [ ] Inventory the runtime source structs returned by `Loader.new/1` and the
  ordinary inline Dataloader association fields.

## Task 2: Enforce Ecto-Only Loading

- [ ] Scan every first-party `lib/**/*.ex` file for `Dataloader.KV`.
- [ ] Assert every source registered by `Loader.new/1` is a
  `Dataloader.Ecto` source.
- [ ] Assert the ordinary association fields keep their inline Dataloader
  shorthand and no schema-owned pass-through resolver is introduced.
- [ ] Keep failure output actionable by reporting exact source paths, keys, or
  field declarations.

## Task 3: Verify And Commit

- [ ] Run the focused architecture and batching suites.
- [ ] Run the full GraphQL suite, backend tests, typecheck, quality, queue
  validation, formatting, and diff hygiene.
- [ ] Record exact evidence in
  `docs/work/ecto-dataloader-policy-guard.md`.
- [ ] Commit with `test: enforce ecto dataloader policy`.

Exit condition: first-party KV Dataloader use fails at source and loader-runtime
boundaries, ordinary association fields remain direct inline Dataloader
declarations, existing query budgets and behavior stay green, and all backend
gates pass.

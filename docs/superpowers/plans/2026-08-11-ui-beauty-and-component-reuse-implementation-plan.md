# UI Beauty And Component Reuse Implementation Plan

**Goal:** Complete a cross-route visual refinement that improves mobile space,
decision hierarchy, and local `shadcn-cssinjs` reuse without losing facts.

## Task 1: Lock the responsive contracts

- Add browser assertions for a compact resting mobile header.
- Require mobile offer refinement before the result list through a labeled
  dialog using the complete existing form.
- Reverse the home-ledger assertion that currently requires price context and
  freshness to be hidden.
- Require ordinary offer prices not to share the best-price green treatment.
- Run the focused suites and confirm the new assertions fail for the intended
  missing behavior.

## Task 2: Refine navigation and offer discovery

- Compose a one-row mobile header with Search products and one Menu popover;
  preserve comparison, exploration, and guest/account/operator destinations.
- Reuse the local Dialog to expose offer filters before results on mobile while
  retaining the desktop ContextRail.
- Initialize advanced offer filters open when an advanced URL filter is active.
- Compose price overview and merchant narrowing into one decision header.
- Demote repeated offer context and use green only for the best visible offer.

## Task 3: Preserve mobile decision evidence and reuse primitives

- Keep product price signal and freshness visible on mobile and reserve the
  existing disclosure for secondary detail.
- Tighten mobile PageShell rhythm and routine metadata typography.
- Replace duplicated authentication feedback markup with FeedbackState.
- Use the existing Label primitive for visible offer form fields while
  preserving checkbox whole-label behavior.

## Task 4: Verify and commit

- Run focused route, shared UI, and E2E tests.
- Inspect changed screenshots at original resolution and iterate on visual
  defects.
- Run `pnpm run check`, `mix work_queue.validate`, and `git diff --check`.
- Review the diff for information loss, raw behavior controls, unnecessary
  wrappers, responsive overflow, and unrelated churn; commit the completed
  implementation.

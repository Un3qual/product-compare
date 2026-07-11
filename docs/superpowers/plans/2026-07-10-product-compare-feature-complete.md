# Product Compare Feature-Complete Implementation Record

**Status:** complete

**Design:**
`docs/superpowers/specs/2026-07-10-product-compare-feature-complete-scope-design.md`

## Outcome

The approved shopper milestone is complete on the current React, Relay, and
GraphQL contracts. Revenue is positioned as an authenticated preview, and the
CJ readiness gate can require effective recurring-scheduler configuration
without starting the application or exposing secrets.

## Explicit Exclusions

- Production email delivery.
- Live conversion-provider ingestion.
- Production privacy, consent, retention, and attribution governance.
- Production-readiness proof.
- eBay fallback, ingestion dashboards, Tier-3 scraping, automated merchant
  applications, account-manager automation, credential persistence, and CSV
  export.

## Completed Milestones

- [x] Dispatch revenue-preview and CJ scheduled-readiness work.
  Commit: `d6be201 docs: dispatch feature-complete follow-ups`.
- [x] Replace technical root copy with a shopper journey.
  Commit: `65409bf feat: focus home on shopper journey`.
- [x] Make public and account navigation viewer-aware.
  Commit: `eb303a0 feat: make navigation viewer aware`.
- [x] Add a safe relative loaded-price signal.
  Commit: `77b088e feat: add relative comparison price signal`.
- [x] Render ordered saved-product names while preserving slug reopen order.
  Commit: `e988a7c feat: label saved comparison products`.
- [x] Position revenue reporting as a recorded-data preview.
  Commit: `def22dc feat: position revenue reporting as preview`.
- [x] Report and optionally require effective CJ scheduler readiness.
  Commit: `77ecd8e feat: gate recurring CJ ingestion readiness`.
- [x] Reconcile architecture, plan catalog, live queue, and verification
  evidence.
  Commit: `2b2a071 docs: record feature-complete product milestone`.

## Final Verification Contract

Frontend:

```sh
cd assets
bun run relay
bun run test:unit
bun run typecheck
bun run build
```

Backend and repository:

```sh
mix test
mix typecheck
mix format --check-formatted
mix work_queue.validate
git diff --check
```

The completion evidence and current optional follow-ups live in
`docs/work/index.md`; lane-specific evidence remains in the affected
`docs/work/*.md` files.

# Auth Token Delivery Transport Deferral (2026-03-17)

## Decision Summary

- Production reset-password and email-verification delivery remains explicitly deferred.
- `ProductCompare.Accounts` keeps the current hook-based delivery seam for tests and future transport wiring.
- Browser auth stays GraphQL-only, and auth mutations continue to avoid returning raw reset or verification tokens.

## Why This Decision Exists

- `mix.exs` does not include a production mailer or notification transport dependency.
- `ProductCompare.Accounts` and `ProductCompare.Accounts.UserAuth` already encapsulate token issuance behind configurable delivery hooks.
- Choosing a vendor or delivery stack in this batch would force product and operations decisions that are not recorded elsewhere in the repo yet.

## Consequences

- Production environments are not ready to send live reset-password or verification instructions yet.
- Local and test flows keep using configured hook functions to capture issued tokens deterministically.
- Future transport work must reopen active execution docs and cover:
  - runtime configuration and secrets,
  - a concrete sender/delivery module,
  - verification that GraphQL auth flows still avoid exposing raw token material.

## Revisit Triggers

- A concrete outbound email or notification provider is selected.
- Deployment has the required sender domain, credentials, and operational ownership.
- Product scope requires live verification or reset delivery before the next milestone.

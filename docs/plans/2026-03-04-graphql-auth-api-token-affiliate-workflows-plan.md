# GraphQL/Auth (API Tokens) + Affiliate Workflows Plan

## Scope

- Build first GraphQL surface with bearer API token auth.
- Add secure API token lifecycle in `Accounts`.
- Raise confidence in `Affiliate` workflows through dedicated coverage.

## Checklist

### A) API Token Domain (Accounts)

- [x] Add DB migration for `api_tokens` with hashed token storage and active-token indexes.
- [x] Add `ProductCompareSchemas.Accounts.ApiToken` schema and constraints.
- [x] Add `Accounts` API-token lifecycle functions (`create`, `authenticate`, `list`, `revoke`).
- [x] Add account-level token lifecycle tests (red-green, including revoked/expired paths).

### B) GraphQL/Auth Surface

- [x] Add GraphQL dependencies and `/api/graphql` route.
- [x] Add auth/context plugs to resolve bearer token to `current_user`.
- [x] Add GraphQL schema for `viewer` + API-token operations.
- [x] Add GraphQL endpoint tests covering unauthorized and authorized flows.

### C) Affiliate Workflow Confidence

- [x] Add dedicated affiliate workflow tests for network/program/link upserts and active-coupon queries.
- [x] Patch affiliate code only if tests expose behavior defects.

### D) Verification

- [x] `mix test`
- [x] `mix precommit`

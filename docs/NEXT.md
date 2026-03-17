# Next Work Queue

## How To Use This File

- This file is the source of truth for selecting the next meaningful batch of work.
- Start here before reading any other plan doc.
- Read only the source docs referenced by the chosen task unless this file is missing, stale, or contradictory.
- Verify the chosen task against the codebase before implementation, but do not re-audit every historical plan by default.
- Update this file and the referenced plan/design docs in the same milestone commit as the related code and tests.

## Active Initiative

### GraphQL Browser Auth Migration

Primary source docs:

- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`

Audited state as of 2026-03-17:

- GraphQL browser auth mutations exist and legacy browser auth REST routes are removed.
- Frontend auth routes and GraphQL action helpers already exist under `assets/src/routes/auth`.
- Route/unit coverage exists for frontend auth flows.
- Remaining work is limited to production token delivery integration and browser-level end-to-end coverage.

## Default Next Batch

- `AUTH-E2E-1` unless the environment is missing browser-test prerequisites.

## Runnable Queue

- [ ] `AUTH-E2E-1` Expand browser-level auth end-to-end coverage for `forgotPassword`, `resetPassword`, and `verifyEmail`.
  Source: `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
  Depends on: existing frontend auth routes plus the shipped GraphQL auth backend.
  Verify status with: `find assets/tests -type f | sort` and `rg -n "forgot-password|reset-password|verify-email" assets/src/routes assets/tests`
  Done when: browser-level coverage exists for auth recovery and verification happy paths, and the auth plan/design docs are updated to reflect it.
  Expected touch paths: `assets/tests/e2e`, `assets/playwright.config.ts`, and auth route support files only if testability gaps appear.

## Blocked Or Needs Product Choice

- [ ] `AUTH-DELIVERY-1` Integrate reset and verification token delivery with a real production transport.
  Source: `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
  Blocker: the repo currently exposes delivery hooks but does not document or configure a production mailer/notification transport.
  Verify status with: `rg -n "mailer|notification|deliver_user_(confirmation|reset_password)_instructions|Swoosh|Bamboo" lib config test`
  Before implementation: decide the transport mechanism and runtime configuration contract.
  Done when: reset and verification instructions are delivered through a real transport without exposing raw tokens, and the auth plan/design docs are updated.

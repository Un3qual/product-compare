# GraphQL Auth Migration Design

## Goal

Move all frontend-facing browser auth flows to GraphQL while keeping Phoenix as the source of truth for cookie-backed sessions.

## Status

- [x] Contract confirmed: browser auth must be GraphQL-only.
- [x] Session model confirmed: cookie-backed Phoenix session, not token-returning auth.
- [x] Initial migration scope confirmed: `login`, `register`, `logout` in this PR.
- [x] This PR implemented and verified.
- [x] Backend GraphQL mutation surface added for `forgotPassword`, `resetPassword`, and `verifyEmail`.
- [x] Legacy REST auth surface fully removed.
- [ ] Auth email delivery integrated for reset and verification instructions.
- [ ] Frontend Relay auth mutations shipped end-to-end.

## Problem

The current branch introduced browser auth writes through REST endpoints under `/api/auth/*` while the frontend architecture is Relay-first and should talk to Phoenix through GraphQL. That split creates two public contracts for the same auth behavior and invites future work to keep drifting back to REST.

## Locked Decisions

- Browser auth flows use GraphQL mutations and queries.
- Phoenix remains the session authority.
- Browser auth continues to use cookie-backed sessions.
- `viewer` remains the canonical current-user query.
- GraphQL auth failures use typed payload errors, not top-level GraphQL execution errors.
- `logout` remains idempotent.

## Target Contract

### Frontend Contract

- `viewer` returns the authenticated user or `null`.
- `login(email, password)` authenticates credentials, renews the Phoenix session, and returns a typed payload.
- `register(email, password)` creates the account, renews the Phoenix session, and returns a typed payload.
- `logout` deletes the current session token when present, drops the Phoenix session cookie, and returns a typed payload.

### Payload Rules

- `login` and `register` return `viewer` plus `errors[]`.
- `logout` returns `ok` plus `errors[]`.
- Validation failures use `INVALID_ARGUMENT`.
- Credential failures use `INVALID_CREDENTIALS`.
- Cross-origin session-writing attempts use `INVALID_ORIGIN`.

## Architecture

### Session Write Bridge

Absinthe resolvers cannot rely on controller-style `put_session/3` mutations directly as the public integration model. The GraphQL endpoint should remain the frontend surface, so session writes must be applied at the GraphQL request boundary.

Recommended approach:

- Keep `/api/graphql` on Phoenix.
- Add a small GraphQL session bridge that stores requested session mutations during resolver execution.
- Register a `before_send` hook in the GraphQL pipeline to apply those queued mutations onto the real Phoenix `conn`.
- Support two operations only:
  - renew session and set `:user_token`
  - drop session

This keeps the behavior explicit, testable, and isolated to GraphQL auth mutations.

### Token Delivery Hook

The repo does not yet have a mailer. For reset and verification flows, the Accounts
layer should own token issuance and expose a small delivery hook so GraphQL can
remain the browser contract without hard-coding a transport. Tests can capture
issued tokens through that hook; production mail delivery can be wired later.

### Same-Origin Rules

- Cookie-backed session reads already stay same-origin only for browser-origin requests.
- The new GraphQL `login`, `register`, and `logout` mutations must explicitly reject untrusted origins before writing or clearing a browser session.
- Bearer-token GraphQL clients remain supported for non-browser API use cases.

## Migration Phases

### Phase 1: This PR

- Add GraphQL `login`, `register`, and `logout`.
- Add GraphQL regression tests for successful auth, validation failures, invalid credentials, logout, and invalid origin handling.
- Remove frontend-facing REST routes for `login`, `register`, and `logout`.
- Keep `forgotPassword`, `resetPassword`, and `verifyEmail` as temporary follow-up work.

### Phase 2: Remaining Browser Auth Flows

- Add GraphQL `forgotPassword`, `resetPassword`, and `verifyEmail`.
- Keep reset and verification token issuance transport-agnostic until a mailer lands.
- Add frontend Relay mutations for all auth workflows.
- Remove remaining auth REST endpoints once GraphQL replacements exist.

### Phase 3: Final Cleanup

- Remove stale REST controller code.
- Remove stale docs that still describe REST browser auth.
- Add end-to-end coverage for the final GraphQL-only browser auth path.

## Future-Agent Guardrails

- Do not reintroduce browser auth REST endpoints.
- Do not route the Bun frontend through `/api/auth/*`.
- If auth behavior changes, update the schema contract, GraphQL tests, and the migration plan together.
- Prefer extending typed GraphQL payloads over adding new JSON controller responses.

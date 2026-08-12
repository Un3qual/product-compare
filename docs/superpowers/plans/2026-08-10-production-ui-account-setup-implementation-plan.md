# Production UI Account And Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign authentication, API-token management, and affiliate setup so consequences, recovery, one-time values, ownership, and destructive actions are immediately clear.

**Architecture:** Preserve every existing Relay mutation, Phoenix session side effect, viewer-store update, loader authorization boundary, cursor, and row-scoped action policy. Use the stable production spine through route-owned authentication, token, and setup compositions; keep forms narrow and consequence-led without adding a second form framework. Treat account and setup as one outcome because all surfaces handle identity, sensitive values, mutation recovery, and owner/operator actions.

**Tech Stack:** React 19, React Router 7, Relay 20, StyleX, Radix, Vitest, Playwright, axe-core.

## Global Constraints

- Requires the completed System Spine And Home plan and must not modify shared spine owners.
- Browser login, register, logout, forgot-password, reset-password, and verify-email remain GraphQL mutations over `/api/graphql`; Phoenix remains cookie-session authority.
- Preserve viewer-store updates only after successful session payloads and preserve the current viewer after unsuccessful logout.
- Preserve privacy-safe recovery copy, URL token normalization, single-use verification, stale-response protection, and generic transport/top-level errors.
- Preserve owner-only API tokens, all/active/revoked filters, cursor guards, create/rotate/revoke behavior, expiration presets, one-time secret handling, and independent row state.
- Preserve all affiliate network/program/link/coupon fields, merchant choice pagination/context, normalized optional inputs, saved-result facts, and typed errors.
- Keep sensitive values out of incidental live regions and screenshots; one-time token display must retain its warning gate.
- Use plain account/setup language and do not expose GraphQL fields, schema terms, raw ids, or internal vocabulary.
- Do not change backend or GraphQL contracts in this cohort.

---

## Owned Paths

- `assets/src/routes/auth/AuthFormShell.tsx`
- `assets/src/routes/auth/CredentialAuthForm.tsx`
- `assets/src/routes/auth/LoginRoute.tsx`
- `assets/src/routes/auth/LogoutRoute.tsx`
- `assets/src/routes/auth/RegisterRoute.tsx`
- `assets/src/routes/auth/ForgotPasswordRoute.tsx`
- `assets/src/routes/auth/ResetPasswordRoute.tsx`
- `assets/src/routes/auth/VerifyEmailRoute.tsx`
- `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- `assets/src/routes/account/api-tokens/ApiTokenControls.tsx`
- `assets/src/routes/account/api-tokens/ApiTokenList.tsx`
- `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- `assets/test/routes/auth/**`
- `assets/test/routes/account/api-tokens/**`
- `assets/test/routes/affiliate/setup/**`
- `assets/tests/e2e/auth.spec.ts`
- `assets/tests/e2e/production-ui-account-setup.spec.ts`
- `assets/tests/e2e/production-ui-account-setup.spec.ts-snapshots/**`
- `docs/work/production-ui-account-setup.md`

## Feature-Parity Ledger

| Surface | Behavior that must remain executable | Existing verification boundary |
| --- | --- | --- |
| Login/register/logout | typed field errors, generic failures, pending guards, session redirect, viewer update/clear only on success | auth session unit and browser tests |
| Forgot/reset/verify | privacy-safe request success, URL token validation, success/error/retry, stale response and strict-mode single use | recovery unit and browser tests |
| `/account/api-tokens` | auth; filters/paging; lifecycle facts; create expiry choices; warning-gated one-time secret; rotate/revoke policies; duplicate/concurrent row state | API-token loader/route/data tests |
| `/affiliate/setup` | merchant pages/selection; four forms; optional normalization; result summaries; payload/network/loading/unavailable states | affiliate setup route/data tests |

### Task 1: Lock Sensitive-Flow Presentation Parity

**Files:**

- Modify all owned unit tests and the existing auth browser test.
- Modify the lane doc.

- [ ] **Step 1: Add RED orientation and secrecy assertions**

  Assert every form has one visible consequence-led title, field errors remain associated with controls, generic failures disclose no transport details, disabled/pending controls retain accessible names, dialogs restore focus, one-time tokens never appear until warning acknowledgement, and no test snapshot stores a secret value.

- [ ] **Step 2: Pin every feature-ledger state**

  Add assertions equivalent to:

  ```tsx
  expect(screen.getByRole("main")).toHaveAccessibleName(/sign in|create account|reset password|api tokens|affiliate setup/i);
  expect(screen.queryByText(/graphql|mutation|viewer store|entropy id/i)).not.toBeInTheDocument();
  ```

- [ ] **Step 3: Run RED and record baseline**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/auth test/routes/account/api-tokens test/routes/affiliate/setup
  cd assets && pnpm exec playwright test tests/e2e/auth.spec.ts
  ```

- [ ] **Step 4: Commit characterization**

  ```bash
  git add assets/test/routes assets/tests/e2e/auth.spec.ts docs/work/production-ui-account-setup.md
  git commit -m "test: lock account setup UI parity"
  ```

### Task 2: Redesign Authentication And Recovery

**Files:**

- Modify all eight owned auth source files and auth tests.

**Interfaces:**

- Consumes: stable page, field, button, feedback, focus, and status primitives.
- Produces: compact auth/recovery workspaces without changing mutation variables or viewer-store effects.

- [ ] **Step 1: Add RED focus and response-order tests**

  Pin initial focus/orientation, field-error focus, pending duplicate protection, successful redirect, privacy-safe forgot success, missing reset/verify token, token change clearing stale state, stale response suppression, transient verify retry, and unsuccessful logout viewer retention.

- [ ] **Step 2: Implement account-oriented composition**

  Use one narrow form region, one clear submit action, direct recovery links, localized field errors, and concise success/error states. Avoid campaign language, decorative auth art, split-screen marketing, and hidden recovery routes.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/auth
  cd assets && pnpm exec playwright test tests/e2e/auth.spec.ts
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/auth assets/test/routes/auth assets/tests/e2e/auth.spec.ts docs/work/production-ui-account-setup.md
  git commit -m "feat: redesign account authentication"
  ```

### Task 3: Redesign API-Token Lifecycle Management

**Files:**

- Modify all four owned API-token source files and tests.

- [ ] **Step 1: Add RED lifecycle hierarchy tests**

  Assert all/active/revoked navigation, expired status display, first/next links, label/prefix/created/expiry/last-use facts, every expiry choice, create payload errors, one-time reveal warning, rotation replacement defaults, expired action policy, confirmed revoke, independent overlapping row states, and unauthorized/empty/network states.

- [ ] **Step 2: Implement token workspace**

  Put creation and one-time result before the token ledger, style token prefixes/timestamps as mono data, keep rotate controls attached to their token, and make revoke consequences explicit. Do not render a secret in markup before the acknowledgement state.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/account/api-tokens
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/account/api-tokens assets/test/routes/account/api-tokens docs/work/production-ui-account-setup.md
  git commit -m "feat: redesign API token management"
  ```

### Task 4: Redesign Affiliate Setup

**Files:**

- Modify both owned affiliate setup source files and tests.

- [ ] **Step 1: Add RED form and result tests**

  Pin merchant selection/pagination, selected context in program/link/coupon forms, network/program/link/coupon variables, all optional normalization, datetime controls, percent/amount/other coupon result copy, saved identifiers/facts, independent typed errors, loader error, missing payload, and recovery.

- [ ] **Step 2: Implement a progressive setup workspace**

  Present the four operations in dependency order with clear section headings and compact saved-result summaries. Keep each form and feedback state independent; do not merge them into a configurable form renderer or dashboard cards.

- [ ] **Step 3: Run GREEN**

  ```bash
  cd assets && pnpm run test:unit -- test/routes/affiliate/setup
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/src/routes/affiliate/setup assets/test/routes/affiliate/setup docs/work/production-ui-account-setup.md
  git commit -m "feat: redesign affiliate setup"
  ```

### Task 5: Verify And Close Account And Setup

**Files:**

- Create the owned Playwright spec and snapshots.
- Modify the lane doc.

- [ ] **Step 1: Add deterministic browser journeys**

  Extend auth coverage with token create/reveal/rotate/revoke and affiliate network/program/link/coupon workflows. Cover keyboard-only interaction, dialog focus restoration, axe scans, reduced motion, responsive form/action retention, secret-redaction guards, and no overflow at all approved widths.

- [ ] **Step 2: Generate, inspect, and rerun snapshots**

  ```bash
  cd assets && pnpm exec playwright test tests/e2e/auth.spec.ts tests/e2e/production-ui-account-setup.spec.ts --update-snapshots
  cd assets && pnpm exec playwright test tests/e2e/auth.spec.ts tests/e2e/production-ui-account-setup.spec.ts
  ```

- [ ] **Step 3: Run complete gates and close the ledger**

  ```bash
  cd assets && pnpm run check
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add assets/tests/e2e docs/work/production-ui-account-setup.md
  git commit -m "test: verify account setup production UI"
  ```

## Blocker And Fallback Rules

- Stop if any UI change requires a REST auth endpoint, bearer/session token response, or altered Phoenix session authority.
- Stop if a shared system-spine owner must change or a backend/GraphQL field is missing; record the exact contract gap.
- Never put one-time API-token secrets into screenshots, logs, persistent browser state, or general live regions.
- Never collapse typed errors, owner authorization, expiry policy, destructive confirmation, or selected-merchant context for visual simplicity.

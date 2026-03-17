# ProductCompare Frontend Full-Stack Design (V1)

> Auth contract update (2026-03-16): browser auth flows must use GraphQL mutations on `/api/graphql`, not REST endpoints under `/api/auth/*`.

## Goal

Deliver a production-ready web app with React + Vite + React Router v7 SSR on Bun, using StyleX + Radix UI and Relay, integrated with the existing Phoenix backend, with email/password auth in V1 and OAuth deferred to V2.

## Locked Decisions

- Framework: React + Vite + React Router v7.
- Styling: StyleX.
- Component primitives: Radix UI.
- SSR runtime: Bun only.
- App location: new `assets/` folder (greenfield; no existing app to migrate).
- SSR topology: separate Bun service, not embedded in Phoenix.
- Data client: Relay.
- API flow: direct API pattern (SSR and browser both call Phoenix API).
- Scope: full-stack plan (frontend plus backend work needed to support frontend).
- Auth V1: email/password now, OAuth in V2.
- Saved comparisons: private only in V1; public share links in V2.
- Deployment now: single VM.
- Domain strategy: `app.example.com` (Bun) and `api.example.com` (Phoenix).
- Session authority: Phoenix.
- Responsive support: mobile/tablet/desktop in V1.
- NFRs: explicit frontend targets; backend owns GraphQL latency SLOs.

## Architecture Overview

### Runtime Topology

- Bun service at `app.example.com` serves SSR HTML, static assets, and hydration runtime.
- Phoenix service at `api.example.com` serves GraphQL, including browser auth/session mutations.
- Reverse proxy routes hostnames to each service on a single VM.

### Request Flow

- Initial page request: Browser -> Bun SSR.
- SSR data requests during render: Bun -> Phoenix GraphQL using forwarded request context.
- Post-hydration data requests: Browser -> Phoenix GraphQL via Relay network layer.
- Authentication state is validated by Phoenix session cookies on both SSR and browser API calls.

### Why This Topology

- Keeps frontend SSR concerns in Bun while preserving Phoenix as auth/session authority.
- Avoids BFF proxy complexity while still enabling SSR.
- Matches current backend ownership boundaries and future service separation plans.

## V1 Product Scope

### In-Scope User Journeys

- Sign up, verify email, login, logout, forgot/reset password.
- Browse taxonomy and filter products by typed attributes.
- Product detail with specs, price snapshot/history, and active coupons.
- Compare up to three products side-by-side with normalized values.
- Save comparison sets for authenticated users and revisit later.

### Out of Scope (V2+)

- OAuth login providers.
- Public share links for saved comparisons.
- User-generated reviews/posts frontend surfaces.

## Frontend Technical Design

### App Structure

- `assets/` contains the full Bun + Vite + React Router project.
- TypeScript strict mode required.
- Route modules organized by user journey: auth, browse, product detail, compare, saved sets.
- SSR entry and browser entry separated with shared route manifests and Relay environment setup.

### UI and Theming

- StyleX as the default styling system.
- Radix primitives wrapped in project components to enforce consistent theming and accessibility.
- Design tokens represented as CSS variables with typed token access in StyleX theme modules.
- Theming model supports at least one primary theme in V1 with architecture ready for multi-theme expansion.

### Data Layer (Relay)

- Relay compiler and generated artifact workflow included in local dev and CI.
- Route-level preloaded queries for SSR and hydration parity.
- Fragment colocation by component for strict data ownership.
- Connection pagination for product listings and expandable data surfaces.
- Mutation patterns for auth-adjacent flows and saved comparison workflows.

### Query Efficiency Rules

- Every route defines minimal query shape and fragments only for visible UI.
- Avoid duplicate entity fetches by using fragment references and Relay store reuse.
- Use pagination and windowed rendering for large catalog lists.
- Avoid N+1 patterns by aligning frontend query shapes to backend dataloader-friendly fields.

## Backend Changes Required for V1

### Auth and Session

- Add email/password account flows suitable for browser-based sessions.
- Add verification and password reset flows.
- Configure session cookies for subdomain operation (`app.example.com` and `api.example.com`) with secure flags and CSRF protections.
- Keep Phoenix as session source of truth for SSR and browser calls.

### GraphQL for Relay Compatibility

- Ensure schema supports robust Relay client expectations.
- Validate node/global ID behavior and connection consistency across catalog and comparison surfaces.
- Add missing query/mutation fields required for V1 routes.
- Add backend tests for auth/session GraphQL behavior under browser session semantics.

### Domain Endpoints for V1 Journeys

- Taxonomy browse and filter query surfaces.
- Product detail, current specs, and pricing/coupon surfaces.
- Saved comparison set CRUD for authenticated users.

## Milestone Plan

### M0: Foundation and Tooling

- Create `assets/` app with Bun + Vite + React Router SSR and TypeScript.
- Integrate StyleX build pipeline and Radix dependency baseline.
- Integrate Relay compiler pipeline and artifact output conventions.
- Exit criteria: app SSR bootstraps in dev; build passes; generated Relay artifacts committed or reproducibly generated.

### M1: Auth Platform (Backend + Frontend Shell)

- Implement email/password, verify, reset flows in Phoenix.
- Implement auth route shells and form flows in frontend.
- Add session/cookie integration across subdomains in dev and prod configs.
- Exit criteria: end-to-end signup/login/logout/reset works in local environment.

### M2: Catalog Browse

- Build taxonomy navigation and filter UI.
- Implement Relay queries/fragments with paginated product results.
- Add responsive list/grid behaviors for mobile through desktop.
- Exit criteria: users can browse and filter with SSR first paint and correct hydration.

### M3: Product Detail

- Implement product detail route with typed attribute presentation.
- Add price history visualization baseline and active coupon display.
- Align query shape for efficient partial updates and route transitions.
- Exit criteria: detail page meets accessibility and responsive criteria.

### M4: Product Comparison

- Implement compare tray and compare page (max three products).
- Normalize and align attributes across compared products.
- Persist compare state in URL and authenticated saved set workflows.
- Exit criteria: compare flow works from browse and detail pages end-to-end.

### M5: Saved Comparisons

- Backend persistence model and GraphQL surface for saved comparison sets.
- Frontend listing and reopen/delete flows for saved sets.
- Private-only access model enforced by session auth.
- Exit criteria: authenticated user can save, list, open, and delete comparison sets.

### M6: Quality Hardening

- Introduce route-level error boundaries and fallback UX.
- Perform an accessibility pass on auth, browse, detail, compare, saved pages.
- Expand test coverage for critical user flows and key edge cases.
- Exit criteria: quality gates pass and release checklist is green.

### M7: Production Readiness

- Configure single-VM deployment for Bun and Phoenix services.
- Configure reverse proxy, TLS, cache headers, and observability baselines.
- Add runbooks for restarts, log inspection, and incident triage.
- Exit criteria: staging dry-run succeeds; production rollout checklist approved.

## Non-Functional Targets (V1)

- LCP target on key product pages: <= 2.5s in production-like conditions.
- Accessibility target: WCAG 2.2 AA on key routes.
- Testing target: strong automated coverage of critical flows (auth, browse, compare, saved sets).
- Query efficiency target: no intentionally over-fetching route queries; paginated lists for catalog-scale datasets.
- Backend latency ownership remains with backend team, but frontend must keep query shapes efficient.

## Testing Strategy

- Unit tests for utility logic and rendering-critical component behavior.
- Integration tests for route/data interactions with mocked and real GraphQL boundaries where appropriate.
- End-to-end tests for auth, browsing, comparison, and saved-set workflows.
- SSR/hydration parity tests to catch server/client mismatch issues.
- Accessibility automated checks on key routes plus manual keyboard/screen-reader spot checks.

## Main Risks and Mitigations

- Bun-only SSR ecosystem mismatch with some Node-first tooling.
- Mitigation: select Bun-compatible dependencies first and run Bun-based CI verification from day one.

- Relay integration complexity with evolving GraphQL schema.
- Mitigation: define route data contracts early and add schema contract tests before large UI build-out.

- Cross-subdomain session/cookie and CSRF misconfiguration.
- Mitigation: establish dev/prod cookie policy matrix early and validate in integration tests.

- StyleX + Radix integration inconsistencies across primitives.
- Mitigation: build a thin shared component layer over Radix before page-level UI expansion.

## Phase 2 Preview (Not in V1)

- OAuth provider login flows.
- Public share links for comparison sets.
- Expanded social/discussion UX.
- Optional infra split from single VM into separate deploy units.

# Frontend React Router Framework Mode

Status: complete
Owner: `codex/react-router-8-framework-mode`
Base: `codex/project-quality-remediation` at
`2a76b443f394f07c02fd286a0615093a5e030fde`

## Goal

Upgrade React Router 7.18.2 Data Mode to the exact React Router 8.3.1 Framework
Mode stack while simplifying the frontend's routing, SSR, metadata, build, and
route-type boundaries without changing Relay, GraphQL, auth, navigation, HTTP,
SEO, or user-facing failure behavior.

## Source Of Truth

- Design:
  `docs/superpowers/specs/2026-09-02-react-router-8-framework-mode-design.md`
- Plan:
  `docs/superpowers/plans/2026-09-02-react-router-8-framework-mode-implementation-plan.md`
- Live dispatcher: `docs/work/index.md`

## Target Outcome

- React Router packages are aligned at 8.3.1 and the required React runtime is
  19.2.7 under the pinned Node 24.18.1 toolchain.
- Framework route modules, generated types, entries, Vite integration, route
  discovery/code splitting, metadata, status/headers, and SSR replace the
  bespoke Data Mode equivalents.
- Relay normalized-cache hydration, route preloading, GraphQL transport, and
  Phoenix cookie-backed browser auth keep their domain ownership.
- The old and new router stacks do not coexist, and frontend infrastructure has
  a measured net reduction.

## Internal Slices

1. Exact packages, route config, Vite plugin, scripts, and generated types.
2. Framework root, Relay contexts, client/server entries, document/head, and
   HTTP semantics.
3. Route loaders/client loaders/actions, auth/navigation, generated route
   types, and route-focused tests.
4. Leftover deletion, full verification, simplification measurement, and
   stacked PR publication.

## Verification

- Focused route, Relay, auth, SSR, SEO, navigation, status, redirect, and 404
  tests during implementation.
- Complete frontend Relay, typecheck/typegen, lint, format, Vitest, Framework
  build, StyleX, bundle, and relevant Playwright gates.
- `mix work_queue.validate`, `git diff --check`, and full `mix ci`.

## Exit Condition

All required contracts pass under the exact pinned toolchain, the final diff
contains one coherent Framework Mode architecture with documented retained
Relay/Phoenix boundaries, the simplification delta is recorded, and the
non-draft stacked PR targets `codex/project-quality-remediation`.

## Completion Evidence

- Exact runtime packages are `react-router`, `@react-router/dev`, and
  `@react-router/serve` 8.3.1. React and React DOM are 19.2.7 because that is
  React Router 8.3.1's declared peer minimum; Node 24.18.1 satisfies its Node
  22.22 minimum. The custom Relay server entry directly uses `isbot` 5.2.2 to
  match the framework's streaming policy. Vite 8.2.0, Relay 21.0.1, StyleX
  0.18.1, and Vitest 4.1.8 remain verified together.
- Framework route config, root/document ownership, entries, native metadata,
  actions, redirects/statuses, error boundaries, code splitting, and generated
  route types replaced the Data Mode router, custom static handler, Unhead
  pipeline, response aggregation, lazy wrapper, and manual route fixtures.
- No tracked source imports `react-router/internal`; only ignored output under
  `.react-router/types` does so. Auth remains credentialed GraphQL through
  `/api/graphql`, and Phoenix remains the cookie-backed session authority.
- Relay environment/hydration, route preload lifecycle, typed GraphQL failure
  normalization, StyleX/Relay Babel transforms, the Vite 8 optimizer inventory,
  and Phoenix API/session ownership remain custom for the concrete reasons in
  the design. Human responses stream after the shell while bots wait for all
  content. Only the revenue and CJ routes hydrate their client loaders because
  their optional deferred Relay queries can settle after the root record-source
  snapshot; fully awaited routes reuse their server data without a duplicate
  hydration request. The exact jsdom request test proved Framework Mode no
  longer reconstructs the incoming server request; foreign-realm signal
  bridging remains only in test request builders where jsdom still requires it.
- The focused routing/SSR/Relay suite passed 38 tests, the focused StyleX/home/
  offers/compare suite passed 15 tests, and Playwright passed 38 tests in one
  browser project. Production smoke checks returned 200 for `/`, 404 for an
  unknown route, and 302 with the expected location for the legacy ingestion
  redirect.
- The complete frontend gate passed 106 files and 1,434 tests. Relay validated
  88 reader, 60 normalization, and 89 operation-text artifacts. Vite built
  3,137 client modules and 317 server modules; the server artifact is
  1,183.98 kB raw/205.18 kB gzip. The client contract is 747,081 bytes raw and
  233,453 bytes gzip across 28 initial JavaScript and one CSS file, plus two
  initial fonts totaling 44,800 bytes.
- Full `mix ci` passed against a fresh repository-supported test partition:
  1,574 tests, zero failures, and 87.36% coverage, followed by the complete
  frontend gate above. The default shared test database had retained a table
  from a later unrelated branch; the clean partition contains exactly this
  branch's migrations.
- Relative to the approved base, frontend code/config excluding the generated
  lockfile has 1,974 additions and 4,433 deletions (net -2,459). The focused
  routing/SSR/head/config boundary has 294 additions and 949 deletions (net
  -655).

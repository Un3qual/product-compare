# Frontend React Router Framework Mode

Status: active
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

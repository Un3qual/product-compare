# Deterministic Tooling And Dependency Health Implementation Plan

## Goal

Make supported source, local setup, tests, toolchain pins, and dependency locks
deterministic and accurately covered by repository gates.

## Constraints

- Keep one strict TypeScript project for authored unit and E2E code.
- Keep one canonical development command owned by Phoenix.
- Replace timing guesses with controlled messages or bounded polling.
- Update dependencies only within compatible release lines.
- Do not add service-dependent Playwright execution to mix ci.

## Implementation

1. Include assets/tests/e2e in the strict TypeScript project and simplify
   authored fixtures until they typecheck without a relaxed configuration.
2. Make mix setup use the frozen pnpm lock and configure Phoenix's standard
   watcher contract to launch Vite.
3. Replace scheduler log races and database busy loops with deterministic test
   coordination and bounded diagnostics.
4. Compare exact mise, package-manager, Node, and pnpm pins across their real
   owners.
5. Refresh affected Hex and pnpm locks within accepted compatibility lines.

## Owned Areas

- .mise.toml, mix.exs, and development configuration
- Frontend package, TypeScript, and lock metadata
- Scheduler and database test helpers and their focused tests
- This plan and docs/work/deterministic-tooling-dependency-health.md

## Verification

- Frozen pnpm install
- Relay, typecheck, lint, formatting, unit, build, StyleX, and bundle gates
- Focused scheduler and concurrency tests
- mix hex.audit and pnpm audit --prod
- Isolated mix ci and the complete Playwright suite

Completion evidence and milestone commits live in the linked work-lane
document.

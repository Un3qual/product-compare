# Frontend Platform Modernization

## Snapshot

- Status: completed
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-approved-maintainability-modernization-implementation-plan.md`
- Last verified: 2026-07-30 through the pinned mise runtime and the full
  repository CI gate.

## Target Outcome

mise owns repository runtime versions, pnpm owns frontend dependencies, Vite
builds through Rolldown, Oxc supplies compatible fast static checks, StyleX
retains its Babel transform, and no active Bun or Nix dependency contract
remains.

## Baseline

- The frontend already uses Vite for development, client builds, SSR builds,
  and Vitest.
- StyleX is compiled through the project-local Babel-backed Vite plugin and
  remains in scope unchanged.
- `assets/package.json`, `assets/bun.lock`, `assets/bunfig.toml`, and the root
  Mix frontend gate currently execute Bun.
- Root `flake.nix` and `flake.lock` own a Nix shell while ambient installations
  supply tools outside it; there is no existing `.tool-versions` contract.
- Relay validation, TypeScript, 1,507 unit tests, client/SSR production builds,
  and the 200,000-byte gzip bundle budget are green before migration.

## Boundaries

- Keep StyleX and its Babel plugin.
- Keep Vite as the command and plugin interface.
- Use the supported Rolldown-backed Vite distribution, not a second build
  pipeline.
- Retain TypeScript semantic typechecking; Oxc supplements compatible static
  checks.
- Remove active Bun/Nix commands and metadata, but do not rewrite historical
  evidence solely to erase the words.

## Delivered

- `.mise.toml` pins Erlang 28.3, Elixir 1.19.4, Node 24.18.1, pnpm 11.18.0,
  and PostgreSQL 18; unrelated inherited Ruby tool versions are disabled.
- pnpm owns the dependency graph and lockfile; Bun and Nix metadata and active
  commands are removed.
- Vite 8 builds through Rolldown. The supported Rolldown Babel bridge preserves
  Relay and StyleX transforms.
- Oxlint checks application/config/script code, and Oxfmt checks the owned
  frontend configuration and scripts without rewriting the queued Relay route
  work.
- The bundle audit accepts Rolldown's anonymous shared lazy-loader chunks while
  still requiring them to be reachable only through the entry's dynamic import
  graph.

## Verification

- `CI=true mise exec -- pnpm --dir assets install --frozen-lockfile`: pass
- `mise exec -- mix test test/product_compare/toolchain_contract_test.exs`:
  2 tests, 0 failures
- `CI=true mise exec -- pnpm --dir assets run check`: Relay validation,
  TypeScript, Oxlint, Oxfmt, 1,507 tests, client/SSR builds, and bundle contract
  pass
- `CI=true mise exec -- mix ci`: 984 backend tests and 1,507 frontend tests,
  0 failures; Credo, Reach, Dialyzer, ExDNA 3/3, Relay, TypeScript, Oxc,
  client/SSR builds, and bundle contract pass
- `mise exec -- mix work_queue.validate`: 3 ready rows
- `git diff --check`: pass

## Blocker Rule

Stop and record a blocker if the supported Rolldown/Vite or Oxc versions cannot
run the existing Relay and StyleX transforms without changing product styling
or weakening TypeScript checks.
